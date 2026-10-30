import { categoryVisual, MONTHS_SHORT, REALIZATION_COLORS, YEAR_COLORS } from "./dashboard-config";
import { formatDateId, formatMonthYear } from "./dates";
import { visibleSeriesMonthIndexes } from "./filter-utils";
import {
  activeCertCount,
  aggregateByCategory,
  aggregateByMonth,
  categoryLabels,
  deriveStatus,
  linkedCertCount,
  nearestExpiringCert,
  splitPeople,
  uniqueEvents,
  uniquePeople,
} from "./dashboard-selectors";
import { shortCertName } from "./formatters";
import type { CadenceSeries } from "../components/charts/monthly-cadence-chart";
import type { ComparisonSeries } from "../components/charts/monthly-comparison-chart";
import type { DonutSegment } from "../components/charts/donut-chart";
import type { DataYear, YearFilter, DashboardData } from "../types/dashboard.types";
import { comparisonYears } from "./year-filter";

export interface OverviewModel {
  kpis: {
    totalProgram: { value: number; sub: string; tipLines: string[] };
    realisasi: { value: number; sub: string; tipLines: string[] };
    sertifikasiAktif: { value: number; sub: string; tipLines: string[] };
    sdmTerlibat: { value: number; sub: string; tipLines: string[] };
  };
  donut: {
    segments: DonutSegment[];
    legend: { label: string; color: string; value: number; percent: number }[];
    total: number;
    note: string;
    showNote: boolean;
  };
  categories: {
    showBoth: boolean;
    years: DataYear[];
    rows: {
      label: string;
      dot: string;
      bars: { width: number; value: number; color: string }[];
      tipTitle: string;
      tipLines: string[];
    }[];
  };
  comparison: { showBoth: boolean; series: ComparisonSeries[]; summary: ComparisonSummary };
  realization: { showBoth: boolean; series: CadenceSeries[] };
}

export interface ComparisonSummary {
  /** Rentang bulan yang dijumlahkan untuk setiap tahun, mis. "Jan–Okt". */
  period: string;
  /** Total per tahun pada rentang itu, tahun terbaru lebih dulu. */
  totals: { label: string; color: string; total: number }[];
  /** Tahun pembanding; null bila tahun terpilih tampil sendirian. */
  comparedTo: string | null;
  /** Selisih tahun terpilih terhadap pembanding. */
  delta: number | null;
  /** Persen selisih yang dibulatkan; null bila pembandingnya nol. */
  deltaPercent: number | null;
}

const ALL_MONTHS = MONTHS_SHORT.map((_, index) => index);

/**
 * Total kedua tahun pada bulan yang sama dengan tahun terpilih. Tahun berjalan
 * belum genap dua belas bulan, jadi menjumlahkan tahun lalu secara penuh akan
 * membuat perbandingannya tidak adil.
 */
export function comparisonSummary(series: readonly ComparisonSeries[]): ComparisonSummary {
  const [current, previous] = series;
  const months = current?.months ?? [];
  const totalOf = (item: ComparisonSeries) =>
    months.reduce((sum, month) => sum + (item.data[month] ?? 0), 0);
  const totals = series.map((item) => ({
    label: item.label,
    color: item.color,
    total: totalOf(item),
  }));
  const delta = previous ? totals[0].total - totals[1].total : null;
  const first = MONTHS_SHORT[months[0] ?? 0];
  const last = MONTHS_SHORT[months[months.length - 1] ?? 0];

  return {
    period: months.length > 1 ? `${first}–${last}` : first,
    totals,
    comparedTo: previous?.label ?? null,
    delta,
    deltaPercent:
      delta !== null && totals[1].total > 0 ? Math.round((delta / totals[1].total) * 100) : null,
  };
}

/**
 * View model for the Overview page - every number derives from selectors.
 *
 * Overview sengaja tidak menerima filter bulan: halaman ini merekap satu tahun
 * penuh, dan chart bulanannya sendiri sudah memecah tahun itu per bulan. Chip
 * Bulan di menu ini dinonaktifkan lewat periodFilterExemptions.
 */
