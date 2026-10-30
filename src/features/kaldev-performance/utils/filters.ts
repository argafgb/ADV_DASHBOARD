import "server-only";

import { getAvailableYears } from "../services/filterOptionsService";
import { normalizeMonthFilter, DEFAULT_GLOBAL_YEAR } from "./month-filter";
import { parseSource, type KaldevFilters, type SourceFilter } from "../types/kaldev.types";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export { parseSource } from "../types/kaldev.types";

export async function readKaldevFilters(params: RawSearchParams): Promise<KaldevFilters> {
  const years = await getAvailableYears();
  const rawYear = first(params.year);
  const rawMonth = first(params.month);
  const rawFrom = first(params.from);

  const fallbackYear = years[0] || DEFAULT_GLOBAL_YEAR;
  const year = rawYear && /^\d{4}$/.test(rawYear) ? rawYear : fallbackYear;
  const month = rawMonth ? normalizeMonthFilter(rawMonth, year) : "ALL";

  return { year, month, from: parseSource(rawFrom) };
}

export function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
