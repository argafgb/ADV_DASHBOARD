import { ComparisonPageSkeleton } from "@/features/asset-maintenance/comparison/components/skeletons/ComparisonSkeletons";

export default function ComparisonLoading() {
  return (
    <div
      className="w-full space-y-6 font-sans"
      role="status"
      aria-label="Memuat Comparison"
    >
      <header>
        <div className="h-7 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-2 h-3 w-96 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </header>
      <ComparisonPageSkeleton />
    </div>
  );
}
