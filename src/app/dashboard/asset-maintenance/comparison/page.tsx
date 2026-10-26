import { Suspense } from "react";
import ComparisonClient from "@/features/asset-maintenance/comparison/components/ComparisonClient";
import { ComparisonPageSkeleton } from "@/features/asset-maintenance/comparison/components/skeletons/ComparisonSkeletons";
import type { DashboardSearchParams } from "@/lib/global-filters";
import { scopedAssetFilterInput } from "@/lib/auth/current-site-filter";
import {
  getUsiaAsetData,
  getRnmPerCabangData,
  getKategoriTemuanComparisonData,
} from "@/features/asset-maintenance/comparison/services/comparisonService";

export const instant = false;

export default async function ComparisonPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const input = await scopedAssetFilterInput(await searchParams);

  const [usiaData, rnmData, kategoriTemuanData] = await Promise.all([
    getUsiaAsetData(input, "workstation"),
    getRnmPerCabangData(input, "Operational", "all", "all"),
    getKategoriTemuanComparisonData(input),
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
          Comparison
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          Perbandingan antarperiode dan distribusi usia aset
        </p>
      </header>

      <Suspense fallback={<ComparisonPageSkeleton />}>
        <ComparisonClient
          initialUsiaData={usiaData}
          initialRnmData={rnmData}
          initialKategoriTemuanData={kategoriTemuanData}
        />
      </Suspense>
    </div>
  );
}
