import type { ReactNode } from "react";
import { LucideIcon, SearchX } from "lucide-react";
import { EmptyState as BaseEmptyState } from "@/components/shared/EmptyState";

/**
 * Standard Purpose-Driven Empty State Component utilizing the shared EmptyState.
 */
export function EmptyState({
  title = "Belum ada data",
  message,
  action,
  icon = SearchX,
  height = 200,
}: {
  title?: string;
  message?: string | null;
  action?: ReactNode;
  icon?: LucideIcon;
  height?: number | string;
}) {
  return (
    <BaseEmptyState
      icon={icon}
      title={title}
      description={message || undefined}
      action={action}
      height={height}
    />
  );
}

export default EmptyState;
