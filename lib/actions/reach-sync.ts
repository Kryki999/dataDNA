"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLogs, reachDailyMetrics } from "@/lib/db/schema";
import type {
  ReachChannelId,
  ReachMetricKind,
  ReachTrafficType,
} from "@/lib/types/reach";
import { revalidateDashboard } from "@/lib/revalidate";

export type ReachMetricInput = {
  channel: ReachChannelId;
  trafficType: ReachTrafficType;
  metric: ReachMetricKind;
  value: number;
};

export async function upsertReachMetric(
  organizationId: string,
  dateKey: string,
  input: ReachMetricInput,
  mode: "set" | "add" = "set",
  source: "manual" | "integration" = "integration",
) {
  const existing = await db
    .select()
    .from(reachDailyMetrics)
    .where(
      and(
        eq(reachDailyMetrics.organizationId, organizationId),
        eq(reachDailyMetrics.dateKey, dateKey),
        eq(reachDailyMetrics.channel, input.channel),
        eq(reachDailyMetrics.trafficType, input.trafficType),
        eq(reachDailyMetrics.metric, input.metric),
      ),
    )
    .limit(1);

  const current = existing[0]?.value ?? 0;
  const nextValue = mode === "add" ? current + input.value : input.value;

  if (existing[0]) {
    await db
      .update(reachDailyMetrics)
      .set({ value: nextValue, source, updatedAt: new Date() })
      .where(eq(reachDailyMetrics.id, existing[0].id));
  } else {
    await db.insert(reachDailyMetrics).values({
      organizationId,
      dateKey,
      channel: input.channel,
      trafficType: input.trafficType,
      metric: input.metric,
      value: nextValue,
      source,
    });
  }

  return nextValue;
}

export async function upsertReachMetricsBatch(
  organizationId: string,
  entries: Array<ReachMetricInput & { dateKey: string }>,
) {
  let updated = 0;
  for (const entry of entries) {
    const { dateKey, ...metric } = entry;
    await upsertReachMetric(organizationId, dateKey, metric, "set", "integration");
    updated += 1;
  }
  revalidateDashboard();
  return updated;
}

export async function logIntegrationActivity(
  organizationId: string,
  type: "x_impression" | "meta_click" | "custom",
  metadata: Record<string, unknown>,
) {
  await db.insert(activityLogs).values({
    organizationId,
    type,
    source: "integration",
    occurredAt: new Date(),
    metadata,
  });
}
