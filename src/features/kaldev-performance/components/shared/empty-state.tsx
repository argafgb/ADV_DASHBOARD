import type { CSSProperties } from "react";
import { FolderX, SearchX, type LucideIcon } from "lucide-react";
import { EmptyState as SharedEmptyState } from "@/components/shared/EmptyState";

/** Reusable Empty State adhering to Section 8 of AGENTS.md */
export function EmptyState({
  title,
  message,
  icon: Icon = FolderX,
  style,
  height = "180px",
}: {
  title: string;
  message?: string;
  icon?: LucideIcon;
  style?: CSSProperties;
  height?: number | string;
}) {
  return (
    <div style={style} className="w-full">
      <SharedEmptyState
        icon={Icon}
        title={title}
        description={message}
        height={height}
      />
    </div>
  );
}

/** Keadaan kosong di dalam tabel (`emptyNode` pada desain). */
export function TableEmpty({
  message,
  title = "Tidak ada data untuk periode ini",
}: {
  message: string;
  title?: string;
}) {
  return (
    <div className="py-8">
      <SharedEmptyState
        icon={SearchX}
        title={title}
        description={message}
        height="180px"
      />
    </div>
  );
}
