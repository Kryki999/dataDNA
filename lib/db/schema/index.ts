export * from "./enums";
export * from "./organizations";
export * from "./leads";
export * from "./clients";
export * from "./pipeline-deals";
export * from "./notes";
export * from "./activities";
export * from "./revenue-records";
export * from "./integrations";
export * from "./webhooks";
export * from "./calendar";
export * from "./calendar-attachments";
export * from "./project-tasks";

/** @deprecated Use revenueRecords — legacy export for gradual migration */
export { revenueRecords as deals } from "./revenue-records";

import { organizations, users } from "./organizations";
import { leadNotes, leads } from "./leads";
import { clients } from "./clients";
import { pipelineDeals } from "./pipeline-deals";
import { notes } from "./notes";
import { activityLogs, reachMetrics } from "./activities";
import { revenueRecords } from "./revenue-records";
import { integrations } from "./integrations";
import { webhookEvents } from "./webhooks";
import { calendarEvents } from "./calendar";
import { calendarEventAttachments } from "./calendar-attachments";
import { projectTasks } from "./project-tasks";

export const schema = {
  organizations,
  users,
  leads,
  leadNotes,
  clients,
  pipelineDeals,
  notes,
  activityLogs,
  reachMetrics,
  revenueRecords,
  integrations,
  webhookEvents,
  calendarEvents,
  calendarEventAttachments,
  projectTasks,
};
