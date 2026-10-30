"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Card } from "@/components/ui/card";
import { fmt } from "@/lib/utils";
import { parseMonthFilter } from "@/lib/month-filter";
import EmptyState from "@/components/shared/EmptyState";
import { WRAP_PILL } from "@/components/shared/tableStyles";
import {
  SearchCode,
  AlertCircle,
  ShieldAlert,
  Clock,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  TrendingDown,
  Trophy,
  Check,
  Download,
  LayoutGrid,
  AlertTriangle,
  Circle,
  Users,
  Settings,
  BarChart3,
  PieChart,
  SearchX,
} from "lucide-react";
import type {
  BugFinding,
  BugHunterKpi,
  SeverityDonutSeg,
  StatusBarItem,
  FindingsTrendBar,
  HunterLeaderboardItem,
  FindingStatus,
} from "../types/bugHunterTypes";

/* ================================================================== */
/*  COLOR & PALETTE HELPERS (Dynamic fallback for unknown values)     */
/* ================================================================== */

const KNOWN_CATEGORY_COLORS: Record<string, string> = {
  BPD: "#2563EB",
  "FIN & ACC": "#10B981",
  HRIS: "#F59E0B",
  COS: "#EF4444",
  WISECON: "#8B5CF6",
  IT: "#EC4899",
  COMSEC: "#6366F1",
  CARGO: "#0EA5E9",
};

const KNOWN_SEVERITY_COLORS: Record<string, string> = {
  Blocker: "#DC2626",
  Major: "#F59E0B",
  Minor: "#2563EB",
  Trivia: "#6B7280",
  Improvement: "#10B981",
};

const KNOWN_STATUS_COLORS: Record<string, string> = {
  DONE: "#10B981",
  CLOSED: "#059669",
  "ON PROGRESS BIZDEV": "#F59E0B",
  "ON PROGRESS QA": "#2563EB",
  "HOLD BIZDEV": "#6B7280",
  "PERLU DILENGKAPI BIZDEV": "#F59E0B",
  "DEV ON QUEUE": "#2563EB",
};

const EXTRA_PALETTE = [
  "#0F766E",
  "#9333EA",
  "#B45309",
  "#BE123C",
  "#4D7C0F",
  "#0369A1",
  "#0891B2",
  "#D97706",
  "#4F46E5",
  "#C026D3",
];

function getCategoryColor(cat: string | null | undefined): string {
  if (!cat) return "#9CA3AF";
  if (KNOWN_CATEGORY_COLORS[cat]) return KNOWN_CATEGORY_COLORS[cat];
  let hash = 0;
  for (let i = 0; i < cat.length; i++) {
    hash = (hash * 31 + cat.charCodeAt(i)) >>> 0;
  }
  return EXTRA_PALETTE[hash % EXTRA_PALETTE.length];
}

function getSeverityColor(sev: string | null | undefined): string {
  if (!sev) return "#9CA3AF";
  if (KNOWN_SEVERITY_COLORS[sev]) return KNOWN_SEVERITY_COLORS[sev];
  let hash = 0;
  for (let i = 0; i < sev.length; i++) {
    hash = (hash * 31 + sev.charCodeAt(i)) >>> 0;
  }
  return EXTRA_PALETTE[hash % EXTRA_PALETTE.length];
}

function getStatusColor(status: string | null | undefined): string {
  if (!status) return "#9CA3AF";
  if (KNOWN_STATUS_COLORS[status]) return KNOWN_STATUS_COLORS[status];
  const upper = status.toUpperCase();
  if (upper === "DONE" || upper === "CLOSED" || upper === "SOLVED")
    return "#10B981";
  if (upper.includes("PROGRESS")) return "#2563EB";
  if (upper.includes("HOLD") || upper.includes("QUEUE")) return "#6B7280";
  if (upper.includes("REVIEW") || upper.includes("PERLU")) return "#F59E0B";
  let hash = 0;
  for (let i = 0; i < status.length; i++) {
    hash = (hash * 31 + status.charCodeAt(i)) >>> 0;
  }
  return EXTRA_PALETTE[hash % EXTRA_PALETTE.length];
}

function isFindingClosed(status: string | null | undefined): boolean {
  if (!status) return false;
  const upper = status.trim().toUpperCase();
  return upper === "DONE" || upper === "CLOSED" || upper === "SOLVED";
}

function isFindingCritical(sev: string | null | undefined): boolean {
  if (!sev) return false;
  const s = sev.trim().toLowerCase();
  return s === "blocker" || s === "major" || s === "critical";
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/* ================================================================== */
/*  PILL STYLES                                                       */
/* ================================================================== */

function getSeverityPill(sev: string | null | undefined): string {
  if (!sev)
    return "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  const s = sev.toLowerCase();
  if (s === "blocker" || s === "critical") {
    return "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-400";
  }
  if (s === "major" || s === "high") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400";
  }
  if (s === "minor" || s === "medium") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400";
  }
  if (s === "trivia" || s === "low") {
    return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  }
  if (s === "improvement") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400";
  }
  return "bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-400";
}

function getStatusPill(status: string | null | undefined): string {
  if (!status)
    return "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  const upper = status.toUpperCase();
  if (upper === "DONE" || upper === "CLOSED") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400";
  }
  if (upper.includes("PROGRESS")) {
    return "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400";
  }
  if (upper.includes("HOLD") || upper.includes("QUEUE")) {
    return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  }
  if (upper.includes("PERLU") || upper.includes("REVIEW")) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400";
  }
  return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-400";
}

function getPriorityPill(priority: string | null | undefined): string {
  if (!priority)
    return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  const p = priority.toUpperCase();
  if (p === "URGENT" || p === "HIGH") {
    return "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-400";
  }
  if (p === "MEDIUM") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400";
  }
  return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
}

/** Shared by the finding list header and rows. Text columns flex and wrap to
 *  two lines, keeping a clean, balanced look across laptop and wide screens. */
const FINDING_LIST_COLUMNS =
  "minmax(200px,2.4fr) minmax(76px,0.7fr) minmax(96px,0.9fr) minmax(84px,0.7fr) minmax(80px,0.6fr) minmax(116px,1.1fr) 80px minmax(116px,1.1fr)";

/* ================================================================== */
/*  SUB-COMPONENTS                                                    */
/* ================================================================== */

