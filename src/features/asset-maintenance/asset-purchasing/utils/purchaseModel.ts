import { parseMonthFilter } from "@/lib/filter-utils";
import type {
  AssetPurchasingModel,
  PurchaseCategory,
  PurchaseCategoryFilter,
  PurchaseModelInput,
  PurchaseMonth,
  PurchaseTableRow,
} from "../types";

const sum = (values: readonly number[]) =>
  values.reduce((total, value) => total + value, 0);
const periodKey = ({ year, month }: PurchaseMonth) => `${year}-${month}`;

export function selectedPurchaseMonths(
  input: PurchaseModelInput,
): PurchaseMonth[] {
  const requestedMonths = new Set(parseMonthFilter(input.month).months);
  return input.data.months.filter(
    ({ year, month }) =>
      String(year) === input.year && requestedMonths.has(month),
  );
}

function periodLabel(months: PurchaseMonth[], year: string): string {
  if (months.length === 0) return "Data belum tersedia pada periode terpilih";
  return months.length === 1
    ? `${months[0].label} ${year}`
    : `${months[0].label}–${months.at(-1)?.label} ${year}`;
}

function categoryMatches(
  category: PurchaseCategory,
  filter: PurchaseCategoryFilter,
) {
  return filter === "all" || category === filter;
}

export function deriveAssetPurchasingModel(
  input: PurchaseModelInput,
): AssetPurchasingModel {
  const selectedMonths = selectedPurchaseMonths(input);
  const tableRows: PurchaseTableRow[] = input.data.items
    .filter((item) => categoryMatches(item.category, input.category))
    .map((item) => {
      const units = selectedMonths.map(
        (month) => item.unitsByPeriod[periodKey(month)] ?? 0,
      );
      const total = sum(units);
      return {
        name: item.name,
        category: item.category,
        units,
        total,
        isZero: total === 0,
      };
    });

  const categoryTotals: Record<PurchaseCategory, number> = {
    Workstation: 0,
    Peripheral: 0,
  };
  for (const item of input.data.items) {
    categoryTotals[item.category] += sum(
      selectedMonths.map((month) => item.unitsByPeriod[periodKey(month)] ?? 0),
    );
  }

  const monthly = selectedMonths.map((meta) => {
    const Workstation = input.data.items
      .filter(({ category }) => category === "Workstation")
      .reduce(
        (total, item) => total + (item.unitsByPeriod[periodKey(meta)] ?? 0),
        0,
      );
    const Peripheral = input.data.items
      .filter(({ category }) => category === "Peripheral")
      .reduce(
        (total, item) => total + (item.unitsByPeriod[periodKey(meta)] ?? 0),
        0,
      );
    const total =
      input.category === "Workstation"
        ? Workstation
        : input.category === "Peripheral"
          ? Peripheral
          : Workstation + Peripheral;
    return { ...meta, Workstation, Peripheral, total };
  });

  const yearMonths = input.data.months.filter(
    ({ year }) => String(year) === input.year,
  );
  const annualMonthly = yearMonths.map((meta) => {
    const total = input.data.items
      .filter((item) => categoryMatches(item.category, input.category))
      .reduce(
        (monthTotal, item) =>
          monthTotal + (item.unitsByPeriod[periodKey(meta)] ?? 0),
        0,
      );
    return { ...meta, total };
  });
  const peakMonth = annualMonthly.reduce<(typeof annualMonthly)[number] | null>(
    (peak, item) => (!peak || item.total > peak.total ? item : peak),
    null,
  );
  const query = input.search?.trim().toLowerCase() ?? "";
  const searchedRows = query
    ? tableRows.filter((row) => row.name.toLowerCase().includes(query))
    : tableRows;

  return {
    supportedPeriod: selectedMonths.length > 0,
    selectedMonths,
    periodLabel: periodLabel(selectedMonths, input.year),
    scopeLabel: input.category === "all" ? "Semua kategori" : input.category,
    totalUnits: sum(tableRows.map(({ total }) => total)),
    categoryTotals,
    peak: peakMonth
      ? { label: peakMonth.fullLabel, units: peakMonth.total }
      : null,
    monthly,
    topItems: tableRows
      .filter(({ total }) => total > 0)
      .map(({ name, category, total }) => ({ name, category, total }))
      .sort((a, b) => b.total - a.total),
    tableRows,
    searchedRows,
    tableMonthlyTotals: selectedMonths.map((_, index) =>
      tableRows.reduce((total, row) => total + row.units[index], 0),
    ),
    tableTotal: sum(tableRows.map(({ total }) => total)),
  };
}

const csvEscape = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/** CSV intentionally ignores local search, matching the standalone behavior. */
export function assetPurchasingCsv(model: AssetPurchasingModel): string {
  const headers = [
    "No",
    "Item Type",
    "Category",
    ...model.selectedMonths.map(({ label }) => label),
    "Total",
  ];
  const rows = model.tableRows.map((row, index) => [
    index + 1,
    row.name,
    row.category,
    ...row.units,
    row.total,
  ]);
  return [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
}
