import "server-only";

import { sql } from "@/lib/db";
import { getRequestDataScope } from "@/lib/auth/request-scope";
import { scopedTable } from "@/lib/auth/scoped-table";

/**
 * Jam yang dipakai navbar adalah saat n8n menulis ke Postgres, bukan saat
 * halaman dirender: pembaca perlu tahu seberapa baru datanya, bukan seberapa
 * baru tab-nya.
 *
 * Dari seluruh tabel `pm_asset_it`, hanya `asset_purchasing` yang mencatat
 * `synced_at`. Tabel lain hanya menyimpan `time_edit`/`time_input`, yaitu jam
 * orang menyunting halaman Notion-nya, yang tidak memberi tahu apa pun tentang
 * kapan dashboard ini terakhir menerima data.
 */
export async function getDashboardSyncedAt(): Promise<string | null> {
  const dataScope = await getRequestDataScope();
  try {
    const rows = await sql<{ synced_at: Date | string | null }[]>`
      SELECT GREATEST(
        (SELECT MAX(synced_at) FROM ${scopedTable("asset_purchasing", dataScope)}),
        (SELECT MAX(synced_at) FROM ${scopedTable("warehouse_stock", dataScope)}),
        (SELECT MAX(synced_at) FROM ${scopedTable("asset_warranty", dataScope)})
      ) AS synced_at
    `;

    const syncedAt = rows[0]?.synced_at;
    return syncedAt ? new Date(syncedAt).toISOString() : null;
  } catch (error) {
    console.error("Failed to read the last sync timestamp:", error);
    return null;
  }
}
