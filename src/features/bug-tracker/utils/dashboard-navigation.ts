export const GLOBAL_FILTER_KEYS = [
  "year",
  "month",
  "project",
  "role",
  "dept",
] as const;

export type GlobalFilterKey = (typeof GLOBAL_FILTER_KEYS)[number];

export function updateDashboardFilterParams(
  searchParams: URLSearchParams,
  key: GlobalFilterKey,
  value: string,
): URLSearchParams {
  const params = new URLSearchParams(searchParams);
  params.set(key, value);
  return params;
}

export function getDashboardHref(
  pathname: string,
  searchParams: URLSearchParams,
): string {
  const params = new URLSearchParams();

  for (const key of GLOBAL_FILTER_KEYS) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }

  if (pathname === "/dashboard/bug-tracker") params.delete("dept");

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
