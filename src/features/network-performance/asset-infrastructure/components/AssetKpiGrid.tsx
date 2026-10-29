"use client";

import React from "react";
import { Package, PlusCircle, RefreshCw, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { AssetKpis } from "../types/asset.types";

interface AssetKpiGridProps {
  kpis: AssetKpis;
}

export function AssetKpiGrid({ kpis }: AssetKpiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Transaksi */}
      <Card className="min-w-0 border-zinc-200 bg-white p-4.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 transition-all">
        <div className="flex items-center justify-between mb-3.5">
          <span
            className="inline-flex h-9.5 w-9.5 items-center justify-center rounded-lg"
            style={{
              background: "var(--accent-tint, #eff4fe)",
              color: "var(--accent, #2563eb)",
            }}
          >
            <Package className="h-5 w-5" strokeWidth={1.8} />
          </span>
        </div>
        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">
          Total transaksi
        </div>
        <div className="text-3xl font-black leading-none text-zinc-900 dark:text-zinc-50 font-display">
          {kpis.total}
        </div>
        <div className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          {kpis.branchesCount} cabang
        </div>
      </Card>

      {/* 2. Penambahan */}
      <Card className="min-w-0 border-zinc-200 bg-white p-4.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 transition-all">
        <div className="flex items-center justify-between mb-3.5">
          <span
            className="inline-flex h-9.5 w-9.5 items-center justify-center rounded-lg"
            style={{
              background:
                "color-mix(in srgb, var(--status-green-fg, #059669) 10%, white)",
              color: "var(--status-green-fg, #059669)",
            }}
          >
            <PlusCircle className="h-5 w-5" strokeWidth={1.8} />
          </span>
        </div>
        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">
          Penambahan
        </div>
        <div
          className="text-3xl font-black leading-none font-display"
          style={{ color: "var(--status-green-fg, #059669)" }}
        >
          {kpis.addCount}
        </div>
        <div className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          {kpis.addPct}
        </div>
      </Card>

      {/* 3. Pergantian */}
      <Card className="min-w-0 border-zinc-200 bg-white p-4.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 transition-all">
        <div className="flex items-center justify-between mb-3.5">
          <span
            className="inline-flex h-9.5 w-9.5 items-center justify-center rounded-lg"
            style={{
              background:
                "color-mix(in srgb, var(--status-red-fg, #dc2626) 9%, white)",
              color: "var(--status-red-fg, #dc2626)",
            }}
          >
            <RefreshCw className="h-5 w-5" strokeWidth={1.8} />
          </span>
        </div>
        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">
          Pergantian
        </div>
        <div
          className="text-3xl font-black leading-none font-display"
          style={{ color: "var(--status-red-fg, #dc2626)" }}
        >
          {kpis.repCount}
        </div>
        <div className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          {kpis.repPct}
        </div>
      </Card>

      {/* 4. Rata-rata / bulan */}
      <Card className="min-w-0 border-zinc-200 bg-white p-4.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 transition-all">
        <div className="flex items-center justify-between mb-3.5">
          <span
            className="inline-flex h-9.5 w-9.5 items-center justify-center rounded-lg"
            style={{
              background: "var(--status-gray-bg, #f3f4f6)",
              color: "var(--status-gray-fg, #6b7280)",
            }}
          >
            <Calendar className="h-5 w-5" strokeWidth={1.8} />
          </span>
        </div>
        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 font-sans">
          Rata-rata / bulan
        </div>
        <div className="text-3xl font-black leading-none text-zinc-900 dark:text-zinc-50 font-display">
          {kpis.avgPerMonth}
        </div>
        <div className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
          transaksi per bulan
        </div>
      </Card>
    </div>
  );
}
