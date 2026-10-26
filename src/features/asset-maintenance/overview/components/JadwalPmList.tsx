"use client";

import {
  CalendarCheck,
  Check,
  RefreshCw,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import EmptyState from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import type {
  PmScheduleMonth,
  PmStatus,
} from "../types/overview.types";
import type { AssetFilterInput } from "@/types/asset-pm.types";

interface StatusStyle {
  month: string;
  chip: string;
  badge: string;
  label: string;
  icon: LucideIcon;
}

/** Per-status styling - "done" rows read as muted grey; ongoing is amber. */
const STATUS: Record<PmStatus, StatusStyle> = {
  done: {
    month: "text-zinc-400 dark:text-zinc-500",
    chip: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    badge:
      "text-emerald-600 dark:text-emerald-400 bg-emerald-100 px-2 py-1 rounded-full",
    label: "Done",
    icon: Check,
  },
  ongoing: {
    month: "text-amber-600 dark:text-amber-400",
    chip: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    badge:
      "text-amber-600 dark:text-amber-400 bg-amber-100 px-2 py-1 rounded-full",
    label: "On Progress",
    icon: RefreshCw,
  },
  upcoming: {
    month: "text-zinc-900 dark:text-zinc-100",
    chip: "bg-zinc-50 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300",
    badge:
      "text-zinc-600 dark:text-zinc-400 bg-zinc-100 px-2 py-1 rounded-full",
    label: "On Queue",
    icon: Clock,
  },
};

export default function JadwalPmList({
  input,
  schedule: propsSchedule,
}: {
  input: AssetFilterInput;
  schedule?: PmScheduleMonth[];
}) {
  const schedule = propsSchedule || [];
  const upcomingCount = schedule.filter((r) => r.status === "upcoming").length;
  const isEmpty = schedule.length === 0;

  return (
    <Card className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-400">
          <CalendarCheck size={18} />
        </span>
        <div>
          <h3 className="text-md font-bold text-zinc-900 dark:text-zinc-50">
            Jadwal PM {input.year}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Cabang terjadwal per bulan · {upcomingCount} akan datang
          </p>
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={CalendarCheck}
          title="Jadwal PM Tidak Tersedia"
          description="Tidak ada agenda pelaksanaan preventive maintenance pada periode atau lokasi terpilih."
          height={180}
        />
      ) : (
        /* Container scrollable dengan batas tinggi maksimal */
        <div className="max-h-90 overflow-y-auto pr-1">
          <ul>
            {schedule.map((row) => {
              const cfg = STATUS[row.status];
              const Icon = cfg.icon;
              return (
                <li
                  key={row.month}
                  className="flex items-center gap-3 border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-800/60"
                >
                  <div className="w-11 shrink-0 leading-tight">
                    <div className={cn("text-sm font-bold", cfg.month)}>
                      {row.month}
                    </div>
                    <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                      {input.year}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-wrap gap-1.5">
                    {row.sites.map((site) => (
                      <span
                        key={site}
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs font-semibold",
                          cfg.chip,
                        )}
                      >
                        {site}
                      </span>
                    ))}
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[11px] font-semibold",
                        cfg.badge,
                      )}
                    >
                      <Icon size={12} />
                      {cfg.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
