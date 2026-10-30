"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, Icon } from "./UI";
import {
  fetchDashboardSyncLogs,
  getClientErrorMessage,
} from "../services/dashboard-api-client";
import type { SyncRun } from "../types/dashboard-contracts";
import { formatSyncTimestamp } from "../utils/utils";

export function TabSyncLogsView() {
  const [logs, setLogs] = useState<readonly SyncRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;

    void fetchDashboardSyncLogs()
      .then((response) => {
        if (!active) return;
        setLogs(response.syncRuns);
        setErrorMsg(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setErrorMsg(getClientErrorMessage(error));
        setLogs([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalProcessed = logs.reduce(
      (sum, curr) => sum + (curr.records_processed || 0),
      0,
    );

    return {
      totalSnapshots: logs.length,
      totalProcessed,
      latestSync: logs.at(0)?.created_at ?? null,
    };
  }, [logs]);

  const filteredLogsList = useMemo(() => {
    return logs
      .filter((log) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          (log.message || "").toLowerCase().includes(q) ||
          (log.status || "").toLowerCase().includes(q) ||
          (log.sync_type || "").toLowerCase().includes(q)
        );
      })
      .slice(0, 50); // Limit to the last 50 logs as requested
  }, [logs, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="select-none">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-gray-900">
            System Sync Monitoring
          </h1>
          <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">
            Riwayat terbaru hasil sinkronisasi data terjadwal.
          </p>
        </div>
      </div>

      {/* KPI highlight row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
            Riwayat Tersedia
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-extrabold text-gray-900 font-display">
              {stats.totalSnapshots}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
              proses terakhir
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">
            Records Synced
          </span>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl font-extrabold text-blue-600 font-display">
              {stats.totalProcessed.toLocaleString("en-US")}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
              catatan total
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block">
            Last Synced
          </span>
          <div className="mt-1.5">
            <span className="text-lg font-extrabold text-emerald-600 font-display">
              {formatSyncTimestamp(stats.latestSync)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabbed logs Explorer Card */}
      <Card
        title="Worker Monitoring"
        sub="Status snapshot sinkronisasi terjadwal terakhir yang tercatat."
        padding="p-0"
      >
        <div className="p-4 bg-gray-50/40 border-b border-gray-100 flex justify-end select-none">
          <div className="relative w-full lg:max-w-xs">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
              <Icon name="search" className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Cari pesan log..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* List / Table */}
        <div className="min-h-[250px] flex flex-col justify-between">
          {isLoading ? (
            <div
              className="overflow-x-auto"
              role="status"
              aria-label="Memuat log sinkronisasi"
            >
              <div className="min-w-180 animate-pulse">
                <div className="grid grid-cols-[1.1fr_0.7fr_0.8fr_2fr] gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-3.5">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-3 w-3/4 rounded bg-gray-200"
                    />
                  ))}
                </div>
                {Array.from({ length: 7 }).map((_, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="grid grid-cols-[1.1fr_0.7fr_0.8fr_2fr] gap-4 border-b border-gray-50 px-6 py-4"
                  >
                    <div className="h-3 w-4/5 rounded bg-gray-100" />
                    <div className="h-5 w-20 rounded-full bg-gray-100" />
                    <div className="h-3 w-16 rounded bg-gray-100" />
                    <div className="space-y-2">
                      <div className="h-3 w-full rounded bg-gray-100" />
                      <div className="h-3 w-2/3 rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : errorMsg ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-rose-500">
              <span className="text-xs font-semibold">
                Gagal memuat log: {errorMsg}
              </span>
            </div>
          ) : filteredLogsList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-450 border-t border-gray-50">
              <Icon name="clipboard" className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-xs font-bold text-gray-700">
                Tidak ada log aktivitas ditemukan
              </p>
              <p className="text-[10.5px] text-gray-400 font-medium max-w-sm text-center leading-relaxed mt-1">
                Belum ada riwayat sinkronisasi, atau coba sesuaikan pencarian
                Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase text-gray-400 font-bold tracking-wider select-none">
                    <th className="px-6 py-3.5">Tanggal & Waktu</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Records Processed</th>
                    <th className="px-6 py-3.5">Message / Note</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-gray-50 font-medium text-gray-600">
                  {filteredLogsList.map((log) => {
                    const isSuccess = log.status?.toLowerCase() === "success";
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50/30 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-gray-400 select-none">
                          {formatSyncTimestamp(log.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap select-none">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isSuccess
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-rose-50 text-rose-700 border-rose-100"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                isSuccess ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap tabular-nums text-[11px] text-gray-950 font-bold">
                          {log.records_processed} records
                        </td>
                        <td className="px-6 py-4 text-gray-700 leading-relaxed font-sans font-medium max-w-xs md:max-w-lg break-words">
                          {log.message || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table total footer */}
          {!isLoading && filteredLogsList.length > 0 && (
            <div className="border-t border-gray-100 px-6 py-3.5 bg-gray-50/30 text-right select-none">
              <span className="text-[11px] text-gray-400 font-bold font-sans">
                Menampilkan{" "}
                <strong className="text-gray-700">
                  {filteredLogsList.length}
                </strong>{" "}
                log sinkronisasi terbaru
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
