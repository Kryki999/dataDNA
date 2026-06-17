import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { schema } from "../lib/db/schema";

config({ path: ".env.local" });

async function seed() {
  const connectionString =
    process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const email = process.env.CEO_EMAIL;
  if (!email) {
    throw new Error("CEO_EMAIL is required");
  }

  let passwordHash = process.env.CEO_PASSWORD_HASH;
  const plainPassword = process.env.CEO_PASSWORD;

  if (!passwordHash) {
    if (!plainPassword) {
      throw new Error("Set CEO_PASSWORD_HASH or CEO_PASSWORD for seeding");
    }
    passwordHash = await bcrypt.hash(plainPassword, 12);
    console.log("Generated password hash (optional — save as CEO_PASSWORD_HASH):");
    console.log(passwordHash);
  }

  const pool = new pg.Pool({ connectionString });
  const db = drizzle({ client: pool, schema });

  try {
    const [existingUser] = await db
      .select({
        id: schema.users.id,
        organizationId: schema.users.organizationId,
      })
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      console.log("CEO user already exists:", email);
      console.log("Organization ID (WEBHOOK_ORG_ID):", existingUser.organizationId);
      return;
    }

    const [org] = await db
      .insert(schema.organizations)
      .values({
        name: "CEO Personal",
        slug: "ceo-personal",
        plan: "personal",
      })
      .returning();

    await db.insert(schema.users).values({
      organizationId: org.id,
      email: email.toLowerCase(),
      passwordHash,
      role: "owner",
    });

    console.log("Seeded organization and CEO user for:", email);
    console.log("Organization ID (WEBHOOK_ORG_ID):", org.id);
  } finally {
    await pool.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
