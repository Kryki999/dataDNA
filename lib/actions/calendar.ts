"use server";

import { del, put } from "@vercel/blob";
import { and, asc, eq, gte, isNotNull, isNull, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  calendarEventAttachments,
  calendarEvents,
  clients,
  leads,
} from "@/lib/db/schema";
import { addClientNote } from "@/lib/actions/notes";
import {
  plannerAttachmentExtension,
  validatePlannerAttachment,
} from "@/lib/planner/attachments";
import type { PlannerEventWithMeta, PlannerIcon } from "@/lib/planner/types";
import { DEFAULT_EVENT_DURATION_MS } from "@/lib/planner/types";
import { isVercelBlobUrl } from "@/lib/avatar";
import { getCurrentOrganizationId } from "@/lib/tenant";
import { revalidateDashboard } from "@/lib/revalidate";

async function deleteStoredBlob(url: string) {
  if (!isVercelBlobUrl(url)) return;
  try {
    await del(url);
  } catch {
    // Ignore missing blobs.
  }
}

async function getClientIdForLead(leadId: string, organizationId: string) {
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(
      and(
        eq(clients.migratedFromLeadId, leadId),
        eq(clients.organizationId, organizationId),
      ),
    )
    .limit(1);

  return client?.id ?? null;
}

async function syncLeadFollowUp(leadId: string, dueAt: Date | null) {
  const now = new Date();
  await db
    .update(leads)
    .set({ nextFollowUpAt: dueAt, updatedAt: now })
    .where(eq(leads.id, leadId));
}

export async function getPlannerData(from: Date, to: Date) {
  const organizationId = await getCurrentOrganizationId();

  const scheduledRows = await db
    .select({
      event: calendarEvents,
      clientName: clients.name,
      clientCompany: clients.company,
      clientCardColor: clients.cardColor,
    })
    .from(calendarEvents)
    .leftJoin(clients, eq(calendarEvents.clientId, clients.id))
    .where(
      and(
        eq(calendarEvents.organizationId, organizationId),
        isNotNull(calendarEvents.dueAt),
        gte(calendarEvents.dueAt, from),
        lte(calendarEvents.dueAt, to),
      ),
    )
    .orderBy(calendarEvents.dueAt);

  const backlogRows = await db
    .select({
      event: calendarEvents,
      clientName: clients.name,
      clientCompany: clients.company,
      clientCardColor: clients.cardColor,
    })
    .from(calendarEvents)
    .leftJoin(clients, eq(calendarEvents.clientId, clients.id))
    .where(
      and(
        eq(calendarEvents.organizationId, organizationId),
        isNull(calendarEvents.dueAt),
        eq(calendarEvents.status, "pending"),
      ),
    )
    .orderBy(calendarEvents.createdAt);

  const allEventIds = [
    ...scheduledRows.map((r) => r.event.id),
    ...backlogRows.map((r) => r.event.id),
  ];

  const attachments =
    allEventIds.length > 0
      ? await db
          .select()
          .from(calendarEventAttachments)
          .where(eq(calendarEventAttachments.organizationId, organizationId))
          .orderBy(asc(calendarEventAttachments.sortOrder))
      : [];

  const attachmentsByEvent = new Map<string, (typeof attachments)[number][]>();
  for (const attachment of attachments) {
    if (!allEventIds.includes(attachment.eventId)) continue;
    const list = attachmentsByEvent.get(attachment.eventId) ?? [];
    list.push(attachment);
    attachmentsByEvent.set(attachment.eventId, list);
  }

  const mapRow = (row: (typeof scheduledRows)[number]): PlannerEventWithMeta => ({
    ...row.event,
    clientName: row.clientName,
    clientCompany: row.clientCompany,
    clientCardColor: row.clientCardColor,
    attachments: attachmentsByEvent.get(row.event.id) ?? [],
  });

  const activeClients = await db
    .select({
      id: clients.id,
      name: clients.name,
      company: clients.company,
      cardColor: clients.cardColor,
    })
    .from(clients)
    .where(
      and(
        eq(clients.organizationId, organizationId),
        eq(clients.isArchived, false),
      ),
    )
    .orderBy(clients.name);

  return {
    scheduled: scheduledRows.map(mapRow),
    backlog: backlogRows.map(mapRow),
    clients: activeClients,
  };
}

