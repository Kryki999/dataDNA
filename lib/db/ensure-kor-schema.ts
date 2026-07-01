import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

let korSchemaReady: Promise<void> | null = null;

/**
 * Idempotent — adds KOR columns if migrate-kor was not run yet.
 */
export function ensureKorSchema(): Promise<void> {
  if (!korSchemaReady) {
    korSchemaReady = (async () => {
      await db.execute(sql`
        ALTER TABLE calendar_events
        ADD COLUMN IF NOT EXISTS pipeline_deal_id uuid
        REFERENCES pipeline_deals(id) ON DELETE SET NULL
      `);

      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS calendar_events_pipeline_deal_idx
        ON calendar_events (pipeline_deal_id)
      `);

      await db.execute(sql`
        ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS enabled_modules jsonb
      `);

      await db.execute(sql`
        UPDATE organizations
        SET enabled_modules = '["baza","klienci","kalendarz","profil","zasiegi","zyski"]'::jsonb
        WHERE enabled_modules IS NULL
      `);
    })().catch((error) => {
      korSchemaReady = null;
      throw error;
    });
  }

  return korSchemaReady;
}
