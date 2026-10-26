"use client";

import { useAssetFilters } from "@/hooks/useAssetFilters";
import UsiaAsetBars from "./UsiaAsetBars";
import RnmPerCabangBars from "./RnmPerCabangBars";
import KategoriTemuanBars from "./KategoriTemuanBars";
import type { UsiaAsetData, RnmDatum } from "../types/comparison.types";
import type { KategoriTemuanComparisonData } from "../services/comparisonService";

interface ComparisonClientProps {
  initialUsiaData?: UsiaAsetData;
  initialRnmData?: RnmDatum[];
  initialKategoriTemuanData?: KategoriTemuanComparisonData;
}

export default function ComparisonClient({
  initialUsiaData,
  initialRnmData,
  initialKategoriTemuanData,
}: ComparisonClientProps = {}) {
  const { input } = useAssetFilters();

  return (
    <div className="space-y-4">
      <UsiaAsetBars input={input} initialData={initialUsiaData} />
      <RnmPerCabangBars input={input} initialData={initialRnmData} />
      <KategoriTemuanBars
        input={input}
        initialData={initialKategoriTemuanData}
      />
    </div>
  );
}
