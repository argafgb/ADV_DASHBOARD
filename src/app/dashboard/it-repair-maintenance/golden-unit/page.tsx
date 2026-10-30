export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import { ItrGoldenUnitSkeleton } from "@/features/it-repair-maintenance/components/skeletons";
import { GoldenUnitClient } from "@/features/it-repair-maintenance/components/golden-unit/golden-unit-client";
import { getGoldenData } from "@/features/it-repair-maintenance/services/goldenUnitService";
import {
  parseGoldenQuery,
  readItrFilters,
  type RawSearchParams,
} from "@/features/it-repair-maintenance/utils/filters";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

async function GoldenUnitContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = await readItrFilters(params);
  const query = parseGoldenQuery(params);
  const data = await getGoldenData(filters, query);
  return <GoldenUnitClient data={data} query={query} />;
}

export default async function GoldenUnitPage({ searchParams }: PageProps) {
  await connection();
  await requirePagePermission("menu.it-repair-maintenance.golden-unit.view");

  return (
    <div
      className="ir-page"
      style={{
        display: "grid",
        gap: "var(--grid-gap)",
        alignContent: "start",
      }}
    >
      <Suspense fallback={<ItrGoldenUnitSkeleton />}>
        <GoldenUnitContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
