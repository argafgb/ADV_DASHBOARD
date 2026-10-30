'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Boxes,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  Inbox,
  Search,
  TrendingUp,
} from 'lucide-react';
import { STATUSES, STATUS_ORDER } from '../utils/constants';
import { useFilters } from '../context/ProcessRiskFilterContext';
import { useDashboardData } from '../data/workplans';
import { PageHeader, SectionLabel } from './PageHeader';
import { EmptyYearState } from './EmptyState';
import {
  CompositionDonut,
  MonthlyColumns,
  PairedBars,
  ProgramHeatmap,
  ProgramRankBars,
  type HeatRow,
  type RankItem,
} from './Charts';
import { DeltaChip, ReadMe, useTip } from './Primitives';
import {
  MONTHS_ID_LONG,
  allPrograms,
  checkpointCount,
  composition,
  coverageLabel,
  distinctPics,
  doneCount,
  isYearInProgress,
  lastRecorded,
  monthlySeries,
  scheduleDeviationsByPlannedMonth,
  programsInYear,
  recentlyCompleted,
  scheduledWorkplans,
  toIndonesianDate,
  upcoming,
  yearSummary,
} from '../utils/selectors';
import type { DataYear } from '../types';
import { useCountUp } from '../hooks/useCountUp';

/* -------------------------------------------------------------- kpi card */

function KpiCard({
  label,
  context,
  tip,
  icon,
  accent,
  variant = 'default',
  children,
}: {
  label: string;
  context: string;
  tip: { title: string; lines: string[]; footer?: string };
  icon: React.ReactNode;
  accent: string;
  variant?: 'default' | 'primary';
  children: React.ReactNode;
}) {
  const handlers = useTip(tip);
  const isPrimary = variant === 'primary';
  return (
    <div
      {...handlers}
      className="card"
      style={{
        padding: '18px 20px',
        display: 'grid',
        gap: 7,
        alignContent: 'start',
        ...(isPrimary
          ? {
              color: '#fff',
              background: '#1d4ed8',
              borderColor: '#1d4ed8',
            }
          : {}),
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          minHeight: 30,
        }}
      >
        <span
          style={{
            font: '600 10.5px var(--font-body)',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: isPrimary ? 'rgba(255, 255, 255, 0.9)' : 'var(--text-muted)',
          }}
        >
          {label}
        </span>
        <span
          aria-hidden
          style={{
            width: 32,
            height: 32,
            flex: '0 0 32px',
            borderRadius: 10,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            background: isPrimary ? 'rgba(255, 255, 255, 0.16)' : accent,
            boxShadow: isPrimary
              ? 'none'
              : `0 6px 14px -6px color-mix(in srgb, ${accent} 55%, transparent)`,
          }}
        >
          {icon}
        </span>
      </span>
      {children}
      <span
        style={{
          font: '400 12px/1.35 var(--font-body)',
          color: isPrimary ? 'rgba(255, 255, 255, 0.9)' : 'var(--text-muted)',
        }}
      >
        {context}
      </span>
    </div>
  );
}

