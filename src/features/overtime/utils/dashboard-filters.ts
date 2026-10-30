import {
  normalizeMonthFilter,
  normalizeYear,
  parseMonthRange,
} from "./month-filter";

export const AREA_KEYS = ["ALL", "OPS", "HO"] as const;
export type AreaKey = (typeof AREA_KEYS)[number];
export type DeptKey = AreaKey;

export function normalizeArea(value: string | null | undefined): AreaKey {
  return AREA_KEYS.includes(value?.toUpperCase() as AreaKey)
    ? (value!.toUpperCase() as AreaKey)
    : "ALL";
}

export function normalizeDepartment(value: string | null | undefined): DeptKey {
  return normalizeArea(value);
}

export function normalizeUnitCode(
  value: string | null | undefined,
): string | null {
  const clean = value?.trim();
  return clean ? clean : null;
}

export interface OrgUnitOption {
  area: string;
  level1Code: string;
  level1Name: string;
  level2Code: string | null;
  level2Name: string | null;
  periods: string[];
}

export interface OrgFilterOptions {
  years: string[];
  units: OrgUnitOption[];
}

export const EMPTY_ORG_FILTER_OPTIONS: OrgFilterOptions = {
  years: [],
  units: [],
};

export interface UnitOption {
  v: string;
  t: string;
}

export const ORG_UNIT_LABELS: Record<
  AreaKey,
  { level1: string; level2: string }
> = {
  ALL: { level1: "Unit", level2: "Sub-unit" },
  OPS: { level1: "Region", level2: "Cabang" },
  HO: { level1: "Divisi", level2: "Department" },
};

export interface OrgUnitScope {
  year: string;
  month: string;
  area: AreaKey;
  level1?: string | null;
  level2?: string | null;
}

function matchesPeriod(unit: OrgUnitOption, year: string, month: string) {
  const prefix = `${year}-`;
  const { start, end } = parseMonthRange(month);

  return unit.periods.some((period) => {
    if (!period.startsWith(prefix)) return false;
    if (start === null || end === null) return true;
    const m = Number(period.slice(prefix.length));
    return m >= start && m <= end;
  });
}

function inScope(unit: OrgUnitOption, scope: OrgUnitScope) {
  if (scope.area !== "ALL" && unit.area !== scope.area) return false;
  return matchesPeriod(unit, scope.year, scope.month);
}

function toSortedOptions(seen: Map<string, string>): UnitOption[] {
  return [...seen]
    .map(([v, t]) => ({ v, t }))
    .sort((a, b) => a.t.localeCompare(b.t, "id-ID"));
}

export function getLevel1Options(
  options: OrgFilterOptions,
  scope: OrgUnitScope,
): UnitOption[] {
  const seen = new Map<string, string>();

  for (const unit of options.units) {
    if (!inScope(unit, scope)) continue;
    if (!seen.has(unit.level1Code)) {
      seen.set(unit.level1Code, unit.level1Name || unit.level1Code);
    }
  }

  return toSortedOptions(seen);
}

export function getLevel2Options(
  options: OrgFilterOptions,
  scope: OrgUnitScope,
): UnitOption[] {
  const seen = new Map<string, string>();

  for (const unit of options.units) {
    if (!inScope(unit, scope)) continue;
    if (!unit.level2Code) continue;
    if (scope.level1 && unit.level1Code !== scope.level1) continue;
    if (!seen.has(unit.level2Code)) {
      seen.set(unit.level2Code, unit.level2Name || unit.level2Code);
    }
  }

  return toSortedOptions(seen);
}

export function resolveOrgUnitFilters(
  options: OrgFilterOptions,
  scope: OrgUnitScope,
): { level1: string | null; level2: string | null } {
  const level1 = scope.level1 ?? null;
  const level2 = scope.level2 ?? null;

  if (options.units.length === 0) return { level1, level2 };

  const validLevel1 = getLevel1Options(options, scope).some(
    (o) => o.v === level1,
  )
    ? level1
    : null;

  const validLevel2 = getLevel2Options(options, {
    ...scope,
    level1: validLevel1,
  }).some((o) => o.v === level2)
    ? level2
    : null;

  return { level1: validLevel1, level2: validLevel2 };
}

export interface DashboardSearchParams {
  year?: string | null;
  month?: string | null;
  dept?: string | null;
  area?: string | null;
  level1?: string | null;
  level2?: string | null;
  division?: string | null;
  department?: string | null;
}

export interface DashboardFilterContext {
  availableYears?: readonly string[];
  orgFilterOptions?: OrgFilterOptions;
}

export function getDashboardFilters(
  params: DashboardSearchParams,
  context: DashboardFilterContext = {},
) {
  const requestedYear = normalizeYear(params.year);
  const availableYears = context.availableYears ?? [];
  const year =
    availableYears.length === 0 || availableYears.includes(requestedYear)
      ? requestedYear
      : availableYears[0];

  const month = normalizeMonthFilter(params.month, year);
  const area = normalizeArea(params.area ?? params.dept);

  const scope: OrgUnitScope = {
    year,
    month,
    area,
    level1: normalizeUnitCode(params.level1),
    level2: normalizeUnitCode(params.level2),
  };

  const { level1, level2 } = context.orgFilterOptions
    ? resolveOrgUnitFilters(context.orgFilterOptions, scope)
    : { level1: scope.level1 ?? null, level2: scope.level2 ?? null };

  return {
    year,
    month,
    dept: normalizeArea(params.dept ?? params.area),
    area,
    level1,
    level2,
    division: params.division ?? null,
    department: params.department ?? null,
  };
}
