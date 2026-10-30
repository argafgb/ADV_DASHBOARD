export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import { KaldevTeamPerformanceSkeleton } from "@/features/kaldev-performance/components/skeletons/kaldev-skeletons";
import { PageHeader } from "@/features/kaldev-performance/components/shared/page-header";
import {
  first,
  readKaldevFilters,
  type RawSearchParams,
} from "@/features/kaldev-performance/utils/filters";
import { hrefWith } from "@/features/kaldev-performance/utils/format";
import type { QuarterKey, TeamTab } from "@/features/kaldev-performance/types/kaldev.types";
import { CompletedQuarterCard } from "@/features/kaldev-performance/components/team-performance/completed-quarter-card";
import { TeamPerformanceClient } from "@/features/kaldev-performance/components/team-performance/team-performance-client";
import { getTeamPerformanceData } from "@/features/kaldev-performance/services/teamPerformanceService";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

const TABS: TeamTab[] = ["sla", "beban", "tren"];
const QUARTERS: QuarterKey[] = ["Q1", "Q2", "Q3", "Q4"];

function parseTab(value: string | undefined): TeamTab {
  return TABS.includes(value as TeamTab) ? (value as TeamTab) : "sla";
}

function parseQuarter(value: string | undefined): QuarterKey {
  return QUARTERS.includes(value as QuarterKey) ? (value as QuarterKey) : "Q3";
}

async function TeamPerformanceContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = await readKaldevFilters(params);
  const tab = parseTab(first(params.tab));
  const quarter = parseQuarter(first(params.quarter));
  const data = await getTeamPerformanceData(filters, { tab, quarter });

  const subtitle: Record<TeamTab, string> = {
    sla: `Pencapaian SLA per programmer terhadap target ${data.target}%.`,
    beban: "Beban kerja aktif per programmer untuk periode terpilih.",
    tren: "Pergerakan SLA bulanan dan sebaran kategori proyek aktif.",
  };
  const tabHrefs = Object.fromEntries(
    TABS.map((t) => [
      t,
      hrefWith("/dashboard/kaldev-performance/team-performance", filters, { tab: t, quarter }),
    ]),
  ) as Record<TeamTab, string>;
  const quarterHrefs = Object.fromEntries(
    QUARTERS.map((q) => [
      q,
      hrefWith("/dashboard/kaldev-performance/team-performance", filters, { tab, quarter: q }),
    ]),
  ) as Record<QuarterKey, string>;

  return (
    <>
      <PageHeader title="Team performance" subtitle={subtitle[tab]} />
      <CompletedQuarterCard
        quarter={data.quarter}
        quarterHrefs={quarterHrefs}
      />
      <TeamPerformanceClient
        data={data}
        tab={tab}
        tabHrefs={tabHrefs}
        yearLabel={filters.year}
      />
    </>
  );
}

export default async function TeamPerformancePage({ searchParams }: PageProps) {
  await connection();
  await requirePagePermission("menu.kaldev-performance.team-performance.view");

  return (
    <div
      style={{ display: "grid", gap: "var(--grid-gap)", alignContent: "start" }}
    >
      <Suspense
        fallback={
          <>
            <PageHeader
              title="Team performance"
              subtitle="Memuat performa tim…"
            />
            <KaldevTeamPerformanceSkeleton />
          </>
        }
      >
        <TeamPerformanceContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
