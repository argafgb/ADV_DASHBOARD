import type { DataScope } from "@/lib/access/data-scope";

/** What the token asks for, before the names are resolved against the branch directory. */
export type BranchRequest =
  | { kind: "all" }
  | { kind: "deny" }
  | { kind: "branches"; names: string[] };

/**
 * Resolved access, serialisable so it can be an argument (and cache key) of
 * "use cache" functions.
 * - `ids`  : network_performance.branches.id values the user may read
 * - `keys` : every lookup key (canonical names + aliases) of those branches,
 *            for sources joined by name instead of branch_id
 */
export type BranchAccess =
  | { all: true }
  | { all: false; ids: string[]; keys: string[] };

export const NO_BRANCH_ACCESS: BranchAccess = { all: false, ids: [], keys: [] };

/**
 * Helpdesk site names that differ from the network branch directory.
 * Kept here rather than in network_performance.branch_aliases because that
 * table also drives ETL joins, and these names are an access-control contract
 * with the Helpdesk issuer, not source-data spellings.
 * Jakarta-Cideng is the Cideng site (branches.name = 'CIDENG').
 */
export const HELPDESK_BRANCH_ALIASES: Record<string, string> = {
  "JAKARTA-CIDENG": "CIDENG",
  JAKARTA: "CIDENG",
};

/**
 * Normalises branch keys to match v_branch_lookup.lookup_key.
 */
export function normalizeBranchKey(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/^(ADV|WSS|WISESA)\s+/i, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/**
 * Resolves DataScope into a BranchRequest.
 * If scope.all is true or scope.branches is null (unrestricted), grant all.
 * Otherwise, resolves the listed branch names.
 */
export function resolveBranchRequest(scope: DataScope): BranchRequest {
  if (scope.all) return { kind: "all" };
  if (scope.branches === null) return { kind: "all" };
  if (!scope.branches || !scope.branches.length) return { kind: "deny" };
  const names = [
    ...new Set(
      scope.branches
        .map(normalizeBranchKey)
        .filter(Boolean)
        .map((name) => HELPDESK_BRANCH_ALIASES[name] ?? name),
    ),
  ].sort();
  return names.length ? { kind: "branches", names } : { kind: "deny" };
}

export function canSeeBranchKey(
  access: BranchAccess,
  raw: string | null | undefined,
): boolean {
  if (access.all) return true;
  const key = normalizeBranchKey(raw);
  return key !== "" && access.keys.includes(key);
}
