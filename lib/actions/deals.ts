"use server";

import { desc, eq, sql } from "drizzle-orm";
import { revalidateDashboard } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { activityLogs, revenueRecords } from "@/lib/db/schema";
import { getCurrentOrganizationId } from "@/lib/tenant";

export type RevenueInput = {
  amountPln: number;
  description?: string;
  clientId?: string;
  pipelineDealId?: string;
  leadId?: string;
};

export async function closeRevenueRecord(input: RevenueInput) {
  const organizationId = await getCurrentOrganizationId();
  const now = new Date();

  const [record] = await db
    .insert(revenueRecords)
    .values({
      organizationId,
      amountPln: input.amountPln,
      description: input.description?.trim() || null,
      clientId: input.clientId ?? null,
      pipelineDealId: input.pipelineDealId ?? null,
      leadId: input.leadId ?? null,
      source: "manual",
      closedAt: now,
    })
    .returning();

  await db.insert(activityLogs).values({
    organizationId,
    type: "deal_closed",
    source: "manual",
    occurredAt: now,
    leadId: input.leadId ?? null,
    metadata: { amountPln: input.amountPln },
  });

  revalidateDashboard();
  return record;
}

/** @deprecated Use closeRevenueRecord */
export const closeDeal = closeRevenueRecord;

export async function getTotalRevenue() {
  const organizationId = await getCurrentOrganizationId();

  const [result] = await db
    .select({
      total: sql<number>`coalesce(sum(${revenueRecords.amountPln}), 0)`,
    })
    .from(revenueRecords)
    .where(eq(revenueRecords.organizationId, organizationId));

  return { total: Number(result?.total ?? 0) };
}

export async function getRecentRevenueRecords(limit = 5) {
  const organizationId = await getCurrentOrganizationId();

  return db
    .select()
    .from(revenueRecords)
    .where(eq(revenueRecords.organizationId, organizationId))
    .orderBy(desc(revenueRecords.closedAt))
    .limit(limit);
}

/** @deprecated */
export const getRecentDeals = getRecentRevenueRecords;

export async function getRevenueTimeSeries() {
  const organizationId = await getCurrentOrganizationId();

  return db
    .select({
      closedAt: revenueRecords.closedAt,
      amountPln: revenueRecords.amountPln,
    })
    .from(revenueRecords)
    .where(eq(revenueRecords.organizationId, organizationId))
    .orderBy(revenueRecords.closedAt);
}

/** @deprecated */
export const getDealsTimeSeries = getRevenueTimeSeries;

export async function getRevenueGrowth() {
  const organizationId = await getCurrentOrganizationId();

  const rows = await db
    .select({
      amountPln: revenueRecords.amountPln,
      closedAt: revenueRecords.closedAt,
    })
    .from(revenueRecords)
    .where(eq(revenueRecords.organizationId, organizationId));

  const now = new Date();
  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  );

  let thisMonth = 0;
  let lastMonth = 0;

  for (const row of rows) {
    const closedAt = row.closedAt;
    if (closedAt >= startThisMonth) {
      thisMonth += row.amountPln;
    } else if (closedAt >= startLastMonth && closedAt <= endLastMonth) {
      lastMonth += row.amountPln;
    }
  }

  const percentChange =
    lastMonth > 0
      ? ((thisMonth - lastMonth) / lastMonth) * 100
      : thisMonth > 0
        ? 100
        : 0;

  return { percentChange, thisMonth, lastMonth };
}
