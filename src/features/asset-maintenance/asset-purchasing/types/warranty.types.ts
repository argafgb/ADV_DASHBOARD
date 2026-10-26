import type { CompanyFilterValue } from "@/types/asset-pm.types";

export interface WarrantyFilterInput {
  company?: CompanyFilterValue;
  site?: string;
  device?: string;
}

export interface WarrantyKpiSummary {
  totalActive: number;
  activeWarranty: number;
  activeWarrantyPct: number;
  expiredWarranty: number;
  expiredWarrantyPct: number;
  expiringSoon: number;
  expiringSoonPct: number;
  expiringCritical: number;
  expiringWarning: number;
  mediumWarranty: number;
  safeWarranty: number;
}

export interface WarrantyStatusDistribution {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export type WarrantyUrgency = "critical" | "warning" | "medium" | "safe";

export interface WarrantyMonthlyExpiry {
  monthKey: string;
  monthLabel: string;
  count: number;
  urgency: WarrantyUrgency;
}

export interface WarrantyBrandBreakdown {
  brand: string;
  total: number;
  masihPanjang: number;
  segeraHabis: number;
  sudahHabis: number;
}

export interface WarrantyUrgentItem {
  id: string;
  barcode: string;
  brand: string;
  additionalDisplay: string;
  site: string;
  company: string;
  device: string;
  purchaseDate: string;
  warrantyEndDate: string;
  daysRemaining: number;
  urgency: "critical" | "warning";
}

export interface InvalidWarrantyItem {
  id: string;
  barcode: string;
  brand: string;
  site: string;
  company: string;
  device: string;
  purchaseYear: number;
  purchaseDate: string;
}

export interface InvalidWarrantySummary {
  total: number;
  items: InvalidWarrantyItem[];
  brands: Array<{ brand: string; count: number }>;
  years: Array<{ year: number; count: number }>;
}

export interface AssetWarrantyData {
  kpis: WarrantyKpiSummary;
  statusDistribution: WarrantyStatusDistribution[];
  monthlyExpiry: WarrantyMonthlyExpiry[];
  brandBreakdown: WarrantyBrandBreakdown[];
  urgentItems: WarrantyUrgentItem[];
  syncedAt: string | null;
}
