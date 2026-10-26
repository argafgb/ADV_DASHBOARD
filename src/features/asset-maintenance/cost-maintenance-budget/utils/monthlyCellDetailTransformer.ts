import { fmt } from "@/lib/utils";

export interface RawMonthlyCellDbRow {
  company: string;
  device_type: string;
  device_count: number;
  total_rent: number;
  total_repair: number;
  total_cost: number;
}

export interface MonthlyCellCategoryItem {
  label: string;
  total: number;
  totalFmt: string;
  sewa: number;
  sewaFmt: string;
  repair: number;
  repairFmt: string;
  sewaBar: string;
  repairBar: string;
  shareMonth: string;
}

export interface MonthlyCellDetailResult {
  site: string;
  region: string;
  type: string;
  month: string;
  total: number;
  totalFmt: string;
  rowTotal: number;
  deviceCount: number;
  costPerUnit: number;
  sharePct: string;
  sewaTotal: number;
  sewaPct: string;
  sewaWisesa: number;
  sewaAdv: number;
  repairTotal: number;
  repairPct: string;
  repairWisesa: number;
  repairAdv: number;
  repairWisesaBar: string;
  repairAdvBar: string;
  categories: MonthlyCellCategoryItem[];
}

function formatCompactRp(val: number): string {
  if (!val || val === 0) return "0 rb";
  if (val >= 1_000_000_000) {
    const num = val / 1_000_000_000;
    return (
      num.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) + " M"
    );
  }
  if (val >= 1_000_000) {
    const num = val / 1_000_000;
    return (
      num.toLocaleString("id-ID", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) + " jt"
    );
  }
  if (val >= 1_000) {
    const num = Math.round(val / 1000);
    return num.toLocaleString("id-ID") + " rb";
  }
  return val.toString();
}

/**
 * Transforms raw SQL aggregate rows for a specific site & month into a full MonthlyCellDetailResult.
 * Business Rules:
 * - Sewa (Rent Cost): 100% Wisesa (Advantage sewa is set to 0).
 * - Repair (Repair Cost): Shared between Wisesa and Advantage.
 */
export function transformMonthlyCellDetail(
  rows: RawMonthlyCellDbRow[],
  site: string,
  region: string,
  type: string,
  month: string,
  rowTotal: number,
): MonthlyCellDetailResult {
  let deviceCount = 0;
  let sewaWisesa = 0;
  let sewaAdv = 0; // Always 0 per business rule
  let repairWisesa = 0;
  let repairAdv = 0;

  const categoryMap: Record<
    string,
    { label: string; sewa: number; repair: number }
  > = {
    workstation: { label: "Workstation", sewa: 0, repair: 0 },
    peripheral: { label: "Peripheral", sewa: 0, repair: 0 },
    infrastructure: { label: "Infrastruktur", sewa: 0, repair: 0 },
  };

  for (const r of rows) {
    const isWisesa = (r.company || "").toLowerCase().includes("wisesa");
    const devTypeKey = (r.device_type || "").toLowerCase().trim();
    const count = Number(r.device_count || 0);

    const rentCost = isWisesa ? Number(r.total_rent || 0) : 0;
    const repairCost = Number(r.total_repair || 0);

    deviceCount += count;

    if (isWisesa) {
      sewaWisesa += rentCost;
      repairWisesa += repairCost;
    } else {
      sewaAdv += 0;
      repairAdv += repairCost;
    }

    if (categoryMap[devTypeKey]) {
      categoryMap[devTypeKey].sewa += rentCost;
      categoryMap[devTypeKey].repair += repairCost;
    }
  }

  const sewaTotal = sewaWisesa + sewaAdv;
  const repairTotal = repairWisesa + repairAdv;
  const total = sewaTotal + repairTotal;

  const costPerUnit = deviceCount > 0 ? Math.round(total / deviceCount) : 0;
  const sharePct = rowTotal > 0 ? ((total / rowTotal) * 100).toFixed(1) : "0.0";

  const sewaPct =
    total > 0 ? ((sewaTotal / total) * 100).toFixed(1) + "%" : "0.0%";
  const repairPct =
    total > 0 ? ((repairTotal / total) * 100).toFixed(1) + "%" : "0.0%";

  const repairWisesaBar =
    repairTotal > 0
      ? ((repairWisesa / repairTotal) * 100).toFixed(1) + "%"
      : "0%";
  const repairAdvBar =
    repairTotal > 0 ? ((repairAdv / repairTotal) * 100).toFixed(1) + "%" : "0%";

  const categories: MonthlyCellCategoryItem[] = Object.values(categoryMap).map(
    (cat) => {
      const catTotal = cat.sewa + cat.repair;
      const sewaBar =
        catTotal > 0 ? ((cat.sewa / catTotal) * 100).toFixed(1) + "%" : "0%";
      const repairBar =
        catTotal > 0 ? ((cat.repair / catTotal) * 100).toFixed(1) + "%" : "0%";
      const shareMonth =
        total > 0
          ? ((catTotal / total) * 100).toFixed(1) + "% dari bulan ini"
          : "0% dari bulan ini";

      return {
        label: cat.label,
        total: catTotal,
        totalFmt: `Rp ${fmt(catTotal)}`,
        sewa: cat.sewa,
        sewaFmt: formatCompactRp(cat.sewa),
        repair: cat.repair,
        repairFmt: formatCompactRp(cat.repair),
        sewaBar,
        repairBar,
        shareMonth,
      };
    },
  );

  return {
    site,
    region,
    type,
    month,
    total,
    totalFmt: `Rp ${fmt(total)}`,
    rowTotal,
    deviceCount,
    costPerUnit,
    sharePct,
    sewaTotal,
    sewaPct,
    sewaWisesa,
    sewaAdv,
    repairTotal,
    repairPct,
    repairWisesa,
    repairAdv,
    repairWisesaBar,
    repairAdvBar,
    categories,
  };
}
