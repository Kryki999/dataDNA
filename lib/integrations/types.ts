export type IntegrationProviderId =
  | "stripe"
  | "shopify"
  | "media-dna"
  | "habits-dragons"
  | "x"
  | "meta"
  | "youtube"
  | "tiktok";

export type SyncResult = {
  provider: IntegrationProviderId;
  syncedAt: Date;
  metricsUpdated: number;
};

export type WebhookContext = {
  organizationId: string;
  provider: IntegrationProviderId;
  externalId: string;
  eventType: string;
  payload: Record<string, unknown>;
};

export interface IntegrationModule {
  provider: IntegrationProviderId;
  syncMetrics: (organizationId: string) => Promise<SyncResult>;
  handleWebhook: (context: WebhookContext) => Promise<void>;
}

export type MetricPayload = {
  coldCalls?: number;
  xImpressions?: number;
  metaClicks?: number;
  revenuePln?: number;
};