function Value({
  value,
  suffix,
  variant = 'default',
}: {
  value: number;
  suffix?: string;
  variant?: 'default' | 'primary';
}) {
  const displayed = useCountUp(value);
  return (
    <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span
        style={{
          font: '600 34px var(--font-display)',
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
          color: variant === 'primary' ? '#fff' : 'var(--text-primary)',
        }}
      >
        {displayed}
      </span>
      {suffix ? (
        <span
          style={{
            font: '600 13px var(--font-body)',
            color: variant === 'primary' ? 'rgba(255, 255, 255, 0.9)' : 'var(--text-muted)',
          }}
        >
          {suffix}
        </span>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------ page */

export default function OverviewPage() {
  useDashboardData();
  const { year, prev, monthRange, filteredHref } = useFilters();

  const programs = allPrograms();
  const months = monthRange.isAll ? undefined : monthRange.months;
  const active = programsInYear(year, months);
  const total = checkpointCount(year, undefined, months);
  const done = doneCount(year, undefined, months);
  const cmp = yearSummary(year, prev, undefined, months);
  const coverage = coverageLabel(year);
  const inProgress = isYearInProgress(year);
  const activities = scheduledWorkplans(year, undefined, months);
  const pics = distinctPics(year, undefined, months);

  if (total === 0) {
    return (
      <EmptyYearState
        title="Overview"
        description="Ringkasan seluruh program dan dokumen yang tercatat."
        year={year}
      />
    );
  }

  const rank: RankItem[] = active.map((program) => ({
    id: program.id,
    name: program.name,
    route: program.route,
    total: checkpointCount(year, program.id, months),
    done: doneCount(year, program.id, months),
    activities: scheduledWorkplans(year, program.id, months),
  }));

  const heat: HeatRow[] = programs.flatMap((program) => {
    const series = monthlySeries(year, program.id, months);
    return series.some((value) => value > 0)
      ? [{ id: program.id, name: program.name, route: program.route, series }]
      : [];
  });

  return (
    <div className="feature-page">
      <PageHeader
        title="Overview"
        description={`Seluruh program dan dokumen yang tercatat pada tahun ${year}.`}
      />

      <div className="feature-content">
        <div className="dashboard-grid dashboard-grid-5">
          <KpiCard
            label="Program"
            context={`aktif pada ${year}, dari ${programs.length} program terdaftar`}
            icon={<Boxes size={15} strokeWidth={2} />}
            accent="var(--domain-accent)"
            tip={{
              title: 'Program',
              lines: active.slice(0, 8).map((p) => p.name),
              footer:
                active.length > 8
                  ? `dan ${active.length - 8} program lain.`
                  : 'Seluruh program yang aktif pada tahun terpilih.',
            }}
          >
            <Value value={active.length} />
          </KpiCard>

          <KpiCard
            label="Kegiatan"
            context={`kegiatan aktif menghasilkan ${total} dokumen pada ${year}`}
            icon={<ClipboardList size={15} strokeWidth={2} />}
            accent="#7c3aed"
            tip={{
              title: `Kegiatan ${year}`,
              lines: [
                `${activities} kegiatan aktif · ${total} dokumen`,
                `${pics.length} PIC terlibat`,
              ],
              footer: 'Satu kegiatan dapat menghasilkan lebih dari satu dokumen.',
            }}
          >
            <Value value={activities} />
          </KpiCard>

          <KpiCard
            label="Dokumen"
            context={`total dokumen tercatat pada ${year}`}
            icon={<FileText size={15} strokeWidth={2} />}
            accent="#0891b2"
            tip={{
              title: `Dokumen ${year}`,
              lines: [`${done} selesai`, `${total - done} belum selesai`],
              footer: 'Setiap catatan pelaksanaan dihitung sebagai satu dokumen.',
            }}
          >
            <Value value={total} />
          </KpiCard>

          <KpiCard
            label="Selesai"
            context={
              inProgress
                ? `dari ${total} dokumen terjadwal sejauh ini${lastRecorded(year, undefined, undefined, months) ? ` · terakhir ${lastRecorded(year, undefined, undefined, months)}` : ''}`
                : `dari ${total} dokumen${lastRecorded(year, undefined, undefined, months) ? ` · terakhir ${lastRecorded(year, undefined, undefined, months)}` : ''}`
            }
            icon={<CheckCircle2 size={15} strokeWidth={2} />}
            accent="var(--st-done)"
            variant="primary"
            tip={{
              title: `Selesai · ${year}`,
              lines: [
                `${done} dari ${total} dokumen sudah selesai`,
                `Periode rencana yang tercatat: ${coverage}`,
                `Pelaksanaan terakhir: ${lastRecorded(year, undefined, undefined, months) ?? 'belum ada'}`,
              ],
              footer: inProgress
                ? `Persentase dihitung dari jadwal yang sudah tercatat — ${year} masih berjalan. Tanggal pelaksanaan bisa jatuh di luar bulan rencananya.`
                : 'Status mengikuti catatan pelaksanaan masing-masing dokumen.',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <Value value={done} variant="primary" />
              <span
                style={{
                  padding: '3px 9px',
                  borderRadius: 999,
                  background: 'rgba(255, 255, 255, 0.16)',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  color: '#fff',
                  font: '600 12px var(--font-body)',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {done}/{total}
              </span>
            </span>
          </KpiCard>

          <KpiCard
            label="Tren Tahunan"
            context={
              prev === null
                ? 'belum ada tahun pembanding'
                : `dokumen selesai ${year} dibanding ${prev}`
            }
            icon={<TrendingUp size={15} strokeWidth={2} />}
            accent="#d97706"
            tip={{
              title: `Dokumen selesai ${cmp.year} dibanding ${prev ?? '-'}`,
              lines: [
                `Selesai ${cmp.year}: ${cmp.current} (tercatat ${coverage})`,
                cmp.previous === null || prev === null
                  ? 'Tidak ada tahun pembanding yang tersedia'
                  : `Selesai ${prev}: ${cmp.previous} (tercatat ${coverageLabel(prev)})`,
              ],
              footer: inProgress
                ? `${year} masih berjalan, sehingga angkanya belum mencakup satu tahun penuh.`
                : 'Membandingkan jumlah dokumen selesai sepanjang masing-masing tahun.',
            }}
          >
            <span style={{ display: 'grid', gap: 6 }}>
              <PairedBars
                currentYear={cmp.year}
                previousYear={cmp.previous === null ? null : prev}
                current={cmp.current}
                previous={cmp.previous}
                max={Math.max(cmp.current, cmp.previous ?? 0, 1)}
                note="Tidak ada tahun pembanding"
              />
              <DeltaChip
                delta={cmp.delta}
                tip={{
                  title: `Selisih terhadap ${prev ?? '-'}`,
                  lines: [
                    `Selesai ${cmp.year}: ${cmp.current}`,
                    prev === null
                      ? 'Tidak ada tahun pembanding'
                      : `Selesai ${prev}: ${cmp.previous ?? 0}`,
                  ],
                  footer:
                    'Sebaran bulanannya berbeda antar tahun. Lihat grafik jadwal bulanan di bawah.',
                }}
              />
            </span>
          </KpiCard>
        </div>

        <section>
          <SectionLabel
            label={`Jadwal Dokumen per Bulan ${year}`}
            readMe={
              <ReadMe
                lines={[
                  'Batang berwarna: jumlah dokumen menurut Periode Test dan Tahun.',
                  prev === null
                    ? 'Belum ada tahun pembanding untuk ditampilkan.'
                    : `Batang abu-abu di sebelahnya: bulan yang sama pada ${prev}.`,
                  'Arsir berarti tidak ada dokumen yang dijadwalkan bulan itu.',
                  'Gunakan Bulan di header untuk menyorot satu bulan.',
                ]}
              />
            }
          />
          <div className="dashboard-split dashboard-split-3-2">
            <div className="card" style={{ padding: '18px 20px', display: 'grid', gap: 12 }}>
              <span
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'baseline',
                  gap: 10,
                  font: '400 12px var(--font-body)',
                  color: 'var(--text-muted)',
                }}
              >
                <LegendDot color="var(--domain-accent)" label={`${year}`} />
                {prev !== null ? (
                  <LegendDot color="var(--year-2025)" label={`${prev}`} muted />
                ) : null}
                <span style={{ marginLeft: 'auto' }}>
                  Puncak jadwal:{' '}
                  <strong style={{ color: 'var(--text-secondary)' }}>
                    {busiestMonth(year, months)}
                  </strong>
                </span>
              </span>
              <MonthlyColumns
                current={monthlySeries(year, undefined, months)}
                previous={prev === null ? null : monthlySeries(prev, undefined, months)}
                currentYear={year}
                previousYear={prev}
                highlightMonth={monthRange.months}
                accent="var(--domain-accent)"
                deviationsByMonth={scheduleDeviationsByPlannedMonth(year)}
              />
            </div>

            <div
              className="card status-donut-card"
              style={{ padding: '18px 20px', display: 'grid', gap: 14, alignContent: 'start' }}
            >
              <span
                style={{
                  font: '600 10.5px var(--font-body)',
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                Status Dokumen {year}
              </span>
              <div className="status-donut-layout">
                <div className="status-donut-visual">
                  <CompositionDonut
                    composition={composition(year, undefined, months)}
                    total={total}
                    unitLabel={`Dokumen ${year}`}
                    programName="Seluruh program"
                  />
                </div>
                <div className="status-donut-legend">
                  {STATUS_ORDER.map((status) => {
                    const count = composition(year, undefined, months)[status];
                    return (
                      <div key={status} className="status-donut-legend-row">
                        <div className="status-donut-label-wrap">
                          <span
                            aria-hidden
                            className="status-donut-dot"
                            style={{ background: STATUSES[status].color }}
                          />
                          <span className="status-donut-label" title={STATUSES[status].label}>
                            {STATUSES[status].label}
                          </span>
                        </div>
                        <div className="status-donut-values">
                          <span className="status-donut-count">{count}</span>
                          <span className="status-donut-percent">
                            {total > 0 ? Math.round((count / total) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionLabel
            label="Program"
            readMe={
              <ReadMe
                lines={[
                  'Program mengikuti data terbaru, tanpa perlu pengaturan manual.',
                  'Panjang batang: jumlah dokumen pada tahun terpilih.',
                  'Bagian pekat: dokumen yang sudah selesai.',
                  'Klik salah satu program untuk melihat rincian kegiatannya.',
                ]}
              />
            }
          />
          <div className="dashboard-split dashboard-split-3-2">
            <div
              className="card program-rank-card"
              style={{ padding: '18px 20px', display: 'grid', gap: 14 }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <span style={{ font: '700 13.5px var(--font-body)' }}>
                  Peringkat volume dokumen
                </span>
                <Link
                  href="/dashboard/process-risk/program"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    textDecoration: 'none',
                    font: '600 12px var(--font-body)',
                    color: 'var(--domain-accent)',
                  }}
                >
                  Semua program
                  <ArrowUpRight size={13} strokeWidth={2.4} />
                </Link>
              </span>
              <ProgramRankBars items={rank} year={year} />
            </div>

            <UpcomingPanel year={year} months={months} filteredHref={filteredHref} />
          </div>
        </section>

        <section>
          <SectionLabel
            label={`Sebaran Dokumen per Program ${year}`}
            readMe={
              <ReadMe
                lines={[
                  'Dokumen ditempatkan berdasarkan Tahun dan Periode Test.',
                  'Angkanya sama dengan grafik jadwal bulanan, dipecah per program.',
                  'Kotak biru berisi jumlah dokumen; arsir berarti tidak ada jadwal.',
                  'Klik baris program untuk membuka rinciannya.',
                ]}
              />
            }
          />
          <div className="card" style={{ padding: '18px 20px', minWidth: 0 }}>
            <ProgramHeatmap rows={heat} year={year} highlightMonth={monthRange.months} />
          </div>
        </section>

        <section>
          <SectionLabel label="Pelaksanaan Terbaru" />
          <RecentPanel year={year} months={months} filteredHref={filteredHref} />
        </section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- fragments */

function LegendDot({ color, label, muted }: { color: string; label: string; muted?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span
        aria-hidden
        style={{
          width: 9,
          height: 9,
          borderRadius: 3,
          background: color,
          opacity: muted ? 0.45 : 1,
        }}
      />
      {label}
    </span>
  );
}

function busiestMonth(year: DataYear, months?: readonly number[]): string {
  const series = monthlySeries(year, undefined, months);
  const max = Math.max(...series);
  if (max === 0) return '—';
  const index = series.indexOf(max);
  return `${MONTHS_ID_LONG[index]} (${max} dokumen)`;
}

/** Agenda documents that are still scheduled in the current or a later planned month. */
function UpcomingPanel({
  year,
  months,
  filteredHref,
}: {
  year: DataYear;
  months?: readonly number[];
  filteredHref: (href: string) => string;
}) {
  const events = upcoming(year, new Date(), months);
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase('id-ID');
  const filteredEvents = normalizedQuery
    ? events.filter((event) =>
        [
          event.workplan.name,
          event.workplan.programName,
          event.entry.pic,
          event.entry.docNo,
          event.monthIndex >= 0 ? MONTHS_ID_LONG[event.monthIndex] : undefined,
        ].some((value) => value?.toLocaleLowerCase('id-ID').includes(normalizedQuery)),
      )
    : events;

  return (
    <div className="card upcoming-panel" style={{ padding: '18px 20px' }}>
      <span
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <CalendarClock size={14} strokeWidth={2} style={{ color: 'var(--domain-accent)' }} />
          <span
            style={{
              font: '600 10.5px var(--font-body)',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Agenda Berikutnya
          </span>
        </span>
        {events.length > 0 ? (
          <span
            style={{
              padding: '2px 7px',
              borderRadius: 999,
              background: 'var(--track)',
              color: 'var(--text-muted)',
              font: '700 10.5px var(--font-body)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {filteredEvents.length}/{events.length}
          </span>
        ) : null}
      </span>
      {events.length === 0 ? (
        <EmptyNote>Tidak ada agenda dokumen tersisa pada {year}.</EmptyNote>
      ) : (
        <>
          <label className="upcoming-search">
            <Search size={14} strokeWidth={2} aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari agenda, program, PIC, atau bulan..."
              aria-label="Cari agenda berikutnya"
            />
          </label>
          {filteredEvents.length === 0 ? (
            <div className="upcoming-list">
              <EmptyNote>Tidak ada agenda yang cocok dengan pencarian.</EmptyNote>
            </div>
          ) : (
            <div className="upcoming-list" role="list" aria-label="Daftar agenda berikutnya">
              {filteredEvents.map((event) => (
                <Link
                  key={`${event.entry.sourceId ?? event.workplan.row}-${event.entry.label}-${event.entry.docNo ?? ''}`}
                  href={filteredHref(`/dashboard/process-risk/program/${event.workplan.program}`)}
                  className="card-link"
                  role="listitem"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    textDecoration: 'none',
                    color: 'inherit',
                    padding: '9px 11px',
                    borderRadius: 10,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-strip)',
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 38,
                      flex: '0 0 38px',
                      display: 'grid',
                      justifyItems: 'center',
                      gap: 1,
                      padding: '4px 0',
                      borderRadius: 8,
                      background: '#fff',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span
                      style={{
                        font: '700 13px var(--font-display)',
                        color: 'var(--text-primary)',
                        lineHeight: 1,
                      }}
                    >
                      {event.entry.date ? Number(event.entry.date.slice(8, 10)) : '–'}
                    </span>
                    <span style={{ font: '600 9px var(--font-body)', color: 'var(--text-muted)' }}>
                      {event.monthIndex >= 0 ? MONTHS_ID_LONG[event.monthIndex]?.slice(0, 3) : ''}
                    </span>
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        display: 'block',
                        font: '600 12px var(--font-body)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {event.workplan.name}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        font: '400 11px var(--font-body)',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {event.workplan.programName}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 999,
                      background: STATUSES[event.status].color,
                    }}
                  />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
      <span style={{ font: '400 11px/1.5 var(--font-body)', color: 'var(--text-muted)' }}>
        Diurutkan dari Periode Test terdekat pada {year}.
      </span>
    </div>
  );
}

function RecentPanel({
  year,
  months,
  filteredHref,
}: {
  year: DataYear;
  months?: readonly number[];
  filteredHref: (href: string) => string;
}) {
  const events = recentlyCompleted(year, 6, undefined, months);
  if (events.length === 0) {
    return (
      <div className="card" style={{ padding: '18px 20px' }}>
        <EmptyNote>Belum ada dokumen yang selesai pada {year}.</EmptyNote>
      </div>
    );
  }

  return (
    <div className="dashboard-grid dashboard-grid-3">
      {events.map((event) => (
        <Link
          key={`${event.workplan.row}-${event.entry.label}-${event.entry.docNo ?? ''}`}
          href={filteredHref(`/dashboard/process-risk/program/${event.workplan.program}`)}
          className="card card-link"
          style={{
            display: 'grid',
            gap: 7,
            alignContent: 'start',
            padding: '14px 16px',
            textDecoration: 'none',
            color: 'inherit',
            borderLeft: `3px solid var(--st-done)`,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span
              style={{
                font: '600 10px var(--font-body)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {event.workplan.programName}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 7px',
                borderRadius: 999,
                background: 'color-mix(in srgb, var(--st-done) 10%, white)',
                color: 'var(--st-done)',
                font: '600 10px var(--font-body)',
                whiteSpace: 'nowrap',
              }}
            >
              <CalendarCheck2 size={10} strokeWidth={2.4} />
              {toIndonesianDate(event.entry.value).replace('Selesai, ', '')}
            </span>
          </span>
          <span style={{ font: '700 13px var(--font-body)', color: 'var(--text-primary)' }}>
            {event.workplan.name}
          </span>
          <span style={{ font: '400 11.5px/1.5 var(--font-body)', color: 'var(--text-muted)' }}>
            {[event.entry.docNo, event.entry.pic].filter(Boolean).join(' · ') ||
              'Nomor dokumen belum dicatat'}
          </span>
        </Link>
      ))}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'grid',
        justifyItems: 'center',
        gap: 8,
        padding: '26px 12px',
        borderRadius: 10,
        border: '1px dashed var(--border-divider)',
        background: 'var(--bg-strip)',
        font: '400 12px var(--font-body)',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}
    >
      <Inbox size={20} strokeWidth={1.6} aria-hidden />
      {children}
    </span>
  );
}
