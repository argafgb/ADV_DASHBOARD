import type { FindingStatus } from "@/types/asset-pm.types";

/**
 * Maps raw database status_temuan strings to the standard UI FindingStatus.
 */
export function mapDbStatus(statusTemuan: string | null): FindingStatus {
  if (!statusTemuan) return "Belum Ditangani";
  const upper = statusTemuan.toUpperCase().trim();
  if (upper === "DONE" || upper === "SELESAI") return "Selesai";
  if (upper === "ON PROGRESS" || upper === "DALAM PROSES")
    return "Dalam Proses";
  return "Belum Ditangani";
}
