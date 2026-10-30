import "server-only";
import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";

interface LastSyncedRow {
  last_synced: Date | string | null;
}

/**
 * "Terakhir diperbarui" = waktu data terakhir BERUBAH DI SUMBER
 * (`source_modified_at` = `last_edited_time` Notion), bukan jam n8n berjalan.
 */
async function getLastSyncedAtRaw(): Promise<string | null> {
  const start = performance.now();
  const rows = await sql<LastSyncedRow[]>`
    SELECT MAX(source_modified_at) AS last_synced
    FROM it_repair_maintenance.log_repair
    WHERE archived_at IS NULL;
  `;

  const lastSynced = rows[0]?.last_synced ?? null;
  if (lastSynced === null) return null;

  const parsed = lastSynced instanceof Date ? lastSynced : new Date(lastSynced);
  if (Number.isNaN(parsed.getTime())) return null;

  console.log(`[DB] getLastSyncedAt in ${(performance.now() - start).toFixed(2)}ms`);
  return parsed.toISOString();
}

export async function getLastSyncedAt(): Promise<string | null> {
  try {
    return await unstable_cache(async () => getLastSyncedAtRaw(), ["itrm-last-synced-at"], {
      revalidate: 60,
      tags: ["itrm-last-synced-at"],
    })();
  } catch (err) {
    console.error("[DB] Failed to fetch IT Repair freshness timestamp:", err);
    return null;
  }
}
