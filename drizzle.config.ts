import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { normalizePgConnectionString } from "./lib/db/connection-string";

config({ path: ".env.local" });

const rawUrl = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "./lib/db/schema/index.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: rawUrl ? normalizePgConnectionString(rawUrl) : "",
  },
});
