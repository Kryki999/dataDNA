"use server";

import { and, asc, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { activityLogs, reachMetrics } from "@/lib/db/schema";
import { getCurrentStreak } from "@/lib/actions/activities";
import { getCurrentOrganizationId } from "@/lib/tenant";
import type { ReachDay, ReachSummary } from "@/lib/types/reach";
import {
  getTodayDateKey,
  getWeekDateKeys,
} from "@/lib/timezone";

export type ReachInput = {
  coldCalls?: number;
  xImpressions?: number;
  metaClicks?: number;
  notes?: string;
};

async function upsertReachForToday(
  organizationId: string,
  input: ReachInput,
  mode: "set" | "add",
) {
  const dateKey = getTodayDateKey();
  const existing = await db
    .select()
    .from(reachMetrics)
    .where(
      and(
        eq(reachMetrics.organizationId, organizationId),
        eq(reachMetrics.dateKey, dateKey),
      ),
    )
    .limit(1);

  const current = existing[0];
  const coldCalls =
    mode === "add"
      ? (current?.coldCalls ?? 0) + (input.coldCalls ?? 0)
      : (input.coldCalls ?? current?.coldCalls ?? 0);
  const xImpressions =
    mode === "add"
      ? (current?.xImpressions ?? 0) + (input.xImpressions ?? 0)
      : (input.xImpressions ?? current?.xImpressions ?? 0);
  const metaClicks =
    mode === "add"
      ? (current?.metaClicks ?? 0) + (input.metaClicks ?? 0)
      : (input.metaClicks ?? current?.metaClicks ?? 0);

  if (current) {
    await db
      .update(reachMetrics)
      .set({
        coldCalls,
        xImpressions,
        metaClicks,
        notes: input.notes ?? current.notes,
        updatedAt: new Date(),
      })
      .where(eq(reachMetrics.id, current.id));
  } else {
    await db.insert(reachMetrics).values({
      organizationId,
      dateKey,
      coldCalls,
      xImpressions,
      metaClicks,
      notes: input.notes,
    });
  }

  const now = new Date();
  const activityRows: Array<{
    type: "cold_call" | "x_impression" | "meta_click";
    count: number;
  }> = [];

  if (input.coldCalls && input.coldCalls > 0) {
    activityRows.push({ type: "cold_call", count: input.coldCalls });
  }
  if (input.xImpressions && input.xImpressions > 0) {
    activityRows.push({ type: "x_impression", count: input.xImpressions });
  }
  if (input.metaClicks && input.metaClicks > 0) {
    activityRows.push({ type: "meta_click", count: input.metaClicks });
  }

  for (const row of activityRows) {
    for (let i = 0; i < row.count; i += 1) {
      await db.insert(activityLogs).values({
        organizationId,
        type: row.type,
        source: "manual",
        occurredAt: now,
        metadata: { fromReachForm: true },
      });
    }
  }

  return { coldCalls, xImpressions, metaClicks };
}

export async function logQuickCall() {
  const organizationId = await getCurrentOrganizationId();
  const totals = await upsertReachForToday(
    organizationId,
    { coldCalls: 1 },
    "add",
  );
  revalidatePath("/");

  const streak = await getCurrentStreak();

  return {
    callsToday: totals.coldCalls,
    streak,
  };
}

export async function logReachMetrics(input: ReachInput) {
  const organizationId = await getCurrentOrganizationId();
  await upsertReachForToday(organizationId, input, "add");
  revalidatePath("/");
}

function toReachTotals(row: {
  coldCalls: number | string;
  xImpressions: number | string;
  metaClicks: number | string;
}) {
  const coldCalls = Number(row.coldCalls);
  const xImpressions = Number(row.xImpressions);
  const metaClicks = Number(row.metaClicks);
  return {
    coldCalls,
    xImpressions,
    metaClicks,
    total: coldCalls + xImpressions + metaClicks,
  };
}

export async function getReachSummary(): Promise<ReachSummary> {
  const organizationId = await getCurrentOrganizationId();
  const todayKey = getTodayDateKey();
  const weekKeys = getWeekDateKeys();

  const [todayRow] = await db
    .select()
    .from(reachMetrics)
    .where(
      and(
        eq(reachMetrics.organizationId, organizationId),
        eq(reachMetrics.dateKey, todayKey),
      ),
    )
    .limit(1);

  const [weekRow] = await db
    .select({
      coldCalls: sql<number>`coalesce(sum(${reachMetrics.coldCalls}), 0)`,
      xImpressions: sql<number>`coalesce(sum(${reachMetrics.xImpressions}), 0)`,
      metaClicks: sql<number>`coalesce(sum(${reachMetrics.metaClicks}), 0)`,
    })
    .from(reachMetrics)
    .where(
      and(
        eq(reachMetrics.organizationId, organizationId),
        gte(reachMetrics.dateKey, weekKeys[0]!),
      ),
    );

  const [allTimeRow] = await db
    .select({
      coldCalls: sql<number>`coalesce(sum(${reachMetrics.coldCalls}), 0)`,
      xImpressions: sql<number>`coalesce(sum(${reachMetrics.xImpressions}), 0)`,
      metaClicks: sql<number>`coalesce(sum(${reachMetrics.metaClicks}), 0)`,
    })
    .from(reachMetrics)
    .where(eq(reachMetrics.organizationId, organizationId));

  const week = weekRow ?? { coldCalls: 0, xImpressions: 0, metaClicks: 0 };
  const allTime = allTimeRow ?? {
    coldCalls: 0,
    xImpressions: 0,
    metaClicks: 0,
  };

  return {
    today: toReachTotals({
      coldCalls: todayRow?.coldCalls ?? 0,
      xImpressions: todayRow?.xImpressions ?? 0,
      metaClicks: todayRow?.metaClicks ?? 0,
    }),
    week: toReachTotals(week),
    allTime: toReachTotals(allTime),
  };
}

export async function getReachTimeSeries(): Promise<ReachDay[]> {
  const organizationId = await getCurrentOrganizationId();

  const rows = await db
    .select({
      dateKey: reachMetrics.dateKey,
      coldCalls: reachMetrics.coldCalls,
      xImpressions: reachMetrics.xImpressions,
      metaClicks: reachMetrics.metaClicks,
    })
    .from(reachMetrics)
    .where(eq(reachMetrics.organizationId, organizationId))
    .orderBy(asc(reachMetrics.dateKey));

  return rows.map((row) => ({
    date: row.dateKey,
    coldCalls: row.coldCalls,
    xImpressions: row.xImpressions,
    metaClicks: row.metaClicks,
    total: row.coldCalls + row.xImpressions + row.metaClicks,
  }));
}

export async function getWeeklyPhoneCount() {
  const summary = await getReachSummary();
  return summary.week.coldCalls;
}
