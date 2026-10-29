export const instant = false;
import { Suspense } from "react";
import { connection } from "next/server";
import { requirePagePermission } from "@/lib/access/session";
import { AssetInfrastructureClient } from "@/features/network-performance/asset-infrastructure/components/AssetInfrastructureClient";
import { AssetInfrastructureSkeleton } from "@/features/network-performance/asset-infrastructure/components/skeletons/AssetInfrastructureSkeleton";
import { getAssetInfrastructureData } from "@/features/network-performance/asset-infrastructure/services/assetInfrastructureService";
import { getRequestBranchAccess } from "@/lib/network/branch-access";

async function AssetInfrastructureSection() {
  const data = await getAssetInfrastructureData(await getRequestBranchAccess());
  return <AssetInfrastructureClient initialData={data} />;
}

export default async function AssetInfrastructurePage() {
  await connection();
  await requirePagePermission(
    "menu.network-performance.asset-infrastructure.view",
  );

  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
          Aset Infrastruktur
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          Penambahan dan pergantian perangkat Router, Switch, dan Access Point ·
          5 Jan - 31 Agu 2026
        </p>
      </header>

      <Suspense fallback={<AssetInfrastructureSkeleton />}>
        <AssetInfrastructureSection />
      </Suspense>
    </div>
  );
}
