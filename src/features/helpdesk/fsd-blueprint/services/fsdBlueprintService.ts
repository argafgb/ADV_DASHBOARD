import "server-only";
import { sql } from "@/lib/db";
import { parseMonthFilter } from "@/lib/filter-utils";
import { unstable_cache } from "next/cache";
import {
  resolveDatasetAccess,
  DATASET_CAPS,
  scopeKey,
  type DataScope,
} from "@/lib/access/data-scope";
import { FsdBlueprintItem, FsdFilterInput } from "../types/fsdBlueprint.types";
import {
  filterFsdItems,
  mapDbRowToFsdItem,
  type FsdBlueprintDbRow,
} from "../utils/fsdCalculations";

export async function getFsdBlueprintListRaw(
  input: FsdFilterInput = {},
): Promise<FsdBlueprintItem[]> {
  try {
    const yearNum =
      input.year && input.year !== "ALL" && input.year !== "all"
        ? parseInt(input.year, 10)
        : null;

    const { months, isAll } = parseMonthFilter(input.month || "ALL");

    const yearCondition = yearNum !== null ? sql`year = ${yearNum}` : sql`TRUE`;
    const monthCondition =
      !isAll && months.length > 0 ? sql`month IN ${sql(months)}` : sql`TRUE`;

    const rows = await sql<FsdBlueprintDbRow[]>`
      SELECT
        id,
        year,
        month,
        quarter,
        owner,
        status,
        module_name,
        scope,
        pic_it_old,
        pic_it_new,
        date_start,
        pic_project_owner,
        reviewer_it,
        reviewer_cpp,
        reviewer_other,
        update_progress,
        date_end,
        quartal,
        end_doc,
        end_review,
        time_input,
        time_edit
      FROM helpdesk.helpdesk_fsd
      WHERE ${yearCondition}
        AND ${monthCondition}
      ORDER BY date_start DESC, module_name ASC;
    `;

    const mapped = rows.map((r, i) => mapDbRowToFsdItem(r, i));
    return filterFsdItems(mapped, input);
  } catch (error) {
    console.error("Failed to query helpdesk.helpdesk_fsd:", error);
    return [];
  }
}

export async function getFsdBlueprintListData(
  input: FsdFilterInput = {},
  scope: DataScope,
): Promise<FsdBlueprintItem[]> {
  const access = resolveDatasetAccess(scope, DATASET_CAPS.fsd);
  if (access.kind === "deny") return [];

  return unstable_cache(
    async () => getFsdBlueprintListRaw(input),
    [
      "fsd-blueprint-list-data-v2",
      input.year || "ALL",
      input.month || "ALL",
      input.status || "ALL",
      input.owner || "ALL",
      scopeKey(scope),
    ],
    { revalidate: 300, tags: ["fsd-blueprint-list"] },
  )();
}
