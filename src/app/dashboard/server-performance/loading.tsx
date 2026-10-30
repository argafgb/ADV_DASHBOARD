import OverviewSkeleton from "@/features/server-performance/overview/skeletons/OverviewSkeleton";

export default function ServerPerformanceLoading() {
  return (
    <div className="w-full space-y-6 font-sans">
      <header>
        <div className="h-8 w-72 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="mt-2 h-4 w-96 rounded-md bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
      </header>
      <OverviewSkeleton />
    </div>
  );
}
