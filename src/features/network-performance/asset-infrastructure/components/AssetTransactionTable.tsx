"use client";

import React, { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { AssetTableRow } from "../types/asset.types";

interface AssetTransactionTableProps {
  rows: AssetTableRow[];
}

export function AssetTransactionTable({ rows }: AssetTransactionTableProps) {
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = () => {
    setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (sortDir === "desc") {
        return b.tanggal.localeCompare(a.tanggal);
      }
      return a.tanggal.localeCompare(b.tanggal);
    });
  }, [rows, sortDir]);

  return (
    <Card className="min-w-0 border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans tracking-tight">
        Detail transaksi
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-3.5">
        {rows.length} baris · urut tanggal {sortDir === "desc" ? "terbaru" : "terlama"}
      </p>

      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="max-h-105 overflow-y-auto overflow-x-auto select-text">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-900/90 backdrop-blur-xs sticky top-0 z-10">
                <th
                  onClick={toggleSort}
                  className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[10px] text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer select-none whitespace-nowrap transition-colors"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <svg
                      viewBox="0 0 10 10"
                      className="w-2.5 h-2.5 fill-blue-600 dark:fill-blue-400 shrink-0"
                    >
                      {sortDir === "desc" ? (
                        <polygon points="1,3 9,3 5,8" />
                      ) : (
                        <polygon points="5,2 9,7 1,7" />
                      )}
                    </svg>
                    Tanggal
                  </span>
                </th>
                <th className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[10px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Cabang
                </th>
                <th className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[10px] text-zinc-500 dark:text-zinc-400">
                  Nama barang
                </th>
                <th className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[10px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Barcode
                </th>
                <th className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[10px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Kategori
                </th>
                <th className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[10px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-sans">
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <SearchX className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                      <span className="text-xs font-medium">
                        Tidak ada transaksi yang cocok dengan kriteria pencarian
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedRows.map((r, idx) => (
                  <tr
                    key={`${r.barcode}-${r.tanggal}-${idx}`}
                    className="hover:bg-zinc-50/75 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Tanggal */}
                    <td className="px-3.5 py-2.5 text-zinc-600 dark:text-zinc-400 whitespace-nowrap tabular-nums text-[11.5px]">
                      {r.tanggal}
                    </td>

                    {/* Cabang */}
                    <td className="px-3.5 py-2.5 font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {r.cabang}
                    </td>

                    {/* Nama Barang */}
                    <td className="px-3.5 py-2.5 text-zinc-700 dark:text-zinc-300">
                      {r.barang}
                    </td>

                    {/* Barcode */}
                    <td className="px-3.5 py-2.5 tabular-nums text-[11px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                      {r.barcode}
                    </td>

                    {/* Kategori */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 text-[11.5px]">
                        <i
                          className="w-2 h-2 rounded-xs shrink-0"
                          style={{ background: r.katColor }}
                        />
                        {r.kategori}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{
                          backgroundColor: r.badgeBg,
                          color: r.badgeFg,
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
        Sumber: PENDATAAN_PENAMBAHAN_ASSET_INFRA_CABANG.xlsx · Periode data 5
        Jan – 31 Agu 2026
      </div>
    </Card>
  );
}
