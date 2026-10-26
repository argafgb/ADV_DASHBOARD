import WarehouseStockClient from "@/features/asset-maintenance/warehouse-stock/components/WarehouseStockClient";
import { getWarehouseStockData } from "@/features/asset-maintenance/warehouse-stock/services/warehouseStockService";

export const instant = false;

export const metadata = {
  title: "Warehouse Stock | Asset IT & PM Dashboard",
  description: "Stok gudang Admin IT di AMPASIT dan COS Semarang",
};

export default async function WarehouseStockPage() {
  const data = await getWarehouseStockData();

  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            Modul: Asset Maintenance
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Warehouse Stock
        </h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Stok gudang Admin IT di AMPASIT dan COS Semarang
        </p>
      </header>
      <WarehouseStockClient initialData={data} />
    </div>
  );
}
