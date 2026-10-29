import type {
  BlueprintImpact,
  BlueprintStatus,
  BlueprintType,
  FsdBlueprintItem,
  FsdFilterInput,
  FsdKpiSummary,
  FsdOwnerRow,
  FsdPicWorkload,
  FsdQuarterRow,
  FsdScopeComposition,
  FsdStatusCount,
} from "../types/fsdBlueprint.types";

export const STATUS_CONFIG: Record<
  BlueprintStatus,
  { label: string; bar: string; bg: string; fg: string; border: string }
> = {
  Done: {
    label: "Done",
    bar: "#10B981",
    bg: "var(--status-green-bg, #ECFDF5)",
    fg: "var(--status-green-fg, #059669)",
    border: "rgba(16, 185, 129, 0.2)",
  },
  "On Progress": {
    label: "On Progress",
    bar: "#2563EB",
    bg: "var(--status-blue-bg, #EFF4FE)",
    fg: "var(--status-blue-fg, #2563EB)",
    border: "rgba(37, 99, 235, 0.2)",
  },
  "On Queue": {
    label: "On Queue",
    bar: "#F59E0B",
    bg: "var(--status-amber-bg, #FFFBEB)",
    fg: "var(--status-amber-fg, #B45309)",
    border: "rgba(245, 158, 11, 0.2)",
  },
  "Not Started": {
    label: "Not Started",
    bar: "#9CA3AF",
    bg: "var(--status-gray-bg, #F3F4F6)",
    fg: "var(--status-gray-fg, #6B7280)",
    border: "rgba(156, 163, 175, 0.2)",
  },
  "SLA Blueprint": {
    label: "SLA Blueprint",
    bar: "#EF4444",
    bg: "var(--status-red-bg, #FEF2F2)",
    fg: "var(--status-red-fg, #DC2626)",
    border: "rgba(239, 68, 68, 0.2)",
  },
};

/**
 * Urutan tampil status di seluruh chart dan filter fitur ini.
 *
 * SLA Blueprint ditaruh paling depan sengaja: ini bukan tahap pengerjaan
 * biasa seperti tiga status lain, melainkan penanda urgensi -- item yang
 * sudah melewati tenggat dan butuh perhatian lebih dulu daripada item yang
 * sekadar belum dikerjakan. Menaruhnya di ujung, seperti posisi "Not
 * Started", membuatnya mudah terlewat pada chart batang bertumpuk.
 */
export const STATUS_DISPLAY_ORDER: BlueprintStatus[] = [
  "SLA Blueprint",
  "Done",
  "On Progress",
  "On Queue",
  "Not Started",
];

export const QUARTER_ORDER = [
  "Q4 - 2025",
  "Q1 - 2026",
  "Q2 - 2026",
  "Q3 - 2026",
  "Q4 - 2026",
];

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export type FsdDbDate = Date | string | null | undefined;

export interface FsdBlueprintDbRow {
  id?: number | string | null;
  year?: number | string | null;
  month?: number | string | null;
  quarter?: number | string | null;
  owner?: string | null;
  status?: string | null;
  module_name?: string | null;
  scope?: string | null;
  pic_it_old?: string | null;
  pic_it_new?: string | null;
  date_start?: FsdDbDate;
  pic_project_owner?: string | null;
  reviewer_it?: string | null;
  reviewer_cpp?: string | null;
  reviewer_other?: string | null;
  update_progress?: string | null;
  date_end?: FsdDbDate;
  quartal?: string | null;
  end_doc?: FsdDbDate;
  end_review?: FsdDbDate;
  time_input?: FsdDbDate;
  time_edit?: FsdDbDate;
}

export function formatDbDate(val: FsdDbDate): string {
  if (!val) return "";
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return "";
    const d = val.getUTCDate();
    const m = MONTH_NAMES_SHORT[val.getUTCMonth()];
    const y = val.getUTCFullYear();
    return `${d} ${m} ${y}`;
  }
  if (typeof val === "string") {
    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const y = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const d = parseInt(match[3], 10);
      return `${d} ${MONTH_NAMES_SHORT[m - 1] || ""} ${y}`;
    }
  }
  return String(val);
}

