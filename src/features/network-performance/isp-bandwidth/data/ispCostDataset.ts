import { fmtNum, rupiah, ringkas } from "../utils/formatters";
import type {
  IspBranchModalData,
  IspBranchMonthlyRow,
} from "../types/isp-cost.types";

export const TR_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export const ISLANDS: Record<string, string[]> = {
  R1: ["Batam", "Jambi", "Medan", "Padang", "Palembang", "Pekanbaru"],
  R2: ["Balikpapan", "Banjarmasin", "Pontianak", "Samarinda", "Singkawang"],
  R3: [
    "Bengkulu",
    "Cideng",
    "Lampung",
    "Meruya",
    "Rawamangun",
    "Serang",
  ],
  R4: [
    "Bandung",
    "Cirebon",
    "Denpasar",
    "Karawang",
    "Kupang",
    "Mataram",
    "Tasikmalaya",
  ],
  R5: [
    "Kudus",
    "Purwokerto",
    "Semarang",
    "Solo",
    "Tegal",
    "Yogyakarta",
  ],
  R6: ["Jember", "Kediri", "Makassar", "Malang", "Manado", "Surabaya"],
};

export const ISLAND_AREA: Record<string, string> = {
  R1: "Sumatera utara & tengah",
  R2: "Kalimantan",
  R3: "Jakarta, Lampung & Bengkulu",
  R4: "Jawa Barat, Bali & Nusa",
  R5: "Jawa Tengah & DIY",
  R6: "Jawa Timur & Sulawesi",
};

export const ISLAND_ORDER = ["R1", "R2", "R3", "R4", "R5", "R6"];

export function islandOf(name: string): string {
  for (const k of ISLAND_ORDER) {
    if (ISLANDS[k]?.includes(name)) return k;
  }
  return "Unit";
}

export const ISP_RATE: Record<
  string,
  { base: number; perMbps: number; std: number }
> = {
  Iforte: { base: 1750000, perMbps: 34000, std: 500 },
  Remala: { base: 1500000, perMbps: 30000, std: 200 },
  Biznet: { base: 1250000, perMbps: 26000, std: 200 },
  Oxygen: { base: 1200000, perMbps: 25000, std: 150 },
  HSP: { base: 1100000, perMbps: 24000, std: 100 },
  Tachyon: { base: 1000000, perMbps: 23000, std: 200 },
  Myrep: { base: 850000, perMbps: 21000, std: 100 },
  Indibiz: { base: 900000, perMbps: 22000, std: 100 },
  Faznet: { base: 800000, perMbps: 20000, std: 100 },
  Netstart: { base: 800000, perMbps: 20000, std: 100 },
  FNI: { base: 780000, perMbps: 19500, std: 100 },
  IHome: { base: 600000, perMbps: 15000, std: 50 },
  LiveOn: { base: 1400000, perMbps: 28000, std: 100 },
  Starlink: { base: 2100000, perMbps: 0, std: 100 },
  Axis: { base: 700000, perMbps: 18000, std: 50 },
  "By.u": { base: 550000, perMbps: 14000, std: 50 },
  Jujung: { base: 600000, perMbps: 15000, std: 50 },
};

export function ispRateOf(v: string) {
  const norm = v === "Indizbiz" ? "Indibiz" : v;
  return ISP_RATE[norm] || { base: 800000, perMbps: 20000, std: 100 };
}

export function buildBranchModalData(
  branchRows: IspBranchMonthlyRow[],
  branchName: string,
  year: number = 2026,
): IspBranchModalData | null {
  const r = branchRows.find((x) => x.branch === branchName);
  if (!r) return null;

  const maxShare = Math.max(...r.links.map((l) => l.share), 1);
  const hi = Math.max(...r.months);
  const lo = Math.min(...r.months);
  const hiIdx = r.months.indexOf(hi);
  const loIdx = r.months.indexOf(lo);
  const above = r.months.filter((c) => c > r.avgM).length;

  return {
    branch: r.branch,
    region: r.region,
    linkN: r.linkN,
    subtitle: r.linkN + " link · region " + r.region + " · Jan–Des " + year,
    cost: rupiah(Math.round(r.avgM)),
    yearTotal: ringkas(r.yearTotal),
    hiLabel: TR_MONTHS[hiIdx] || "",
    hiValue: rupiah(hi),
    loLabel: TR_MONTHS[loIdx] || "",
    loValue: rupiah(lo),
    spread: rupiah(hi - lo),
    aboveNote: above + " dari 12 bulan di atas rata-rata",
    months: r.months.map((c, mi) => {
      const d = c - r.avgM;
      const pct = Math.round((d / (r.avgM || 1)) * 100);
      const isHi = mi === hiIdx;
      const isLo = mi === loIdx;
      return {
        month: TR_MONTHS[mi],
        value: rupiah(c),
        width: ((c / hi) * 100).toFixed(1) + "%",
        color: isHi ? "#F59E0B" : isLo ? "#10B981" : "var(--accent)",
        delta: (pct > 0 ? "+" : "") + pct + "%",
        deltaColor:
          pct > 0 ? "#B45309" : pct < 0 ? "#047857" : "var(--text-placeholder)",
        note: isHi
          ? "Biaya tertinggi tahun ini"
          : isLo
            ? "Biaya terendah tahun ini"
            : "Selisih dari rata-rata " + rupiah(Math.abs(Math.round(d))),
      };
    }),
    links: r.links
      .slice()
      .sort((a, b) => b.cost - a.cost)
      .map((l, i) => ({
        vendor: l.vendor,
        mbps: fmtNum(l.mbps, 0) + " Mbps",
        cost: rupiah(l.cost),
        share: Math.round(l.share) + "%",
        width: ((l.share / maxShare) * 100).toFixed(1) + "%",
        color: i === 0 ? "var(--accent)" : "#93BBF7",
      })),
  };
}
