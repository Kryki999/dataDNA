export * from "./enums";
export * from "./organizations";
export * from "./leads";
export * from "./activities";
export * from "./deals";
export * from "./integrations";
export * from "./webhooks";

import { organizations, users } from "./organizations";
import { leads } from "./leads";
import { activityLogs, reachMetrics } from "./activities";
import { deals } from "./deals";
import { integrations } from "./integrations";
import { webhookEvents } from "./webhooks";

export const schema = {
  organizations,
  users,
  leads,
  activityLogs,
  reachMetrics,
  deals,
  integrations,
  webhookEvents,
};
