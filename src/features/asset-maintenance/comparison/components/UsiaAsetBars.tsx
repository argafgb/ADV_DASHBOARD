"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import ChartCard from "@/components/shared/ChartCard";
import FilterSelect from "@/components/shared/FilterSelect";
import SeriesBarChart from "@/components/shared/SeriesBarChart";
import { C, cn, fmt } from "@/lib/utils";
import {
  getUsiaAsetData,
  type UsiaAsetTabCategory,
} from "../services/comparisonService";
import type { AssetFilterInput } from "@/types/asset-pm.types";
import type { UsiaAsetData } from "../types/comparison.types";
import { AssetAgeChartSkeleton } from "./skeletons/ComparisonSkeletons";

const TABS: { value: UsiaAsetTabCategory; label: string }[] = [
  { value: "workstation", label: "Workstation" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "peripheral", label: "Peripheral" },
];

export default function UsiaAsetBars({
  input,
  initialData,
}: {
  input: AssetFilterInput;
  initialData?: UsiaAsetData;
}) {
  const [activeTab, setActiveTab] =
    useState<UsiaAsetTabCategory>("workstation");
  const [requestData, setRequestData] = useState<UsiaAsetData | null>(null);
  const [isPending, startTransition] = useTransition();
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current && initialData && activeTab === "workstation") {
      isInitialMount.current = false;
      return;
    }
    isInitialMount.current = false;

    startTransition(async () => {
      const res = await getUsiaAsetData(input, activeTab);
      setRequestData(res);
    });
  }, [input, activeTab, initialData]);

  const usiaData =
    activeTab === "workstation" ? (initialData ?? requestData) : requestData;
  const bars = usiaData?.bars || [];
  const total = usiaData?.total || 0;
  const peakYear = usiaData?.peakYear || "-";
  const data = bars.map((b) => ({ year: b.label, unit: b.value }));

  return (
    <ChartCard
      title={`${TABS.find((tab) => tab.value === activeTab)?.label} Asset Age Distribution`}
      subtitle={`Total ${fmt(total)} unit (${input.year}) · puncak tahun produksi ${peakYear} sebagai siklus penggantian tertinggi`}
      action={
        <>
          {/* Segmented tabs on wider screens */}
          <div
            role="tablist"
            aria-label="Filter kategori usia aset"
            className="hidden items-center gap-0.5 rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800 sm:flex"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "cursor-pointer rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Collapses to a dropdown on small screens */}
          <div className="sm:hidden">
            <FilterSelect
              aria-label="Filter kategori usia aset"
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as UsiaAsetTabCategory)}
              options={TABS}
            />
          </div>
        </>
      }
    >
      {isPending || !usiaData ? (
        <AssetAgeChartSkeleton />
      ) : (
        <SeriesBarChart
          data={data}
          categoryKey="year"
          series={[{ key: "unit", name: "Unit", color: C.accent }]}
          height={280}
        />
      )}
    </ChartCard>
  );
}
