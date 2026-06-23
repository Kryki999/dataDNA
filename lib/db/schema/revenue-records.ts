import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { clients } from "./clients";
import { pipelineDeals } from "./pipeline-deals";
import { leads } from "./leads";
import { dealSourceEnum } from "./enums";

export const revenueRecords = pgTable(
  "revenue_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    amountPln: integer("amount_pln").notNull(),
    description: text("description"),
    clientId: uuid("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    pipelineDealId: uuid("pipeline_deal_id").references(
      () => pipelineDeals.id,
      { onDelete: "set null" },
    ),
    /** @deprecated legacy link — prefer clientId */
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    source: dealSourceEnum("source").notNull().default("manual"),
    externalId: text("external_id"),
    closedAt: timestamp("closed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("revenue_records_org_closed_idx").on(
      table.organizationId,
      table.closedAt,
    ),
    uniqueIndex("revenue_records_org_source_external_unique").on(
      table.organizationId,
      table.source,
      table.externalId,
    ),
  ],
);
