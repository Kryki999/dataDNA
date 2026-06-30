import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { integrations } from "@/lib/db/schema";
import { decryptCredentials } from "@/lib/integrations/crypto";
import type { MetaCredentials } from "@/lib/integrations/types";

export async function getMetaCredentials(
  organizationId: string,
): Promise<MetaCredentials | null> {
  const [row] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.organizationId, organizationId),
        eq(integrations.provider, "meta"),
      ),
    )
    .limit(1);

  if (!row?.credentials || typeof row.credentials !== "object") return null;
  const creds = row.credentials as Record<string, unknown>;
  if (typeof creds.encrypted !== "string") return null;
  const decrypted = decryptCredentials(creds.encrypted);
  if (typeof decrypted.accessToken !== "string") return null;
  if (typeof decrypted.adAccountId !== "string") return null;
  return {
    accessToken: decrypted.accessToken,
    adAccountId: decrypted.adAccountId,
    pageId:
      typeof decrypted.pageId === "string" ? decrypted.pageId : undefined,
    igUserId:
      typeof decrypted.igUserId === "string" ? decrypted.igUserId : undefined,
  };
}

export async function getVercelDrainSecret(
  organizationId: string,
): Promise<string | null> {
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

  if (!row?.credentials || typeof row.credentials !== "object") return null;
  const creds = row.credentials as Record<string, unknown>;
  if (typeof creds.encrypted !== "string") return null;
  try {
    const decrypted = decryptCredentials(creds.encrypted);
    return typeof decrypted.drainSecret === "string"
      ? decrypted.drainSecret
      : null;
  } catch {
    return null;
  }
}
