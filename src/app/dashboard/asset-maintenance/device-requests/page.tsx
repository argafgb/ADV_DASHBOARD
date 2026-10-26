import DeviceRequestsClient from "@/features/asset-maintenance/device-requests/components/DeviceRequestsClient";
import { getDeviceRequestsData } from "@/features/asset-maintenance/device-requests/services/deviceRequestsService";
import type { DashboardSearchParams } from "@/lib/global-filters";
import { scopedAssetFilterInput } from "@/lib/auth/current-site-filter";

export const instant = false;

export default async function DeviceRequestsPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const input = await scopedAssetFilterInput(await searchParams);
  const data = await getDeviceRequestsData(input);

  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            Modul: Asset Maintenance
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Device Requests
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          Jadwal &amp; permintaan pemenuhan perangkat IT per cabang / unit
        </p>
      </header>
      <DeviceRequestsClient data={data} />
    </div>
  );
}
