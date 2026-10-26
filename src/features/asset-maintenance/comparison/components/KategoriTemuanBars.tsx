"use client";

import { useEffect, useState, useTransition } from "react";
import ChartCard from "@/components/shared/ChartCard";
import BarList from "@/components/shared/BarList";
import {
  getKategoriTemuanComparisonData,
  type KategoriTemuanComparisonData,
} from "../services/comparisonService";
import type { AssetFilterInput } from "@/types/asset-pm.types";
import { FindingCategoryListSkeleton } from "./skeletons/ComparisonSkeletons";

export default function KategoriTemuanBars({
  input,
  initialData,
}: {
  input: AssetFilterInput;
  initialData?: KategoriTemuanComparisonData;
}) {
  const [requestData, setRequestData] =
    useState<KategoriTemuanComparisonData | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (initialData) return;

    startTransition(async () => {
      const res = await getKategoriTemuanComparisonData(input);
      setRequestData(res);
    });
  }, [input, initialData]);

  const data = initialData ?? requestData;

  return (
    <ChartCard
      title="Finding Category Comparison"
      subtitle="Dua taksonomi berbeda — ditampilkan bersebelahan"
    >
      {isPending || !data ? (
        <FindingCategoryListSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Previous Year Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Kategori {data.previousYearLabel}
            </h4>
            <div className="max-h-80 overflow-y-auto pr-2">
              {data.previousYearData.length > 0 ? (
                <BarList items={data.previousYearData} color="#60A5FA" />
              ) : (
                <p className="py-4 text-xs text-zinc-400">
                  Tidak ada data temuan untuk {data.previousYearLabel}
                </p>
              )}
            </div>
          </div>

          {/* Selected Year Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Kategori {data.selectedYearLabel}
            </h4>
            <div className="max-h-80 overflow-y-auto pr-2">
              {data.selectedYearData.length > 0 ? (
                <BarList items={data.selectedYearData} color="#2563EB" />
              ) : (
                <p className="py-4 text-xs text-zinc-400">
                  Tidak ada data temuan untuk {data.selectedYearLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  );
}
