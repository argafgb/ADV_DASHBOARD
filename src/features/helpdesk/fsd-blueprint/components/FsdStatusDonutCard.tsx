"use client";

import { useState } from "react";
import { BlueprintStatus, FsdStatusCount } from "../types/fsdBlueprint.types";
import { STATUS_CONFIG, STATUS_DISPLAY_ORDER } from "../utils/fsdCalculations";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { RechartsTip } from "@/components/chart-tooltip";
import { EmptyState } from "@/components/shared/EmptyState";
import { PieChart as PieChartIcon } from "lucide-react";

interface FsdStatusDonutCardProps {
  statusCounts: FsdStatusCount;
  onSelectStatus?: (status: BlueprintStatus) => void;
}

export function FsdStatusDonutCard({
  statusCounts,
  onSelectStatus,
}: FsdStatusDonutCardProps) {
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const total = statusCounts.total || 0;

  if (total === 0) {
    return (
      <div className="flex h-full min-h-[300px] flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/70">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Blueprint Status
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Keseluruhan dokumen
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Tidak Ada Status Dokumen"
            description="Tidak ditemukan data dokumen pada filter ini."
            icon={PieChartIcon}
          />
        </div>
      </div>
    );
  }

  const chartData = STATUS_DISPLAY_ORDER.map((status) => ({
    name: status,
    value: statusCounts[status] || 0,
    color: STATUS_CONFIG[status].bar,
  }));

  const donePct = Math.round(((statusCounts.Done || 0) / total) * 100);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/70">
      <div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          Blueprint Status
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Keseluruhan dokumen
        </p>
      </div>

      <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-6 sm:flex-row">
        {/* DONUT CHART WITH CENTER LABEL */}
        <div className="relative h-40 w-40 shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  const value = Number(item.value ?? 0);
                  const pct =
                    total > 0 ? `${Math.round((value / total) * 100)}%` : "0%";
                  const color =
                    STATUS_CONFIG[item.name as BlueprintStatus]?.bar ??
                    "#2563EB";
                  return (
                    <RechartsTip
                      title={item.name}
                      rows={[
                        {
                          color,
                          label: "Jumlah",
                          value: `${value} (${pct})`,
                        },
                      ]}
                    />
                  );
                }}
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={68}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={(_, index) =>
                  setActiveStatus(chartData[index]?.name ?? null)
                }
                onMouseLeave={() => setActiveStatus(null)}
              >
                {chartData.map((entry) => {
                  const isDimmed =
                    activeStatus !== null && activeStatus !== entry.name;
                  return (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={entry.color}
                      fillOpacity={isDimmed ? 0.45 : 1}
                      style={{ transition: "fill-opacity 0.15s ease" }}
                    />
                  );
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-display text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {donePct}%
            </span>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Done
            </span>
          </div>
        </div>

        {/* LEGEND LIST */}
        <div className="flex flex-1 flex-col gap-2.5 w-full min-w-0">
          {STATUS_DISPLAY_ORDER.map((status) => {
            const count = statusCounts[status] || 0;
            const pct = Math.round((count / total) * 100);
            const cfg = STATUS_CONFIG[status];
            return (
              <button
                key={status}
                type="button"
                onClick={() => onSelectStatus?.(status)}
                onMouseEnter={() => setActiveStatus(status)}
                onMouseLeave={() => setActiveStatus(null)}
                className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-all cursor-pointer ${
                  activeStatus === status
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : activeStatus !== null
                      ? "opacity-45 hover:opacity-100"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                }`}
                title={`Lihat daftar dokumen berstatus ${status}`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-xs"
                  style={{ backgroundColor: cfg.bar }}
                />
                <span className="flex-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                  {status}
                </span>
                <span className="font-display text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {count}
                </span>
                <span className="w-9 text-right text-[11px] text-zinc-400 dark:text-zinc-500">
                  {pct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
