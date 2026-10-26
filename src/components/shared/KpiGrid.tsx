"use client";

import KpiCard from "@/components/shared/KpiCard";
import type { KpiDatum } from "@/types/asset-pm.types";

/**
 * Responsive KPI grid. Column count adapts to the number of tiles while
 * following the mandated `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` ramp.
 */
export default function KpiGrid({ stats }: { stats: KpiDatum[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <KpiCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
