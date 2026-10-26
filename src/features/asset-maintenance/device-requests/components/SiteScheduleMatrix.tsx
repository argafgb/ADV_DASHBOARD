"use client";

import { CalendarX } from "lucide-react";
import ChartCard from "@/components/shared/ChartCard";
import EmptyState from "@/components/shared/EmptyState";
import { cn, fmt } from "@/lib/utils";
import type { DeviceRequestType, DeviceRequestsModel } from "../types";
import { MONTH_FULL, MONTH_SHORT } from "../utils/deviceRequestsTransformer";
import RequestChip, { RequestLegend } from "./RequestChip";

const TYPES: DeviceRequestType[] = ["router", "ap", "switch"];

export default function SiteScheduleMatrix({
  model,
  selectedMonths,
}: {
  model: DeviceRequestsModel;
  /** Months (1-12) highlighted by the global month filter; empty = none. */
  selectedMonths: number[];
}) {
  const isSelected = (idx: number) => selectedMonths.includes(idx + 1);
  const grand = model.scheduleMonthTotals.reduce((a, b) => a + b, 0);

  return (
    <ChartCard
      title="Jadwal Kebutuhan per Cabang"
      subtitle="Unit per bulan · diurutkan dari kebutuhan terbanyak"
      action={<RequestLegend />}
    >
      {model.schedule.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="Jadwal Kebutuhan Kosong"
          description="Tidak ada kebutuhan perangkat untuk filter ini."
          height={200}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:bg-zinc-900">
                  Cabang / Unit
                </th>
                {MONTH_SHORT.map((m, idx) => (
                  <th
                    key={m}
                    className={cn(
                      "rounded-t-md px-1.5 py-2 text-center text-[11px] font-semibold uppercase tracking-wide",
                      isSelected(idx)
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                        : "text-zinc-400",
                    )}
                  >
                    {m}
                  </th>
                ))}
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {model.schedule.map((row) => (
                <tr
                  key={row.site}
                  className="border-t border-zinc-100 transition-colors hover:bg-zinc-50/60 dark:border-zinc-800/60 dark:hover:bg-zinc-800/40"
                >
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2.5 dark:bg-zinc-900">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-100">
                      {row.site}
                    </div>
                    <div className="text-[11px] text-zinc-400">{row.region}</div>
                  </td>
                  {row.cells.map((cell, idx) => {
                    const chips = TYPES.filter((t) => cell[t] > 0);
                    return (
                      <td
                        key={idx}
                        title={
                          chips.length
                            ? `${row.site} · ${MONTH_FULL[idx]}`
                            : undefined
                        }
                        className={cn(
                          "border-l border-zinc-100 px-1 py-2 text-center dark:border-zinc-800/60",
                          isSelected(idx) && "bg-blue-50/50 dark:bg-blue-950/10",
                        )}
                      >
                        {chips.length ? (
                          <div className="flex flex-wrap justify-center gap-1">
                            {chips.map((t) => (
                              <RequestChip key={t} type={t} value={cell[t]} />
                            ))}
                          </div>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-700">–</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="border-l border-zinc-200 px-3 py-2.5 text-right font-bold tabular-nums text-blue-600 dark:border-zinc-800 dark:text-blue-400">
                    {fmt(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40">
                <td className="sticky left-0 z-10 bg-zinc-50 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:bg-zinc-800">
                  Total per bulan
                </td>
                {model.scheduleMonthTotals.map((v, idx) => (
                  <td
                    key={idx}
                    className={cn(
                      "border-l border-zinc-100 py-2.5 text-center font-bold tabular-nums dark:border-zinc-800/60",
                      v
                        ? "text-zinc-800 dark:text-zinc-100"
                        : "text-zinc-300 dark:text-zinc-700",
                    )}
                  >
                    {v || "–"}
                  </td>
                ))}
                <td className="border-l border-zinc-200 px-3 py-2.5 text-right text-base font-extrabold tabular-nums text-blue-600 dark:border-zinc-800 dark:text-blue-400">
                  {fmt(grand)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </ChartCard>
  );
}
