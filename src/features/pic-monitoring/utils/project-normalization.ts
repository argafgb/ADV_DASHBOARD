import type { RawProject } from "../types/types";

export type DynamicProjectRow = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is DynamicProjectRow {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getAuthoritativeSource(row: DynamicProjectRow): DynamicProjectRow {
  return isRecord(row.cleansed_data) ? row.cleansed_data : row;
}

function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

/**
 * Nilai yang datang apa adanya dari Notion tapi bukan data: `#N/A` adalah sisa
 * formula lookup yang gagal, sedangkan `undefined`/`null` muncul sebagai teks
 * saat kolom tidak pernah diisi.
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

export function isPlaceholderSourceValue(value: unknown): boolean {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  return normalized === "" || PLACEHOLDER_SOURCE_VALUES.has(normalized);
}

/**
 * Sebuah baris dianggap tidak layak tampil ketika nama proyeknya kosong atau
 * masih berisi placeholder. Baris seperti ini tidak bisa dibaca manusia dan
 * tidak boleh ikut dihitung, jadi dibuang dari seluruh pool.
 */
export function isIncompleteProjectRow(row: DynamicProjectRow): boolean {
  return isPlaceholderSourceValue(getAuthoritativeSource(row)["Project Name"]);
}

/** Membuang baris tanpa identitas proyek yang terbaca. */
export function excludeIncompleteRows<Project extends DynamicProjectRow>(
  dataset: readonly Project[],
): Project[] {
  return dataset.filter((row) => !isIncompleteProjectRow(row));
}

export function isInternalItProjectType(value: unknown): boolean {
  return (
    String(value ?? "")
      .trim()
      .toLowerCase() === "internal it"
  );
}

/**
 * Type Project yang tidak dinilai lewat form feedback user. Internal IT tidak
 * punya user bisnis sebagai penilai, dan Approval Digital bukan proyek
 * pengembangan sehingga tidak pernah melalui siklus feedback.
 *
 * Pengecualian ini hanya berlaku untuk scope User Feedback. Pool operasional
 * dan kartu Go-Live tidak terpengaruh.
 */
const EXCLUDED_FEEDBACK_PROJECT_TYPES: ReadonlySet<string> = new Set([
  "internal it",
  "approval digital",
]);

export function isExcludedFeedbackProjectType(value: unknown): boolean {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");

  return EXCLUDED_FEEDBACK_PROJECT_TYPES.has(normalized);
}

/**
 * Last Status values that are kept out of every dashboard visual: Canceled and
 * Pending Requirement are not part of the operational board, and a blank status
 * cannot be placed in any status group.
 */
const EXCLUDED_OPERATIONAL_STATUSES: ReadonlySet<string> = new Set([
  "canceled",
  "cancelled",
  "pending requirement",
]);

export function isExcludedOperationalStatus(value: unknown): boolean {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");

  return normalized === "" || EXCLUDED_OPERATIONAL_STATUSES.has(normalized);
}

/** Projects exact canonical fields without changing the authoritative source. */
export function normalizeProjectRows(
  rows: readonly DynamicProjectRow[],
): RawProject[] {
  return rows.map((row) => {
    const source = getAuthoritativeSource(row);

    return {
      ...row,
      ...source,
      "Project Name": text(source["Project Name"]),
      "Owner Div": text(source["Owner Div"]),
      "Owner Name": text(source["Owner Name"]),
      "PIC Name": text(source["PIC Name"]),
      "Last Status": text(source["Last Status"]),
      "Type Project": text(source["Type Project"]),
      "(FSD) Status": text(source["(FSD) Status"]),
      "(Dev) Status": text(source["(Dev) Status"]),
      "(SIT) Status": text(source["(SIT) Status"]),
    } as RawProject;
  });
}

/**
 * The single operational pool every dashboard visual reads from.
 *
 * Rows are excluded when the authoritative Notion type is Internal IT, or when
 * the authoritative Last Status is Canceled, Pending Requirement, or blank. No
 * period filter is applied: the board reflects the current state of all rows.
 */
export function getBusinessOperationalData<
  Project extends DynamicProjectRow = RawProject,
>(dataset: readonly Project[]): Project[] {
  return dataset.filter((project) => {
    const source = getAuthoritativeSource(project);
    return (
      !isIncompleteProjectRow(project) &&
      !isInternalItProjectType(source["Type Project"]) &&
      !isExcludedOperationalStatus(source["Last Status"])
    );
  });
}

function excludeInternalIt<Project extends DynamicProjectRow>(
  dataset: readonly Project[],
): Project[] {
  return dataset.filter(
    (project) =>
      !isInternalItProjectType(getAuthoritativeSource(project)["Type Project"]),
  );
}

/**
 * Pool backing every SLA visual, including Year-on-Year comparisons.
 *
 * The Notion views exclude Type Project = Internal IT. Other operational
 * exclusions remain bypassed: rows such as Canceled and Pending Requirement
 * still contribute when they carry a valid SLA result and matching SLA YEAR.
 */
export function getSlaEvaluationPool<Project extends DynamicProjectRow>(
  masterDataset: readonly Project[],
): Project[] {
  return excludeInternalIt(excludeIncompleteRows(masterDataset));
}
