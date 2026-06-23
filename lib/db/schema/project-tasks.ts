import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { leads } from "./leads";
import { pipelineDeals } from "./pipeline-deals";
import { projectTaskStageEnum } from "./enums";

export const projectTasks = pgTable(
  "project_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    pipelineDealId: uuid("pipeline_deal_id").references(
      () => pipelineDeals.id,
      { onDelete: "cascade" },
    ),
    title: text("title").notNull(),
    description: text("description"),
    stage: projectTaskStageEnum("stage").notNull().default("todo"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("project_tasks_lead_stage_idx").on(
      table.leadId,
      table.stage,
      table.sortOrder,
    ),
    index("project_tasks_pipeline_deal_idx").on(table.pipelineDealId),
  ],
);
