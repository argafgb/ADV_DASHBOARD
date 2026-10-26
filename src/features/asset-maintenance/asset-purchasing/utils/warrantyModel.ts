import type {
  WarrantyBrandBreakdown,
  WarrantyKpiSummary,
  WarrantyStatusDistribution,
  WarrantyUrgency,
} from "../types/warranty.types";

export const WARRANTY_STATUS_COLORS = {
  safeLong: "#10B981", // Emerald-500 (Masih Panjang >180 hari)
  medium: "#3B82F6", // Blue-500 (Masa Menengah 91-180 hari)
  warning: "#F59E0B", // Amber-500 (Peringatan 31-90 hari)
  critical: "#EF4444", // Red-500 (Kritis <=30 hari)
  expired: "#6B7280", // Zinc-500 (Sudah Habis)
} as const;

export function determineWarrantyUrgency(daysRemaining: number): WarrantyUrgency {
  if (daysRemaining <= 30) return "critical";
  if (daysRemaining <= 90) return "warning";
  if (daysRemaining <= 180) return "medium";
  return "safe";
}

export function formatDaysRemaining(days: number): string {
  if (days < 0) return `Lewat ${Math.abs(days)} hari`;
  if (days === 0) return "Hari ini";
  return `${days} hari lagi`;
}

export function calculateWarrantyKpis(counts: {
  total: number;
  safeLong: number;
  med180: number;
  warn90: number;
  crit30: number;
  expired: number;
}): WarrantyKpiSummary {
  const total = Math.max(0, counts.total);
  const activeWarranty = Math.max(
    0,
    counts.safeLong + counts.med180 + counts.warn90 + counts.crit30,
  );
  const expiredWarranty = Math.max(0, counts.expired);
  const expiringSoon = Math.max(0, counts.warn90 + counts.crit30);

  const activeWarrantyPct =
    total > 0 ? Number(((activeWarranty / total) * 100).toFixed(1)) : 0;
  const expiredWarrantyPct =
    total > 0 ? Number(((expiredWarranty / total) * 100).toFixed(1)) : 0;
  const expiringSoonPct =
    total > 0 ? Number(((expiringSoon / total) * 100).toFixed(1)) : 0;

  return {
    totalActive: total,
    activeWarranty,
    activeWarrantyPct,
    expiredWarranty,
    expiredWarrantyPct,
    expiringSoon,
    expiringSoonPct,
    expiringCritical: counts.crit30,
    expiringWarning: counts.warn90,
    mediumWarranty: counts.med180,
    safeWarranty: counts.safeLong,
  };
}

export function buildWarrantyStatusDistribution(
  kpis: WarrantyKpiSummary,
): WarrantyStatusDistribution[] {
  const total = kpis.totalActive;
  if (total === 0) return [];

  const slices = [
    {
      name: "Masih Panjang (>180 hr)",
      value: kpis.safeWarranty,
      color: WARRANTY_STATUS_COLORS.safeLong,
    },
    {
      name: "Menengah (91–180 hr)",
      value: kpis.mediumWarranty,
      color: WARRANTY_STATUS_COLORS.medium,
    },
    {
      name: "Segera Habis (31–90 hr)",
      value: kpis.expiringWarning,
      color: WARRANTY_STATUS_COLORS.warning,
    },
    {
      name: "Kritis (≤30 hr)",
      value: kpis.expiringCritical,
      color: WARRANTY_STATUS_COLORS.critical,
    },
    {
      name: "Sudah Habis",
      value: kpis.expiredWarranty,
      color: WARRANTY_STATUS_COLORS.expired,
    },
  ];

  return slices
    .filter((s) => s.value > 0)
    .map((s) => ({
      ...s,
      percentage: Number(((s.value / total) * 100).toFixed(1)),
    }));
}

/**
 * Normalizes and sorts brand breakdowns by volume.
 * If topCount is provided and > 0, groups remaining brands beyond topCount into "LAINNYA".
 * Otherwise, returns all brands individually sorted by total DESC.
 */
export function processTopBrandBreakdowns(
  rows: WarrantyBrandBreakdown[],
  topCount?: number,
): WarrantyBrandBreakdown[] {
  if (!topCount || topCount <= 0 || rows.length <= topCount) {
    return [...rows].sort((a, b) => b.total - a.total);
  }

  const sorted = [...rows].sort((a, b) => b.total - a.total);
  const head = sorted.slice(0, topCount);
  const rest = sorted.slice(topCount);

  const others: WarrantyBrandBreakdown = {
    brand: "LAINNYA",
    total: 0,
    masihPanjang: 0,
    segeraHabis: 0,
    sudahHabis: 0,
  };

  for (const item of rest) {
    others.total += item.total;
    others.masihPanjang += item.masihPanjang;
    others.segeraHabis += item.segeraHabis;
    others.sudahHabis += item.sudahHabis;
  }

  if (others.total > 0) {
    head.push(others);
  }

  return head;
}
