export interface StackedSeries {
  key: string;
  label: string;
  color: string;
}

/** Seri status untuk "Status by item" (urutan dan warna dari desain). */
export const STATUS_SERIES: StackedSeries[] = [
  { key: "done", label: "Done", color: "var(--chart-green)" },
  { key: "progress", label: "On progress", color: "var(--chart-blue-primary)" },
  { key: "queue", label: "On queue", color: "var(--chart-amber)" },
  { key: "nu", label: "Not usable", color: "var(--chart-red)" },
];

/** Seri hasil untuk "Result by item". */
export const RESULT_SERIES: StackedSeries[] = [
  { key: "usable", label: "Usable", color: "var(--chart-green)" },
  { key: "ready", label: "Ready to sell", color: "var(--chart-blue-primary)" },
  { key: "damaged", label: "Damaged", color: "var(--chart-red)" },
  { key: "uncl", label: "Unclassified", color: "var(--chart-neutral)" },
];
