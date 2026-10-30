export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import BugHunterDashboardClient from "@/features/bug-tracker/bug-hunter/components/BugHunterDashboardClient";
import { BugTrackerBugHunterSkeleton } from "@/components/dashboard-route-skeletons";
import type { BugFinding } from "@/features/bug-tracker/bug-hunter/types/bugHunterTypes";
import { getBugHunterFindingsData } from "@/features/bug-tracker/bug-hunter/services/bugHunterService";
import { normalizeMonthFilter, normalizeYear } from "@/lib/month-filter";

interface BugHunterPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}

async function BugHunterContainer({ searchParams }: BugHunterPageProps) {
  await connection();
  await requirePagePermission("menu.bug-tracker.bug-hunter.view");

  const resolvedParams = await searchParams;
  const year = normalizeYear(resolvedParams?.year);
  const month = normalizeMonthFilter(resolvedParams?.month, year);

  let findings: BugFinding[] = [];
  try {
    findings = await getBugHunterFindingsData(year, month);
  } catch (err) {
    console.error("Error fetching Bug Hunter findings in page.tsx:", err);
  }

  return (
    <BugHunterDashboardClient findings={findings} year={year} month={month} />
  );
}

export default async function BugHunterPage({
  searchParams,
}: BugHunterPageProps) {
  return (
    <Suspense fallback={<BugTrackerBugHunterSkeleton />}>
      <BugHunterContainer searchParams={searchParams} />
    </Suspense>
  );
}
