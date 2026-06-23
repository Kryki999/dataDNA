"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, notes, pipelineDeals } from "@/lib/db/schema";
import {
  FUZZY_MATCH_THRESHOLD,
  getClientDisplayName,
  scoreClientMatch,
} from "@/lib/crm/client-name";
import type { Client } from "@/lib/crm/clients";
import { isValidCardColor } from "@/lib/crm/clients";
import { CLOSED_PIPELINE_DEAL_STATUSES } from "@/lib/crm/pipeline-deals";
import { getCurrentOrganizationId } from "@/lib/tenant";
import { revalidateDashboard } from "@/lib/revalidate";

export type ClientInput = {
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  coverUrl?: string | null;
  cardColor?: string | null;
  tags?: string[];
};

export type ClientSearchResult = Client & {
  displayName: string;
  score: number;
};

export async function getClients(options?: { includeArchived?: boolean }) {
  const organizationId = await getCurrentOrganizationId();

  const conditions = [eq(clients.organizationId, organizationId)];
  if (!options?.includeArchived) {
    conditions.push(eq(clients.isArchived, false));
  }

  return db
    .select()
    .from(clients)
    .where(and(...conditions))
    .orderBy(desc(clients.updatedAt));
}

export async function getClientById(clientId: string) {
  const organizationId = await getCurrentOrganizationId();
  const [client] = await db
    .select()
    .from(clients)
    .where(
      and(eq(clients.id, clientId), eq(clients.organizationId, organizationId)),
    )
    .limit(1);

  return client ?? null;
}

export async function searchClients(
  query: string,
  limit = 8,
): Promise<ClientSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const organizationId = await getCurrentOrganizationId();
  const rows = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.organizationId, organizationId),
        eq(clients.isArchived, false),
      ),
    );

  return rows
    .map((client) => ({
      ...client,
      displayName: getClientDisplayName(client),
      score: scoreClientMatch(trimmed, client),
    }))
    .filter((row) => row.score >= FUZZY_MATCH_THRESHOLD * 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export type ResolveClientResult =
  | { action: "pick_required"; matches: ClientSearchResult[] }
  | { action: "create_new" };

export async function resolveClientForCreation(
  query: string,
): Promise<ResolveClientResult> {
  const matches = await searchClients(query, 5);
  const top = matches[0];

  if (top && top.score >= FUZZY_MATCH_THRESHOLD) {
    return { action: "pick_required", matches };
  }

  return { action: "create_new" };
}

export async function createClient(input: ClientInput) {
  const organizationId = await getCurrentOrganizationId();
  const name = input.name.trim();
  if (!name) throw new Error("Podaj nazwę klienta");

  const [client] = await db
    .insert(clients)
    .values({
      organizationId,
      name,
      company: input.company?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      coverUrl: input.coverUrl ?? null,
      cardColor:
        input.cardColor && isValidCardColor(input.cardColor)
          ? input.cardColor
          : null,
      tags: input.tags ?? [],
    })
    .returning();

  revalidateDashboard();
  return client;
}

export async function updateClient(
  clientId: string,
  input: Partial<ClientInput>,
) {
  const organizationId = await getCurrentOrganizationId();

  const [client] = await db
    .update(clients)
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
      ...(input.coverUrl !== undefined ? { coverUrl: input.coverUrl } : {}),
      ...(input.cardColor !== undefined
        ? {
            cardColor:
              input.cardColor && isValidCardColor(input.cardColor)
                ? input.cardColor
                : null,
          }
        : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(eq(clients.id, clientId), eq(clients.organizationId, organizationId)),
    )
    .returning();

  revalidateDashboard();
  return client ?? null;
}

async function clientHasHistory(clientId: string, organizationId: string) {
  const [note] = await db
    .select({ id: notes.id })
    .from(notes)
    .where(
      and(eq(notes.clientId, clientId), eq(notes.organizationId, organizationId)),
    )
    .limit(1);

  if (note) return true;

  const [wonDeal] = await db
    .select({ id: pipelineDeals.id })
    .from(pipelineDeals)
    .where(
      and(
        eq(pipelineDeals.clientId, clientId),
        eq(pipelineDeals.organizationId, organizationId),
        inArray(pipelineDeals.status, CLOSED_PIPELINE_DEAL_STATUSES),
      ),
    )
    .limit(1);

  return Boolean(wonDeal);
}

export async function archiveClient(clientId: string) {
  const organizationId = await getCurrentOrganizationId();
  const now = new Date();

  const [client] = await db
    .update(clients)
    .set({
      isArchived: true,
      archivedAt: now,
      updatedAt: now,
    })
    .where(
      and(eq(clients.id, clientId), eq(clients.organizationId, organizationId)),
    )
    .returning();

  revalidateDashboard();
  return client ?? null;
}

export async function deleteClient(clientId: string) {
  const organizationId = await getCurrentOrganizationId();

  const hasHistory = await clientHasHistory(clientId, organizationId);
  if (hasHistory) {
    throw new Error(
      "Nie można trwale usunąć klienta z historią. Użyj archiwizacji.",
    );
  }

  await db
    .delete(clients)
    .where(
      and(eq(clients.id, clientId), eq(clients.organizationId, organizationId)),
    );

  revalidateDashboard();
}
