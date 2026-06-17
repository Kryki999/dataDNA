import type { IntegrationModule } from "./types";

const stub = (provider: IntegrationModule["provider"]): IntegrationModule => ({
  provider,
  syncMetrics: async () => ({
    provider,
    syncedAt: new Date(),
    metricsUpdated: 0,
  }),
  handleWebhook: async () => {},
});

export const shopifyIntegration = stub("shopify");
export const mediaDnaIntegration = stub("media-dna");
export const habitsDragonsIntegration = stub("habits-dragons");
export const xIntegration = stub("x");
export const metaIntegration = stub("meta");
export const youtubeIntegration = stub("youtube");
export const tiktokIntegration = stub("tiktok");
