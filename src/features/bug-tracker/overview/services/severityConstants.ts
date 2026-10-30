// Client-safe severity constants shared by overview + issues features.
// Do NOT add "server-only" imports here.
import { SeverityKey, SeverityType } from "../types/overviewTypes";

export const SEVERITY_WEIGHTS: Record<SeverityKey, number> = {
  Critical: 10,
  Recurring: 8,
  Major: 5,
  Minor: 2,
  Trivia: 1,
  Unclassified: 0,
};

export const SEVERITY_ORDER: SeverityType[] = [
  "Critical",
  "Major",
  "Minor",
  "Recurring",
  "Trivia",
];

export const SEVERITY_COLORS: Record<SeverityKey, string> = {
  Critical: "#ef4444",
  Recurring: "#10b981",
  Major: "#f59e0b",
  Minor: "#2563EB",
  Trivia: "#6b7280",
  Unclassified: "#9ca3af",
};

export const SEVERITY_DESC: Record<SeverityType, string> = {
  Critical: "Sistem gagal / data salah",
  Recurring: "Temuan berulang setelah fix",
  Major: "Fungsi utama terganggu",
  Minor: "Fungsi jalan, perilaku salah",
  Trivia: "Tampilan / penulisan",
};

/** Display stages in standalone order. DB "Temuan After Live" is shown as "Live on Monitoring". */
export const STAGE_LABELS = [
  "Testing PIC",
  "SIT",
  "Change Request",
  "Live on Monitoring",
] as const;
