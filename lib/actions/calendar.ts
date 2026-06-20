"use server";

import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { calendarEvents, leads } from "@/lib/db/schema";
import { getCurrentOrganizationId } from "@/lib/tenant";
import { revalidateDashboard } from "@/lib/revalidate";

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

  const title = `Follow-up: ${lead.company ?? lead.name}`;

  await db
    .update(leads)
    .set({ nextFollowUpAt: dueAt, updatedAt: new Date() })
    .where(
      and(eq(leads.id, leadId), eq(leads.organizationId, organizationId)),
    );

  const [existing] = await db
    .select({ id: calendarEvents.id })
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.organizationId, organizationId),
        eq(calendarEvents.leadId, leadId),
        eq(calendarEvents.status, "pending"),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(calendarEvents)
      .set({ title, dueAt, source, updatedAt: new Date() })
      .where(eq(calendarEvents.id, existing.id));
  } else {
    await db.insert(calendarEvents).values({
      organizationId,
      leadId,
      title,
      dueAt,
      status: "pending",
      source,
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

  if (event?.leadId) {
    await db
      .update(leads)
      .set({ nextFollowUpAt: null, updatedAt: now })
      .where(eq(leads.id, event.leadId));
  }

  revalidateDashboard();
  return event;
}

export async function createManualEvent(input: {
  title: string;
  dueAt: Date;
  leadId?: string;
}) {
  const organizationId = await getCurrentOrganizationId();

  const [event] = await db
    .insert(calendarEvents)
    .values({
      organizationId,
      leadId: input.leadId ?? null,
      title: input.title.trim(),
      dueAt: input.dueAt,
      status: "pending",
      source: "manual",
    })
    .returning();

  revalidateDashboard();
  return event;
}
