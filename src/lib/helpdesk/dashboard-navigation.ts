export const GLOBAL_FILTER_KEYS = ["year", "month", "dept"] as const;

const DEPARTMENT_SCOPED_ROUTES = new Set([
  "/dashboard/helpdesk/comparison",
  "/dashboard/helpdesk/leaderboard",
  "/dashboard/helpdesk/rating-root-cause",
  "/dashboard/helpdesk/sla-performance",
  "/dashboard/comparison",
  "/dashboard/leaderboard",
  "/dashboard/rating-root-cause",
  "/dashboard/sla-performance",
]);

export function isDepartmentFilterApplicable(pathname: string): boolean {
  return DEPARTMENT_SCOPED_ROUTES.has(pathname);
}

export function isGlobalFilterApplicable(pathname: string): boolean {
  if (
    pathname.startsWith("/dashboard/helpdesk/access") ||
    pathname.startsWith("/dashboard/access") ||
    pathname === "/dashboard/forbidden"
  ) {
    return false;
  }
  return true;
}

type SearchParams = URLSearchParams | Readonly<URLSearchParams>;

function appendQuery(pathname: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildDashboardHref(
  pathname: string,
  currentSearchParams: SearchParams,
): string {
  const params = new URLSearchParams();

  for (const key of GLOBAL_FILTER_KEYS) {
    const value = currentSearchParams.get(key);
    if (value) params.set(key, value);
  }

  return appendQuery(pathname, params);
}

export function buildFilterHref(
  pathname: string,
  currentSearchParams: SearchParams,
  updates: Partial<Record<(typeof GLOBAL_FILTER_KEYS)[number], string>>,
): string {
  const params = new URLSearchParams(currentSearchParams.toString());

  for (const [key, value] of Object.entries(updates)) {
    params.set(key, value);
  }

  if (updates.month && updates.month !== "ALL") params.delete("quarter");

  return appendQuery(pathname, params);
}
