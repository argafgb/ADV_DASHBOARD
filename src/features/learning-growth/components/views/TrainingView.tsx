"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { Card } from "../Card";
import { SegmentedControl } from "../ui/segmented-control";
import { buildTraining } from "../../utils/build-training";
import { InternalSummaryCard } from "../training/InternalSummaryCard";
import { MonthlyAgendaChart } from "../training/MonthlyAgendaChart";
import { ParticipationCard } from "../training/ParticipationCard";
import { ProviderMixCard } from "../training/ProviderMixCard";
import { RenewalCard } from "../training/RenewalCard";
import { VendorCard } from "../training/VendorCard";
import { useLearningGrowth } from "../../context/LearningGrowthFilterContext";
import type { TrainingTypeFilter } from "../../types/dashboard.types";

function normalizeType(raw: string | null): TrainingTypeFilter {
  return raw === "internal" || raw === "external" || raw === "all" ? raw : "all";
}

/** Training: type segment, monthly agenda chart, vendor/internal card. */
export function TrainingView() {
  const { year, month, data } = useLearningGrowth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const type = normalizeType(searchParams.get("type"));

  const setType = useCallback(
    (next: TrainingTypeFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("type", next);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const model = useMemo(() => buildTraining(data, year, type, month), [year, type, month, data]);

  return (
    <div className="flex flex-col gap-[15px]">
      <div className="dh-fade-up-fast flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          options={model.segmentOptions}
          value={type}
          onChange={setType}
          ariaLabel="Filter tipe pelatihan"
        />
        <span className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500 sm:text-right sm:text-[12px]">
          Rekap jumlah &amp; komposisi pelatihan · jadwal lengkap ada di halaman Timeline
        </span>
      </div>

      <div className="dh-fade-up dh-delay-08 grid min-w-0 grid-cols-1 items-start gap-[15px] xl:grid-cols-[minmax(0,8fr)_minmax(280px,4fr)]">
        <Card title="Monthly Training Intensity" subtitle="Jumlah sesi per bulan">
          <MonthlyAgendaChart groups={model.monthGroups} />
        </Card>
        <div className="min-w-0 self-stretch">
          <div className="flex min-w-0 flex-col gap-[15px]">
            {model.participation.show && <ParticipationCard participation={model.participation} />}
            {model.mix.show && <ProviderMixCard mix={model.mix} />}
            {model.vendor.show && <VendorCard rows={model.vendor.rows} />}
            {model.internal.show && <InternalSummaryCard internal={model.internal} />}
            {model.renewal.show && <RenewalCard renewal={model.renewal} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrainingView;