function DeltaChip({
  value,
  suffix = "",
  inverse = false,
  onFeatured = false,
}: {
  value: number | null;
  suffix?: string;
  inverse?: boolean;
  onFeatured?: boolean;
}) {
  if (value === null) return null;
  const isUp = inverse ? value < 0 : value > 0;
  const isDown = inverse ? value > 0 : value < 0;
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : TrendingUp;

  let cls: string;
  if (onFeatured) {
    cls = isUp
      ? "bg-emerald-50 text-emerald-700"
      : isDown
        ? "bg-rose-50 text-rose-700"
        : "bg-white/20 text-white";
  } else {
    cls = isUp
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400"
      : isDown
        ? "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400"
        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${cls}`}
    >
      <Icon className="h-3 w-3" />
      {value > 0 ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

/* --- Filter Dropdown Popover --- */

interface FilterDef {
  label: string;
  value: string;
  opts: string[];
  active: boolean;
  onChange: (v: string) => void;
  icon: React.ReactNode;
}

function FilterChip({
  f,
  isOpen,
  onToggle,
}: {
  f: FilterDef;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onToggle}
        title={f.label}
        className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 transition-colors bg-white dark:bg-zinc-900 ${
          f.active
            ? "border-blue-300 dark:border-blue-800"
            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
        }`}
      >
        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
          {f.label}
        </span>
        <span
          className={`max-w-[120px] truncate whitespace-nowrap text-[13px] font-bold ${
            f.active
              ? "text-blue-600 dark:text-blue-400"
              : "text-zinc-700 dark:text-zinc-300"
          }`}
        >
          {f.value === "All" ? "Semua" : f.value}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
      </button>

      {isOpen && (
        <div className="absolute top-[42px] left-0 z-50 min-w-[206px] max-h-[292px] overflow-y-auto rounded-xl border border-zinc-200 shadow-lg p-1.5 bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <div className="px-2.5 pb-1.5 pt-1 text-[9.5px] font-bold uppercase tracking-wider text-zinc-300 dark:text-zinc-600">
            {f.label}
          </div>
          {f.opts.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                f.onChange(opt);
                onToggle();
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                opt === f.value
                  ? "font-bold text-blue-600 dark:text-blue-400"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-left">
                {opt === "All" ? "Semua" : opt}
              </span>
              {opt === f.value && (
                <Check className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatLastUpdateDate(text: string | null): string | null {
  if (!text?.trim()) return null;

  const firstLine = text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^>\s*/, ""))
    .find(Boolean);

  if (!firstLine) return null;

  return firstLine.split(":")[0]?.trim() || null;
}

function toDisplayText(text: string | null | undefined): string {
  if (!text?.trim()) return "-";

  return text
    .split(/\r?\n/)
    .map((line) =>
      line
        .trim()
        .toLowerCase()
        .replace(/\b\p{L}/gu, (char) => char.toUpperCase())
        .replace(/\bQa\b/g, "QA")
        .replace(/\bPic\b/g, "PIC")
        .replace(/\bDev\b/g, "DEV")
        .replace(/\bFlm\b/g, "FLM")
        .replace(/\bDa\b/g, "DA")
        .replace(/\bHr\b/g, "HR")
        .replace(/\bIt\b/g, "IT")
        .replace(/\bCos\b/g, "COS")
        .replace(/\bBpd\b/g, "BPD")
        .replace(/\bFin\b/g, "FIN")
        .replace(/\bAcc\b/g, "ACC"),
    )
    .filter(Boolean)
    .join("\n");
}

interface ActivityEntry {
  date: string;
  note: string;
}

function parseActivityLog(text: string | null): ActivityEntry[] {
  if (!text?.trim()) return [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const entries: ActivityEntry[] = [];
  let current: ActivityEntry | null = null;

  for (const line of lines) {
    const dateMatch = line.match(/^>\s*(.+)$/);
    if (dateMatch) {
      if (current) entries.push(current);
      current = { date: dateMatch[1].trim(), note: "" };
      continue;
    }
    if (!current) current = { date: "Catatan", note: "" };
    current.note = current.note ? `${current.note}\n${line}` : line;
  }
  if (current) entries.push(current);
  return entries.filter((entry) => entry.date || entry.note);
}

/* ================================================================== */
/*  MAIN COMPONENT                                                    */
/* ================================================================== */

interface BugHunterDashboardClientProps {
  findings: BugFinding[];
  /** Global year filter (already normalized by the page). */
  year: string;
  /** Global month filter ("ALL", "9", or "6-9"), already normalized. */
  month: string;
}

export default function BugHunterDashboardClient({
  findings,
  year,
  month,
}: BugHunterDashboardClientProps) {
  /* --- filters --- */
  const [q, setQ] = useState("");
  const [fCategory, setFCategory] = useState("All");
  const [fSeverity, setFSeverity] = useState("All");
  const [fStatus, setFStatus] = useState("All");
  const [fHunter, setFHunter] = useState("All");
  const [fPlatform, setFPlatform] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showFullActivity, setShowFullActivity] = useState(false);
  const [showFullQaNotes, setShowFullQaNotes] = useState(false);
  const [statModal, setStatModal] = useState<
    "open" | "critical" | "resolution" | "status" | "hunter" | null
  >(null);
  const [statModalStatus, setStatModalStatus] = useState<FindingStatus | null>(
    null,
  );
  const [statModalHunter, setStatModalHunter] = useState<string | null>(null);
  const perPage = 12;

  /* --- open filter state --- */
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  /* --- active dimming & tooltip state for categories --- */
  const [activeCategory, setActiveCategory] = useState<{
    category: string;
    x: number;
    y: number;
    pinned?: boolean;
  } | null>(null);

  /* --- active dimming & tooltip state for trend bars --- */
  const [activeTrend, setActiveTrend] = useState<{
    label: string;
    pinned?: boolean;
  } | null>(null);

  /* --- active dimming & tooltip state for severity donut --- */
  const [activeSeverityDonut, setActiveSeverityDonut] = useState<{
    key: string;
    x: number;
    y: number;
    pinned?: boolean;
  } | null>(null);

  /* Close filter popover on outside click */
  useEffect(() => {
    if (!openFilter) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-filter-popover]")) {
        setOpenFilter(null);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openFilter]);

  /* --- derive filter option lists dynamically from real data --- */
  const HUNTERS_LIST = useMemo(
    () =>
      Array.from(
        new Set(findings.map((f) => f.hunter).filter((h): h is string => !!h)),
      ).sort(),
    [findings],
  );

  const CATEGORIES_LIST = useMemo(
    () =>
      Array.from(
        new Set(
          findings.map((f) => f.category).filter((c): c is string => !!c),
        ),
      ).sort(),
    [findings],
  );

  const SEVERITIES_LIST = useMemo(
    () =>
      Array.from(
        new Set(
          findings.map((f) => f.severity).filter((s): s is string => !!s),
        ),
      ).sort(),
    [findings],
  );

  const STATUSES_LIST = useMemo(
    () =>
      Array.from(
        new Set(findings.map((f) => f.status).filter((s): s is string => !!s)),
      ).sort(),
    [findings],
  );

  const PLATFORMS_LIST = useMemo(
    () =>
      Array.from(
        new Set(
          findings.map((f) => f.platform).filter((p): p is string => !!p),
        ),
      ).sort(),
    [findings],
  );

  const filtered = useMemo(() => {
    return findings.filter((f) => {
      if (q) {
        const lower = q.toLowerCase();
        const matches =
          f.finding.toLowerCase().includes(lower) ||
          (f.hunter?.toLowerCase().includes(lower) ?? false) ||
          (f.module?.toLowerCase().includes(lower) ?? false) ||
          (f.category?.toLowerCase().includes(lower) ?? false);
        if (!matches) return false;
      }
      if (fCategory !== "All" && f.category !== fCategory) return false;
      if (fSeverity !== "All" && f.severity !== fSeverity) return false;
      if (fStatus !== "All" && f.status !== fStatus) return false;
      if (fHunter !== "All" && f.hunter !== fHunter) return false;
      if (fPlatform !== "All" && f.platform !== fPlatform) return false;
      return true;
    });
  }, [findings, q, fCategory, fSeverity, fStatus, fHunter, fPlatform]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, safePage - 3);
    const end = Math.min(totalPages, start + 6);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [safePage, totalPages]);

  const detailFinding = detailId
    ? (findings.find((f) => f.id === detailId) ?? null)
    : null;

  /* --- KPI --- */
  const kpi: BugHunterKpi = useMemo(() => {
    const totalFindings = findings.length;
    const openFindings = findings.filter(
      (f) => !isFindingClosed(f.status),
    ).length;
    const blockerMajor = findings.filter((f) =>
      isFindingCritical(f.severity),
    ).length;
    const resolutionDays = findings
      .map((f) => {
        const resolvedDate = f.docRealizedDate ?? f.liveRealizedDate;
        if (!resolvedDate || !f.dateFound) return null;
        const days =
          (new Date(resolvedDate).getTime() - new Date(f.dateFound).getTime()) /
          86400000;
        return days >= 0 ? days : null;
      })
      .filter((d): d is number => d !== null);
    const avgResolutionDays =
      resolutionDays.length > 0
        ? resolutionDays.reduce((a, b) => a + b, 0) / resolutionDays.length
        : null;
    return {
      totalFindings,
      openFindings,
      blockerMajor,
      avgResolutionDays,
      totalFindingsDelta: null,
      openFindingsDelta: null,
      blockerMajorDelta: null,
      avgResolutionDelta: null,
    };
  }, [findings]);

  /* --- category bars with stacked severity segments --- */
  const categoryBars = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of findings) {
      if (!f.category) continue;
      counts.set(f.category, (counts.get(f.category) || 0) + 1);
    }
    const priorityOrder: Record<string, number> = {
      blocker: 1,
      major: 2,
      minor: 3,
      trivia: 4,
      improvement: 5,
    };
    return Array.from(counts.entries())
      .map(([category, count]) => {
        const catFindings = findings.filter((f) => f.category === category);
        const sevCounts = new Map<string, number>();
        for (const f of catFindings) {
          const sev = f.severity || "Unclassified";
          sevCounts.set(sev, (sevCounts.get(sev) || 0) + 1);
        }
        const sortedSev = Array.from(sevCounts.entries()).sort((a, b) => {
          const ordA = priorityOrder[a[0].toLowerCase()] ?? 99;
          const ordB = priorityOrder[b[0].toLowerCase()] ?? 99;
          return ordA - ordB;
        });
        const segs = sortedSev.map(([sev, cnt]) => ({
          sev,
          count: cnt,
          color: getSeverityColor(sev),
        }));
        return {
          category,
          count,
          segs,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [findings]);

  /* --- severity donut --- */
  const severityDonut: SeverityDonutSeg[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of findings) {
      if (!f.severity) continue;
      counts.set(f.severity, (counts.get(f.severity) || 0) + 1);
    }
    const total = findings.length;
    let acc = 0;
    const segs: SeverityDonutSeg[] = [];
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    for (const [key, n] of sorted) {
      const pct = total > 0 ? (n / total) * 100 : 0;
      const from = acc;
      const to = acc + pct;
      acc = to;
      segs.push({
        key,
        label: key,
        n,
        color: getSeverityColor(key),
        from,
        to,
      });
    }
    return segs;
  }, [findings]);

  const severityArcs = useMemo(() => {
    const size = 150;
    const stroke = 24;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = 0;
    return severityDonut.map((seg) => {
      const dash =
        kpi.totalFindings > 0 ? (seg.n / kpi.totalFindings) * circumference : 0;
      const offset = currentOffset;
      currentOffset += dash;
      return {
        ...seg,
        dash,
        offset,
        radius,
        circumference,
        stroke,
      };
    });
  }, [severityDonut, kpi.totalFindings]);

  /* --- status bars --- */
  const statusBars: StatusBarItem[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of findings) {
      const s = f.status || "Tanpa Status";
      counts.set(s, (counts.get(s) || 0) + 1);
    }
    const total = findings.length;
    return Array.from(counts.entries())
      .map(([status, count]) => ({
        status,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: getStatusColor(status),
      }))
      .sort((a, b) => b.count - a.count);
  }, [findings]);

  /* --- trend bars --- */
  const trendBars: FindingsTrendBar[] = useMemo(() => {
    const selectedYear = Number(year);
    const { start, end } = parseMonthFilter(month);
    const from = start ?? 1;
    const to = end ?? 12;

    const found = new Array(12).fill(0) as number[];
    const resolved = new Array(12).fill(0) as number[];
    for (const f of findings) {
      if (!f.dateFound) continue;
      const [y, m] = f.dateFound.split("-").map(Number);
      if (y !== selectedYear) continue;
      if (m >= 1 && m <= 12) {
        found[m - 1] += 1;
        if (f.docRealizedDate ?? f.liveRealizedDate) resolved[m - 1] += 1;
      }
    }
    const bars: FindingsTrendBar[] = [];
    for (let i = from - 1; i <= to - 1; i++) {
      if (i >= 0 && i < 12) {
        bars.push({
          label: MONTHS[i],
          found: found[i],
          resolved: resolved[i],
          total: found[i],
        });
      }
    }
    return bars;
  }, [findings, year, month]);

  /* --- leaderboard --- */
  const leaderboard: HunterLeaderboardItem[] = useMemo(() => {
    const total = findings.length;
    const rows = HUNTERS_LIST.map((name) => {
      const rows = findings.filter((f) => f.hunter === name);
      const criticalCount = rows.filter((f) =>
        isFindingCritical(f.severity),
      ).length;
      return {
        name,
        findings: rows.length,
        criticalCount,
      };
    }).sort((a, b) => b.findings - a.findings);
    return rows.map((r, i) => ({
      rank: i + 1,
      name: r.name,
      findings: r.findings,
      criticalCount: r.criticalCount,
      share: total > 0 ? Math.round((r.findings / total) * 100) : 0,
    }));
  }, [findings, HUNTERS_LIST]);

  /* --- severity breakdown by month (for hover tooltips) --- */
  const trendSevBreakdown = useMemo(() => {
    const out: Record<string, Record<string, number>> = {};
    for (const f of findings) {
      if (!f.dateFound || !f.severity) continue;
      const d = new Date(f.dateFound);
      if (Number.isNaN(d.getTime())) continue;
      const label = MONTHS[d.getMonth()];
      if (!label) continue;
      if (!out[label]) out[label] = {};
      out[label][f.severity] = (out[label][f.severity] || 0) + 1;
    }
    return out;
  }, [findings]);

  /* --- KPI stat modal content, computed straight from real findings --- */
  const statModalData = useMemo(() => {
    if (statModal === "open") {
      const openFindingsList = findings.filter(
        (f) => !isFindingClosed(f.status),
      );
      const openRowsMap = new Map<string, number>();
      for (const f of openFindingsList) {
        const s = f.status || "Tanpa Status";
        openRowsMap.set(s, (openRowsMap.get(s) || 0) + 1);
      }
      const openRows = Array.from(openRowsMap.entries()).map(
        ([status, count]) => ({
          status,
          count,
        }),
      );
      const openTotal = openFindingsList.length;
      const openCrit = openFindingsList.filter((f) =>
        isFindingCritical(f.severity),
      ).length;
      return {
        icon: <AlertCircle className="h-5 w-5" />,
        iconBg:
          "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
        title: "Open findings",
        subtitle: `${fmt(openTotal)} temuan belum ditutup`,
        tiles: [
          { label: "Open", value: fmt(openTotal), note: "masih ditangani" },
          {
            label: "Resolved",
            value: fmt(kpi.totalFindings - openTotal),
            note: "sudah ditutup",
          },
          {
            label: "Completion",
            value:
              kpi.totalFindings > 0
                ? `${Math.round(((kpi.totalFindings - openTotal) / kpi.totalFindings) * 100)}%`
                : "-",
            note: `dari ${fmt(kpi.totalFindings)} temuan`,
          },
        ],
        rowsLabel: "Status temuan open",
        rows: openRows
          .sort((a, b) => b.count - a.count)
          .map((r) => ({
            label: r.status,
            count: r.count,
            percentage:
              openTotal > 0 ? Math.round((r.count / openTotal) * 100) : 0,
            color: getStatusColor(r.status),
          })),
        footNote: `${openCrit} di antaranya Blocker atau Major`,
      };
    }
    if (statModal === "critical") {
      const crit = findings.filter((f) => isFindingCritical(f.severity));
      const byCategoryMap = new Map<string, number>();
      for (const f of crit) {
        const c = f.category || "Tanpa Kategori";
        byCategoryMap.set(c, (byCategoryMap.get(c) || 0) + 1);
      }
      const byCategory = Array.from(byCategoryMap.entries()).map(
        ([cat, count]) => ({
          status: cat,
          count,
        }),
      );
      const stillOpen = crit.filter((f) => !isFindingClosed(f.status)).length;
      return {
        icon: <ShieldAlert className="h-5 w-5" />,
        iconBg:
          "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
        title: "Blocker & Major",
        subtitle: `${fmt(crit.length)} temuan prioritas tinggi`,
        tiles: [
          {
            label: "Blocker",
            value: fmt(
              crit.filter((f) => f.severity?.toLowerCase() === "blocker")
                .length,
            ),
            note: "severity tertinggi",
          },
          {
            label: "Major",
            value: fmt(
              crit.filter((f) => f.severity?.toLowerCase() === "major").length,
            ),
            note: "perlu perhatian",
          },
          { label: "Masih open", value: fmt(stillOpen), note: "belum ditutup" },
        ],
        rowsLabel: "Sebaran per kategori",
        rows: byCategory
          .sort((a, b) => b.count - a.count)
          .map((r) => ({
            label: r.status,
            count: r.count,
            percentage:
              crit.length > 0 ? Math.round((r.count / crit.length) * 100) : 0,
            color: getCategoryColor(r.status),
          })),
        footNote: `${kpi.totalFindings > 0 ? Math.round((crit.length / kpi.totalFindings) * 100) : 0}% dari seluruh temuan`,
      };
    }
    if (statModal === "resolution") {
      const withDates = findings.filter((f) => {
        const resolvedDate = f.docRealizedDate ?? f.liveRealizedDate;
        if (!resolvedDate || !f.dateFound) return false;
        const diff =
          (new Date(resolvedDate).getTime() - new Date(f.dateFound).getTime()) /
          86400000;
        return diff >= 0;
      });
      const days = withDates.map((f) => {
        const resolvedDate = (f.docRealizedDate ??
          f.liveRealizedDate) as string;
        const diff =
          (new Date(resolvedDate).getTime() -
            new Date(f.dateFound as string).getTime()) /
          86400000;
        return Math.max(0, Math.round(diff));
      });
      const bySeverity = SEVERITIES_LIST.map((sev) => {
        const rows = withDates.filter((f) => f.severity === sev);
        const rowDays = rows.map((f) => {
          const resolvedDate = (f.docRealizedDate ??
            f.liveRealizedDate) as string;
          const diff =
            (new Date(resolvedDate).getTime() -
              new Date(f.dateFound as string).getTime()) /
            86400000;
          return Math.max(0, Math.round(diff));
        });
        const avg = rowDays.length
          ? rowDays.reduce((a, b) => a + b, 0) / rowDays.length
          : 0;
        return { status: sev, count: rows.length, avg };
      }).filter((r) => r.count > 0);
      const maxAvg = Math.max(1, ...bySeverity.map((r) => r.avg));
      return {
        icon: <Clock className="h-5 w-5" />,
        iconBg:
          "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
        title: "Avg resolution",
        subtitle: "Jarak hari dari temuan ditemukan sampai selesai",
        tiles: [
          {
            label: "Rata-rata",
            value:
              kpi.avgResolutionDays !== null
                ? `${kpi.avgResolutionDays.toFixed(1).replace(".", ",")} hr`
                : "-",
            note: "hari kalender",
          },
          {
            label: "Tercepat",
            value: days.length ? `${Math.min(...days)} hr` : "-",
            note: "penyelesaian tersingkat",
          },
          {
            label: "Terlama",
            value: days.length ? `${fmt(Math.max(...days))} hr` : "-",
            note: "penyelesaian terpanjang",
          },
        ],
        rowsLabel: "Rata-rata hari per severity",
        rows: bySeverity.map((r) => ({
          label: r.status,
          count: Number(r.avg.toFixed(1)),
          percentage: Math.round((r.avg / maxAvg) * 100),
          color: getSeverityColor(r.status),
        })),
        footNote: `Dihitung dari ${fmt(withDates.length)} temuan yang punya rentang tanggal selesai valid`,
      };
    }
    if (statModal === "status" && statModalStatus) {
      const rows = findings.filter((f) => f.status === statModalStatus);
      const byCategoryMap = new Map<string, number>();
      for (const f of rows) {
        const c = f.category || "Tanpa Kategori";
        byCategoryMap.set(c, (byCategoryMap.get(c) || 0) + 1);
      }
      const byCategory = Array.from(byCategoryMap.entries()).map(
        ([cat, count]) => ({
          status: cat,
          count,
        }),
      );
      const modules = new Set(
        rows.map((f) => f.module).filter((m): m is string => !!m),
      );
      const critical = rows.filter((f) => isFindingCritical(f.severity)).length;
      const dominantSev = SEVERITIES_LIST.map((sev) => ({
        sev,
        count: rows.filter((f) => f.severity === sev).length,
      }))
        .filter((r) => r.count > 0)
        .sort((a, b) => b.count - a.count);
      return {
        icon: <LayoutGrid className="h-5 w-5" />,
        iconBg:
          "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
        title: statModalStatus,
        subtitle: `${fmt(rows.length)} temuan berstatus ini`,
        tiles: [
          {
            label: "Temuan",
            value: fmt(rows.length),
            note:
              kpi.totalFindings > 0
                ? `${Math.round((rows.length / kpi.totalFindings) * 100)}% dari total`
                : "-",
          },
          {
            label: "Kategori",
            value: fmt(byCategory.length),
            note: `${fmt(modules.size)} modul terkait`,
          },
          {
            label: "Blocker & Major",
            value: fmt(critical),
            note: "prioritas tinggi",
          },
        ],
        rowsLabel: "Sebaran kategori pada status ini",
        rows: byCategory
          .sort((a, b) => b.count - a.count)
          .map((r) => ({
            label: r.status,
            count: r.count,
            percentage:
              rows.length > 0 ? Math.round((r.count / rows.length) * 100) : 0,
            color: getCategoryColor(r.status),
          })),
        footNote: dominantSev.length
          ? `Severity dominan: ${dominantSev
              .slice(0, 3)
              .map((r) => `${r.sev} ${fmt(r.count)}`)
              .join(" \u00b7 ")}`
          : "Severity belum tercatat",
      };
    }
    if (statModal === "hunter" && statModalHunter) {
      const rows = findings.filter((f) => f.hunter === statModalHunter);
      const critical = rows.filter((f) => isFindingCritical(f.severity)).length;
      const resolved = rows.filter(
        (f) => f.docRealizedDate ?? f.liveRealizedDate,
      ).length;
      const bySeverity = SEVERITIES_LIST.map((sev) => ({
        sev,
        count: rows.filter((f) => f.severity === sev).length,
      })).filter((r) => r.count > 0);
      const byCategoryMap = new Map<string, number>();
      for (const f of rows) {
        const c = f.category || "Tanpa Kategori";
        byCategoryMap.set(c, (byCategoryMap.get(c) || 0) + 1);
      }
      const byCategory = Array.from(byCategoryMap.entries())
        .map(([cat, count]) => ({
          cat,
          count,
        }))
        .sort((a, b) => b.count - a.count);
      return {
        icon: (
          <span className="text-[13px] font-bold font-display">
            {initialsOf(statModalHunter)}
          </span>
        ),
        iconBg:
          "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
        title: statModalHunter,
        subtitle: `${fmt(rows.length)} temuan \u00b7 ${
          kpi.totalFindings > 0
            ? Math.round((rows.length / kpi.totalFindings) * 100)
            : 0
        }% dari total pada periode ini`,
        tiles: [
          {
            label: "Temuan",
            value: fmt(rows.length),
            note: `di ${fmt(byCategory.length)} kategori`,
          },
          {
            label: "Blocker & Major",
            value: fmt(critical),
            note: "temuan kritis",
          },
          {
            label: "Selesai",
            value: fmt(resolved),
            note: `${fmt(rows.length - resolved)} masih open`,
          },
        ],
        rowsLabel: "Sebaran severity temuan",
        rows: bySeverity.map((r) => ({
          label: r.sev,
          count: r.count,
          percentage:
            rows.length > 0 ? Math.round((r.count / rows.length) * 100) : 0,
          color: getSeverityColor(r.sev),
        })),
        footNote: byCategory.length
          ? `Kategori terbanyak: ${byCategory
              .slice(0, 3)
              .map((r) => `${r.cat} ${fmt(r.count)}`)
              .join(" \u00b7 ")}`
          : "Kategori belum tercatat",
      };
    }
    return null;
  }, [
    statModal,
    statModalStatus,
    statModalHunter,
    kpi,
    findings,
    SEVERITIES_LIST,
  ]);

  const maxCategoryCount = Math.max(...categoryBars.map((c) => c.count), 1);
  const maxTrend = Math.max(...trendBars.map((b) => b.found), 1);
  const maxStatusCount = Math.max(...statusBars.map((s) => s.count), 1);


  /* --- find peak month --- */
  const peakTrend = useMemo(() => {
    if (!trendBars || trendBars.length === 0) return null;
    let maxIdx = 0;
    for (let i = 1; i < trendBars.length; i++) {
      if (trendBars[i].found > trendBars[maxIdx].found) maxIdx = i;
    }
    return trendBars[maxIdx];
  }, [trendBars]);

  const filters: FilterDef[] = [
    {
      label: "Category",
      value: fCategory,
      opts: ["All", ...CATEGORIES_LIST],
      active: fCategory !== "All",
      icon: <LayoutGrid className="h-[15px] w-[15px]" />,
      onChange: (v) => {
        setFCategory(v);
        setCurrentPage(1);
      },
    },
    {
      label: "Severity",
      value: fSeverity,
      opts: ["All", ...SEVERITIES_LIST],
      active: fSeverity !== "All",
      icon: <AlertTriangle className="h-[15px] w-[15px]" />,
      onChange: (v) => {
        setFSeverity(v);
        setCurrentPage(1);
      },
    },
    {
      label: "Status",
      value: fStatus,
      opts: ["All", ...STATUSES_LIST],
      active: fStatus !== "All",
      icon: <Circle className="h-[15px] w-[15px]" />,
      onChange: (v) => {
        setFStatus(v);
        setCurrentPage(1);
      },
    },
    {
      label: "Hunter",
      value: fHunter,
      opts: ["All", ...HUNTERS_LIST],
      active: fHunter !== "All",
      icon: <Users className="h-[15px] w-[15px]" />,
      onChange: (v) => {
        setFHunter(v);
        setCurrentPage(1);
      },
    },
    {
      label: "Platform",
      value: fPlatform,
      opts: ["All", ...PLATFORMS_LIST],
      active: fPlatform !== "All",
      icon: <Settings className="h-[15px] w-[15px]" />,
      onChange: (v) => {
        setFPlatform(v);
        setCurrentPage(1);
      },
    },
  ];

  const anyFilterActive = filters.some((f) => f.active);

  const resetAllFilters = useCallback(() => {
    setFCategory("All");
    setFSeverity("All");
    setFStatus("All");
    setFHunter("All");
    setFPlatform("All");
    setCurrentPage(1);
  }, []);

  return (
    <div className="w-full space-y-[13px] font-sans">
      {/* ============================================================ */}
      {/*  ROW 1 — KPI CARDS                                           */}
      {/* ============================================================ */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        style={{ gap: 13 }}
      >
        {/* Total Findings */}
        <Card
          variant="featured"
          className="relative min-h-[99px] overflow-hidden rounded-[14px] border border-transparent px-[20px] py-[12px] shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-lg bg-white/15 text-white">
              <SearchCode className="h-4 w-4" />
            </div>
            <DeltaChip value={kpi.totalFindingsDelta} onFeatured />
          </div>
          <div className="mt-[9px] text-[13px] font-semibold leading-tight text-white">
            Total findings
          </div>
          <div className="mt-[2px] text-[11.5px] leading-tight text-blue-100/80">
            Temuan bug hunter
          </div>
          <div className="mt-[8px] text-3xl font-extrabold leading-none tracking-tight text-white font-display">
            {fmt(kpi.totalFindings)}
          </div>
        </Card>

        {/* Open Findings */}
        <Card
          onClick={() => setStatModal("open")}
          className="relative min-h-[99px] cursor-pointer rounded-[14px] border border-zinc-200 bg-white px-[20px] py-[12px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
            </div>
            <ChevronRight className="h-[15px] w-[15px] text-zinc-300 dark:text-zinc-600" />
          </div>
          <div className="mt-[9px] text-[13px] font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
            Open findings
          </div>
          <div className="mt-[2px] text-[11.5px] leading-tight text-zinc-400 dark:text-zinc-500">
            {fmt(kpi.totalFindings - kpi.openFindings)} sudah selesai dari{" "}
            {fmt(kpi.totalFindings)}
          </div>
          <div className="mt-[8px] flex items-end gap-[7px]">
            <span className="text-3xl font-extrabold leading-none tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
              {fmt(kpi.openFindings)}
            </span>
            <ChevronRight className="mb-[4px] h-[15px] w-[15px] text-zinc-300 dark:text-zinc-600" />
          </div>
        </Card>

        {/* Blocker & Major */}
        <Card
          onClick={() => setStatModal("critical")}
          className="relative min-h-[99px] cursor-pointer rounded-[14px] border border-zinc-200 bg-white px-[20px] py-[12px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <ChevronRight className="h-[15px] w-[15px] text-zinc-300 dark:text-zinc-600" />
          </div>
          <div className="mt-[9px] text-[13px] font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
            Blocker & Major
          </div>
          <div className="mt-[2px] text-[11.5px] leading-tight text-zinc-400 dark:text-zinc-500">
            {kpi.totalFindings > 0
              ? Math.round((kpi.blockerMajor / kpi.totalFindings) * 100)
              : 0}
            % dari seluruh temuan
          </div>
          <div className="mt-[8px] flex items-end gap-[7px]">
            <span className="text-3xl font-extrabold leading-none tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
              {fmt(kpi.blockerMajor)}
            </span>
            <ChevronRight className="mb-[4px] h-[15px] w-[15px] text-zinc-300 dark:text-zinc-600" />
          </div>
        </Card>

        {/* Avg Resolution */}
        <Card
          onClick={() => setStatModal("resolution")}
          className="relative min-h-[99px] cursor-pointer rounded-[14px] border border-zinc-200 bg-white px-[20px] py-[12px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Clock className="h-4 w-4" />
            </div>
            <ChevronRight className="h-[15px] w-[15px] text-zinc-300 dark:text-zinc-600" />
          </div>
          <div className="mt-[9px] text-[13px] font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
            Avg resolution
          </div>
          <div className="mt-[2px] text-[11.5px] font-semibold leading-tight text-amber-600 dark:text-amber-400">
            Target: &lt; 5 hari
          </div>
          <div className="mt-[8px] flex items-end gap-[6px]">
            <span className="text-3xl font-extrabold leading-none tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
              {kpi.avgResolutionDays !== null
                ? kpi.avgResolutionDays.toFixed(1)
                : "-"}
            </span>
            <span className="mb-[3px] text-[11px] text-zinc-400 dark:text-zinc-500">
              hari
            </span>
            <ChevronRight className="mb-[4px] h-[15px] w-[15px] text-zinc-300 dark:text-zinc-600" />
          </div>
        </Card>
      </div>

      {/* ============================================================ */}
      {/*  ROW 2 — Findings by Category + Severity Mix                 */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Category Bars */}
        <Card className="rounded-[14px] border border-zinc-200 bg-white px-[18px] py-[14px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Findings by category
              </h3>
              <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
                Sebaran temuan per kategori sistem berdasarkan severity
              </p>
            </div>
            {/* Severity Legend */}
            <div className="flex flex-wrap items-center gap-2.5">
              {SEVERITIES_LIST.map((sev) => (
                <span
                  key={sev}
                  className="inline-flex items-center gap-1 text-[10.5px] text-zinc-500 dark:text-zinc-400"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: getSeverityColor(sev) }}
                  />
                  {sev}
                </span>
              ))}
            </div>
          </div>

          {categoryBars.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Belum Ada Data Temuan"
              description="Data akan muncul setelah sinkronisasi Notion selesai."
              className="mt-2"
            />
          ) : (
            <div className="mt-4 space-y-2.5">
              {categoryBars.map((item) => {
                const isHot = activeCategory?.category === item.category;
                const isDimmed = activeCategory !== null && !isHot;
                return (
                  <div
                    key={item.category}
                    className={`relative grid grid-cols-[140px_1fr_48px] items-center gap-2.5 cursor-pointer transition-opacity duration-150 ${
                      isDimmed ? "opacity-25" : "opacity-100"
                    }`}
                    onClick={() => {
                      setActiveCategory((prev) =>
                        prev?.category === item.category && prev.pinned
                          ? null
                          : {
                              category: item.category,
                              x: 0,
                              y: 0,
                              pinned: true,
                            },
                      );
                    }}
                    onMouseEnter={(e) => {
                      if (activeCategory?.pinned) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      setActiveCategory({
                        category: item.category,
                        x: rect.left + 160,
                        y: rect.top - 8,
                        pinned: false,
                      });
                    }}
                    onMouseLeave={() => {
                      if (!activeCategory?.pinned) setActiveCategory(null);
                    }}
                  >
                    <span className="truncate text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
                      {item.category}
                    </span>
                    <div className="h-[10px] w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="flex h-full overflow-hidden rounded-full"
                        style={{
                          width: `${(item.count / maxCategoryCount) * 100}%`,
                        }}
                      >
                        {item.segs.map(({ sev, count, color }) => (
                          <div
                            key={sev}
                            title={`${sev}: ${count}`}
                            className="h-full transition-opacity hover:opacity-85"
                            style={{
                              width: `${(count / item.count) * 100}%`,
                              backgroundColor: color,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-right text-[11.5px] font-bold text-zinc-700 dark:text-zinc-300 font-display">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Category hover tooltip with design system tooltip */}
          {activeCategory &&
            activeCategory.x > 0 &&
            (() => {
              const cat = categoryBars.find(
                (c) => c.category === activeCategory.category,
              );
              if (!cat) return null;
              return (
                <div
                  className="fixed z-50 w-52 rounded-[10px] border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 pointer-events-none -translate-x-1/2 -translate-y-full"
                  style={{
                    left: activeCategory.x,
                    top: activeCategory.y,
                  }}
                >
                  <div className="mb-2 text-[11.5px] font-bold text-zinc-900 dark:text-zinc-50">
                    {cat.category} · {fmt(cat.count)} temuan
                  </div>
                  <div className="grid grid-cols-[9px_1fr_auto_auto] items-center gap-x-2 gap-y-1.5">
                    {cat.segs.map((s) => (
                      <React.Fragment key={s.sev}>
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: s.color }}
                        />
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {s.sev}
                        </span>
                        <span className="text-right text-[11px] font-bold text-zinc-900 dark:text-zinc-50 font-display">
                          {s.count}
                        </span>
                        <span className="min-w-7 text-right text-[10px] text-zinc-400 dark:text-zinc-500">
                          {Math.round((s.count / cat.count) * 100)}%
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })()}
        </Card>

        {/* Severity Donut */}
        <Card className="rounded-[14px] border border-zinc-200 bg-white px-[18px] py-[14px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Severity mix
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
            Komposisi tingkat prioritas temuan
          </p>

          {kpi.totalFindings === 0 ? (
            <EmptyState
              icon={PieChart}
              title="Belum Ada Data Temuan"
              description="Data akan muncul setelah sinkronisasi Notion selesai."
              className="mt-2"
            />
          ) : (
            <div className="mt-4 flex items-center gap-5">
              <div className="relative h-[150px] w-[150px] shrink-0">
                <svg viewBox="0 0 150 150" className="h-full w-full">
                  <circle
                    cx="75"
                    cy="75"
                    r={63}
                    fill="none"
                    stroke="currentColor"
                    className="text-zinc-100 dark:text-zinc-800"
                    strokeWidth={24}
                  />
                  {severityArcs.map((arc) => {
                    const isHot = activeSeverityDonut?.key === arc.key;
                    const isDimmed = activeSeverityDonut !== null && !isHot;
                    return (
                      <circle
                        key={arc.key}
                        cx="75"
                        cy="75"
                        r={arc.radius}
                        fill="none"
                        stroke={arc.color}
                        strokeWidth={arc.stroke}
                        strokeDasharray={`${arc.dash} ${arc.circumference - arc.dash}`}
                        strokeDashoffset={-arc.offset}
                        transform="rotate(-90 75 75)"
                        className={`cursor-pointer transition-opacity duration-150 ${
                          isDimmed ? "opacity-25" : "opacity-100"
                        }`}
                        onClick={() => {
                          setActiveSeverityDonut((prev) =>
                            prev?.key === arc.key && prev.pinned
                              ? null
                              : { key: arc.key, x: 0, y: 0, pinned: true },
                          );
                        }}
                        onMouseEnter={(e) => {
                          if (activeSeverityDonut?.pinned) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveSeverityDonut({
                            key: arc.key,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                            pinned: false,
                          });
                        }}
                        onMouseLeave={() => {
                          if (!activeSeverityDonut?.pinned)
                            setActiveSeverityDonut(null);
                        }}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold leading-none text-zinc-900 dark:text-zinc-50 font-display">
                    {fmt(kpi.totalFindings)}
                  </span>
                  <span className="mt-0.5 text-[10.5px] text-zinc-400 dark:text-zinc-500">
                    temuan
                  </span>
                </div>
              </div>

              <div className="grid min-w-0 flex-1 grid-cols-[9px_1fr_auto_auto] items-center gap-x-2.5 gap-y-[7px]">
                {severityDonut.map((s) => {
                  const isHot = activeSeverityDonut?.key === s.key;
                  const isDimmed = activeSeverityDonut !== null && !isHot;
                  return (
                    <div
                      key={s.key}
                      className={`col-span-4 grid grid-cols-subgrid items-center cursor-pointer transition-opacity duration-150 ${
                        isDimmed ? "opacity-25" : "opacity-100"
                      }`}
                      onClick={() => {
                        setActiveSeverityDonut((prev) =>
                          prev?.key === s.key && prev.pinned
                            ? null
                            : { key: s.key, x: 0, y: 0, pinned: true },
                        );
                      }}
                      onMouseEnter={(e) => {
                        if (activeSeverityDonut?.pinned) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setActiveSeverityDonut({
                          key: s.key,
                          x: rect.left + 80,
                          y: rect.top - 8,
                          pinned: false,
                        });
                      }}
                      onMouseLeave={() => {
                        if (!activeSeverityDonut?.pinned)
                          setActiveSeverityDonut(null);
                      }}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="line-clamp-2 wrap-break-word text-[11.5px] leading-snug text-zinc-500 dark:text-zinc-400">
                        {s.label}
                      </span>
                      <span className="text-right text-[11.5px] font-bold text-zinc-700 dark:text-zinc-300 font-display">
                        {s.n}
                      </span>
                      <span className="min-w-7 text-right text-[10px] text-zinc-400 dark:text-zinc-500">
                        {kpi.totalFindings > 0
                          ? Math.round((s.n / kpi.totalFindings) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Standard chart tooltip for Severity donut */}
              {activeSeverityDonut &&
                activeSeverityDonut.x > 0 &&
                (() => {
                  const item = severityDonut.find(
                    (s) => s.key === activeSeverityDonut.key,
                  );
                  if (!item) return null;
                  return (
                    <div
                      className="fixed z-50 w-52 rounded-[10px] border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 pointer-events-none -translate-x-1/2 -translate-y-full"
                      style={{
                        left: activeSeverityDonut.x,
                        top: activeSeverityDonut.y,
                      }}
                    >
                      <div className="mb-2 text-[11.5px] font-bold text-zinc-900 dark:text-zinc-50">
                        {item.label}
                      </div>
                      <div className="grid grid-cols-[9px_1fr_auto_auto] items-center gap-x-2 gap-y-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: item.color }}
                        />
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Jumlah temuan
                        </span>
                        <span className="text-right text-[11px] font-bold text-zinc-900 dark:text-zinc-50 font-display">
                          {fmt(item.n)}
                        </span>
                        <span className="min-w-7 text-right text-[10px] text-zinc-400 dark:text-zinc-500">
                          {kpi.totalFindings > 0
                            ? Math.round((item.n / kpi.totalFindings) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  );
                })()}
            </div>
          )}
        </Card>
      </div>

      {/* ============================================================ */}
      {/*  ROW 3 — Findings by Status                                  */}
      {/* ============================================================ */}
      <Card className="rounded-[14px] border border-zinc-200 bg-white px-[18px] py-[14px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          Findings by status
        </h3>
        <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
          {`${statusBars.filter((s) => s.count > 0).length} status aktif \u00b7 ${fmt(kpi.totalFindings)} temuan pada periode ini`}
        </p>

        {kpi.totalFindings === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Belum Ada Data Temuan"
            description="Data akan muncul setelah sinkronisasi Notion selesai."
            className="mt-2"
          />
        ) : (
          <div
            className="mt-4 grid grid-cols-1 sm:grid-cols-2"
            style={{ columnGap: 26, rowGap: 10 }}
          >
            {statusBars.map((item) => (
              <div
                key={item.status}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setStatModalStatus(item.status);
                  setStatModal("status");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setStatModalStatus(item.status);
                    setStatModal("status");
                  }
                }}
                className="grid items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800"
                style={{ gridTemplateColumns: "212px 1fr 44px 50px 16px" }}
              >
                {/* Status pill */}
                <span
                  className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[11.5px] font-bold"
                  style={{
                    backgroundColor: item.color + "26",
                    color: item.color,
                  }}
                >
                  {item.status}
                </span>
                {/* Progress bar */}
                <div className="h-[9px] w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(item.count / maxStatusCount) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                {/* Count */}
                <span className="text-[12.5px] font-bold text-zinc-700 dark:text-zinc-300 font-display text-right">
                  {item.count}
                </span>
                {/* Percentage */}
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 text-right">
                  {item.percentage}%
                </span>
                {/* Chevron */}
                <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ============================================================ */}
      {/*  ROW 4 — Findings Trend + Hunter Leaderboard                 */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
        {/* Findings Trend */}
        <Card className="flex min-w-0 flex-col rounded-[14px] border border-zinc-200 bg-white px-[18px] py-[14px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Findings trend
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
            Temuan per bulan berdasarkan tanggal ditemukan
          </p>

          {kpi.totalFindings === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Belum Ada Data Temuan"
              description="Data akan muncul setelah sinkronisasi Notion selesai."
              className="mt-2"
            />
          ) : (
            <>
              {/* Legend — severity colours match the stacked bar segments */}
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {SEVERITIES_LIST.map((sev) => (
                  <span
                    key={sev}
                    className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: getSeverityColor(sev) }}
                    />
                    {sev}
                  </span>
                ))}
              </div>

              {/* Bars */}
              <div className="mt-3 flex min-h-[190px] flex-1 items-stretch gap-2.5">
                {trendBars.map((bar, i) => {
                  const hot = activeTrend?.label === bar.label;
                  const isDimmed = activeTrend !== null && !hot;
                  const hp =
                    bar.found > 0
                      ? Math.max(2, Math.round((bar.found / maxTrend) * 88))
                      : 0;
                  const tx =
                    i <= 1
                      ? "translateX(-15%)"
                      : i >= trendBars.length - 2
                        ? "translateX(-85%)"
                        : "translateX(-50%)";
                  const segs = Object.entries(
                    trendSevBreakdown[bar.label] || {},
                  )
                    .filter(([, n]) => n > 0)
                    .map(([sev, n]) => ({ sev, n }));
                  return (
                    <div
                      key={bar.label}
                      className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 cursor-pointer transition-opacity duration-150 ${
                        isDimmed ? "opacity-25" : "opacity-100"
                      }`}
                      onClick={() => {
                        if (!bar.found) return;
                        setActiveTrend((prev) =>
                          prev?.label === bar.label && prev.pinned
                            ? null
                            : {
                                label: bar.label,
                                pinned: true,
                              },
                        );
                      }}
                      onMouseEnter={() => {
                        if (!bar.found || activeTrend?.pinned) return;
                        setActiveTrend({
                          label: bar.label,
                          pinned: false,
                        });
                      }}
                      onMouseLeave={() => {
                        if (!activeTrend?.pinned) setActiveTrend(null);
                      }}
                    >
                      {hot && (
                        <div
                          className="absolute bottom-full mb-2 left-1/2 z-40 w-52 rounded-[10px] border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 pointer-events-none"
                          style={{ transform: tx }}
                        >
                          <div className="mb-2 text-[11.5px] font-bold text-zinc-900 dark:text-zinc-50">
                            {bar.label} · {fmt(bar.found)} temuan
                          </div>
                          <div className="grid grid-cols-[9px_1fr_auto_auto] items-center gap-x-2 gap-y-1.5">
                            {segs.map(({ sev, n }) => (
                              <React.Fragment key={sev}>
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{
                                    backgroundColor: getSeverityColor(sev),
                                  }}
                                />
                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                  {sev}
                                </span>
                                <span className="text-right text-[11px] font-bold text-zinc-900 dark:text-zinc-50 font-display">
                                  {n}
                                </span>
                                <span className="min-w-7 text-right text-[10px] text-zinc-400 dark:text-zinc-500">
                                  {bar.found > 0
                                    ? Math.round((n / bar.found) * 100)
                                    : 0}
                                  %
                                </span>
                              </React.Fragment>
                            ))}
                          </div>
                          <div className="mt-2 border-t border-zinc-100 dark:border-zinc-800 pt-1.5 text-[10.5px] text-zinc-400 dark:text-zinc-500">
                            {fmt(bar.found - bar.resolved)} masih open ·{" "}
                            {fmt(bar.resolved)} selesai
                          </div>
                        </div>
                      )}
                      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-end gap-1">
                        <span
                          className={`text-[10px] font-bold font-display ${
                            hot
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {bar.found || ""}
                        </span>
                        <div
                          className="flex w-full max-w-[44px] flex-col-reverse overflow-hidden rounded-t-[5px] bg-zinc-100 dark:bg-zinc-800"
                          style={{ height: `${hp}%` }}
                        >
                          {segs.map(({ sev, n }) => (
                            <div
                              key={sev}
                              className="w-full transition-opacity"
                              style={{
                                height: `${(n / bar.found) * 100}%`,
                                backgroundColor: getSeverityColor(sev),
                                opacity: hot ? 1 : 0.92,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] ${
                          hot
                            ? "font-bold text-blue-600 dark:text-blue-400"
                            : "font-medium text-zinc-400 dark:text-zinc-500"
                        }`}
                      >
                        {bar.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Peak note */}
              {peakTrend && peakTrend.found > 0 && (
                <p className="mt-2.5 border-t border-zinc-100 pt-2.5 text-[11.5px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                  Puncak temuan pada{" "}
                  <span className="font-bold text-zinc-600 dark:text-zinc-300">
                    {peakTrend.label}
                  </span>{" "}
                  ·{" "}
                  <span className="font-bold text-zinc-600 dark:text-zinc-300">
                    {fmt(peakTrend.found)}
                  </span>{" "}
                  temuan
                </p>
              )}
            </>
          )}
        </Card>

        {/* Hunter Leaderboard */}
        <Card className="rounded-[14px] border border-zinc-200 bg-white px-[18px] py-[14px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
            <Trophy className="h-4 w-4 text-amber-500" />
            Hunter leaderboard
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
            {`Kontribusi ${HUNTERS_LIST.length} bug hunter \u00b7 ${fmt(findings.length)} temuan pada periode ini`}
          </p>

          {leaderboard.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="Belum Ada Data Hunter"
              description="Data akan muncul setelah sinkronisasi Notion selesai."
              className="mt-2"
            />
          ) : (
            <div className="mt-4 space-y-2">
              {leaderboard.map((hunter) => {
                const kritisCount = hunter.criticalCount;

                return (
                  <div
                    key={hunter.name}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setStatModalHunter(hunter.name);
                      setStatModal("hunter");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setStatModalHunter(hunter.name);
                        setStatModal("hunter");
                      }
                    }}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg p-2.5 transition-colors ${
                      hunter.rank === 1
                        ? "bg-blue-50/60 border border-blue-100 hover:bg-blue-100/60 dark:bg-blue-950/20 dark:border-blue-900/40 dark:hover:bg-blue-950/40"
                        : "bg-zinc-50/60 border border-zinc-100 hover:bg-zinc-100/80 dark:bg-zinc-800/30 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    {/* Rank circle */}
                    <span
                      className={`inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold font-display ${
                        hunter.rank === 1
                          ? "bg-blue-600 text-white dark:bg-blue-500"
                          : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                      }`}
                    >
                      {hunter.rank}
                    </span>

                    {/* Name + progress bar + percentage */}
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
                        {hunter.name}
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${hunter.share}%`,
                              backgroundColor: "#3B82F6",
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                          {hunter.share}%
                        </span>
                      </div>
                    </div>

                    {/* Big findings count */}
                    <div className="text-right shrink-0">
                      <span className="block text-[17px] font-extrabold leading-none text-zinc-900 dark:text-zinc-50 font-display">
                        {hunter.findings}
                      </span>
                      <span className="text-[9.5px] text-zinc-400 dark:text-zinc-500">
                        temuan
                      </span>
                    </div>

                    {/* Single "kritis" badge */}
                    {kritisCount > 0 && (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/70 dark:text-rose-400">
                        {kritisCount} kritis
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ============================================================ */}
      {/*  ROW 5 — FINDINGS LIST TABLE                                  */}
      {/* ============================================================ */}
      <Card className="rounded-[14px] border border-zinc-200 bg-white px-[18px] py-[14px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="mb-3.5">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            Findings list
          </h3>
          <p className="mt-0.5 text-[13px] text-zinc-400 dark:text-zinc-500">
            {fmt(filtered.length)} temuan pada periode terpilih
          </p>
        </div>

        {/* Toolbar — filters → reset → search → export */}
        <div className="mb-3.5 flex flex-wrap items-center gap-2">
          {/* Filter chips first */}
          {filters.map((f) => (
            <div key={f.label} data-filter-popover>
              <FilterChip
                f={f}
                isOpen={openFilter === f.label}
                onToggle={() =>
                  setOpenFilter(openFilter === f.label ? null : f.label)
                }
              />
            </div>
          ))}

          {/* Reset all filters button */}
          {anyFilterActive && (
            <button
              onClick={resetAllFilters}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
              aria-label="Reset semua filter"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Search input */}
          <label className="flex h-9 min-w-52 flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 transition-colors focus-within:border-blue-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
            <Search className="h-3.75 w-3.75 shrink-0 text-zinc-400 dark:text-zinc-500" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari temuan, modul, atau hunter"
              className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-300 dark:placeholder:text-zinc-500"
            />
          </label>

          {/* Export button last */}
          <button className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
            <Download className="h-4 w-4" />
          </button>
        </div>

        {/* Table */}
        {findings.length === 0 ? (
          <EmptyState
            icon={SearchCode}
            title="Belum Ada Data Bug Hunter"
            description="Data akan tersedia setelah sinkronisasi Notion selesai."
            height={260}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Tidak Ditemukan"
            description="Tidak ada temuan yang cocok dengan filter ini."
            height={260}
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header row */}
              <div
                className="grid gap-2 border-b border-zinc-100 p-2 dark:border-zinc-800"
                style={{ gridTemplateColumns: FINDING_LIST_COLUMNS }}
              >
                {[
                  "Finding",
                  "Category",
                  "Module",
                  "Severity",
                  "Platform",
                  "Hunter",
                  "Date found",
                  "Status",
                ].map((h, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Data rows */}
              {pageRows.map((f) => (
                <div
                  key={f.id}
                  onMouseDown={() => {
                    setOpenFilter(null);
                    setShowFullActivity(false);
                    setShowFullQaNotes(false);
                    setDetailId(f.id);
                  }}
                  onClick={() => {
                    setOpenFilter(null);
                    setShowFullActivity(false);
                    setShowFullQaNotes(false);
                    setDetailId(f.id);
                  }}
                  className="grid cursor-pointer items-center gap-2 border-b border-zinc-100 p-2 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  style={{ gridTemplateColumns: FINDING_LIST_COLUMNS }}
                >
                  {/* Finding name (max 2 lines; full text in the detail modal) */}
                  <span className="min-w-0">
                    <span className="line-clamp-2 break-words wrap-break-word text-[12.5px] font-semibold leading-snug text-zinc-700 dark:text-zinc-300">
                      {f.finding}
                    </span>
                  </span>
                  <span className="line-clamp-2 min-w-0 break-words wrap-break-word text-[11.5px] leading-snug text-zinc-500 dark:text-zinc-400">
                    {f.category ?? "-"}
                  </span>
                  <span className="line-clamp-2 min-w-0 break-words wrap-break-word text-[11.5px] leading-snug text-zinc-500 dark:text-zinc-400">
                    {f.module ?? "-"}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`${WRAP_PILL} text-[10.5px] ${getSeverityPill(f.severity)}`}
                    >
                      {f.severity ?? "-"}
                    </span>
                  </span>
                  <span className="line-clamp-2 min-w-0 break-words wrap-break-word text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                    {f.platform ?? "-"}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`${WRAP_PILL} bg-blue-100 text-[11px] text-blue-700 dark:bg-blue-950/70 dark:text-blue-400`}
                    >
                      {f.hunter ?? "-"}
                    </span>
                  </span>
                  <span className="whitespace-nowrap text-[11px] text-zinc-500 dark:text-zinc-400">
                    {formatDate(f.dateFound)}
                  </span>
                  {/* Status column */}
                  <span className="min-w-0">
                    <span
                      className={`${WRAP_PILL} text-[10.5px] ${getStatusPill(f.status)}`}
                    >
                      {f.status ?? "-"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-2 pt-3.5">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              Menampilkan {(safePage - 1) * perPage + 1}–
              {Math.min(safePage * perPage, filtered.length)} dari{" "}
              {fmt(filtered.length)} finding
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  className={`h-6.5 min-w-6.5 rounded-md border px-1.5 text-xs font-semibold transition-colors ${
                    n === safePage
                      ? "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-400"
                      : "border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, safePage + 1))
                }
                className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ============================================================ */}
      {/*  KPI STAT MODAL                                               */}
      {/* ============================================================ */}
      {statModal && statModalData && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setStatModal(null);
              setStatModalStatus(null);
              setStatModalHunter(null);
            }
          }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4 font-sans"
        >
          <div className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-[14px] bg-white shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${statModalData.iconBg}`}
              >
                {statModalData.icon}
              </div>
              <div>
                <div className="text-[17px] font-bold text-zinc-900 dark:text-zinc-50">
                  {statModalData.title}
                </div>
                <div className="mt-1 text-[12.5px] text-zinc-400 dark:text-zinc-500">
                  {statModalData.subtitle}
                </div>
              </div>
              <button
                onClick={() => {
                  setStatModal(null);
                  setStatModalStatus(null);
                  setStatModalHunter(null);
                }}
                className="ml-auto inline-flex h-7.5 w-7.5 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 px-6 py-4">
              {statModalData.tiles.map((t) => (
                <div
                  key={t.label}
                  className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/40"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {t.label}
                  </div>
                  <div className="mt-1 text-[21px] font-extrabold font-display">
                    {t.value}
                  </div>
                  <div className="mt-1 text-[10px] text-zinc-400">{t.note}</div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {statModalData.rowsLabel}
              </div>
              {statModalData.rows.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="Belum Ada Data"
                  description="Data akan muncul setelah sinkronisasi Notion selesai."
                  height={140}
                />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {statModalData.rows.map((r) => (
                    <div
                      key={r.label}
                      className="grid grid-cols-[148px_1fr_46px_84px] items-center gap-3"
                    >
                      <span className="truncate text-[12px] text-zinc-700 dark:text-zinc-300">
                        {r.label}
                      </span>
                      <span className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${r.percentage}%`,
                            backgroundColor: r.color,
                          }}
                        />
                      </span>
                      <span className="text-right text-[12px] font-bold font-display">
                        {r.count}
                      </span>
                      <span className="text-right">
                        <span className="rounded-full bg-zinc-50 px-2 py-0.5 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800">
                          {r.percentage}%
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
                {statModalData.footNote}
              </div>
            </div>
            <div className="flex items-center border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
              <span className="text-[11.5px] text-zinc-400 dark:text-zinc-500">
                Data bersumber dari list bug hunter · hanya dapat dibaca
              </span>
              <button
                onClick={() => {
                  setStatModal(null);
                  setStatModalStatus(null);
                  setStatModalHunter(null);
                }}
                className="ml-auto rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  DETAIL MODAL                                                 */}
      {/* ============================================================ */}
      {detailFinding && (
        <div
          onClick={() => {
            setShowFullActivity(false);
            setShowFullQaNotes(false);
            setDetailId(null);
          }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4 font-sans"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
          >
            {/* Header */}
            <div className="flex items-start gap-3.5 rounded-t-2xl border-b border-zinc-100 bg-zinc-50 px-6 py-5 dark:border-zinc-800 dark:bg-zinc-800/50">
              <div className="min-w-0 flex-1">
                <div className="text-[17px] font-bold text-zinc-900 dark:text-zinc-50">
                  {toDisplayText(detailFinding.finding)}
                </div>
                {detailFinding.subMenu && (
                  <div className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                    {toDisplayText(detailFinding.subMenu)}
                  </div>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-zinc-200/70 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 tabular-nums">
                    {detailFinding.id}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getStatusPill(detailFinding.status)}`}
                  >
                    {detailFinding.status ?? "-"}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getSeverityPill(detailFinding.severity)}`}
                  >
                    {detailFinding.severity ?? "-"}
                  </span>
                  {detailFinding.priority && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getPriorityPill(detailFinding.priority)}`}
                    >
                      {detailFinding.priority}
                    </span>
                  )}
                  <span className="rounded-full bg-zinc-200/70 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    {detailFinding.platform ?? "-"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowFullActivity(false);
                  setShowFullQaNotes(false);
                  setDetailId(null);
                }}
                className="inline-flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-200/70 dark:text-zinc-500 dark:hover:bg-zinc-700"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Summary tiles */}
            <div className="grid grid-cols-2 gap-3 px-6 py-4.5 md:grid-cols-4">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Severity
                </div>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getSeverityPill(detailFinding.severity)}`}
                >
                  {detailFinding.severity ?? "-"}
                </span>
                <div className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                  Tingkat prioritas temuan
                </div>
              </div>
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Platform
                </div>
                <span className="inline-block rounded-full bg-zinc-200/70 px-2.5 py-0.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {detailFinding.platform ?? "-"}
                </span>
                <div className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                  Kanal tempat temuan muncul
                </div>
              </div>
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Status
                </div>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getStatusPill(detailFinding.status)}`}
                >
                  {detailFinding.status ?? "-"}
                </span>
                <div className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                  Status penanganan temuan
                </div>
              </div>
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Berulang
                </div>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    detailFinding.recurring
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400"
                  }`}
                >
                  {detailFinding.recurring ? "Ya" : "Tidak"}
                </span>
                <div className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                  Status pengulangan temuan
                </div>
              </div>
            </div>

            {/* Main detail layout */}
            <div className="grid grid-cols-1 gap-5 px-6 pb-5.5 pt-1 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <section>
                  <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Resolution
                  </div>
                  <div className="rounded-2xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    {(() => {
                      const statusClosed =
                        detailFinding.status === "DONE" ||
                        detailFinding.status === "CLOSED";
                      const steps = [
                        {
                          label: "Date found",
                          value: detailFinding.dateFound,
                          done: Boolean(detailFinding.dateFound),
                        },
                        {
                          label: "Doc realized",
                          value: detailFinding.docRealizedDate,
                          done: Boolean(detailFinding.docRealizedDate),
                        },
                        {
                          label: "Live realized",
                          value: detailFinding.liveRealizedDate,
                          done: Boolean(detailFinding.liveRealizedDate),
                        },
                      ];
                      const completed = steps.filter((s) => s.done).length;
                      return (
                        <>
                          <div className="mb-3 flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                              <span
                                className={`block h-full rounded-full ${
                                  statusClosed
                                    ? "bg-emerald-500"
                                    : "bg-blue-600"
                                }`}
                                style={{
                                  width: statusClosed
                                    ? "100%"
                                    : `${Math.max(8, (completed / steps.length) * 100)}%`,
                                }}
                              />
                            </div>
                            {statusClosed &&
                              !detailFinding.docRealizedDate &&
                              !detailFinding.liveRealizedDate && (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                  Closed by status
                                </span>
                              )}
                          </div>
                          <div className="grid grid-cols-[1fr_1fr_1fr] gap-3">
                            {steps.map((step) => (
                              <div key={step.label}>
                                <div className="mb-2 flex items-center gap-2">
                                  <span
                                    className={`h-3 w-3 rounded-full ring-4 ${
                                      step.done
                                        ? "bg-blue-600 ring-blue-50 dark:ring-blue-950/40"
                                        : statusClosed
                                          ? "bg-emerald-500 ring-emerald-50 dark:ring-emerald-950/40"
                                          : "bg-zinc-200 ring-zinc-50 dark:bg-zinc-700 dark:ring-zinc-800"
                                    }`}
                                  />
                                </div>
                                <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                                  {step.label}
                                </div>
                                <div className="mt-1 text-[12px] font-bold text-zinc-700 dark:text-zinc-300">
                                  {step.value
                                    ? formatDate(step.value)
                                    : statusClosed &&
                                        step.label !== "Date found"
                                      ? "closed"
                                      : "-"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </section>

                <section>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Activity log
                  </div>
                  {(() => {
                    const entries = parseActivityLog(
                      detailFinding.progressPenyelesaian,
                    );
                    const visible = showFullActivity
                      ? entries
                      : entries.slice(0, 6);
                    const hidden = entries.length - visible.length;
                    if (entries.length === 0) {
                      return (
                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 px-4 py-3.5 text-[13px] text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-500">
                          Belum ada activity log
                        </div>
                      );
                    }
                    return (
                      <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                        <div className="relative space-y-4 before:absolute before:left-[5px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-blue-100 dark:before:bg-blue-950">
                          {visible.map((entry, idx) => (
                            <div
                              key={`${entry.date}-${idx}`}
                              className="relative pl-5"
                            >
                              <span
                                className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${
                                  idx === 0
                                    ? "bg-blue-600"
                                    : "bg-blue-200 dark:bg-blue-800"
                                }`}
                              />
                              <div className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
                                {entry.date}
                              </div>
                              <div className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                                {entry.note || "-"}
                              </div>
                            </div>
                          ))}
                        </div>
                        {hidden > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowFullActivity(true)}
                            className="mt-3 text-[12px] font-bold text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                          >
                            Lihat {hidden} entri lainnya
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </section>

                <section>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    QA notes
                  </div>
                  {(() => {
                    const entries = parseActivityLog(detailFinding.progressQA);
                    const visible = showFullQaNotes
                      ? entries
                      : entries.slice(0, 4);
                    const hidden = entries.length - visible.length;
                    if (entries.length === 0) {
                      return (
                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 px-4 py-3.5 text-[13px] text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-500">
                          Belum ada QA notes
                        </div>
                      );
                    }
                    return (
                      <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                        <div className="relative space-y-4 before:absolute before:left-[5px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-emerald-100 dark:before:bg-emerald-950">
                          {visible.map((entry, idx) => (
                            <div
                              key={`${entry.date}-${idx}`}
                              className="relative pl-5"
                            >
                              <span
                                className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${
                                  idx === 0
                                    ? "bg-emerald-600"
                                    : "bg-emerald-200 dark:bg-emerald-800"
                                }`}
                              />
                              <div className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
                                {entry.date}
                              </div>
                              <div className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                                {entry.note || "-"}
                              </div>
                            </div>
                          ))}
                        </div>
                        {hidden > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowFullQaNotes(true)}
                            className="mt-3 text-[12px] font-bold text-emerald-600 underline-offset-2 hover:underline dark:text-emerald-400"
                          >
                            Lihat {hidden} entri lainnya
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </section>
              </div>

              <aside className="space-y-4">
                <section>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    People
                  </div>
                  <div className="space-y-2.5 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                    {[
                      [
                        detailFinding.hunter,
                        "Hunter",
                        toDisplayText(detailFinding.category),
                      ],
                      [
                        detailFinding.devName,
                        "Dev",
                        "Developer penanggung jawab",
                      ],
                      [detailFinding.bizdevName, "Bizdev", "PIC Bizdev"],
                    ].map(([name, role, note]) => (
                      <div
                        key={role}
                        className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800"
                      >
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-400 font-display">
                          {name ? initialsOf(String(name)) : "-"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12.5px] font-bold text-zinc-800 dark:text-zinc-200">
                            {name || "-"}
                          </div>
                          <div className="truncate text-[10.5px] text-zinc-400 dark:text-zinc-500">
                            {note || "-"}
                          </div>
                        </div>
                        <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                          {role}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Classification
                  </div>
                  <div className="rounded-2xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    {[
                      ["Category", detailFinding.category],
                      ["Module", toDisplayText(detailFinding.module)],
                      ["Sub menu", toDisplayText(detailFinding.subMenu)],
                      ["Priority", detailFinding.priority],
                      [
                        "Last update",
                        formatLastUpdateDate(detailFinding.lastUpdate),
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="grid grid-cols-[92px_minmax(0,1fr)] items-start gap-3 border-b border-zinc-100 py-2 last:border-b-0 dark:border-zinc-800"
                      >
                        <span className="text-[11.5px] text-zinc-400 dark:text-zinc-500">
                          {label}
                        </span>
                        <span className="min-w-0 whitespace-pre-wrap wrap-break-word text-right text-[12px] font-medium leading-relaxed text-zinc-700 dark:text-zinc-300">
                          {value || "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </div>

            {/* Footer */}
            <div className="flex items-center border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
              <span className="text-[11.5px] text-zinc-400 dark:text-zinc-500">
                Data bersumber dari list bug hunter · hanya dapat dibaca
              </span>
              <button
                onClick={() => {
                  setShowFullActivity(false);
                  setShowFullQaNotes(false);
                  setDetailId(null);
                }}
                className="ml-auto rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
