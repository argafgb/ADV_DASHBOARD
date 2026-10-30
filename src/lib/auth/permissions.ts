export type UserRole = "management" | "internal";

export type DashboardMenuKey =
  | "overview"
  | "sla-performance"
  | "comparison"
  | "rating-root-cause"
  | "leaderboard"
  | "fsd-blueprint";

export const DASHBOARD_MENU_KEYS: readonly DashboardMenuKey[] = [
  "overview",
  "sla-performance",
  "comparison",
  "rating-root-cause",
  "leaderboard",
  "fsd-blueprint",
];

export const ROLE_MENU_ACCESS: Record<UserRole, DashboardMenuKey[]> = {
  management: ["overview", "sla-performance", "rating-root-cause"],

  internal: [
    "overview",
    "sla-performance",
    "comparison",
    "rating-root-cause",
    "leaderboard",
    "fsd-blueprint",
  ],
};

export const MENU_PATHS: Record<DashboardMenuKey, string> = {
  overview: "/dashboard/helpdesk",
  "sla-performance": "/dashboard/helpdesk/sla-performance",
  comparison: "/dashboard/helpdesk/comparison",
  "rating-root-cause": "/dashboard/helpdesk/rating-root-cause",
  leaderboard: "/dashboard/helpdesk/leaderboard",
  "fsd-blueprint": "/dashboard/helpdesk/fsd-blueprint",
};

const isSkipAuth =
  process.env.SKIP_AUTH === "true" ||
  process.env.NEXT_PUBLIC_SKIP_AUTH === "true" ||
  process.env.DISABLE_AUTH === "true";

export function isDashboardMenuKey(value: unknown): value is DashboardMenuKey {
  return (
    typeof value === "string" &&
    (DASHBOARD_MENU_KEYS as readonly string[]).includes(value)
  );
}

export function resolveAllowedMenus(
  role: UserRole,
  overrides?: readonly string[] | null,
): DashboardMenuKey[] {
  const base = ROLE_MENU_ACCESS[role] ?? ROLE_MENU_ACCESS.management;

  if (overrides == null) return [...base];

  const filtered = overrides.filter(isDashboardMenuKey);

  return filtered;
}

export function canAccessMenu(
  role: UserRole,
  menu: DashboardMenuKey,
  allowedMenus?: readonly DashboardMenuKey[] | null,
) {
  if (isSkipAuth) return true;

  const effective =
    allowedMenus != null ? allowedMenus : (ROLE_MENU_ACCESS[role] ?? []);

  return effective.includes(menu);
}

export function menuKeyForPath(pathname: string): DashboardMenuKey | null {
  for (const key of DASHBOARD_MENU_KEYS) {
    const path = MENU_PATHS[key];
    if (path === "/dashboard/helpdesk" || path === "/dashboard") continue;
    if (
      pathname === path ||
      pathname.startsWith(`${path}/`) ||
      pathname === path.replace("/dashboard/helpdesk", "/dashboard") ||
      pathname.startsWith(`${path.replace("/dashboard/helpdesk", "/dashboard")}/`)
    ) {
      return key;
    }
  }

  return pathname === "/dashboard/helpdesk" || pathname === "/dashboard"
    ? "overview"
    : null;
}
