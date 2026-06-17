import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { webhookEvents } from "@/lib/db/schema";
import { getIntegration } from "@/lib/integrations/registry";
import type { VerifiedWebhook } from "./verify";

export async function dispatchWebhook(event: VerifiedWebhook) {
  const [inserted] = await db
    .insert(webhookEvents)
    .values({
      organizationId: event.organizationId,
      provider: event.provider,
      externalId: event.externalId,
      eventType: event.eventType,
      payload: event.payload,
      status: "received",
    })
    .onConflictDoNothing({
      target: [
        webhookEvents.organizationId,
        webhookEvents.provider,
        webhookEvents.externalId,
      ],
    })
    .returning({ id: webhookEvents.id });

  if (!inserted) {
    return { processed: false, reason: "duplicate" as const };
  }

  const integration = getIntegration(event.provider);

  try {
    if (integration) {
      await integration.handleWebhook(event);
    }

    await db
      .update(webhookEvents)
      .set({
        status: "processed",
        processedAt: new Date(),
      })
      .where(eq(webhookEvents.id, inserted.id));

    return { processed: true, reason: "ok" as const };
  } catch (error) {
    await db
      .update(webhookEvents)
      .set({ status: "failed", processedAt: new Date() })
      .where(eq(webhookEvents.id, inserted.id));

    throw error;
  }
}

export async function webhookEventExists(
  organizationId: string,
  provider: string,
  externalId: string,
) {
  const [row] = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(
      and(
        eq(webhookEvents.organizationId, organizationId),
        eq(webhookEvents.provider, provider),
        eq(webhookEvents.externalId, externalId),
      ),
    )
    .limit(1);

  return Boolean(row);
}
