"use client";

import StatusBadge from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

// Pengganti DashboardHelpdeskDesignSystem.SeverityBadge (implementasi
// eksternal tidak tersedia di bundle) — keputusan user: pakai StatusBadge
// template dengan mapping severity ke variant.
const VARIANT: Record<string, string> = {
  critical: "error",
  high: "warning",
  medium: "default",
  low: "default",
};

export default function SeverityBadge({
  level,
  className,
}: {
  level: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex w-[72px] justify-center text-center", className)}>
      <StatusBadge
        spec={{ variant: VARIANT[level] ?? "default", label: level }}
        uppercase
      />
    </span>
  );
}
