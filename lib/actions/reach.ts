"use server";

import { and, asc, eq, gte } from "drizzle-orm";
import { revalidateDashboard } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { activityLogs, reachDailyMetrics, reachMetrics } from "@/lib/db/schema";
import { getCurrentStreak } from "@/lib/actions/activities";
import { getCurrentOrganizationId } from "@/lib/tenant";
import type { ReachDay, ReachSummary } from "@/lib/types/reach";
import {
  aggregateRowsToTotals,
  buildAllChannelGroups,
  buildReachDaysFromRows,
  type RawMetricRow,
} from "@/lib/reach-metrics";
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

async function upsertDailyMetric(
  organizationId: string,
  dateKey: string,
  channel: RawMetricRow["channel"],
  trafficType: RawMetricRow["trafficType"],
  metric: RawMetricRow["metric"],
  value: number,
  mode: "set" | "add",
  source: "manual" | "integration" = "manual",
) {
  const existing = await db
    .select()
    .from(reachDailyMetrics)
    .where(
      and(
        eq(reachDailyMetrics.organizationId, organizationId),
        eq(reachDailyMetrics.dateKey, dateKey),
        eq(reachDailyMetrics.channel, channel),
        eq(reachDailyMetrics.trafficType, trafficType),
        eq(reachDailyMetrics.metric, metric),
      ),
    )
    .limit(1);

  const current = existing[0]?.value ?? 0;
  const nextValue = mode === "add" ? current + value : value;

  if (existing[0]) {
    await db
      .update(reachDailyMetrics)
      .set({
        value: nextValue,
        source,
        updatedAt: new Date(),
      })
      .where(eq(reachDailyMetrics.id, existing[0].id));
  } else {
    await db.insert(reachDailyMetrics).values({
      organizationId,
      dateKey,
      channel,
      trafficType,
      metric,
      value: nextValue,
      source,
    });
  }

  return nextValue;
}

async function syncLegacyReachMetrics(
  organizationId: string,
  dateKey: string,
  coldCalls: number,
  xImpressions: number,
  metaClicks: number,
  notes?: string,
) {
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

  if (existing[0]) {
    await db
      .update(reachMetrics)
      .set({
        coldCalls,
        xImpressions,
        metaClicks,
        notes: notes ?? existing[0].notes,
        updatedAt: new Date(),
      })
      .where(eq(reachMetrics.id, existing[0].id));
  } else {
    await db.insert(reachMetrics).values({
      organizationId,
      dateKey,
      coldCalls,
      xImpressions,
      metaClicks,
      notes,
    });
  }
}

async function fetchRawRows(organizationId: string): Promise<RawMetricRow[]> {
  const rows = await db
    .select({
      dateKey: reachDailyMetrics.dateKey,
      channel: reachDailyMetrics.channel,
      trafficType: reachDailyMetrics.trafficType,
      metric: reachDailyMetrics.metric,
      value: reachDailyMetrics.value,
    })
    .from(reachDailyMetrics)
    .where(eq(reachDailyMetrics.organizationId, organizationId))
    .orderBy(asc(reachDailyMetrics.dateKey));

  if (rows.length > 0) {
    return rows.map((r) => ({
      dateKey: r.dateKey,
      channel: r.channel,
      trafficType: r.trafficType,
      metric: r.metric,
      value: r.value,
    }));
  }

  const legacy = await db
    .select()
    .from(reachMetrics)
    .where(eq(reachMetrics.organizationId, organizationId))
    .orderBy(asc(reachMetrics.dateKey));

  return legacy.flatMap((row) => {
    const items: RawMetricRow[] = [];
    if (row.coldCalls > 0) {
      items.push({
        dateKey: row.dateKey,
        channel: "cold_calls",
        trafficType: "manual",
        metric: "clicks",
        value: row.coldCalls,
      });
    }
    if (row.xImpressions > 0) {
      items.push({
        dateKey: row.dateKey,
        channel: "x",
        trafficType: "organic",
        metric: "impressions",
        value: row.xImpressions,
      });
    }
    if (row.metaClicks > 0) {
      items.push({
        dateKey: row.dateKey,
        channel: "facebook",
        trafficType: "paid",
        metric: "clicks",
        value: row.metaClicks,
      });
    }
    return items;
  });
}

