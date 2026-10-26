/** Contract shared with the Helpdesk issuer. Branches are site names, not regions. */
export type DataScope =
  | { all: true }
  | { all: false; departments: string[] | null; branches: string[] | null };

export const DENIED_SCOPE: DataScope = {
  all: false,
  departments: [],
  branches: [],
};

export function parseDataScope(value: unknown): DataScope {
  if (!value || typeof value !== "object" || Array.isArray(value)) return DENIED_SCOPE;
  const claim = value as Record<string, unknown>;
  if (claim.all === true) return { all: true };
  if (claim.all !== false) return DENIED_SCOPE;
  const validList = (item: unknown) =>
    item === null ||
    (Array.isArray(item) && item.every((entry) => typeof entry === "string"));
  if (!validList(claim.departments) || !validList(claim.branches)) return DENIED_SCOPE;
  if (claim.departments === null && claim.branches === null) return DENIED_SCOPE;
  return {
    all: false,
    departments: claim.departments as string[] | null,
    branches: (claim.branches as string[] | null)?.map((branch) => branch.trim().toUpperCase()).filter(Boolean) ?? null,
  };
}

export function scopeKey(scope: DataScope): string {
  if (scope.all) return "all";
  return JSON.stringify({
    departments: scope.departments?.slice().sort() ?? null,
    branches: scope.branches?.slice().sort() ?? null,
  });
}
