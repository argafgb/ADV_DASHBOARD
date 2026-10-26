import "server-only";

import { sql } from "@/lib/db";
import type { DataScope } from "./data-scope";
import { planTableFilter, type ScopedTableName, type SiteDimension } from "./scoped-table-plan";

export type { ScopedTableName } from "./scoped-table-plan";

/** Normalized SQL expression for each site dimension, compared against UPPER(TRIM) branch names. */
function siteExpression(dimension: SiteDimension) {
  switch (dimension) {
    case "site":
      return sql`UPPER(TRIM(site))`;
    case "branch":
      return sql`UPPER(TRIM(branch))`;
    case "cabang":
      return sql`UPPER(TRIM(cabang))`;
    case "intended":
      // POSIX class instead of \s: a backslash inside a JS template literal is
      // consumed before it reaches Postgres, which silently turned \s into "s".
      return sql`UPPER(TRIM(REGEXP_REPLACE(REPLACE(intended, CHR(160), ' '), '^(ADV|WSS|WISESA)[[:space:]]+', '', 'i')))`;
  }
}

/** A filtered relation ensures every aggregate, count and detail query sees the same rows. */
export function scopedTable(table: ScopedTableName, scope: DataScope) {
  const source = sql`pm_asset_it.${sql(table)}`;
  const plan = planTableFilter(table, scope);
  switch (plan.kind) {
    case "all":
      return source;
    case "none":
      return sql`(SELECT * FROM ${source} WHERE FALSE) AS ${sql(table)}`;
    case "sites":
      return sql`(SELECT * FROM ${source} WHERE ${siteExpression(plan.dimension)} = ANY(${plan.sites})) AS ${sql(table)}`;
  }
}
