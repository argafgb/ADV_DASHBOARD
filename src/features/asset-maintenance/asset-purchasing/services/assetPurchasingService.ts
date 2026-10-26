"use server";

import { scopedCache as unstable_cache } from "@/lib/auth/scoped-cache";
import { sql } from "@/lib/db";
import { getRequestDataScope } from "@/lib/auth/request-scope";
import { scopedTable } from "@/lib/auth/scoped-table";
import type { AssetFilterInput } from "@/types/asset-pm.types";
import type { AssetPurchasingData, AssetPurchasingDbRow } from "../types";
import { mapAssetPurchasingRows } from "../utils/purchaseMapper";

/* ============================================================================
 * 1. ASSET PURCHASING (Pengadaan Aset IT)
 * ============================================================================ */

/**
 * Raw SQL Query: Fetches asset purchasing rows and latest sync timestamp
 * from pm_asset_it.asset_purchasing.
 */
export async function getAssetPurchasingRaw(
  input: Pick<AssetFilterInput, "year">,
): Promise<AssetPurchasingData> {
  const dataScope = await getRequestDataScope();
  const [rows, syncRows] = await Promise.all([
    sql<AssetPurchasingDbRow[]>`
      SELECT source_category, item_type, purchase_year, purchase_month, quantity
      FROM ${scopedTable("asset_purchasing", dataScope)}
      WHERE purchase_year = ${input.year}
      ORDER BY source_category, item_type, purchase_month
    `,
    sql<{ synced_at: Date | string | null }[]>`
      SELECT MAX(synced_at) AS synced_at
      FROM ${scopedTable("asset_purchasing", dataScope)}
    `,
  ]);

  const syncedAtRaw = syncRows[0]?.synced_at;
  const syncedAt = syncedAtRaw ? new Date(syncedAtRaw).toISOString() : null;

  return mapAssetPurchasingRows([...rows], syncedAt);
}

/**
 * Inline Cache Function: Public service wrapper for Asset Purchasing data.
 */
export async function getAssetPurchasingData(
  input: AssetFilterInput,
): Promise<AssetPurchasingData> {
  return unstable_cache(
    async () => getAssetPurchasingRaw({ year: input.year }),
    ["asset-purchasing-data", input.year],
    { revalidate: 300, tags: ["asset-purchasing"] },
  )();
}
