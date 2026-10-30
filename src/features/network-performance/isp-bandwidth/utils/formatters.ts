// Currency & number formatting helpers matching design system and prototype

export function fmtNum(n: number, dec: number = 0): string {
  const s = Math.abs(n).toFixed(dec).split(".");
  s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (n < 0 ? "-" : "") + s.join(",");
}

export function rupiah(n: number): string {
  return "Rp " + fmtNum(n, 0);
}

export function juta(n: number): string {
  return "Rp " + fmtNum(n / 1000000, 1) + " jt";
}

export function ringkas(n: number): string {
  if (n >= 1e9) return fmtNum(n / 1e9, 2) + " M";
  if (n >= 1e6) return fmtNum(n / 1e6, 1) + " jt";
  return fmtNum(Math.round(n / 1e3), 0) + " rb";
}
