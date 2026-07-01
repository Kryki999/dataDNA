/**
 * KOR schema migration: pipeline_deal_id on calendar_events, enabled_modules on organizations.
 * npx tsx scripts/migrate-kor.ts
 */
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { normalizePgConnectionString } from "../lib/db/connection-string";

config({ path: ".env.local" });

const rawUrl = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: normalizePgConnectionString(rawUrl),
});
const db = drizzle(pool);

async function main() {
  console.log("KOR migration starting…");

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

  await db.execute(sql`
    ALTER TABLE organizations
    ALTER COLUMN enabled_modules SET DEFAULT '["baza","klienci","kalendarz","profil","zasiegi","zyski"]'::jsonb
  `);

  console.log("KOR migration complete.");
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
