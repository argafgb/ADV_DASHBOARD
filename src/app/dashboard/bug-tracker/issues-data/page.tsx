export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import IssuesDataClient from "@/features/bug-tracker/issues-data/components/IssuesDataClient";
import { BugTrackerIssuesDataSkeleton } from "@/components/dashboard-route-skeletons";
import { getCachedIssuesData } from "@/features/bug-tracker/issues-data/services/issuesDataService";
import { normalizeMonthFilter, normalizeYear } from "@/lib/month-filter";

interface IssuesDataPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    project?: string;
    role?: string;
    q?: string;
  }>;
}

async function IssuesDataContainer({ searchParams }: IssuesDataPageProps) {
  await connection();
  await requirePagePermission("menu.bug-tracker.issues-data.view");

  const resolvedParams = await searchParams;
  const year = normalizeYear(resolvedParams?.year);
  const month = normalizeMonthFilter(resolvedParams?.month, year);
  const project = resolvedParams?.project || "ALL";
  const role = resolvedParams?.role || "ALL";

  let data;
  try {
    data = await getCachedIssuesData(year, month, project, role);
  } catch (err) {
    console.error("Error fetching issues data in page.tsx:", err);
  }

  return (
    <IssuesDataClient
      data={
        data ?? { items: [], prevItems: [], prevYear: null, periodLabel: "" }
      }
      year={year}
    />
  );
}

export default async function IssuesDataPage({
  searchParams,
}: IssuesDataPageProps) {
  return (
    <Suspense fallback={<BugTrackerIssuesDataSkeleton />}>
      <IssuesDataContainer searchParams={searchParams} />
    </Suspense>
  );
}
