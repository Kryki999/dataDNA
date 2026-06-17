"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { activityLogs, reachMetrics } from "@/lib/db/schema";
import { getCurrentOrganizationId } from "@/lib/tenant";
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
}

export async function logReachMetrics(input: ReachInput) {
  const organizationId = await getCurrentOrganizationId();
  await upsertReachForToday(organizationId, input, "add");
  revalidatePath("/");
}

export async function getReachSummary() {
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

  const weekRows = await db
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

  const week = weekRows[0] ?? {
    coldCalls: 0,
    xImpressions: 0,
    metaClicks: 0,
  };

  return {
    today: {
      coldCalls: todayRow?.coldCalls ?? 0,
      xImpressions: todayRow?.xImpressions ?? 0,
      metaClicks: todayRow?.metaClicks ?? 0,
    },
    week: {
      coldCalls: Number(week.coldCalls),
      xImpressions: Number(week.xImpressions),
      metaClicks: Number(week.metaClicks),
    },
  };
}

export async function getWeeklyPhoneCount() {
  const summary = await getReachSummary();
  return summary.week.coldCalls;
}
