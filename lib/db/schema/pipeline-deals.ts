import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { clients } from "./clients";
import { leadSourceEnum, pipelineDealStatusEnum } from "./enums";

export const pipelineDeals = pgTable(
  "pipeline_deals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: pipelineDealStatusEnum("status").notNull().default("new"),
    projectValuePln: integer("project_value_pln"),
    source: leadSourceEnum("source").notNull().default("cold_call"),
    nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("pipeline_deals_org_status_updated_idx").on(
      table.organizationId,
      table.status,
      table.updatedAt,
    ),
    index("pipeline_deals_client_idx").on(table.clientId),
  ],
);
