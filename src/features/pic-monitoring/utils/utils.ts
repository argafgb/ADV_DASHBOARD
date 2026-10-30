import { parseSubmissionYear } from "../services/project-data";
import type { RawProject } from "../types/types";

type DynamicProjectRecord = Record<string, string | undefined>;

type ProjectStage =
  | "change-request"
  | "fsd"
  | "development"
  | "sit"
  | "uat-progress"
  | "uat-queue"
  | "live"
  | "monitoring"
  | "other";

const MISSING_DISPLAY_VALUE = "Belum diisi";

function getDynamicProjectRecord(
  project: RawProject | null | undefined,
): DynamicProjectRecord {
  if (!project || typeof project !== "object") return {};

  const source =
    project.cleansed_data !== undefined ? project.cleansed_data : project;
  if (!source || typeof source !== "object" || Array.isArray(source)) return {};

  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [
      key,
      value == null ? undefined : String(value),
    ]),
  );
}

function isBlankSourceText(value: string | null | undefined): boolean {
  if (value == null) return true;
  const normalized = String(value).trim();
  return normalized === "" || normalized === "-";
}

function toDisplayText(value: string | undefined): string {
  return isBlankSourceText(value) ? MISSING_DISPLAY_VALUE : String(value);
}

/**
 * Delivery order of the stage-scoped Notion properties.
 *
 * Statuses such as Hold By Owner, Hold By IT, and Live On Queue name no stage of
 * their own: the ticket simply stopped at whichever stage it had reached. Notion
 * exposes no `Progress Updated` or `Target/Realized Date` column outside the
 * per-stage ones, so the furthest stage carrying data is the project's real
 * latest record.
 */
const STAGE_PROGRESS_FIELDS = [
  "(FSD) Progress Updated",
  "(Dev) Progress Updated",
  "(SIT) Progress Updated",
  "(UAT) Progress Updated",
  "(Live) Progress Updated",
  "(Change Request) Progress Updated",
] as const;

const STAGE_PLAN_FIELDS = [
  "(FSD) Plan in Week",
  "(Dev) Plan in Week",
  "(SIT) Plan in Week",
  "(UAT) Plan in Week",
  "(Live) Plan in Week",
  "(Change Request) Plan in Week",
] as const;

function lastFilledStageValue(
  source: DynamicProjectRecord,
  fields: readonly string[],
): string | undefined {
  for (let index = fields.length - 1; index >= 0; index -= 1) {
    const value = source[fields[index]];
    if (!isBlankSourceText(value)) return value;
  }
  return undefined;
}

function getProjectStage(statusValue: string | undefined): ProjectStage {
  const status = String(statusValue ?? "")
    .trim()
    .toLowerCase();

  if (status.includes("change request")) return "change-request";
  if (/\bfsd\b/.test(status)) return "fsd";
  if (/\b(?:dev|development)\b/.test(status)) return "development";
  if (/\bsit\b/.test(status)) return "sit";
  if (/\buat\b/.test(status) && status.includes("queue")) return "uat-queue";
  if (/\buat\b/.test(status) && status.includes("progress")) {
    return "uat-progress";
  }
  if (status.includes("monitoring")) return "monitoring";
  if (status === "live") return "live";
  return "other";
}

/**
 * The one set of month abbreviations used everywhere a date reaches the screen,
 * indexed by calendar month (0 = January).
 */
const DISPLAY_MONTHS = [
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
] as const;

/**
 * Maps every month spelling seen in the Notion log columns to its calendar
 * index, so `DISPLAY_MONTHS` stays the single source of the printed name.
 */
const MONTH_NAME_INDEX: Record<string, number> = {
  jan: 0,
  januari: 0,
  feb: 1,
  februari: 1,
  mar: 2,
  maret: 2,
  apr: 3,
  april: 3,
  may: 4,
  mei: 4,
  jun: 5,
  juni: 5,
  jul: 6,
  juli: 6,
  aug: 7,
  agu: 7,
  ags: 7,
  agustus: 7,
  sep: 8,
  september: 8,
  oct: 9,
  okt: 9,
  oktober: 9,
  nov: 10,
  november: 10,
  dec: 11,
  des: 11,
  desember: 11,
};

