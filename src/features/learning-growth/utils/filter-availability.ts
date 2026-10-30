import { DASHBOARD_CONFIG } from "./dashboard-config";

export interface FilterAvailability {
  available: boolean;
  /** Alasan yang tampil di tooltip chip saat filter tidak berlaku. */
  reason?: string;
}

type ExemptionRules = Readonly<Record<string, string>>;

/** "/dashboard/" dan "/dashboard" adalah menu yang sama. */
function normalizePath(pathname: string | null): string {
  if (!pathname) return "";
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

function availabilityFor(rules: ExemptionRules, pathname: string | null): FilterAvailability {
  const path = normalizePath(pathname);
  return Object.hasOwn(rules, path)
    ? { available: false, reason: rules[path] }
    : { available: true };
}

/** Status chip Tahun di menu `pathname`; aturannya ada di dashboard-config. */
export function yearFilterAvailability(pathname: string | null): FilterAvailability {
  return availabilityFor(DASHBOARD_CONFIG.periodFilterExemptions.year, pathname);
}

/** Status chip Bulan di menu `pathname`; aturannya ada di dashboard-config. */
export function monthFilterAvailability(pathname: string | null): FilterAvailability {
  return availabilityFor(DASHBOARD_CONFIG.periodFilterExemptions.month, pathname);
}
