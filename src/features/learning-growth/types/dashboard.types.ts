export type ProgramType = "internal" | "external";

export type EventType = ProgramType | "sertifikasi";

/** Category label exactly as stored in the data source (no FE remapping). */
export type CategoryId = string;

export type VendorName = "MySkill" | "ID Networkers";

export type DataYear = "2025" | "2026";

/** One year at a time; "all" only serves cross-year aggregations, not the UI. */
export type YearFilter = "all" | DataYear;

export type MonthFilter = "ALL" | string;

export type TrainingTypeFilter = "all" | ProgramType;

export interface TrainingSession {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  type: ProgramType;
  category: CategoryId;
  person: string;
  participants?: string[];
  vendor: VendorName | null;
}

export interface Certification {
  id: string;
  name: string;
  issueDate: string; // ISO yyyy-mm-dd
  validUntil: string | null; // never fabricated when null
  person: string;
  category?: CategoryId;
  vendor: VendorName | null;
  linkedSessionId: string | null;
}

/** A deduplicated program event: trainings plus cert-only certifications. */
export interface UniqueEvent {
  id: string;
  title: string;
  date: string;
  etype: EventType;
  category: CategoryId;
  person: string;
  vendor: VendorName | null;
}

export type CertStatus =
  | { key: "none" }
  | { key: "expired" | "soon" | "active"; label: string; bg: string; fg: string; months: number };

export interface CategoryVisual {
  dot: string;
  fg: string;
  bg: string;
}

export interface DashboardData {
  trainings: TrainingSession[];
  certifications: Certification[];
  source: "database";
  updatedAt: string;
}
