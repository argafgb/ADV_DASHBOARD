import { C, fmt } from "@/lib/utils";
import type {
  RepairMaintenanceSummary,
  OwnerTotal,
  RepairMaintenanceGroup,
  CategorySummaryItem,
} from "../types/cost.types";

export interface RawRepairMaintenanceDbRow {
  company: string;
  device_type: string;
  device_count: number;
  total_rent: number;
  total_repair: number;
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
 * Transforms SQL aggregate rows into the RepairMaintenanceSummary structure.
 * Business Rules:
 * - Sewa (Rent Cost): 100% Wisesa (Advantage sewa is set to 0).
 * - Repair (Repair Cost): Shared between Wisesa and Advantage.
 */
export function transformRepairMaintenanceSummary(
  rows: RawRepairMaintenanceDbRow[],
): RepairMaintenanceSummary {
  let ownWisesa = 0;
  let ownAdv = 0;

  let sewaWisesa = 0;
  let repairWisesa = 0;

  let sewaAdv = 0; // Always 0 per business rule
  let repairAdv = 0;

  // Per category aggregations
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

    if (isWisesa) {
      ownWisesa += count;
      sewaWisesa += rentCost;
      repairWisesa += repairCost;
    } else {
      ownAdv += count;
      sewaAdv += 0;
      repairAdv += repairCost;
    }

    if (categoryMap[devTypeKey]) {
      categoryMap[devTypeKey].sewa += rentCost;
      categoryMap[devTypeKey].repair += repairCost;
    }
  }

  const totalSewa = sewaWisesa + sewaAdv;
  const totalRepair = repairWisesa + repairAdv;
  const grandTotal = totalSewa + totalRepair;

  const totalWisesa = sewaWisesa + repairWisesa;
  const totalAdv = sewaAdv + repairAdv;

  // 1. Owner Totals
  const ownerTotals: OwnerTotal[] = [
    {
      label: "WISESA",
      total: totalWisesa,
      totalFmt: `Rp ${fmt(totalWisesa)}`,
      color: C.accent,
    },
    {
      label: "ADVANTAGE",
      total: totalAdv,
      totalFmt: `Rp ${fmt(totalAdv)}`,
      color: C.amber,
    },
  ];

  // 2. Sum Groups (SEWA & REPAIR)
  const sewaSharePct =
    grandTotal > 0 ? ((totalSewa / grandTotal) * 100).toFixed(1) + "%" : "0%";
  const repairSharePct =
    grandTotal > 0 ? ((totalRepair / grandTotal) * 100).toFixed(1) + "%" : "0%";

  const sewaWisesaPct =
    totalSewa > 0 ? ((sewaWisesa / totalSewa) * 100).toFixed(1) + "%" : "0%";
  const sewaAdvPct =
    totalSewa > 0 ? ((sewaAdv / totalSewa) * 100).toFixed(1) + "%" : "0%";

  const repairWisesaPct =
    totalRepair > 0
      ? ((repairWisesa / totalRepair) * 100).toFixed(1) + "%"
      : "0%";
  const repairAdvPct =
    totalRepair > 0 ? ((repairAdv / totalRepair) * 100).toFixed(1) + "%" : "0%";

  const sumGroups: RepairMaintenanceGroup[] = [
    {
      label: "SEWA",
      sharePct: sewaSharePct,
      total: totalSewa,
      totalFmt: `Rp ${fmt(totalSewa)}`,
      owners: [
        {
          label: "Wisesa",
          value: sewaWisesa,
          valueFmt: `Rp ${fmt(sewaWisesa)}`,
          pct: sewaWisesaPct,
          color: C.accent,
        },
        {
          label: "ADV",
          value: sewaAdv,
          valueFmt: `Rp ${fmt(sewaAdv)}`,
          pct: sewaAdvPct,
          color: C.amber,
        },
      ],
    },
    {
      label: "REPAIR",
      sharePct: repairSharePct,
      total: totalRepair,
      totalFmt: `Rp ${fmt(totalRepair)}`,
      owners: [
        {
          label: "Wisesa",
          value: repairWisesa,
          valueFmt: `Rp ${fmt(repairWisesa)}`,
          pct: repairWisesaPct,
          color: C.accent,
        },
        {
          label: "ADV",
          value: repairAdv,
          valueFmt: `Rp ${fmt(repairAdv)}`,
          pct: repairAdvPct,
          color: C.amber,
        },
      ],
    },
  ];

  // 3. Sum Cats (Workstation, Peripheral, Infrastruktur)
  const sumCats: CategorySummaryItem[] = Object.values(categoryMap).map(
    (cat) => {
      const catTotal = cat.sewa + cat.repair;
      const catSewaBar =
        catTotal > 0 ? ((cat.sewa / catTotal) * 100).toFixed(1) + "%" : "0%";
      const catRepairBar =
        catTotal > 0 ? ((cat.repair / catTotal) * 100).toFixed(1) + "%" : "0%";
      const sewaShare =
        grandTotal > 0
          ? ((catTotal / grandTotal) * 100).toFixed(1) + "% dari total"
          : "0% dari total";

      return {
        label: cat.label,
        total: catTotal,
        totalFmt: `Rp ${fmt(catTotal)}`,
        sewaShare,
        sewaBar: catSewaBar,
        repairBar: catRepairBar,
        sewa: cat.sewa,
        sewaFmt: formatCompactRp(cat.sewa),
        repair: cat.repair,
        repairFmt: formatCompactRp(cat.repair),
      };
    },
  );

  return {
    ownAdv,
    ownWisesa,
    ownerTotals,
    sumGroups,
    sumCats,
  };
}
