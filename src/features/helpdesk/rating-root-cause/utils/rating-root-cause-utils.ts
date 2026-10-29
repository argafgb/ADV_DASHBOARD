export function formatNumber(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return "0";
  return value.toLocaleString("id-ID");
}

export function formatActionIT(value?: string | null): string {
  if (!value || value === "No Action Needed" || value === "0") {
    return "No Action Needed";
  }
  return value;
}
