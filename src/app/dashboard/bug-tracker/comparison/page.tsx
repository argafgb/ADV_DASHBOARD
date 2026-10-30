export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import ComparisonDashboard from "@/features/bug-tracker/comparison/components/ComparisonDashboard";
import { BugTrackerOverviewSkeleton } from "@/components/dashboard-route-skeletons";
import { getCachedRow1Data } from "@/features/bug-tracker/overview/services/overviewService";
import { getCachedIssuesData } from "@/features/bug-tracker/issues-data/services/issuesDataService";
import { normalizeMonthFilter, normalizeYear } from "@/lib/month-filter";

interface ComparisonPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    project?: string;
    role?: string;
  }>;
}

async function ComparisonContainer({ searchParams }: ComparisonPageProps) {
  await connection();
  await requirePagePermission("menu.bug-tracker.comparison.view");

  const params = await searchParams;
  const year = normalizeYear(params.year);
  const month = normalizeMonthFilter(params.month, year);
  const project = params.project || "ALL";
  const role = params.role || "ALL";
  const [data, issues] = await Promise.all([
    getCachedRow1Data(year, month, project, role),
    getCachedIssuesData(year, month, project, role),
  ]);

  return (
    <ComparisonDashboard
      currentItems={issues.items}
      previousItems={issues.prevItems}
      currentYear={Number(year)}
      previousYear={issues.prevYear}
      metrics={[
        {
          key: "findings",
          label: "Total findings",
          description: "Seluruh bug dan change request yang tercatat.",
          yoy: data.findingsYoY,
          lowerIsBetter: false,
        },
        {
          key: "bug",
          label: "Total bug",
          description: "Perubahan jumlah cacat sistem antar tahun.",
          yoy: data.bugYoY,
          lowerIsBetter: true,
        },
        {
          key: "cr",
          label: "Change request",
          description: "Perubahan volume permintaan pengembangan.",
          yoy: data.crYoY,
          lowerIsBetter: true,
        },
        {
          key: "penalty",
          label: "Penalty score",
          description: "Perubahan akumulasi bobot risiko severity.",
          yoy: data.penaltyYoY,
          lowerIsBetter: true,
        },
      ]}
    />
  );
}

export default async function ComparisonPage({
  searchParams,
}: ComparisonPageProps) {
  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          Comparison
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          Perbandingan kinerja tahun aktif dengan tahun sebelumnya.
        </p>
      </header>

      <Suspense fallback={<BugTrackerOverviewSkeleton />}>
        <ComparisonContainer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
