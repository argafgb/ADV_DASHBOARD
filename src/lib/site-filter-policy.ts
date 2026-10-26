import type { SiteOption } from "@/types/asset-pm.types";

export const NO_SITE_VALUE = "__NO_SITE__";

/** Roles allowed to aggregate the sites available in the global site filter. */
const ALL_SITES_ROLES = new Set(["regional-head", "it-admin", "it-product"]);

export function siteOptionsForRole(
  sites: SiteOption[],
  roleKey: string | null,
): SiteOption[] {
  if (roleKey && ALL_SITES_ROLES.has(roleKey)) {
    return [{ value: "ALL", label: "All Sites" }, ...sites];
  }
  return sites.length > 0
    ? sites
    : [{ value: NO_SITE_VALUE, label: "Tidak ada site" }];
}

export function normalizeSiteSelection(
  value: string | null,
  options: SiteOption[],
): string {
  const fallback = options[0]?.value ?? NO_SITE_VALUE;
  if (!value) return fallback;
  if (value === "All Sites" || value === "ALL") {
    return options.some((option) => option.value === "ALL") ? "ALL" : fallback;
  }
  return options.some((option) => option.value === value) ? value : fallback;
}