export function buildOverview(data: DashboardData, year: YearFilter): OverviewModel {
  const events = uniqueEvents(data, year);
  const internal = events.filter((e) => e.etype === "internal").length;
  const external = events.filter((e) => e.etype === "external").length;
  const certOnly = events.filter((e) => e.etype === "sertifikasi").length;
  const done = events.filter((e) => deriveStatus(e.date) === "Selesai").length;

  // Status aktif adalah kondisi saat ini, bukan aktivitas pada periode terpilih.
  // Sertifikat yang terbit pada tahun sebelumnya tetap dihitung selama belum kedaluwarsa.
  const aktif = activeCertCount(data, "all");
  const nearest = nearestExpiringCert(data, "all");
  const people = uniquePeople(data, year);
  const { narasumber, peserta, overlap } = splitPeople(data, year);
  const linked = linkedCertCount(data, year);

  const donutSegments: DonutSegment[] = [
    { label: "Internal", value: internal, color: "#1D4ED8" },
    { label: "External", value: external, color: "#EA580C" },
    { label: "Sertifikasi", value: certOnly, color: "#059669" },
  ];

  // Hanya chart perbandingan di bawah ini yang melebar ke tahun sebelumnya;
  // seluruh KPI di atas tetap memakai `year` apa adanya.
  const years = comparisonYears(year);
  const categoryCounts = Object.fromEntries(
    years.map((selectedYear) => [selectedYear, aggregateByCategory(data, selectedYear)]),
  ) as Record<DataYear, Record<string, number>>;
  const showBoth = years.length > 1;
  const singleCounts = categoryCounts[years[0]];
  const allCategories = categoryLabels(data);
  const maxCategory = Math.max(
    1,
    ...allCategories.flatMap((category) =>
      years.map((selectedYear) => categoryCounts[selectedYear]?.[category] ?? 0),
    ),
  );

  const monthly = Object.fromEntries(
    years.map((selectedYear) => [selectedYear, aggregateByMonth(data, selectedYear)]),
  ) as Record<DataYear, number[]>;
  // Bulan tanpa program tidak punya persentase realisasi (null), bukan 0%:
  // tidak ada rencana berbeda dengan rencana yang gagal terlaksana.
  const realizationByMonth = (targetYear: DataYear) =>
    Array.from({ length: 12 }, (_, index) => {
      const monthlyEvents = uniqueEvents(data, targetYear).filter(
        (event) => new Date(`${event.date}T00:00:00`).getMonth() === index,
      );
      if (!monthlyEvents.length) return null;
      const completed = monthlyEvents.filter(
        (event) => deriveStatus(event.date) === "Selesai",
      ).length;
      return Math.round((completed / monthlyEvents.length) * 100);
    });
  const realization = Object.fromEntries(
    years.map((selectedYear) => [selectedYear, realizationByMonth(selectedYear)]),
  ) as Record<DataYear, (number | null)[]>;
  const comparisonSeries: ComparisonSeries[] = years.map((selectedYear, index) => ({
    label: selectedYear,
    color: index === 0 ? YEAR_COLORS.current : YEAR_COLORS.prev,
    data: monthly[selectedYear],
    months: visibleSeriesMonthIndexes(selectedYear, ALL_MONTHS),
  }));

  return {
    kpis: {
      totalProgram: {
        value: events.length,
        sub: `${internal} internal · ${external} external · ${certOnly} sertifikasi`,
        tipLines: [
          `${internal} sesi sharing internal oleh tim`,
          `${external} pelatihan external dari vendor`,
          `${certOnly} sertifikasi diperoleh terpisah dari pelatihan`,
        ],
      },
      realisasi: {
        value: events.length ? Math.round((done / events.length) * 100) : 0,
        sub: `${done} dari ${events.length} program`,
        tipLines: [
          `${done} program sudah terlaksana`,
          ...(events.length - done > 0
            ? [`${events.length - done} program belum terlaksana (jadwal mendatang)`]
            : ["Seluruh program berjalan sesuai jadwal"]),
        ],
      },
      sertifikasiAktif: {
        value: aktif,
        sub: nearest
          ? `Terdekat: ${shortCertName(nearest.name)} · ${formatMonthYear(nearest.validUntil)}`
          : "Tidak ada masa berlaku aktif yang tercatat",
        tipLines: nearest
          ? [
              `${aktif} sertifikat aktif dengan masa berlaku tercatat`,
              `Masa berlaku terdekat: ${nearest.name}`,
              nearest.vendor
                ? `Pemegang: ${nearest.person} (${nearest.vendor})`
                : `Pemegang: ${nearest.person}`,
              `Berlaku sampai ${formatDateId(nearest.validUntil)}`,
            ]
          : ["Belum ada sertifikat aktif dengan masa berlaku tercatat"],
      },
      sdmTerlibat: {
        value: people.size,
        sub: `${people.size} orang unik · ${narasumber.size} narasumber · ${peserta.size} peserta${overlap.size ? ` · ${overlap.size} peran ganda` : ""}`,
        tipLines: [
          `${people.size} orang unik (gabungan narasumber dan peserta)`,
          `${narasumber.size} tercatat sebagai narasumber`,
          `${peserta.size} tercatat sebagai peserta`,
          ...(overlap.size
            ? [
                `${overlap.size} orang muncul di kedua peran sehingga tidak dihitung dua kali`,
                `Peran ganda: ${[...overlap].join(", ")}`,
              ]
            : []),
        ],
      },
    },
    donut: {
      segments: donutSegments.filter((s) => s.value > 0),
      legend: donutSegments.map((s) => ({
        label: s.label,
        color: s.color,
        value: s.value,
        percent: events.length ? Math.round((s.value / events.length) * 100) : 0,
      })),
      total: events.length,
      note: `${linked} sertifikasi tergabung di sesi external`,
      showNote: linked > 0,
    },
    categories: {
      showBoth,
      years,
      rows: allCategories.map((category) => {
        const single = singleCounts[category] ?? 0;
        const bars = showBoth
          ? years.map((selectedYear, index) => {
              const value = categoryCounts[selectedYear]?.[category] ?? 0;
              return {
                width: Math.round((value / maxCategory) * 100),
                value,
                color: index === 0 ? YEAR_COLORS.current : YEAR_COLORS.prev,
              };
            })
          : [
              {
                width: Math.round((single / maxCategory) * 100),
                value: single,
                color: YEAR_COLORS.current,
              },
            ];
        const tipLines = showBoth
          ? [
              ...years.map(
                (selectedYear) =>
                  `${selectedYear}: ${categoryCounts[selectedYear]?.[category] ?? 0} program`,
              ),
              `Total: ${years.reduce((sum, selectedYear) => sum + (categoryCounts[selectedYear]?.[category] ?? 0), 0)} program`,
            ]
          : [`${single} program`];
        return {
          label: category,
          dot: categoryVisual(category).dot,
          bars,
          tipTitle: category,
          tipLines,
        };
      }),
    },
    comparison: {
      showBoth,
      series: comparisonSeries,
      summary: comparisonSummary(comparisonSeries),
    },
    realization: {
      showBoth,
      series: years.map((selectedYear, index) => ({
        data: realization[selectedYear],
        color: index === 0 ? REALIZATION_COLORS.current : REALIZATION_COLORS.prev,
        area: index === 0,
        dashed: index > 0,
        label: selectedYear,
        unit: "%",
      })),
    },
  };
}
