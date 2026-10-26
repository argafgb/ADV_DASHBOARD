import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { assetFilterInput, type DashboardSearchParams } from "@/lib/global-filters";
import { siteOptionsForRole, normalizeSiteSelection } from "@/lib/site-filter-policy";
import { getSiteLookupOptions } from "@/services/siteLookupService";
import type { SiteOption } from "@/types/asset-pm.types";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "./jwt-verifier";
import { getIssuerAccess } from "./issuer-access";

export const getCurrentSiteFilterOptions = cache(async (): Promise<SiteOption[]> => {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const [sites, user, issuer] = await Promise.all([
    getSiteLookupOptions(),
    token ? verifyAuthToken(token) : Promise.resolve(null),
    token ? getIssuerAccess(token) : Promise.resolve(null),
  ]);
  const roleKey = user && issuer?.user.nik === user.nik
    ? issuer.access.roleKey
    : null;
  return siteOptionsForRole(sites, typeof roleKey === "string" ? roleKey : null);
});

export async function scopedAssetFilterInput(params: DashboardSearchParams) {
  const input = assetFilterInput(params);
  const options = await getCurrentSiteFilterOptions();
  return { ...input, site: normalizeSiteSelection(input.site, options) };
}
