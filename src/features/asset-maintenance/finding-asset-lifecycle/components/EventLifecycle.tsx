"use client";

import DonutCard from "@/components/shared/DonutCard";
import type { DonutSlice, AssetFilterInput } from "@/types/asset-pm.types";

export default function EventLifecycle({
  data,
}: {
  input?: AssetFilterInput;
  data?: { slices: DonutSlice[]; flaggedPct: string };
}) {
  const slices = data?.slices || [];
  const flaggedPct = data?.flaggedPct || "0.0%";

  return (
    <DonutCard
      title="Asset Lifecycle Events"
      subtitle="Distribusi aset rusak, mutasi, tidak digunakan, dan hilang"
      slices={slices}
      mode="row"
      markerShape="square"
      showPercent={false}
      showTotal={false}
      centerValue={flaggedPct}
      centerLabel="Flagged"
      rawCenterValue
      centerValueClassName="text-amber-600 dark:text-amber-400"
    />
  );
}
