import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function EmailPerformanceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-7 w-56 rounded-md bg-muted" />
        <div className="h-4 w-full max-w-96 rounded-md bg-muted/60" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card border-border/60">
            <CardContent className="p-5">
              <div className="h-4 w-24 rounded bg-muted mb-4" />
              <div className="h-8 w-16 rounded bg-muted mb-2" />
              <div className="h-3 w-32 rounded bg-muted/60" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Skeleton */}
      <Card className="bg-card border-border/60">
        <CardHeader className="pb-2">
          <div className="h-5 w-48 rounded bg-muted mb-1" />
          <div className="h-3 w-64 rounded bg-muted/60" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-75 w-full rounded-lg bg-muted/40" />
        </CardContent>
      </Card>
    </div>
  );
}
