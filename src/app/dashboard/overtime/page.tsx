export const instant = false;

import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import { getDashboardFilters } from "@/features/overtime/utils/dashboard-filters";
import { getOrgFilterOptions } from "@/features/overtime/services/filterOptionsService";
import {
  getOverviewPeriod,
  getOverviewKpis,
  getYoyHours,
  getYoyCost,
  getParetoCauses,
  getComposition,
} from "@/features/overtime/services/overviewService";
import { INDONESIAN_MONTH_NAMES } from "@/features/overtime/utils/month-filter";
import { KpiCards } from "@/features/overtime/components/overview/kpi-cards";
import { YoyLineChart } from "@/features/overtime/components/overview/yoy-line-chart";
import { ParetoChart } from "@/features/overtime/components/overview/pareto-chart";
import { CompositionDonut } from "@/features/overtime/components/overview/composition-donut";
import { OvertimeOverviewSkeleton } from "@/features/overtime/components/skeletons";

interface PageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}

function trendSubtitle(baseYear: number): string {
  return `${baseYear} vs ${baseYear - 1} vs ${baseYear - 2}`;
}

async function OverviewContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const { years } = await getOrgFilterOptions();
  const { year, month } = getDashboardFilters(params, {
    availableYears: years,
  });

  const period = await getOverviewPeriod(year, month);

  const [kpis, yoyHours, yoyCost, pareto, composition] = await Promise.all([
    getOverviewKpis(period),
    getYoyHours(period),
    getYoyCost(period),
    getParetoCauses(period),
    getComposition(period),
  ]);

  return (
    <>
      {period.includesOpenMonth && (
        <p className="dd-chart__note" style={{ marginTop: 0 }}>
          {period.cutoffMonth
            ? `Closing terakhir ${INDONESIAN_MONTH_NAMES[period.cutoffMonth - 1]} ${period.year}. Angka setelah bulan itu masih berjalan dan bisa berubah.`
            : `Belum ada bulan yang closing pada ${period.year}. Angka di bawah masih berjalan dan bisa berubah.`}
        </p>
      )}

      <KpiCards data={kpis} />

      <YoyLineChart
        title="Tren jam lembur (YoY)"
        subtitle={`${trendSubtitle(period.year)} · approved · ribu jam`}
        chipLabel={period.label}
        baseYear={period.year}
        data={yoyHours}
        unit="ribu jam"
      />

      <YoyLineChart
        title="Tren biaya lembur (YoY)"
        subtitle={`${trendSubtitle(period.year)} · approved · juta rupiah`}
        chipLabel={period.label}
        baseYear={period.year}
        data={yoyCost}
        unit="juta rupiah"
        format="currency"
      />

      <div className="dd-row--6535">
        <ParetoChart data={pareto} />
        <CompositionDonut data={composition} />
      </div>
    </>
  );
}

export default async function OverviewPage({ searchParams }: PageProps) {
  await connection();
  await requirePagePermission("menu.overtime.overview.view");

  return (
    <div
      style={{
        display: "grid",
        gap: "var(--grid-gap)",
        alignContent: "start",
      }}
    >
      <header>
        <h1 className="dd-page__title">Overview</h1>
        <p className="dd-page__subtitle">
          Ringkasan tetap untuk perhatian management dan direksi
        </p>
      </header>

      <Suspense fallback={<OvertimeOverviewSkeleton />}>
        <OverviewContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
