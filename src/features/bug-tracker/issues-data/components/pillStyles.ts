import { IssueType, SeverityKey, SimpleStatus } from "../types/issuesData";

export const SEV_PILL_CLASS: Record<SeverityKey, string> = {
  Critical: "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400",
  Recurring:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400",
  Major: "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400",
  Minor: "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400",
  Trivia: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  Unclassified: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
};

export const STATUS_PILL_CLASS: Record<SimpleStatus, string> = {
  Done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400",
  "On Progress":
    "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400",
  Open: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

/** Role pill: Developer green · PIC Project blue · Bizdev amber */
export const ROLE_PILL_CLASS: Record<string, string> = {
  Developer:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400",
  "PIC Project":
    "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400",
  Bizdev:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400",
  Unclassified: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

export const TYPE_PILL_CLASS: Record<IssueType, string> = {
  Bug: "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400",
  CR: "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400",
  Unclassified: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

export const DAY_TONE_CLASS = {
  green: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-rose-600 dark:text-rose-400",
  muted: "text-zinc-400 dark:text-zinc-500",
} as const;

export function sevDisplayLabel(sev: SeverityKey): string {
  return sev === "Unclassified" ? "Belum" : sev;
}

export function typeDisplayLabel(type: IssueType): string {
  return type === "Unclassified" ? "Belum" : type;
}
