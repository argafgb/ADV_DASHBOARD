import { canonicalPeriod } from "@/lib/period-filter";
import { normalizeCompany } from "@/lib/company-filter";
import type { AssetFilterInput } from "@/types/asset-pm.types";

export const GLOBAL_FILTER_KEYS = ["year", "month", "site", "company"] as const;
export type GlobalFilterKey = (typeof GLOBAL_FILTER_KEYS)[number];
export type DashboardSearchParamValue = string | string[] | undefined;
export type DashboardSearchParams = Partial<
  Record<GlobalFilterKey, DashboardSearchParamValue>
>;

function firstValue(value: DashboardSearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function globalFilterParams(
  searchParams: Pick<URLSearchParams, "get">,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const key of GLOBAL_FILTER_KEYS) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }

  return params;
}

export function dashboardHref(
  pathname: string,
  searchParams: Pick<URLSearchParams, "get">,
): string {
  const query = globalFilterParams(searchParams).toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function assetFilterInput(
  params: DashboardSearchParams,
  now = new Date(),
): AssetFilterInput {
  return {
    ...canonicalPeriod(
      firstValue(params.year) ?? null,
      firstValue(params.month) ?? null,
      now,
    ),
    site: firstValue(params.site) || "ALL",
    company: normalizeCompany(firstValue(params.company)),
  };
}
