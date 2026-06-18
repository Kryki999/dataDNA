import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { resolveDatabaseConnectionString } from "./connection-string";
import { schema } from "./schema";

function createDb() {
  const pool = new pg.Pool({
    connectionString: resolveDatabaseConnectionString(),
    max: 10,
  });

  return drizzle({ client: pool, schema });
}

type Db = ReturnType<typeof createDb>;

declare global {
  var __sellyDb: Db | undefined;
}

function getDb(): Db {
  if (!globalThis.__sellyDb) {
    globalThis.__sellyDb = createDb();
  }
  return globalThis.__sellyDb;
}

export const db = new Proxy({} as Db, {
  get(_target, property, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, property, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export type Database = Db;
