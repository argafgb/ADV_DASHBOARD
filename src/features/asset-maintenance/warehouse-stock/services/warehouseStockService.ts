"use server";

import { scopedCache as unstable_cache } from "@/lib/auth/scoped-cache";
import { sql } from "@/lib/db";
import { getRequestDataScope } from "@/lib/auth/request-scope";
import { scopedTable } from "@/lib/auth/scoped-table";
import type { WarehouseStockData, WarehouseStockItem } from "../types";

/* ============================================================================
 * 1. WAREHOUSE STOCK (pm_asset_it.warehouse_stock)
 * ============================================================================ */

/**
 * Raw SQL Query: Fetches warehouse stock items and latest sync timestamp from PostgreSQL.
 */
export async function getWarehouseStockRaw(): Promise<WarehouseStockData> {
  const dataScope = await getRequestDataScope();
  try {
    const [rows, syncRows] = await Promise.all([
      sql<WarehouseStockItem[]>`
        SELECT
          id AS no,
          COALESCE(NULLIF(item, ''), type, 'Item') AS item,
          category,
          type,
          COALESCE(spec, '') AS spec,
          COALESCE(location, 'Not recorded') AS location,
          COALESCE(placement, '') AS placement,
          condition,
          qty,
          COALESCE(qty_note, '') AS qty_note,
          COALESCE(barcode, '') AS barcode,
          COALESCE(TO_CHAR(last_edited, 'YYYY-MM-DD HH24:MI'), '') AS last_edited
        FROM ${scopedTable("warehouse_stock", dataScope)}
        ORDER BY id ASC
      `,
      sql<{ synced_at: Date | string | null }[]>`
        SELECT MAX(synced_at) AS synced_at
        FROM ${scopedTable("warehouse_stock", dataScope)}
      `,
    ]);

    const syncedAt = syncRows[0]?.synced_at;
    return {
      items: rows ? [...rows] : [],
      syncedAt: syncedAt ? new Date(syncedAt).toISOString() : null,
    };
  } catch (error) {
    console.error(
      "[Warehouse Stock] Error querying pm_asset_it.warehouse_stock:",
      error,
    );
    return {
      items: [],
      syncedAt: null,
    };
  }
}

/**
 * Inline Cache Function: Public service wrapper for Warehouse Stock data.
 */
export async function getWarehouseStockData(): Promise<WarehouseStockData> {
  return unstable_cache(
    async () => getWarehouseStockRaw(),
    ["warehouse-stock-data"],
    { revalidate: 300, tags: ["warehouse-stock"] },
  )();
}