export async function upsertFollowUpFromLead(
  leadId: string,
  dueAt: Date,
  source: "crm" | "archive_reactivation" = "crm",
) {
  const organizationId = await getCurrentOrganizationId();

  const [lead] = await db
    .select({ name: leads.name, company: leads.company })
    .from(leads)
    .where(
      and(eq(leads.id, leadId), eq(leads.organizationId, organizationId)),
    )
    .limit(1);

  if (!lead) return null;

  const clientId = await getClientIdForLead(leadId, organizationId);
  const title = `Follow-up: ${lead.company ?? lead.name}`;
  const endsAt = new Date(dueAt.getTime() + DEFAULT_EVENT_DURATION_MS);

  await syncLeadFollowUp(leadId, dueAt);

  const followUpConditions = [
    eq(calendarEvents.organizationId, organizationId),
    eq(calendarEvents.status, "pending"),
  ];
  if (clientId) {
    followUpConditions.push(eq(calendarEvents.clientId, clientId));
  } else {
    followUpConditions.push(eq(calendarEvents.leadId, leadId));
  }

  const [existing] = await db
    .select({ id: calendarEvents.id })
    .from(calendarEvents)
    .where(and(...followUpConditions))
    .limit(1);

  if (existing) {
    await db
      .update(calendarEvents)
      .set({
        title,
        dueAt,
        endsAt,
        source,
        icon: "follow_up",
        clientId: clientId ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(calendarEvents.id, existing.id));
  } else {
    await db.insert(calendarEvents).values({
      organizationId,
      leadId: clientId ? null : leadId,
      clientId,
      title,
      dueAt,
      endsAt,
      status: "pending",
      source,
      icon: "follow_up",
    });
  }

  revalidateDashboard();
}

export async function cancelFollowUpForLead(leadId: string) {
  const organizationId = await getCurrentOrganizationId();
  const now = new Date();

  await db
    .update(leads)
    .set({ nextFollowUpAt: null, updatedAt: now })
    .where(
      and(eq(leads.id, leadId), eq(leads.organizationId, organizationId)),
    );

  await db
    .update(calendarEvents)
    .set({ status: "cancelled", updatedAt: now })
    .where(
      and(
        eq(calendarEvents.organizationId, organizationId),
        eq(calendarEvents.leadId, leadId),
        eq(calendarEvents.status, "pending"),
      ),
    );

  revalidateDashboard();
}

export async function getCalendarEvents(from: Date, to: Date) {
  const organizationId = await getCurrentOrganizationId();

  return db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.organizationId, organizationId),
        isNotNull(calendarEvents.dueAt),
        gte(calendarEvents.dueAt, from),
        lte(calendarEvents.dueAt, to),
      ),
    )
    .orderBy(calendarEvents.dueAt);
}

export async function getUpcomingEvents(limit = 20) {
  const organizationId = await getCurrentOrganizationId();
  const now = new Date();

  return db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.organizationId, organizationId),
        eq(calendarEvents.status, "pending"),
        isNotNull(calendarEvents.dueAt),
        gte(calendarEvents.dueAt, now),
      ),
    )
    .orderBy(calendarEvents.dueAt)
    .limit(limit);
}

export async function completeCalendarEvent(eventId: string) {
  const organizationId = await getCurrentOrganizationId();
  const now = new Date();

  const [event] = await db
    .update(calendarEvents)
    .set({ status: "completed", completedAt: now, updatedAt: now })
    .where(
      and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.organizationId, organizationId),
      ),
    )
    .returning();

  if (event?.clientId) {
    await addClientNote(event.clientId, `Wykonano: ${event.title}`);
  } else if (event?.leadId) {
    await syncLeadFollowUp(event.leadId, null);
    const clientId = await getClientIdForLead(event.leadId, organizationId);
    if (clientId) {
      await addClientNote(clientId, `Wykonano: ${event.title}`);
    }
  }

  revalidateDashboard();
  return event;
}

