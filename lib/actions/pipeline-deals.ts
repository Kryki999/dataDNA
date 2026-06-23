"use server";

import { and, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, notes, pipelineDeals, revenueRecords } from "@/lib/db/schema";
import { getClientDisplayName } from "@/lib/crm/client-name";
import {
  createClient,
  getClientById,
  resolveClientForCreation,
  searchClients,
} from "@/lib/actions/clients";
import { addSystemNote } from "@/lib/actions/notes";
import {
  ACTIVE_PIPELINE_DEAL_STATUSES,
  CLOSED_PIPELINE_DEAL_STATUSES,
  type PipelineDealStatus,
} from "@/lib/crm/pipeline-deals";
import type { LeadSourceId } from "@/lib/crm/pipeline";
import { getCurrentOrganizationId } from "@/lib/tenant";
import { revalidateDashboard } from "@/lib/revalidate";

import type { Client } from "@/lib/crm/clients";
import type { PipelineDeal } from "@/lib/crm/pipeline-deals";

export type PipelineDealWithMeta = PipelineDeal & {
  client: Client;
  displayName: string;
  tags: string[];
  coverUrl: string | null;
  cardColor: string | null;
  lastNoteBody: string | null;
};

export async function getActivePipelineDealsWithMeta(): Promise<
  PipelineDealWithMeta[]
> {
  const organizationId = await getCurrentOrganizationId();

  const rows = await db
    .select({
      deal: pipelineDeals,
      client: clients,
    })
    .from(pipelineDeals)
    .innerJoin(clients, eq(pipelineDeals.clientId, clients.id))
    .where(
      and(
        eq(pipelineDeals.organizationId, organizationId),
        inArray(pipelineDeals.status, ACTIVE_PIPELINE_DEAL_STATUSES),
      ),
    )
    .orderBy(desc(pipelineDeals.updatedAt));

  if (rows.length === 0) return [];

  const clientIds = [...new Set(rows.map((r) => r.client.id))];
  const noteRows = await db
    .select({
      clientId: notes.clientId,
      body: notes.body,
      createdAt: notes.createdAt,
    })
    .from(notes)
    .where(
      and(
        eq(notes.organizationId, organizationId),
        inArray(notes.clientId, clientIds),
      ),
    )
    .orderBy(desc(notes.createdAt));

  const latestNote = new Map<string, string>();
  for (const n of noteRows) {
    if (!latestNote.has(n.clientId)) latestNote.set(n.clientId, n.body);
  }

  return rows.map(({ deal, client }) => ({
    ...deal,
    client,
    displayName: getClientDisplayName(client),
    tags: client.tags,
    coverUrl: client.coverUrl,
    cardColor: client.cardColor,
    lastNoteBody: latestNote.get(client.id) ?? null,
  }));
}

export async function getWonClientsForRevenue() {
  const organizationId = await getCurrentOrganizationId();

  const wonDeals = await db
    .select({ clientId: pipelineDeals.clientId })
    .from(pipelineDeals)
    .where(
      and(
        eq(pipelineDeals.organizationId, organizationId),
        eq(pipelineDeals.status, "closed_won"),
      ),
    );

  const revenueClients = await db
    .select({ clientId: revenueRecords.clientId })
    .from(revenueRecords)
    .where(
      and(
        eq(revenueRecords.organizationId, organizationId),
        sql`${revenueRecords.clientId} IS NOT NULL`,
      ),
    );

  const ids = new Set<string>();
  for (const r of wonDeals) if (r.clientId) ids.add(r.clientId);
  for (const r of revenueClients) if (r.clientId) ids.add(r.clientId);

  if (ids.size === 0) return [];

  const clientRows = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.organizationId, organizationId),
        inArray(clients.id, [...ids]),
      ),
    );

  const revenueByClient = await db
    .select({
      clientId: revenueRecords.clientId,
      total: sql<number>`coalesce(sum(${revenueRecords.amountPln}), 0)`,
    })
    .from(revenueRecords)
    .where(eq(revenueRecords.organizationId, organizationId))
    .groupBy(revenueRecords.clientId);

  const totalMap = new Map(
    revenueByClient.map((r) => [r.clientId, Number(r.total)]),
  );

  return clientRows.map((client) => ({
    ...client,
    displayName: getClientDisplayName(client),
    totalRevenuePln: totalMap.get(client.id) ?? 0,
  }));
}

export type PipelineDealInput = {
  clientId: string;
  title: string;
  status?: PipelineDealStatus;
  projectValuePln?: number | null;
  source?: LeadSourceId;
  nextFollowUpAt?: Date | null;
};

export async function getActivePipelineDeals() {
  const organizationId = await getCurrentOrganizationId();

  return db
    .select()
    .from(pipelineDeals)
    .where(
      and(
        eq(pipelineDeals.organizationId, organizationId),
        inArray(pipelineDeals.status, ACTIVE_PIPELINE_DEAL_STATUSES),
      ),
    )
    .orderBy(desc(pipelineDeals.updatedAt));
}

