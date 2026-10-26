import type { KpiDatum } from "@/types/asset-pm.types";
import type { OverviewKpis } from "../types/overview.types";

/**
 * Formats OverviewKpis into standardized KpiDatum array for rendering.
 */
export function formatOverviewKpis(kpiData: OverviewKpis): KpiDatum[] {
  return [
    { label: "Total Asset", value: kpiData.totalAsset, icon: "grid" },
    {
      label: "Total Workstation",
      value: kpiData.totalWorkstation,
      icon: "monitor",
    },
    {
      label: "Total Infrastructure",
      value: kpiData.totalInfrastructure,
      icon: "building",
    },
    {
      label: "Total Peripheral",
      value: kpiData.totalPeripheral,
      icon: "layers",
    },
    { label: "Total Temuan PM", value: kpiData.totalTemuan, icon: "alert" },
    {
      label: "% Temuan Selesai",
      value: kpiData.totalResolveStatusTemuan,
      unit: "%",
      icon: "check",
    },
    { label: "Jumlah Site PM", value: kpiData.totalSites, icon: "pin" },
  ];
}
