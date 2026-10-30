import { CERT_RENEWAL_WINDOW_MONTHS, UNCATEGORIZED_LABEL } from "./dashboard-config";
import {
  addDaysIso,
  addMonthsIso,
  matchesMonth,
  monthIndexOf,
  monthsBetween,
  todayIso,
  yearOf,
} from "./dates";
import { selectedYears } from "./year-filter";
import type {
  CategoryId,
  CertStatus,
  Certification,
  MonthFilter,
  TrainingSession,
  TrainingTypeFilter,
  UniqueEvent,
  VendorName,
  YearFilter,
  DataYear,
  DashboardData,
} from "../types/dashboard.types";

/** Runtime status derivation against the current date - never hardcoded on records. */
export function deriveStatus(isoDate: string): "Selesai" | "Terjadwal" {
  return isoDate <= todayIso() ? "Selesai" : "Terjadwal";
}

/** Normalize spacing while preserving the source's display capitalization. */
export function normalizePersonLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/** Case-insensitive identity key used to consolidate capitalization variants. */
export function personIdentityKey(value: string): string {
  return normalizePersonLabel(value).toLocaleLowerCase("id-ID");
}

function setPersonLabel(labels: Map<string, string>, value: string) {
  const label = normalizePersonLabel(value);
  if (label) labels.set(personIdentityKey(label), label);
}

/**
 * Deduplicated program events: every training row plus certifications without
 * a linkedSessionId (linked certifications already exist as their external
 * session). Sorted ascending by date - the single dedup point of the app.
 */
