import { pgEnum } from "drizzle-orm/pg-core";

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
