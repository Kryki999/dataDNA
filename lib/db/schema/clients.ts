import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    company: text("company"),
    phone: text("phone"),
    email: text("email"),
    coverUrl: text("cover_url"),
    cardColor: text("card_color"),
    tags: text("tags").array().notNull().default([]),
    isArchived: boolean("is_archived").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    migratedFromLeadId: uuid("migrated_from_lead_id").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("clients_org_updated_idx").on(
      table.organizationId,
      table.updatedAt,
    ),
    index("clients_org_archived_idx").on(
      table.organizationId,
      table.isArchived,
    ),
  ],
);