export async function rescheduleCalendarEvent(
  eventId: string,
  dueAt: Date,
  endsAt: Date,
) {
  const organizationId = await getCurrentOrganizationId();
  const now = new Date();

  const [event] = await db
    .update(calendarEvents)
    .set({ dueAt, endsAt, updatedAt: now })
    .where(
      and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.organizationId, organizationId),
      ),
    )
    .returning();

  if (event?.leadId) {
    await syncLeadFollowUp(event.leadId, dueAt);
  }

  revalidateDashboard();
  return event;
}

export async function createManualEvent(input: {
  title: string;
  dueAt: Date;
  endsAt?: Date;
  leadId?: string;
  clientId?: string;
}) {
  const organizationId = await getCurrentOrganizationId();
  const endsAt =
    input.endsAt ?? new Date(input.dueAt.getTime() + DEFAULT_EVENT_DURATION_MS);

  let clientId = input.clientId ?? null;
  let leadId = input.leadId ?? null;
  if (!clientId && leadId) {
    clientId = await getClientIdForLead(leadId, organizationId);
    if (clientId) leadId = null;
  }

  const [event] = await db
    .insert(calendarEvents)
    .values({
      organizationId,
      leadId,
      clientId,
      title: input.title.trim(),
      dueAt: input.dueAt,
      endsAt,
      status: "pending",
      source: "manual",
      icon: "task",
    })
    .returning();

  if (event.leadId) {
    await syncLeadFollowUp(event.leadId, input.dueAt);
  }

  revalidateDashboard();
  return event;
}

export async function createPlannerEvent(input: {
  title: string;
  dueAt?: Date | null;
  endsAt?: Date | null;
  leadId?: string | null;
  clientId?: string | null;
  icon?: PlannerIcon;
  description?: string;
}) {
  const organizationId = await getCurrentOrganizationId();
  const title = input.title.trim();
  if (!title) throw new Error("Tytuł jest wymagany");

  const dueAt = input.dueAt ?? null;
  const endsAt =
    dueAt && input.endsAt
      ? input.endsAt
      : dueAt
        ? new Date(dueAt.getTime() + DEFAULT_EVENT_DURATION_MS)
        : null;

  let clientId = input.clientId ?? null;
  let leadId = input.leadId ?? null;
  if (!clientId && leadId) {
    clientId = await getClientIdForLead(leadId, organizationId);
    if (clientId) leadId = null;
  }

  const [event] = await db
    .insert(calendarEvents)
    .values({
      organizationId,
      leadId,
      clientId,
      title,
      description: input.description?.trim() ?? "",
      icon: input.icon ?? "task",
      dueAt,
      endsAt,
      status: "pending",
      source: "manual",
    })
    .returning();

  if (event.leadId && dueAt) {
    await syncLeadFollowUp(event.leadId, dueAt);
  }

  revalidateDashboard();
  return event;
}

export async function updatePlannerEvent(
  eventId: string,
  patch: {
    title?: string;
    description?: string;
    dueAt?: Date | null;
    endsAt?: Date | null;
    leadId?: string | null;
    clientId?: string | null;
    icon?: PlannerIcon;
  },
) {
  const organizationId = await getCurrentOrganizationId();
  const now = new Date();

  const updates: Partial<typeof calendarEvents.$inferInsert> = {
    updatedAt: now,
  };

  if (patch.title !== undefined) updates.title = patch.title.trim();
  if (patch.description !== undefined) updates.description = patch.description;
  if (patch.icon !== undefined) updates.icon = patch.icon;
  if (patch.clientId !== undefined) {
    updates.clientId = patch.clientId;
    if (patch.clientId) updates.leadId = null;
  }
  if (patch.leadId !== undefined) {
    updates.leadId = patch.leadId;
    if (patch.leadId) {
      const resolved = await getClientIdForLead(patch.leadId, organizationId);
      if (resolved) {
        updates.clientId = resolved;
        updates.leadId = null;
      }
    }
  }
  if (patch.dueAt !== undefined) updates.dueAt = patch.dueAt;
  if (patch.endsAt !== undefined) updates.endsAt = patch.endsAt;

  const [event] = await db
    .update(calendarEvents)
    .set(updates)
    .where(
      and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.organizationId, organizationId),
      ),
    )
    .returning();

  if (!event) throw new Error("Nie znaleziono zadania");

  if (event.leadId && event.dueAt) {
    await syncLeadFollowUp(event.leadId, event.dueAt);
  } else if (event.leadId && !event.dueAt) {
    await syncLeadFollowUp(event.leadId, null);
  }

  revalidateDashboard();
  return event;
}

