import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { clients } from "./clients";
import { pipelineDeals } from "./pipeline-deals";
import { clientNoteTypeEnum } from "./enums";

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id").references(() => pipelineDeals.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    type: clientNoteTypeEnum("type").notNull().default("user"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notes_client_created_idx").on(table.clientId, table.createdAt),
    index("notes_org_client_idx").on(table.organizationId, table.clientId),
  ],
);
