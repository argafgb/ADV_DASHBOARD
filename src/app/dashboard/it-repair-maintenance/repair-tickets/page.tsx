export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import { ItrRepairTicketsSkeleton } from "@/features/it-repair-maintenance/components/skeletons";
import { RepairTicketsClient } from "@/features/it-repair-maintenance/components/repair-tickets/repair-tickets-client";
import { getRepairData } from "@/features/it-repair-maintenance/services/repairTicketsService";
import {
  parseRepairQuery,
  readItrFilters,
  type RawSearchParams,
} from "@/features/it-repair-maintenance/utils/filters";

interface PageProps {
  searchParams: Promise<RawSearchParams>;
}

async function RepairTicketsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = await readItrFilters(params);
  const query = parseRepairQuery(params);
  const data = await getRepairData(filters, query);
  return <RepairTicketsClient data={data} query={query} year={filters.year} />;
}

export default async function RepairTicketsPage({ searchParams }: PageProps) {
  await connection();
  await requirePagePermission("menu.it-repair-maintenance.repair-tickets.view");

  return (
    <div
      className="ir-page"
      style={{
        display: "grid",
        gap: "var(--grid-gap)",
        alignContent: "start",
      }}
    >
      <Suspense fallback={<ItrRepairTicketsSkeleton />}>
        <RepairTicketsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
