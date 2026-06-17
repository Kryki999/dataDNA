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
import { leads } from "./leads";
import { dealSourceEnum } from "./enums";

export const deals = pgTable(
  "deals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    amountPln: integer("amount_pln").notNull(),
    description: text("description"),
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
    index("deals_org_closed_idx").on(table.organizationId, table.closedAt),
    uniqueIndex("deals_org_source_external_unique").on(
      table.organizationId,
      table.source,
      table.externalId,
    ),
  ],
);
