import { C } from "@/lib/utils";
import type { FindingStatus } from "@/types/asset-pm.types";

/**
 * Types specific to the Finding & Asset Lifecycle dashboard feature.
 */

/** One row in the "Detail temuan & lifecycle" table. */
export interface FindingRow {
  id?: string;
  barcode: string;
  periode: string;
  branch: string;
  device: string;
  kategori: string;
  problem: string;
  action: string;
  status: FindingStatus;
}

/** One status slice inside a branch's resolution bar. */
export interface BranchStatusSegment {
  label: string;
  value: number;
  color: string;
}

/** Resolution status distribution for a single branch (segmented bar). */
export interface BranchResolution {
  branch: string;
  total: number;
  segments: BranchStatusSegment[];
}

/** A point in the stacked category trend (grouped by category_problem). */
export interface CategoryTrendPoint {
  month: string;
  general: number;
  hardware: number;
  software: number;
  lifecycle: number;
}

/** Monthly workstation replacement vs new-asset procurement. */
export interface ReplacementPoint {
  month: string;
  replacement: number;
  newAsset: number;
}

/** Status palette for resolution status breakdown. */
export const RESOLUTION_STATUSES: { label: string; base: number; color: string }[] =
  [
    { label: "Selesai", base: 24, color: C.green },
    { label: "Dalam Proses", base: 0.3, color: C.accent },
    { label: "Belum Ditangani", base: 2, color: C.amber },
    { label: "Aset Decommissioned", base: 5, color: C.violet },
    { label: "Lainnya", base: 0, color: C.muted },
  ];
