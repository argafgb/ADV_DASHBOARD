import "server-only";
import { sql } from "@/lib/db";
import type { DatasetAccess } from "./data-scope";

export type AllowedDatasetAccess = Extract<DatasetAccess, { kind: "allow" }>;

/**
 * Menghasilkan fragmen SQL untuk filter departemen yang terotorisasi.
 */
export function departmentCondition(
  access: AllowedDatasetAccess,
  column = sql`department_name`,
) {
  return sql`${column} IN ${sql(access.departments)}`;
}

/**
 * Menghasilkan fragmen SQL untuk filter cabang yang terotorisasi.
 * Bila cakupan cabang tidak dibatasi (null), mengembalikan sql`TRUE`.
 * Otomatis memetakan variasi penamaan (misal JAKARTA / CIDENG mencakup JAKARTA-CIDENG).
 */
export function branchCondition(
  access: AllowedDatasetAccess,
  column = sql`branch_name`,
) {
  if (access.branches === null) {
    return sql`TRUE`;
  }

  const expanded = new Set<string>();
  for (const b of access.branches) {
    const clean = b.trim().toUpperCase();
    if (!clean) continue;
    expanded.add(clean);
    if (clean === "JAKARTA" || clean === "CIDENG" || clean === "JAKARTA - TEBET") {
      expanded.add("JAKARTA-CIDENG");
    }
    if (clean === "JAKARTA-CIDENG") {
      expanded.add("JAKARTA");
      expanded.add("CIDENG");
    }
  }

  const list = Array.from(expanded);
  if (list.length === 0) {
    return sql`FALSE`;
  }

  return sql`UPPER(TRIM(${column})) IN ${sql(list)}`;
}
