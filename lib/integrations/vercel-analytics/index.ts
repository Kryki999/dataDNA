import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { integrations } from "@/lib/db/schema";
import { upsertReachMetric } from "@/lib/actions/reach-sync";
import type { IntegrationModule, WebhookContext } from "../types";
import { getTodayDateKey, toWarsawDateKey } from "@/lib/timezone";
import { getVercelDrainSecret } from "@/lib/integrations/credentials";

export type VercelAnalyticsEvent = {
  schema?: string;
  eventType?: string;
  timestamp?: number;
  sessionId?: number;
  deviceId?: number;
  path?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
};

const PAID_MEDIUMS = new Set(["cpc", "ppc", "paid", "paid_social"]);
const PAID_SOURCES = new Set(["facebook", "instagram", "meta", "fb", "ig"]);

type VisitorStore = Record<string, string[]>;

export function classifyVercelTraffic(
  event: VercelAnalyticsEvent,
): "paid" | "organic" {
  const medium = event.utm_medium?.toLowerCase();
  const source = event.utm_source?.toLowerCase();

  if (medium && PAID_MEDIUMS.has(medium)) return "paid";
  if (source && PAID_SOURCES.has(source) && medium !== "organic") return "paid";
  return "organic";
}

function eventDateKey(timestamp?: number): string {
  if (!timestamp) return getTodayDateKey();
  return toWarsawDateKey(new Date(timestamp));
}

export async function verifyVercelDrainSecret(
  organizationId: string,
  secret: string,
): Promise<boolean> {
  const stored = await getVercelDrainSecret(organizationId);
  return stored === secret;
}

async function loadVisitorStore(
  organizationId: string,
): Promise<VisitorStore> {
  const [row] = await db
    .select({ metadata: integrations.metadata })
    .from(integrations)
    .where(
      and(
        eq(integrations.organizationId, organizationId),
        eq(integrations.provider, "vercel-analytics"),
      ),
    )
    .limit(1);

  const meta = row?.metadata as Record<string, unknown> | null;
  const store = meta?.visitorSessions;
  if (store && typeof store === "object" && !Array.isArray(store)) {
    return store as VisitorStore;
  }
  return {};
}

async function saveVisitorStore(
  organizationId: string,
  store: VisitorStore,
) {
  const [row] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.organizationId, organizationId),
        eq(integrations.provider, "vercel-analytics"),
      ),
    )
    .limit(1);

  if (!row) return;

  await db
    .update(integrations)
    .set({
      metadata: { ...((row.metadata as object) ?? {}), visitorSessions: store },
      lastSyncAt: new Date(),
      status: "connected",
      updatedAt: new Date(),
    })
    .where(eq(integrations.id, row.id));
}

export async function processVercelAnalyticsEvents(
  organizationId: string,
  events: VercelAnalyticsEvent[],
) {
  const visitorStore = await loadVisitorStore(organizationId);

  for (const event of events) {
    if (event.eventType !== "pageview") continue;

    const trafficType = classifyVercelTraffic(event);
    const dateKey = eventDateKey(event.timestamp);

    await upsertReachMetric(
      organizationId,
      dateKey,
      {
        channel: "website",
        trafficType,
        metric: "pageviews",
        value: 1,
      },
      "add",
      "integration",
    );

    const storeKey = `${dateKey}:${trafficType}`;
    const sessionId = String(
      event.sessionId ?? event.deviceId ?? crypto.randomUUID(),
    );
    const existing = new Set(visitorStore[storeKey] ?? []);
    existing.add(sessionId);
    visitorStore[storeKey] = [...existing];

    await upsertReachMetric(
      organizationId,
      dateKey,
      {
        channel: "website",
        trafficType,
        metric: "visitors",
        value: existing.size,
      },
      "set",
      "integration",
    );
  }

  await saveVisitorStore(organizationId, visitorStore);
}

export const vercelAnalyticsIntegration: IntegrationModule = {
  provider: "vercel-analytics",
  syncMetrics: async () => ({
    provider: "vercel-analytics",
    syncedAt: new Date(),
    metricsUpdated: 0,
  }),
  handleWebhook: async (context: WebhookContext) => {
    const events = Array.isArray(context.payload)
      ? (context.payload as VercelAnalyticsEvent[])
      : [context.payload as unknown as VercelAnalyticsEvent];

    await processVercelAnalyticsEvents(context.organizationId, events);
  },
};
