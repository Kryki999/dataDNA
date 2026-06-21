export * from "./enums";
export * from "./organizations";
export * from "./leads";
export * from "./activities";
export * from "./deals";
export * from "./integrations";
export * from "./webhooks";
export * from "./calendar";
export * from "./project-tasks";

import { organizations, users } from "./organizations";
import { leadNotes, leads } from "./leads";
import { activityLogs, reachMetrics } from "./activities";
import { deals } from "./deals";
import { integrations } from "./integrations";
import { webhookEvents } from "./webhooks";
import { calendarEvents } from "./calendar";
import { projectTasks } from "./project-tasks";

export const schema = {
  organizations,
  users,
  leads,
  leadNotes,
  activityLogs,
  reachMetrics,
  deals,
  integrations,
  webhookEvents,
  calendarEvents,
  projectTasks,
};
