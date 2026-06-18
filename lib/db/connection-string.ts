/**
 * pg v8 treats sslmode=require as verify-full and warns about v9 behavior.
 * Neon URLs use require — normalize explicitly to silence the warning.
 */
export function resolveDatabaseConnectionString(): string {
  const connectionString =
    process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return normalizePgConnectionString(connectionString);
}

export function normalizePgConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get("sslmode");
    const isLocal =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (isLocal && !sslmode) {
      return connectionString;
    }

    if (
      !sslmode ||
      sslmode === "prefer" ||
      sslmode === "require" ||
      sslmode === "verify-ca"
    ) {
      url.searchParams.set("sslmode", "verify-full");
    }

    return url.toString();
  } catch {
    return connectionString;
  }
}
