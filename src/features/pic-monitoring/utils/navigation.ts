export const GLOBAL_FILTER_QUERY_KEYS = ["year", "month"] as const;

export function getGlobalFilterQuery(
  searchParams: Pick<URLSearchParams, "toString"> | string,
): string {
  const source = new URLSearchParams(
    typeof searchParams === "string" ? searchParams : searchParams.toString(),
  );
  const preserved = new URLSearchParams();

  for (const key of GLOBAL_FILTER_QUERY_KEYS) {
    const value = source.get(key);
    if (value !== null) preserved.set(key, value);
  }

  return preserved.toString();
}

export function withPreservedQuery(
  pathname: string,
  searchParams: Pick<URLSearchParams, "toString"> | string,
): string {
  const query = getGlobalFilterQuery(searchParams);
  return query ? `${pathname}?${query}` : pathname;
}
