const Block = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800 ${className}`} />
);

export function AssetPurchasingSkeleton() {
  return (
    <div className="space-y-4">
      <Block className="h-9 w-80 max-w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Block key={index} className="h-28" />)}
      </div>
      <Block className="h-96" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Block className="h-96" /><Block className="h-96" />
      </div>
      <Block className="h-96" />
      {/* Warranty Section Skeleton */}
      <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800 space-y-4">
        <Block className="h-7 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <Block key={index} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Block className="h-80 lg:col-span-7" />
          <Block className="h-80 lg:col-span-5" />
        </div>
        <Block className="h-96" />
      </div>
    </div>
  );
}
