export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import OverviewDashboardClient from "@/features/network-performance/overview/components/OverviewDashboardClient";
import { NetworkPageSkeleton } from "@/components/network-page-skeleton";
import { getNetworkData } from "@/features/network-performance/queries";

async function OverviewSection() {
  const data = await getNetworkData();
  return <OverviewDashboardClient {...data} />;
}

export default async function OverviewPage() {
  await connection();
  await requirePagePermission("menu.network-performance.overview.view");

  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          Overview
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          Ringkasan performa jaringan.
        </p>
      </header>

      <Suspense fallback={<NetworkPageSkeleton route="overview" />}>
        <OverviewSection />
      </Suspense>
    </div>
  );
}