export function getDateNumericKey(val: FsdDbDate): number {
  if (!val) return 0;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return 0;
    return (
      val.getUTCFullYear() * 10000 +
      (val.getUTCMonth() + 1) * 100 +
      val.getUTCDate()
    );
  }
  if (typeof val === "string") {
    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return (
        parseInt(match[1], 10) * 10000 +
        parseInt(match[2], 10) * 100 +
        parseInt(match[3], 10)
      );
    }
  }
  return 0;
}

export function parseScopeMeta(scope: string): {
  bpType: BlueprintType;
  impact: BlueprintImpact;
} {
  if (!scope) return { bpType: "", impact: "" };
  const scopeLower = scope.toLowerCase();

  let bpType: BlueprintType = "";
  if (scopeLower.includes("new bp") || scopeLower.includes("new/rev")) {
    bpType = "New BP";
  } else if (
    scopeLower.includes("revisi bp") ||
    scopeLower.includes("rev bp")
  ) {
    bpType = "Revisi BP";
  }

  let impact: BlueprintImpact = "";
  if (scopeLower.includes("major")) {
    impact = "Major";
  } else if (scopeLower.includes("minor")) {
    impact = "Minor";
  }

  return { bpType, impact };
}

/**
 * Menentukan status yang benar-benar tampil di dashboard.
 *
 * Prioritas pertama: nilai literal dari sumber data. Bila suatu saat
 * pipeline n8n mengirim "SLA Blueprint" langsung dari kolom status Notion
 * (dipilih manual oleh pengguna), nilai itu dihormati apa adanya --
 * dashboard tidak menimpa keputusan eksplisit itu.
 *
 * Bila tidak, status dihitung: item yang belum Done dan tanggal selesainya
 * (dateEnd) sudah lewat hari ini ditandai SLA Blueprint, menggantikan
 * status aslinya. Ini disengaja dibuat sebagai perhitungan, bukan sekadar
 * label yang menunggu seseorang mengubah dropdown -- per implementasi ini
 * dibuat, belum ada satu pun baris di data live berstatus SLA Blueprint
 * secara manual, sehingga perhitungan otomatis lebih dapat diandalkan.
 *
 * Item "On Progress" yang lewat tenggat IKUT ditandai SLA Blueprint. Bila
 * kebijakan bisnis nanti berubah, cukup ubah kondisi di sini -- seluruh
 * chart dan tabel ikut menyesuaikan karena semuanya membaca field status
 * yang sama.
 */
export function resolveDisplayStatus(
  rawStatus: string,
  dateEndKey: number,
): BlueprintStatus {
  const normalized = rawStatus.toLowerCase();

  if (normalized === "sla blueprint") return "SLA Blueprint";

  const status: BlueprintStatus =
    normalized === "on progress"
      ? "On Progress"
      : (rawStatus as BlueprintStatus) || "Not Started";

  if (status === "Done" || !dateEndKey) return status;

  const now = new Date();
  const todayKey =
    now.getUTCFullYear() * 10000 +
    (now.getUTCMonth() + 1) * 100 +
    now.getUTCDate();

  return dateEndKey < todayKey ? "SLA Blueprint" : status;
}

export function mapDbRowToFsdItem(
  row: FsdBlueprintDbRow,
  index: number = 0,
): FsdBlueprintItem {
  const { bpType, impact } = parseScopeMeta(row.scope || "");
  const picIt = row.pic_it_new || row.pic_it_old || "";
  const rawStatus = (row.status || "").trim();
  const endKey = getDateNumericKey(row.date_end);
  const statusNorm = resolveDisplayStatus(rawStatus, endKey);

  return {
    id: index + 1,
    owner: row.owner || "",
    status: statusNorm,
    module: row.module_name || "",
    scope: row.scope || "",
    bpType,
    impact,
    picIt,
    picOwner: row.pic_project_owner || "",
    revIt: row.reviewer_it || "",
    revCpp: row.reviewer_cpp || "",
    dateStart: formatDbDate(row.date_start),
    startKey: getDateNumericKey(row.date_start),
    dateEnd: formatDbDate(row.date_end),
    endKey: getDateNumericKey(row.date_end),
    endDoc: formatDbDate(row.end_doc),
    endReview: formatDbDate(row.end_review),
    quartal:
      row.quartal || (row.quarter ? `Q${row.quarter} - ${row.year}` : ""),
    progress: row.update_progress || "",
  };
}

