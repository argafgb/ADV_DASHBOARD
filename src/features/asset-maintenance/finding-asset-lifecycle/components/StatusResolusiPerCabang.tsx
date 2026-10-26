"use client";

import ChartCard from "@/components/shared/ChartCard";
import SeriesBarChart from "@/components/shared/SeriesBarChart";
import {
  RESOLUTION_STATUSES,
  type BranchResolution,
} from "../types/findings.types";
import type { AssetFilterInput } from "@/types/asset-pm.types";

export default function StatusResolusiPerCabang({
  data = [],
}: {
  input?: AssetFilterInput;
  data?: BranchResolution[];
}) {
  const chartData = data.map((row) => {
    const item: Record<string, string | number> = { branch: row.branch };
    for (const seg of row.segments) {
      item[seg.label] = seg.value;
    }
    return item;
  });

  const series = RESOLUTION_STATUSES.map((s) => ({
    key: s.label,
    name: s.label,
    color: s.color,
    stackId: "status",
  }));

  return (
    <ChartCard
      title="Resolution Status by Branch"
      subtitle="10 cabang dengan temuan terbanyak · arahkan kursor untuk rincian"
    >
      <SeriesBarChart
        data={chartData}
        categoryKey="branch"
        layout="vertical"
        series={series}
        height={Math.max(280, data.length * 34 + 50)}
        showLegend
      />
    </ChartCard>
  );
}
