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
import {
  ClipboardCheck,
  Star,
  Clock,
  Users,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  TrendingDown,
  Check,
  Download,
  LayoutGrid,
  Ticket,
  Circle,
  BarChart3,
  SearchX,
} from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { WRAP_PILL } from "@/components/shared/tableStyles";
import type {
  QaTask,
  QaTaskKpi,
  TaskVolumeBar,
  TaskTypeDonutSeg,
  TesterWorkloadItem,
  StatusDonutSeg,
  KnownTaskType,
  TaskType,
  TaskStatus,
} from "../types/qaTasksTypes";

/* ================================================================== */
/*  STATIC CONFIG — fixed enums / palettes (NOT dummy data)           */
/* ================================================================== */

/** Known types in their display order. Types added in Notion later are picked
 *  up from the data (see withUnknown), so this list never hides a task. */
const TASK_TYPES: KnownTaskType[] = [
  "SIT",
  "Testing",
  "Manual Guide",
  "Blueprint",
  "Draft Testing",
  "Monkey Test",
  "Create Trip",
  "Create",
  "Pembuatan Video",
  "Data Local",
  "Pembuatan Trip Melalui Desktop",
  "Pembuatan Trip Melalui Desktop s.d Muncul di DCT Loading",
  "Temuan",
  "Bug Hunter",
  "Monitoring",
];

const TASK_STATUSES: TaskStatus[] = [
  "On Progress",
  "Reviewing",
  "In fixing",
  "Done",
];

const DEPARTMENTS = ["PIC PROJECT", "BIZDEV", "ADMIN IT SUPPORT", "DEV", "RnD"];

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

const TYPE_COLORS: Record<KnownTaskType, string> = {
  SIT: "#10B981",
  Testing: "#2563EB",
  "Manual Guide": "#F59E0B",
  Blueprint: "#EF4444",
  "Draft Testing": "#60A5FA",
  "Monkey Test": "#8B5CF6",
  "Create Trip": "#EC4899",
  Create: "#14B8A6",
  "Pembuatan Video": "#F97316",
  "Data Local": "#6366F1",
  "Pembuatan Trip Melalui Desktop": "#84CC16",
  "Pembuatan Trip Melalui Desktop s.d Muncul di DCT Loading": "#0EA5E9",
  Temuan: "#D946EF",
  "Bug Hunter": "#F43F5E",
  Monitoring: "#78716C",
};

/** Colours for types not in TYPE_COLORS, picked from the type name so a new
 *  type keeps the same colour in every period and chart. */
const EXTRA_TYPE_COLORS = [
  "#0F766E",
  "#9333EA",
  "#B45309",
  "#BE123C",
  "#4D7C0F",
  "#0369A1",
];

const STATUS_COLORS: Record<TaskStatus, string> = {
  Done: "#10B981",
  "On Progress": "#2563EB",
  Reviewing: "#F59E0B",
  "In fixing": "#EF4444",
};

/* ================================================================== */
/*  PILL STYLES                                                       */
/* ================================================================== */

const STATUS_PILL: Record<TaskStatus, string> = {
  Done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400",
  "On Progress":
    "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400",
  Reviewing:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400",
  "In fixing":
    "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400",
};

const BOBOT_PILL: Record<string, string> = {
  Hard: "bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400",
  Medium: "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400",
  Easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400",
};

/** Shared by the task list header and rows. Text columns flex and wrap to two
 *  lines, so the table fits about 830px before it needs horizontal scroll. */
const TASK_LIST_COLUMNS =
  "minmax(150px,4fr) minmax(92px,1fr) 88px 112px minmax(136px,1fr) 76px 60px 44px";

function typeColor(type: TaskType | null): string {
  if (!type) return "#9CA3AF";
  if (Object.hasOwn(TYPE_COLORS, type))
    return TYPE_COLORS[type as KnownTaskType];
  let hash = 0;
  for (const ch of type) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return EXTRA_TYPE_COLORS[hash % EXTRA_TYPE_COLORS.length];
}

/** Known options in their fixed order, then any value Notion gained since
 *  (A–Z), so a new option still shows up in charts and filters. */
function withUnknown(
  known: readonly string[],
  values: (string | null)[],
): string[] {
  const extra = new Set<string>();
  for (const v of values) if (v && !known.includes(v)) extra.add(v);
  return [...known, ...[...extra].sort()];
}

function deptTone(dept: string): { bg: string; fg: string } {
  switch (dept) {
    case "PIC PROJECT":
      return {
        bg: "bg-blue-100 dark:bg-blue-950/70",
        fg: "text-blue-700 dark:text-blue-400",
      };
    case "BIZDEV":
      return {
        bg: "bg-amber-100 dark:bg-amber-950/70",
        fg: "text-amber-700 dark:text-amber-400",
      };
    case "DEV":
      return {
        bg: "bg-emerald-100 dark:bg-emerald-950/70",
        fg: "text-emerald-700 dark:text-emerald-400",
      };
    default:
      return {
        bg: "bg-violet-100 dark:bg-violet-950/70",
        fg: "text-violet-700 dark:text-violet-400",
      };
  }
}

/* ================================================================== */
/*  HELPERS — null-safe formatting                                    */
/* ================================================================== */

function formatDuration(minutes: number | null, long = false): string {
  if (minutes === null || minutes === undefined) return "-";
  const rounded = Math.round(minutes);
  if (rounded <= 0) return long ? "0 menit" : "0m";
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h > 0 && m === 0) return long ? `${h} jam` : `${h}j`;
  if (h === 0 && m > 0) return long ? `${m} menit` : `${m}m`;
  return `${h}j ${m}m`;
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

interface FilterDef {
  label: string;
  value: string;
  opts: string[];
  active: boolean;
  onChange: (v: string) => void;
  id: string; // unique identifier for open/close state
  icon: React.ReactNode;
}