export function getYearOfItem(r: FsdBlueprintItem): number {
  if (r.startKey) return Math.floor(r.startKey / 10000);
  const parts = (r.quartal || "").split(" - ");
  if (parts.length > 1) {
    const y = Number(parts[1]);
    if (!isNaN(y) && y > 0) return y;
  }
  return 0;
}

export function getMonthOfItem(r: FsdBlueprintItem): number {
  if (r.startKey) return Math.floor(r.startKey / 100) % 100;
  return 0;
}

export function filterFsdItems(
  items: FsdBlueprintItem[],
  filters: FsdFilterInput,
): FsdBlueprintItem[] {
  const { year, month, status, owner, quartal, pic, search } = filters;
  const qLower = search ? search.trim().toLowerCase() : "";

  return items.filter((r) => {
    if (year && year !== "ALL" && year !== "all") {
      const itemYear = getYearOfItem(r);
      if (itemYear !== 0 && String(itemYear) !== year) return false;
    }
    if (month && month !== "ALL" && month !== "all") {
      const itemMonth = getMonthOfItem(r);
      if (itemMonth !== 0 && String(itemMonth) !== month) return false;
    }
    if (status && status !== "ALL" && status !== "all") {
      if (r.status !== status) return false;
    }
    if (owner && owner !== "ALL" && owner !== "all") {
      if (r.owner !== owner) return false;
    }
    if (quartal && quartal !== "ALL" && quartal !== "all") {
      if (r.quartal !== quartal) return false;
    }
    if (pic && pic !== "ALL" && pic !== "all") {
      if (!r.picIt || !r.picIt.toLowerCase().includes(pic.toLowerCase()))
        return false;
    }
    if (qLower) {
      const combined =
        `${r.module} ${r.scope} ${r.picIt} ${r.picOwner} ${r.owner}`.toLowerCase();
      if (!combined.includes(qLower)) return false;
    }
    return true;
  });
}

export function calculateKpis(items: FsdBlueprintItem[]): FsdKpiSummary {
  const total = items.length;
  const modules = new Set(items.map((r) => r.module).filter(Boolean)).size;

  let doneCount = 0;
  let onProgressCount = 0;
  let onQueueCount = 0;
  let notStartedCount = 0;
  let slaCount = 0;

  for (const item of items) {
    if (item.status === "Done") doneCount++;
    else if (item.status === "On Progress") onProgressCount++;
    else if (item.status === "On Queue") onQueueCount++;
    else if (item.status === "Not Started") notStartedCount++;
    else if (item.status === "SLA Blueprint") slaCount++;
  }

  return {
    total,
    totalModules: modules,
    doneCount,
    donePercentage: total ? Math.round((doneCount / total) * 100) : 0,
    onProgressCount,
    onProgressPercentage: total
      ? Math.round((onProgressCount / total) * 100)
      : 0,
    onQueueCount,
    onQueuePercentage: total ? Math.round((onQueueCount / total) * 100) : 0,
    notStartedCount,
    notStartedPercentage: total
      ? Math.round((notStartedCount / total) * 100)
      : 0,
    slaCount,
    slaPercentage: total ? Math.round((slaCount / total) * 100) : 0,
  };
}

export function calculateStatusCounts(
  items: FsdBlueprintItem[],
): FsdStatusCount {
  const counts: FsdStatusCount = {
    Done: 0,
    "On Progress": 0,
    "On Queue": 0,
    "Not Started": 0,
    "SLA Blueprint": 0,
    total: items.length,
  };

  for (const item of items) {
    if (counts[item.status] !== undefined) {
      counts[item.status]++;
    }
  }

  return counts;
}

