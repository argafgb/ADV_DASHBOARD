"use client";

import { OverviewDashboardSkeleton } from "@/features/asset-maintenance/overview/components/skeletons/OverviewSkeletons";

export default function DashboardLoading() {
  return (
    <div
      className="w-full min-w-0 space-y-6 font-sans"
      role="status"
      aria-label="Memuat dashboard"
    >
      <OverviewDashboardSkeleton />
    </div>
  );
}
