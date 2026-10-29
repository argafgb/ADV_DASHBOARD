"use client";

import { useState, useMemo } from "react";
import { FsdBlueprintItem, BlueprintStatus } from "../types/fsdBlueprint";
import {
  formatTitleCase,
  STATUS_CONFIG,
  STATUS_DISPLAY_ORDER,
} from "../utils/fsdCalculations";
import {
  ArrowRight,
  Search,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  SearchX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DropdownOption {
  value: string;
  label: string;
}

interface TableFilterDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  defaultLabel: string;
}

function TableFilterDropdown({
  value,
  options,
  onChange,
  defaultLabel,
}: TableFilterDropdownProps) {
  const selected = options.find((o) => o.value === value);
  const isActive = value !== "all";
  const displayLabel = selected ? selected.label : defaultLabel;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-36 sm:w-40 items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer select-none",
            isActive
              ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-400"
              : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/80",
          )}
        >
          <span className="truncate text-left">{displayLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="z-50 min-w-44 max-h-60 overflow-y-auto p-1 rounded-xl shadow-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      >
        {options.map((opt) => {
          const isItemActive = opt.value === value;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "w-full flex items-center px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors",
                isItemActive
                  ? "bg-blue-50 text-blue-600 font-semibold dark:bg-blue-950/50 dark:text-blue-400"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/70",
              )}
            >
              <span className="truncate">{opt.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface FsdDataTableProps {
  items: FsdBlueprintItem[];
  filterStatus?: string;
  onFilterStatusChange?: (status: string) => void;
  filterPic?: string;
  onFilterPicChange?: (pic: string) => void;
}

export function FsdDataTable({
  items,
  filterStatus: initialStatus = "all",
  onFilterStatusChange,
  filterPic: initialPic = "all",
  onFilterPicChange,
}: FsdDataTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [owner, setOwner] = useState("all");
  const [quartal, setQuartal] = useState("all");
  const [pic, setPic] = useState(initialPic);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Sync external filters if changed
  const activeStatus = onFilterStatusChange ? initialStatus : status;
  const activePic = onFilterPicChange ? initialPic : pic;

  const handleStatusChange = (newStatus: string) => {
    if (onFilterStatusChange) onFilterStatusChange(newStatus);
    else setStatus(newStatus);
    setPage(0);
    setExpandedId(null);
  };

  const handlePicChange = (newPic: string) => {
    if (onFilterPicChange) onFilterPicChange(newPic);
    else setPic(newPic);
    setPage(0);
    setExpandedId(null);
  };

  // Options
  const statusOptions: DropdownOption[] = useMemo(() => {
    return [
      { value: "all", label: "Semua Status" },
      ...STATUS_DISPLAY_ORDER.map((st) => ({
        value: st,
        label: st,
      })),
    ];
  }, []);

  const ownerOptions: DropdownOption[] = useMemo(() => {
    const owners = Array.from(
      new Set(items.map((r) => r.owner).filter(Boolean)),
    ).sort();
    return [
      { value: "all", label: "Semua Owner" },
      ...owners.map((o) => ({ value: o, label: o })),
    ];
  }, [items]);

  const quartalOptions: DropdownOption[] = useMemo(() => {
    const quartals = Array.from(
      new Set(items.map((r) => r.quartal).filter(Boolean)),
    ).sort();
    return [
      { value: "all", label: "Semua Quartal" },
      ...quartals.map((q) => ({ value: q, label: q.replace(" - ", " ") })),
    ];
  }, [items]);

  const picOptions: DropdownOption[] = useMemo(() => {
    const set = new Set<string>();
    for (const r of items) {
      if (r.picIt) {
        r.picIt.split(",").forEach((p: string) => {
          const trimmed = p.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    }
    const pics = Array.from(set).sort();
    return [
      { value: "all", label: "Semua DCT IT" },
      ...pics.map((p) => ({ value: p, label: formatTitleCase(p) })),
    ];
  }, [items]);

  const hasFilter =
    search.trim() !== "" ||
    activeStatus !== "all" ||
    owner !== "all" ||
    quartal !== "all" ||
    activePic !== "all";

  const handleResetFilters = () => {
    setSearch("");
    handleStatusChange("all");
    setOwner("all");
    setQuartal("all");
    handlePicChange("all");
    setPage(0);
    setExpandedId(null);
  };

  // Filtered and sorted items
  const filtered = useMemo(() => {
    const qLower = search.trim().toLowerCase();
    return items.filter((r) => {
      if (activeStatus !== "all" && r.status !== activeStatus) return false;
      if (owner !== "all" && r.owner !== owner) return false;
      if (quartal !== "all" && r.quartal !== quartal) return false;
      if (
        activePic !== "all" &&
        (!r.picIt || !r.picIt.toLowerCase().includes(activePic.toLowerCase()))
      )
        return false;
      if (qLower) {
        const combined =
          `${r.module} ${r.scope} ${r.picIt} ${r.picOwner}`.toLowerCase();
        if (!combined.includes(qLower)) return false;
      }
      return true;
    });
  }, [items, search, activeStatus, owner, quartal, activePic]);

  const perPage = 12;
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, pageCount - 1);
  const pagedItems = filtered.slice(
    currentPage * perPage,
    currentPage * perPage + perPage,
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/70">
      {/* HEADER & FILTER TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            Blueprint Data
          </h3>
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {filtered.length} dokumen
          </span>
        </div>

        {/* SEARCH & SELECT CONTROLS */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Cari module, scope, PIC..."
              className="h-9 w-52 rounded-xl border border-zinc-200 bg-zinc-50/50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-50 dark:focus:bg-zinc-900"
            />
          </div>

          {/* Equal-length Dropdown Filters with DropdownMenu Popover */}
          <TableFilterDropdown
            value={activeStatus}
            options={statusOptions}
            onChange={handleStatusChange}
            defaultLabel="Semua Status"
          />

          <TableFilterDropdown
            value={owner}
            options={ownerOptions}
            onChange={(val) => {
              setOwner(val);
              setPage(0);
            }}
            defaultLabel="Semua Owner"
          />

          <TableFilterDropdown
            value={quartal}
            options={quartalOptions}
            onChange={(val) => {
              setQuartal(val);
              setPage(0);
            }}
            defaultLabel="Semua Quartal"
          />

          <TableFilterDropdown
            value={activePic}
            options={picOptions}
            onChange={handlePicChange}
            defaultLabel="Semua DCT IT"
          />

          {/* Reset Button */}
          {hasFilter && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-400 cursor-pointer"
              title="Reset semua filter"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <div className="min-w-315">
          {/* HEADER ROW */}
          <div className="grid grid-cols-[44px_minmax(220px,1.6fr)_100px_90px_minmax(140px,1fr)_minmax(140px,1fr)_86px_190px_100px_32px] items-center border-b border-zinc-100 bg-zinc-50/70 py-3.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-500">
            <span className="pl-5">#</span>
            <span className="px-3">MODULE &amp; SCOPE</span>
            <span className="px-2">TIPE</span>
            <span className="px-2">OWNER</span>
            <span className="px-3">DCT IT</span>
            <span className="px-3">PIC PROJECT OWNER</span>
            <span className="px-2">QUARTAL</span>
            <span className="px-2">TIMELINE</span>
            <span className="px-2">STATUS</span>
            <span className="pr-4 text-center"></span>
          </div>

          {/* ROWS */}
          {pagedItems.length === 0 ? (
            <div className="py-14 text-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <SearchX className="h-8 w-8 text-zinc-400" />
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  Tidak ada dokumen yang cocok
                </p>
                <p className="text-xs text-zinc-400">
                  Coba ubah kata kunci pencarian atau reset filter.
                </p>
              </div>
            </div>
          ) : (
            pagedItems.map((row, idx) => {
              const isExpanded = expandedId === row.id;
              const cfg =
                STATUS_CONFIG[row.status as BlueprintStatus] ||
                STATUS_CONFIG["Not Started"];
              const rowNo = currentPage * perPage + idx + 1;
              const formattedQuartal = (row.quartal || "").replace(" - ", " ");

              return (
                <div
                  key={row.id}
                  className={cn(
                    "border-b border-zinc-100 transition-colors dark:border-zinc-800/60",
                    isExpanded
                      ? "bg-zinc-50/70 dark:bg-zinc-800/30"
                      : "hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20",
                  )}
                >
                  {/* MAIN ROW */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : row.id)}
                    className="grid grid-cols-[44px_minmax(220px,1.6fr)_100px_90px_minmax(140px,1fr)_minmax(140px,1fr)_86px_190px_100px_32px] items-center py-3.5 cursor-pointer text-xs"
                  >
                    {/* No */}
                    <span className="pl-5 font-display text-[11.5px] font-medium text-zinc-400">
                      {rowNo}
                    </span>

                    {/* Module & Scope */}
                    <div className="px-3 min-w-0 pr-4">
                      <div className="font-bold text-[12.5px] text-zinc-900 dark:text-zinc-100 truncate">
                        {row.module}
                      </div>
                      <div
                        className="text-[11.5px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 leading-snug"
                        title={row.scope}
                      >
                        {row.scope || "—"}
                      </div>
                    </div>

                    {/* Tipe & Impact Chips (Vertical Stack per Screenshot) */}
                    <div className="px-2 flex flex-col gap-1 items-start">
                      {row.bpType && (
                        <span
                          className={cn(
                            "inline-flex h-5 items-center rounded-md px-2 text-[10.5px] font-bold whitespace-nowrap",
                            row.bpType === "New BP"
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                          )}
                        >
                          {row.bpType}
                        </span>
                      )}
                      {row.impact && (
                        <span
                          className={cn(
                            "inline-flex h-5 items-center rounded-md px-2 text-[10.5px] font-bold whitespace-nowrap",
                            row.impact === "Major"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                          )}
                        >
                          {row.impact}
                        </span>
                      )}
                    </div>

                    {/* Owner Badge */}
                    <div className="px-2">
                      <span className="inline-flex h-5 items-center rounded-md border border-zinc-200 bg-white px-2 text-[11px] font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {row.owner}
                      </span>
                    </div>

                    {/* DCT IT */}
                    <div
                      className="px-3 text-xs text-zinc-700 dark:text-zinc-300 truncate"
                      title={row.picIt}
                    >
                      {formatTitleCase(row.picIt) || "—"}
                    </div>

                    {/* PIC Project Owner */}
                    <div
                      className="px-3 text-xs text-zinc-700 dark:text-zinc-300 truncate"
                      title={row.picOwner}
                    >
                      {formatTitleCase(row.picOwner) || "—"}
                    </div>

                    {/* Quartal */}
                    <div className="px-2 text-[11.5px] font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {formattedQuartal}
                    </div>

                    {/* Timeline */}
                    <div className="px-2 text-[11.5px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
                      <span>{row.dateStart || "—"}</span>
                      <ArrowRight
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 text-zinc-300 dark:text-zinc-600"
                      />
                      <span className="text-zinc-400">
                        {row.dateEnd ||
                          (row.dateStart ? "berjalan" : "belum dijadwalkan")}
                      </span>
                    </div>

                    {/* Status Pill Badge */}
                    <div className="px-2">
                      <span
                        className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold whitespace-nowrap"
                        style={{
                          backgroundColor: cfg.bg,
                          color: cfg.fg,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: cfg.fg }}
                        />
                        {row.status}
                      </span>
                    </div>

                    {/* Chevron */}
                    <div className="pr-4 flex items-center justify-center text-zinc-400">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  {/* EXPANDED ACCORDION VIEW */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 bg-zinc-50/70 border-t border-zinc-100 dark:bg-zinc-900/60 dark:border-zinc-800/60">
                      {/* 5-Column Metadata Sub-row */}
                      <div className="grid grid-cols-5 gap-6 py-3 border-b border-zinc-200/70 dark:border-zinc-800/70 mb-4">
                        <div>
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 block">
                            REVIEWER IT
                          </span>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">
                            {formatTitleCase(row.revIt) || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 block">
                            REVIEWER CPP
                          </span>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">
                            {formatTitleCase(row.revCpp) || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 block">
                            END DOC
                          </span>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">
                            {row.endDoc || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 block">
                            END REVIEW
                          </span>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">
                            {row.endReview || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 block">
                            STATUS
                          </span>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">
                            {row.status}
                          </span>
                        </div>
                      </div>

                      {/* Update Progress Card Container */}
                      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                          UPDATE PROGRESS
                        </span>
                        <div className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-55 overflow-y-auto">
                          {row.progress ? (
                            row.progress
                          ) : (
                            <span className="text-zinc-400 italic">
                              Belum ada catatan update progress.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* PAGINATION */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800/80">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Menampilkan {currentPage * perPage + 1}–
            {Math.min(filtered.length, (currentPage + 1) * perPage)} dari{" "}
            {filtered.length} dokumen
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => setPage((p: number) => Math.max(0, p - 1))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 disabled:opacity-40 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: pageCount }).map((_, i) => {
              if (
                i === 0 ||
                i === pageCount - 1 ||
                (i >= currentPage - 1 && i <= currentPage + 1)
              ) {
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPage(i)}
                    className={cn(
                      "inline-flex h-7 min-w-7 px-2 items-center justify-center rounded-lg font-display text-xs font-bold transition-colors cursor-pointer",
                      i === currentPage
                        ? "bg-blue-600 text-white dark:bg-blue-500"
                        : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800",
                    )}
                  >
                    {i + 1}
                  </button>
                );
              }
              if (i === currentPage - 2 || i === currentPage + 2) {
                return (
                  <span key={i} className="px-1 text-xs text-zinc-400">
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              type="button"
              disabled={currentPage >= pageCount - 1}
              onClick={() =>
                setPage((p: number) => Math.min(pageCount - 1, p + 1))
              }
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 disabled:opacity-40 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