const LOG_MONTH_PATTERN = Object.keys(MONTH_NAME_INDEX)
  .sort((a, b) => b.length - a.length)
  .join("|");

/**
 * Two-digit years are read as 20xx: these columns only carry project years.
 */
function toDisplayYear(year: string): string {
  return year.length === 2 ? `20${year}` : year;
}

/**
 * Notion publishes the realized-date columns as ISO dates, optionally carrying
 * a time part.
 */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/;

/**
 * The plan columns record a week rather than a day, and Notion accepts free
 * text there, so one column holds `W3 Aug 26`, `W4 Jul 2026`, and
 * `Jul 26 - W1` side by side. All three name the same kind of value and are
 * rewritten to `W3 Agu 2026`.
 *
 * `Week 35` carries no month, so nothing can be rewritten without inventing
 * one; it is left exactly as recorded.
 */
const WEEK_BEFORE_MONTH = new RegExp(
  `\\bW\\s*(\\d{1,2})\\s+(${LOG_MONTH_PATTERN})\\s+(\\d{2,4})\\b`,
  "gi",
);
const WEEK_AFTER_MONTH = new RegExp(
  `\\b(${LOG_MONTH_PATTERN})\\s+(\\d{2,4})\\s*[-\u2013\u2014]\\s*W\\s*(\\d{1,2})\\b`,
  "gi",
);

function formatWeek(
  week: string,
  month: string,
  year: string,
  fallback: string,
): string {
  const monthIndex = MONTH_NAME_INDEX[month.toLowerCase()];
  if (monthIndex === undefined) return fallback;

  return `W${Number(week)} ${DISPLAY_MONTHS[monthIndex]} ${toDisplayYear(year)}`;
}

function normalizeWeekTokens(text: string): string {
  return text
    .replace(WEEK_AFTER_MONTH, (match, month, year, week) =>
      formatWeek(week, month, year, match),
    )
    .replace(WEEK_BEFORE_MONTH, (match, week, month, year) =>
      formatWeek(week, month, year, match),
    );
}

/**
 * Rewrites an ISO date to the same `1 Sep 2026` shape the log columns use, and
 * a week plan to `W1 Jul 2026`. Any time part is dropped: these columns record
 * a day, not a moment.
 *
 * Exported for the columns that read one named source field instead of the
 * stage-resolved one, so every date on screen passes through this function.
 */
export function formatSourceDateForDisplay(
  value: string | null | undefined,
): string | undefined {
  if (value == null) return undefined;

  const raw = String(value);
  const isoDate = ISO_DATE.exec(raw.trim());
  if (isoDate) {
    const [, year, month, day] = isoDate;
    const displayMonth = DISPLAY_MONTHS[Number(month) - 1];
    if (displayMonth !== undefined) {
      return `${Number(day)} ${displayMonth} ${year}`;
    }
  }

  return normalizeWeekTokens(raw);
}

/**
 * The dashboard reports on Jakarta working weeks, so an instant is dated by the
 * calendar day it fell on there, not by the reader's own clock.
 */
const JAKARTA_CALENDAR_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const JAKARTA_CLOCK = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function toEpochMs(
  value: number | string | Date | null | undefined,
): number | undefined {
  if (value == null) return undefined;

  const time =
    value instanceof Date
      ? value.getTime()
      : typeof value === "number"
        ? value
        : Date.parse(String(value));

  return Number.isNaN(time) ? undefined : time;
}

/**
 * Formats an instant the system recorded itself, such as the newest edit behind
 * the report period label. Reducing it to a Jakarta calendar day first lets the
 * same formatter print it, so a generated date reads exactly like a typed one.
 */
export function formatInstantForDisplay(
  value: number | string | Date | null | undefined,
): string | undefined {
  const time = toEpochMs(value);
  if (time === undefined) return undefined;

  return formatSourceDateForDisplay(JAKARTA_CALENDAR_DAY.format(time));
}

