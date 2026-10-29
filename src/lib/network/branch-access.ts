import "server-only";
import { cache } from "react";
import { sql } from "@/lib/db";
import { getCurrentAccess } from "@/lib/access/session";
import type { DataScope } from "@/lib/access/data-scope";
import {
  NO_BRANCH_ACCESS,
  resolveBranchRequest,
  type BranchAccess,
} from "./branch-scope";

const isSkipAuth =
  (process.env.SKIP_AUTH === "true" ||
    process.env.NEXT_PUBLIC_SKIP_AUTH === "true" ||
    process.env.DISABLE_AUTH === "true") &&
  process.env.NODE_ENV !== "production";

/** The current user's data scope. */
export const getRequestDataScope = cache(async (): Promise<DataScope> => {
  if (isSkipAuth) {
    return { all: true };
  }
  const currentAccess = await getCurrentAccess();
  if (!currentAccess) {
    return { all: false, departments: [], branches: [] };
  }
  return currentAccess.scope;
});

/**
 * Resolves token branch names to branch ids through v_branch_lookup.
 * If user has full access (scope.all === true or branches === null), returns { all: true }.
 * If user has specific branches, resolves them against v_branch_lookup.
 */
export const getRequestBranchAccess = cache(async (): Promise<BranchAccess> => {
  if (isSkipAuth) {
    return { all: true };
  }

  const access = await getCurrentAccess();
  if (!access) return NO_BRANCH_ACCESS;

  const request = resolveBranchRequest(access.scope);
  if (request.kind === "all") return { all: true };
  if (request.kind === "deny") return NO_BRANCH_ACCESS;

  try {
    const matched = await sql<{ lookup_key: string; id: string }[]>`
      SELECT DISTINCT lookup_key, branch_id::text AS id
        FROM network_performance.v_branch_lookup
       WHERE lookup_key = ANY(${request.names}::text[])
         AND branch_id IS NOT NULL
    `;
    const unresolved = request.names.filter(
      (name) => !matched.some((m) => m.lookup_key === name),
    );
    if (unresolved.length) {
      console.warn("[BranchAccess] Unresolved branch names in token:", unresolved);
    }

    const ids = [...new Set(matched.map((m) => m.id))].sort();
    if (!ids.length) return NO_BRANCH_ACCESS;

    // Every name the granted branches are known by, for name-keyed sources.
    const keys = await sql<{ key: string }[]>`
      SELECT lookup_key AS key
        FROM network_performance.v_branch_lookup
       WHERE branch_id::text = ANY(${ids}::text[])
      UNION
      SELECT UPPER(TRIM(k)) AS key
        FROM network_performance.branches b,
             LATERAL (VALUES (b.name), (b.display_name)) AS v(k)
       WHERE b.id::text = ANY(${ids}::text[]) AND k IS NOT NULL
    `;
    return {
      all: false,
      ids,
      keys: [...new Set(keys.map((k) => k.key))].sort(),
    };
  } catch (err) {
    console.error("[BranchAccess] Failed to resolve branch scope:", err);
    return NO_BRANCH_ACCESS;
  }
});
