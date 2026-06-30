"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { integrations } from "@/lib/db/schema";
import { getCurrentOrganizationId } from "@/lib/tenant";
import { getIntegration } from "@/lib/integrations/registry";
import {
  decryptCredentials,
  encryptCredentials,
  maskToken,
} from "@/lib/integrations/crypto";
import { getVercelDrainSecret } from "@/lib/integrations/credentials";
import type {
  IntegrationProviderId,
  MetaCredentials,
} from "@/lib/integrations/types";
import type { IntegrationStatusView } from "@/lib/types/reach";
import { revalidateDashboard } from "@/lib/revalidate";

const META_GRAPH = "https://graph.facebook.com/v21.0";

export type IntegrationView = IntegrationStatusView & {
  id: string;
  maskedToken?: string;
  metadata?: Record<string, unknown>;
};

async function getIntegrationRow(organizationId: string, provider: string) {
  const [row] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.organizationId, organizationId),
        eq(integrations.provider, provider),
      ),
    )
    .limit(1);
  return row;
}

export async function getIntegrationStatuses(): Promise<IntegrationView[]> {
  const organizationId = await getCurrentOrganizationId();
  const rows = await db
    .select()
    .from(integrations)
    .where(eq(integrations.organizationId, organizationId));

  const providers: IntegrationProviderId[] = [
    "meta",
    "vercel-analytics",
    "x",
  ];

  return providers.map((provider) => {
    const row = rows.find((r) => r.provider === provider);
    let maskedToken: string | undefined;
    if (row?.credentials && typeof row.credentials === "object") {
      const creds = row.credentials as Record<string, unknown>;
      if (typeof creds.encrypted === "string") {
        try {
          const decrypted = decryptCredentials(creds.encrypted);
          if (typeof decrypted.accessToken === "string") {
            maskedToken = maskToken(decrypted.accessToken);
          }
        } catch {
          maskedToken = undefined;
        }
      }
    }

    return {
      id: row?.id ?? "",
      provider,
      status: row?.status ?? "disconnected",
      lastSyncAt: row?.lastSyncAt ?? null,
      errorMessage:
        typeof row?.metadata?.errorMessage === "string"
          ? row.metadata.errorMessage
          : undefined,
      maskedToken,
      metadata: (row?.metadata as Record<string, unknown>) ?? undefined,
    };
  });
}

export async function getMetaCredentialsForOrg(organizationId: string) {
  const { getMetaCredentials } = await import("@/lib/integrations/credentials");
  return getMetaCredentials(organizationId);
}

