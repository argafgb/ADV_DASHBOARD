"use client";

import { useMemo, useState } from "react";
import { useFilters } from "@/context/HelpdeskFilterContext";
import type { LeaderboardData } from "../services/leaderboardService";
import { getLeaderboardMonthLabel } from "../utils/leaderboard-utils";

// Import sliced sub-components
import EmployeeOfMonthCard from "./EmployeeOfMonthCard";
import ProductivityCard from "./ProductivityCard";
import AbsenceCard from "./AbsenceCard";
import LowRatingCard from "./LowRatingCard";
import OverSlaCard from "./OverSlaCard";
import DetailTicketsModal from "./DetailTicketsModal";

export default function LeaderboardDashboardClient({
  initialData,
}: {
  initialData: LeaderboardData;
}) {
  const { year, month, dept, setDept } = useFilters();

  // Modal drill-down state for OverSLA
  const [selectedOverSla, setSelectedOverSla] = useState<{
    name: string;
    type: "RESPONSE" | "RESOLVED";
    ticketList: string[];
  } | null>(null);

  // Determine current active department tab view (defaulting to ALL)
  const activeDept = dept || "ALL";

  // Month label mapping
  const currentMonthLabel = useMemo(() => {
    if (month !== "ALL") {
      return getLeaderboardMonthLabel(month);
    }
    return (
      initialData.monthLabel ||
      getLeaderboardMonthLabel(month, initialData.targetMonth)
    );
  }, [month, initialData.monthLabel, initialData.targetMonth]);

  // Handle Employee Of The Month based on active filter
  const employeesToDisplay = useMemo(() => {
    if (activeDept === "ALL") {
      return initialData.employeeOfMonth || {};
    }
    return {
      [activeDept]: initialData.employeeOfMonth?.[activeDept],
    } as Record<string, { name: string; code: string; badge: string }>;
  }, [activeDept, initialData.employeeOfMonth]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white font-display">
            Leaderboard
          </h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Kinerja Karyawan & Wawasan Layanan · {currentMonthLabel} {year}
          </p>
        </div>

        {/* <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
        >
          <Download size={13} />
          Export
        </button> */}
      </div>

      {/* Department Tabs (including ALL) */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-6 overflow-x-auto">
          {(
            [
              { v: "ALL", t: "All Departments" },
              { v: "IT Support", t: "IT Support" },
              { v: "DCT Support", t: "DCT Support" },
            ] as const
          ).map((item) => (
            <button
              key={item.v}
              type="button"
              onClick={() => setDept(item.v)}
              className={[
                "shrink-0 whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-bold transition cursor-pointer",
                activeDept === item.v
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400",
              ].join(" ")}
            >
              {item.t}
            </button>
          ))}
        </div>
      </div>

      {/* Employee of the Month section */}
      <EmployeeOfMonthCard
        currentMonthLabel={currentMonthLabel}
        year={year}
        employees={employeesToDisplay}
      />

      {/* Grid panels */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Productivity Rankings Card */}
        <ProductivityCard productivity={initialData.productivity} />

        {/* Absensi Card */}
        <AbsenceCard absences={initialData.absences} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Low Ratings Card */}
        <LowRatingCard lowRatings={initialData.lowRatings} />

        {/* OverSLA Card with drill-down modal support */}
        <OverSlaCard
          overSla={initialData.overSla}
          onSelectDispatcher={(name, type, ticketList) =>
            setSelectedOverSla({ name, type, ticketList })
          }
        />
      </div>

      {/* OverSLA Detail tickets modal */}
      {selectedOverSla && (
        <DetailTicketsModal
          name={selectedOverSla.name}
          type={selectedOverSla.type}
          ticketList={selectedOverSla.ticketList}
          onClose={() => setSelectedOverSla(null)}
        />
      )}
    </div>
  );
}
