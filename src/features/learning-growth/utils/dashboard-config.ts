import type { CategoryVisual, DataYear, VendorName } from "../types/dashboard.types";

export const PROFILE = { name: "Wisecon", role: "IT Project Manager" };

export const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

export const MONTHS_LONG = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

/** Fallback label when the source record has no category. */
export const UNCATEGORIZED_LABEL = "Belum Dikategorikan";

/** Rotating palette for categories that come straight from the data source. */
const CATEGORY_PALETTE: readonly CategoryVisual[] = [
  { dot: "#2563EB", fg: "#1D4ED8", bg: "rgba(37,99,235,.08)" },
  { dot: "#10B981", fg: "#059669", bg: "rgba(16,185,129,.09)" },
  { dot: "#F59E0B", fg: "#B45309", bg: "rgba(245,158,11,.1)" },
  { dot: "#8B5CF6", fg: "#6D28D9", bg: "rgba(139,92,246,.1)" },
  { dot: "#EF4444", fg: "#DC2626", bg: "rgba(239,68,68,.08)" },
  { dot: "#0EA5E9", fg: "#0284C7", bg: "rgba(14,165,233,.1)" },
];

const UNCATEGORIZED_VISUAL: CategoryVisual = {
  dot: "#94A3B8",
  fg: "#64748B",
  bg: "rgba(148,163,184,.12)",
};

/** Deterministic color per category label - same label, same color everywhere. */
export function categoryVisual(label: string): CategoryVisual {
  if (label === UNCATEGORIZED_LABEL) return UNCATEGORIZED_VISUAL;
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length]!;
}

export const VENDOR_DOT: Record<VendorName, string> = {
  MySkill: "#EA580C",
  "ID Networkers": "#FB923C",
};

/**
 * Single year-comparison palette used by every 2025-vs-2026 chart:
 * previous year brand blue, current year green (= status "Selesai").
 */
export const YEAR_COLORS = {
  prev: "#f59e0b",
  current: "#2563EB",
} as const;

/** Alias so the realization chart can never drift from the year palette. */
export const REALIZATION_COLORS = YEAR_COLORS;

/**
 * Sertifikat berstatus "Segera Berakhir" saat masa berlakunya tinggal kurang
 * dari sekian bulan. Sejak hari itu sertifikat masuk daftar Certification
 * Renewal di halaman Training supaya perpanjangannya sempat dijadwalkan.
 */
export const CERT_RENEWAL_WINDOW_MONTHS = 6;

const CERTIFICATIONS_PERIOD_NOTE =
  "Menu ini menampilkan seluruh sertifikat dengan status terkini, jadi filter tahun dan bulan tidak berlaku di sini";

export const DASHBOARD_CONFIG = {
  logoInitial: "A",
  brandName: "Advantage SCM",
  hubUrl: process.env.NEXT_PUBLIC_DASHBOARD_HUB_URL || "http://103.76.204.104:5777/",
  subtitle: "Learning & Growth",
  pageTitleFallback: "Learning & Growth Dashboard",
  catalogName: "Learning & Growth Dashboard",
  years: ["2026", "2025"] as const,
  defaultMonth: "ALL",
  periodFilterExemptions: {
    year: {
      "/dashboard/learning-growth/sertifikasi": CERTIFICATIONS_PERIOD_NOTE,
    },
    month: {
      "/dashboard/learning-growth": "Menu ini menampilkan data per tahun, jadi filter bulan tidak berlaku di sini",
      "/dashboard/learning-growth/sertifikasi": CERTIFICATIONS_PERIOD_NOTE,
    },
  },
} as const;

export const DEFAULT_YEAR: DataYear = DASHBOARD_CONFIG.years[0];
export const YEAR_OPTIONS = DASHBOARD_CONFIG.years.map((y) => ({ v: y, t: y }));
export const DEFAULT_MONTH = DASHBOARD_CONFIG.defaultMonth;
export const DEFAULT_MONTH_INDEX = 0;

export function comparisonYearOf(year: string): string | null {
  const years: readonly string[] = DASHBOARD_CONFIG.years;
  const index = years.indexOf(year);
  return index < 0 ? null : (years[index + 1] ?? null);
}

export const COMPARISON_YEAR = comparisonYearOf(DEFAULT_YEAR);
