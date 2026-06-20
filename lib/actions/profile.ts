"use server";

import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  activityLogs,
  calendarEvents,
  leads,
  reachMetrics,
  users,
} from "@/lib/db/schema";
import { getHeatmapData } from "@/lib/actions/activities";
import { getReachSummary } from "@/lib/actions/reach";
import { getCurrentOrganizationId, getCurrentUserId } from "@/lib/tenant";
import { revalidateDashboard, revalidatePublicProfile } from "@/lib/revalidate";
import { sanitizeUsername, USERNAME_REGEX } from "@/lib/profile";
import { subDays } from "date-fns";
import { toWarsawDateKey } from "@/lib/timezone";

export type ProfileUpdateInput = {
  displayName?: string;
  bio?: string;
  avatarUrl?: string | null;
  username?: string;
  profilePublic?: boolean;
};

export type PublicProfileData = {
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  stats: {
    totalReach: number;
    coldCalls: number;
    currentStreak: number;
    longestStreak: number;
    activityCount: number;
  };
  heatmap: {
    days: Record<string, number>;
    streaks: { current: number; longest: number };
  };
  reachSeries: Array<{ date: string; reach: number }>;
  clientsSeries: Array<{ date: string; count: number }>;
  totalClients: number;
};

export type ActivityLogEntry = {
  id: string;
  type: string;
  label: string;
  occurredAt: Date;
  leadName: string | null;
};

const ACTIVITY_LABELS: Record<string, string> = {
  cold_call: "Cold call",
  x_impression: "X — zasięg",
  meta_click: "Meta Ads — klik",
  deal_closed: "Deal zamknięty",
  custom: "Aktywność",
};

async function getOrgActivityCount(organizationId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activityLogs)
    .where(eq(activityLogs.organizationId, organizationId));
  return Number(result?.count ?? 0);
}

export async function getProfile() {
  const organizationId = await getCurrentOrganizationId();
  const userId = await getCurrentUserId();

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      username: users.username,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      profilePublic: users.profilePublic,
    })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.organizationId, organizationId)))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  const [reach, heatmap, activityCount] = await Promise.all([
    getReachSummary(),
    getHeatmapData(),
    getOrgActivityCount(organizationId),
  ]);

  return {
    ...user,
    displayName: user.displayName ?? user.email.split("@")[0] ?? "User",
    username: user.username ?? sanitizeUsername(user.email.split("@")[0] ?? "user"),
    stats: {
      totalReach: reach.allTime.total,
      coldCalls: reach.allTime.coldCalls,
      currentStreak: heatmap.streaks.current,
      longestStreak: heatmap.streaks.longest,
      activityCount,
    },
    heatmap: { days: heatmap.days, streaks: heatmap.streaks },
    reachSeries: await getProfileReachSparkline(90),
    clientsSeries: await getProfileClientsSparkline(90),
    totalClients: await getOrgClientCount(organizationId),
  };
}

export async function updateProfile(input: ProfileUpdateInput) {
  const organizationId = await getCurrentOrganizationId();
  const userId = await getCurrentUserId();

  const [current] = await db
    .select({ username: users.username })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.organizationId, organizationId)))
    .limit(1);

  if (!current) {
    throw new Error("User not found");
  }

  if (input.username !== undefined) {
    const username = sanitizeUsername(input.username);
    if (!USERNAME_REGEX.test(username)) {
      throw new Error("Username must be 3-30 chars: a-z, 0-9, _, -");
    }
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    if (taken && taken.id !== userId) {
      throw new Error("Username already taken");
    }
  }

  const [updated] = await db
    .update(users)
    .set({
      ...(input.displayName !== undefined
        ? { displayName: input.displayName.trim() }
        : {}),
      ...(input.bio !== undefined ? { bio: input.bio.trim() } : {}),
      ...(input.avatarUrl !== undefined
        ? { avatarUrl: input.avatarUrl?.trim() || null }
        : {}),
      ...(input.username !== undefined
        ? { username: sanitizeUsername(input.username) }
        : {}),
      ...(input.profilePublic !== undefined
        ? { profilePublic: input.profilePublic }
        : {}),
    })
    .where(and(eq(users.id, userId), eq(users.organizationId, organizationId)))
    .returning({
      username: users.username,
    });

  revalidateDashboard();
  if (current.username) revalidatePublicProfile(current.username);
  if (updated?.username) revalidatePublicProfile(updated.username);

  return updated;
}

