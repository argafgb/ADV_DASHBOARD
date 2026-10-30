import "server-only";
import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";

interface LastSyncedRow {
  last_synced: Date | string | null;
}

export async function getLastSyncedAtRaw(): Promise<string | null> {
  const start = performance.now();

  try {
    const rows = await sql<LastSyncedRow[]>`
      SELECT MAX(synced_at) AT TIME ZONE 'Asia/Jakarta' AS last_synced
      FROM overtime.overtime_transactions;
    `;

    const lastSynced = rows[0]?.last_synced ?? null;
    if (lastSynced === null) return null;

    const parsed =
      lastSynced instanceof Date ? lastSynced : new Date(lastSynced);
    if (Number.isNaN(parsed.getTime())) return null;

    console.log(
      `[DB] getLastSyncedAt in ${(performance.now() - start).toFixed(2)}ms`,
    );
    return parsed.toISOString();
  } catch (err) {
    console.warn("[DB] Failed to fetch overtime sync timestamp:", err);
    return null;
  }
}

export async function getLastSyncedAt(): Promise<string | null> {
  return unstable_cache(
    async () => getLastSyncedAtRaw(),
    ["overtime-last-synced-at"],
    {
      revalidate: 60,
      tags: ["overtime-last-synced-at"],
    },
  )();
}
