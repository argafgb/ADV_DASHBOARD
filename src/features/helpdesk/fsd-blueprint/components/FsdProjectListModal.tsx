"use client";

import { BlueprintStatus, FsdBlueprintItem } from "../types/fsdBlueprint";
import { formatTitleCase, STATUS_CONFIG } from "../utils/fsdCalculations";
import {
  X,
  FileText,
  CheckCircle2,
  Loader2,
  Clock,
  CircleDashed,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface FsdProjectListModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: BlueprintStatus | "all" | null;
  items: FsdBlueprintItem[];
  onApplyFilterToTable?: (status: BlueprintStatus | "all") => void;
}

export function FsdProjectListModal({
  isOpen,
  onClose,
  status,
  items,
  onApplyFilterToTable,
}: FsdProjectListModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !status) return null;

  const filteredItems =
    status === "all" ? items : items.filter((r) => r.status === status);

  const getStatusStyle = (st: BlueprintStatus | "all") => {
    switch (st) {
      case "Done":
        return {
          icon: CheckCircle2,
          tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
        };
      case "On Progress":
        return {
          icon: Loader2,
          tint: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
        };
      case "On Queue":
        return {
          icon: Clock,
          tint: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
        };
      case "Not Started":
        return {
          icon: CircleDashed,
          tint: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        };
      default:
        return {
          icon: FileText,
          tint: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
        };
    }
  };

  const statusStyle = getStatusStyle(status);
  const Icon = statusStyle.icon;
  const title =
    status === "all"
      ? "Semua Dokumen Blueprint"
      : `Blueprint · Status ${status}`;
  const subtitle = `${filteredItems.length} dokumen ${
    status === "all" ? "terdaftar" : `berstatus ${status}`
  }`;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-6">
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* MODAL DIALOG */}
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden dark:border-zinc-800 dark:bg-zinc-900 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-100 p-5 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                statusStyle.tint,
              )}
            >
              <Icon className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                {title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* MODAL BODY: DOCUMENT LIST */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              Tidak ada dokumen pada status ini.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const cfg =
                STATUS_CONFIG[item.status as BlueprintStatus] ||
                STATUS_CONFIG["Not Started"];
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-4 text-xs hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <span className="w-7 font-display text-[11px] text-zinc-400 shrink-0">
                    {idx + 1}
                  </span>

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {item.module}
                    </div>
                    <div
                      className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5"
                      title={item.scope}
                    >
                      {item.scope || "—"}
                    </div>
                  </div>

                  <span className="shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-bold text-[10.5px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {item.owner}
                  </span>

                  <span
                    className="w-28 shrink-0 truncate text-zinc-600 dark:text-zinc-400"
                    title={item.picIt}
                  >
                    {formatTitleCase(item.picIt) || "—"}
                  </span>

                  <span className="w-20 shrink-0 text-zinc-500 font-semibold text-[11px]">
                    {item.quartal}
                  </span>

                  <span
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                    style={{
                      backgroundColor: cfg.bg,
                      color: cfg.fg,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: cfg.fg }}
                    />
                    {item.status}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between border-t border-zinc-100 p-4 dark:border-zinc-800">
          <span className="text-xs text-zinc-400">
            Total {filteredItems.length} dokumen
          </span>

          <div className="flex items-center gap-2">
            {onApplyFilterToTable && (
              <button
                type="button"
                onClick={() => {
                  onApplyFilterToTable(status);
                  onClose();
                }}
                className="h-8 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
              >
                Terapkan ke Tabel
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
