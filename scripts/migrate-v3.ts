/**
 * One-time migration: leads → clients + pipeline_deals (idempotent via migrated_from_lead_id).
 * npx tsx scripts/migrate-v3.ts
 */
import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { normalizePgConnectionString } from "../lib/db/connection-string";
import {
  clients,
  leadNotes,
  leads,
  notes,
  pipelineDeals,
} from "../lib/db/schema";

config({ path: ".env.local" });

const rawUrl = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: normalizePgConnectionString(rawUrl),
});
const db = drizzle(pool);

type PipelineDealStatus =
  | "new"
  | "contact_made"
  | "demo_sent"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

function mapStage(stage: string): PipelineDealStatus {
  if (stage === "won") return "closed_won";
  if (stage === "lost") return "closed_lost";
  return stage as PipelineDealStatus;
}

async function main() {
  console.log("V3.1 migration starting…");

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE deals RENAME TO revenue_records;
    EXCEPTION WHEN undefined_table THEN NULL;
    END $$;
  `);

  await db.execute(sql`
    ALTER TABLE revenue_records
      ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS pipeline_deal_id uuid REFERENCES pipeline_deals(id) ON DELETE SET NULL;
  `);

  await db.execute(sql`
    ALTER TABLE clients
      ADD COLUMN IF NOT EXISTS migrated_from_lead_id uuid UNIQUE;
  `);

  const allLeads = await db.select().from(leads).orderBy(leads.createdAt);
  let migrated = 0;

  for (const lead of allLeads) {
    const [existingClient] = await db
      .select()
      .from(clients)
      .where(eq(clients.migratedFromLeadId, lead.id))
      .limit(1);

    let clientId: string;
    let pipelineDealId: string | undefined;

    if (existingClient) {
      clientId = existingClient.id;
      const [existingDeal] = await db
        .select()
        .from(pipelineDeals)
        .where(eq(pipelineDeals.clientId, clientId))
        .limit(1);
      pipelineDealId = existingDeal?.id;
    } else {
      const [client] = await db
        .insert(clients)
        .values({
          organizationId: lead.organizationId,
          name: lead.name.trim(),
          company: lead.company,
          phone: lead.phone,
          email: lead.email,
          tags: lead.tags,
          migratedFromLeadId: lead.id,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        })
        .returning();
      clientId = client!.id;
      migrated++;
    }

    if (!pipelineDealId) {
      const title = lead.company?.trim() || lead.name.trim();
      const [deal] = await db
        .insert(pipelineDeals)
        .values({
          organizationId: lead.organizationId,
          clientId,
          title,
          status: mapStage(lead.pipelineStage),
          projectValuePln: lead.projectValuePln,
          source: lead.source,
          nextFollowUpAt: lead.nextFollowUpAt,
          closedAt: lead.closedAt,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        })
        .returning();
      pipelineDealId = deal!.id;
    }

    const leadNoteRows = await db
      .select()
      .from(leadNotes)
      .where(eq(leadNotes.leadId, lead.id));

    for (const ln of leadNoteRows) {
      const [dup] = await db
        .select({ id: notes.id })
        .from(notes)
        .where(
          sql`${notes.clientId} = ${clientId} AND ${notes.body} = ${ln.body} AND ${notes.createdAt} = ${ln.createdAt}`,
        )
        .limit(1);
      if (!dup) {
        await db.insert(notes).values({
          organizationId: ln.organizationId,
          clientId,
          dealId: pipelineDealId,
          body: ln.body,
          type: "user",
          createdAt: ln.createdAt,
        });
      }
    }

    const legacy = lead.notes?.trim();
    if (legacy) {
      const [dup] = await db
        .select({ id: notes.id })
        .from(notes)
        .where(sql`${notes.clientId} = ${clientId} AND ${notes.body} = ${legacy}`)
        .limit(1);
      if (!dup) {
        await db.insert(notes).values({
          organizationId: lead.organizationId,
          clientId,
          dealId: pipelineDealId,
          body: legacy,
          type: "user",
        });
      }
    }

    await db.execute(sql`
      UPDATE calendar_events SET client_id = ${clientId}
      WHERE lead_id = ${lead.id} AND client_id IS NULL
    `);

    await db.execute(sql`
      UPDATE project_tasks SET pipeline_deal_id = ${pipelineDealId}
      WHERE lead_id = ${lead.id} AND pipeline_deal_id IS NULL
    `);

    await db.execute(sql`
      UPDATE revenue_records
      SET client_id = ${clientId}, pipeline_deal_id = ${pipelineDealId}
      WHERE lead_id = ${lead.id}
    `);
  }

  console.log(`Done. Newly migrated leads: ${migrated}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
