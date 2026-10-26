import { getRawSiteAliases, normalizeSiteName } from "@/lib/site-utils";
import type { DataScope } from "./data-scope";

/**
 * Jakarta-Cideng is one physical site that PM sources spell several ways.
 * Helpdesk issues it as "JAKARTA-CIDENG" or "JAKARTA"; any member grants all.
 * Free-text variants beyond these (e.g. "Cideng Lantai 4") are deliberately
 * not fuzzy-matched — they should be cleaned at the source.
 */
const JAKARTA_CIDENG_SITES = [
  "JAKARTA-CIDENG",
  "JAKARTA",
  "CIDENG",
  "JAKARTA - CIDENG",
  "JAKARTA CIDENG",
] as const;

export type SiteAccess =
  | { kind: "all" }
  | { kind: "deny" }
  | { kind: "sites"; sites: string[] };

/**
 * Helpdesk expands selected regions into branches before signing the JWT,
 * so the branch list is the only dimension PM needs to enforce.
 *
 * Departments (IT Support / DCT Support) are a Helpdesk ticket dimension that
 * PM datasets do not have. They are ignored when a branch restriction exists:
 * the branch list alone fully bounds what the user may see here.
 * A department-only scope (branches === null) would mean "every branch" in PM,
 * which the issuer never explicitly granted, so it stays denied.
 */
export function resolveSiteAccess(scope: DataScope): SiteAccess {
  if (scope.all) return { kind: "all" };
  if (scope.branches === null) return { kind: "deny" };

  const names = new Set<string>();
  for (const branch of scope.branches) {
    const clean = branch.trim().toUpperCase();
    if (!clean) continue;
    names.add(clean);
    // "IT" is a display group for several physical sites, so expanding its
    // aliases would grant locations the issuer did not explicitly allow.
    if (normalizeSiteName(clean) !== "IT") {
      for (const alias of getRawSiteAliases(clean)) names.add(alias.trim().toUpperCase());
    }
    if ((JAKARTA_CIDENG_SITES as readonly string[]).includes(clean)) {
      for (const site of JAKARTA_CIDENG_SITES) names.add(site);
    }
    if (clean === "JAKARTA - TEBET") names.add("JAKARTA-CIDENG");
  }
  return names.size ? { kind: "sites", sites: [...names].sort() } : { kind: "deny" };
}
