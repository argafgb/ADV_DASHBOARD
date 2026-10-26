"use client";

import ChartCard from "@/components/shared/ChartCard";
import StackedAreaChart from "@/components/shared/StackedAreaChart";
import { C } from "@/lib/utils";
import type { CategoryTrendPoint } from "../types/findings.types";
import type { AssetFilterInput } from "@/types/asset-pm.types";

export default function TrenKategoriChart({
  data = [],
}: {
  input?: AssetFilterInput;
  data?: CategoryTrendPoint[];
}) {
  return (
    <ChartCard
      title="Monthly Category Trend"
      subtitle="Kontribusi kategori temuan umum, perangkat keras, aplikasi, dan siklus hidup"
    >
      <StackedAreaChart
        data={data}
        categoryKey="month"
        series={[
          { key: "general", name: "General PM", color: C.accent },
          { key: "hardware", name: "Hardware & Peripheral", color: C.green },
          { key: "software", name: "Aplikasi & Sistem", color: C.amber },
          { key: "lifecycle", name: "Lifecycle & Risk", color: C.red },
        ]}
      />
    </ChartCard>
  );
}
