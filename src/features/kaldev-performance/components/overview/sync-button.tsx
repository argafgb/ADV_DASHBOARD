"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Check } from "lucide-react";

export function SyncButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSynced(false);

    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setSynced(true);
        router.refresh();
        setTimeout(() => setSynced(false), 3000);
      }
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={syncing}
      title="Sinkronkan data terbaru & refresh cache"
      className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border font-sans text-xs font-semibold transition-all shadow-xs cursor-pointer ${
        synced
          ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
          : syncing
            ? "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:border-zinc-700"
            : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }`}
    >
      {synced ? (
        <>
          <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Tersinkronisasi</span>
        </>
      ) : (
        <>
          <RefreshCw
            size={13}
            className={`shrink-0 ${syncing ? "animate-spin text-blue-600 dark:text-blue-400" : "text-zinc-500"}`}
          />
          <span>{syncing ? "Menyinkronkan..." : "Sync Data"}</span>
        </>
      )}
    </button>
  );
}
