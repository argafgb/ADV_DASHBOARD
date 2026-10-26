"use client";

import ChartCard from "@/components/shared/ChartCard";
import SeriesBarChart from "@/components/shared/SeriesBarChart";
import { C } from "@/lib/utils";
import type { ReplacementPoint } from "../types/findings.types";
import type { AssetFilterInput } from "@/types/asset-pm.types";

export default function ReplacementNewAssetChart({
  data = [],
}: {
  input?: AssetFilterInput;
  data?: ReplacementPoint[];
}) {
  return (
    <ChartCard
      title="Workstation Replacement & New Assets"
      subtitle="Perbandingan workstation yang diganti dan pengadaan baru"
    >
      <SeriesBarChart
        data={data}
        categoryKey="month"
        height={260}
        showLegend
        series={[
          { key: "replacement", name: "Replacement", color: C.accent },
          { key: "newAsset", name: "New Asset", color: C.amber },
        ]}
      />
    </ChartCard>
  );
}
