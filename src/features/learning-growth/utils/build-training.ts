import { categoryVisual, MONTHS_LONG, VENDOR_DOT } from "./dashboard-config";
import { formatDateId, formatMonthYear, matchesMonth, monthIndexOf, todayIso } from "./dates";
import {
  certRenewalWatch,
  deriveStatus,
  filterTrainings,
  normalizePersonLabel,
  personIdentityKey,
  vendorSplit,
} from "./dashboard-selectors";

import type {
  CategoryId,
  DataYear,
  MonthFilter,
  TrainingTypeFilter,
  YearFilter,
  DashboardData,
} from "../types/dashboard.types";
import { comparisonYears } from "./year-filter";

export interface SegmentOption<K extends string> {
  key: K;
  label: string;
}

export interface AgendaItem {
  id: string;
  dateChip: string;
  title: string;
  personLine: string;
  catLabel: string;
  catDot: string;
  catFg: string;
  catBg: string;
  isExternal: boolean;
  vendor: string;
  vendorDot: string;
  statusLabel: "Selesai" | "Terjadwal";
  statusFg: string;
  statusBg: string;
}

export interface MonthGroup {
  key: string;
  label: string;
  countLabel: string;
  empty: boolean;
  internalCount: number;
  externalCount: number;
  categoryBars: { label: string; color: string; count: number; width: number }[];
  items: AgendaItem[];
}

export interface TrainingModel {
  segmentOptions: SegmentOption<TrainingTypeFilter>[];

  vendor: {
    show: boolean;
    rows: {
      name: string;
      color: string;
      count: number;
      width: number;
      percent: number;
      sessions: string[];
    }[];
  };
  internal: {
    show: boolean;
    count: number;
    narasumber: number;
    topCategory: string;
    people: { name: string; count: number; width: number; sessions: string[] }[];
    more: number;
  };
  mix: {
    show: boolean;
    total: number;
    narasumber: number;
    rows: { name: string; color: string; count: number; percent: number; note: string }[];
  };
  participation: {
    show: boolean;
    total: number;
    people: { name: string; count: number; width: number; sessions: string[] }[];
  };
  /** Sertifikat yang perlu dijadwalkan training atau ujian perpanjangannya. */
  renewal: {
    show: boolean;
    /** Tanggal acuan; daftar ini status hari ini, tidak ikut filter periode. */
    asOf: string;
    items: {
      id: string;
      name: string;
      holder: string;
      statusLabel: string;
      statusFg: string;
      statusBg: string;
      detail: string;
    }[];
    next: { name: string; holder: string; startText: string } | null;
    unrecorded: number;
  };
  monthGroups: MonthGroup[];
}

/** Cap for per-person lists so cards stay scannable at any data size. */
const PEOPLE_TOP = 10;

/**
 * Lanes of the butterfly chart, oldest first so the selected year stays on the
 * right. Only the chart widens: every segment count above still uses `year`.
 */
function yearsShown(year: YearFilter): readonly DataYear[] {
  return [...comparisonYears(year)].reverse();
}

