import "server-only";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { unstable_cache } from "next/cache";
import {
  QaTask,
  TaskType,
  TaskStatus,
  TaskBobot,
  TaskDepartment,
} from "../types/qaTasksTypes";

interface RawQaTaskRow {
  id: string;
  number: number | null;
  task_name: string | null;
  assignor: string | null;
  department: string | null;
  task_type: string | null;
  testers: string[] | null;
  date_assign: string | Date | null;
  plan_start: string | Date | null;
  plan_end: string | Date | null;
  duration_minutes: number | null;
  mandays: string | number | null;
  score: string | number | null;
  status: string | null;
  bobot: string | null;
  feedback_assignor: string | null;
}

function toIsoDate(v: string | Date | null | undefined): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

function toNumber(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isNaN(n) ? null : n;
}

function mapRawRowToQaTask(r: RawQaTaskRow): QaTask {
  return {
    id: r.id,
    number: toNumber(r.number),
    taskName: r.task_name ?? "",
    assignor: r.assignor,
    department: (r.department as TaskDepartment | null) ?? null,
    taskType: (r.task_type as TaskType | null) ?? null,
    testers: r.testers ?? [],
    dateAssign: toIsoDate(r.date_assign),
    planStart: toIsoDate(r.plan_start),
    planEnd: toIsoDate(r.plan_end),
    durationMinutes: toNumber(r.duration_minutes),
    mandays: toNumber(r.mandays),
    score: toNumber(r.score),
    status: (r.status as TaskStatus | null) ?? null,
    bobot: (r.bobot as TaskBobot | null) ?? null,
    feedbackAssignor: r.feedback_assignor,
  };
}

/**
 * Fetch QA tasks scoped to the global year/month filter (same semantics as
 * the issues-data service): period is derived from `date_assign`.
 */
export async function getQaTasksRaw(
  year: string = "ALL",
  month: string = "ALL",
): Promise<QaTask[]> {
  const targetYear = year !== "ALL" ? parseInt(year, 10) : null;
  const monthInfo = parseMonthFilter(month);

  const rows = await sql<RawQaTaskRow[]>`
    SELECT
      id, number, task_name, assignor, department, task_type, testers,
      date_assign, plan_start, plan_end, duration_minutes, mandays, score,
      status, bobot, feedback_assignor
    FROM bug_tracker.qa_tasks
    WHERE TRUE
      ${targetYear !== null && !isNaN(targetYear) ? sql`AND EXTRACT(YEAR FROM date_assign) = ${targetYear}` : sql``}
      ${!monthInfo.isAll && monthInfo.months.length > 0 ? sql`AND EXTRACT(MONTH FROM date_assign) = ANY(${monthInfo.months})` : sql``}
    ORDER BY date_assign DESC NULLS LAST, number DESC NULLS LAST
  `;

  return rows.map(mapRawRowToQaTask);
}

export async function getQaTasksData(
  year: string = "ALL",
  month: string = "ALL",
): Promise<QaTask[]> {
  return unstable_cache(
    () => getQaTasksRaw(year, month),
    ["qa-tasks-data-v2", year, month],
    { revalidate: 300, tags: ["qa-tasks"] },
  )();
}
