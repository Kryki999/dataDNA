import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { planEnum, userRoleEnum } from "./enums";

const DEFAULT_ENABLED_MODULES_JSON = [
  "baza",
  "klienci",
  "kalendarz",
  "profil",
  "zasiegi",
  "zyski",
] as const;

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: planEnum("plan").notNull().default("personal"),
  enabledModules: jsonb("enabled_modules")
    .$type<readonly string[]>()
    .notNull()
    .default([...DEFAULT_ENABLED_MODULES_JSON]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("owner"),
  displayName: text("display_name"),
  username: text("username").unique(),
  bio: text("bio").notNull().default(""),
  avatarUrl: text("avatar_url"),
  profilePublic: boolean("profile_public").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