async function upsertReachForToday(
  organizationId: string,
  input: ReachInput,
  mode: "set" | "add",
) {
  const dateKey = getTodayDateKey();

  let coldCalls = 0;
  let xImpressions = 0;

  if (input.coldCalls !== undefined) {
    coldCalls = await upsertDailyMetric(
      organizationId,
      dateKey,
      "cold_calls",
      "manual",
      "clicks",
      input.coldCalls,
      mode,
    );
  } else {
    const rows = await fetchRawRows(organizationId);
    coldCalls =
      rows.find(
        (r) =>
          r.dateKey === dateKey &&
          r.channel === "cold_calls" &&
          r.metric === "clicks",
      )?.value ?? 0;
  }

  if (input.xImpressions !== undefined) {
    xImpressions = await upsertDailyMetric(
      organizationId,
      dateKey,
      "x",
      "organic",
      "impressions",
      input.xImpressions,
      mode,
    );
  } else {
    const rows = await fetchRawRows(organizationId);
    xImpressions =
      rows.find(
        (r) =>
          r.dateKey === dateKey &&
          r.channel === "x" &&
          r.metric === "impressions",
      )?.value ?? 0;
  }

  if (input.metaClicks !== undefined && input.metaClicks > 0) {
    await upsertDailyMetric(
      organizationId,
      dateKey,
      "facebook",
      "paid",
      "clicks",
      input.metaClicks,
      mode,
    );
  }

  const allRows = await fetchRawRows(organizationId);
  const todayRows = allRows.filter((r) => r.dateKey === dateKey);
  const metaClicks = todayRows
    .filter(
      (r) =>
        (r.channel === "facebook" || r.channel === "instagram") &&
        r.trafficType === "paid" &&
        r.metric === "clicks",
    )
    .reduce((s, r) => s + r.value, 0);

  await syncLegacyReachMetrics(
    organizationId,
    dateKey,
    coldCalls,
    xImpressions,
    metaClicks,
    input.notes,
  );

  const now = new Date();
  const activityEntries: Array<{
    type: "cold_call" | "x_impression" | "meta_click";
    count: number;
  }> = [];

  if (input.coldCalls && input.coldCalls > 0) {
    activityEntries.push({ type: "cold_call", count: input.coldCalls });
  }
  if (input.xImpressions && input.xImpressions > 0) {
    activityEntries.push({ type: "x_impression", count: input.xImpressions });
  }
  if (input.metaClicks && input.metaClicks > 0) {
    activityEntries.push({ type: "meta_click", count: input.metaClicks });
  }

  if (activityEntries.length > 0) {
    await db.insert(activityLogs).values(
      activityEntries.map(({ type, count }) => ({
        organizationId,
        type,
        source: "manual" as const,
        occurredAt: now,
        metadata: { fromReachForm: true, count, bulk: count > 1 },
      })),
    );
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
  revalidateDashboard();

  const streak = await getCurrentStreak();

  return {
    callsToday: totals.coldCalls,
    streak,
  };
}

export async function logReachMetrics(input: ReachInput) {
  const organizationId = await getCurrentOrganizationId();
  await upsertReachForToday(organizationId, input, "add");
  revalidateDashboard();
}

export async function getReachSummary(): Promise<ReachSummary> {
  const organizationId = await getCurrentOrganizationId();
  const todayKey = getTodayDateKey();
  const weekKeys = getWeekDateKeys();
  const weekStart = weekKeys[0]!;

  const allRows = await fetchRawRows(organizationId);
  const todayRows = allRows.filter((r) => r.dateKey === todayKey);
  const weekRows = allRows.filter((r) => r.dateKey >= weekStart);

  const channels = buildAllChannelGroups(
    allRows,
    todayKey,
    weekStart,
  );

  return {
    today: aggregateRowsToTotals(todayRows),
    week: aggregateRowsToTotals(weekRows),
    allTime: aggregateRowsToTotals(allRows),
    channels,
  };
}

export async function getReachTimeSeries(): Promise<ReachDay[]> {
  const organizationId = await getCurrentOrganizationId();
  const allRows = await fetchRawRows(organizationId);
  return buildReachDaysFromRows(allRows);
}

export async function getWeeklyPhoneCount() {
  const summary = await getReachSummary();
  return summary.week.coldCalls;
}

export async function backfillReachDailyMetrics(organizationId: string) {
  const legacy = await db
    .select()
    .from(reachMetrics)
    .where(eq(reachMetrics.organizationId, organizationId));

  for (const row of legacy) {
    if (row.coldCalls > 0) {
      await upsertDailyMetric(
        organizationId,
        row.dateKey,
        "cold_calls",
        "manual",
        "clicks",
        row.coldCalls,
        "set",
      );
    }
    if (row.xImpressions > 0) {
      await upsertDailyMetric(
        organizationId,
        row.dateKey,
        "x",
        "organic",
        "impressions",
        row.xImpressions,
        "set",
      );
    }
    if (row.metaClicks > 0) {
      await upsertDailyMetric(
        organizationId,
        row.dateKey,
        "facebook",
        "paid",
        "clicks",
        row.metaClicks,
        "set",
      );
    }
  }
}
