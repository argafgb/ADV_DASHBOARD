import "server-only";
import sql from "mssql";

const connectionString = process.env.MSSQL_DATABASE_URL;

const globalForMssql = globalThis as unknown as {
  mssqlPool: Promise<sql.ConnectionPool> | undefined;
};

const CONNECT_TIMEOUT_MS = Number(process.env.MSSQL_CONNECT_TIMEOUT ?? 5000);
const REQUEST_TIMEOUT_MS = Number(process.env.MSSQL_REQUEST_TIMEOUT ?? 8000);

export function isMssqlConfigured(): boolean {
  return Boolean(connectionString);
}

function configFromUrl(raw: string): sql.config {
  const url = new URL(raw);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));

  return {
    server: url.hostname,
    port: Number(url.port) || 1433,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ...(database ? { database } : {}),
    connectionTimeout: CONNECT_TIMEOUT_MS,
    requestTimeout: REQUEST_TIMEOUT_MS,
    options: {
      encrypt: url.searchParams.get("encrypt") === "true",
      trustServerCertificate:
        url.searchParams.get("trustServerCertificate") !== "false",
    },
  };
}

export function getMssqlPool(): Promise<sql.ConnectionPool> {
  if (!connectionString) {
    return Promise.reject(
      new Error("MSSQL_DATABASE_URL wajib diisi di .env"),
    );
  }

  if (!globalForMssql.mssqlPool) {
    const config = configFromUrl(connectionString);
    const pool = new sql.ConnectionPool(config);

    globalForMssql.mssqlPool = pool.connect().catch((err) => {
      globalForMssql.mssqlPool = undefined;
      throw err;
    });
  }

  return globalForMssql.mssqlPool;
}

export { sql as mssql };
