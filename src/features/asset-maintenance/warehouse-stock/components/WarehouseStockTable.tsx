"use client";

import { useState } from "react";
import {
  Search,
  RotateCcw,
  Download,
  ChevronRight,
  PackageX,
} from "lucide-react";
import FilterSelect from "@/components/shared/FilterSelect";
import EmptyState from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import type { WarehouseStockItem } from "../types";
import {
  formatIndonesianNumber,
  formatWarehouseDate,
} from "../utils/warehouseStockTransformer";

interface WarehouseStockTableProps {
  items: WarehouseStockItem[];
  allCategories: string[];
  search: string;
  category: string;
  condition: string;
  onSearchChange: (q: string) => void;
  onCategoryChange: (cat: string) => void;
  onConditionChange: (cond: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

const PAGE_SIZE = 12;

export default function WarehouseStockTable({
  items,
  allCategories,
  search,
  category,
  condition,
  onSearchChange,
  onCategoryChange,
  onConditionChange,
  onResetFilters,
  hasActiveFilters,
}: WarehouseStockTableProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [expandedNo, setExpandedNo] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages - 1);
  const startIdx = safePage * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, items.length);
  const pageRows = items.slice(startIdx, endIdx);

  const toggleRow = (no: number) => {
    setExpandedNo((cur) => (cur === no ? null : no));
  };

  const handleExportCsv = () => {
    const headers = [
      "no",
      "item",
      "category",
      "type",
      "spec",
      "location",
      "placement",
      "condition",
      "qty",
      "qty_note",
      "barcode",
      "last_edited",
    ];

    const escapeCsv = (str: unknown) => {
      const v = str === null || str === undefined ? "" : String(str);
      return `"${v.replace(/"/g, '""')}"`;
    };

    const csvRows = [
      headers.join(","),
      ...items.map((r) =>
        [
          r.no,
          escapeCsv(r.item),
          escapeCsv(r.category),
          escapeCsv(r.type),
          escapeCsv(r.spec),
          escapeCsv(r.location),
          escapeCsv(r.placement),
          escapeCsv(r.condition),
          r.qty,
          escapeCsv(r.qty_note),
          escapeCsv(r.barcode),
          escapeCsv(r.last_edited),
        ].join(","),
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "warehouse-stock.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderPaginationButtons = () => {
    const pages = new Set<number>([
      0,
      totalPages - 1,
      safePage - 1,
      safePage,
      safePage + 1,
    ]);
    const sorted = [...pages]
      .filter((p) => p >= 0 && p < totalPages)
      .sort((a, b) => a - b);

    const buttons: React.ReactNode[] = [];
    let last = -1;

    sorted.forEach((p) => {
      if (last !== -1 && p - last > 1) {
        buttons.push(
          <span
            key={`dots-${p}`}
            className="flex h-8 min-w-5 items-center justify-center text-xs text-zinc-400 select-none"
          >
            …
          </span>,
        );
      }
      buttons.push(
        <button
          key={p}
          type="button"
          onClick={() => setCurrentPage(p)}
          className={cn(
            "h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition-all cursor-pointer",
            p === safePage
              ? "bg-blue-600 text-white shadow-xs"
              : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
          )}
        >
          {p + 1}
        </button>,
      );
      last = p;
    });

    return buttons;
  };

  const categoryOptions = [
    { value: "Semua", label: "Semua" },
    ...allCategories.map((c) => ({ value: c, label: c })),
  ];

  const conditionOptions = [
    { value: "Semua", label: "Semua" },
    { value: "New", label: "New" },
    { value: "Second", label: "Second" },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Table Header Bar */}
      <div className="flex flex-col gap-3.5 p-4 sm:p-5 sm:flex-row sm:items-start sm:justify-between flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Stock Detail
            </span>
            <span className="inline-flex h-5 items-center rounded-full bg-zinc-100 px-2 text-[11px] font-bold text-zinc-600 tabular-nums dark:bg-zinc-800 dark:text-zinc-300">
              {formatIndonesianNumber(items.length)} item
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Klik baris untuk melihat barcode, spesifikasi, dan waktu update
            terakhir.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setCurrentPage(0);
              }}
              placeholder="Cari nama barang, tipe, atau barcode..."
              className="h-8 w-56 sm:w-60 rounded-xl border border-zinc-200 bg-white pl-8 pr-3 text-xs text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>

          <span className="hidden h-5 w-px bg-zinc-200 sm:block dark:bg-zinc-800" />

          {/* Category Filter (shadcn Standard via FilterSelect) */}
          <FilterSelect
            label="Category"
            value={category}
            onValueChange={(val) => {
              onCategoryChange(val);
              setCurrentPage(0);
            }}
            options={categoryOptions}
          />

          {/* Condition Filter (shadcn Standard via FilterSelect) */}
          <FilterSelect
            label="Condition"
            value={condition}
            onValueChange={(val) => {
              onConditionChange(val);
              setCurrentPage(0);
            }}
            options={conditionOptions}
          />

