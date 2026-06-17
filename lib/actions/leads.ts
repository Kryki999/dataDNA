"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { activityLogs, leads } from "@/lib/db/schema";
import { getCurrentOrganizationId } from "@/lib/tenant";
import { TEMPERATURE_ORDER } from "@/lib/constants";

export type LeadInput = {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  temperature?: "cold" | "warm" | "hot";
  notes?: string;
  tags?: string[];
};

export async function getLeads() {
  const organizationId = await getCurrentOrganizationId();
  const rows = await db
    .select()
    .from(leads)
    .where(eq(leads.organizationId, organizationId))
    .orderBy(desc(leads.updatedAt));

  return rows.sort((a, b) => {
    const tempDiff =
      TEMPERATURE_ORDER[a.temperature] - TEMPERATURE_ORDER[b.temperature];
    if (tempDiff !== 0) return tempDiff;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

export async function createLead(input: LeadInput) {
  const organizationId = await getCurrentOrganizationId();

  const [lead] = await db
    .insert(leads)
    .values({
      organizationId,
      name: input.name.trim(),
      company: input.company?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      temperature: input.temperature ?? "cold",
      notes: input.notes ?? "",
      tags: input.tags ?? [],
    })
    .returning();

  revalidatePath("/");
  return lead;
}

export async function updateLead(
  leadId: string,
  input: Partial<LeadInput> & { temperature?: "cold" | "warm" | "hot" },
) {
  const organizationId = await getCurrentOrganizationId();

  const [lead] = await db
    .update(leads)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.company !== undefined
        ? { company: input.company.trim() || null }
        : {}),
      ...(input.phone !== undefined
        ? { phone: input.phone.trim() || null }
        : {}),
      ...(input.email !== undefined
        ? { email: input.email.trim() || null }
        : {}),
      ...(input.temperature !== undefined
        ? { temperature: input.temperature }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(eq(leads.id, leadId), eq(leads.organizationId, organizationId)),
    )
    .returning();

  revalidatePath("/");
  return lead;
}

export async function logColdCall(leadId: string) {
  const organizationId = await getCurrentOrganizationId();
  const now = new Date();

  await db
    .update(leads)
    .set({ lastContactedAt: now, updatedAt: now })
    .where(
      and(eq(leads.id, leadId), eq(leads.organizationId, organizationId)),
    );

  await db.insert(activityLogs).values({
    organizationId,
    type: "cold_call",
    source: "manual",
    occurredAt: now,
    leadId,
  });

  revalidatePath("/");
}

export async function deleteLead(leadId: string) {
  const organizationId = await getCurrentOrganizationId();

  await db
    .delete(leads)
    .where(
      and(eq(leads.id, leadId), eq(leads.organizationId, organizationId)),
    );

  revalidatePath("/");
}

export async function getLeadById(leadId: string) {
  const organizationId = await getCurrentOrganizationId();
  const [lead] = await db
    .select()
    .from(leads)
    .where(
      and(eq(leads.id, leadId), eq(leads.organizationId, organizationId)),
    )
    .limit(1);

  return lead ?? null;
}
