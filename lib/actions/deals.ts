"use server";

import { desc, eq, sql } from "drizzle-orm";
import { revalidateDashboard } from "@/lib/revalidate";
import { db } from "@/lib/db";
import { activityLogs, deals } from "@/lib/db/schema";
import { getCurrentOrganizationId } from "@/lib/tenant";
import { REVENUE_GOAL_PLN } from "@/lib/constants";

export type DealInput = {
  amountPln: number;
  description?: string;
  leadId?: string;
};

export async function closeDeal(input: DealInput) {
  const organizationId = await getCurrentOrganizationId();
  const now = new Date();

  const [deal] = await db
    .insert(deals)
    .values({
      organizationId,
      amountPln: input.amountPln,
      description: input.description?.trim() || null,
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
  return deal;
}

export async function getRevenueProgress() {
  const organizationId = await getCurrentOrganizationId();

  const [result] = await db
    .select({
      total: sql<number>`coalesce(sum(${deals.amountPln}), 0)`,
    })
    .from(deals)
    .where(eq(deals.organizationId, organizationId));

  const total = Number(result?.total ?? 0);
  const goal = REVENUE_GOAL_PLN;
  const percent = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;

  return { total, goal, percent };
}

export async function getRecentDeals(limit = 5) {
  const organizationId = await getCurrentOrganizationId();

  return db
    .select()
    .from(deals)
    .where(eq(deals.organizationId, organizationId))
    .orderBy(desc(deals.closedAt))
    .limit(limit);
}