export async function getPipelineDealById(dealId: string) {
  const organizationId = await getCurrentOrganizationId();
  const [deal] = await db
    .select()
    .from(pipelineDeals)
    .where(
      and(
        eq(pipelineDeals.id, dealId),
        eq(pipelineDeals.organizationId, organizationId),
      ),
    )
    .limit(1);

  return deal ?? null;
}

export async function getPipelineDealsForClient(clientId: string) {
  const organizationId = await getCurrentOrganizationId();

  return db
    .select()
    .from(pipelineDeals)
    .where(
      and(
        eq(pipelineDeals.clientId, clientId),
        eq(pipelineDeals.organizationId, organizationId),
      ),
    )
    .orderBy(desc(pipelineDeals.updatedAt));
}

export async function createPipelineDeal(input: PipelineDealInput) {
  const organizationId = await getCurrentOrganizationId();
  const title = input.title.trim();
  if (!title) throw new Error("Podaj nazwę projektu");

  const client = await getClientById(input.clientId);
  if (!client) throw new Error("Nie znaleziono klienta");

  const [deal] = await db
    .insert(pipelineDeals)
    .values({
      organizationId,
      clientId: input.clientId,
      title,
      status: input.status ?? "new",
      projectValuePln: input.projectValuePln ?? null,
      source: input.source ?? "cold_call",
      nextFollowUpAt: input.nextFollowUpAt ?? null,
    })
    .returning();

  revalidateDashboard();
  return deal;
}

export type SilentCreateDealInput = {
  name: string;
  title?: string;
  status?: PipelineDealStatus;
  clientId?: string;
};

export type SilentCreateDealResult =
  | { ok: true; clientId: string; dealId: string }
  | {
      ok: false;
      reason: "pick_required";
      matches: Awaited<ReturnType<typeof searchClients>>;
    };

/**
 * Smart Input flow: pick existing client or silent-create when no fuzzy match.
 * Option A — Enter blocked when similar client exists (pick_required).
 */
export async function silentCreatePipelineDeal(
  input: SilentCreateDealInput,
): Promise<SilentCreateDealResult> {
  const name = input.name.trim();
  if (!name) throw new Error("Podaj nazwę");

  let clientId = input.clientId;

  if (!clientId) {
    const resolution = await resolveClientForCreation(name);
    if (resolution.action === "pick_required") {
      return { ok: false, reason: "pick_required", matches: resolution.matches };
    }

    const client = await createClient({ name, company: name });
    clientId = client.id;
  } else {
    const client = await getClientById(clientId);
    if (!client) throw new Error("Nie znaleziono klienta");
  }

  const deal = await createPipelineDeal({
    clientId,
    title: input.title?.trim() || name,
    status: input.status,
  });

  return { ok: true, clientId, dealId: deal.id };
}

export async function updatePipelineDeal(
  dealId: string,
  input: Partial<PipelineDealInput>,
) {
  const organizationId = await getCurrentOrganizationId();

  const [deal] = await db
    .update(pipelineDeals)
    .set({
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.projectValuePln !== undefined
        ? { projectValuePln: input.projectValuePln }
        : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.nextFollowUpAt !== undefined
        ? { nextFollowUpAt: input.nextFollowUpAt }
        : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(pipelineDeals.id, dealId),
        eq(pipelineDeals.organizationId, organizationId),
      ),
    )
    .returning();

  revalidateDashboard();
  return deal ?? null;
}

export async function closePipelineDeal(
  dealId: string,
  status: "closed_won" | "closed_lost",
) {
  const organizationId = await getCurrentOrganizationId();
  const now = new Date();

  const [deal] = await db
    .update(pipelineDeals)
    .set({
      status,
      closedAt: now,
      nextFollowUpAt: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(pipelineDeals.id, dealId),
        eq(pipelineDeals.organizationId, organizationId),
        notInArray(pipelineDeals.status, CLOSED_PIPELINE_DEAL_STATUSES),
      ),
    )
    .returning();

  if (!deal) return null;

  const message =
    status === "closed_won"
      ? `Zakończono projekt ${deal.title}`
      : `Zakończono współpracę przy projekcie ${deal.title}`;

  await addSystemNote(deal.clientId, message, {
    dealId: deal.id,
    event: status,
    dealTitle: deal.title,
  });

  revalidateDashboard();
  return deal;
}

export async function updatePipelineDealStatus(
  dealId: string,
  status: PipelineDealStatus,
) {
  if (status === "closed_won" || status === "closed_lost") {
    return closePipelineDeal(dealId, status);
  }

  return updatePipelineDeal(dealId, { status });
}
