export function isSelectableBranch(name: string): boolean {
  const clean = name.trim().toUpperCase();
  if (!clean || clean === "-") return false;
  if (/^TEST\b/.test(clean)) return false;
  return true;
}

/** Normalizes known aliases used by HR, ticket, and region data for one site. */
export function branchNameAliases(name: string): string[] {
  const clean = name.trim().toUpperCase();
  if (!clean) return [];

  const jakartaCideng = ["JAKARTA", "JAKARTA-CIDENG", "CIDENG", "JAKARTA - TEBET"];
  return jakartaCideng.includes(clean) ? jakartaCideng : [clean];
}

/** Merges standard and observed sites into a sorted, de-duplicated, selectable list. */
export function buildBranchOptions(
  standard: readonly string[],
  observed: readonly string[],
): string[] {
  return Array.from(
    new Set([...standard, ...observed].map((b) => b.trim().toUpperCase())),
  )
    .filter(isSelectableBranch)
    .sort();
}
