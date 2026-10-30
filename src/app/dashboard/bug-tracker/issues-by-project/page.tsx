export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import IssuesByProjectClient from "@/features/bug-tracker/issues-by-project/components/IssuesByProjectClient";
import { BugTrackerIssuesByProjectSkeleton } from "@/components/dashboard-route-skeletons";
import { getCachedIssuesByProjectData } from "@/features/bug-tracker/issues-by-project/services/issuesByProjectService";
import { normalizeMonthFilter, normalizeYear } from "@/lib/month-filter";

interface IssuesByProjectPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    project?: string;
    role?: string;
  }>;
}

async function IssuesByProjectContainer({
  searchParams,
}: IssuesByProjectPageProps) {
  await connection();
  await requirePagePermission("menu.bug-tracker.issues-project.view");

  const resolvedParams = await searchParams;
  const year = normalizeYear(resolvedParams?.year);
  const month = normalizeMonthFilter(resolvedParams?.month, year);
  const project = resolvedParams?.project || "ALL";
  const role = resolvedParams?.role || "ALL";

  let data;
  try {
    data = await getCachedIssuesByProjectData(year, month, project, role);
  } catch (err) {
    console.error("Error fetching issues by project data in page.tsx:", err);
  }

  return (
    <IssuesByProjectClient
      data={
        data ?? {
          items: [],
          prevItems: [],
          foundPerMonth: Array.from({ length: 12 }, () => 0),
          closedPerMonth: Array.from({ length: 12 }, () => 0),
          foundPerMonthPrev: null,
          closedPerMonthPrev: null,
          prevYear: null,
          periodLabel: "",
        }
      }
      year={year}
    />
  );
}

export default async function IssuesByProjectPage({
  searchParams,
}: IssuesByProjectPageProps) {
  return (
    <Suspense fallback={<BugTrackerIssuesByProjectSkeleton />}>
      <IssuesByProjectContainer searchParams={searchParams} />
    </Suspense>
  );
}
