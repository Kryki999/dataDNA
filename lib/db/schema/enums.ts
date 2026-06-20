import { pgEnum } from "drizzle-orm/pg-core";

export const leadPipelineStageEnum = pgEnum("lead_pipeline_stage", [
  "new",
  "contact_made",
  "demo_sent",
  "negotiation",
  "won",
  "lost",
]);
export const leadSourceEnum = pgEnum("lead_source", [
  "cold_call",
  "x",
  "meta",
  "other",
]);
export const planEnum = pgEnum("plan", ["personal", "pro", "enterprise"]);
export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "member"]);
export const temperatureEnum = pgEnum("temperature", ["cold", "warm", "hot"]);
export const activityTypeEnum = pgEnum("activity_type", [
  "cold_call",
  "x_impression",
  "meta_click",
  "deal_closed",
  "custom",
]);
export const activitySourceEnum = pgEnum("activity_source", [
  "manual",
  "integration",
]);
export const dealSourceEnum = pgEnum("deal_source", [
  "manual",
  "stripe",
  "shopify",
  "other",
]);
export const integrationStatusEnum = pgEnum("integration_status", [
  "disconnected",
  "connected",
  "error",
]);
export const webhookStatusEnum = pgEnum("webhook_status", [
  "received",
  "processed",
  "failed",
]);
export const calendarEventStatusEnum = pgEnum("calendar_event_status", [
  "pending",
  "completed",
  "cancelled",
]);
export const calendarEventSourceEnum = pgEnum("calendar_event_source", [
  "crm",
  "manual",
  "archive_reactivation",
]);
