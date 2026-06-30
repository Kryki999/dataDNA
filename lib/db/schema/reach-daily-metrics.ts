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
import {
  activitySourceEnum,
  reachChannelEnum,
  reachMetricEnum,
  reachTrafficTypeEnum,
} from "./enums";

export const reachDailyMetrics = pgTable(
  "reach_daily_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    dateKey: text("date_key").notNull(),
    channel: reachChannelEnum("channel").notNull(),
    trafficType: reachTrafficTypeEnum("traffic_type").notNull(),
    metric: reachMetricEnum("metric").notNull(),
    value: integer("value").notNull().default(0),
    source: activitySourceEnum("source").notNull().default("manual"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("reach_daily_metrics_unique").on(
      table.organizationId,
      table.dateKey,
      table.channel,
      table.trafficType,
      table.metric,
    ),
    index("reach_daily_metrics_org_date_idx").on(
      table.organizationId,
      table.dateKey,
    ),
  ],
);
