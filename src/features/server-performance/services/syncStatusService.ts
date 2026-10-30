import "server-only";
import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";

interface LastUpdatedRow {
  last_updated: Date | string | null;
}

export async function getLastSyncedAtRaw(): Promise<string | null> {
  try {
    const rows = await sql<LastUpdatedRow[]>`
      SELECT GREATEST(
        (SELECT MAX(updated_at) FROM server_performance.fact_incidents),
        (SELECT MAX(updated_at) FROM server_performance.fact_server_performance)
      ) AT TIME ZONE 'Asia/Jakarta' AS last_updated;
    `;

    const lastUpdated = rows[0]?.last_updated ?? null;
    if (lastUpdated === null) return null;

    const parsed =
      lastUpdated instanceof Date ? lastUpdated : new Date(lastUpdated);
    if (Number.isNaN(parsed.getTime())) return null;

    return parsed.toISOString();
  } catch (err) {
    console.warn(
      "[Database Query] Failed to fetch server_performance last updated timestamp:",
      err,
    );
    return null;
  }
}

export async function getLastSyncedAt(): Promise<string | null> {
  return unstable_cache(async () => getLastSyncedAtRaw(), ["server-perf-last-synced-at"], {
    revalidate: 60,
    tags: ["server-perf-last-synced-at"],
  })();
}
