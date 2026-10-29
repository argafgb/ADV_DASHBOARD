"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useFilters } from "@/context/HelpdeskFilterContext";
import { useQuarterFilter } from "../hooks/useQuarterFilter";

import TicketFrequencyChart from "./charts/TicketFrequencyChart";
import TicketVolumeChart from "./charts/TicketVolumeChart";
import TicketProblemCategoryChart from "./charts/TicketProblemCategoryChart";
import FrequencySummaryTable from "./charts/FrequencySummaryTable";

import type {
  TicketFrequency,
  TicketMonthlyComparison,
  TicketVolumeByDepartment,
  TicketVolumeByCategory,
  MonthlyCategoryComparison,
  MonthlyAppMenuComparison,
} from "../types/comparison.types";

interface ComparisonDashboardClientProps {
  ticketFrequency: TicketFrequency[];
  monthlyTrend: TicketMonthlyComparison[];
  departmentVolume: TicketVolumeByDepartment[];
  ticketsByCategory: TicketVolumeByCategory[];
  summaryPerProblem: MonthlyCategoryComparison[];
  summaryPerAppMenu: MonthlyAppMenuComparison[];
}

export default function ComparisonDashboardClient({
  ticketFrequency,
  monthlyTrend,
  departmentVolume,
  ticketsByCategory,
  summaryPerProblem,
  summaryPerAppMenu,
}: ComparisonDashboardClientProps) {
  const { year, dept, month } = useFilters();
  const { quarter, setQuarter } = useQuarterFilter();
  const [activeTab, setActiveTab] = useState<
    "frequency" | "perProblem" | "appMenu"
  >("frequency");

  const deptLabel = dept === "ALL" ? "Semua Departemen" : dept;

  return (
    <div className="space-y-5">
      {/* FILTER */}
      <div className="rounded-xl border bg-white p-4 space-y-4">
        {/* QUARTER */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Pilih Quartal:</span>
          {["ALL", "Q1", "Q2", "Q3", "Q4"].map((q) => (
            <button
              key={q}
              onClick={() => setQuarter(q)}
              className={`
                px-3
                py-1.5
                rounded-lg
                border
                text-sm
                font-medium
                transition-colors
                ${quarter === q ? "bg-blue-600 text-white border-blue-600" : "hover:bg-muted cursor-pointer bg-white text-zinc-700"}
              `}
            >
              {q === "ALL" ? "All" : q}
            </button>
          ))}
        </div>
      </div>

      {/* STATUS */}
      <div className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold">
        <Check className="h-4 w-4" />
        Menampilkan: {deptLabel} · Kuartal{" "}
        {quarter === "ALL" ? "Semua" : quarter}
      </div>

      {/* CONTENT */}
      <div className="space-y-6">
        <TicketFrequencyChart
          frequencyData={ticketFrequency}
          monthlyData={monthlyTrend}
          selectedYear={Number(year)}
        />
        <div className="grid grid-cols-1 gap-6">
          <TicketVolumeChart
            data={departmentVolume}
            selectedYear={Number(year)}
          />
          <TicketProblemCategoryChart
            data={ticketsByCategory}
            selectedYear={Number(year)}
          />
        </div>

        {/* SUMMARY TABLES TAB */}
        <div className="space-y-4">
          <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab("frequency")}
              className={`shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "frequency"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Frequency Summary
            </button>
            <button
              onClick={() => setActiveTab("perProblem")}
              className={`shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "perProblem"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Per Problem Summary
            </button>
            <button
              onClick={() => setActiveTab("appMenu")}
              className={`shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "appMenu"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Detail Apps & Menu
            </button>
          </div>

          <div className="space-y-5">
            {activeTab === "frequency" && (
              <FrequencySummaryTable
                title="Summary - Frequency"
                data={monthlyTrend}
                selectedYear={Number(year)}
                type="frequency"
                dept={dept}
                month={month}
                quarter={quarter}
                key={`${year}-${month}-${quarter}-${dept}-frequency`}
              />
            )}
            {activeTab === "perProblem" && (
              <FrequencySummaryTable
                title="Summary - Per Problem"
                data={summaryPerProblem}
                selectedYear={Number(year)}
                type="perProblem"
                dept={dept}
                month={month}
                quarter={quarter}
                key={`${year}-${month}-${quarter}-${dept}-perProblem`}
              />
            )}
            {activeTab === "appMenu" && (
              <FrequencySummaryTable
                title="Summary - Detail Apps & Menu"
                data={summaryPerAppMenu}
                selectedYear={Number(year)}
                type="appMenu"
                dept={dept}
                month={month}
                quarter={quarter}
                key={`${year}-${month}-${quarter}-${dept}-appMenu`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}