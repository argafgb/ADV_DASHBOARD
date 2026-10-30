import "server-only";
import { sql } from "@/lib/db";
import type { BranchAccess } from "./branch-scope";

/**
 * SQL predicate restricting `column` (a branches.id reference such as "b.id")
 * to the granted branches. Rows with a NULL branch id never match a
 * restricted scope.
 */
export function branchFilter(access: BranchAccess, column: string) {
  if (access.all) return sql`TRUE`;
  if (!access.ids.length) return sql`FALSE`;
  return sql`${sql(column)}::text = ANY(${access.ids}::text[])`;
}

/**
 * Same restriction for sources that only carry a branch *name* (views without
 * a branch id). `column` is compared UPPER/TRIM against every known name and
 * alias of the granted branches.
 */
export function branchNameFilter(access: BranchAccess, column: string) {
  if (access.all) return sql`TRUE`;
  if (!access.keys.length) return sql`FALSE`;
  return sql`UPPER(TRIM(${sql(column)})) = ANY(${access.keys}::text[])`;
}
