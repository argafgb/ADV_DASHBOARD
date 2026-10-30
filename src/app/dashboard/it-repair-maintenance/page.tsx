export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import { ItrOverviewSkeleton } from "@/features/it-repair-maintenance/components/skeletons";
import { OverviewClient } from "@/features/it-repair-maintenance/components/overview/overview-client";
import { getOverviewData } from "@/features/it-repair-maintenance/services/overviewService";
import {
  parseOverviewQuery,
  readItrFilters,
  type RawSearchParams,
} from "@/features/it-repair-maintenance/utils/filters";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

async function OverviewContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = await readItrFilters(params);
  const { seg, modal } = parseOverviewQuery(params);
  const data = await getOverviewData(filters, seg, modal);
  return <OverviewClient data={data} />;
}

export default async function OverviewPage({ searchParams }: PageProps) {
  await connection();
  await requirePagePermission("menu.it-repair-maintenance.overview.view");

  return (
    <div
      className="ir-page"
      style={{
        display: "grid",
        gap: "var(--grid-gap)",
        alignContent: "start",
      }}
    >
      <Suspense fallback={<ItrOverviewSkeleton />}>
        <OverviewContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
