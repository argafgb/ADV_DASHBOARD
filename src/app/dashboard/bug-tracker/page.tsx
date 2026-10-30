export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import OverviewDashboardClient from "@/features/bug-tracker/overview/components/OverviewDashboardClient";
import { BugTrackerOverviewSkeleton } from "@/components/dashboard-route-skeletons";
import { getOverviewDashboardData } from "@/features/bug-tracker/overview/services/overviewService";
import {
  MatrixRole,
  MatrixType,
} from "@/features/bug-tracker/overview/types/overviewTypes";
import { normalizeMonthFilter, normalizeYear } from "@/lib/month-filter";

interface OverviewPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
    project?: string;
    role?: string;
    mtRole?: string;
    mtType?: string;
  }>;
}

async function OverviewContainer({ searchParams }: OverviewPageProps) {
  await connection();
  await requirePagePermission("menu.bug-tracker.overview.view");

  const resolvedParams = await searchParams;
  const year = normalizeYear(resolvedParams?.year);
  const month = normalizeMonthFilter(resolvedParams?.month, year);
  const project = resolvedParams?.project || "ALL";
  const role = resolvedParams?.role || "ALL";
  const mtRoleParam = resolvedParams?.mtRole;
  const mtRole: MatrixRole =
    mtRoleParam === "PIC Project" || mtRoleParam === "Bizdev"
      ? mtRoleParam
      : "Developer";
  const mtType: MatrixType = resolvedParams?.mtType === "CR" ? "CR" : "Bug";

  let data;
  try {
    data = await getOverviewDashboardData(
      year,
      month,
      project,
      role,
      mtRole,
      mtType,
    );
  } catch (err) {
    console.error("Error fetching overview dashboard data in page.tsx:", err);
  }

  return (
    <>
      {data ? (
        <OverviewDashboardClient data={data} year={year} month={month} />
      ) : (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          Gagal memuat data dashboard. Pastikan koneksi database tersedia.
        </div>
      )}
    </>
  );
}

export default async function OverviewPage({
  searchParams,
}: OverviewPageProps) {
  return (
    <div className="w-full space-y-6 font-sans">
      <Suspense fallback={<BugTrackerOverviewSkeleton />}>
        <OverviewContainer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
