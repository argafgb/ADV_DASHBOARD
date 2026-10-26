export const DEVICE_REQUEST_TYPES = ["router", "ap", "switch"] as const;
export type DeviceRequestType = (typeof DEVICE_REQUEST_TYPES)[number];
export type DeviceRequestTypeFilter = "all" | DeviceRequestType;

export const DEVICE_REQUEST_STATUSES = ["Penambahan", "Pergantian"] as const;
export type DeviceRequestStatus = (typeof DEVICE_REQUEST_STATUSES)[number];
export type DeviceRequestStatusFilter = "all" | DeviceRequestStatus;

export interface DeviceRequestDbRow {
  id: string;
  year: number;
  month: number;
  quarter: number;
  date: string;
  barcode: string;
  asset_name: string;
  intended: string | null;
  status: string | null;
  type: string;
}

export interface DeviceRequestItem {
  id: string;
  year: number;
  month: number;
  quarter: number;
  date: string;
  barcode: string;
  assetName: string;
  intended: string;
  site: string;
  company: "Advantage" | "Wisesa" | "Etrama";
  region: string;
  status: string;
  type: DeviceRequestType;
}

export interface DeviceRequestsData {
  items: DeviceRequestItem[];
}

export interface DeviceRequestTypeCard {
  type: DeviceRequestType;
  label: string;
  value: number;
  pct: number;
  siteCount: number;
}

export interface MonthlyRequestPoint {
  month: string;
  router: number;
  ap: number;
  switch: number;
}

export interface RegionRequestPoint {
  region: string;
  router: number;
  ap: number;
  switch: number;
  total: number;
}

export interface SiteScheduleRow {
  site: string;
  region: string;
  /** index 0-11 → per type units */
  cells: Record<DeviceRequestType, number>[];
  total: number;
}

export interface DeviceRequestsModel {
  total: number;
  siteCount: number;
  monthCount: number;
  penambahanCount: number;
  pergantianCount: number;
  typeCards: DeviceRequestTypeCard[];
  monthly: MonthlyRequestPoint[];
  regions: RegionRequestPoint[];
  schedule: SiteScheduleRow[];
  scheduleMonthTotals: number[];
  details: DeviceRequestItem[];
  regionOptions: string[];
}
