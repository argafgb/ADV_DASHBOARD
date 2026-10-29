// Helper format angka/durasi — port fmtId/fmtNum/progTone/durMin/fmtDur/
// slaNum/fmtSla dari sumber (app_logic.js).

export function fmtId(n: number | null | undefined, dec?: number): string {
  if (n == null || isNaN(n)) return "—";
  return n.toFixed(dec == null ? 1 : dec).replace(".", ",");
}

export function fmtNum(n: number, dec?: number): string {
  const d = dec == null ? 2 : dec;
  const s = Math.abs(n).toFixed(d).split(".");
  s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (n < 0 ? "-" : "") + s.join(",");
}

export function progTone(p: number): { fg: string; bar: string } {
  if (p === 0) return { fg: "var(--text-placeholder)", bar: "#D7DCE5" };
  if (p >= 80) return { fg: "#047857", bar: "#10B981" };
  if (p >= 20) return { fg: "#B45309", bar: "#F59E0B" };
  return { fg: "#B91C1C", bar: "#EF4444" };
}

export function durMin(s: string): number {
  const jm = /(\d+)j/.exec(s);
  const mm = /(\d+)m/.exec(s);
  return (jm ? +jm[1] * 60 : 0) + (mm ? +mm[1] : 0);
}

export function fmtDur(min: number): string {
  const j = Math.floor(min / 60);
  const m = min % 60;
  return (j ? j + "j " : "") + (m < 10 ? "0" + m : m) + "m";
}

export function slaNum(v: number | string): number | null {
  let n = typeof v === "number" ? v : parseFloat(String(v).replace("%", ""));
  if (isNaN(n)) return null;
  if (n <= 1) n *= 100;
  return n;
}

export function fmtSla(v: number | string): string {
  const n = slaNum(v);
  return n == null ? String(v) : n.toFixed(2) + "%";
}