export async function getPublicProfile(
  username: string,
): Promise<PublicProfileData | null> {
  const normalized = sanitizeUsername(username);
  if (!USERNAME_REGEX.test(normalized)) return null;

  const [user] = await db
    .select({
      organizationId: users.organizationId,
      displayName: users.displayName,
      username: users.username,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      profilePublic: users.profilePublic,
      email: users.email,
    })
    .from(users)
    .where(eq(users.username, normalized))
    .limit(1);

  if (!user || !user.profilePublic || !user.username) return null;

  const organizationId = user.organizationId;
  const displayName = user.displayName ?? user.email.split("@")[0] ?? "User";

  const heatmapRows = await db
    .select({
      type: activityLogs.type,
      occurredAt: activityLogs.occurredAt,
      metadata: activityLogs.metadata,
    })
    .from(activityLogs)
    .where(eq(activityLogs.organizationId, organizationId));

  const dayCounts: Record<string, number> = {};
  const outreachDays = new Set<string>();
  for (const row of heatmapRows) {
    const key = toWarsawDateKey(row.occurredAt);
    const meta = row.metadata as { count?: number } | null;
    const increment = meta?.count && meta.count > 0 ? meta.count : 1;
    dayCounts[key] = (dayCounts[key] ?? 0) + increment;
    if (["cold_call", "x_impression", "meta_click"].includes(row.type)) {
      outreachDays.add(key);
    }
  }

  const { computeStreaks } = await import("@/lib/constants");
  const streaks = computeStreaks(outreachDays);

  const [reachRow] = await db
    .select({
      coldCalls: sql<number>`coalesce(sum(${reachMetrics.coldCalls}), 0)`,
      xImpressions: sql<number>`coalesce(sum(${reachMetrics.xImpressions}), 0)`,
      metaClicks: sql<number>`coalesce(sum(${reachMetrics.metaClicks}), 0)`,
    })
    .from(reachMetrics)
    .where(eq(reachMetrics.organizationId, organizationId));

  const coldCalls = Number(reachRow?.coldCalls ?? 0);
  const xImpressions = Number(reachRow?.xImpressions ?? 0);
  const metaClicks = Number(reachRow?.metaClicks ?? 0);

  const sparkline = await getOrgActivitySparkline(organizationId, 30);

  return {
    displayName,
    username: user.username,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    stats: {
      totalReach: coldCalls + xImpressions + metaClicks,
      coldCalls,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      activityCount: heatmapRows.length,
    },
    heatmap: { days: dayCounts, streaks },
    reachSeries: await getOrgReachSparkline(organizationId, 90),
    clientsSeries: await getOrgClientsSparkline(organizationId, 90),
    totalClients: await getOrgClientCount(organizationId),
  };
}

async function getOrgReachSparkline(organizationId: string, days: number) {
  const startKey = toWarsawDateKey(subDays(new Date(), days));
  const rows = await db
    .select({
      dateKey: reachMetrics.dateKey,
      coldCalls: reachMetrics.coldCalls,
      xImpressions: reachMetrics.xImpressions,
      metaClicks: reachMetrics.metaClicks,
    })
    .from(reachMetrics)
    .where(
      and(
        eq(reachMetrics.organizationId, organizationId),
        gte(reachMetrics.dateKey, startKey),
      ),
    );

  const reachByDay: Record<string, number> = {};
  for (const row of rows) {
    reachByDay[row.dateKey] =
      row.coldCalls + row.xImpressions + row.metaClicks;
  }

  const result: Array<{ date: string; reach: number }> = [];
  for (let i = days; i >= 0; i -= 1) {
    const key = toWarsawDateKey(subDays(new Date(), i));
    result.push({ date: key, reach: reachByDay[key] ?? 0 });
  }
  return result;
}