function FilterChip({
  f,
  openFilter,
  setOpenFilter,
}: {
  f: FilterDef;
  openFilter: string | null;
  setOpenFilter: (v: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isOpen = openFilter === f.id;

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenFilter(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setOpenFilter]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpenFilter(isOpen ? null : f.id)}
        title={f.label}
        className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border bg-white px-3 transition-colors dark:bg-zinc-900 ${
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
        <div className="absolute left-0 top-[42px] z-50 min-w-[206px] max-h-[292px] overflow-y-auto rounded-xl border border-zinc-200 shadow-lg p-1.5 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <div className="px-2.5 pb-1.5 pt-1 text-[9.5px] font-bold uppercase tracking-wider text-zinc-300 dark:text-zinc-600">
            {f.label}
          </div>
          {f.opts.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                f.onChange(o);
                setOpenFilter(null);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                o === f.value
                  ? "font-bold text-blue-600 dark:text-blue-400"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-left">
                {o === "All" ? "Semua" : o}
              </span>
              {o === f.value && (
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

/* ================================================================== */
/*  MAIN COMPONENT                                                    */
/* ================================================================== */

interface QaTasksDashboardClientProps {
  tasks: QaTask[];
  /** Global year filter (already normalized by the page). */
  year: string;
  /** Global month filter ("ALL", "9", or "6-9"), already normalized. */
  month: string;
}

export default function QaTasksDashboardClient({
  tasks,
  year,
  month,
}: QaTasksDashboardClientProps) {
  /* --- filters --- */
  const [q, setQ] = useState("");
  const [fDept, setFDept] = useState("All");
  const [fType, setFType] = useState("All");
  const [fTester, setFTester] = useState("All");
  const [fStatus, setFStatus] = useState("All");
  const [fBobot, setFBobot] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [statModal, setStatModal] = useState<"testers" | null>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const perPage = 12;

  /* --- active dimming & tooltip state for volume bars --- */
  const [activeBar, setActiveBar] = useState<{
    label: string;
    pinned?: boolean;
  } | null>(null);
  /* --- active dimming & tooltip state for workload rows --- */
  const [activeWorkload, setActiveWorkload] = useState<{
    name: string;
    x: number;
    y: number;
    pinned?: boolean;
  } | null>(null);
  /* --- active dimming & tooltip state for Task Type donut --- */
  const [activeType, setActiveType] = useState<{
    key: string;
    x: number;
    y: number;
    pinned?: boolean;
  } | null>(null);
  /* --- active dimming & tooltip state for Status Task donut --- */
  const [activeStatus, setActiveStatus] = useState<{
    key: string;
    x: number;
    y: number;
    pinned?: boolean;
  } | null>(null);

  /* --- filter option lists derived from real data --- */
  const TESTERS_LIST = useMemo(
    () => Array.from(new Set(tasks.flatMap((t) => t.testers))).sort(),
    [tasks],
  );
  const TYPES_LIST = useMemo(
    () =>
      withUnknown(
        TASK_TYPES,
        tasks.map((t) => t.taskType),
      ),
    [tasks],
  );
  const DEPTS_LIST = useMemo(
    () =>
      withUnknown(
        DEPARTMENTS,
        tasks.map((t) => t.department),
      ),
    [tasks],
  );
  const STATUSES_LIST = useMemo(
    () =>
      withUnknown(
        TASK_STATUSES,
        tasks.map((t) => t.status),
      ),
    [tasks],
  );
  const BOBOTS_LIST = useMemo(
    () =>
      withUnknown(
        ["Easy", "Medium", "Hard"],
        tasks.map((t) => t.bobot),
      ),
    [tasks],
  );

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (q) {
        const lower = q.toLowerCase();
        const matchesName = t.taskName.toLowerCase().includes(lower);
        const matchesAssignor = (t.assignor ?? "")
          .toLowerCase()
          .includes(lower);
        const matchesTester = t.testers.some((te) =>
          te.toLowerCase().includes(lower),
        );
        const matchesDept = (t.department ?? "").toLowerCase().includes(lower);
        if (!matchesName && !matchesAssignor && !matchesTester && !matchesDept)
          return false;
      }
      if (fDept !== "All" && t.department !== fDept) return false;
      if (fType !== "All" && t.taskType !== fType) return false;
      if (fTester !== "All" && !t.testers.includes(fTester)) return false;
      if (fStatus !== "All" && t.status !== fStatus) return false;
      if (fBobot !== "All" && t.bobot !== fBobot) return false;
      return true;
    });
  }, [tasks, q, fDept, fType, fTester, fStatus, fBobot]);

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

  const detailTask = detailId
    ? (tasks.find((t) => t.id === detailId) ?? null)
    : null;

  /* --- KPI --- */
  const scoredCount = useMemo(
    () => tasks.filter((t) => t.score !== null).length,
    [tasks],
  );
  const withDurationCount = useMemo(
    () => tasks.filter((t) => t.durationMinutes !== null).length,
    [tasks],
  );

  const kpi: QaTaskKpi = useMemo(() => {
    const totalTasks = tasks.length;
    const scored = tasks.filter((t) => t.score !== null);
    const avgScore =
      scored.length > 0
        ? scored.reduce((sum, t) => sum + (t.score as number), 0) /
          scored.length
        : null;
    const testingHours =
      tasks.reduce((sum, t) => sum + (t.durationMinutes ?? 0), 0) / 60;
    const activeTesters = new Set(tasks.flatMap((t) => t.testers)).size;
    return {
      totalTasks,
      avgScore,
      testingHours: Math.round(testingHours),
      activeTesters,
      totalTasksDelta: null,
      avgScoreDelta: null,
      testingHoursDelta: null,
      activeTestersDelta: null,
    };
  }, [tasks]);

  /* --- Task volume trend (per-month, grouped by dateAssign).
     Only months inside the selected period are shown, and for the current
     year the axis stops at the current month so future months never appear. --- */
  const volumeBars: TaskVolumeBar[] = useMemo(() => {
    const now = new Date();
    const selectedYear = Number(year);
    const lastVisibleMonth =
      selectedYear === now.getFullYear()
        ? now.getMonth() + 1
        : selectedYear > now.getFullYear()
          ? 0
          : 12;
    const { start, end } = parseMonthFilter(month);
    const from = start ?? 1;
    const to = Math.min(end ?? 12, lastVisibleMonth);

    const bars: TaskVolumeBar[] = [];
    for (let idx = from - 1; idx <= to - 1; idx++) {
      let done = 0;
      let onProgress = 0;
      let reviewing = 0;
      let inFixing = 0;
      let total = 0;
      tasks.forEach((t) => {
        if (!t.dateAssign) return;
        const [y, m] = t.dateAssign.split("-").map(Number);
        if (y !== selectedYear || m - 1 !== idx) return;
        total += 1;
        if (t.status === "Done") done += 1;
        else if (t.status === "On Progress") onProgress += 1;
        else if (t.status === "Reviewing") reviewing += 1;
        else if (t.status === "In fixing") inFixing += 1;
      });
      bars.push({
        label: MONTHS[idx],
        done,
        onProgress,
        reviewing,
        inFixing,
        total,
      });
    }
    return bars;
  }, [tasks, year, month]);

  /* --- Task type donut (all types with n > 0, sorted desc). The legend
     panel below is height-limited to ~5 rows and scrolls for the rest. --- */
  const typeDonut: TaskTypeDonutSeg[] = useMemo(() => {
    const counts = new Map<TaskType, number>();
    tasks.forEach((t) => {
      if (!t.taskType) return;
      counts.set(t.taskType, (counts.get(t.taskType) ?? 0) + 1);
    });
    const entries = TYPES_LIST.map((type) => ({
      type,
      n: counts.get(type) ?? 0,
    }))
      .filter((e) => e.n > 0)
      .sort((a, b) => b.n - a.n);

    const { segments } = entries.reduce(
      (state, { type, n }) => {
        const from = state.acc;
        const to =
          kpi.totalTasks > 0
            ? state.acc + (n / kpi.totalTasks) * 100
            : state.acc;
        return {
          acc: to,
          segments: [
            ...state.segments,
            { key: type, label: type, n, color: typeColor(type), from, to },
          ],
        };
      },
      { acc: 0, segments: [] as TaskTypeDonutSeg[] },
    );
    return segments;
  }, [tasks, kpi.totalTasks, TYPES_LIST]);

  /* --- Status donut (dynamic statuses derived from incoming tasks) --- */
  const statusDonut: StatusDonutSeg[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) {
      const s = t.status || "Tanpa Status";
      counts.set(s, (counts.get(s) || 0) + 1);
    }
    const ordered = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    let acc = 0;
    const segments: StatusDonutSeg[] = [];
    for (const [status, n] of ordered) {
      const from = acc;
      const to = kpi.totalTasks > 0 ? acc + (n / kpi.totalTasks) * 100 : acc;
      acc = to;
      const color = STATUS_COLORS[status as TaskStatus] || "#9CA3AF";
      segments.push({
        key: status,
        label: status,
        n,
        color,
        from,
        to,
      });
    }
    return segments;
  }, [tasks, kpi.totalTasks]);

  /* --- Tester workload (derived from real testers found in data) --- */
  const workload: TesterWorkloadItem[] = useMemo(() => {
    return TESTERS_LIST.map((name) => {
      const testerTasks = tasks.filter((t) => t.testers.includes(name));
      const done = testerTasks.filter((t) => t.status === "Done").length;
      const onProgress = testerTasks.filter(
        (t) => t.status === "On Progress",
      ).length;
      const reviewing = testerTasks.filter(
        (t) => t.status === "Reviewing",
      ).length;
      const inFixing = testerTasks.filter(
        (t) => t.status === "In fixing",
      ).length;
      const total = testerTasks.length;
      const scored = testerTasks.filter((t) => t.score !== null);
      const avgScore =
        scored.length > 0
          ? scored.reduce((sum, t) => sum + (t.score as number), 0) /
            scored.length
          : null;
      const timed = testerTasks.filter((t) => t.durationMinutes !== null);
      const avgMinutes =
        timed.length > 0
          ? timed.reduce((sum, t) => sum + (t.durationMinutes as number), 0) /
            timed.length
          : null;
      return {
        name,
        done,
        onProgress,
        reviewing,
        inFixing,
        total,
        avgScore,
        avgMinutes,
      };
    }).sort((a, b) => b.total - a.total);
  }, [tasks, TESTERS_LIST]);

  const typeArcs = useMemo(() => {
    const size = 150;
    const stroke = 24;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    let acc = 0;
    const result = [];
    for (const seg of typeDonut) {
      const dash =
        kpi.totalTasks > 0 ? (seg.n / kpi.totalTasks) * circumference : 0;
      const offset = acc;
      acc += dash;
      result.push({
        ...seg,
        dash,
        offset,
        radius,
        circumference,
        stroke,
      });
    }
    return result;
  }, [typeDonut, kpi.totalTasks]);

  const statusArcs = useMemo(() => {
    const size = 150;
    const stroke = 24;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    let acc = 0;
    const result = [];
    for (const seg of statusDonut) {
      const dash =
        kpi.totalTasks > 0 ? (seg.n / kpi.totalTasks) * circumference : 0;
      const offset = acc;
      acc += dash;
      result.push({
        ...seg,
        dash,
        offset,
        radius,
        circumference,
        stroke,
      });
    }
    return result;
  }, [statusDonut, kpi.totalTasks]);

  const maxVolume = Math.max(...volumeBars.map((b) => b.total), 1);
  const maxWorkload = Math.max(...workload.map((w) => w.total), 1);


  /* completion percentage for status donut center */
  const doneCount = statusDonut.find((s) => s.key === "Done")?.n ?? 0;
  const completionPct =
    kpi.totalTasks > 0 ? Math.round((doneCount / kpi.totalTasks) * 100) : 0;

  /* check if any filter is active */
  const anyFilterActive =
    fDept !== "All" ||
    fType !== "All" ||
    fTester !== "All" ||
    fStatus !== "All" ||
    fBobot !== "All";

  const resetAllFilters = useCallback(() => {
    setFDept("All");
    setFType("All");
    setFTester("All");
    setFStatus("All");
    setFBobot("All");
    setCurrentPage(1);
  }, []);

  const filters: FilterDef[] = [
    {
      id: "dept",
      label: "Department",
      value: fDept,
      opts: ["All", ...DEPTS_LIST],
      active: fDept !== "All",
      icon: <LayoutGrid className="h-[15px] w-[15px]" />,
      onChange: (v) => {
        setFDept(v);
        setCurrentPage(1);
      },
    },
    {
      id: "type",
      label: "Task type",
      value: fType,
      opts: ["All", ...TYPES_LIST],
      active: fType !== "All",
      icon: <Ticket className="h-[15px] w-[15px]" />,
      onChange: (v) => {
        setFType(v);
        setCurrentPage(1);
      },
    },
    {
      id: "tester",
      label: "Tester",
      value: fTester,
      opts: ["All", ...TESTERS_LIST],
      active: fTester !== "All",
      icon: <Users className="h-[15px] w-[15px]" />,
      onChange: (v) => {
        setFTester(v);
        setCurrentPage(1);
      },
    },
    {
      id: "status",
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
      id: "bobot",
      label: "Bobot",
      value: fBobot,
      opts: ["All", ...BOBOTS_LIST],
      active: fBobot !== "All",
      icon: <BarChart3 className="h-[15px] w-[15px]" />,
      onChange: (v) => {
        setFBobot(v);
        setCurrentPage(1);
      },
    },
  ];

  return (
    <div className="w-full space-y-[13px] font-sans">
      {/* ============================================================ */}
      {/*  ROW 1 — KPI CARDS                                           */}
      {/* ============================================================ */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        style={{ gap: 13 }}
      >
        {/* Total Tasks */}
        <Card
          variant="featured"
          className="relative min-h-[99px] overflow-hidden rounded-[14px] border border-transparent px-[20px] py-[12px] shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-lg bg-white/15 text-white">
              <ClipboardCheck className="h-4 w-4" />
            </div>
            <DeltaChip value={kpi.totalTasksDelta} onFeatured />
          </div>
          <div className="mt-[9px] text-[13px] font-semibold leading-tight text-white">
            Total tasks
          </div>
          <div className="mt-[2px] text-[11.5px] leading-tight text-blue-100/80">
            Seluruh task QA yang tercatat pada periode ini
          </div>
          <div className="mt-[8px] text-3xl font-extrabold leading-none tracking-tight text-white font-display">
            {fmt(kpi.totalTasks)}
          </div>
        </Card>

        {/* Avg Score */}
        <Card className="relative min-h-[99px] rounded-[14px] border border-zinc-200 bg-white px-[20px] py-[12px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between">
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Star className="h-4 w-4" />
            </div>
            <DeltaChip value={kpi.avgScoreDelta} suffix="%" />
          </div>
          <div className="mt-[9px] text-[13px] font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
            Avg assignor score
          </div>
          <div className="mt-[2px] text-[11.5px] leading-tight text-zinc-400 dark:text-zinc-500">
            {`dari ${scoredCount} task yang dinilai · ${tasks.length - scoredCount} belum dinilai`}
          </div>
          <div className="mt-[8px] text-3xl font-extrabold leading-none tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
            {kpi.avgScore !== null
              ? kpi.avgScore.toFixed(1).replace(".", ",")
              : "-"}
          </div>
        </Card>

        {/* Testing Hours */}
        <Card className="relative min-h-[99px] rounded-[14px] border border-zinc-200 bg-white px-[20px] py-[12px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between">
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-[9px] text-[13px] font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
            Testing hours
          </div>
          <div className="mt-[2px] text-[11.5px] leading-tight text-zinc-400 dark:text-zinc-500">
            {`tercatat pada ${withDurationCount} dari ${tasks.length} task`}
          </div>
          <div className="mt-[8px] text-3xl font-extrabold leading-none tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
            {fmt(kpi.testingHours)}
          </div>
        </Card>

        {/* Active Testers — DETAIL link opens stat modal */}
        <Card
          onClick={() => setStatModal("testers")}
          className="relative min-h-[99px] cursor-pointer rounded-[14px] border border-zinc-200 bg-white px-[20px] py-[12px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Users className="h-4 w-4" />
            </div>
            <span className="mt-[2px] inline-flex items-center gap-0.5 text-[10.5px] font-bold uppercase tracking-[0.04em] text-blue-600 dark:text-blue-400">
              DETAIL
            </span>
          </div>
          <div className="mt-[9px] text-[13px] font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
            Active testers
          </div>
          <div className="mt-[2px] text-[11.5px] leading-tight text-zinc-400 dark:text-zinc-500">
            {`dari ${TESTERS_LIST.length} tester terdaftar`}
          </div>
          <div className="mt-[8px] flex items-end gap-[7px]">
            <span className="text-3xl font-extrabold leading-none tracking-tight text-zinc-900 dark:text-zinc-50 font-display">
              {kpi.activeTesters}
            </span>
            <ChevronRight className="mb-[4px] h-[15px] w-[15px] text-zinc-300 dark:text-zinc-600" />
          </div>
        </Card>
      </div>

      {/* ============================================================ */}
      {/*  ROW 2 — Task Volume Trend + Task Type Donut                  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Task Volume Trend */}
        <Card className="min-w-0 rounded-[14px] border border-zinc-200 bg-white px-[18px] py-[14px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Task volume trend
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
            Jumlah task per bulan berdasarkan tanggal assign
          </p>

          {kpi.totalTasks === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Belum Ada Data Task QA"
              description="Data task QA akan muncul di sini setelah sinkronisasi selesai."
              className="mt-3"
            />
          ) : (
            <>
              {/* Legend — status colours match the stacked bar segments */}
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {(
                  [
                    ["Done", STATUS_COLORS.Done],
                    ["On Progress", STATUS_COLORS["On Progress"]],
                    ["Reviewing", STATUS_COLORS.Reviewing],
                    ["In fixing", STATUS_COLORS["In fixing"]],
                  ] as const
                ).map(([label, color]) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {label}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex h-[176px] items-end gap-2.5">
                {volumeBars.map((bar, i) => {
                  const hot = activeBar?.label === bar.label;
                  const isDimmed = activeBar !== null && !hot;
                  const h = (bar.total / maxVolume) * 124;
                  const tx =
                    i <= 1
                      ? "translateX(-15%)"
                      : i >= volumeBars.length - 2
                        ? "translateX(-85%)"
                        : "translateX(-50%)";
                  const segs = (
                    [
                      ["Done", bar.done, STATUS_COLORS.Done],
                      [
                        "On Progress",
                        bar.onProgress,
                        STATUS_COLORS["On Progress"],
                      ],
                      ["Reviewing", bar.reviewing, STATUS_COLORS.Reviewing],
                      ["In fixing", bar.inFixing, STATUS_COLORS["In fixing"]],
                    ] as const
                  ).filter(([, n]) => n > 0);
                  return (
                    <div
                      key={bar.label}
                      className={`relative flex min-w-0 flex-1 flex-col items-center justify-end gap-1 cursor-pointer transition-opacity duration-150 ${
                        isDimmed ? "opacity-25" : "opacity-100"
                      }`}
                      onClick={() => {
                        if (!bar.total) return;
                        setActiveBar((prev) =>
                          prev?.label === bar.label && prev.pinned
                            ? null
                            : {
                                label: bar.label,
                                pinned: true,
                              },
                        );
                      }}
                      onMouseEnter={() => {
                        if (!bar.total || activeBar?.pinned) return;
                        setActiveBar({
                          label: bar.label,
                          pinned: false,
                        });
                      }}
                      onMouseLeave={() => {
                        if (!activeBar?.pinned) setActiveBar(null);
                      }}
                    >
                      {hot && (
                        <div
                          className="absolute bottom-full mb-2 left-1/2 z-40 w-52 rounded-[10px] border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 pointer-events-none"
                          style={{ transform: tx }}
                        >
                          <div className="mb-2 text-[11.5px] font-bold text-zinc-900 dark:text-zinc-50">
                            {bar.label} · {fmt(bar.total)} task
                          </div>
                          <div className="grid grid-cols-[9px_1fr_auto_auto] items-center gap-x-2 gap-y-1.5">
                            {segs.map(([label, count, color]) => (
                              <React.Fragment key={label}>
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                  {label}
                                </span>
                                <span className="text-right text-[11px] font-bold text-zinc-900 dark:text-zinc-50 font-display">
                                  {count}
                                </span>
                                <span className="min-w-7 text-right text-[10px] text-zinc-400 dark:text-zinc-500">
                                  {Math.round((count / bar.total) * 100)}%
                                </span>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      )}
                      <span
                        className={`text-[10px] font-bold font-display ${
                          hot
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {bar.total || ""}
                      </span>
                      <div
                        className="flex w-full max-w-[44px] flex-col-reverse overflow-hidden rounded-t-[5px] bg-zinc-100 dark:bg-zinc-800"
                        style={{ height: `${h}px` }}
                      >
                        {segs.map(([label, n, color]) => (
                          <div
                            key={label}
                            className="w-full transition-opacity"
                            style={{
                              height: `${(n / bar.total) * 100}%`,
                              backgroundColor: color,
                              opacity: hot ? 1 : 0.92,
                            }}
                          />
                        ))}
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
            </>
          )}
        </Card>

        {/* Task Type Donut — on a narrow card (under 24rem) the donut shrinks
            and the % column hides, so type names get room for two lines */}
        <Card className="@container flex min-w-0 flex-col rounded-[14px] border border-zinc-200 bg-white px-[18px] py-[14px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Task type
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
            Komposisi jenis pekerjaan QA
          </p>

          {kpi.totalTasks === 0 || typeDonut.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="Belum Ada Data Task QA"
              description="Komposisi jenis task akan muncul di sini setelah sinkronisasi selesai."
              className="mt-4"
            />
          ) : (
            <div className="flex flex-1 items-center gap-5 py-2.5">
              <div className="relative h-[120px] w-[120px] shrink-0 @sm:h-[150px] @sm:w-[150px]">
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
                  {typeArcs.map((arc) => {
                    const isHot = activeType?.key === arc.key;
                    const isDimmed = activeType !== null && !isHot;
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
                          setActiveType((prev) =>
                            prev?.key === arc.key && prev.pinned
                              ? null
                              : { key: arc.key, x: 0, y: 0, pinned: true },
                          );
                        }}
                        onMouseEnter={(e) => {
                          if (activeType?.pinned) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveType({
                            key: arc.key,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                            pinned: false,
                          });
                        }}
                        onMouseLeave={() => {
                          if (!activeType?.pinned) setActiveType(null);
                        }}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold leading-none text-zinc-900 dark:text-zinc-50 font-display">
                    {fmt(kpi.totalTasks)}
                  </span>
                  <span className="mt-[3px] text-[10.5px] text-zinc-400 dark:text-zinc-500">
                    task
                  </span>
                </div>
              </div>

              <div className="grid max-h-[150px] min-w-0 flex-1 grid-cols-[10px_1fr_auto] items-center gap-x-2.5 gap-y-[7px] overflow-y-auto pr-1 @sm:grid-cols-[10px_1fr_auto_auto]">
                {typeDonut.map((s) => {
                  const isHot = activeType?.key === s.key;
                  const isDimmed = activeType !== null && !isHot;
                  return (
                    <div
                      key={s.key}
                      className={`col-span-3 @sm:col-span-4 grid grid-cols-subgrid items-center cursor-pointer transition-opacity duration-150 ${
                        isDimmed ? "opacity-25" : "opacity-100"
                      }`}
                      onClick={() => {
                        setActiveType((prev) =>
                          prev?.key === s.key && prev.pinned
                            ? null
                            : { key: s.key, x: 0, y: 0, pinned: true },
                        );
                      }}
                      onMouseEnter={(e) => {
                        if (activeType?.pinned) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setActiveType({
                          key: s.key,
                          x: rect.left + 120,
                          y: rect.top - 8,
                          pinned: false,
                        });
                      }}
                      onMouseLeave={() => {
                        if (!activeType?.pinned) setActiveType(null);
                      }}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="line-clamp-2 wrap-break-word text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                        {s.label}
                      </span>
                      <span className="text-right text-xs font-bold text-zinc-700 dark:text-zinc-300 font-display">
                        {s.n}
                      </span>
                      <span className="hidden min-w-[34px] text-right text-xs font-bold text-zinc-400 @sm:block dark:text-zinc-500">
                        {kpi.totalTasks > 0
                          ? Math.round((s.n / kpi.totalTasks) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Standard chart tooltip for Task Type donut */}
              {activeType &&
                activeType.x > 0 &&
                (() => {
                  const item = typeDonut.find((s) => s.key === activeType.key);
                  if (!item) return null;
                  return (
                    <div
                      className="fixed z-50 w-52 rounded-[10px] border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 pointer-events-none -translate-x-1/2 -translate-y-full"
                      style={{ left: activeType.x, top: activeType.y }}
                    >
                      <div className="mb-2 text-[11.5px] font-bold text-zinc-900 dark:text-zinc-50">
                        {item.label}
                      </div>
                      <div className="grid grid-cols-[9px_1fr_auto_auto] items-center gap-x-2 gap-y-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Jumlah task
                        </span>
                        <span className="text-right text-[11px] font-bold text-zinc-900 dark:text-zinc-50 font-display">
                          {fmt(item.n)}
                        </span>
                        <span className="min-w-7 text-right text-[10px] text-zinc-400 dark:text-zinc-500">
                          {kpi.totalTasks > 0
                            ? Math.round((item.n / kpi.totalTasks) * 100)
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
      {/*  ROW 3 — Tester Workload + Status Donut                       */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Tester Workload */}
        <Card className="flex flex-col rounded-[14px] border border-zinc-200 bg-white px-[18px] py-[14px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Tester workload
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
            {`Beban dan performa ${TESTERS_LIST.length} tester`}
          </p>

          {workload.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum Ada Data Tester"
              description="Beban kerja tester akan muncul di sini setelah sinkronisasi selesai."
              className="mt-4 flex-1"
            />
          ) : (
            <>
              <div className="mt-4 flex flex-col">
                <div
                  className="grid items-center gap-2.5 mb-2"
                  style={{ gridTemplateColumns: "180px 1fr 52px 52px 68px" }}
                >
                  <span />
                  <span />
                  <span className="text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Tasks
                  </span>
                  <span className="text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Avg
                  </span>
                  <span className="text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Durasi
                  </span>
                </div>

                <div className="max-h-[180px] space-y-[15px] overflow-y-auto pr-1">
                  {workload.map((w) => {
                    const isHot = activeWorkload?.name === w.name;
                    const isDimmed = activeWorkload !== null && !isHot;
                    return (
                      <div
                        key={w.name}
                        className={`relative grid h-6 items-center gap-2.5 cursor-pointer transition-opacity duration-150 ${
                          isDimmed ? "opacity-25" : "opacity-100"
                        }`}
                        style={{
                          gridTemplateColumns: "180px 1fr 52px 52px 68px",
                        }}
                        onClick={() => {
                          setActiveWorkload((prev) =>
                            prev?.name === w.name && prev.pinned
                              ? null
                              : {
                                  name: w.name,
                                  x: 0,
                                  y: 0,
                                  pinned: true,
                                },
                          );
                        }}
                        onMouseEnter={(e) => {
                          if (activeWorkload?.pinned) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveWorkload({
                            name: w.name,
                            x: rect.left + 200,
                            y: rect.top - 8,
                            pinned: false,
                          });
                        }}
                        onMouseLeave={() => {
                          if (!activeWorkload?.pinned) setActiveWorkload(null);
                        }}
                      >
                        <span className="truncate text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
                          {w.name}
                        </span>
                        <div className="h-[10px] w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                          {w.total > 0 && (
                            <div
                              className="flex h-full overflow-hidden rounded-full"
                              style={{
                                width: `${(w.total / maxWorkload) * 100}%`,
                              }}
                            >
                              {w.done > 0 && (
                                <div
                                  className="h-full"
                                  style={{
                                    width: `${(w.done / w.total) * 100}%`,
                                    backgroundColor: STATUS_COLORS.Done,
                                  }}
                                />
                              )}
                              {w.onProgress > 0 && (
                                <div
                                  className="h-full"
                                  style={{
                                    width: `${(w.onProgress / w.total) * 100}%`,
                                    backgroundColor:
                                      STATUS_COLORS["On Progress"],
                                  }}
                                />
                              )}
                              {w.reviewing > 0 && (
                                <div
                                  className="h-full"
                                  style={{
                                    width: `${(w.reviewing / w.total) * 100}%`,
                                    backgroundColor: STATUS_COLORS.Reviewing,
                                  }}
                                />
                              )}
                              {w.inFixing > 0 && (
                                <div
                                  className="h-full"
                                  style={{
                                    width: `${(w.inFixing / w.total) * 100}%`,
                                    backgroundColor: STATUS_COLORS["In fixing"],
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-right text-[11.5px] font-bold text-zinc-700 dark:text-zinc-300 font-display">
                          {w.total}
                        </span>
                        <span className="text-right text-[11.5px] font-bold text-zinc-700 dark:text-zinc-300 font-display">
                          {w.avgScore !== null ? w.avgScore.toFixed(1) : "-"}
                        </span>
                        <span className="text-right text-[11.5px] font-bold text-zinc-700 dark:text-zinc-300 font-display">
                          {formatDuration(w.avgMinutes)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Workload tooltip — structured 4-column design system tooltip */}
              {activeWorkload &&
                activeWorkload.x > 0 &&
                (() => {
                  const w = workload.find(
                    (x) => x.name === activeWorkload.name,
                  );
                  if (!w) return null;
                  const segs = [
                    { label: "Done", count: w.done, color: STATUS_COLORS.Done },
                    {
                      label: "On Progress",
                      count: w.onProgress,
                      color: STATUS_COLORS["On Progress"],
                    },
                    {
                      label: "Reviewing",
                      count: w.reviewing,
                      color: STATUS_COLORS.Reviewing,
                    },
                    {
                      label: "In fixing",
                      count: w.inFixing,
                      color: STATUS_COLORS["In fixing"],
                    },
                  ].filter((s) => s.count > 0);
                  return (
                    <div
                      className="fixed z-50 w-52 rounded-[10px] border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 pointer-events-none -translate-x-1/2 -translate-y-full"
                      style={{
                        left: activeWorkload.x,
                        top: activeWorkload.y,
                      }}
                    >
                      <div className="mb-2 text-[11.5px] font-bold text-zinc-900 dark:text-zinc-50">
                        {w.name} · {fmt(w.total)} task
                      </div>
                      <div className="grid grid-cols-[9px_1fr_auto_auto] items-center gap-x-2 gap-y-1.5">
                        {segs.map((s) => (
                          <React.Fragment key={s.label}>
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {s.label}
                            </span>
                            <span className="text-right text-[11px] font-bold text-zinc-900 dark:text-zinc-50 font-display">
                              {s.count}
                            </span>
                            <span className="min-w-7 text-right text-[10px] text-zinc-400 dark:text-zinc-500">
                              {Math.round((s.count / w.total) * 100)}%
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              {/* Workload legend */}
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {(
                  [
                    ["Done", STATUS_COLORS.Done],
                    ["On Progress", STATUS_COLORS["On Progress"]],
                    ["Reviewing", STATUS_COLORS.Reviewing],
                    ["In fixing", STATUS_COLORS["In fixing"]],
                  ] as const
                ).map(([label, color]) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 text-[10.5px] text-zinc-500 dark:text-zinc-400"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Status Donut */}
        <Card className="flex flex-col rounded-[14px] border border-zinc-200 bg-white px-[18px] py-[14px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Status task
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-500">
            Progres pengerjaan task QA
          </p>

          {kpi.totalTasks === 0 ? (
            <EmptyState
              icon={Circle}
              title="Belum Ada Data Task QA"
              description="Progres status task akan muncul di sini setelah sinkronisasi selesai."
              className="mt-4 flex-1"
            />
          ) : (
            <div className="flex flex-1 items-center gap-5 py-2.5">
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
                  {statusArcs.map((arc) => {
                    const isHot = activeStatus?.key === arc.key;
                    const isDimmed = activeStatus !== null && !isHot;
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
                          setActiveStatus((prev) =>
                            prev?.key === arc.key && prev.pinned
                              ? null
                              : { key: arc.key, x: 0, y: 0, pinned: true },
                          );
                        }}
                        onMouseEnter={(e) => {
                          if (activeStatus?.pinned) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveStatus({
                            key: arc.key,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                            pinned: false,
                          });
                        }}
                        onMouseLeave={() => {
                          if (!activeStatus?.pinned) setActiveStatus(null);
                        }}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold leading-none text-zinc-900 dark:text-zinc-50 font-display">
                    {completionPct}%
                  </span>
                  <span className="mt-[3px] text-[10.5px] text-zinc-400 dark:text-zinc-500">
                    selesai
                  </span>
                </div>
              </div>

              <div className="grid min-w-0 flex-1 grid-cols-[10px_1fr_auto_auto] items-center gap-x-2.5 gap-y-[7px]">
                {statusDonut.map((s) => {
                  const isHot = activeStatus?.key === s.key;
                  const isDimmed = activeStatus !== null && !isHot;
                  return (
                    <div
                      key={s.key}
                      className={`col-span-4 grid grid-cols-subgrid items-center cursor-pointer transition-opacity duration-150 ${
                        isDimmed ? "opacity-25" : "opacity-100"
                      }`}
                      onClick={() => {
                        setActiveStatus((prev) =>
                          prev?.key === s.key && prev.pinned
                            ? null
                            : { key: s.key, x: 0, y: 0, pinned: true },
                        );
                      }}
                      onMouseEnter={(e) => {
                        if (activeStatus?.pinned) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setActiveStatus({
                          key: s.key,
                          x: rect.left + 100,
                          y: rect.top - 8,
                          pinned: false,
                        });
                      }}
                      onMouseLeave={() => {
                        if (!activeStatus?.pinned) setActiveStatus(null);
                      }}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="line-clamp-2 wrap-break-word text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                        {s.label}
                      </span>
                      <span className="text-right text-xs font-bold text-zinc-700 dark:text-zinc-300 font-display">
                        {s.n}
                      </span>
                      <span className="min-w-[34px] text-right text-xs font-bold text-zinc-400 dark:text-zinc-500">
                        {kpi.totalTasks > 0
                          ? Math.round((s.n / kpi.totalTasks) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Standard chart tooltip for Status Task donut */}
              {activeStatus &&
                activeStatus.x > 0 &&
                (() => {
                  const item = statusDonut.find(
                    (s) => s.key === activeStatus.key,
                  );
                  if (!item) return null;
                  return (
                    <div
                      className="fixed z-50 w-52 rounded-[10px] border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 pointer-events-none -translate-x-1/2 -translate-y-full"
                      style={{ left: activeStatus.x, top: activeStatus.y }}
                    >
                      <div className="mb-2 text-[11.5px] font-bold text-zinc-900 dark:text-zinc-50">
                        {item.label}
                      </div>
                      <div className="grid grid-cols-[9px_1fr_auto_auto] items-center gap-x-2 gap-y-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Jumlah task
                        </span>
                        <span className="text-right text-[11px] font-bold text-zinc-900 dark:text-zinc-50 font-display">
                          {fmt(item.n)}
                        </span>
                        <span className="min-w-7 text-right text-[10px] text-zinc-400 dark:text-zinc-500">
                          {kpi.totalTasks > 0
                            ? Math.round((item.n / kpi.totalTasks) * 100)
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
      {/*  ROW 4 — TASK LIST TABLE                                      */}
      {/* ============================================================ */}
      <Card className="rounded-[14px] border border-zinc-200 bg-white px-[18px] py-[14px] shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="mb-3.5">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            Task list
          </h3>
          <p className="mt-0.5 text-[13px] text-zinc-400 dark:text-zinc-500">
            {fmt(filtered.length)} task pada periode terpilih
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-3.5 flex flex-wrap items-center gap-2">
          {/* Search input */}
          <label className="flex h-9 min-w-52 flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 transition-colors focus-within:border-blue-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
            <Search className="h-3.75 w-3.75 shrink-0 text-zinc-400 dark:text-zinc-500" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari task, assignor, atau tester"
              className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-300 dark:placeholder:text-zinc-500"
            />
          </label>
          {filters.map((f) => (
            <FilterChip
              key={f.id}
              f={f}
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
            />
          ))}
          {/* Reset all filters ✕ button */}
          {anyFilterActive && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 transition-colors hover:border-zinc-300 hover:text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:text-zinc-300"
              aria-label="Reset semua filter"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {/* Export button */}
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>

        {/* Table — 8 columns */}
        {tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Belum Ada Task QA"
            description="Data akan tersedia setelah sinkronisasi Notion selesai."
            height={220}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Tidak Ditemukan"
            description="Tidak ada task yang cocok dengan filter ini."
            height={220}
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[830px]">
              {/* Header row */}
              <div
                className="grid gap-2 border-b border-zinc-100 p-2 dark:border-zinc-800"
                style={{ gridTemplateColumns: TASK_LIST_COLUMNS }}
              >
                {[
                  "Task name",
                  "Assignor",
                  "Department",
                  "Task type",
                  "Testers",
                  "Date assign",
                  "Duration",
                  "Score",
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
              {pageRows.map((t) => (
                <div
                  key={t.id}
                  onMouseDown={() => {
                    setOpenFilter(null);
                    setDetailId(t.id);
                  }}
                  onClick={() => {
                    setOpenFilter(null);
                    setDetailId(t.id);
                  }}
                  className="grid cursor-pointer items-center gap-2 border-b border-zinc-100 p-2 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  style={{ gridTemplateColumns: TASK_LIST_COLUMNS }}
                >
                  {/* Task name (max 2 lines; full text in the detail modal) + status pill */}
                  <span className="min-w-0">
                    <span className="line-clamp-2 wrap-break-word text-[12.5px] font-semibold leading-snug text-zinc-700 dark:text-zinc-300">
                      {t.taskName}
                    </span>
                    <span
                      className={`mt-0.5 inline-block rounded-full px-1.5 py-px text-[9.5px] font-bold ${
                        t.status
                          ? STATUS_PILL[t.status]
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {t.status ?? "-"}
                    </span>
                  </span>
                  {/* Assignor */}
                  <span className="line-clamp-2 min-w-0 wrap-break-word text-[11.5px] leading-snug text-zinc-600 dark:text-zinc-400">
                    {t.assignor ?? "-"}
                  </span>
                  {/* Department */}
                  <span className="min-w-0">
                    <span
                      className={`${WRAP_PILL} text-[10.5px] ${deptTone(t.department ?? "").bg} ${deptTone(t.department ?? "").fg}`}
                    >
                      {t.department ?? "-"}
                    </span>
                  </span>
                  {/* Task type */}
                  <span className="min-w-0">
                    <span
                      className={`${WRAP_PILL} text-[10.5px]`}
                      style={{
                        backgroundColor: `${typeColor(t.taskType)}15`,
                        color: typeColor(t.taskType),
                      }}
                    >
                      {t.taskType ?? "-"}
                    </span>
                  </span>
                  {/* Testers — one name per line; beyond two, the rest become +N */}
                  <span className="min-w-0 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                    {t.testers.length === 0 ? (
                      "-"
                    ) : (
                      <>
                        <span className="block truncate">{t.testers[0]}</span>
                        {t.testers.length > 1 && (
                          <span className="flex items-center gap-1">
                            <span className="truncate">{t.testers[1]}</span>
                            {t.testers.length > 2 && (
                              <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                +{t.testers.length - 2}
                              </span>
                            )}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                  {/* Date */}
                  <span className="whitespace-nowrap text-[11px] text-zinc-500 dark:text-zinc-400">
                    {formatDate(t.dateAssign)}
                  </span>
                  {/* Duration in Xj Ym format */}
                  <span>
                    {t.durationMinutes !== null ? (
                      <span className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300 font-display">
                        {formatDuration(t.durationMinutes)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400">-</span>
                    )}
                  </span>
                  {/* Score */}
                  <span>
                    {t.score !== null ? (
                      <span
                        className={`text-[12px] font-bold font-display ${
                          t.score >= 85
                            ? "text-emerald-600 dark:text-emerald-400"
                            : t.score >= 70
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {t.score}
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400">-</span>
                    )}
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
              {fmt(filtered.length)} task
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
      {statModal === "testers" && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setStatModal(null);
          }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4 font-sans"
        >
          <div className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-[14px] bg-white shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[17px] font-bold text-zinc-900 dark:text-zinc-50">
                  Active testers
                </div>
                <div className="mt-1 text-[12.5px] text-zinc-400 dark:text-zinc-500">
                  {`${kpi.activeTesters} tester tercatat memiliki task pada periode ini`}
                </div>
              </div>
              <button
                onClick={() => setStatModal(null)}
                className="ml-auto inline-flex h-7.5 w-7.5 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 px-6 py-4 sm:grid-cols-4">
              <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Tester aktif
                </div>
                <div className="mt-1 text-[21px] font-extrabold font-display">
                  {kpi.activeTesters}
                </div>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Task unik
                </div>
                <div className="mt-1 text-[21px] font-extrabold font-display">
                  {fmt(kpi.totalTasks)}
                </div>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Total penugasan
                </div>
                <div className="mt-1 text-[21px] font-extrabold font-display text-blue-600 dark:text-blue-400">
                  {fmt(workload.reduce((sum, w) => sum + w.total, 0))}
                </div>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Rata-rata beban
                </div>
                <div className="mt-1 text-[21px] font-extrabold font-display">
                  {kpi.activeTesters > 0
                    ? (
                        workload.reduce((sum, w) => sum + w.total, 0) /
                        kpi.activeTesters
                      ).toFixed(1)
                    : "-"}
                </div>
              </div>
            </div>
            <div className="px-6 pb-5">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Beban penugasan per tester · badge = avg score
              </div>
              <div className="mb-3 text-[11px] text-zinc-400 dark:text-zinc-500">
                * 1 task dapat dikerjakan lebih dari 1 tester (Total{" "}
                {fmt(workload.reduce((sum, w) => sum + w.total, 0))} penugasan
                dari {fmt(kpi.totalTasks)} task unik).
              </div>
              {workload.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Belum Ada Data Tester"
                  description="Beban kerja tester akan muncul di sini setelah sinkronisasi selesai."
                  height={160}
                />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {workload.map((w) => (
                    <div
                      key={w.name}
                      className="grid grid-cols-[148px_1fr_46px_84px] items-center gap-3"
                    >
                      <span className="truncate text-[12px] text-zinc-700 dark:text-zinc-300">
                        {w.name}
                      </span>
                      <span className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <span
                          className="block h-full rounded-full bg-blue-600"
                          style={{ width: `${(w.total / maxWorkload) * 100}%` }}
                        />
                      </span>
                      <span className="text-right text-[12px] font-bold font-display">
                        {w.total}
                      </span>
                      <span className="text-right">
                        <span className="rounded-full bg-zinc-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-zinc-800">
                          {w.avgScore !== null ? w.avgScore.toFixed(1) : "-"}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
              <span className="text-[11.5px] text-zinc-400 dark:text-zinc-500">
                {`${fmt(kpi.totalTasks)} task · ${fmt(kpi.testingHours)} jam testing pada periode terpilih`}
              </span>
              <button
                onClick={() => setStatModal(null)}
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
      {detailTask && (
        <div
          onClick={() => setDetailId(null)}
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4 font-sans"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
          >
            {/* Header */}
            <div className="flex items-start gap-3.5 rounded-t-2xl border-b border-emerald-100 bg-emerald-50/60 px-6 py-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="min-w-0 flex-1">
                <div className="text-[17px] font-bold text-zinc-900 dark:text-zinc-50">
                  {detailTask.taskName}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {detailTask.number !== null && (
                    <span className="rounded-md bg-zinc-200/70 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 tabular-nums">
                      No. {detailTask.number}
                    </span>
                  )}
                  <span
                    className="inline-block max-w-full wrap-break-word rounded-md px-2 py-0.5 text-[10.5px] font-bold"
                    style={{
                      backgroundColor: `${typeColor(detailTask.taskType)}15`,
                      color: typeColor(detailTask.taskType),
                    }}
                  >
                    {detailTask.taskType ?? "-"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetailId(null)}
                className="inline-flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-emerald-100/70 dark:text-zinc-500 dark:hover:bg-emerald-900/40"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Stat tiles — Score / Duration / Bobot / Status */}
            <div className="grid grid-cols-2 gap-3 px-6 py-4.5 md:grid-cols-4">
              <div
                className={`rounded-xl px-3.5 py-3 ring-1 ${
                  detailTask.score !== null
                    ? detailTask.score >= 85
                      ? "bg-emerald-50/70 ring-emerald-100 dark:bg-emerald-950/20 dark:ring-emerald-900/40"
                      : detailTask.score >= 70
                        ? "bg-amber-50/70 ring-amber-100 dark:bg-amber-950/20 dark:ring-amber-900/40"
                        : "bg-rose-50/70 ring-rose-100 dark:bg-rose-950/20 dark:ring-rose-900/40"
                    : "bg-zinc-50/70 ring-zinc-100 dark:bg-zinc-800/40 dark:ring-zinc-800"
                }`}
              >
                <div
                  className={`mb-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    detailTask.score !== null
                      ? detailTask.score >= 85
                        ? "text-emerald-500 dark:text-emerald-400"
                        : detailTask.score >= 70
                          ? "text-amber-500 dark:text-amber-400"
                          : "text-rose-500 dark:text-rose-400"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  Score
                </div>
                <div
                  className={`text-[22px] font-extrabold leading-none font-display ${
                    detailTask.score !== null
                      ? detailTask.score >= 85
                        ? "text-emerald-600 dark:text-emerald-400"
                        : detailTask.score >= 70
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400"
                      : "text-zinc-400"
                  }`}
                >
                  {detailTask.score ?? "-"}
                </div>
                <div className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                  {detailTask.score !== null
                    ? "nilai dari assignor"
                    : "belum dinilai"}
                </div>
              </div>
              <div className="rounded-xl bg-blue-50/70 px-3.5 py-3 ring-1 ring-blue-100 dark:bg-blue-950/20 dark:ring-blue-900/40">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">
                  Duration
                </div>
                <div className="text-[22px] font-extrabold leading-none text-blue-700 dark:text-blue-300 font-display">
                  {formatDuration(detailTask.durationMinutes, true)}
                </div>
                <div className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                  {detailTask.durationMinutes !== null
                    ? "durasi pengerjaan"
                    : "durasi belum dicatat"}
                </div>
              </div>
              <div className="rounded-xl bg-indigo-50/70 px-3.5 py-3 ring-1 ring-indigo-100 dark:bg-indigo-950/20 dark:ring-indigo-900/40">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                  Bobot
                </div>
                <div>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      detailTask.bobot
                        ? BOBOT_PILL[detailTask.bobot]
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {detailTask.bobot ?? "-"}
                  </span>
                </div>
                <div className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                  tingkat kesulitan task
                </div>
              </div>
              <div
                className="rounded-xl bg-zinc-50/70 px-3.5 py-3 ring-1 ring-zinc-100 dark:bg-zinc-800/40 dark:ring-zinc-800"
                style={{
                  backgroundColor: detailTask.status
                    ? `${STATUS_COLORS[detailTask.status]}12`
                    : undefined,
                  borderColor: detailTask.status
                    ? `${STATUS_COLORS[detailTask.status]}24`
                    : undefined,
                  boxShadow: detailTask.status
                    ? `inset 0 0 0 1px ${STATUS_COLORS[detailTask.status]}24`
                    : undefined,
                }}
              >
                <div
                  className="mb-1.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    color: detailTask.status
                      ? STATUS_COLORS[detailTask.status]
                      : undefined,
                  }}
                >
                  Status
                </div>
                <div>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      detailTask.status
                        ? STATUS_PILL[detailTask.status]
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {detailTask.status ?? "-"}
                  </span>
                </div>
                <div className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                  {detailTask.status === "Done"
                    ? "task sudah diterima"
                    : detailTask.status === "On Progress"
                      ? "task sedang dikerjakan"
                      : detailTask.status === "Reviewing"
                        ? "task sedang direview"
                        : detailTask.status === "In fixing"
                          ? "task sedang diperbaiki"
                          : "status belum tercatat"}
                </div>
              </div>
            </div>

            {/* Main modal content: detail + feedback on the left, people panel on the right */}
            <div className="grid grid-cols-1 gap-4 px-6 pb-5.5 lg:grid-cols-[1.18fr_0.82fr]">
              <div className="space-y-4">
                <section className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Detail task
                      </div>
                      <div className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                        Metadata utama dari task QA
                      </div>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {detailTask.number !== null
                        ? `No. ${detailTask.number}`
                        : "No. -"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                        Department
                      </div>
                      <div className="mt-1 text-[13px] font-bold text-zinc-700 dark:text-zinc-300">
                        {detailTask.department ?? "-"}
                      </div>
                      <div className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                        asal pemberi task
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                      <div
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          color: detailTask.taskType
                            ? typeColor(detailTask.taskType)
                            : undefined,
                        }}
                      >
                        Task type
                      </div>
                      <div className="mt-1 text-[13px] font-bold text-zinc-700 dark:text-zinc-300">
                        {detailTask.taskType ?? "-"}
                      </div>
                      <div className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                        jenis pekerjaan QA
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">
                        Date assign
                      </div>
                      <div className="mt-1 text-[13px] font-bold text-zinc-700 dark:text-zinc-300">
                        {formatDate(detailTask.dateAssign)}
                      </div>
                      <div className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                        tanggal task diberikan
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400">
                        Plan
                      </div>
                      <div className="mt-1 text-[13px] font-bold leading-snug text-zinc-700 dark:text-zinc-300">
                        {detailTask.planStart || detailTask.planEnd
                          ? `${formatDate(detailTask.planStart)} – ${formatDate(detailTask.planEnd)}`
                          : "-"}
                      </div>
                      <div className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                        {detailTask.planStart && detailTask.planEnd
                          ? `rentang ${
                              Math.round(
                                (new Date(detailTask.planEnd).getTime() -
                                  new Date(detailTask.planStart).getTime()) /
                                  86400000,
                              ) + 1
                            } hari`
                          : "rentang belum dicatat"}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Assignor feedback
                  </div>
                  <div className="rounded-xl border border-zinc-100 bg-white px-4 py-3.5 text-[13px] leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    {detailTask.feedbackAssignor &&
                    detailTask.feedbackAssignor.trim() !== ""
                      ? detailTask.feedbackAssignor
                      : "Belum ada feedback dari assignor"}
                  </div>
                </section>
              </div>

              <aside className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Tim
                    </div>
                    <div className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                      {`${detailTask.assignor ? 1 : 0} assignor · ${detailTask.testers.length} tester`}
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-zinc-500 ring-1 ring-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800">
                    {fmt(
                      detailTask.testers.length + (detailTask.assignor ? 1 : 0),
                    )}{" "}
                    orang
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-500 dark:text-blue-400">
                      Assignor
                    </div>
                    {detailTask.assignor ? (
                      <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-400 font-display">
                          {initialsOf(detailTask.assignor)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="break-words text-[12.5px] font-bold leading-snug text-zinc-700 dark:text-zinc-300">
                            {detailTask.assignor}
                          </div>
                          <div className="mt-0.5 text-[10.5px] text-zinc-400 dark:text-zinc-500">
                            {detailTask.department ?? "-"}
                          </div>
                        </div>
                        <span className="shrink-0 rounded-md bg-blue-100 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                          Assignor
                        </span>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-zinc-100 bg-white px-3.5 py-3 text-[12.5px] text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
                        Assignor belum tercatat
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400">
                      Testers ({detailTask.testers.length})
                    </div>
                    <div className="space-y-2.5">
                      {detailTask.testers.map((tester) => {
                        const testerTotal = tasks.filter((t) =>
                          t.testers.includes(tester),
                        ).length;
                        return (
                          <div
                            key={tester}
                            className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-white px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                          >
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700 dark:bg-amber-950/70 dark:text-amber-400 font-display">
                              {initialsOf(tester)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="break-words text-[12.5px] font-bold leading-snug text-zinc-700 dark:text-zinc-300">
                                {tester}
                              </div>
                              <div className="mt-0.5 text-[10.5px] text-zinc-400 dark:text-zinc-500">
                                {`${fmt(testerTotal)} task pada periode ini`}
                              </div>
                            </div>
                            <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                              Tester
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            {/* Footer */}
            <div className="flex items-center border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
              <span className="text-[11.5px] text-zinc-400 dark:text-zinc-500">
                Data bersumber dari pencatatan task QA · hanya dapat dibaca
              </span>
              <button
                onClick={() => setDetailId(null)}
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
