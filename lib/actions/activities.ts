"use server";

import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema";
import { getCurrentOrganizationId } from "@/lib/tenant";
import {
  computeStreaks,
  OUTREACH_ACTIVITY_TYPES,
} from "@/lib/constants";
import {
  getHeatmapDateKeys,
  toWarsawDateKey,
  warsawStartOfDay,
} from "@/lib/timezone";
import { subDays } from "date-fns";

export async function getHeatmapData() {
  const organizationId = await getCurrentOrganizationId();
  const start = warsawStartOfDay(
    toWarsawDateKey(subDays(new Date(), 365)),
  );

  const rows = await db
    .select({
      type: activityLogs.type,
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

  const dayCounts: Record<string, number> = {};
  const outreachDays = new Set<string>();

  for (const row of rows) {
    const key = toWarsawDateKey(row.occurredAt);
    const meta = row.metadata as { count?: number } | null;
    const increment = meta?.count && meta.count > 0 ? meta.count : 1;
    dayCounts[key] = (dayCounts[key] ?? 0) + increment;

    if (
      OUTREACH_ACTIVITY_TYPES.includes(
        row.type as (typeof OUTREACH_ACTIVITY_TYPES)[number],
      )
    ) {
      outreachDays.add(key);
    }
  }

  const heatmapKeys = getHeatmapDateKeys(52);
  const days: Record<string, number> = {};
  for (const key of heatmapKeys) {
    days[key] = dayCounts[key] ?? 0;
  }

  const streaks = computeStreaks(outreachDays);

  return { days, streaks, outreachDays: [...outreachDays] };
}

export async function getCurrentStreak() {
  const data = await getHeatmapData();
  return data.streaks.current;
}