export async function validateMetaToken(accessToken: string) {
  const response = await fetch(
    `${META_GRAPH}/me/adaccounts?fields=id,name,account_id&limit=50&access_token=${encodeURIComponent(accessToken)}`,
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Nieprawidłowy token Meta: ${body.slice(0, 120)}`);
  }
  const data = (await response.json()) as {
    data?: Array<{ id: string; name: string; account_id: string }>;
  };
  return data.data ?? [];
}

export async function fetchMetaPages(accessToken: string) {
  const response = await fetch(
    `${META_GRAPH}/me/accounts?fields=id,name,instagram_business_account&limit=50&access_token=${encodeURIComponent(accessToken)}`,
  );
  if (!response.ok) return [];
  const data = (await response.json()) as {
    data?: Array<{
      id: string;
      name: string;
      instagram_business_account?: { id: string };
    }>;
  };
  return data.data ?? [];
}

export async function connectMeta(input: {
  accessToken: string;
  adAccountId: string;
  pageId?: string;
  igUserId?: string;
}) {
  const organizationId = await getCurrentOrganizationId();
  await validateMetaToken(input.accessToken);

  const encrypted = encryptCredentials({
    accessToken: input.accessToken,
    adAccountId: input.adAccountId,
    pageId: input.pageId,
    igUserId: input.igUserId,
  });

  const existing = await getIntegrationRow(organizationId, "meta");

  if (existing) {
    await db
      .update(integrations)
      .set({
        status: "connected",
        credentials: { encrypted },
        metadata: {
          adAccountId: input.adAccountId,
          pageId: input.pageId,
          igUserId: input.igUserId,
        },
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, existing.id));
  } else {
    await db.insert(integrations).values({
      organizationId,
      provider: "meta",
      status: "connected",
      credentials: { encrypted },
      metadata: {
        adAccountId: input.adAccountId,
        pageId: input.pageId,
        igUserId: input.igUserId,
      },
    });
  }

  const module = getIntegration("meta");
  if (module) {
    await module.syncMetrics(organizationId);
  }

  revalidateDashboard();
  revalidatePath("/zasiegi");
}

export async function connectVercelAnalytics() {
  const organizationId = await getCurrentOrganizationId();
  const drainSecret = crypto.randomUUID();
  const encrypted = encryptCredentials({ drainSecret });

  const existing = await getIntegrationRow(organizationId, "vercel-analytics");

  if (existing) {
    await db
      .update(integrations)
      .set({
        status: "connected",
        credentials: { encrypted },
        metadata: { drainSecret },
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, existing.id));
  } else {
    await db.insert(integrations).values({
      organizationId,
      provider: "vercel-analytics",
      status: "connected",
      credentials: { encrypted },
      metadata: { drainSecret },
    });
  }

  revalidateDashboard();
  revalidatePath("/zasiegi");

  return { drainSecret };
}

export async function getVercelDrainInfo() {
  const organizationId = await getCurrentOrganizationId();
  const row = await getIntegrationRow(organizationId, "vercel-analytics");
  const drainSecret = await getVercelDrainSecret(organizationId);
  if (!drainSecret) return null;

  const baseUrl =
    process.env.AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  return {
    webhookUrl: `${baseUrl}/api/webhooks/vercel-analytics?org=${organizationId}&secret=${drainSecret}`,
    drainSecret,
    status: row.status,
    lastSyncAt: row.lastSyncAt,
  };
}

export async function disconnectIntegration(provider: IntegrationProviderId) {
  const organizationId = await getCurrentOrganizationId();
  const existing = await getIntegrationRow(organizationId, provider);
  if (!existing) return;

  await db
    .update(integrations)
    .set({
      status: "disconnected",
      credentials: null,
      metadata: null,
      updatedAt: new Date(),
    })
    .where(eq(integrations.id, existing.id));

  revalidateDashboard();
  revalidatePath("/zasiegi");
}

export async function syncReachIntegration(provider: IntegrationProviderId) {
  const organizationId = await getCurrentOrganizationId();
  const module = getIntegration(provider);
  if (!module) {
    throw new Error(`Nieznany provider: ${provider}`);
  }

  const result = await module.syncMetrics(organizationId);

  await db
    .update(integrations)
    .set({
      lastSyncAt: result.syncedAt,
      status: "connected",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(integrations.organizationId, organizationId),
        eq(integrations.provider, provider),
      ),
    );

  revalidateDashboard();
  revalidatePath("/zasiegi");
  return result;
}

export async function syncAllReachIntegrations() {
  const organizationId = await getCurrentOrganizationId();
  const rows = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.organizationId, organizationId),
        eq(integrations.status, "connected"),
      ),
    );

  const results = [];
  for (const row of rows) {
    const module = getIntegration(row.provider);
    if (!module) continue;
    if (row.provider !== "meta" && row.provider !== "x") continue;
    try {
      const result = await module.syncMetrics(organizationId);
      await db
        .update(integrations)
        .set({ lastSyncAt: result.syncedAt, status: "connected" })
        .where(eq(integrations.id, row.id));
      results.push(result);
    } catch (error) {
      await db
        .update(integrations)
        .set({
          status: "error",
          metadata: {
            errorMessage:
              error instanceof Error ? error.message : "Sync failed",
          },
        })
        .where(eq(integrations.id, row.id));
    }
  }
  return results;
}
