import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { leads } from "./leads";
import {
  calendarEventSourceEnum,
  calendarEventStatusEnum,
} from "./enums";

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    status: calendarEventStatusEnum("status").notNull().default("pending"),
    source: calendarEventSourceEnum("source").notNull().default("crm"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("calendar_events_org_due_idx").on(
      table.organizationId,
      table.dueAt,
    ),
    index("calendar_events_lead_idx").on(table.leadId),
  ],
);
