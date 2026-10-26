import { parseMonthFilter } from "@/lib/filter-utils";
import { parseCompanyFilter } from "@/lib/company-filter";
import { normalizeSiteName, isUnitSite } from "@/lib/site-utils";
import type {
  DeviceRequestItem,
  DeviceRequestType,
  DeviceRequestTypeFilter,
  DeviceRequestStatusFilter,
  DeviceRequestsModel,
} from "../types";

export const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export const MONTH_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const TYPE_META: Record<
  DeviceRequestType,
  { label: string; color: string }
> = {
  router: { label: "Router", color: "#2563EB" },
  ap: { label: "Access Point", color: "#10B981" },
  switch: { label: "Switch", color: "#F59E0B" },
};

export const REGION_ORDER = ["CID", "R1", "R2", "R3", "R4", "R5", "R6"];

const REGION_SITES: Record<string, string[]> = {
  CID: ["Ampasit", "Cideng", "Meruya", "Rawamangun", "Senen GA", "Tanah Abang 5", "Wira Carita", "Wiracarita"],
  R1: ["Batam", "Jambi", "Medan", "Padang", "Palembang", "Pekanbaru"],
  R2: ["Balikpapan", "Banjarmasin", "Pontianak", "Samarinda", "Singkawang"],
  R3: ["Bengkulu", "Lampung", "Serang"],
  R4: ["Bandung", "Cirebon", "Denpasar", "Karawang", "Kupang", "Mataram", "Tasikmalaya"],
  R5: ["COS Semarang", "Kudus", "Purwokerto", "Semarang", "Solo", "Tegal", "Yogyakarta"],
  R6: ["Jember", "Kediri", "Makassar", "Malang", "Manado", "Surabaya"],
};

/** Normalizes a raw device type string to canonical type key. */
export function normalizeDeviceType(raw?: string | null): DeviceRequestType {
  const lower = (raw || "").toLowerCase();
  if (
    lower.includes("access") ||
    lower.includes("acces") ||
    lower.includes("point") ||
    lower.includes("ap")
  ) {
    return "ap";
  }
  if (
    lower.includes("switch") ||
    lower.includes("hub") ||
    lower.includes("des-") ||
    lower.includes("sg10")
  ) {
    return "switch";
  }
  return "router";
}

/** Resolves company affiliation from raw intended site label and barcode. */
export function resolveItemCompany(
  intended?: string | null,
  barcode?: string | null,
): "Advantage" | "Wisesa" | "Etrama" {
  const i = (intended || "").toUpperCase();
  const b = (barcode || "").toUpperCase();
  if (i.includes("ETRAMA") || b.startsWith("ETR")) return "Etrama";
  if (/^ADV\s+/i.test(intended || "") || b.startsWith("ADV")) return "Advantage";
  return "Wisesa";
}

/** Cleans raw intended text to canonical site name. */
export function cleanSiteName(rawIntended?: string | null): string {
  if (!rawIntended) return "Unknown";
  const cleaned = rawIntended
    .replace(/\u00a0/g, " ")
    .replace(/^(ADV|WSS|WISESA)\s+/i, "")
    .trim();
  const canonical = normalizeSiteName(cleaned);
  return canonical || cleaned;
}

/** Resolves site name to its operational region. */
export function resolveRegion(site: string): string {
  const key = site.trim().toLowerCase();
  for (const [region, sites] of Object.entries(REGION_SITES)) {
    if (sites.some((s) => s.toLowerCase() === key)) return region;
  }
  return isUnitSite(site) ? "CID" : "Lainnya";
}

export function regionRank(region: string): number {
  const i = REGION_ORDER.indexOf(region);
  return i < 0 ? 99 : i;
}

export interface DeviceRequestsModelInput {
  items: DeviceRequestItem[];
  year: string;
  month: string;
  site: string;
  company?: string;
  region: string;
  status: DeviceRequestStatusFilter;
  type: DeviceRequestTypeFilter;
}

const TYPES: DeviceRequestType[] = ["router", "ap", "switch"];

/**
 * Derives comprehensive data metrics for KPIs, charts, matrix, and details
 * given the filtered items and user selection.
 */
