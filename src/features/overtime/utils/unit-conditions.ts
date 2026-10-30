import { sql } from "@/lib/db";

export function unitConditions(level1: string | null, level2: string | null) {
  return {
    level1Condition: level1 ? sql`t.level1_code = ${level1}` : sql`TRUE`,
    level2Condition: level2 ? sql`t.level2_code = ${level2}` : sql`TRUE`,
  };
}

export function unitCacheKey(
  level1: string | null,
  level2: string | null,
): string {
  return `${level1 ?? "ALL"}:${level2 ?? "ALL"}`;
}
