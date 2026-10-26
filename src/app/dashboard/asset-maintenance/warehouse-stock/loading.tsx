import { WarehouseStockSkeleton } from "@/features/asset-maintenance/warehouse-stock/components/skeletons/WarehouseStockSkeletons";

export default function WarehouseStockLoading() {
  return (
    <div className="w-full space-y-6 font-sans" role="status" aria-label="Memuat Warehouse Stock">
      <header>
        <div className="h-7 w-64 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-2 h-3 w-96 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </header>
      <WarehouseStockSkeleton />
    </div>
  );
}
