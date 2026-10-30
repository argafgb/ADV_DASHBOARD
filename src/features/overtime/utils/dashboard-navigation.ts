export const GLOBAL_FILTER_KEYS = [
  "year",
  "month",
  "dept",
  "area",
  "level1",
  "level2",
] as const;

export type GlobalFilterKey = (typeof GLOBAL_FILTER_KEYS)[number];

const ORG_SCOPED_ROUTES = new Set([
  "/dashboard/overtime/organization",
  "/dashboard/overtime/employee-compliance",
]);

export function isDepartmentFilterApplicable(pathname: string): boolean {
  return ORG_SCOPED_ROUTES.has(pathname);
}

export function isOrgUnitFilterApplicable(pathname: string): boolean {
  return isDepartmentFilterApplicable(pathname);
}

const ORG_SCOPED_FILTER_KEYS = ["dept", "area", "level1", "level2"] as const;

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
  const orgApplicable = isDepartmentFilterApplicable(pathname);

  for (const key of GLOBAL_FILTER_KEYS) {
    if (
      !orgApplicable &&
      (ORG_SCOPED_FILTER_KEYS as readonly string[]).includes(key)
    ) {
      continue;
    }
    const value = currentSearchParams.get(key);
    if (value) params.set(key, value);
  }

  return appendQuery(pathname, params);
}

export function buildFilterHref(
  pathname: string,
  currentSearchParams: SearchParams,
  updates: Partial<Record<GlobalFilterKey, string>>,
): string {
  const params = new URLSearchParams(currentSearchParams.toString());

  for (const [key, value] of Object.entries(updates)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }

  if (updates.month && updates.month !== "ALL") params.delete("quarter");

  if (updates.area !== undefined || updates.dept !== undefined) {
    if (updates.level1 === undefined) params.delete("level1");
    if (updates.level2 === undefined) params.delete("level2");
  } else if (updates.level1 !== undefined && updates.level2 === undefined) {
    params.delete("level2");
  }

  return appendQuery(pathname, params);
}
