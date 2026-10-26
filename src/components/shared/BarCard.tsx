"use client";

import { ReactNode } from "react";
import { LucideIcon, Building2 } from "lucide-react";
import ChartCard from "@/components/shared/ChartCard";
import BarList from "@/components/shared/BarList";
import EmptyState from "@/components/shared/EmptyState";
import type { BarDatum } from "@/types/asset-pm.types";

interface BarCardProps {
  title: string;
  subtitle?: string;
  items: BarDatum[];
  valueFormatter?: (value: number) => string;
  color?: string;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
}

/** ChartCard composing a ranked horizontal bar list with purpose-driven EmptyState. */
export default function BarCard({
  title,
  subtitle,
  items,
  valueFormatter,
  color,
  action,
  className,
  contentClassName,
  emptyIcon = Building2,
  emptyTitle = "Tidak Ada Data Cabang/Lokasi",
  emptyDescription = "Belum ada temuan atau data yang tercatat pada kombinasi filter ini.",
}: BarCardProps) {
  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      action={action}
      className={className}
      contentClassName={contentClassName}
    >
      {!items || items.length === 0 ? (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          height={200}
        />
      ) : (
        <BarList items={items} valueFormatter={valueFormatter} color={color} />
      )}
    </ChartCard>
  );
}