export function deriveDeviceRequestsModel(
  input: DeviceRequestsModelInput,
): DeviceRequestsModel {
  const parsedMonth = parseMonthFilter(input.month);
  const monthSet = new Set(parsedMonth.months);

  const activeType = (t: DeviceRequestType) =>
    input.type === "all" || input.type === t;

  const matchesStatus = (item: DeviceRequestItem) =>
    input.status === "all" || item.status === input.status;

  const matchesType = (item: DeviceRequestItem) => activeType(item.type);

  // Year items
  const yearItems = input.items.filter((r) => String(r.year) === input.year);

  // Global site filter
  const siteKey =
    input.site && input.site !== "ALL" ? input.site.toUpperCase() : null;
  const matchesSite = (item: DeviceRequestItem) =>
    !siteKey || item.site.toUpperCase() === siteKey;

  // Global company filter
  const parsedCompany = parseCompanyFilter(input.company);
  const matchesCompany = (item: DeviceRequestItem) => {
    if (parsedCompany.isAll) return true;
    return (
      (parsedCompany.codes.includes("ADV") && item.company === "Advantage") ||
      (parsedCompany.codes.includes("WSS") && item.company === "Wisesa") ||
      (parsedCompany.codes.includes("ETR") && item.company === "Etrama")
    );
  };

  // Local region filter
  const matchesRegion = (item: DeviceRequestItem) =>
    input.region === "ALL" || item.region === input.region;

  // In-place scope: global year + site + company + local region
  const inPlace = yearItems.filter(
    (r) =>
      matchesSite(r) &&
      matchesCompany(r) &&
      matchesRegion(r) &&
      matchesStatus(r),
  );

  // Scoped by month
  const inMonth = (r: DeviceRequestItem) =>
    parsedMonth.isAll || monthSet.has(r.month);
  const scoped = inPlace.filter((r) => inMonth(r) && matchesType(r));

  // Region options available for the year
  const regionOptions = [...new Set(yearItems.map((r) => r.region))].sort(
    (a, b) => regionRank(a) - regionRank(b),
  );

  // KPI calculations
  const total = scoped.length;
  const penambahanCount = scoped.filter((r) => r.status === "Penambahan").length;
  const pergantianCount = scoped.filter((r) => r.status === "Pergantian").length;
  const siteCount = new Set(scoped.map((r) => r.site)).size;
  const monthCount = new Set(scoped.map((r) => r.month)).size;

  const typeCards = TYPES.map((t) => {
    const matching = scoped.filter((r) => r.type === t);
    const count = matching.length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    const uniqueSites = new Set(matching.map((r) => r.site)).size;
    return {
      type: t,
      label: TYPE_META[t].label,
      value: count,
      pct,
      siteCount: uniqueSites,
    };
  });

  // Monthly trend (all 12 months for this place & filters)
  const monthly = MONTH_SHORT.map((label, idx) => {
    const mNum = idx + 1;
    const rs = inPlace.filter((r) => r.month === mNum);
    return {
      month: label,
      router: activeType("router")
        ? rs.filter((r) => r.type === "router").length
        : 0,
      ap: activeType("ap") ? rs.filter((r) => r.type === "ap").length : 0,
      switch: activeType("switch")
        ? rs.filter((r) => r.type === "switch").length
        : 0,
    };
  });

  // Region distribution (all regions in the year matching month + site + status + type)
  const regionBase = yearItems.filter(
    (r) =>
      matchesSite(r) &&
      matchesCompany(r) &&
      matchesStatus(r) &&
      matchesType(r) &&
      inMonth(r),
  );
  const regions = regionOptions
    .map((region) => {
      const rs = regionBase.filter((r) => r.region === region);
      const router = rs.filter((r) => r.type === "router").length;
      const ap = rs.filter((r) => r.type === "ap").length;
      const sw = rs.filter((r) => r.type === "switch").length;
      return { region, router, ap, switch: sw, total: router + ap + sw };
    })
    .filter((r) => r.total > 0);

  // Site × month schedule matrix
  const sitesInScope = [...new Set(scoped.map((r) => r.site))];
  const schedule = sitesInScope
    .map((site) => {
      const rs = inPlace.filter((r) => r.site === site);
      const cells = MONTH_SHORT.map((_, idx) => {
        const mNum = idx + 1;
        const inM = rs.filter((r) => r.month === mNum);
        return {
          router: activeType("router")
            ? inM.filter((r) => r.type === "router").length
            : 0,
          ap: activeType("ap")
            ? inM.filter((r) => r.type === "ap").length
            : 0,
          switch: activeType("switch")
            ? inM.filter((r) => r.type === "switch").length
            : 0,
        };
      });
      const rowTotal = cells.reduce(
        (s, c) => s + c.router + c.ap + c.switch,
        0,
      );
      const siteRegion = rs[0]?.region || resolveRegion(site);
      return { site, region: siteRegion, cells, total: rowTotal };
    })
    .sort((a, b) => b.total - a.total || a.site.localeCompare(b.site));

  const scheduleMonthTotals = MONTH_SHORT.map((_, idx) =>
    schedule.reduce((s, row) => {
      const c = row.cells[idx];
      return s + c.router + c.ap + c.switch;
    }, 0),
  );

  // Detail table items: sorted by date descending
  const details = [...scoped].sort((a, b) => b.date.localeCompare(a.date));

  return {
    total,
    siteCount,
    monthCount,
    penambahanCount,
    pergantianCount,
    typeCards,
    monthly,
    regions,
    schedule,
    scheduleMonthTotals,
    details,
    regionOptions,
  };
}
