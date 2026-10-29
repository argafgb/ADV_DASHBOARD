import type { DesiredUserAccess } from "./access-diff";
import { requiresBranchScope } from "./data-scope";
import { AccessDeniedError } from "./errors";

export function normalizeScopeInput(
  scope: DesiredUserAccess["scope"],
  roleKey: string,
  employeeBranch?: string | null,
  employeeRegions: string[] = [],
): Required<DesiredUserAccess["scope"]> {
  const clean = (values: string[] = []) => [...new Set(values.map((v) => v.trim().toUpperCase()).filter(Boolean))].sort();
  const all = scope.all && !requiresBranchScope(roleKey);
  const departments = [...new Set(scope.departments ?? [])].sort();
  if (all) return { all, departments, branches: [], regions: [] };
  let branches = clean(scope.branches);
  let regions = clean(scope.regions);
  const homeBranch = employeeBranch?.trim().toUpperCase();
  if (homeBranch && (roleKey === "staff" || roleKey === "branch-manager")) {
    branches = [homeBranch];
    regions = [];
  } else if (roleKey === "regional-head") {
    // Keep an explicit region or site selection. Only derive the default from
    // the employee's home branch when the editor has no location selected.
    if (regions.length > 0) {
      branches = [];
    } else if (branches.length > 0) {
      regions = [];
    } else if (homeBranch && employeeRegions.length > 0) {
      regions = clean(employeeRegions);
    } else if (homeBranch) {
      throw new AccessDeniedError(`Cabang ${homeBranch} belum memiliki mapping region.`, "REGION_NOT_MAPPED", 422);
    }
  }
  if (branches.length === 0 && regions.length === 0) {
    if (roleKey === "regional-head" && employeeRegions.length > 0) regions = clean(employeeRegions);
    else if (requiresBranchScope(roleKey) && employeeBranch) branches = clean([employeeBranch]);
  }
  if (branches.length === 0 && regions.length === 0) {
    throw new AccessDeniedError("Pilih minimal satu Region atau Site. Cabang akun belum tersedia untuk diisi otomatis.", "SCOPE_REQUIRED", 422);
  }
  return { all: false, departments, branches, regions };
}
