import type { BarDatum } from "@/types/asset-pm.types";

/**
 * Types specific to the Comparison dashboard feature.
 */

/** Age distribution of assets by production year. */
export interface UsiaAsetData {
  bars: BarDatum[];
  total: number;
  peakYear: string;
}

/** Repair & Maintenance comparison per branch (2025 vs 2026). */
export interface RnmDatum {
  branch: string;
  y2025: number;
  y2026: number;
}

/** Side-by-side finding-category comparison (2025 vs 2026). */
export interface KategoriTemuanResult {
  items2025: BarDatum[];
  items2026: BarDatum[];
}

/** Device-type tab for the asset-age distribution chart. */
export type UsiaAsetTabCategory =
  | "workstation"
  | "infrastructure"
  | "peripheral";

/** Branch scope filter for the RnM-per-branch chart. */
export type RnmScope = "all" | "Operational" | "Unit";

/** Device category filter for the RnM-per-branch chart. */
export type RnmCategory =
  | "all"
  | "Workstation"
  | "Infrastructure"
  | "Peripheral";
