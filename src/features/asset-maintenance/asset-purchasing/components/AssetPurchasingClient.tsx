"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Box, CalendarDays, Laptop, Mouse } from "lucide-react";
import { useAssetFilters } from "@/hooks/useAssetFilters";
import FilterSelect from "@/components/shared/FilterSelect";
import { cn } from "@/lib/utils";
import {
  assetPurchasingCsv,
  deriveAssetPurchasingModel,
} from "../utils/purchaseModel";
import type {
  AssetPurchasingData,
  AssetWarrantyData,
  InvalidWarrantySummary,
  PurchaseCategoryFilter,
} from "../types";
import { MonthlyPurchaseTrend, PurchaseBreakdown } from "./PurchaseCharts";
import PurchaseTable from "./PurchaseTable";
import WarrantySection from "./WarrantyCharts";

const tabs: Array<{ value: PurchaseCategoryFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "Workstation", label: "Workstation" },
  { value: "Peripheral", label: "Peripheral" },
];

export default function AssetPurchasingClient({
  data,
  warrantyData,
  invalidWarrantySummary,
  error,
}: {
  data: AssetPurchasingData;
  warrantyData?: AssetWarrantyData;
  invalidWarrantySummary?: InvalidWarrantySummary;
  error?: string;
}) {
  const { year, month } = useAssetFilters();
  const [category, setCategory] = useState<PurchaseCategoryFilter>("all");
  const [search, setSearch] = useState("");
  const model = useMemo(
    () => deriveAssetPurchasingModel({ year, month, category, search, data }),
    [year, month, category, search, data],
  );
  const cards = [
    {
      label: "Total Units Purchased",
      value: model.totalUnits,
      sub: model.periodLabel,
      icon: Box,
      color: "text-zinc-500",
    },
    {
      label: "Workstation",
      value: model.categoryTotals.Workstation,
      sub: "Periode terpilih",
      icon: Laptop,
      color: "text-blue-600",
    },
    {
      label: "Peripheral",
      value: model.categoryTotals.Peripheral,
      sub: "Periode terpilih",
      icon: Mouse,
      color: "text-amber-500",
    },
    {
      label: "Peak Month of the Year",
      value: model.peak?.label ?? "—",
      sub: model.peak
        ? `${model.peak.units} unit dibeli`
        : "Data belum tersedia",
      icon: CalendarDays,
      color: "text-zinc-500",
    },
  ];
  const exportCsv = () => {
    const blob = new Blob([assetPurchasingCsv(model)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `asset-purchasing-${category.toLowerCase()}-${year}-${month.toLowerCase()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <div className="hidden sm:flex items-center gap-2" aria-label="Purchase category">
          <span className="shrink-0 text-xs font-medium text-zinc-500">
            Category:
          </span>
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setCategory(tab.value)}
              className={cn(
                "cursor-pointer whitespace-nowrap rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                category === tab.value
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="sm:hidden">
          <FilterSelect
            label="Category"
            value={category}
            onValueChange={(val) => setCategory(val as PurchaseCategoryFilter)}
            options={tabs.map((t) => ({ value: t.value, label: t.label }))}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div>
            <strong>Purchasing data is temporarily unavailable.</strong>
            <p className="mt-1 text-xs opacity-80">{error}</p>
          </div>
        </div>
      )}
      {!error && !model.supportedPeriod && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div>
            <strong>Purchasing data is not available for this period.</strong>
            <p className="mt-1 text-xs opacity-80">
              Tidak ada data pembelian pada tahun dan bulan yang dipilih. Ubah
              filter periode untuk melihat data yang tersedia.
            </p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, sub, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-2">
              <Icon size={16} className={color} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {label}
              </span>
            </div>
            <div className="font-display mt-3 text-3xl font-extrabold tabular-nums text-zinc-900 dark:text-zinc-50">
              {value}
            </div>
            <p className="mt-2 text-xs text-zinc-500">{sub}</p>
          </div>
        ))}
      </div>
      <MonthlyPurchaseTrend model={model} />
      <PurchaseBreakdown model={model} />
      <PurchaseTable
        model={model}
        search={search}
        onSearchAction={setSearch}
        onExportAction={exportCsv}
      />

      {warrantyData && (
        <WarrantySection
          data={warrantyData}
          invalidSummary={invalidWarrantySummary}
        />
      )}
    </div>
  );
}
