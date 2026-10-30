import "server-only";

import { normalizeMonthFilter, normalizeYear } from "@/lib/month-filter";
import { getOrgFilterOptions } from "../services/filterOptionsService";
import {
  MODAL_KINDS,
  RESULTS,
  STATUSES,
  type GoldenQuery,
  type ItrFilters,
  type ModalKind,
  type ModalQuery,
  type OverviewSeg,
  type RepairQuery,
  type RepairResult,
  type RepairStatus,
} from "../types/it-repair.types";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Filter global dari URL: Tahun & Bulan dinormalkan;
 * Location & Ownership khusus dashboard ini.
 */
export async function readItrFilters(params: RawSearchParams): Promise<ItrFilters> {
  const { years } = await getOrgFilterOptions();
  const rawYear = first(params.year);
  const requestedYear = normalizeYear(rawYear);
  const year = years.length === 0 || years.includes(requestedYear) ? requestedYear : years[0];
  const month = normalizeMonthFilter(first(params.month), year);

  return {
    year,
    month,
    location: first(params.location)?.trim() || "Semua",
    ownership: first(params.ownership)?.trim() || "Semua",
  };
}

export function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function parseOverviewQuery(params: RawSearchParams): {
  seg: OverviewSeg;
  modal: ModalQuery | null;
} {
  const seg: OverviewSeg = first(params.seg) === "pic" ? "pic" : "item";
  const kind = first(params.modal);
  const modal: ModalQuery | null =
    kind && (MODAL_KINDS as readonly string[]).includes(kind)
      ? { kind: kind as ModalKind, value: first(params.mv) ?? "", page: parsePage(first(params.mpage)) }
      : null;
  return { seg, modal };
}

export function parseRepairQuery(params: RawSearchParams): RepairQuery {
  const status = first(params.status);
  const result = first(params.result);
  const branch = first(params.branch);
  return {
    status: (STATUSES as readonly string[]).includes(status ?? "") ? (status as RepairStatus) : "Semua",
    item: first(params.item) || "Semua",
    pic: first(params.pic) || "Semua",
    result: (RESULTS as readonly string[]).includes(result ?? "") ? (result as RepairResult) : null,
    branch: branch ? branch.split(",").map((s) => s.trim()).filter(Boolean) : null,
    q: first(params.q) || "",
    page: parsePage(first(params.page)),
  };
}

export function parseGoldenQuery(params: RawSearchParams): GoldenQuery {
  const result = first(params.result);
  const status = first(params.status);
  return {
    result: (RESULTS as readonly string[]).includes(result ?? "") ? (result as RepairResult) : "Semua",
    item: first(params.item) || "Semua",
    pic: first(params.pic) || "Semua",
    status: (STATUSES as readonly string[]).includes(status ?? "") ? (status as RepairStatus) : null,
    q: first(params.q) || "",
    page: parsePage(first(params.page)),
  };
}
