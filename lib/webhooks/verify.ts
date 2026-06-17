import type { WebhookContext } from "@/lib/integrations/types";

export type VerifiedWebhook = WebhookContext & {
  rawBody: string;
};

export async function verifyWebhook(
  provider: string,
  request: Request,
  rawBody: string,
): Promise<VerifiedWebhook> {
  const organizationId = process.env.WEBHOOK_ORG_ID;
  if (!organizationId) {
    throw new Error("WEBHOOK_ORG_ID is not configured");
  }

  if (provider === "stripe") {
    const signature = request.headers.get("stripe-signature");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (secret && signature) {
      // Phase 2: use stripe.webhooks.constructEvent(rawBody, signature, secret)
      void signature;
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON payload");
  }

  const externalId =
    (payload.id as string | undefined) ??
    `${provider}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const eventType =
    (payload.type as string | undefined) ??
    (payload.event as string | undefined) ??
    "unknown";

  return {
    organizationId,
    provider: provider as VerifiedWebhook["provider"],
    externalId,
    eventType,
    payload,
    rawBody,
  };
}