export function calculateQuarterBreakdown(
  items: FsdBlueprintItem[],
): FsdQuarterRow[] {
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const emptyCounts = () => ({
    total: 0,
    Done: 0,
    "On Progress": 0,
    "On Queue": 0,
    "Not Started": 0,
    "SLA Blueprint": 0,
  });
  const map: Record<string, ReturnType<typeof emptyCounts>> = {
    Q1: emptyCounts(),
    Q2: emptyCounts(),
    Q3: emptyCounts(),
    Q4: emptyCounts(),
  };

  for (const item of items) {
    const qPrefix = (item.quartal || "").split(" - ")[0]?.trim();
    if (map[qPrefix]) {
      map[qPrefix].total++;
      if (map[qPrefix][item.status] !== undefined) {
        map[qPrefix][item.status]++;
      }
    }
  }

  return quarters.map((q) => ({
    quartal: q,
    ...map[q],
  }));
}

export function calculateOwnerBreakdown(
  items: FsdBlueprintItem[],
): FsdOwnerRow[] {
  const map: Record<
    string,
    {
      total: number;
      Done: number;
      "On Progress": number;
      "On Queue": number;
      "Not Started": number;
      "SLA Blueprint": number;
    }
  > = {};

  for (const item of items) {
    const owner = item.owner?.trim() || "OTHER";
    if (!map[owner]) {
      map[owner] = {
        total: 0,
        Done: 0,
        "On Progress": 0,
        "On Queue": 0,
        "Not Started": 0,
        "SLA Blueprint": 0,
      };
    }
    map[owner].total++;
    if (map[owner][item.status] !== undefined) {
      map[owner][item.status]++;
    }
  }

  return Object.entries(map)
    .map(([owner, counts]) => ({
      owner,
      ...counts,
    }))
    .sort((a, b) => b.total - a.total);
}

export function calculatePicWorkloads(
  items: FsdBlueprintItem[],
): FsdPicWorkload[] {
  const map: Record<
    string,
    {
      total: number;
      done: number;
      Done: number;
      "On Progress": number;
      "On Queue": number;
      "Not Started": number;
      "SLA Blueprint": number;
    }
  > = {};

  for (const item of items) {
    const rawPics = (item.picIt || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const pic of rawPics) {
      if (!map[pic]) {
        map[pic] = {
          total: 0,
          done: 0,
          Done: 0,
          "On Progress": 0,
          "On Queue": 0,
          "Not Started": 0,
          "SLA Blueprint": 0,
        };
      }
      map[pic].total++;
      if (item.status === "Done") {
        map[pic].done++;
        map[pic].Done++;
      } else if (map[pic][item.status] !== undefined) {
        map[pic][item.status]++;
      }
    }
  }

  return Object.entries(map)
    .map(([name, counts]) => ({
      name,
      ...counts,
    }))
    .sort((a, b) => b.total - a.total);
}

export function calculateScopeComposition(
  items: FsdBlueprintItem[],
): FsdScopeComposition {
  const total = items.length || 1;

  let newBp = 0;
  let revBp = 0;
  let noBp = 0;

  let major = 0;
  let minor = 0;
  let noImpact = 0;

  for (const item of items) {
    if (item.bpType === "New BP") newBp++;
    else if (item.bpType === "Revisi BP") revBp++;
    else noBp++;

    if (item.impact === "Major") major++;
    else if (item.impact === "Minor") minor++;
    else noImpact++;
  }

  return {
    docTypes: [
      {
        label: "New BP",
        count: newBp,
        percentage: Math.round((newBp / total) * 100),
        color: "#2563EB",
      },
      {
        label: "Revisi BP",
        count: revBp,
        percentage: Math.round((revBp / total) * 100),
        color: "#60A5FA",
      },
      {
        label: "Tidak tercantum",
        count: noBp,
        percentage: Math.round((noBp / total) * 100),
        color: "#9CA3AF",
      },
    ].filter((d) => d.count > 0),
    impacts: [
      {
        label: "Major",
        count: major,
        percentage: Math.round((major / total) * 100),
        color: "#1D4ED8",
      },
      {
        label: "Minor",
        count: minor,
        percentage: Math.round((minor / total) * 100),
        color: "#93C5FD",
      },
      {
        label: "Tidak tercantum",
        count: noImpact,
        percentage: Math.round((noImpact / total) * 100),
        color: "#9CA3AF",
      },
    ].filter((d) => d.count > 0),
  };
}

export function formatTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
