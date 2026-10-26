"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error Boundary Debug]", error);
  }, [error]);

  return (
    <div className="p-6 bg-red-50 text-red-900 rounded-xl border border-red-200 tabular-nums text-sm space-y-4 m-6">
      <div className="flex items-center justify-between border-b border-red-200 pb-3">
        <h2 className="text-lg font-bold text-red-700 font-sans">
          Detail Kesalahan Dashboard
        </h2>
        <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
          Kode: {error.digest || "-"}
        </span>
      </div>

      <div>
        <span className="font-bold block text-red-800 mb-1">
          Pesan kesalahan:
        </span>
        <div className="p-3 bg-red-100/80 rounded border border-red-300 font-semibold text-red-950">
          {error.message || "Tidak ada detail kesalahan yang tersedia."}
        </div>
      </div>

      <div>
        <span className="font-bold block text-red-800 mb-1">
          Detail teknis:
        </span>
        <pre className="p-3 bg-red-900 text-red-50 rounded text-xs overflow-auto max-h-96 whitespace-pre-wrap leading-relaxed">
          {error.stack || "Detail teknis tidak tersedia."}
        </pre>
      </div>

      <div className="pt-2">
        <button
          onClick={() => reset()}
          type="button"
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-sans text-xs font-semibold tracking-wide transition-colors"
        >
          Muat Ulang
        </button>
      </div>
    </div>
  );
}
