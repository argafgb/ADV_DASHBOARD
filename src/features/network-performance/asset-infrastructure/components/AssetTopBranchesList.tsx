"use client";

import React from "react";
import { Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { useHoverTip } from "@/features/network-performance/context/TooltipLayer";
import type { BranchActivityItem } from "../types/asset.types";

interface AssetTopBranchesListProps {
  topBranches: BranchActivityItem[];
  total: number;
}

export function AssetTopBranchesList({
  topBranches,
  total,
}: AssetTopBranchesListProps) {
  const { tipEnter, tipMove, tipLeave } = useHoverTip();

  return (
    <Card className="min-w-0 border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-sans tracking-tight">
        Cabang dengan aktivitas terbanyak (top 12)
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
        Jumlah transaksi penambahan dan pergantian per cabang
      </p>

      {topBranches.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Tidak Ada Data Cabang"
          description="Tidak ditemukan aktivitas cabang pada filter yang dipilih."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {topBranches.map((b) => (
            <div
              key={b.name}
              className="flex items-center gap-3 cursor-default group"
              onMouseEnter={(e) =>
                tipEnter(
                  e,
                  {
                    title: b.name,
                    primary: `${b.count} transaksi`,
                    secondary: `(${b.count} dari ${total} transaksi)`,
                    meta: b.categoryBreakdown,
                    tone: "blue",
                  },
                  "none",
                )
              }
              onMouseMove={tipMove}
              onMouseLeave={tipLeave}
            >
              {/* Branch Name */}
              <span className="w-40 shrink-0 text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {b.name}
              </span>

              {/* Progress Bar Track */}
              <div className="flex-1 h-3.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 min-w-1"
                  style={{
                    width: b.width,
                    backgroundColor: b.color,
                  }}
                />
              </div>

              {/* Transaction Count */}
              <span className="w-8 text-right font-display text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                {b.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
