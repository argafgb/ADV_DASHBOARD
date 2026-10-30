import { MONTHS } from "./month-filter";

export type IncidentSeverity = "critical" | "high" | "medium" | "low";

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0m";
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}j ${mins}m` : `${hrs}j`;
}

export function formatDateDisplay(dateStr?: string | Date): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);

  const day = String(d.getDate()).padStart(2, "0");
  const monthName = MONTHS[d.getMonth()];
  const yr = String(d.getFullYear()).slice(-2);
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");

  return `${day}-${monthName}-${yr} ${hours}:${mins}`;
}

export function categorizeSeverity(sevStr?: string): IncidentSeverity {
  if (!sevStr) return "low";
  const lower = sevStr.toLowerCase();
  if (lower === "critical") return "critical";
  if (lower === "high") return "high";
  if (lower === "medium") return "medium";
  return "low";
}

export function mapSeverity(sevStr?: string): "critical" | "high" | "medium" | "low" {
  return categorizeSeverity(sevStr);
}