async function getOrgClientsSparkline(organizationId: string, days: number) {
  const start = subDays(new Date(), days);
  const rows = await db
    .select({ createdAt: leads.createdAt })
    .from(leads)
    .where(
      and(
        eq(leads.organizationId, organizationId),
        gte(leads.createdAt, start),
      ),
    );

  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = toWarsawDateKey(row.createdAt);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const result: Array<{ date: string; count: number }> = [];
  for (let i = days; i >= 0; i -= 1) {
    const key = toWarsawDateKey(subDays(new Date(), i));
    result.push({ date: key, count: counts[key] ?? 0 });
  }
  return result;
}

async function getOrgClientCount(organizationId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .where(eq(leads.organizationId, organizationId));
  return Number(result?.count ?? 0);
}

export async function getProfileReachSparkline(days = 90) {
  const organizationId = await getCurrentOrganizationId();
  return getOrgReachSparkline(organizationId, days);
}

export async function getProfileClientsSparkline(days = 90) {
  const organizationId = await getCurrentOrganizationId();
  return getOrgClientsSparkline(organizationId, days);
}

async function getOrgActivitySparkline(organizationId: string, days: number) {
  const start = subDays(new Date(), days);
  const rows = await db
    .select({
      occurredAt: activityLogs.occurredAt,
      metadata: activityLogs.metadata,
    })
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.organizationId, organizationId),
        gte(activityLogs.occurredAt, start),
      ),
    );

  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = toWarsawDateKey(row.occurredAt);
    const meta = row.metadata as { count?: number } | null;
    const increment = meta?.count && meta.count > 0 ? meta.count : 1;
    counts[key] = (counts[key] ?? 0) + increment;
  }

  const result: Array<{ date: string; count: number }> = [];
  for (let i = days; i >= 0; i -= 1) {
    const key = toWarsawDateKey(subDays(new Date(), i));
    result.push({ date: key, count: counts[key] ?? 0 });
  }
  return result;
}

export async function getProfileActivitySparkline(days = 30) {
  const organizationId = await getCurrentOrganizationId();
  return getOrgActivitySparkline(organizationId, days);
}

async function getOrgActivityLog(organizationId: string, limit: number) {
  const rows = await db
    .select({
      id: activityLogs.id,
      type: activityLogs.type,
      occurredAt: activityLogs.occurredAt,
      metadata: activityLogs.metadata,
      leadId: activityLogs.leadId,
    })
    .from(activityLogs)
    .where(eq(activityLogs.organizationId, organizationId))
    .orderBy(desc(activityLogs.occurredAt))
    .limit(limit);

  const leadIds = rows
    .map((r) => r.leadId)
    .filter((id): id is string => Boolean(id));

  const leadMap = new Map<string, string>();
  if (leadIds.length > 0) {
    const leadRows = await db
      .select({ id: leads.id, name: leads.name, company: leads.company })
      .from(leads)
      .where(eq(leads.organizationId, organizationId));
    for (const lead of leadRows) {
      if (leadIds.includes(lead.id)) {
        leadMap.set(lead.id, lead.company ?? lead.name);
      }
    }
  }

  return rows.map((row) => {
    const meta = row.metadata as { amountPln?: number; count?: number } | null;
    let label = ACTIVITY_LABELS[row.type] ?? row.type;
    if (row.type === "deal_closed" && meta?.amountPln) {
      label = `Deal zamknięty — ${meta.amountPln} PLN`;
    } else if (meta?.count && meta.count > 1) {
      label = `${label} +${meta.count}`;
    }
    return {
      id: row.id,
      type: row.type,
      label,
      occurredAt: row.occurredAt,
      leadName: row.leadId ? (leadMap.get(row.leadId) ?? null) : null,
    };
  });
}

export async function getActivityLog(limit = 30) {
  const organizationId = await getCurrentOrganizationId();
  return getOrgActivityLog(organizationId, limit);
}