          {/* Reset Button (only shown if filtered) */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                onResetFilters();
                setCurrentPage(0);
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-600 transition-colors hover:border-red-500 hover:text-red-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <EmptyState
          icon={PackageX}
          title="Tidak Ada Barang yang Cocok"
          description="Longgarkan filter atau kosongkan kata kunci pencarian."
          height={200}
        />
      ) : (
        /* Table View */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left font-sans text-xs">
            <thead>
              <tr className="border-t border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                <th className="py-2.5 pl-5 pr-3 text-left">Item</th>
                <th className="py-2.5 px-3 text-left">Category</th>
                <th className="py-2.5 px-3 text-left">Type</th>
                <th className="py-2.5 px-3 text-left">Location</th>
                <th className="py-2.5 px-3 text-left">Placement</th>
                <th className="py-2.5 px-3 text-left">Condition</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3 text-left">Barcode</th>
                <th className="py-2.5 px-3 text-left">Last edited</th>
                <th className="py-2.5 pr-5 pl-3 w-5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {pageRows.map((r) => {
                const isExpanded = expandedNo === r.no;
                return (
                  <tr
                    key={r.no}
                    onClick={() => toggleRow(r.no)}
                    className={cn(
                      "cursor-pointer transition-colors border-b border-zinc-100 dark:border-zinc-800/80",
                      isExpanded
                        ? "bg-zinc-50 dark:bg-zinc-800/40"
                        : "hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30",
                    )}
                  >
                    <td colSpan={10} className="p-0">
                      <div className="flex w-full items-center">
                        {/* Item title & spec */}
                        <div className="py-2.5 pl-5 pr-3 min-h-[58px] max-w-[300px] flex-1">
                          <div
                            className="text-xs font-semibold text-zinc-900 truncate dark:text-zinc-100"
                            title={r.item}
                          >
                            {r.item}
                          </div>
                          {r.spec ? (
                            <div
                              className="mt-0.5 text-[11px] text-zinc-500 truncate max-w-[280px] dark:text-zinc-400"
                              title={r.spec}
                            >
                              {r.spec}
                            </div>
                          ) : null}
                        </div>

                        {/* Category badge */}
                        <div className="py-2.5 px-3 w-36 shrink-0">
                          <span className="inline-flex h-5 items-center rounded-md bg-blue-50 px-2 text-[10.5px] font-bold text-blue-600 whitespace-nowrap dark:bg-blue-950/40 dark:text-blue-300">
                            {r.category}
                          </span>
                        </div>

                        {/* Type */}
                        <div className="py-2.5 px-3 w-28 shrink-0 text-xs text-zinc-700 whitespace-nowrap dark:text-zinc-300">
                          {r.type || "-"}
                        </div>

                        {/* Location */}
                        <div className="py-2.5 px-3 w-32 shrink-0">
                          <span className="inline-flex h-5 items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 text-[11px] font-semibold text-zinc-700 whitespace-nowrap dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            {r.location || "Not recorded"}
                          </span>
                        </div>

                        {/* Placement */}
                        <div className="py-2.5 px-3 w-28 shrink-0 text-xs text-zinc-600 whitespace-nowrap dark:text-zinc-400">
                          {r.placement || "-"}
                        </div>

                        {/* Condition badge */}
                        <div className="py-2.5 px-3 w-24 shrink-0">
                          <span
                            className={cn(
                              "inline-flex h-5 items-center rounded-md px-2 text-[10.5px] font-bold whitespace-nowrap",
                              r.condition === "New"
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                            )}
                          >
                            {r.condition}
                          </span>
                        </div>

                        {/* Qty */}
                        <div className="py-2.5 px-3 w-16 shrink-0 text-right text-xs font-semibold text-zinc-900 tabular-nums whitespace-nowrap dark:text-zinc-100">
                          {formatIndonesianNumber(r.qty)}
                        </div>

                        {/* Barcode */}
                        <div className="py-2.5 px-3 w-36 shrink-0 text-[11px] font-mono text-zinc-600 tabular-nums whitespace-nowrap truncate dark:text-zinc-400">
                          {r.barcode || "-"}
                        </div>

                        {/* Last edited */}
                        <div className="py-2.5 px-3 w-36 shrink-0 text-[11px] text-zinc-400 tabular-nums whitespace-nowrap truncate dark:text-zinc-500">
                          {formatWarehouseDate(r.last_edited)}
                        </div>

                        {/* Chevron */}
                        <div className="py-2.5 pr-5 pl-3 w-5 shrink-0 text-zinc-400">
                          <ChevronRight
                            size={14}
                            className={cn(
                              "transition-transform duration-150",
                              isExpanded ? "rotate-90 text-blue-600 dark:text-blue-400" : "",
                            )}
                          />
                        </div>
                      </div>

                      {/* Accordion Details */}
                      {isExpanded && (
                        <div className="border-t border-zinc-100 bg-zinc-50/60 px-5 pt-2 pb-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-5 text-xs">
                            <div>
                              <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                Barcode
                              </div>
                              <div className="mt-1 text-xs font-semibold font-mono text-zinc-800 wrap-break-word dark:text-zinc-200">
                                {r.barcode || "-"}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                Spec
                              </div>
                              <div className="mt-1 text-xs font-semibold text-zinc-800 wrap-break-word dark:text-zinc-200">
                                {r.spec || "-"}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                Qty note
                              </div>
                              <div className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {r.qty_note || "-"}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                Placement
                              </div>
                              <div className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {r.placement || "-"}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                Last edited
                              </div>
                              <div className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {formatWarehouseDate(r.last_edited)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {items.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Menampilkan {startIdx + 1}–{endIdx} dari{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatIndonesianNumber(items.length)}
            </span>{" "}
            item
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              className="h-8 min-w-8 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-600 transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 cursor-pointer"
            >
              ‹
            </button>

            {renderPaginationButtons()}

            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
              }
              className="h-8 min-w-8 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-600 transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 cursor-pointer"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
