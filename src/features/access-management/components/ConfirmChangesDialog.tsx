"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import type { AuditRowDraft } from "@/lib/access/access-diff";
import { AlertCircle, CheckCircle2, MinusCircle, RefreshCw, X } from "lucide-react";
import { formatDiffItemToHuman } from "../utils/access-format";

interface ConfirmChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  diffs: AuditRowDraft[];
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

const emptySubscribe = () => () => {};
function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ConfirmChangesDialog({
  open,
  onOpenChange,
  title = "Simpan Perubahan Akses?",
  description,
  diffs,
  onConfirm,
  isLoading = false,
}: ConfirmChangesDialogProps) {
  const mounted = useMounted();

  const formattedDiffs = React.useMemo(() => {
    return diffs.map((d) => formatDiffItemToHuman(d));
  }, [diffs]);

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isLoading, onOpenChange]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      onClick={() => {
        if (!isLoading) onOpenChange(false);
      }}
      className="fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-lg max-h-[90vh] flex-col overflow-hidden rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl animate-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden disabled:pointer-events-none text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Tutup</span>
        </button>

        <div className="shrink-0 pb-2">
          <h2 className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-100">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
            {title}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1 leading-relaxed">
            {description ||
              "Pastikan rincian perubahan di bawah ini sudah sesuai sebelum menyimpan ke sistem."}
          </p>
        </div>

        {formattedDiffs.length > 0 && (
          <div className="flex-1 min-h-0 overflow-y-auto py-2 space-y-2 pr-1">
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              Rincian Perubahan ({formattedDiffs.length}):
            </div>
            <div className="space-y-2">
              {formattedDiffs.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${
                    item.tone === "green"
                      ? "bg-emerald-50/60 border-emerald-200/80 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-200"
                      : item.tone === "red"
                        ? "bg-rose-50/60 border-rose-200/80 text-rose-950 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-200"
                        : item.tone === "blue"
                          ? "bg-blue-50/60 border-blue-200/80 text-blue-950 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-200"
                          : "bg-zinc-50 border-zinc-200 text-zinc-800 dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {item.tone === "green" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                    {item.tone === "red" && (
                      <MinusCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    )}
                    {item.tone === "blue" && (
                      <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                    {item.tone === "zinc" && (
                      <AlertCircle className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs leading-snug">
                      {item.actionTitle}
                    </div>
                    <div className="text-[11px] opacity-90 mt-0.5 leading-normal break-words">
                      {item.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="shrink-0 gap-2 sm:gap-2 flex flex-col-reverse sm:flex-row sm:justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
