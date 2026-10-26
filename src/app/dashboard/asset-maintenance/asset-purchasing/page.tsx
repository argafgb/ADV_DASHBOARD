import AssetPurchasingClient from "@/features/asset-maintenance/asset-purchasing/components/AssetPurchasingClient";
import { getAssetPurchasingData } from "@/features/asset-maintenance/asset-purchasing/services/assetPurchasingService";
import {
  getAssetWarrantyData,
  getInvalidWarrantyAssetsData,
} from "@/features/asset-maintenance/asset-purchasing/services/assetWarrantyService";
import type { AssetPurchasingData } from "@/features/asset-maintenance/asset-purchasing/types";
import type { DashboardSearchParams } from "@/lib/global-filters";
import { scopedAssetFilterInput } from "@/lib/auth/current-site-filter";

export const instant = false;

const EMPTY_PURCHASING_DATA: AssetPurchasingData = {
  items: [],
  months: [],
  syncedAt: null,
};

export default async function AssetPurchasingPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const input = await scopedAssetFilterInput(await searchParams);
  let purchasingData = EMPTY_PURCHASING_DATA;
  let error: string | undefined;

  try {
    purchasingData = await getAssetPurchasingData(input);
  } catch (cause) {
    console.error("[Asset Purchasing] Failed to load PostgreSQL data", cause);
    error =
      "Data pengadaan belum dapat dimuat. Coba kembali setelah koneksi database tersedia.";
  }

  const [warrantyData, invalidWarrantySummary] = await Promise.all([
    getAssetWarrantyData(input).catch((cause) => {
      console.error("[Asset Warranty] Failed to load warranty data", cause);
      return undefined;
    }),
    getInvalidWarrantyAssetsData(input).catch((cause) => {
      console.error(
        "[Asset Warranty] Failed to load invalid warranty data",
        cause,
      );
      return undefined;
    }),
  ]);

  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            Modul: Asset Maintenance
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Asset Purchasing
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          Ringkasan pengadaan aset IT dan status masa garansi armada workstation dari PostgreSQL
        </p>
      </header>
      <AssetPurchasingClient
        data={purchasingData}
        warrantyData={warrantyData}
        invalidWarrantySummary={invalidWarrantySummary}
        error={error}
      />
    </div>
  );
}
