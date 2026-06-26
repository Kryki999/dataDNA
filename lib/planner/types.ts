import type {
  calendarEventAttachments,
  calendarEvents,
  clients,
} from "@/lib/db/schema";

export type PlannerEventRow = typeof calendarEvents.$inferSelect;
export type PlannerAttachmentRow = typeof calendarEventAttachments.$inferSelect;
export type PlannerClientOption = Pick<
  typeof clients.$inferSelect,
  "id" | "name" | "company" | "cardColor"
>;

/** @deprecated Use PlannerClientOption */
export type PlannerLeadOption = PlannerClientOption;

export type PlannerEventWithMeta = PlannerEventRow & {
  clientName: string | null;
  clientCompany: string | null;
  clientCardColor: string | null;
  attachments: PlannerAttachmentRow[];
};

export type PlannerIcon = PlannerEventRow["icon"];

export const PLANNER_ICONS = [
  "task",
  "phone",
  "follow_up",
  "design",
  "meeting",
] as const satisfies readonly PlannerIcon[];

export const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000;
export const SLOT_MINUTES = 30;
export const GRID_START_HOUR = 7;
export const GRID_END_HOUR = 21;
export const HOUR_HEIGHT_PX = 64;
