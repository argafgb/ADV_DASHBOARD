"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { matchesDetailIdentity } from "@/lib/async-view-state";
import { fmt } from "@/lib/utils";
import type { AssetFilterInput } from "@/types/asset-pm.types";
import { getMonthlyCellDetailData } from "../services/costService";
import type { MonthlyCellDetailResult } from "../utils/monthlyCellDetailTransformer";

export interface MonthlyCellDetailModalData {
  site: string;
  region: string;
  type: string;
  month: string;
  total: number;
  rowTotal: number;
}

interface MonthlyCellDetailModalProps {
  data: MonthlyCellDetailModalData | null;
  input: AssetFilterInput;
  onClose: () => void;
}

export default function MonthlyCellDetailModal({
  data,
  input,
  onClose,
}: MonthlyCellDetailModalProps) {
  const [detail, setDetail] = useState<MonthlyCellDetailResult | null>(null);

  useEffect(() => {
    if (!data) return;

    let isMounted = true;

    getMonthlyCellDetailData(
      input,
      data.site,
      data.region,
      data.type,
      data.month,
      data.rowTotal,
    )
      .then((res) => {
        if (isMounted) {
          setDetail(res);
        }
      })
      .catch((err) => {
        console.error("Error fetching cell detail modal data:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [data, input]);

  if (!data) return null;

  const detailMatchesData = matchesDetailIdentity(detail, data);
  const currentDetail = detailMatchesData ? detail : null;
  const loading = !currentDetail;
  const siteName = currentDetail?.site || data.site;
  const regionName = currentDetail?.region || data.region;
  const typeName = currentDetail?.type || data.type;
  const monthName = currentDetail?.month || data.month;

  const displayTotal = currentDetail ? currentDetail.total : data.total;
  const deviceCount = currentDetail ? currentDetail.deviceCount : 0;
  const costPerUnit = currentDetail ? currentDetail.costPerUnit : 0;
  const sharePct = currentDetail
    ? currentDetail.sharePct
    : data.rowTotal > 0
      ? ((data.total / data.rowTotal) * 100).toFixed(1)
      : "0.0";

  const sewaTotal = currentDetail ? currentDetail.sewaTotal : 0;
  const sewaPct = currentDetail ? currentDetail.sewaPct : "0.0%";
  const sewaWisesa = currentDetail ? currentDetail.sewaWisesa : 0;

  const repairTotal = currentDetail ? currentDetail.repairTotal : 0;
  const repairPct = currentDetail ? currentDetail.repairPct : "0.0%";
  const repairWisesa = currentDetail ? currentDetail.repairWisesa : 0;
  const repairAdv = currentDetail ? currentDetail.repairAdv : 0;
  const repairWisesaBar = currentDetail ? currentDetail.repairWisesaBar : "0%";
  const repairAdvBar = currentDetail ? currentDetail.repairAdvBar : "0%";

  const categories = currentDetail ? currentDetail.categories : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner / Header */}
        <div className="bg-zinc-50/90 dark:bg-zinc-800/40 p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                BIAYA R&M · {monthName}
              </div>
              <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {siteName}
              </h3>
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                {regionName} · {typeName}
              </div>

              <div className="mt-3 text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                Rp {fmt(displayTotal)}
              </div>
              <div className="text-[11.5px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">
                Total belanja bulan ini
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-zinc-200 bg-white p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* 3 Stat Cards Row */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                PERANGKAT
              </div>
              <div className="mt-1 text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                {loading ? (
                  <span className="inline-block h-5 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                ) : (
                  deviceCount
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                BIAYA / PERANGKAT
              </div>
              <div className="mt-1 text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                {loading ? (
                  <span className="inline-block h-5 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                ) : (
                  `Rp ${fmt(costPerUnit)}`
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                SHARE BULAN
              </div>
              <div className="mt-1 text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                {loading ? (
                  <span className="inline-block h-5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                ) : (
                  `${sharePct}% dari site`
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body Content (2 Columns) */}
        <div className="p-6">
          {loading && !detail ? (
            <div
              className="grid animate-pulse grid-cols-1 gap-4 md:grid-cols-2"
              role="status"
              aria-label="Memuat rincian biaya bulanan"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-5 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                  <div className="mt-4 h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="mt-4 flex justify-between">
                    <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                  <div className="mt-2 flex justify-between">
                    <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: SEWA & REPAIR Cards */}
              <div className="flex flex-col justify-between space-y-4">
                {/* SEWA Card */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        SEWA
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10.5px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {sewaPct}
                      </span>
                    </div>
                    <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                      Rp {fmt(sewaTotal)}
                    </span>
                  </div>

                  <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div className="h-full w-full bg-blue-600" />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm bg-blue-600" />
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Wisesa
                      </span>
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      Rp {fmt(sewaWisesa)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm bg-amber-500" />
                      <span className="text-zinc-500 dark:text-zinc-400">
                        ADV
                      </span>
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      Rp 0
                    </span>
                  </div>
                </div>

                {/* REPAIR Card */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        REPAIR
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10.5px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {repairPct}
                      </span>
                    </div>
                    <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                      Rp {fmt(repairTotal)}
                    </span>
                  </div>

                  <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: repairWisesaBar }}
                    />
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: repairAdvBar }}
                    />
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm bg-blue-600" />
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Wisesa
                        </span>
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        Rp {fmt(repairWisesa)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm bg-amber-500" />
                        <span className="text-zinc-500 dark:text-zinc-400">
                          ADV
                        </span>
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        Rp {fmt(repairAdv)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: PER KATEGORI Card */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    PER KATEGORI
                  </span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm bg-blue-600" />
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Sewa
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm bg-blue-300 dark:bg-blue-400" />
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Repair
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {categories.map((c) => (
                    <div key={c.label} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          {c.label}
                        </span>
                        <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                          {c.totalFmt}
                        </span>
                      </div>

                      <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                          style={{ width: c.sewaBar }}
                          className="h-full bg-blue-600"
                        />
                        <div
                          style={{ width: c.repairBar }}
                          className="h-full bg-blue-300 dark:bg-blue-400"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                        <div>
                          Sewa{" "}
                          <b className="text-zinc-800 dark:text-zinc-200 font-bold">
                            {c.sewaFmt}
                          </b>
                          {" · "}
                          Repair{" "}
                          <b className="text-zinc-800 dark:text-zinc-200 font-bold">
                            {c.repairFmt}
                          </b>
                        </div>
                        <span>{c.shareMonth}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
