/**
 * Shared type schemas for the IT Asset PM dashboard features.
 */

export type CompanyCode = "ADV" | "WSS" | "ETR";

export type CompanyFilterValue =
  | "ALL"
  | CompanyCode
  | "ADV,WSS"
  | "ADV,ETR"
  | "ETR,WSS"
  | string;

export interface AssetFilterInput {
  year: string;
  month: string;
  site: string;
  company?: CompanyFilterValue;
}

export interface CompanyOption {
  value: CompanyCode;
  label: string;
  code: CompanyCode;
  shortLabel: string;
}

export const COMPANY_OPTIONS: CompanyOption[] = [
  { value: "ADV", label: "Advantage (ADV)", code: "ADV", shortLabel: "ADV" },
  { value: "WSS", label: "Wisesa (WSS)", code: "WSS", shortLabel: "WSS" },
  { value: "ETR", label: "Etrama (ETR)", code: "ETR", shortLabel: "ETR" },
];

export interface SiteOption {
  value: string;
  label: string;
}

export const SITES = [
  "Jakarta",
  "Cabang Surabaya",
  "Cabang Bandung",
  "Cabang Medan",
  "Cabang Makassar",
  "Cabang Semarang",
  "Cabang Denpasar",
  "Cabang Balikpapan",
] as const;
export type Site = (typeof SITES)[number];

export const DEVICE_TYPES = [
  "NoteBook",
  "Mini PC",
  "PC",
  "Access Point",
  "Switch",
  "Scanner Doc",
  "Scanner Barcode",
  "Printer",
] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

export const FINDING_STATUSES = [
  "Selesai",
  "Dalam Proses",
  "Belum Ditangani",
] as const;
export type FindingStatus = (typeof FINDING_STATUSES)[number];

export const CATEGORIES = [
  "Service Workstation",
  "Service Printer",
  "Service Peripheral",
  "Service Network",
  "Instalasi Ulang",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** A single KPI stat tile. */
export interface KpiDatum {
  label: string;
  value: number;
  unit?: string;
  icon: string;
  deltaPct?: number;
  positive?: boolean;
  isUp?: boolean;
  currency?: boolean;
  periodLabel?: string;
}

/** A labelled value used by bar lists and horizontal bar charts. */
export interface BarDatum {
  label: string;
  value: number;
  color?: string;
  subItems?: { label: string; value: number }[];
}

/** A slice of a donut/pie chart. */
export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}