/** View model for the Training page under the year + type filters. */
export function buildTraining(
  data: DashboardData,
  year: YearFilter,
  type: TrainingTypeFilter,
  month: MonthFilter = "ALL",
): TrainingModel {
  const totalAll = filterTrainings(data, year, "all", month).length;
  const totalInternal = filterTrainings(data, year, "internal", month).length;
  const totalExternal = filterTrainings(data, year, "external", month).length;

  const split = vendorSplit(data, year, month);
  // Only vendors that actually appear in the data - never render zero rows.
  const activeVendors = (
    [
      { name: "MySkill", color: "#EA580C", count: split.MySkill },
      { name: "ID Networkers", color: "#FB923C", count: split["ID Networkers"] },
    ] as const
  ).filter((v) => v.count > 0);
  const vendorMax = Math.max(1, ...activeVendors.map((v) => v.count));
  const vendorTotal = Math.max(
    1,
    activeVendors.reduce((sum, v) => sum + v.count, 0),
  );
  // External sessions whose recorded narasumber is not a known vendor.
  const otherExternal = totalExternal - activeVendors.reduce((sum, v) => sum + v.count, 0);
  const otherNarasumber = new Set(
    filterTrainings(data, year, "external", month)
      .filter((t) => !t.vendor)
      .map((t) => personIdentityKey(t.person)),
  );
  const vendorRows = activeVendors.map((v) => ({
    ...v,
    width: Math.round((v.count / vendorMax) * 100),
    percent: Math.round((v.count / vendorTotal) * 100),
    sessions: filterTrainings(data, year, "external", month)
      .filter((t) => t.vendor === v.name)
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((t) => `${formatDateId(t.date)} · ${t.title}`),
  }));

  // Consolidate capitalization variants while keeping the latest session's display label.
  const participantSessions = new Map<string, { name: string; sessions: string[] }>();
  filterTrainings(data, year, type, month)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((t) => {
      const participantsInSession = new Map<string, string>();
      t.participants?.forEach((participant) => {
        const name = normalizePersonLabel(participant);
        if (name) participantsInSession.set(personIdentityKey(name), name);
      });
      participantsInSession.forEach((name, key) => {
        participantSessions.set(key, {
          name,
          sessions: [
            ...(participantSessions.get(key)?.sessions ?? []),
            `${formatDateId(t.date)} · ${t.title}`,
          ],
        });
      });
    });
  const participantRows = [...participantSessions.values()].sort(
    (a, b) => b.sessions.length - a.sessions.length || a.name.localeCompare(b.name, "id-ID"),
  );
  const participantMax = Math.max(1, ...participantRows.map(({ sessions }) => sessions.length));

  const internalList = filterTrainings(data, year, "internal", month);
  const narasumberSet = new Set(internalList.map((t) => personIdentityKey(t.person)));
  const categoryCount = new Map<CategoryId, number>();
  internalList.forEach((t) =>
    categoryCount.set(t.category, (categoryCount.get(t.category) ?? 0) + 1),
  );
  const topCategory = [...categoryCount.keys()].sort(
    (a, b) => (categoryCount.get(b) ?? 0) - (categoryCount.get(a) ?? 0),
  )[0];

  const monthGroups: MonthGroup[] = [];
  yearsShown(year).forEach((yy) => {
    for (let m = 0; m < 12; m += 1) {
      const items = filterTrainings(data, yy, type, "ALL")
        .filter((t) => monthIndexOf(t.date) === m && matchesMonth(t.date, month))
        .sort((a, b) => (a.date < b.date ? -1 : 1))
        .map((t): AgendaItem => {
          const visual = categoryVisual(t.category);
          const status = deriveStatus(t.date);
          return {
            id: t.id,
            dateChip: formatDateId(t.date),
            title: t.title,
            personLine: `Narasumber: ${t.person}`,
            catLabel: t.category,
            catDot: visual.dot,
            catFg: visual.fg,
            catBg: visual.bg,
            isExternal: t.type === "external",
            vendor: t.vendor ?? "",
            vendorDot: t.vendor ? VENDOR_DOT[t.vendor] : "",
            statusLabel: status,
            statusFg: status === "Selesai" ? "#059669" : "#2563EB",
            statusBg: status === "Selesai" ? "#ECFDF5" : "#EFF4FE",
          };
        });
      const categoryCounts = new Map<CategoryId, number>();
      items.forEach((item) => {
        categoryCounts.set(item.catLabel, (categoryCounts.get(item.catLabel) ?? 0) + 1);
      });
      const maxCategoryCount = Math.max(1, ...categoryCounts.values());
      monthGroups.push({
        key: `${yy}-${m}`,
        label: `${MONTHS_LONG[m]} ${yy}`,
        countLabel: `${items.length} agenda`,
        empty: items.length === 0,
        internalCount: items.filter((item) => !item.isExternal).length,
        externalCount: items.filter((item) => item.isExternal).length,
        categoryBars: [...categoryCounts.entries()].map(([category, count]) => ({
          label: category,
          color: categoryVisual(category).dot,
          count,
          width: Math.round((count / maxCategoryCount) * 100),
        })),
        items,
      });
    }
  });

  // Status hari ini dari seluruh inventaris sertifikat, sama dengan halaman
  // Certifications; filter tahun dan bulan tidak berlaku untuk daftar ini.
  const watch = certRenewalWatch(data);
  const holderOf = (cert: { person: string; vendor: string | null }) =>
    [cert.person, cert.vendor].filter(Boolean).join(" · ");

  return {
    segmentOptions: [
      { key: "all", label: `Semua (${totalAll})` },
      { key: "internal", label: `Internal (${totalInternal})` },
      { key: "external", label: `External (${totalExternal})` },
    ],

    vendor: { show: type === "external" && vendorRows.length > 0, rows: vendorRows },
    // Perpanjangan sertifikasi ditempuh lewat training atau ujian external,
    // jadi daftarnya tidak relevan di segmen Internal.
    renewal: {
      show: type !== "internal",
      asOf: formatDateId(todayIso()),
      items: watch.due.map(({ cert, status }) => ({
        id: cert.id,
        name: cert.name,
        holder: holderOf(cert),
        statusLabel: status.label,
        statusFg: status.fg,
        statusBg: status.bg,
        detail:
          status.key === "expired"
            ? `Berakhir ${formatDateId(cert.validUntil)}`
            : `Berakhir ${formatDateId(cert.validUntil)} · sisa ${status.months} bulan`,
      })),
      next: watch.next
        ? {
            name: watch.next.cert.name,
            holder: holderOf(watch.next.cert),
            startText: formatMonthYear(watch.next.renewalStart),
          }
        : null,
      unrecorded: watch.unrecorded,
    },
    mix: {
      show: type === "all",
      total: totalAll,
      narasumber: narasumberSet.size,
      rows: [
        {
          name: "Internal (tim sendiri)",
          color: "#1D4ED8",
          count: internalList.length,
          percent: totalAll ? Math.round((internalList.length / totalAll) * 100) : 0,
          note: `${narasumberSet.size} narasumber`,
        },
        ...activeVendors.map((v) => ({
          name: v.name,
          color: v.color,
          count: v.count,
          percent: totalAll ? Math.round((v.count / totalAll) * 100) : 0,
          note: "vendor external",
        })),
        {
          name: "External lainnya",
          color: "#059669",
          count: otherExternal,
          percent: totalAll ? Math.round((otherExternal / totalAll) * 100) : 0,
          note: `${otherNarasumber.size} narasumber`,
        },
      ].filter((row) => row.count > 0),
    },
    // Every participant is included - the card scrolls instead of truncating.
    participation: {
      show: participantRows.length > 0,
      total: participantRows.length,
      people: participantRows.map(({ name, sessions }) => ({
        name,
        count: sessions.length,
        width: Math.round((sessions.length / participantMax) * 100),
        sessions,
      })),
    },
    internal: (() => {
      const byPerson = new Map<string, { name: string; sessions: typeof internalList }>();
      [...internalList]
        .sort((a, b) => a.date.localeCompare(b.date))
        .forEach((training) => {
          const name = normalizePersonLabel(training.person);
          const key = personIdentityKey(name);
          byPerson.set(key, {
            name,
            sessions: [...(byPerson.get(key)?.sessions ?? []), training],
          });
        });
      const maxCount = Math.max(
        1,
        ...[...byPerson.values()].map(({ sessions }) => sessions.length),
      );
      const rows = [...byPerson.values()].sort(
        (a, b) => b.sessions.length - a.sessions.length || a.name.localeCompare(b.name, "id-ID"),
      );
      return {
        show: type === "internal",
        count: internalList.length,
        narasumber: narasumberSet.size,
        topCategory: topCategory ?? "—",
        people: rows.slice(0, PEOPLE_TOP).map(({ name, sessions }) => ({
          name,
          count: sessions.length,
          width: Math.round((sessions.length / maxCount) * 100),
          sessions: sessions
            .sort((a, b) => (a.date < b.date ? -1 : 1))
            .map((t) => `${formatDateId(t.date)} · ${t.title}`),
        })),
        more: Math.max(0, rows.length - PEOPLE_TOP),
      };
    })(),
    monthGroups,
  };
}
