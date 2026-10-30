import type { AssetCategory, AssetStatus } from "../types/asset.types";

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  Router: "Router",
  Switch: "Switch",
  AP: "Access Point",
};

export const CATEGORY_COLORS: Record<AssetCategory, string> = {
  Router: "#2563EB",
  Switch: "#D97706",
  AP: "#059669",
};

export const MONTH_NAMES_SHORT = [
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
];

export function getCategoryLabel(category: AssetCategory): string {
  return CATEGORY_LABELS[category] || category;
}

export function getCategoryColor(category: AssetCategory): string {
  return CATEGORY_COLORS[category] || "#6B7280";
}

export function getStatusBadgeStyle(status: AssetStatus): {
  bg: string;
  fg: string;
} {
  if (status === "Penambahan") {
    return {
      bg: "color-mix(in srgb, var(--status-green-fg) 10%, white)",
      fg: "var(--status-green-fg)",
    };
  }
  return {
    bg: "color-mix(in srgb, var(--status-red-fg) 9%, white)",
    fg: "var(--status-red-fg)",
  };
}

export function formatNumberId(value: number, decimals: number = 0): string {
  if (value == null || isNaN(value)) return "0";
  const parts = value.toFixed(decimals).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.join(",");
}

export function formatAvgId(value: number): string {
  if (value == null || isNaN(value)) return "0";
  return String(Math.round(value * 10) / 10).replace(".", ",");
}
