import { VENDOR_DOT } from "./dashboard-config";
import { formatDateId, formatMonthYear } from "./dates";
import {
  certStatus,
  certValidityPercent,
  filterCerts,
  linkedCertCount,
  nearestExpiringCert,
  renewalStartOf,
} from "./dashboard-selectors";
import { initialsOf, shortCertName } from "./formatters";
import type { DashboardData } from "../types/dashboard.types";

export interface CertCardModel {
  id: string;
  name: string;
  person: string;
  initials: string;
  vendor: string;
  vendorDot: string;
  issueDate: string;
  validUntil: string | null;
  issued: string;
  hasBar: boolean;
  percent: number;
  expires: string;
  remainingText: string;
  statusLabel: string;
  statusMonths: number | null;
  statusFg: string;
  statusBg: string;
  /**
   * Hari pertama status Segera Berakhir (enam bulan terakhir); null bila tanpa
   * tanggal berakhir atau sudah kedaluwarsa.
   */
  renewalStart: string | null;
  /** Keterangan kapan status Segera Berakhir dimulai, untuk tooltip baris. */
  renewalNote: string | null;
}

export interface CertificationsModel {
  stats: {
    total: { value: number; note: string };
    active: { value: number; note: string };
    nearest: { text: string; sub: string; note: string };
  };
  cards: CertCardModel[];
}

/** View model for the complete certificate inventory - statuses derived at runtime. */
export function buildCertifications(data: DashboardData): CertificationsModel {
  const certs = filterCerts(data, "all");
  const linked = linkedCertCount(data, "all");
  const recorded = certs.filter((c) => c.validUntil).length;
  const unrecorded = certs.length - recorded;
  const activeRecorded = certs.filter((c) => {
    const status = certStatus(c);
    return status.key === "active" || status.key === "soon";
  }).length;
  const nearest = nearestExpiringCert(data, "all");
  const nearestStatus = nearest ? certStatus(nearest) : null;
  // Cukup disebut bulannya; tanggal pastinya ada di tooltip chart.
  const renewalNote = (validUntil: string, key: string) =>
    `segera berakhir ${key === "soon" ? "sejak" : "mulai"} ${formatMonthYear(renewalStartOf(validUntil))}`;

  return {
    stats: {
      total: {
        value: certs.length,
        note: linked
          ? `${linked} diperoleh melalui pelatihan external · seluruh tahun terbit`
          : "Seluruh sertifikasi lintas tahun terbit",
      },
      active: {
        value: activeRecorded,
        note: unrecorded
          ? `${unrecorded} lainnya berstatus belum diketahui (tanpa tanggal expiry)`
          : "Semua masa berlaku tercatat",
      },
      nearest: {
        text: nearest ? shortCertName(nearest.name) : "—",
        sub: nearest
          ? [nearest.name, nearest.person, nearest.vendor].filter(Boolean).join(" · ")
          : "",
        // Tanpa sertifikat yang masih berlaku, bedakan "semua sudah lewat"
        // dari "tanggalnya memang belum dicatat".
        note:
          nearest && nearestStatus && nearestStatus.key !== "none"
            ? `${formatDateId(nearest.validUntil)} · sisa ${nearestStatus.months} bulan · ${renewalNote(nearest.validUntil, nearestStatus.key)}`
            : recorded > 0
              ? "Semua sertifikat bertanggal sudah kedaluwarsa"
              : "Masa berlaku belum tercatat",
      },
    },
    cards: certs.map((cert) => {
      const status = certStatus(cert);
      const hasBar = status.key !== "none";
      const percent = certValidityPercent(cert);
      const remainingText = !hasBar
        ? ""
        : status.key === "expired"
          ? `Berakhir ${formatDateId(cert.validUntil!)}`
          : `Berlaku s.d. ${formatDateId(cert.validUntil!)} · sisa ${status.months} bulan`;
      const inRenewalScope = hasBar && status.key !== "expired";
      return {
        id: cert.id,
        name: cert.name,
        person: cert.person,
        initials: initialsOf(cert.person),
        vendor: cert.vendor ?? "",
        vendorDot: cert.vendor ? VENDOR_DOT[cert.vendor] : "",
        issueDate: cert.issueDate,
        validUntil: cert.validUntil ?? null,
        issued: formatDateId(cert.issueDate),
        hasBar,
        percent,
        expires: hasBar ? formatDateId(cert.validUntil!) : "",
        remainingText,
        statusLabel: hasBar ? status.label : "",
        statusMonths: hasBar && status.key !== "expired" ? status.months : null,
        statusFg: hasBar ? status.fg : "#6B7280",
        statusBg: hasBar ? status.bg : "#F3F4F6",
        renewalStart: inRenewalScope ? renewalStartOf(cert.validUntil!) : null,
        renewalNote: inRenewalScope
          ? `Segera berakhir ${status.key === "soon" ? "sejak" : "mulai"}: ${formatDateId(renewalStartOf(cert.validUntil!))}`
          : null,
      };
    }),
  };
}
