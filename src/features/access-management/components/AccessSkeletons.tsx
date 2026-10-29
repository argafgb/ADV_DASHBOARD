import * as React from "react";
import { Card } from "@/components/ui/card";

export function AccessUsersSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
      {/* Left List Skeleton */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="p-4 space-y-4 border-zinc-200 dark:border-zinc-800">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-md w-full" />
          <div className="flex gap-2">
            <div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded-md flex-1" />
            <div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded-md flex-1" />
          </div>
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-16 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-3"
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Right Editor Skeleton */}
      <div className="lg:col-span-8">
        <Card className="p-6 space-y-6 border-zinc-200 dark:border-zinc-800">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-md w-48" />
              <div className="h-4 bg-zinc-100 dark:bg-zinc-900 rounded-md w-32" />
            </div>
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-md w-24" />
          </div>
          <div className="h-24 bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
          <div className="h-40 bg-zinc-100 dark:bg-zinc-900 rounded-lg" />
        </Card>
      </div>
    </div>
  );
}

export function AccessRolesSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
      <div className="lg:col-span-5 space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 h-28 border-zinc-200 dark:border-zinc-800" />
        ))}
      </div>
      <div className="lg:col-span-7">
        <Card className="p-6 h-96 border-zinc-200 dark:border-zinc-800" />
      </div>
    </div>
  );
}

export function AccessAuditSkeleton() {
  return (
    <Card className="p-6 space-y-4 animate-pulse border-zinc-200 dark:border-zinc-800">
      <div className="h-9 bg-zinc-200 dark:bg-zinc-800 rounded-md w-full max-w-sm" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-900 rounded-md" />
        ))}
      </div>
    </Card>
  );
}
