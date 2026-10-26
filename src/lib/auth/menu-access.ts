/** Menu permissions published by Helpdesk Access Management. */
export const ASSET_PM_MENU_ROUTES: readonly {
  path: string;
  permission: string | null;
}[] = [
  { path: "/dashboard/asset-maintenance", permission: "menu.asset-pm.overview.view" },
  { path: "/dashboard/asset-maintenance/asset-distribution", permission: "menu.asset-pm.asset-distribution.view" },
  { path: "/dashboard/asset-maintenance/cost-maintenance-budget", permission: "menu.asset-pm.cost-budget.view" },
  { path: "/dashboard/asset-maintenance/comparison", permission: "menu.asset-pm.comparison.view" },
  { path: "/dashboard/asset-maintenance/finding-asset-lifecycle", permission: "menu.asset-pm.finding-lifecycle.view" },
  { path: "/dashboard/asset-maintenance/asset-purchasing", permission: "menu.asset-pm.purchasing.view" },
  { path: "/dashboard/asset-maintenance/device-requests", permission: null },
  { path: "/dashboard/asset-maintenance/warehouse-stock", permission: null },
  { path: "/dashboard", permission: "menu.asset-pm.overview.view" },
  { path: "/dashboard/asset-distribution", permission: "menu.asset-pm.asset-distribution.view" },
  { path: "/dashboard/cost-maintenance-budget", permission: "menu.asset-pm.cost-budget.view" },
  { path: "/dashboard/comparison", permission: "menu.asset-pm.comparison.view" },
  { path: "/dashboard/finding-asset-lifecycle", permission: "menu.asset-pm.finding-lifecycle.view" },
  { path: "/dashboard/asset-purchasing", permission: "menu.asset-pm.purchasing.view" },
  { path: "/dashboard/device-requests", permission: null },
  { path: "/dashboard/warehouse-stock", permission: null },
];

export function menuPermissionForPath(pathname: string): string | null | undefined {
  const match = ASSET_PM_MENU_ROUTES.find(({ path }) =>
    path === "/dashboard"
      ? pathname === path
      : pathname === path || pathname.startsWith(`${path}/`),
  );
  return match?.permission;
}

/** Undefined is legacy access; an explicit empty array denies every managed menu. */
export function canViewAssetPmMenu(
  pathname: string,
  permissions: readonly string[] | undefined,
): boolean {
  if (permissions === undefined) return true;
  const required = menuPermissionForPath(pathname);
  return typeof required === "string" && permissions.includes(required);
}

export function firstAllowedAssetPmPath(permissions: readonly string[]): string | null {
  return ASSET_PM_MENU_ROUTES.find(
    ({ permission }) => permission !== null && permissions.includes(permission),
  )?.path ?? null;
}
