export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import DowntimeIncidentsClient from "@/features/network-performance/downtime-incidents/components/DowntimeIncidentsClient";
import { NetworkPageSkeleton } from "@/components/network-page-skeleton";
import { getNetworkData } from "@/features/network-performance/queries";

async function DowntimeIncidentsSection() {
  const data = await getNetworkData();
  return <DowntimeIncidentsClient {...data} />;
}

export default async function DowntimeIncidentsPage() {
  await connection();
  await requirePagePermission("menu.network-performance.downtime.view");

  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          Downtime Under SLA
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          Insiden jaringan di bawah target SLA.
        </p>
      </header>

      <Suspense fallback={<NetworkPageSkeleton route="downtime" />}>
        <DowntimeIncidentsSection />
      </Suspense>
    </div>
  );
}
