import { categoryVisual, MONTHS_SHORT, UNCATEGORIZED_LABEL } from "./dashboard-config";
import { categoryLabels } from "./dashboard-selectors";
import { formatDateId, matchesMonth, yearOf } from "./dates";
import { comparisonYears, selectedYears } from "./year-filter";
import type { CategoryId, DataYear, EventType, MonthFilter, YearFilter, DashboardData } from "../types/dashboard.types";

export interface TimelineItem {
  id: string;
  title: string;
  date: string;
  dateLabel: string;
  year: DataYear;
  type: EventType;
  typeLabel: string;
  category: CategoryId;
  categoryLabel: string;
  color: string;
  tint: string;
  person: string;
  personLabel: string;
  vendor: string | null;
}

export interface TimelineYear {
  year: DataYear;
  items: TimelineItem[];
}

export interface TimelineModel {
  years: TimelineYear[];
  months: typeof MONTHS_SHORT;
  total: number;
  internal: number;
  external: number;
  certifications: number;
  categories: { id: CategoryId; label: string }[];
}

const typeLabels: Record<EventType, string> = {
  internal: "Internal",
  external: "External",
  sertifikasi: "Sertifikasi",
};

export function buildTimeline(
  data: DashboardData,
  yearFilter: YearFilter,
  month: MonthFilter = "ALL",
): TimelineModel {
  const trainingItems: TimelineItem[] = data.trainings.map((item) => ({
    id: item.id,
    title: item.title,
    date: item.date,
    dateLabel: formatDateId(item.date),
    year: yearOf(item.date) as DataYear,
    type: item.type,
    typeLabel: typeLabels[item.type],
    category: item.category,
    categoryLabel: item.category,
    color: categoryVisual(item.category).dot,
    tint: categoryVisual(item.category).bg,
    person: item.person,
    personLabel: "Narasumber",
    vendor: item.vendor,
  }));

  const certificationItems: TimelineItem[] = data.certifications.map((item) => {
    const category: CategoryId = item.category ?? UNCATEGORIZED_LABEL;
    return {
      id: item.id,
      title: item.name,
      date: item.issueDate,
      dateLabel: formatDateId(item.issueDate),
      year: yearOf(item.issueDate) as DataYear,
      type: "sertifikasi",
      typeLabel: typeLabels.sertifikasi,
      category,
      categoryLabel: category,
      color: categoryVisual(category).dot,
      tint: categoryVisual(category).bg,
      person: item.person,
      personLabel: "Pemegang",
      vendor: item.vendor,
    };
  });

  const all = [...trainingItems, ...certificationItems].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const inMonth = all.filter((item) => matchesMonth(item.date, month));
  // KPI strip stays on the selected year alone - widening it would double every total.
  const selected = selectedYears(yearFilter);
  const visible = inMonth.filter((item) => selected.includes(item.year));
  // Only the swimlane widens to the previous year. Oldest lane sits on the left,
  // so the selected year keeps the right-hand column it always had.
  const laneYears: readonly DataYear[] = [...comparisonYears(yearFilter)].reverse();

  return {
    years: laneYears.map((year) => ({
      year,
      items: inMonth.filter((item) => item.year === year),
    })),
    months: MONTHS_SHORT,
    total: visible.length,
    internal: visible.filter((item) => item.type === "internal").length,
    external: visible.filter((item) => item.type === "external").length,
    certifications: visible.filter((item) => item.type === "sertifikasi").length,
    categories: categoryLabels(data).map((label) => ({ id: label, label })),
  };
}
