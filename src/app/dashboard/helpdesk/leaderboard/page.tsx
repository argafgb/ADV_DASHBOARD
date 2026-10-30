export const instant = false;

import { connection } from "next/server";
import { getDashboardFilters } from "@/lib/helpdesk/dashboard-filters";
import { Suspense } from "react";
import { requirePagePermission } from "@/lib/access/session";
import { getLeaderboardData } from "@/features/helpdesk/leaderboard/services/leaderboardService";
import LeaderboardDashboardClient from "@/features/helpdesk/leaderboard/components/LeaderboardDashboardClient";
import { HelpdeskLeaderboardSkeleton } from "@/components/dashboard-route-skeletons";

interface PageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    dept?: string;
  }>;
}

async function LeaderboardContainer({ searchParams }: PageProps) {
  await connection();
  const access = await requirePagePermission("menu.helpdesk.leaderboard.view");
  const params = await searchParams;
  const filters = getDashboardFilters(params);

  const data = await getLeaderboardData(
    Number(filters.year),
    filters.month,
    filters.dept,
    access.scope,
  );

  return <LeaderboardDashboardClient initialData={data} />;
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  await connection();
  return (
    <Suspense fallback={<HelpdeskLeaderboardSkeleton />}>
      <LeaderboardContainer searchParams={searchParams} />
    </Suspense>
  );
}
