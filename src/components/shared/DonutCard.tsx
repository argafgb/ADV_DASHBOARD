"use client";

import { ReactNode } from "react";
import { PieChart } from "lucide-react";
import ChartCard from "@/components/shared/ChartCard";
import DonutChart from "@/components/shared/DonutChart";
import DonutLegend from "@/components/shared/DonutLegend";
import EmptyState from "@/components/shared/EmptyState";
import type { DonutSlice } from "@/types/asset-pm.types";

interface DonutCardProps {
  title: string;
  subtitle?: string;
  slices: DonutSlice[];
  centerValue?: string;
  centerLabel?: string;
  height?: number;
  action?: ReactNode;
  valueFormatter?: (value: number) => string;
  mode?: "row" | "column";
  className?: string;
  showTotal?: boolean;
  showPercent?: boolean;
  markerShape?: "circle" | "square";
  rawCenterValue?: boolean;
  centerValueClassName?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

/** ChartCard composing a donut with its legend — the common donut widget with purpose-driven EmptyState. */
export default function DonutCard({
  title,
  subtitle,
  slices,
  centerValue,
  centerLabel,
  height,
  action,
  valueFormatter,
  mode = "column",
  className,
  showTotal = true,
  showPercent = true,
  markerShape = "circle",
  rawCenterValue = false,
  centerValueClassName,
  emptyTitle = "Tidak Ada Proporsi Biaya/Aset",
  emptyDescription = "Rincian distribusi atau komposisi tidak tersedia pada kombinasi filter ini.",
}: DonutCardProps) {
  const isRow = mode === "row";
  const totalValue = slices?.reduce((acc, s) => acc + (s.value || 0), 0) ?? 0;
  const isEmpty = !slices || slices.length === 0 || totalValue === 0;

  const donut = (
    <DonutChart
      slices={slices}
      height={height ?? (isRow ? 168 : undefined)}
      centerValue={centerValue}
      centerLabel={centerLabel}
      rawCenterValue={rawCenterValue}
      centerValueClassName={centerValueClassName}
    />
  );
  const legend = (
    <DonutLegend
      slices={slices}
      valueFormatter={valueFormatter}
      className={isRow ? "" : undefined}
      showTotal={showTotal}
      showPercent={showPercent}
      markerShape={markerShape}
    />
  );

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      action={action}
      className={className}
    >
      {isEmpty ? (
        <EmptyState
          icon={PieChart}
          title={emptyTitle}
          description={emptyDescription}
          height={200}
        />
      ) : isRow ? (
        <div className="flex flex-col items-stretch gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:gap-5">
          <div className="w-full min-[400px]:w-36 min-[400px]:shrink-0 sm:w-40">
            {donut}
          </div>
          <div className="min-w-0 flex-1">{legend}</div>
        </div>
      ) : (
        <>
          {donut}
          {legend}
        </>
      )}
    </ChartCard>
  );
}
