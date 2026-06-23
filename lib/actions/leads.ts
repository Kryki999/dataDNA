"use server";

import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLogs, revenueRecords, leadNotes, leads } from "@/lib/db/schema";
import { closeRevenueRecord } from "@/lib/actions/deals";
import {
  cancelFollowUpForLead,
  upsertFollowUpFromLead,
} from "@/lib/actions/calendar";
import { getCurrentOrganizationId } from "@/lib/tenant";
import { revalidateDashboard } from "@/lib/revalidate";
import type { PipelineStageId, LeadSourceId } from "@/lib/crm/pipeline";
import { ARCHIVE_STAGES } from "@/lib/crm/pipeline";
import type { Lead } from "@/lib/crm/pipeline";

export type LeadInput = {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  projectValuePln?: number | null;
  source?: LeadSourceId;
  pipelineStage?: PipelineStageId;
  tags?: string[];
  nextFollowUpAt?: Date | null;
};

export type ArchiveFilters = {
  status?: "won" | "lost";
  tag?: string;
  closedFrom?: Date;
  closedTo?: Date;
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

async function attachLastNotes<T extends Lead>(
  rows: T[],
): Promise<(T & { lastNoteBody: string | null })[]> {
  if (rows.length === 0) return [];

  const organizationId = await getCurrentOrganizationId();
  const leadIds = rows.map((r) => r.id);

  const notes = await db
    .select({
      leadId: leadNotes.leadId,
      body: leadNotes.body,
      createdAt: leadNotes.createdAt,
    })
    .from(leadNotes)
    .where(
      and(
        eq(leadNotes.organizationId, organizationId),
        inArray(leadNotes.leadId, leadIds),
      ),
    )
    .orderBy(desc(leadNotes.createdAt));

  const latestByLead = new Map<string, string>();
  for (const note of notes) {
    if (!latestByLead.has(note.leadId)) {
      latestByLead.set(note.leadId, note.body);
    }
  }

  return rows.map((lead) => ({
    ...lead,
    lastNoteBody: latestByLead.get(lead.id) ?? (lead.notes?.trim() || null),
  }));
}

export async function getCrmLeadsWithMeta() {
  const { active, archived } = await getCrmLeads();
  return {
    active: await attachLastNotes(active),
    archived: await attachLastNotes(archived),
  };
}

export async function getArchivedLeads(filters: ArchiveFilters = {}) {
  const organizationId = await getCurrentOrganizationId();

  const conditions = [
    eq(leads.organizationId, organizationId),
    inArray(leads.pipelineStage, ["won", "lost"]),
  ];

  if (filters.status) {
    conditions.push(eq(leads.pipelineStage, filters.status));
  }
  if (filters.closedFrom) {
    conditions.push(gte(leads.closedAt, filters.closedFrom));
  }
  if (filters.closedTo) {
    conditions.push(lte(leads.closedAt, filters.closedTo));
  }

  let rows = await db
    .select()
    .from(leads)
    .where(and(...conditions))
    .orderBy(desc(leads.closedAt));

  if (filters.tag) {
    rows = rows.filter((lead) => lead.tags.includes(filters.tag!));
  }

  return rows;
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
      tags: input.tags ?? [],
      nextFollowUpAt: input.nextFollowUpAt ?? null,
    })
    .returning();

  if (lead.nextFollowUpAt) {
    await upsertFollowUpFromLead(lead.id, lead.nextFollowUpAt);
  }

  revalidateDashboard();
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
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      ...(input.nextFollowUpAt !== undefined
        ? { nextFollowUpAt: input.nextFollowUpAt }
        : {}),
      updatedAt: new Date(),
    })
    .where(
      and(eq(leads.id, leadId), eq(leads.organizationId, organizationId)),
    )
    .returning();

  if (lead && input.nextFollowUpAt) {
    await upsertFollowUpFromLead(leadId, input.nextFollowUpAt);
  } else if (lead && input.nextFollowUpAt === null) {
    await cancelFollowUpForLead(leadId);
  }

  revalidateDashboard();
  return lead;
}

async function ensureWonDeal(leadId: string, amountPln: number, label: string) {
  const organizationId = await getCurrentOrganizationId();
  const [existing] = await db
    .select({ id: revenueRecords.id })
    .from(revenueRecords)
    .where(
      and(eq(revenueRecords.organizationId, organizationId), eq(revenueRecords.leadId, leadId)),
    )
    .limit(1);

  if (!existing) {
    await closeRevenueRecord({
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
      nextFollowUpAt: isClosing ? null : lead.nextFollowUpAt,
      updatedAt: now,
    })
    .where(
      and(eq(leads.id, leadId), eq(leads.organizationId, organizationId)),
    );

  if (isClosing) {
    await cancelFollowUpForLead(leadId);
  }

  if (stage === "won" && lead.projectValuePln && lead.projectValuePln > 0) {
    await ensureWonDeal(
      leadId,
      lead.projectValuePln,
      `Wygrany: ${lead.company ?? lead.name}`,
    );
  }

  revalidateDashboard();
  return { ...lead, pipelineStage: stage, closedAt: isClosing ? now : null };
}

export async function reactivateLead(
  leadId: string,
  options?: { followUpInMonths?: number },
) {
  const organizationId = await getCurrentOrganizationId();
  const now = new Date();

  await db
    .update(leads)
    .set({
      pipelineStage: "new",
      closedAt: null,
      updatedAt: now,
    })
    .where(
      and(eq(leads.id, leadId), eq(leads.organizationId, organizationId)),
    );

  if (options?.followUpInMonths) {
    const dueAt = new Date(now);
    dueAt.setMonth(dueAt.getMonth() + options.followUpInMonths);
    await upsertFollowUpFromLead(leadId, dueAt, "archive_reactivation");
    await db
      .update(leads)
      .set({ nextFollowUpAt: dueAt })
      .where(eq(leads.id, leadId));
  }

  revalidateDashboard();
  const [lead] = await db
    .select()
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);
  return lead ?? null;
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

  revalidateDashboard();
}

export async function deleteLead(leadId: string) {
  const organizationId = await getCurrentOrganizationId();

  await cancelFollowUpForLead(leadId);

  await db
    .delete(leads)
    .where(
      and(eq(leads.id, leadId), eq(leads.organizationId, organizationId)),
    );

  revalidateDashboard();
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

  revalidateDashboard();
  return note;
}

export async function getWonDealsWithLeads() {
  const organizationId = await getCurrentOrganizationId();

  return db
    .select({
      dealId: revenueRecords.id,
      amountPln: revenueRecords.amountPln,
      description: revenueRecords.description,
      closedAt: revenueRecords.closedAt,
      leadId: leads.id,
      leadName: leads.name,
      company: leads.company,
      pipelineStage: leads.pipelineStage,
      tags: leads.tags,
    })
    .from(revenueRecords)
    .leftJoin(leads, eq(revenueRecords.leadId, leads.id))
    .where(eq(revenueRecords.organizationId, organizationId))
    .orderBy(desc(revenueRecords.closedAt));
}
