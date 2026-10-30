"use client";

import React, { useState, useMemo } from "react";
import { SanitizedProject } from "../types/types";
import { Card, Icon, Pill } from "./UI";
import { HoverTip } from "./chart-tooltip";
import { statusGroupOf } from "../utils/parser";
import { isMatchingSlaYear, isValidSlaResult } from "../utils/sla-policy";

/**
 * Nilai placeholder yang datang apa adanya dari Notion. `#N/A` adalah sisa
 * formula lookup yang gagal, sedangkan `undefined`/`null` muncul sebagai teks
 * ketika kolom Ticket belum terisi. Semuanya bukan data, jadi ditampilkan
 * sebagai "Belum diisi" alih-alih dibiarkan bocor ke layar.
 */
const PLACEHOLDER_SOURCE_VALUES: ReadonlySet<string> = new Set([
  "#n/a",
  "#na",
  "n/a",
  "undefined",
  "null",
  "-",
  "\u2014",
]);

function displayField(value: unknown, emptyLabel = "Belum diisi"): string {
  const text = String(value ?? "").trim();
  return text === "" || PLACEHOLDER_SOURCE_VALUES.has(text.toLowerCase())
    ? emptyLabel
    : text;
}

const TICKET_ID_COLLATOR = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

type ProjectRecencyFields = {
  "Created time"?: unknown;
  created_time?: unknown;
  Ticket?: unknown;
};

type ProjectSortField = "created" | "name" | "year" | "delay" | "reschedule";

function validCreatedTimestamp(value: unknown): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function compareTicketIds(a: unknown, b: unknown, ascending: boolean): number {
  const ticketA = String(a ?? "").trim();
  const ticketB = String(b ?? "").trim();

  if (ticketA === ticketB) return 0;
  if (ticketA === "") return 1;
  if (ticketB === "") return -1;

  const comparison = TICKET_ID_COLLATOR.compare(ticketA, ticketB);
  return ascending ? comparison : -comparison;
}

export function compareProjectsByRecency(
  a: ProjectRecencyFields,
  b: ProjectRecencyFields,
  ascending = false,
): number {
  const createdA =
    validCreatedTimestamp(a["Created time"]) ??
    validCreatedTimestamp(a.created_time);
  const createdB =
    validCreatedTimestamp(b["Created time"]) ??
    validCreatedTimestamp(b.created_time);

  if (createdA !== null && createdB !== null) {
    const comparison = createdA - createdB;
    if (comparison !== 0) return ascending ? comparison : -comparison;
  } else if (createdA !== null) {
    return -1;
  } else if (createdB !== null) {
    return 1;
  }

  return compareTicketIds(a.Ticket, b.Ticket, ascending);
}

interface TabProjectsProps {
  projects: SanitizedProject[];
  selectedYear: number;
}

