"use client";

import { useState } from "react";
import type {
  RootCauseItem,
  RootCauseChartMode,
} from "../types/rootCause.types";
import RootCauseBarChart from "./charts/RootCauseBarChart";
import RootCauseTreemapChart from "./charts/RootCauseTreemapChart";

import { formatNumber } from "../utils/rating-root-cause-utils";

interface TotalTicketByRootCauseSectionProps {
  data: RootCauseItem[];
  department: string;
  periodLabel?: string;
  deptLabel?: string;
  mode?: RootCauseChartMode;
  onModeChange?: (mode: RootCauseChartMode) => void;
}

export default function TotalTicketByRootCauseSection({
  data,
  department,
  periodLabel,
  deptLabel,
  mode: externalMode,
  onModeChange,
}: TotalTicketByRootCauseSectionProps) {
  const [internalMode, setInternalMode] = useState<RootCauseChartMode>("bar");
  const mode = externalMode ?? internalMode;

  const handleModeChange = (newMode: RootCauseChartMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  };

  const total = data.reduce((sum, item) => sum + item.tickets, 0);

  const displayPeriod = periodLabel || "Mar-Apr 2026";
  const displayDept = deptLabel || department;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Top 6 Ticket by Root Cause</h2>

          <p className="mt-1 text-sm text-slate-400">
            Periode: {displayPeriod} · {displayDept} · Total:{" "}
            {formatNumber(total)} tiket
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => handleModeChange("bar")}
            className={[
              "rounded-lg px-4 py-2 text-xs font-bold transition",
              mode === "bar"
                ? "bg-[#155dfc] text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100",
            ].join(" ")}
          >
            Bar List
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("treemap")}
            className={[
              "rounded-lg px-4 py-2 text-xs font-bold transition",
              mode === "treemap"
                ? "bg-[#155dfc] text-white shadow-sm"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100",
            ].join(" ")}
          >
            Treemap
          </button>
        </div>
      </div>

      <div className="relative pt-2">
        {mode === "bar" && <RootCauseBarChart data={data} />}
        {mode === "treemap" && <RootCauseTreemapChart data={data} />}
      </div>
    </section>
  );
}
