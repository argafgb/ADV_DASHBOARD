import { normalizeMonthFilter, normalizeYear } from "./month-filter";

export const DEPARTMENT_KEYS = ["ALL", "IT Support", "DCT Support"] as const;
export type DeptKey = (typeof DEPARTMENT_KEYS)[number];

export function normalizeDepartment(value: string | null | undefined): DeptKey {
  return DEPARTMENT_KEYS.includes(value as DeptKey)
    ? (value as DeptKey)
    : "ALL";
}

export function normalizeQuarter(value: string | null | undefined): string {
  return value && /^Q[1-4]$/i.test(value) ? value.toUpperCase() : "ALL";
}

export interface DashboardSearchParams {
  year?: string | null;
  month?: string | null;
  dept?: string | null;
  quarter?: string | null;
}

export function getDashboardFilters(params: DashboardSearchParams) {
  const year = normalizeYear(params.year);

  return {
    year,
    month: normalizeMonthFilter(params.month, year),
    dept: normalizeDepartment(params.dept),
    quarter: normalizeQuarter(params.quarter),
  };
}
