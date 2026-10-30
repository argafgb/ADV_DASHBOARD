import { unstable_cache } from "next/cache";
import { sql } from "@/lib/db";
import type { FilterOption } from "../types/filter.types";

const ALL_PROJECTS_OPTION: FilterOption = {
  value: "ALL",
  label: "All Projects",
};

const ALL_ROLES_OPTION: FilterOption = {
  value: "ALL",
  label: "All Roles",
};

export const DASHBOARD_PERIOD_SCOPE_SQL =
  "NULLIF(TRIM(periode), '') IS NOT NULL";

async function fetchProjectLookupOptionsFromDb(): Promise<FilterOption[]> {
  const rows = await sql<{ value: string; label: string }[]>`
    SELECT DISTINCT
        project_name AS value,
        project_name AS label
    FROM bug_tracker.master_list_bugs
    WHERE NULLIF(TRIM(periode), '') IS NOT NULL
      AND NULLIF(TRIM(project_name), '') IS NOT NULL
      AND TRIM(project_name) <> '-'
    ORDER BY project_name ASC;
  `;

  const options = rows.map((r) => ({
    value: r.value,
    label: r.label,
  }));

  return [ALL_PROJECTS_OPTION, ...options];
}

async function fetchRoleLookupOptionsFromDb(): Promise<FilterOption[]> {
  const rows = await sql<{ value: string; label: string }[]>`
    SELECT DISTINCT
        section_name AS value,
        section_name AS label
    FROM bug_tracker.master_list_bugs
    WHERE NULLIF(TRIM(periode), '') IS NOT NULL
      AND NULLIF(TRIM(section_name), '') IS NOT NULL
      AND TRIM(section_name) <> '-'
    ORDER BY section_name ASC;
  `;

  const options = rows.map((r) => ({
    value: r.value,
    label: r.label,
  }));

  return [ALL_ROLES_OPTION, ...options];
}

const getCachedProjectOptions = unstable_cache(
  fetchProjectLookupOptionsFromDb,
  ["project-lookup-options"],
  {
    revalidate: 3600,
    tags: ["project-lookup-options"],
  },
);

const getCachedRoleOptions = unstable_cache(
  fetchRoleLookupOptionsFromDb,
  ["role-lookup-options"],
  {
    revalidate: 3600,
    tags: ["role-lookup-options"],
  },
);

/**
 * Fetches unique project names from bug_tracker.master_list_bugs for global filter lookup.
 * Uses Next.js unstable_cache with a 1-hour revalidation period (3600 seconds).
 * Errors are caught outside unstable_cache so fallbacks are never persisted into cache.
 */
export async function getProjectLookupOptions(): Promise<FilterOption[]> {
  try {
    return await getCachedProjectOptions();
  } catch (error) {
    console.error(
      "Failed to fetch project lookup options from database:",
      error,
    );
    return [ALL_PROJECTS_OPTION];
  }
}

/**
 * Fetches unique section/role names from bug_tracker.master_list_bugs for global filter lookup.
 * Uses Next.js unstable_cache with a 1-hour revalidation period (3600 seconds).
 * Errors are caught outside unstable_cache so fallbacks are never persisted into cache.
 */
export async function getRoleLookupOptions(): Promise<FilterOption[]> {
  try {
    return await getCachedRoleOptions();
  } catch (error) {
    console.error("Failed to fetch role lookup options from database:", error);
    return [ALL_ROLES_OPTION];
  }
}
