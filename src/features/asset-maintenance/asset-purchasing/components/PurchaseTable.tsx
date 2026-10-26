"use client";

import { Download, Search } from "lucide-react";
import ChartCard from "@/components/shared/ChartCard";
import { Button } from "@/components/ui/button";

import type { AssetPurchasingModel } from "../types";

export default function PurchaseTable({
  model,
  search,
  onSearchAction,
  onExportAction,
}: {
  model: AssetPurchasingModel;
  search: string;
  onSearchAction: (value: string) => void;
  onExportAction: () => void;
}) {
  return (
    <ChartCard
      title="Purchase Detail"
      subtitle={`Unit per tipe item setiap bulan · ${model.scopeLabel} · ${model.periodLabel}`}
      action={
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              size={14}
            />
            <input
              value={search}
              onChange={(event) => onSearchAction(event.target.value)}
              placeholder="Cari tipe item..."
              className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-8 pr-3 text-xs outline-none focus:border-blue-500 sm:w-52 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <Button
            variant="outline"
            onClick={onExportAction}
            className="cursor-pointer gap-2 text-xs"
          >
            <Download size={14} />
            Export CSV
          </Button>
        </div>
      }
      contentClassName="overflow-x-auto"
    >
      <p className="mb-3 text-[11px] text-zinc-500">
        File CSV mencakup seluruh kategori pada periode terpilih. Pencarian di
        tabel tidak memengaruhi data yang diekspor.
      </p>
      <table className="min-w-180 w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="p-2 text-left">No</th>
            <th className="p-2 text-left">Item Type</th>
            <th className="p-2 text-left">Category</th>
            {model.selectedMonths.map(({ year, month, label }) => (
              <th key={`${year}-${month}`} className="p-2 text-right">
                {label}
              </th>
            ))}
            <th className="bg-zinc-50 p-2 text-right dark:bg-zinc-950">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {model.searchedRows.map((row, rowIndex) => (
            <tr
              key={row.name}
              className={`border-b border-zinc-100 dark:border-zinc-800 ${row.isZero ? "text-zinc-400" : "text-zinc-700 dark:text-zinc-300"}`}
            >
              <td className="px-2 py-3.5 tabular-nums">{rowIndex + 1}</td>
              <td className="whitespace-nowrap px-2 py-3.5 font-semibold">
                {row.name}
              </td>
              <td className="px-2 py-3.5">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${row.isZero ? "border-zinc-200 bg-zinc-50" : row.category === "Workstation" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                >
                  {row.category}
                </span>
              </td>
              {model.selectedMonths.map((month, index) => (
                <td
                  key={`${month.year}-${month.month}`}
                  className={`px-2 py-3.5 text-right tabular-nums ${row.units[index] === 0 ? "text-zinc-400" : ""}`}
                >
                  {row.units[index]}
                </td>
              ))}
              <td className="bg-zinc-50 px-2 py-3.5 text-right font-bold tabular-nums dark:bg-zinc-950">
                {row.total}
              </td>
            </tr>
          ))}
          {model.searchedRows.length === 0 && (
            <tr>
              <td
                colSpan={model.selectedMonths.length + 4}
                className="p-12 text-center text-zinc-500"
              >
                Tidak ada tipe item yang sesuai dengan pencarian.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-zinc-200 bg-zinc-50 font-bold dark:border-zinc-700 dark:bg-zinc-950">
            <td className="p-2" />
            <td className="p-2 uppercase">Total</td>
            <td className="p-2 text-zinc-400">—</td>
            {model.selectedMonths.map((month, index) => (
              <td
                key={`${month.year}-${month.month}`}
                className="p-2 text-right tabular-nums"
              >
                {model.tableMonthlyTotals[index]}
              </td>
            ))}
            <td className="p-2 text-right tabular-nums">{model.tableTotal}</td>
          </tr>
        </tfoot>
      </table>
    </ChartCard>
  );
}