export function TabProjects({ projects, selectedYear }: TabProjectsProps) {
  // ---- Filter and Search States ----
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterDiv, setFilterDiv] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDevSla, setFilterDevSla] = useState("All");

  // ---- Pagination and Sorting ----
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<ProjectSortField>("created");
  const [sortAsc, setSortAsc] = useState(false);

  // ---- Extract Unique Filter Options from raw data ----
  const yearsList = useMemo(() => {
    const s = new Set(projects.map((p) => p._year).filter(Boolean));
    return ["All", ...Array.from(s).sort()];
  }, [projects]);

  const typesList = useMemo(() => {
    const s = new Set(
      projects
        .map((p) => p._typeGroup)
        .filter((value) => displayField(value, "") !== ""),
    );
    return ["All", ...Array.from(s).sort()];
  }, [projects]);

  const divsList = useMemo(() => {
    const s = new Set(
      projects
        .map((p) => p["Owner Div"])
        .filter((value) => displayField(value, "") !== ""),
    );
    return ["All", ...Array.from(s).sort()];
  }, [projects]);

  const statusesList = useMemo(() => {
    const s = new Set(
      projects.map((p) => statusGroupOf(p["Last Status"])).filter(Boolean),
    );
    return ["All", ...Array.from(s).sort()];
  }, [projects]);

  // ---- Advanced Filtration ----
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 1. Text Search matching keywords
      const query = search.toLowerCase().trim();
      if (query !== "") {
        const titleMatch = (p["Project Name"] || "")
          .toLowerCase()
          .includes(query);
        const ticketMatch = (p["Ticket"] || "").toLowerCase().includes(query);
        const picMatch = (p["PIC Name"] || "").toLowerCase().includes(query);
        const ownerMatch = (p["Owner Name"] || "")
          .toLowerCase()
          .includes(query);
        if (!titleMatch && !ticketMatch && !picMatch && !ownerMatch) {
          return false;
        }
      }

      // 2. Select Dropdowns
      if (filterYear !== "All" && p._year !== filterYear) return false;
      if (filterType !== "All" && p._typeGroup !== filterType) return false;
      if (filterDiv !== "All" && p["Owner Div"] !== filterDiv) return false;
      if (
        filterStatus !== "All" &&
        statusGroupOf(p["Last Status"]) !== filterStatus
      )
        return false;

      // 3. DEV SLA filter follows the exact selected DEV SLA YEAR pair.
      if (filterDevSla !== "All") {
        const sla = p["DEV SLA"];
        if (
          !isMatchingSlaYear(p["DEV SLA YEAR"], selectedYear) ||
          !isValidSlaResult(sla) ||
          sla !== filterDevSla
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    projects,
    search,
    filterYear,
    filterType,
    filterDiv,
    filterStatus,
    filterDevSla,
    selectedYear,
  ]);

  // ---- Sorting Logic ----
  const sortedProjects = useMemo(() => {
    const copy = [...filteredProjects];
    copy.sort((a, b) => {
      if (sortField === "created") {
        return compareProjectsByRecency(a, b, sortAsc);
      }

      let valA: string | number = "";
      let valB: string | number = "";

      if (sortField === "name") {
        valA = (a["Project Name"] || "").toLowerCase();
        valB = (b["Project Name"] || "").toLowerCase();
      } else if (sortField === "year") {
        valA = a["Year"] || 0;
        valB = b["Year"] || 0;
      } else if (sortField === "reschedule") {
        valA = a["Reschedule UAT"] || 0;
        valB = b["Reschedule UAT"] || 0;
      } else if (sortField === "delay") {
        // total dynamic delay days
        valA =
          (a._lateFSD || 0) +
          (a._lateDev || 0) +
          (a._lateSIT || 0) +
          (a._lateUAT || 0) +
          (a._lateLive || 0);
        valB =
          (b._lateFSD || 0) +
          (b._lateDev || 0) +
          (b._lateSIT || 0) +
          (b._lateUAT || 0) +
          (b._lateLive || 0);
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredProjects, sortField, sortAsc]);

  // ---- Paginated Slice ----
  const totalItems = sortedProjects.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const activePageProjects = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * pageSize;
    return sortedProjects.slice(startIdx, startIdx + pageSize);
  }, [sortedProjects, safeCurrentPage, pageSize]);

  // Reset pagination on search modifications
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleSelectFilter = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    val: string,
  ) => {
    setter(val);
    setCurrentPage(1);
  };

  const triggerSort = (field: ProjectSortField) => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortAsc((current) => !current);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // ---- CSV Export Trigger ----
  const handleCsvExport = () => {
    if (filteredProjects.length === 0) {
      alert("No data available to export!");
      return;
    }
    // Define headers
    const headers = [
      "Ticket",
      "Project Name",
      "Owner Div",
      "Owner Name",
      "PIC Name",
      "Type Group",
      "Last Status",
      "Year",
      "Reschedule UAT",
      "FSD SLA",
      "DEV SLA",
      "SIT SLA",
      "UAT SLA",
      "Live SLA",
    ];

    // Compile row strings
    const rows = filteredProjects.map((p) => [
      `"${p["Ticket"] || ""}"`,
      `"${(p["Project Name"] || "").replace(/"/g, '""')}"`,
      `"${p["Owner Div"] || ""}"`,
      `"${p["Owner Name"] || ""}"`,
      `"${p["PIC Name"] || ""}"`,
      `"${p._typeGroup}"`,
      `"${p["Last Status"] || ""}"`,
      p["Year"] || "",
      p["Reschedule UAT"] || 0,
      `"${p["FSD SLA"] || ""}"`,
      `"${p["DEV SLA"] || ""}"`,
      `"${p["SIT SLA"] || ""}"`,
      `"${p["UAT SLA"] || ""}"`,
      `"${p["Live SLA"] || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `adv_dashboard_export_${filterYear}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---- Stage Visual Indicators Renderer ----
  const renderStageBubble = (
    label: string,
    slaVal: unknown,
    slaYear: unknown,
  ) => {
    const result =
      isMatchingSlaYear(slaYear, selectedYear) && isValidSlaResult(slaVal)
        ? slaVal
        : null;
    let classes = "bg-gray-50 text-gray-400 border-gray-100/50";
    if (result === "Achieved") {
      classes =
        "bg-emerald-50 text-emerald-700 border-emerald-100 font-extrabold";
    } else if (result === "Not Achieved") {
      classes =
        "bg-rose-50 text-rose-600 border-rose-100 font-extrabold shadow-2xs";
    }
    return (
      <HoverTip
        content={`${label} SLA ${selectedYear}: ${result ?? "—"}`}
        className={`w-7 h-7 flex items-center justify-center rounded-lg border text-[9px] tabular-nums leading-none select-none transition-all ${classes}`}
      >
        {label}
      </HoverTip>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4.5 flex flex-col gap-4.5">
        {/* Search row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          <div className="relative flex-1 max-w-lg">
            <input
              type="text"
              placeholder="Cari berdasarkan nama proyek, tiket, owner, atau PIC..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9.5 pr-4 h-10 border border-gray-200/80 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-gray-50/20 transition-all font-sans"
            />
            <div className="absolute left-3.5 top-3 text-gray-400">
              <Icon name="search" className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCsvExport}
              className="px-3.5 h-10 bg-blue-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
            >
              <Icon name="download" className="w-3.5 h-3.5" />
              Spreadsheet (CSV)
            </button>
            <span className="text-[11px] tabular-nums font-bold bg-neutral-50 px-3 h-10 border border-gray-100 rounded-xl flex items-center text-neutral-500">
              {filteredProjects.length} filtered
            </span>
          </div>
        </div>

        {/* Dropdowns filters row */}
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Year select */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-display">
              Intake Year
            </label>
            <select
              value={filterYear}
              onChange={(e) =>
                handleSelectFilter(setFilterYear, e.target.value)
              }
              className="w-full border border-gray-150 rounded-xl h-9 px-3 text-[11.5px] bg-white outline-none focus:border-blue-500"
            >
              {yearsList.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Type select */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-display">
              Project Type
            </label>
            <select
              value={filterType}
              onChange={(e) =>
                handleSelectFilter(setFilterType, e.target.value)
              }
              className="w-full border border-gray-150 rounded-xl h-9 px-3 text-[11.5px] bg-white outline-none focus:border-blue-500"
            >
              {typesList.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Division select */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-display">
              Owner Division
            </label>
            <select
              value={filterDiv}
              onChange={(e) => handleSelectFilter(setFilterDiv, e.target.value)}
              className="w-full border border-gray-150 rounded-xl h-9 px-3 text-[11.5px] bg-white outline-none focus:border-blue-500"
            >
              {divsList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Pipeline group select */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-display">
              Pipeline Category
            </label>
            <select
              value={filterStatus}
              onChange={(e) =>
                handleSelectFilter(setFilterStatus, e.target.value)
              }
              className="w-full border border-gray-150 rounded-xl h-9 px-3 text-[11.5px] bg-white outline-none focus:border-blue-500"
            >
              {statusesList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Dev SLA status select */}
          <div className="space-y-1.5 select-none min-[400px]:col-span-2 sm:col-span-1">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-display">
              DEV SLA State
            </label>
            <select
              value={filterDevSla}
              onChange={(e) =>
                handleSelectFilter(setFilterDevSla, e.target.value)
              }
              className="w-full border border-gray-150 rounded-xl h-9 px-3 text-[11.5px] bg-white outline-none focus:border-blue-500"
            >
              <option value="All">All statuses</option>
              <option value="Achieved">Achieved</option>
              <option value="Not Achieved">Not Achieved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main projects spreadsheet table */}
      <Card padding="p-0">
        <div className="overflow-x-auto w-full">
          <table className="min-w-245 w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider font-display select-none h-11 shrink-0">
                <th className="py-2 px-4 text-center w-12">No</th>
                <th
                  className="py-2 px-3 hover:bg-gray-100/30 cursor-pointer"
                  onClick={() => triggerSort("created")}
                  aria-sort={
                    sortField === "created"
                      ? sortAsc
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <HoverTip
                    content="Sort by Created time (Ticket ID fallback)"
                    className="flex items-center gap-1.5"
                  >
                    Ticket ID
                    {sortField === "created" && (
                      <Icon
                        name={sortAsc ? "chevron-up" : "chevron-down"}
                        className="w-3 h-3"
                      />
                    )}
                  </HoverTip>
                </th>
                <th
                  className="py-2 px-3 hover:bg-gray-100/30 cursor-pointer w-[45%] min-w-[240px]"
                  onClick={() => triggerSort("name")}
                >
                  <div className="flex items-center gap-1.5">
                    Project Detail
                    {sortField === "name" && (
                      <Icon
                        name={sortAsc ? "chevron-up" : "chevron-down"}
                        className="w-3 h-3"
                      />
                    )}
                  </div>
                </th>
                <th
                  className="py-2 px-3 hover:bg-gray-100/30 cursor-pointer text-center"
                  onClick={() => triggerSort("year")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Intake
                    {sortField === "year" && (
                      <Icon
                        name={sortAsc ? "chevron-up" : "chevron-down"}
                        className="w-3 h-3"
                      />
                    )}
                  </div>
                </th>
                <th className="py-2 px-3 text-center">Milestones SLA Stages</th>
                <th
                  className="py-2 px-3 hover:bg-gray-100/30 cursor-pointer text-center"
                  onClick={() => triggerSort("delay")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Late Sum
                    {sortField === "delay" && (
                      <Icon
                        name={sortAsc ? "chevron-up" : "chevron-down"}
                        className="w-3 h-3"
                      />
                    )}
                  </div>
                </th>
                <th
                  className="py-2 px-3 hover:bg-gray-100/30 cursor-pointer text-center"
                  onClick={() => triggerSort("reschedule")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Resched
                    {sortField === "reschedule" && (
                      <Icon
                        name={sortAsc ? "chevron-up" : "chevron-down"}
                        className="w-3 h-3"
                      />
                    )}
                  </div>
                </th>
                <th className="py-2 px-4 text-right w-36">Pipeline Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activePageProjects.map((p, idx) => {
                const globalIndex = (safeCurrentPage - 1) * pageSize + idx + 1;
                const totalDelay =
                  (p._lateFSD || 0) +
                  (p._lateDev || 0) +
                  (p._lateSIT || 0) +
                  (p._lateUAT || 0) +
                  (p._lateLive || 0);

                return (
                  <tr
                    key={p.notion_page_id || p["Ticket"] || idx}
                    className="hover:bg-gray-50/15 transition-all text-gray-700"
                  >
                    {/* No */}
                    <td className="py-3.5 px-4 tabular-nums font-bold text-gray-400 text-center">
                      {globalIndex}
                    </td>

                    {/* Ticket ID */}
                    <td className="py-3.5 px-3 tabular-nums font-bold text-gray-800 text-[11px] whitespace-nowrap">
                      {displayField(p["Ticket"], "—")}
                    </td>

                    {/* Project Detail */}
                    <td className="py-3.5 px-3 min-w-[240px] whitespace-normal break-words">
                      <p className="font-extrabold text-xs text-gray-900 leading-snug font-sans whitespace-normal break-words">
                        {displayField(p["Project Name"])}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-gray-400 font-sans">
                        {displayField(p._typeGroup, "") !== "" && (
                          <span className="font-semibold text-blue-600 bg-blue-50/40 px-1 py-0.5 rounded-sm uppercase tracking-wide">
                            {p._typeGroup}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Icon
                            name="users"
                            className="w-3 h-3 text-gray-300"
                          />
                          Owner:{" "}
                          <strong className="text-gray-600">
                            {displayField(p["Owner Name"])}
                            {displayField(p["Owner Div"], "") === ""
                              ? ""
                              : ` (${displayField(p["Owner Div"])})`}
                          </strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon
                            name="clock"
                            className="w-3 h-3 text-gray-300"
                          />
                          PIC:{" "}
                          <strong className="text-gray-600">
                            {displayField(p["PIC Name"], "—")}
                          </strong>
                        </span>
                      </div>
                    </td>

                    {/* Intake Year */}
                    <td className="py-3.5 px-3 text-center tabular-nums font-bold text-gray-600">
                      {p._year}
                    </td>

                    {/* Stages indicators */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center justify-center gap-1">
                        {renderStageBubble(
                          "FSD",
                          p["FSD SLA"],
                          p["FSD SLA YEAR"],
                        )}
                        {renderStageBubble(
                          "DEV",
                          p["DEV SLA"],
                          p["DEV SLA YEAR"],
                        )}
                        {renderStageBubble(
                          "SIT",
                          p["SIT SLA"],
                          p["SIT SLA YEAR"],
                        )}
                        {renderStageBubble(
                          "UAT",
                          p["UAT SLA"],
                          p["UAT SLA YEAR"],
                        )}
                        {renderStageBubble(
                          "LIV",
                          p["Live SLA"],
                          p["LIVE SLA YEAR"],
                        )}
                      </div>
                    </td>

                    {/* Late Sum */}
                    <td className="py-3.5 px-3 text-center">
                      {totalDelay > 0 ? (
                        <span className="inline-block text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md tabular-nums">
                          +{totalDelay}d
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-300 tabular-nums font-bold">
                          —
                        </span>
                      )}
                    </td>

                    {/* Reschedule */}
                    <td className="py-3.5 px-3 text-center tabular-nums font-bold text-gray-700">
                      {p["Reschedule UAT"] && p["Reschedule UAT"] > 0 ? (
                        <span className="text-amber-600 bg-amber-50 border border-amber-100 text-[11px] px-1.5 py-0.5 rounded-md font-extrabold">
                          {p["Reschedule UAT"]}×
                        </span>
                      ) : (
                        <span className="text-gray-300 text-[11px] font-bold">
                          —
                        </span>
                      )}
                    </td>

                    {/* Pipeline status */}
                    <td className="py-3.5 px-4 text-right">
                      <Pill
                        label={p["Last Status"] || "—"}
                        status={p["Last Status"]}
                      />
                    </td>
                  </tr>
                );
              })}
              {activePageProjects.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-xs text-gray-400 font-sans"
                  >
                    No projects match the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls footer */}
        <div className="px-4 py-3.5 sm:px-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3.5 select-none shrink-0 text-xs">
          <div className="flex max-w-full flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="text-gray-400">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-200 bg-white rounded-lg px-2 py-0.5 outline-none font-semibold text-gray-600"
            >
              {[10, 20, 50, 100].map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
            <span className="w-full text-center text-gray-400 font-medium sm:ml-2 sm:w-auto sm:border-l sm:border-gray-200 sm:pl-3 sm:text-left">
              Showing{" "}
              {totalItems > 0 ? (safeCurrentPage - 1) * pageSize + 1 : 0}–
              {Math.min(safeCurrentPage * pageSize, totalItems)} of {totalItems}{" "}
              projects
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
              disabled={safeCurrentPage === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white active:scale-90 transition-all font-bold cursor-pointer"
            >
              <Icon name="chevron-left" className="w-4 h-4" />
            </button>
            <span className="text-gray-400 tabular-nums font-medium text-[11.5px] px-2.5">
              Page <strong className="text-gray-800">{safeCurrentPage}</strong>{" "}
              of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))
              }
              disabled={safeCurrentPage === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white active:scale-90 transition-all font-bold cursor-pointer"
            >
              <Icon name="chevron-right" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
