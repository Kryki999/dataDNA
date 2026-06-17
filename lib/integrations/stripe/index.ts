import type { IntegrationModule } from "../types";

export const stripeIntegration: IntegrationModule = {
  provider: "stripe",
  syncMetrics: async () => ({
    provider: "stripe",
    syncedAt: new Date(),
    metricsUpdated: 0,
  }),
  handleWebhook: async ({ organizationId, payload }) => {
    // Phase 2: map charge.succeeded to deals + Boss Fight
    void organizationId;
    void payload;
  },
};
