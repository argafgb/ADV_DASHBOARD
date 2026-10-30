import "server-only";
import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";

interface LastSyncedRow {
  last_synced: Date | string | null;
}

/**
 * "Terakhir diperbarui" = waktu data terakhir BERUBAH DI SUMBER (kolom
 * `source_modified_at` yang diisi ETL), bukan jam n8n berjalan — lihat
 * docs/00-KESIAPAN.md Q8. Nama tabel/kolom masih usulan sampai DDL FASE 7.
 */
export async function getLastSyncedAtRaw(): Promise<string | null> {
  const start = performance.now();

  try {
    const rows = await sql<LastSyncedRow[]>`
      SELECT MAX(source_modified_at) AT TIME ZONE 'Asia/Jakarta' AS last_synced
      FROM kaldev_performance.kaldev_projects;
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
    console.warn("[DB] Failed to fetch kaldev freshness timestamp:", err);
    // FASE 5: stempel data pada artefak desain, supaya header cocok dengan mock.
    return null;
  }
}

export async function getLastSyncedAt(): Promise<string | null> {
  return unstable_cache(async () => getLastSyncedAtRaw(), ["last-synced-at"], {
    revalidate: 60,
    tags: ["last-synced-at"],
  })();
}