export async function schedulePlannerEvent(
  eventId: string,
  dueAt: Date,
  endsAt: Date,
) {
  return rescheduleCalendarEvent(eventId, dueAt, endsAt);
}

export async function moveToBacklog(eventId: string) {
  const organizationId = await getCurrentOrganizationId();
  const now = new Date();

  const [event] = await db
    .update(calendarEvents)
    .set({ dueAt: null, endsAt: null, updatedAt: now })
    .where(
      and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.organizationId, organizationId),
      ),
    )
    .returning();

  if (!event) throw new Error("Nie znaleziono zadania");

  if (event.leadId) {
    await syncLeadFollowUp(event.leadId, null);
  }

  revalidateDashboard();
  return event;
}

export async function deletePlannerEvent(eventId: string) {
  const organizationId = await getCurrentOrganizationId();

  const attachments = await db
    .select()
    .from(calendarEventAttachments)
    .where(
      and(
        eq(calendarEventAttachments.eventId, eventId),
        eq(calendarEventAttachments.organizationId, organizationId),
      ),
    );

  await Promise.all(attachments.map((a) => deleteStoredBlob(a.url)));

  const [event] = await db
    .delete(calendarEvents)
    .where(
      and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.organizationId, organizationId),
      ),
    )
    .returning();

  if (!event) throw new Error("Nie znaleziono zadania");

  revalidateDashboard();
  return event;
}

export async function uploadPlannerAttachment(eventId: string, formData: FormData) {
  const organizationId = await getCurrentOrganizationId();

  const [event] = await db
    .select({ id: calendarEvents.id })
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!event) throw new Error("Nie znaleziono zadania");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Nie wybrano pliku");
  }

  const validationError = validatePlannerAttachment(file);
  if (validationError) throw new Error(validationError);

  const ext = plannerAttachmentExtension(file);
  const pathname = `planner/${organizationId}/${eventId}/${Date.now()}.${ext}`;
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type,
  });

  const existing = await db
    .select({ sortOrder: calendarEventAttachments.sortOrder })
    .from(calendarEventAttachments)
    .where(eq(calendarEventAttachments.eventId, eventId))
    .orderBy(asc(calendarEventAttachments.sortOrder));

  const sortOrder =
    existing.length > 0 ? existing[existing.length - 1]!.sortOrder + 1 : 0;

  const [attachment] = await db
    .insert(calendarEventAttachments)
    .values({
      organizationId,
      eventId,
      url: blob.url,
      fileName: file.name,
      mimeType: file.type,
      sortOrder,
    })
    .returning();

  revalidateDashboard();
  return attachment;
}

export async function deletePlannerAttachment(attachmentId: string) {
  const organizationId = await getCurrentOrganizationId();

  const [attachment] = await db
    .select()
    .from(calendarEventAttachments)
    .where(
      and(
        eq(calendarEventAttachments.id, attachmentId),
        eq(calendarEventAttachments.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!attachment) throw new Error("Nie znaleziono załącznika");

  await deleteStoredBlob(attachment.url);

  await db
    .delete(calendarEventAttachments)
    .where(eq(calendarEventAttachments.id, attachmentId));

  revalidateDashboard();
  return attachment;
}
