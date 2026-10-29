import "server-only";
import { getRequestBranchAccess } from "@/lib/network/branch-access";
import { getBranches, getRegionGroups } from "./branches";
import { getIncidents } from "./incidents";
import { getIspLinks, getIspVendorColors } from "./isp";
import { getPeriods } from "./periods";
import { getSlaMatrix } from "./sla";
import { getTraffic } from "./traffic";
import { getWeeklyQualityRecords } from "./weeklyQuality";
import { getInternetCostRowsData } from "@/features/network-performance/isp-bandwidth/services/ispCostService";
import type {
  Branch,
  DowntimeIncident,
  IspLink,
  RegionGroup,
  SlaMatrix,
  WeeklyQualityRecord,
} from "../types/network.types";
import type { RawInternetCostRow } from "@/features/network-performance/isp-bandwidth/types/isp-cost.types";
import type { Periods } from "./periods";
import type { TrafficData } from "./traffic";

/**
 * Everything all four pages need, in one fetch.
 *
 * The whole set is roughly 250 KB of JSON — 40 branches, 273 monthly rows,
 * 29 incidents, 585 traffic rows — so it is cheaper to hand the client the
 * full dataset once and let the existing filter/sort/tooltip logic run against
 * it than to round-trip per filter change.
 *
 * Because the client receives the whole set, branch scoping MUST happen here,
 * on the server: every query is restricted to the branches in the signed
 * Helpdesk token, so out-of-scope rows never reach the browser.
 */
export interface NetworkData {
  branches: Branch[];
  regionGroups: RegionGroup[];
  matrix: SlaMatrix;
  incidents: DowntimeIncident[];
  ispLinks: Record<string, IspLink[]>;
  ispColors: Record<string, string>;
  traffic: TrafficData;
  periods: Periods;
  internetCosts: RawInternetCostRow[];
  weeklyQuality: WeeklyQualityRecord[];
}

export async function getNetworkData(): Promise<NetworkData> {
  const access = await getRequestBranchAccess();
  const [
    branches,
    regionGroups,
    matrix,
    incidents,
    ispLinks,
    ispColors,
    traffic,
    periods,
    internetCosts,
    weeklyQuality,
  ] = await Promise.all([
    getBranches(access),
    getRegionGroups(access),
    getSlaMatrix(access),
    getIncidents(access),
    getIspLinks(access),
    getIspVendorColors(),
    getTraffic(access),
    getPeriods(),
    getInternetCostRowsData(access),
    getWeeklyQualityRecords(access),
  ]);
  return {
    branches,
    regionGroups,
    matrix,
    incidents,
    ispLinks,
    ispColors,
    traffic,
    periods,
    internetCosts,
    weeklyQuality,
  };
}

export type { Periods, TrafficData, WeeklyQualityRecord };
export {
  getBranches,
  getRegionGroups,
  getIncidents,
  getIspLinks,
  getIspVendorColors,
  getPeriods,
  getSlaMatrix,
  getTraffic,
  getWeeklyQualityRecords,
};
