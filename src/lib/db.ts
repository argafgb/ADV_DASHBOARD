import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.PG_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DEV_PG_DATABASE_URL ||
  process.env.STAG_PG_DATABASE_URL ||
  process.env.PROD_PG_DATABASE_URL;

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const activeConnectionString =
  connectionString ||
  "postgresql://postgres:postgres@localhost:5432/placeholder";

if (!connectionString && typeof window === "undefined") {
  console.warn(
    "[DB Warning] No PG_DATABASE_URL found in environment variables. Falling back to default connection string.",
  );
}

export const sql =
  globalForDb.conn ??
  postgres(activeConnectionString, {
    max: 25,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = sql;
}
