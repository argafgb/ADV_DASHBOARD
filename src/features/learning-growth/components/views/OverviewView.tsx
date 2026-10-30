"use client";

import { useMemo } from "react";
import { MonthlyCadenceChart } from "../charts/monthly-cadence-chart";
import { Card } from "../Card";
import { CategoryCard } from "../overview/CategoryCard";
import { ComparisonCard } from "../overview/ComparisonCard";
import { CompositionCard } from "../overview/CompositionCard";
import { KpiCard } from "../overview/KpiCard";
import { YearLegend } from "../overview/YearLegend";
import { buildOverview } from "../../utils/build-overview";
import { useLearningGrowth } from "../../context/LearningGrowthFilterContext";

/**
 * Overview: KPI row, realization, composition + category grid, comparison.
 * Selalu satu tahun penuh - filter bulan tidak berlaku di menu ini.
 */
export function OverviewView() {
  const { year, data } = useLearningGrowth();
  const model = useMemo(() => buildOverview(data, year), [year, data]);

  return (
    <div className="flex flex-col gap-[15px]">
      <div className="grid min-w-0 grid-cols-1 gap-[13px] min-[420px]:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon="calendar"
          iconBg="rgba(37,99,235,.08)"
          iconFg="#2563EB"
          label="Total Program"
          value={model.kpis.totalProgram.value}
          sub={model.kpis.totalProgram.sub}
          tipLines={model.kpis.totalProgram.tipLines}
        />
        <KpiCard
          icon="check"
          iconBg="rgba(5,150,105,.08)"
          iconFg="#059669"
          label="Realisasi"
          value={model.kpis.realisasi.value}
          suffix="%"
          variant="primary"
          sub={model.kpis.realisasi.sub}
          tipLines={model.kpis.realisasi.tipLines}
          delayClass="dh-delay-05"
        />
        <KpiCard
          icon="star"
          iconBg="rgba(180,83,9,.08)"
          iconFg="#B45309"
          label="Sertifikasi Aktif"
          value={model.kpis.sertifikasiAktif.value}
          sub={model.kpis.sertifikasiAktif.sub}
          tipLines={model.kpis.sertifikasiAktif.tipLines}
          delayClass="dh-delay-10"
        />
        <KpiCard
          icon="users"
          iconBg="rgba(139,92,246,.1)"
          iconFg="#6D28D9"
          label="SDM Terlibat"
          value={model.kpis.sdmTerlibat.value}
          sub={model.kpis.sdmTerlibat.sub}
          tipLines={model.kpis.sdmTerlibat.tipLines}
          delayClass="dh-delay-15"
        />
      </div>

      <Card
        title="Monthly Realization"
        subtitle="Persentase program terlaksana per bulan · bulan tanpa program dikosongkan"
      >
        {model.realization.showBoth && <YearLegend items={model.realization.series} />}
        <MonthlyCadenceChart series={model.realization.series} />
      </Card>

      <div className="dh-fade-up dh-delay-24 grid min-w-0 grid-cols-1 gap-[15px] xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <CompositionCard donut={model.donut} />
        <CategoryCard categories={model.categories} />
      </div>

      <div className="dh-fade-up dh-delay-30">
        <ComparisonCard comparison={model.comparison} />
      </div>
    </div>
  );
}

export default OverviewView;
