import type { DataScope } from "./data-scope";
import { resolveSiteAccess } from "./site-access";

/**
 * Site dimension of every scoped table. `null` means the dataset has no
 * trustworthy site column, so restricted users must see no rows at all.
 * Keys of this map are the single source of truth for ScopedTableName.
 */
export const TABLE_SITE_DIMENSION = {
  pm_asset_it_summary: "site",
  pm_asset_it_usia: "branch",
  pm_asset_it_temuan: "site",
  pm_asset_it_jadwal: "site",
  asset_ratings: "cabang",
  asset_warranty: "site",
  network_assets: "intended",
  pm_asset_it_lifecycle: null,
  asset_purchasing: null,
  warehouse_stock: null,
} as const;

export type ScopedTableName = keyof typeof TABLE_SITE_DIMENSION;
export type SiteDimension = NonNullable<(typeof TABLE_SITE_DIMENSION)[ScopedTableName]>;

export type TableFilterPlan =
  | { kind: "all" }
  | { kind: "none" }
  | { kind: "sites"; dimension: SiteDimension; sites: string[] };

/** Pure decision of which rows of a table a scope may read. */
export function planTableFilter(table: ScopedTableName, scope: DataScope): TableFilterPlan {
  if (scope.all) return { kind: "all" };
  const dimension = TABLE_SITE_DIMENSION[table];
  if (dimension === null) return { kind: "none" };
  const access = resolveSiteAccess(scope);
  if (access.kind === "all") return { kind: "all" };
  if (access.kind === "deny") return { kind: "none" };
  return { kind: "sites", dimension, sites: access.sites };
}
