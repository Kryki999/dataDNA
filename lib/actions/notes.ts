"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, notes, pipelineDeals } from "@/lib/db/schema";
import { getClientById } from "@/lib/actions/clients";
import { getCurrentOrganizationId } from "@/lib/tenant";
import { revalidateDashboard } from "@/lib/revalidate";

export type ClientFeedItem = {
  id: string;
  body: string;
  type: "user" | "system";
  createdAt: Date;
  dealId: string | null;
  dealTitle: string | null;
  metadata: Record<string, unknown> | null;
};

export async function getClientFeed(clientId: string): Promise<ClientFeedItem[]> {
  const organizationId = await getCurrentOrganizationId();

  const client = await getClientById(clientId);
  if (!client) return [];

  const rows = await db
    .select({
      id: notes.id,
      body: notes.body,
      type: notes.type,
      createdAt: notes.createdAt,
      dealId: notes.dealId,
      dealTitle: pipelineDeals.title,
      metadata: notes.metadata,
    })
    .from(notes)
    .leftJoin(pipelineDeals, eq(notes.dealId, pipelineDeals.id))
    .where(
      and(
        eq(notes.clientId, clientId),
        eq(notes.organizationId, organizationId),
      ),
    )
    .orderBy(desc(notes.createdAt));

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    type: row.type,
    createdAt: row.createdAt,
    dealId: row.dealId,
    dealTitle: row.dealTitle,
    metadata: row.metadata,
  }));
}

export async function addClientNote(
  clientId: string,
  body: string,
  options?: { dealId?: string | null },
) {
  const organizationId = await getCurrentOrganizationId();
  const trimmed = body.trim();
  if (!trimmed) return null;

  const client = await getClientById(clientId);
  if (!client) throw new Error("Nie znaleziono klienta");

  if (options?.dealId) {
    const [deal] = await db
      .select({ id: pipelineDeals.id })
      .from(pipelineDeals)
      .where(
        and(
          eq(pipelineDeals.id, options.dealId),
          eq(pipelineDeals.clientId, clientId),
          eq(pipelineDeals.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (!deal) throw new Error("Nie znaleziono projektu dla tego klienta");
  }

  const [note] = await db
    .insert(notes)
    .values({
      organizationId,
      clientId,
      dealId: options?.dealId ?? null,
      body: trimmed,
      type: "user",
    })
    .returning();

  await db
    .update(clients)
    .set({ updatedAt: new Date() })
    .where(
      and(eq(clients.id, clientId), eq(clients.organizationId, organizationId)),
    );

  revalidateDashboard();
  return note;
}

export async function addSystemNote(
  clientId: string,
  body: string,
  metadata?: Record<string, unknown> & { dealId?: string },
) {
  const organizationId = await getCurrentOrganizationId();

  const [note] = await db
    .insert(notes)
    .values({
      organizationId,
      clientId,
      dealId: metadata?.dealId ?? null,
      body,
      type: "system",
      metadata: metadata ?? null,
    })
    .returning();

  revalidateDashboard();
  return note;
}
