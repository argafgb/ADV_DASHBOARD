export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import { KaldevOverviewSkeleton } from "@/features/kaldev-performance/components/skeletons/kaldev-skeletons";
import { AttentionCard } from "@/features/kaldev-performance/components/overview/attention-card";
import { CategoryRankedCard } from "@/features/kaldev-performance/components/overview/category-ranked-card";
import { IntakeChart } from "@/features/kaldev-performance/components/overview/intake-chart";
import { KpiStrip } from "@/features/kaldev-performance/components/overview/kpi-strip";
import { SlaTrendChart } from "@/features/kaldev-performance/components/overview/sla-trend-chart";
import { StatusMixCard } from "@/features/kaldev-performance/components/overview/status-mix-card";
import { TeamLoadCard } from "@/features/kaldev-performance/components/overview/team-load-card";
import { getOverviewData } from "@/features/kaldev-performance/services/overviewService";
import {
  readKaldevFilters,
  type RawSearchParams,
} from "@/features/kaldev-performance/utils/filters";
import { hrefWith } from "@/features/kaldev-performance/utils/format";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

async function OverviewContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = await readKaldevFilters(params);
  const data = await getOverviewData(filters);

  return (
    <>
      <KpiStrip
        kpi={data.kpi}
        sla={data.sla}
        dueHref={hrefWith("/dashboard/kaldev-performance/action-required", filters, {
          tab: "sla",
        })}
      />

      <div className="kd-grid-split">
        <AttentionCard items={data.attention} />
        <SlaTrendChart
          subtitle={`Persentase proyek tercapai per bulan, ${data.yearLabel}`}
          trend={data.trend}
          target={data.sla.target}
          note={data.trendNote}
        />
      </div>

      <div className="kd-grid-split">
        <StatusMixCard
          slices={data.mix.slices}
          total={data.mix.total}
          subtitle={data.mix.subtitle}
          holdCount={data.mix.holdCount}
          cancelCount={data.mix.cancelCount}
        />
        <IntakeChart
          intake={data.intake}
          trend={data.trend}
          yearLabel={data.yearLabel}
        />
      </div>

      <div className="kd-grid-equal">
        <TeamLoadCard rows={data.teamLoad} max={data.teamMax} />
        <CategoryRankedCard rows={data.categories} />
      </div>
    </>
  );
}

export default async function KaldevOverviewPage({ searchParams }: PageProps) {
  await connection();
  await requirePagePermission("menu.kaldev-performance.overview.view");

  return (
    <div
      style={{ display: "grid", gap: "var(--grid-gap)", alignContent: "start" }}
    >
      <Suspense fallback={<KaldevOverviewSkeleton />}>
        <OverviewContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