/**
 * Same date as `formatInstantForDisplay`, plus the clock reading that tells a
 * sync apart from the one before it. The hour is pinned to Jakarta so the run
 * is reported at the time it happened rather than at the reader's local time.
 */
export function formatInstantWithClockForDisplay(
  value: number | string | Date | null | undefined,
): string | undefined {
  const time = toEpochMs(value);
  if (time === undefined) return undefined;

  const day = formatSourceDateForDisplay(JAKARTA_CALENDAR_DAY.format(time));
  return day === undefined
    ? undefined
    : `${day}, ${JAKARTA_CLOCK.format(time)}`;
}

/**
 * Wording for a clock the dashboard reads rather than a column a person fills:
 * a sync that has never run is not an unanswered question.
 */
const MISSING_TIMESTAMP_VALUE = "Belum tersedia";

export function formatSyncTimestamp(
  timestamp: number | string | Date | null | undefined,
): string {
  return formatInstantWithClockForDisplay(timestamp) ?? MISSING_TIMESTAMP_VALUE;
}

function getStageDateValue(
  source: DynamicProjectRecord,
  stage: ProjectStage,
): string | undefined {
  switch (stage) {
    case "change-request":
      return source["(Change Request) Plan in Week"];
    case "fsd":
      return source["(FSD) Plan in Week"];
    case "development":
      return source["(Dev) Plan in Week"];
    case "sit":
      return source["(SIT) Plan in Week"];
    case "uat-progress":
    case "uat-queue":
      return source["(UAT) Plan in Week"];
    case "live":
      return source["(Live) Realized in Date"];
    case "monitoring":
      return source["(Mon After Live) Realized In Date"];
    default:
      return lastFilledStageValue(source, STAGE_PLAN_FIELDS);
  }
}

/**
 * Resolves the one source date field assigned to the project's current stage.
 */
export function getGlobalProjectDate(d: RawProject): string {
  const source = getDynamicProjectRecord(d);
  const stage = getProjectStage(source["Last Status"]);

  return toDisplayText(
    formatSourceDateForDisplay(getStageDateValue(source, stage)),
  );
}

const LOG_DATE_START = new RegExp(
  `\\d{1,2}\\s+(?:${LOG_MONTH_PATTERN})\\s+\\d{2,4}\\s*:`,
  "gi",
);
const LOG_DATE_TOKEN = new RegExp(
  `(\\d{1,2})\\s+(${LOG_MONTH_PATTERN})\\s+(\\d{2,4})(?=\\s*:)`,
  "gi",
);
const LOG_MARKER_BEFORE_DATE = /(?:[-*•●▪]\s*(?:\d+[.)]?\s+)?|\d+[.)]?\s+)$/;

/**
 * Rewrites recognized log dates to `12 Agu 2026` without touching the rest of
 * the source text.
 */
function normalizeLogDates(line: string): string {
  return line.replace(LOG_DATE_TOKEN, (match, day, month, year) => {
    const monthIndex = MONTH_NAME_INDEX[String(month).toLowerCase()];
    if (monthIndex === undefined) return match;

    return `${Number(day)} ${DISPLAY_MONTHS[monthIndex]} ${toDisplayYear(year)}`;
  });
}

function splitLogLineAtDateBoundaries(line: string): string[] {
  const dateStarts = [...line.matchAll(LOG_DATE_START)].map(
    (match) => match.index ?? 0,
  );
  if (dateStarts.length < 2) {
    const entry = line.trim();
    return entry === "" ? [] : [entry];
  }

  const entryStarts = [
    0,
    ...dateStarts.slice(1).map((dateStart) => {
      const textBeforeDate = line.slice(0, dateStart);
      const marker = textBeforeDate.match(LOG_MARKER_BEFORE_DATE);
      return marker?.index ?? dateStart;
    }),
  ].filter((start, index, starts) => index === 0 || start > starts[index - 1]);

  return entryStarts
    .map((start, index) => {
      const end = entryStarts[index + 1] ?? line.length;
      return line.slice(start, end).trim();
    })
    .filter((entry) => entry !== "");
}

