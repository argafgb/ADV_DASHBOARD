/**
 * Types specific to the Overview dashboard feature.
 */

export interface TotalAssetKpis {
  totalAsset: number;
  totalWorkstation: number;
  totalPeripheral: number;
  totalInfrastructure: number;
}

export interface YearlyGrowthPoint {
  year: string;
  total: number;
  workstation?: number;
  infrastructure?: number;
  peripheral?: number;
}

import type { BarDatum, DonutSlice } from "@/types/asset-pm.types";

/** Section 1 payload: asset KPI totals plus the growth series, fetched together. */
export interface Section1DataResult {
  kpis: TotalAssetKpis;
  growth: YearlyGrowthPoint[];
}

export interface MonthlyTrendPoint {
  month: string;
  temuan: number;
}

export interface OverviewDonutsResult {
  pmCompletion: DonutSlice[];
  temuanVsBersih: DonutSlice[];
  statusTemuan: DonutSlice[];
  monthlyTrend: MonthlyTrendPoint[];
}

export interface OverviewBottomChartsResult {
  top5Cabang: BarDatum[];
  komposisiPerangkat: BarDatum[];
}

export interface OverviewKpis {
  totalAsset: number;
  totalWorkstation: number;
  totalPeripheral: number;
  totalInfrastructure: number;
  totalTemuan: number;
  totalResolveStatusTemuan: number;
  totalSites: number;
}

/** Device-type filter applied to the asset-growth chart. */
export type GrowthDeviceFilter =
  | "ALL"
  | "workstation"
  | "infrastructure"
  | "peripheral";

export type DeviceKpiFilter = GrowthDeviceFilter;

/** Growth series pre-fetched for every device filter. */
export type GrowthByDevice = Record<GrowthDeviceFilter, YearlyGrowthPoint[]>;

/** A point in the monthly findings trend. */
export interface MonthlyTrendPoint {
  month: string;
  temuan: number;
}

/** Completion state of a scheduled PM month. */
export type PmStatus = "done" | "ongoing" | "upcoming";

/** A month entry in the PM schedule list. */
export interface PmScheduleMonth {
  /** Short month label, e.g. "Jan". */
  month: string;
  sites: string[];
  status: PmStatus;
}

/** Individual feedback rating survey response from pm_asset_it.asset_ratings. */
export interface FeedbackDetailItem {
  id: string;
  recordTimestamp: string;
  year: number;
  month: number;
  quarter: number;
  nik: string;
  nama: string;
  email: string;
  noHp: string;
  divisi: string;
  cabang: string;
  barcode: string;
  performaOk: string;
  aplikasiOk: string;
  bateraiOk: string;
  scoreStars: number;
}

