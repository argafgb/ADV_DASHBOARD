export const instant = false;

import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import { getDashboardFilters } from "@/features/overtime/utils/dashboard-filters";
import { getOrgFilterOptions } from "@/features/overtime/services/filterOptionsService";
import {
  getOpsRanking,
  getHoRanking,
  getComparison,
  getRatio,
  getScatter,
} from "@/features/overtime/services/organizationService";
import type {
  ComparisonRow,
  RatioItem,
  RatioData,
  ComparisonCardData,
  RatioChartData,
  ComparisonSegment,
  OrganizationData,
} from "@/features/overtime/types/organization.types";
import { EMPTY_STAT } from "@/features/overtime/types/organization.types";
import { UnitRanking } from "@/features/overtime/components/organization/unit-ranking";
import { HoVsOps } from "@/features/overtime/components/organization/ho-vs-ops";
import { RatioChart } from "@/features/overtime/components/organization/ratio-chart";
import { ScatterPlot } from "@/features/overtime/components/organization/scatter-plot";
import { OvertimeOrganizationSkeleton } from "@/features/overtime/components/skeletons";

interface PageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    dept?: string;
    area?: string;
    level1?: string;
    level2?: string;
  }>;
}

const numberId = (value: number, digits = 0) =>
  value.toLocaleString("id-ID", { maximumFractionDigits: digits });

const costInMillions = (cost: number) =>
  `Rp${numberId(cost / 1_000_000, 1)} jt`;

function buildComparisonCard(
  serviceData: OrganizationData["comparison"],
): ComparisonCardData {
  const segments: ComparisonSegment[] = serviceData.rows.map(
    (r: ComparisonRow) => ({
      label: r.label === "Head Office (HO)" ? "Head office (HO)" : r.label,
      hours: r.hours,
      hoursLabel: r.hoursLabel,
      percentage: r.percentage,
      color: r.color === "brand" ? "#2563EB" : "#60A5FA",
    }),
  );

  const { topContributor, topIncrease } = serviceData;

  return {
    totalHours: serviceData.totalHours,
    totalLabel: numberId(serviceData.totalHours),
    segments,
    topContributor: {
      label: topContributor?.label ?? EMPTY_STAT,
      subtitle: "Unit penyumbang jam terbesar",
      hours: topContributor?.hours ?? 0,
      hoursLabel: topContributor ? numberId(topContributor.hours) : EMPTY_STAT,
      detail: topContributor
        ? `jam · ${costInMillions(topContributor.cost)} · ${topContributor.sharePct}% dari total`
        : "Data belum tersedia",
    },
    topIncrease: {
      label: topIncrease?.label ?? EMPTY_STAT,
      subtitle: "Kenaikan tercepat dibanding bulan lalu",
      delta: topIncrease ? `+${topIncrease.deltaPct}%` : "",
      hours: topIncrease?.hours ?? 0,
      hoursLabel: topIncrease ? numberId(topIncrease.hours) : EMPTY_STAT,
      detail: topIncrease
        ? `jam · dari ${numberId(topIncrease.prevHours)} jam bulan lalu`
        : "Belum ada bulan pembanding",
    },
  };
}

function buildRatioItems(serviceData: RatioData): RatioChartData {
  return {
    items: serviceData.items.map((r: RatioItem) => {
      const num = parseFloat(r.value.replace(",", "."));
      return { name: r.name, value: isNaN(num) ? 0 : num };
    }),
    unmatched: serviceData.unmatched,
  };
}

async function OrganizationContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const orgFilterOptions = await getOrgFilterOptions();
  const { year, month, area, level1, level2 } = getDashboardFilters(params, {
    availableYears: orgFilterOptions.years,
    orgFilterOptions,
  });

  const [opsUnits, hoUnits, comparison, ratio, scatter] = await Promise.all([
    getOpsRanking(year, month),
    getHoRanking(year, month),
    getComparison(year, month, level1, level2),
    getRatio(year, month, area, level1, level2),
    getScatter(year, month, area, level1, level2),
  ]);

  const comparisonCard = buildComparisonCard(comparison);
  const ratioData = buildRatioItems(ratio);

  return (
    <>
      <HoVsOps data={comparisonCard} />

      <div className="dd-row dd-row--2">
        <UnitRanking opsUnits={opsUnits} hoUnits={hoUnits} />
        <RatioChart data={ratioData.items} unmatched={ratioData.unmatched} />
      </div>

      <ScatterPlot data={scatter} />
    </>
  );
}

export default async function OrganizationPage({ searchParams }: PageProps) {
  await connection();
  await requirePagePermission("menu.overtime.organization-analysis.view");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--grid-gap)",
      }}
    >
      <header>
        <h1 className="dd-page__title">Organization Analysis</h1>
        <p className="dd-page__subtitle">
          Perbandingan lembur berdasarkan HO, OPS, unit, dan headcount. Klik
          unit untuk melihat informasi lebih detail.
        </p>
      </header>

      <Suspense fallback={<OvertimeOrganizationSkeleton />}>
        <OrganizationContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
