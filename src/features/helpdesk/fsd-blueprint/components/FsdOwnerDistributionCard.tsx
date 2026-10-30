"use client";

import { FsdOwnerRow } from "../types/fsdBlueprint.types";
import { STATUS_CONFIG, STATUS_DISPLAY_ORDER } from "../utils/fsdCalculations";
import { EmptyState } from "@/components/shared/EmptyState";
import { Building2 } from "lucide-react";

interface FsdOwnerDistributionCardProps {
  ownerData: FsdOwnerRow[];
}

export function FsdOwnerDistributionCard({
  ownerData,
}: FsdOwnerDistributionCardProps) {
  const maxTotal = Math.max(1, ...ownerData.map((d) => d.total));
  const totalAll = ownerData.reduce((acc, curr) => acc + curr.total, 0);

  if (totalAll === 0) {
    return (
      <div className="flex h-full min-h-[300px] flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/70">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Blueprint by Owner
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Modul per divisi pemilik
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Tidak Ada Data Divisi"
            description="Tidak ditemukan data owner divisi pada filter ini."
            icon={Building2}
          />
        </div>
      </div>
    );
  }

  const statuses = STATUS_DISPLAY_ORDER;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/70">
      {/* HEADER WITH TITLE, SUBTITLE & LEGEND BELOW SUBTITLE */}
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Blueprint by Owner
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Modul per divisi pemilik
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-zinc-500 dark:text-zinc-400"
            >
              <span
                className="h-2 w-2 rounded-xs"
                style={{ backgroundColor: STATUS_CONFIG[status].bar }}
              />
              {status}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col justify-center gap-3">
        {ownerData.map((row) => {
          const outerWidthPct = (row.total / maxTotal) * 100;
          return (
            <div key={row.owner} className="flex items-center gap-3">
              <span
                className="w-20 truncate text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                title={row.owner}
              >
                {row.owner}
              </span>

              <div className="relative flex-1 h-4.5 rounded-md bg-zinc-100 overflow-hidden dark:bg-zinc-800/80">
                {row.total > 0 && (
                  <div
                    className="flex h-full rounded-md overflow-hidden transition-all duration-500"
                    style={{ width: `${Math.max(outerWidthPct, 4)}%` }}
                  >
                    {statuses.map((st) => {
                      const count = row[st];
                      if (count <= 0) return null;
                      const segPct = (count / row.total) * 100;
                      return (
                        <div
                          key={st}
                          title={`${row.owner} — ${st}: ${count}`}
                          className="h-full min-w-[3px] transition-all hover:brightness-110"
                          style={{
                            width: `${segPct}%`,
                            backgroundColor: STATUS_CONFIG[st].bar,
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <span className="w-7 text-right font-display text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {row.total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
