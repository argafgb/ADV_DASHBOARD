export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import IspBandwidthClient from "@/features/network-performance/isp-bandwidth/components/IspBandwidthClient";
import { NetworkPageSkeleton } from "@/components/network-page-skeleton";
import { getNetworkData } from "@/features/network-performance/queries";

async function IspBandwidthSection() {
  const data = await getNetworkData();
  return <IspBandwidthClient {...data} />;
}

export default async function IspBandwidthPage() {
  await connection();
  await requirePagePermission("menu.network-performance.isp-bandwidth.view");

  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          ISP &amp; bandwidth
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          Kontrak vendor &amp; utilisasi bandwidth.
        </p>
      </header>

      <Suspense fallback={<NetworkPageSkeleton route="isp" />}>
        <IspBandwidthSection />
      </Suspense>
    </div>
  );
}
