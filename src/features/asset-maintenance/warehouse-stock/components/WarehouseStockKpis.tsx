"use client";

import { Boxes, Sparkles, RefreshCw, MapPinOff, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { WarehouseStockKpis } from "../types";
import { formatIndonesianNumber } from "../utils/warehouseStockTransformer";

interface WarehouseStockKpisProps {
  kpis: WarehouseStockKpis;
  activeCondition: string;
  activeTableLocation: string | null;
  onSelectCondition: (cond: string) => void;
  onSelectTableLocation: (loc: string | null) => void;
  onResetFilters: () => void;
}

export default function WarehouseStockKpisComponent({
  kpis,
  activeCondition,
  activeTableLocation,
  onSelectCondition,
  onSelectTableLocation,
  onResetFilters,
}: WarehouseStockKpisProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Units (Hero Blue Gradient) */}
        <div
          role="button"
          tabIndex={0}
          onClick={onResetFilters}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onResetFilters();
          }}
          className="flex cursor-pointer flex-col justify-between gap-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
              <Boxes size={16} />
            </span>
            <span className="flex-1 text-xs font-semibold text-white/90">
              Total Units
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  role="button"
                  tabIndex={-1}
                  className="inline-flex cursor-help text-white/70 hover:text-white"
                  aria-label="Info Total Units"
                >
                  <Info size={14} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                Seluruh unit barang yang tercatat di gudang. Klik untuk reset
                filter tabel.
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold leading-none tracking-tight text-white tabular-nums">
              {formatIndonesianNumber(kpis.totalUnits)}
            </span>
            <span className="text-xs text-blue-100">unit</span>
          </div>

          <span className="text-xs text-blue-100">
            {formatIndonesianNumber(kpis.totalItems)} item tercatat
          </span>
        </div>

        {/* Card 2: New Condition */}
        <div
          role="button"
          tabIndex={0}
          onClick={() =>
            onSelectCondition(activeCondition === "New" ? "Semua" : "New")
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              onSelectCondition(activeCondition === "New" ? "Semua" : "New");
          }}
          className={cn(
            "flex cursor-pointer flex-col justify-between gap-3 rounded-xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900",
            activeCondition === "New"
              ? "border-blue-400 ring-2 ring-blue-500/20 dark:border-blue-700"
              : "border-zinc-200 hover:border-blue-300 dark:border-zinc-800 dark:hover:border-blue-900/50",
          )}
        >
          <div className="flex items-center justify-between gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Sparkles size={16} />
            </span>
            <span className="flex-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              New
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  role="button"
                  tabIndex={-1}
                  className="inline-flex cursor-help text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  aria-label="Info New Condition"
                >
                  <Info size={14} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                Unit barang baru yang belum pernah dipakai.
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold leading-none tracking-tight text-zinc-900 tabular-nums dark:text-zinc-50">
              {formatIndonesianNumber(kpis.newUnits)}
            </span>
            <span className="text-xs text-zinc-400">unit</span>
          </div>

          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {kpis.newPct} dari total unit
          </span>
        </div>

        {/* Card 3: Second Condition */}
        <div
          role="button"
          tabIndex={0}
          onClick={() =>
            onSelectCondition(activeCondition === "Second" ? "Semua" : "Second")
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              onSelectCondition(
                activeCondition === "Second" ? "Semua" : "Second",
              );
          }}
          className={cn(
            "flex cursor-pointer flex-col justify-between gap-3 rounded-xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900",
            activeCondition === "Second"
              ? "border-blue-400 ring-2 ring-blue-500/20 dark:border-blue-700"
              : "border-zinc-200 hover:border-blue-300 dark:border-zinc-800 dark:hover:border-blue-900/50",
          )}
        >
          <div className="flex items-center justify-between gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
              <RefreshCw size={16} />
            </span>
            <span className="flex-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Second
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  role="button"
                  tabIndex={-1}
                  className="inline-flex cursor-help text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  aria-label="Info Second Condition"
                >
                  <Info size={14} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                Unit barang bekas pakai yang masih disimpan.
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold leading-none tracking-tight text-zinc-900 tabular-nums dark:text-zinc-50">
              {formatIndonesianNumber(kpis.secondUnits)}
            </span>
            <span className="text-xs text-zinc-400">unit</span>
          </div>

          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {kpis.secondPct} dari total unit
          </span>
        </div>

        {/* Card 4: Location not recorded */}
        <div
          role="button"
          tabIndex={0}
          onClick={() =>
            onSelectTableLocation(
              activeTableLocation === "Not recorded" ? null : "Not recorded",
            )
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              onSelectTableLocation(
                activeTableLocation === "Not recorded" ? null : "Not recorded",
              );
          }}
          className={cn(
            "flex cursor-pointer flex-col justify-between gap-3 rounded-xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900",
            activeTableLocation === "Not recorded"
              ? "border-zinc-400 ring-2 ring-zinc-500/20 dark:border-zinc-600"
              : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-700",
          )}
        >
          <div className="flex items-center justify-between gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              <MapPinOff size={16} />
            </span>
            <span className="flex-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Location not recorded
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  role="button"
                  tabIndex={-1}
                  className="inline-flex cursor-help text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  aria-label="Info Location Not Recorded"
                >
                  <Info size={14} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                Unit barang yang belum memiliki catatan lokasi gudang spesifik.
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold leading-none tracking-tight text-zinc-900 tabular-nums dark:text-zinc-50">
              {formatIndonesianNumber(kpis.noLocationUnits)}
            </span>
            <span className="text-xs text-zinc-400">unit</span>
          </div>

          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatIndonesianNumber(kpis.noLocationItems)} item belum tercatat
            lokasi
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
