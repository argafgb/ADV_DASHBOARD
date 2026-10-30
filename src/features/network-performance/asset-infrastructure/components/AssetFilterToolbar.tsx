"use client";

import React from "react";
import { Search } from "lucide-react";
import type {
  AssetCategoryFilter,
  AssetStatusFilter,
} from "../types/asset.types";

interface AssetFilterToolbarProps {
  category: AssetCategoryFilter;
  status: AssetStatusFilter;
  query: string;
  onCategoryChange: (cat: AssetCategoryFilter) => void;
  onStatusChange: (st: AssetStatusFilter) => void;
  onQueryChange: (q: string) => void;
}

const CATEGORY_OPTIONS: { value: AssetCategoryFilter; label: string }[] = [
  { value: "all", label: "Semua kategori" },
  { value: "Router", label: "Router" },
  { value: "Switch", label: "Switch" },
  { value: "AP", label: "Access Point" },
];

const STATUS_OPTIONS: { value: AssetStatusFilter; label: string }[] = [
  { value: "all", label: "Semua status" },
  { value: "Penambahan", label: "Penambahan" },
  { value: "Pergantian", label: "Pergantian" },
];

export function AssetFilterToolbar({
  category,
  status,
  query,
  onCategoryChange,
  onStatusChange,
  onQueryChange,
}: AssetFilterToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Category Chips */}
      <div className="inline-flex items-center gap-0.5 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs shrink-0">
        {CATEGORY_OPTIONS.map((opt) => {
          const isActive = category === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onCategoryChange(opt.value)}
              className={`inline-flex items-center h-7 px-3 text-xs font-semibold rounded-lg border-none cursor-pointer transition-colors duration-150 ${
                isActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                  : "bg-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Status Chips */}
      <div className="inline-flex items-center gap-0.5 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs shrink-0">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              className={`inline-flex items-center h-7 px-3 text-xs font-semibold rounded-lg border-none cursor-pointer transition-colors duration-150 ${
                isActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                  : "bg-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative flex-1 min-w-55">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Cari nama cabang atau nama barang..."
          className="w-full h-9 pl-9 pr-3 text-xs text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-2xs"
        />
      </div>
    </div>
  );
}
