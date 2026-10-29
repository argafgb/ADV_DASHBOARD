export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import SlaPerformanceClient from "@/features/network-performance/sla-performance/components/SlaPerformanceClient";
import { NetworkPageSkeleton } from "@/components/network-page-skeleton";
import { getNetworkData } from "@/features/network-performance/queries";

async function SlaPerformanceSection() {
  const data = await getNetworkData();
  return <SlaPerformanceClient {...data} />;
}

export default async function SlaPerformancePage() {
  await connection();
  await requirePagePermission("menu.network-performance.sla-site.view");

  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          SLA by Site
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          SLA setiap cabang dibandingkan dengan target kinerja.
        </p>
      </header>

      <Suspense fallback={<NetworkPageSkeleton route="sla" />}>
        <SlaPerformanceSection />
      </Suspense>
    </div>
  );
}
