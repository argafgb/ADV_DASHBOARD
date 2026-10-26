import { Suspense } from "react";
import FindingsClient from "@/features/asset-maintenance/finding-asset-lifecycle/components/FindingsClient";
import type { DashboardSearchParams } from "@/lib/global-filters";
import { scopedAssetFilterInput } from "@/lib/auth/current-site-filter";
import { FindingsDashboardSkeleton } from "@/features/asset-maintenance/finding-asset-lifecycle/components/skeletons/FindingsSkeletons";
import {
  getTemuanPerKategoriData,
  getCategoryTrendData,
  getStatusResolusiData,
  getEventLifecycleData,
  getReplacementVsNewData,
  getStatusPerCabangData,
  getFindingRowsData,
} from "@/features/asset-maintenance/finding-asset-lifecycle/services/findingsService";

export const instant = false;

export default async function FindingAssetLifecyclePage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const input = await scopedAssetFilterInput(await searchParams);

  const [
    temuanKategori,
    categoryTrend,
    statusResolusi,
    eventLifecycle,
    replacementVsNew,
    statusPerCabang,
    findingRows,
  ] = await Promise.all([
    getTemuanPerKategoriData(input),
    getCategoryTrendData(input),
    getStatusResolusiData(input),
    getEventLifecycleData(input),
    getReplacementVsNewData(input),
    getStatusPerCabangData(input),
    getFindingRowsData(input, 1, 10, ""),
  ]);

  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            Modul: Asset Maintenance
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          Finding &amp; Asset Lifecycle
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          Temuan PM &amp; siklus hidup aset
        </p>
      </header>

      <Suspense fallback={<FindingsDashboardSkeleton />}>
        <FindingsClient
          initialTemuanKategori={temuanKategori}
          initialCategoryTrend={categoryTrend}
          initialStatusResolusi={statusResolusi}
          initialEventLifecycle={eventLifecycle}
          initialReplacementVsNew={replacementVsNew}
          initialStatusPerCabang={statusPerCabang}
          initialFindingRows={findingRows}
        />
      </Suspense>
    </div>
  );
}
