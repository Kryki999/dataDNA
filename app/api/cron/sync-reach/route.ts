import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { integrations } from "@/lib/db/schema";
import { getIntegration } from "@/lib/integrations/registry";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const connected = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.status, "connected"),
          eq(integrations.provider, "meta"),
        ),
      );

    const results = [];
    for (const row of connected) {
      const module = getIntegration(row.provider);
      if (!module) continue;
      try {
        const result = await module.syncMetrics(row.organizationId);
        await db
          .update(integrations)
          .set({ lastSyncAt: result.syncedAt, status: "connected" })
          .where(eq(integrations.id, row.id));
        results.push({ org: row.organizationId, ...result });
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

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error("Cron sync-reach error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}
