import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { leads } from "./leads";
import { activitySourceEnum, activityTypeEnum } from "./enums";

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: activityTypeEnum("type").notNull(),
    source: activitySourceEnum("source").notNull().default("manual"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (table) => [
    index("activity_logs_org_occurred_idx").on(
      table.organizationId,
      table.occurredAt,
    ),
  ],
);

export const reachMetrics = pgTable(
  "reach_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    dateKey: text("date_key").notNull(),
    coldCalls: integer("cold_calls").notNull().default(0),
    xImpressions: integer("x_impressions").notNull().default(0),
    metaClicks: integer("meta_clicks").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("reach_metrics_org_date_unique").on(
      table.organizationId,
      table.dateKey,
    ),
  ],
);
