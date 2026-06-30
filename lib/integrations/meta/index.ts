import type { IntegrationModule } from "../types";
import { getMetaCredentials } from "@/lib/integrations/credentials";
import { upsertReachMetricsBatch } from "@/lib/actions/reach-sync";

const META_GRAPH = "https://graph.facebook.com/v21.0";

type InsightRow = {
  date_start: string;
  clicks?: string;
  impressions?: string;
  reach?: string;
  publisher_platform?: string;
};

async function fetchInsights(
  accessToken: string,
  adAccountId: string,
): Promise<InsightRow[]> {
  const accountId = adAccountId.startsWith("act_")
    ? adAccountId
    : `act_${adAccountId}`;
  const url = new URL(`${META_GRAPH}/${accountId}/insights`);
  url.searchParams.set("fields", "clicks,impressions,reach");
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("date_preset", "last_30d");
  url.searchParams.set("breakdowns", "publisher_platform");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString());
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Meta Ads API: ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as { data?: InsightRow[] };
  return data.data ?? [];
}

async function fetchPageInsights(
  accessToken: string,
  pageId: string,
): Promise<Array<{ date: string; reach: number; impressions: number }>> {
  const url = new URL(`${META_GRAPH}/${pageId}/insights`);
  url.searchParams.set("metric", "page_impressions,page_post_engagements");
  url.searchParams.set("period", "day");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString());
  if (!response.ok) return [];

  const data = (await response.json()) as {
    data?: Array<{
      name: string;
      values: Array<{ value: number; end_time: string }>;
    }>;
  };

  const impressions =
    data.data?.find((d) => d.name === "page_impressions")?.values ?? [];
  const reachMap = new Map<string, number>();

  for (const point of impressions) {
    const date = point.end_time.slice(0, 10);
    reachMap.set(date, (reachMap.get(date) ?? 0) + Number(point.value));
  }

  return [...reachMap.entries()].map(([date, impressionsValue]) => ({
    date,
    reach: impressionsValue,
    impressions: impressionsValue,
  }));
}

async function fetchInstagramInsights(
  accessToken: string,
  igUserId: string,
): Promise<Array<{ date: string; reach: number; impressions: number }>> {
  const url = new URL(`${META_GRAPH}/${igUserId}/insights`);
  url.searchParams.set("metric", "reach,impressions");
  url.searchParams.set("period", "day");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString());
  if (!response.ok) return [];

  const data = (await response.json()) as {
    data?: Array<{
      name: string;
      values: Array<{ value: number; end_time: string }>;
    }>;
  };

  const reachValues =
    data.data?.find((d) => d.name === "reach")?.values ?? [];
  const impressionValues =
    data.data?.find((d) => d.name === "impressions")?.values ?? [];

  const byDate = new Map<string, { reach: number; impressions: number }>();

  for (const point of reachValues) {
    const date = point.end_time.slice(0, 10);
    const entry = byDate.get(date) ?? { reach: 0, impressions: 0 };
    entry.reach = Number(point.value);
    byDate.set(date, entry);
  }

  for (const point of impressionValues) {
    const date = point.end_time.slice(0, 10);
    const entry = byDate.get(date) ?? { reach: 0, impressions: 0 };
    entry.impressions = Number(point.value);
    byDate.set(date, entry);
  }

  return [...byDate.entries()].map(([date, values]) => ({
    date,
    ...values,
  }));
}

export async function syncMetaPaidAds(organizationId: string) {
  const creds = await getMetaCredentials(organizationId);
  if (!creds) return 0;

  const insights = await fetchInsights(creds.accessToken, creds.adAccountId);
  const entries: Parameters<typeof upsertReachMetricsBatch>[1] = [];

  for (const row of insights) {
    const platform = row.publisher_platform;
    if (platform !== "facebook" && platform !== "instagram") continue;

    const channel = platform === "facebook" ? "facebook" : "instagram";
    const dateKey = row.date_start;

    if (row.clicks) {
      entries.push({
        dateKey,
        channel,
        trafficType: "paid",
        metric: "clicks",
        value: Number(row.clicks),
      });
    }
    if (row.impressions) {
      entries.push({
        dateKey,
        channel,
        trafficType: "paid",
        metric: "impressions",
        value: Number(row.impressions),
      });
    }
  }

  if (entries.length > 0) {
    await upsertReachMetricsBatch(organizationId, entries);
  }
  return entries.length;
}

export async function syncMetaOrganic(organizationId: string) {
  const creds = await getMetaCredentials(organizationId);
  if (!creds) return 0;

  const entries: Parameters<typeof upsertReachMetricsBatch>[1] = [];

  if (creds.pageId) {
    const pageData = await fetchPageInsights(creds.accessToken, creds.pageId);
    for (const row of pageData) {
      entries.push({
        dateKey: row.date,
        channel: "facebook",
        trafficType: "organic",
        metric: "reach",
        value: row.reach,
      });
      entries.push({
        dateKey: row.date,
        channel: "facebook",
        trafficType: "organic",
        metric: "impressions",
        value: row.impressions,
      });
    }
  }

  if (creds.igUserId) {
    const igData = await fetchInstagramInsights(
      creds.accessToken,
      creds.igUserId,
    );
    for (const row of igData) {
      entries.push({
        dateKey: row.date,
        channel: "instagram",
        trafficType: "organic",
        metric: "reach",
        value: row.reach,
      });
      entries.push({
        dateKey: row.date,
        channel: "instagram",
        trafficType: "organic",
        metric: "impressions",
        value: row.impressions,
      });
    }
  }

  if (entries.length > 0) {
    await upsertReachMetricsBatch(organizationId, entries);
  }
  return entries.length;
}

export const metaIntegration: IntegrationModule = {
  provider: "meta",
  syncMetrics: async (organizationId) => {
    const paid = await syncMetaPaidAds(organizationId);
    const organic = await syncMetaOrganic(organizationId);
    return {
      provider: "meta",
      syncedAt: new Date(),
      metricsUpdated: paid + organic,
    };
  },
  handleWebhook: async () => {},
};
