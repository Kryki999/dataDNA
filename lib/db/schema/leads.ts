import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import {
  leadPipelineStageEnum,
  leadSourceEnum,
  temperatureEnum,
} from "./enums";

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    company: text("company"),
    phone: text("phone"),
    email: text("email"),
    temperature: temperatureEnum("temperature").notNull().default("cold"),
    pipelineStage: leadPipelineStageEnum("pipeline_stage")
      .notNull()
      .default("new"),
    projectValuePln: integer("project_value_pln"),
    source: leadSourceEnum("source").notNull().default("cold_call"),
    notes: text("notes").notNull().default(""),
    tags: text("tags").array().notNull().default([]),
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
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
    index("leads_org_stage_updated_idx").on(
      table.organizationId,
      table.pipelineStage,
      table.updatedAt,
    ),
  ],
);

export const leadNotes = pgTable(
  "lead_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("lead_notes_lead_created_idx").on(table.leadId, table.createdAt),
  ],
);
