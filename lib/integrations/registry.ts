import type { IntegrationModule, IntegrationProviderId } from "./types";
import { stripeIntegration } from "./stripe";
import { metaIntegration } from "./meta";
import { vercelAnalyticsIntegration } from "./vercel-analytics";
import {
  shopifyIntegration,
  mediaDnaIntegration,
  habitsDragonsIntegration,
  xIntegration,
  youtubeIntegration,
  tiktokIntegration,
} from "./stubs";

const modules: IntegrationModule[] = [
  stripeIntegration,
  shopifyIntegration,
  mediaDnaIntegration,
  habitsDragonsIntegration,
  xIntegration,
  metaIntegration,
  vercelAnalyticsIntegration,
  youtubeIntegration,
  tiktokIntegration,
];

const registry = new Map<IntegrationProviderId, IntegrationModule>(
  modules.map((module) => [module.provider, module]),
);

export function getIntegration(
  provider: string,
): IntegrationModule | undefined {
  return registry.get(provider as IntegrationProviderId);
}

export function listIntegrations(): IntegrationModule[] {
  return modules;
}
