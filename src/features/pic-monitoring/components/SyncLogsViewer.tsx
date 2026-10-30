"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Card, Icon } from "./UI";
import {
  fetchDashboardSyncLogs,
  getClientErrorMessage,
} from "../services/dashboard-api-client";
import type { ProjectAuditLog } from "../types/dashboard-contracts";
import { formatSyncTimestamp } from "../utils/utils";

interface SyncLogsViewerProps {
  refreshTrigger?: number;
}

export function SyncLogsViewer({ refreshTrigger }: SyncLogsViewerProps) {
  const [logs, setLogs] = useState<readonly ProjectAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchDashboardSyncLogs();
      setLogs(response.auditLogs.slice(0, 50));
    } catch (error: unknown) {
      setError(getClientErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    void fetchDashboardSyncLogs()
      .then((response) => {
        if (!active) return;
        setLogs(response.auditLogs.slice(0, 50));
        setError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setError(getClientErrorMessage(error));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  const getBadgeStyle = (category: string) => {
    const c = (category || "").toUpperCase();
    if (c === "STATUS") {
      return "bg-amber-50 text-amber-700 border-amber-150";
    }
    if (c === "MILESTONE") {
      return "bg-blue-50 text-blue-700 border-blue-150";
    }
    if (c === "NEW_PROJECT") {
      return "bg-emerald-50 text-emerald-700 border-emerald-150";
    }
    if (c === "PIC") {
      return "bg-sky-50 text-sky-700 border-sky-150";
    }
    if (c === "NAME") {
      return "bg-indigo-50 text-indigo-700 border-indigo-150";
    }
    return "bg-slate-50 text-slate-700 border-slate-150";
  };

  const formatCategory = (category: string) => {
    const c = (category || "").toUpperCase();
    if (c === "STATUS") return "Status Update";
    if (c === "MILESTONE") return "Milestone Update";
    if (c === "NEW_PROJECT") return "New Project";
    if (c === "PIC") return "PIC Update";
    if (c === "NAME") return "Name Update";
    return category;
  };

  return (
    <Card
      title="Latest Sync Status"
      sub="Status sinkronisasi data terjadwal terakhir"
      padding="p-5 md:p-6"
    >
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4 select-none">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          Sync Change Audit Logs (Recent 50)
        </span>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50 transition-all"
        >
          <Icon
            name="refresh-cw"
            className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`}
          />
          Reload logs
        </button>
      </div>

      {isLoading ? (
        <div
          className="space-y-3.5"
          role="status"
          aria-label="Memuat audit log sinkronisasi"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse flex-col justify-between gap-3 border-b border-gray-55 pb-3.5 last:border-b-0 sm:flex-row sm:items-start"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-40 rounded bg-gray-200" />
                  <div className="h-4 w-16 rounded-md bg-gray-100" />
                </div>
                <div className="h-3 w-3/4 rounded bg-gray-100" />
              </div>
              <div className="space-y-2 sm:w-28">
                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-3 w-4/5 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-8 text-center text-rose-500 text-xs font-semibold">
          Gagal memuat log: {error}
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center text-gray-450 border border-dashed border-gray-150 rounded-2xl flex flex-col items-center justify-center">
          <Icon name="clipboard" className="w-6 h-6 mb-1 text-gray-300" />
          <p className="text-xs font-bold text-gray-700">
            Audit log tingkat field belum tersedia
          </p>
          <p className="text-[10.5px] text-gray-400 font-medium max-w-xs leading-relaxed mt-1">
            Sistem saat ini menampilkan data sinkronisasi terbaru tanpa riwayat
            perubahan pada setiap field.
          </p>
        </div>
      ) : (
        <div className="max-h-[380px] overflow-y-auto pr-1 space-y-3.5 divide-y divide-gray-55">
          {logs.map((log, idx) => (
            <div
              key={log.id || idx}
              className="pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-gray-900 text-[13px] break-words">
                    {log.project_name || "Proyek tanpa judul"}
                  </span>
                  <span className="tabular-nums text-[9.5px] text-gray-400 font-bold bg-gray-50 border border-gray-150 px-1 py-0.2 rounded-md shrink-0">
                    {log.ticket}
                  </span>
                </div>

                <div className="text-gray-600 font-semibold flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border tracking-wide ${getBadgeStyle(log.change_category)}`}
                  >
                    {formatCategory(log.change_category)}
                  </span>

                  {(log.change_category || "").toUpperCase() ===
                  "NEW_PROJECT" ? (
                    <span className="text-emerald-600 font-bold bg-emerald-50/50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                      Record baru diimpor
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span className="line-through text-rose-400 font-medium">
                        {log.old_value || "Kosong"}
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 text-gray-400"
                      />
                      <span className="text-emerald-600 font-bold bg-emerald-50/50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                        {log.new_value || "Kosong"}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0 select-none">
                <p className="text-[10px] text-gray-400 font-bold tabular-nums">
                  {formatSyncTimestamp(log.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default SyncLogsViewer;