/**
 * Adds display line breaks at recognized log boundaries without removing source
 * bullets, numbering, or text.
 */
export function getChronologicalLogEntries(
  text: string | null | undefined,
): string[] {
  if (isBlankSourceText(text)) return [];

  return String(text)
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map(normalizeLogDates)
    .flatMap(splitLogLineAtDateBoundaries);
}

export function formatLogWithNewLines(text: string | null | undefined): string {
  const entries = getChronologicalLogEntries(text);
  return entries.length > 0 ? entries.join("\n") : MISSING_DISPLAY_VALUE;
}

/**
 * Resolves the one progress field assigned to the project's current stage.
 */
export function getGlobalProgressUpdate(d: RawProject): string {
  const source = getDynamicProjectRecord(d);
  const stage = getProjectStage(source["Last Status"]);

  let progressField: string;
  switch (stage) {
    case "change-request":
      progressField = "(Change Request) Progress Updated";
      break;
    case "fsd":
      progressField = "(FSD) Progress Updated";
      break;
    case "development":
      progressField = "(Dev) Progress Updated";
      break;
    case "sit":
      progressField = "(SIT) Progress Updated";
      break;
    case "uat-progress":
    case "uat-queue":
      progressField = "(UAT) Progress Updated";
      break;
    // Notion never created a Progress Updated property for the Mon After Live
    // stage, only Status and Realized In Date. Monitoring continues the same
    // ticket after go-live, so its latest log lives in the Live field.
    case "live":
    case "monitoring":
      progressField = "(Live) Progress Updated";
      break;
    default:
      return formatLogWithNewLines(
        lastFilledStageValue(source, STAGE_PROGRESS_FIELDS),
      );
  }

  return formatLogWithNewLines(source[progressField]);
}

/**
 * Intake year comes from the "Project diajukan" column, which Notion records
 * per quarter. Only the year is usable; the column carries no month.
 */
export function getProjectSubmissionYear(d: RawProject): string {
  const source = getDynamicProjectRecord(d);
  return parseSubmissionYear(source["Project diajukan"]);
}

export function formatUATBatchText(text: string | null | undefined): string {
  return isBlankSourceText(text) ? MISSING_DISPLAY_VALUE : String(text);
}

export function calculateProjectAverageScore(item: RawProject): number | null {
  const source = getDynamicProjectRecord(item);
  const feedbackKeys = [
    "Nilai Feedback User :\nDapat berkolaborasi dengan Department lain dengan baik dalam Project",
    "Nilai Feedback User :\nDevelopment (include Fixing temuan selama Testing PIC dan SIT)",
    "Nilai Feedback User :\nDiskusi FPS dengan Developer sebelum FSD\n",
    "Nilai Feedback User :\nKejelasan komunikasi dan mudah dihubungi.",
    "Nilai Feedback User :\nKeterampilan teknis dan dokumentasi Project yang lengkap.",
    "Nilai Feedback User :\nMembantu menyelesaikan konflik di dalam Project.",
    "Nilai Feedback User :\nMemenuhi terget waktu Project.",
    "Nilai Feedback User :\nPembuatan FSD dan Review Internal IT",
    "Nilai Feedback User :\nTesting PIC Project dan SIT",
    "Nilai Feedback User :\nUAT (include perbaikan temuan UAT) dan Change Request 1",
    "Nilai Feedback User : Memahami kebutuhan klien dengan tepat.",
  ];

  let totalScore = 0;
  let validKeysCount = 0;

  feedbackKeys.forEach((key) => {
    const rawScore = source[key];
    if (isBlankSourceText(rawScore)) return;

    const score = Number(rawScore);
    if (!Number.isFinite(score) || score <= 0) return;

    totalScore += score > 5 ? score / 20 : score;
    validKeysCount++;
  });

  if (validKeysCount === 0) return null;

  return Math.min(5, totalScore / validKeysCount);
}
