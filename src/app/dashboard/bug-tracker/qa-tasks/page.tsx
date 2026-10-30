export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import QaTasksDashboardClient from "@/features/bug-tracker/qa-tasks/components/QaTasksDashboardClient";
import { BugTrackerQaTasksSkeleton } from "@/components/dashboard-route-skeletons";
import type { QaTask } from "@/features/bug-tracker/qa-tasks/types/qaTasksTypes";
import { getQaTasksData } from "@/features/bug-tracker/qa-tasks/services/qaTasksService";
import { normalizeMonthFilter, normalizeYear } from "@/lib/month-filter";

interface QaTasksPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}

async function QaTasksContainer({ searchParams }: QaTasksPageProps) {
  await connection();
  await requirePagePermission("menu.bug-tracker.qa-tasks.view");

  const resolvedParams = await searchParams;
  const year = normalizeYear(resolvedParams?.year);
  const month = normalizeMonthFilter(resolvedParams?.month, year);

  let tasks: QaTask[] = [];
  try {
    tasks = await getQaTasksData(year, month);
  } catch (err) {
    console.error("Error fetching QA tasks in page.tsx:", err);
  }

  return <QaTasksDashboardClient tasks={tasks} year={year} month={month} />;
}

export default async function QaTasksPage({ searchParams }: QaTasksPageProps) {
  return (
    <Suspense fallback={<BugTrackerQaTasksSkeleton />}>
      <QaTasksContainer searchParams={searchParams} />
    </Suspense>
  );
}
