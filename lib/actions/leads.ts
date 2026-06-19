"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { activityLogs, deals, leadNotes, leads } from "@/lib/db/schema";
import { closeDeal } from "@/lib/actions/deals";
import { getCurrentOrganizationId } from "@/lib/tenant";
import type { PipelineStageId, LeadSourceId } from "@/lib/crm/pipeline";
import { ARCHIVE_STAGES } from "@/lib/crm/pipeline";

export type LeadInput = {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  projectValuePln?: number | null;
  source?: LeadSourceId;
  pipelineStage?: PipelineStageId;
};

export async function getLeads() {
  const organizationId = await getCurrentOrganizationId();
  return db
    .select()
    .from(leads)
    .where(eq(leads.organizationId, organizationId))
    .orderBy(desc(leads.updatedAt));
}

export async function getCrmLeads() {
  const rows = await getLeads();
  return {
    active: rows.filter(
      (lead) =>
        !ARCHIVE_STAGES.includes(lead.pipelineStage as PipelineStageId),
    ),
    archived: rows.filter((lead) =>
      ARCHIVE_STAGES.includes(lead.pipelineStage as PipelineStageId),
    ),
  };
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
      projectValuePln: input.projectValuePln ?? null,
      source: input.source ?? "cold_call",
      pipelineStage: input.pipelineStage ?? "new",
    })
    .returning();

  revalidatePath("/");
  return lead;
}

export async function updateLead(leadId: string, input: Partial<LeadInput>) {
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
      ...(input.projectValuePln !== undefined
        ? { projectValuePln: input.projectValuePln }
        : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.pipelineStage !== undefined
        ? { pipelineStage: input.pipelineStage }
        : {}),
      updatedAt: new Date(),
    })
    .where(
      and(eq(leads.id, leadId), eq(leads.organizationId, organizationId)),
    )
    .returning();

  revalidatePath("/");
  return lead;
}

async function ensureWonDeal(leadId: string, amountPln: number, label: string) {
  const organizationId = await getCurrentOrganizationId();
  const [existing] = await db
    .select({ id: deals.id })
    .from(deals)
    .where(
      and(eq(deals.organizationId, organizationId), eq(deals.leadId, leadId)),
    )
    .limit(1);

  if (!existing) {
    await closeDeal({
      amountPln,
      leadId,
      description: label,
    });
  }
}

export async function updateLeadStage(leadId: string, stage: PipelineStageId) {
  const organizationId = await getCurrentOrganizationId();
  const [lead] = await db
    .select()
    .from(leads)
    .where(
      and(eq(leads.id, leadId), eq(leads.organizationId, organizationId)),
    )
    .limit(1);

  if (!lead) return null;

  const now = new Date();
  const isClosing = stage === "won" || stage === "lost";

  await db
    .update(leads)
    .set({
      pipelineStage: stage,
      closedAt: isClosing ? now : null,
      updatedAt: now,
    })
    .where(
      and(eq(leads.id, leadId), eq(leads.organizationId, organizationId)),
    );

  if (stage === "won" && lead.projectValuePln && lead.projectValuePln > 0) {
    await ensureWonDeal(
      leadId,
      lead.projectValuePln,
      `Wygrany: ${lead.company ?? lead.name}`,
    );
  }

  revalidatePath("/");
  return { ...lead, pipelineStage: stage, closedAt: isClosing ? now : null };
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

  await db.insert(leadNotes).values({
    organizationId,
    leadId,
    body: "Odnotowano cold call.",
  });

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

export async function getLeadNotes(leadId: string) {
  const organizationId = await getCurrentOrganizationId();

  const notes = await db
    .select()
    .from(leadNotes)
    .where(
      and(
        eq(leadNotes.leadId, leadId),
        eq(leadNotes.organizationId, organizationId),
      ),
    )
    .orderBy(desc(leadNotes.createdAt));

  if (notes.length > 0) {
    return notes;
  }

  const lead = await getLeadById(leadId);
  if (lead?.notes?.trim()) {
    return [
      {
        id: "legacy",
        organizationId,
        leadId,
        body: lead.notes,
        createdAt: lead.updatedAt,
      },
    ];
  }

  return [];
}

export async function addLeadNote(leadId: string, body: string) {
  const organizationId = await getCurrentOrganizationId();
  const trimmed = body.trim();
  if (!trimmed) return null;

  const [note] = await db
    .insert(leadNotes)
    .values({
      organizationId,
      leadId,
      body: trimmed,
    })
    .returning();

  await db
    .update(leads)
    .set({ updatedAt: new Date() })
    .where(
      and(eq(leads.id, leadId), eq(leads.organizationId, organizationId)),
    );

  revalidatePath("/");
  return note;
}
