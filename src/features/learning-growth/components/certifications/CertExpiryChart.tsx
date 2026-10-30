"use client";

import type { CertCardModel } from "../../utils/build-certifications";
import { formatDateId, todayIso } from "../../utils/dates";
import { useTooltip } from "../../context/tooltip-provider";

const MONTH_MS = 30 * 24 * 3600 * 1000;

/**
 * Warna fase pada batang, sama dengan warna status di certStatus: hijau selama
 * Aktif, lalu coklat untuk enam bulan terakhir saat statusnya Segera Berakhir.
 */
const ACTIVE_COLOR = "#059669";
const SOON_COLOR = "#B45309";

/** Ujung masa berlaku terakhir tidak melewati titik ini, supaya labelnya muat di kanan. */
const LAST_EXPIRY_PCT = 80;

const LEGEND = [
  { label: "Aktif", color: ACTIVE_COLOR },
  { label: "Segera berakhir (< 6 bln)", color: SOON_COLOR },
  { label: "Kedaluwarsa", color: "#DC2626" },
  { label: "Masa berlaku belum tercatat", color: "#9CA3AF" },
];

/** Gantt-style validity chart: one row per cert, red line = current date. */
export function CertExpiryChart({ certs }: { certs: CertCardModel[] }) {
  const { bind } = useTooltip();
  const today = todayIso();

  // Dynamic range from data: pad 3 months front, and at least 6 months back so
  // the latest expiry label always fits to the right of its bar.
  const dates = [
    Date.parse(today),
    ...certs.map((cert) => Date.parse(cert.issueDate)),
    ...certs.filter((cert) => cert.validUntil).map((cert) => Date.parse(cert.validUntil!)),
  ];
  const rangeStart = Math.min(...dates) - 3 * MONTH_MS;
  const latest = Math.max(...dates);
  const rangeEnd = Math.max(
    latest + 6 * MONTH_MS,
    rangeStart + ((latest - rangeStart) * 92) / (LAST_EXPIRY_PCT - 4),
  );
  const pct = (date: string) =>
    Math.min(96, Math.max(4, 4 + ((Date.parse(date) - rangeStart) / (rangeEnd - rangeStart)) * 92));
  const years: string[] = [];
  for (
    let year = new Date(rangeStart).getFullYear();
    year <= new Date(rangeEnd).getFullYear();
    year += 1
  ) {
    const mid = Date.parse(`${year}-07-01`);
    if (mid >= rangeStart && mid <= rangeEnd) years.push(String(year));
  }
  const todayPct = pct(today);

  return (
    <div className="w-full overflow-x-auto pb-1 no-scrollbar">
      <div className="flex min-w-[760px] flex-col gap-2">
        {/* Year axis + today marker */}
        <div className="flex items-center gap-3">
          <div className="w-[240px] flex-none" />
          <div className="relative h-[40px] min-w-0 flex-1">
            {years.map((year) => (
              <span
                key={year}
                className="absolute bottom-0 -translate-x-1/2 text-[10.5px] font-bold text-zinc-400 dark:text-zinc-500"
                style={{ left: `${pct(`${year}-07-01`)}%` }}
              >
                {year}
              </span>
            ))}
            <span
              className="absolute top-0 -translate-x-1/2 rounded-full bg-red-600 px-2 py-[1px] text-[10px] font-bold whitespace-nowrap text-white"
              style={{ left: `${todayPct}%` }}
            >
              Hari ini · {formatDateId(today)}
            </span>
          </div>
          <div className="w-[132px] flex-none" />
        </div>

        {certs.map((cert) => {
          const start = pct(cert.issueDate);
          const end = cert.validUntil ? pct(cert.validUntil) : Math.min(todayPct + 10, 96);
          const expired = cert.validUntil !== null && cert.validUntil < today;
          // Batang dibagi per fase: hijau selama Aktif, coklat untuk enam bulan
          // terakhir (Segera berakhir). Garis merah "Hari ini" menunjukkan fase
          // yang sedang berjalan. Sertifikat kedaluwarsa tetap merah penuh.
          const windowStart = cert.renewalStart ? Math.max(start, pct(cert.renewalStart)) : end;
          const hasWindow = cert.validUntil !== null && windowStart < end;
          const hasMain = windowStart > start;
          const endColor = expired ? cert.statusFg : SOON_COLOR;
          const details = [
            `Pemegang: ${cert.person}`,
            ...(cert.vendor ? [`Vendor: ${cert.vendor}`] : []),
            `Terbit: ${cert.issued}`,
            cert.validUntil ? `Berakhir: ${cert.expires}` : "Masa berlaku belum tercatat",
            ...(cert.renewalNote ? [cert.renewalNote] : []),
            ...(cert.remainingText ? [cert.remainingText] : []),
          ];
          return (
            <div
              key={cert.id}
              className="flex items-center gap-3 rounded-[10px] px-1 py-[3px] transition-colors hover:bg-blue-50/40 dark:hover:bg-zinc-800/50"
              {...bind(cert.name, details)}
            >
              <div className="flex w-[240px] flex-none items-center gap-2">
                <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  {cert.initials}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-bold text-zinc-800 dark:text-zinc-200">{cert.name}</div>
                  <div className="truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                    {[cert.person, cert.vendor].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>

              <div className="relative h-[38px] min-w-0 flex-1 rounded-[8px] bg-zinc-50 dark:bg-zinc-800/40">
                <div
                  className="pointer-events-none absolute inset-y-0 z-10 border-l-2 border-red-500/50"
                  style={{ left: `${todayPct}%` }}
                />
                {cert.validUntil ? (
                  <>
                    {hasMain && (
                      <div
                        className={`absolute top-1/2 h-[16px] -translate-y-1/2 ${
                          hasWindow ? "rounded-l-full rounded-r-[3px]" : "rounded-full"
                        }`}
                        style={{
                          left: `${start}%`,
                          width: hasWindow
                            ? `calc(${windowStart - start}% - 2px)`
                            : `${Math.max(1.5, end - start)}%`,
                          background: expired ? cert.statusFg : ACTIVE_COLOR,
                        }}
                      />
                    )}
                    {hasWindow && (
                      <div
                        className={`absolute top-1/2 h-[16px] -translate-y-1/2 ${
                          hasMain ? "rounded-l-[3px] rounded-r-full" : "rounded-full"
                        }`}
                        style={{
                          left: `${windowStart}%`,
                          width: `${end - windowStart}%`,
                          background: SOON_COLOR,
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div
                    className="absolute top-1/2 h-[16px] -translate-y-1/2 rounded-full"
                    style={{
                      left: `${start}%`,
                      width: `${Math.max(1.5, end - start)}%`,
                      background:
                        "repeating-linear-gradient(45deg, #D1D5DB 0 6px, #E5E7EB 6px 12px)",
                    }}
                  />
                )}
                {/* Issue date label */}
                {start > 12 ? (
                  <span
                    className="absolute top-1/2 z-[11] -translate-y-1/2 rounded-[4px] bg-zinc-50 dark:bg-zinc-800 pr-2 pl-1 text-[10px] font-semibold whitespace-nowrap text-zinc-500 dark:text-zinc-400"
                    style={{ right: `${100 - start}%` }}
                  >
                    {cert.issued}
                  </span>
                ) : (
                  <span
                    className="absolute top-1/2 z-[11] -translate-y-1/2 pl-2.5 text-[10px] font-bold whitespace-nowrap text-white"
                    style={{ left: `${start}%` }}
                  >
                    {cert.issued}
                  </span>
                )}
                {/* Expiry marker + date label */}
                {cert.validUntil && (
                  <>
                    <span
                      className="absolute top-1/2 z-[5] h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm"
                      style={{ left: `${end}%`, background: endColor }}
                    />
                    <span
                      className="absolute top-1/2 z-[11] -translate-y-1/2 rounded-[4px] bg-zinc-50 dark:bg-zinc-800 pr-1 pl-2 text-[10px] font-bold whitespace-nowrap"
                      style={{ left: `${end}%`, color: endColor }}
                    >
                      {cert.expires}
                    </span>
                  </>
                )}
              </div>

              <div className="flex w-[132px] flex-none flex-col items-center gap-[2px]">
                <span
                  className="w-full truncate rounded-full px-2.5 py-1 text-center text-[10.5px] font-bold"
                  style={{ color: cert.statusFg, background: cert.statusBg }}
                >
                  {cert.statusLabel || "Tanpa masa berlaku"}
                </span>
                <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                  {cert.statusMonths !== null
                    ? `sisa ${cert.statusMonths} bulan`
                    : expired
                      ? `berakhir ${cert.expires}`
                      : "tidak tercatat"}
                </span>
              </div>
            </div>
          );
        })}

        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-zinc-200 dark:border-zinc-800 pt-2.5">
          {LEGEND.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-zinc-500 dark:text-zinc-400"
            >
              <span className="h-[8px] w-[8px] rounded-full" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
          <span className="ml-auto text-[10px] text-zinc-400 dark:text-zinc-500">
            Sumber: data sertifikasi per {formatDateId(today)}
          </span>
        </div>
      </div>
    </div>
  );
}