export function uniqueEvents(
  data: DashboardData,
  year: YearFilter = "all",
  month: MonthFilter = "ALL",
): UniqueEvent[] {
  const events: UniqueEvent[] = data.trainings
    .map((t): UniqueEvent => ({
      id: t.id,
      title: t.title,
      date: t.date,
      etype: t.type,
      category: t.category,
      person: t.person,
      vendor: t.vendor,
    }))
    .concat(
      data.certifications
        .filter((c) => !c.linkedSessionId)
        .map((c): UniqueEvent => ({
          id: c.id,
          title: c.name,
          date: c.issueDate,
          etype: "sertifikasi" as const,
          category: c.category ?? UNCATEGORIZED_LABEL,
          person: c.person,
          vendor: c.vendor,
        })),
    );
  const years = selectedYears(year);
  const filtered = events.filter(
    (e) => (years as string[]).includes(yearOf(e.date)) && matchesMonth(e.date, month),
  );
  return filtered.sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Unique events per month (Jan..Des) for one calendar year and month filter. */
export function aggregateByMonth(
  data: DashboardData,
  year: DataYear,
  month: MonthFilter = "ALL",
): number[] {
  const counts = Array<number>(12).fill(0);
  uniqueEvents(data, year, month).forEach((e) => {
    counts[monthIndexOf(e.date)] += 1;
  });
  return counts;
}

/** Unique events per competency category under the given year filter. */
export function aggregateByCategory(
  data: DashboardData,
  year: YearFilter,
  month: MonthFilter = "ALL",
): Record<CategoryId, number> {
  const map: Record<CategoryId, number> = {};
  uniqueEvents(data, year, month).forEach((e) => {
    map[e.category] = (map[e.category] ?? 0) + 1;
  });
  return map;
}

/**
 * Every category label present in the dataset, sorted alphabetically with
 * "Belum Dikategorikan" always last. The single source of category order.
 */
export function categoryLabels(data: DashboardData): CategoryId[] {
  const set = new Set<CategoryId>();
  data.trainings.forEach((t) => set.add(t.category));
  data.certifications.forEach((c) => set.add(c.category ?? UNCATEGORIZED_LABEL));
  return [...set].sort((a, b) => {
    if (a === UNCATEGORIZED_LABEL) return 1;
    if (b === UNCATEGORIZED_LABEL) return -1;
    return a.localeCompare(b, "id-ID");
  });
}

/** Training rows (not deduplicated events) under year + type filters. */
export function filterTrainings(
  data: DashboardData,
  year: YearFilter,
  type: TrainingTypeFilter,
  month: MonthFilter = "ALL",
): TrainingSession[] {
  const years = selectedYears(year);
  return data.trainings.filter(
    (t) =>
      (years as string[]).includes(yearOf(t.date)) &&
      (type === "all" || t.type === type) &&
      matchesMonth(t.date, month),
  );
}

/** External sessions per vendor under the year filter. */
export function vendorSplit(
  data: DashboardData,
  year: YearFilter,
  month: MonthFilter = "ALL",
): Record<VendorName, number> {
  const map: Record<VendorName, number> = { MySkill: 0, "ID Networkers": 0 };
  filterTrainings(data, year, "external", month).forEach((t) => {
    if (t.vendor) map[t.vendor] += 1;
  });
  return map;
}

/** Distinct people with capitalization variants consolidated into one identity. */
export function uniquePeople(
  data: DashboardData,
  year: YearFilter,
  month: MonthFilter = "ALL",
): Set<string> {
  const labels = new Map<string, string>();
  filterTrainings(data, year, "all", month).forEach((training) => {
    setPersonLabel(labels, training.person);
    training.participants?.forEach((participant) => setPersonLabel(labels, participant));
  });
  filterCerts(data, year, month).forEach((certification) =>
    setPersonLabel(labels, certification.person),
  );
  return new Set(labels.values());
}

/** Distinct role sets and overlap with case-insensitive person identity matching. */
export function splitPeople(
  data: DashboardData,
  year: YearFilter,
  month: MonthFilter = "ALL",
): { narasumber: Set<string>; peserta: Set<string>; overlap: Set<string> } {
  const narasumberLabels = new Map<string, string>();
  const pesertaLabels = new Map<string, string>();
  filterTrainings(data, year, "all", month).forEach((training) => {
    setPersonLabel(narasumberLabels, training.person);
    training.participants?.forEach((participant) => setPersonLabel(pesertaLabels, participant));
  });
  const overlap = new Set(
    [...narasumberLabels.keys()]
      .filter((key) => pesertaLabels.has(key))
      .map((key) => pesertaLabels.get(key) ?? narasumberLabels.get(key) ?? key),
  );
  return {
    narasumber: new Set(narasumberLabels.values()),
    peserta: new Set(pesertaLabels.values()),
    overlap,
  };
}

/** Certifications filtered by issue year. */
export function filterCerts(
  data: DashboardData,
  year: YearFilter,
  month: MonthFilter = "ALL",
): Certification[] {
  const years = selectedYears(year);
  return data.certifications.filter(
    (c) => (years as string[]).includes(yearOf(c.issueDate)) && matchesMonth(c.issueDate, month),
  );
}

/** Certifications whose record duplicates an external session, per filter. */
export function linkedCertCount(
  data: DashboardData,
  year: YearFilter,
  month: MonthFilter = "ALL",
): number {
  const years = selectedYears(year);
  return data.certifications.filter(
    (c) =>
      c.linkedSessionId &&
      (years as string[]).includes(yearOf(c.issueDate)) &&
      matchesMonth(c.issueDate, month),
  ).length;
}

/**
 * Hari pertama sisa masa berlaku kurang dari CERT_RENEWAL_WINDOW_MONTHS bulan,
 * yaitu awal status Segera Berakhir. Masa berlaku sampai 29 Sep 2028 tepat
 * tersisa enam bulan pada 29 Mar 2028, jadi Segera Berakhir mulai 30 Mar 2028.
 */
export function renewalStartOf(validUntil: string): string {
  return addDaysIso(addMonthsIso(validUntil, -CERT_RENEWAL_WINDOW_MONTHS), 1);
}

/**
 * Validity status of a certification at the current date. "none" when no
 * validity is recorded (never fabricate an expiry); "soon" inside the renewal
 * window, i.e. below CERT_RENEWAL_WINDOW_MONTHS months left.
 */
export function certStatus(cert: Certification): CertStatus {
  if (!cert.validUntil) return { key: "none" };
  const today = todayIso();
  if (cert.validUntil < today) {
    return { key: "expired", label: "Kedaluwarsa", bg: "#FEF2F2", fg: "#DC2626", months: 0 };
  }
  const months = monthsBetween(today, cert.validUntil);
  return today >= renewalStartOf(cert.validUntil)
    ? { key: "soon", label: "Segera Berakhir", bg: "#FFFBEB", fg: "#B45309", months }
    : { key: "active", label: "Aktif", bg: "#ECFDF5", fg: "#059669", months };
}

type RecordedCertification = Certification & { validUntil: string };
type DatedCertStatus = Exclude<CertStatus, { key: "none" }>;

export interface CertRenewalWatch {
  /** Berstatus Segera Berakhir atau Kedaluwarsa; yang paling lama lewat di atas. */
  due: { cert: RecordedCertification; status: DatedCertStatus }[];
  /** Sertifikat berikutnya yang akan berstatus Segera Berakhir. */
  next: { cert: RecordedCertification; renewalStart: string } | null;
  /** Sertifikat tanpa tanggal berakhir, sehingga tidak bisa dipantau. */
  unrecorded: number;
}

/** Daftar perpanjangan dari inventaris yang sama dengan halaman Certifications. */
export function certRenewalWatch(data: DashboardData): CertRenewalWatch {
  const certs = filterCerts(data, "all");
  const recorded = certs
    .filter((cert): cert is RecordedCertification => Boolean(cert.validUntil))
    .sort((a, b) => (a.validUntil < b.validUntil ? -1 : 1));
  const withStatus = recorded.map((cert) => ({
    cert,
    status: certStatus(cert) as DatedCertStatus,
  }));
  const upcoming = withStatus.find(({ status }) => status.key === "active");

  return {
    due: withStatus.filter(({ status }) => status.key === "soon" || status.key === "expired"),
    next: upcoming
      ? { cert: upcoming.cert, renewalStart: renewalStartOf(upcoming.cert.validUntil) }
      : null,
    unrecorded: certs.length - recorded.length,
  };
}

/** Elapsed share of a recorded validity window at the current date, 0-100. */
export function certValidityPercent(cert: Certification): number {
  if (!cert.validUntil) return 0;
  const start = Date.parse(cert.issueDate);
  const end = Date.parse(cert.validUntil);
  const now = Date.parse(todayIso());
  return Math.round(Math.min(1, Math.max(0, (now - start) / (end - start))) * 100);
}

/** Count with a recorded validity date that has not expired today. */
export function activeCertCount(
  data: DashboardData,
  year: YearFilter,
  month: MonthFilter = "ALL",
): number {
  return filterCerts(data, year, month).filter((certification) => {
    const status = certStatus(certification);
    return status.key === "active" || status.key === "soon";
  }).length;
}

/** The not-yet-expired certification with the nearest recorded expiry. */
export function nearestExpiringCert(
  data: DashboardData,
  year: YearFilter,
  month: MonthFilter = "ALL",
): (Certification & { validUntil: string }) | undefined {
  const today = todayIso();
  return filterCerts(data, year, month)
    .filter((c): c is Certification & { validUntil: string } =>
      Boolean(c.validUntil && c.validUntil >= today),
    )
    .sort((a, b) => (a.validUntil < b.validUntil ? -1 : 1))[0];
}

/**
 * Train-the-trainer pairs fixed by PRD Appendix B: Python, Basic Accounting,
 * Accounting for Business, AIS, UX Writing, Thinking Skill, N8N.
 */
export const TRAIN_THE_TRAINER_PAIRS: readonly { external: string; internal: string }[] = [
  { external: "T19", internal: "T03" },
  { external: "T20", internal: "T05" },
  { external: "T21", internal: "T07" },
  { external: "T22", internal: "T08" },
  { external: "T23", internal: "T09" },
  { external: "T25", internal: "T15" },
  { external: "T27", internal: "T18" },
];

/** True when every curated pair holds in the dataset: external precedes internal, same category and person. */
export function validateTrainTheTrainerPairs(data: DashboardData): boolean {
  const byId = new Map(data.trainings.map((t) => [t.id, t]));
  return TRAIN_THE_TRAINER_PAIRS.every(({ external, internal }) => {
    const ext = byId.get(external);
    const int = byId.get(internal);
    return (
      !!ext &&
      !!int &&
      ext.type === "external" &&
      int.type === "internal" &&
      ext.category === int.category &&
      ext.person === int.person &&
      ext.date < int.date
    );
  });
}
