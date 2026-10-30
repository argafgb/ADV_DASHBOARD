export const instant = false;

import { connection } from "next/server";
import { getTicketRatingData } from "@/features/helpdesk/rating-root-cause/services/ticketRatingService";
import { getDashboardFilters } from "@/lib/helpdesk/dashboard-filters";
import { Suspense } from "react";
import { requirePagePermission } from "@/lib/access/session";
import RatingRootCauseDashboardClient from "@/features/helpdesk/rating-root-cause/components/RatingRootCauseDashboardClient";
import {
  getTopRootCauses,
  getActionITDistribution,
} from "@/features/helpdesk/rating-root-cause/services/rootCauseService";
import { HelpdeskRatingRootCauseSkeleton } from "@/components/dashboard-route-skeletons";

interface PageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    dept?: string;
    quarter?: string;
  }>;
}

async function RatingRootCauseContainer({ searchParams }: PageProps) {
  await connection();
  const access = await requirePagePermission(
    "menu.helpdesk.rating-root-cause.view",
  );
  const params = await searchParams;
  const { year, month, dept, quarter } = getDashboardFilters(params);

  // Ambil data untuk satu departemen yang terpilih (ALL, DCT Support, atau IT Support)
  const [rootCauses, actionITData, ratings] = await Promise.all([
    getTopRootCauses({ year, month, dept, quarter }, access.scope),
    getActionITDistribution({ year, month, dept, quarter }, access.scope),
    getTicketRatingData({ year, month, dept, quarter }, access.scope),
  ]);

  return (
    <RatingRootCauseDashboardClient
      ratings={ratings}
      rootCausesReal={rootCauses}
      actionITReal={actionITData}
    />
  );
}

export default async function RatingRootCausePage({ searchParams }: PageProps) {
  await connection();
  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          Ticketing & Root Cause
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          Analisis penyebab utama masalah dan evaluasi kepuasan pengguna
          terhadap tiket helpdesk.
        </p>
      </header>

      <Suspense fallback={<HelpdeskRatingRootCauseSkeleton />}>
        <RatingRootCauseContainer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
