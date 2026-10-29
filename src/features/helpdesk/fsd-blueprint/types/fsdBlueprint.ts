/**
 * "SLA Blueprint" bukan status yang dipilih manual di Notion, melainkan
 * dihitung dashboard: item apa pun yang belum Done dan tanggal selesainya
 * (date_end) sudah lewat hari ini. Lihat resolveDisplayStatus() di
 * utils/fsdCalculations.ts untuk aturan lengkapnya.
 */
export type BlueprintStatus =
  | "Done"
  | "On Progress"
  | "On Queue"
  | "Not Started"
  | "SLA Blueprint";
export type BlueprintType = "New BP" | "Revisi BP" | "";
export type BlueprintImpact = "Major" | "Minor" | "";

export interface FsdBlueprintItem {
  id: number;
  owner: string;
  status: BlueprintStatus;
  module: string;
  scope: string;
  bpType: BlueprintType;
  impact: BlueprintImpact;
  picIt: string;
  picOwner: string;
  revIt: string;
  revCpp: string;
  dateStart: string;
  startKey: number;
  dateEnd: string;
  endKey: number;
  endDoc: string;
  endReview: string;
  quartal: string;
  progress: string;
}

export interface FsdFilterInput {
  year?: string;
  month?: string;
  status?: string;
  owner?: string;
  quartal?: string;
  pic?: string;
  search?: string;
}

export interface FsdStatusCount {
  Done: number;
  "On Progress": number;
  "On Queue": number;
  "Not Started": number;
  "SLA Blueprint": number;
  total: number;
}

export interface FsdKpiSummary {
  total: number;
  totalModules: number;
  doneCount: number;
  donePercentage: number;
  onProgressCount: number;
  onProgressPercentage: number;
  onQueueCount: number;
  onQueuePercentage: number;
  notStartedCount: number;
  notStartedPercentage: number;
  slaCount: number;
  slaPercentage: number;
}

export interface FsdQuarterRow {
  quartal: string;
  total: number;
  Done: number;
  "On Progress": number;
  "On Queue": number;
  "Not Started": number;
  "SLA Blueprint": number;
}

export interface FsdOwnerRow {
  owner: string;
  total: number;
  Done: number;
  "On Progress": number;
  "On Queue": number;
  "Not Started": number;
  "SLA Blueprint": number;
}

export interface FsdPicWorkload {
  name: string;
  total: number;
  done: number;
  Done: number;
  "On Progress": number;
  "On Queue": number;
  "Not Started": number;
  "SLA Blueprint": number;
}

export interface FsdScopeCompositionItem {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface FsdScopeComposition {
  docTypes: FsdScopeCompositionItem[];
  impacts: FsdScopeCompositionItem[];
}
