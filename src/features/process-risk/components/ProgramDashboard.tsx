'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, ChevronRight, FileText, Search, TriangleAlert, Users } from 'lucide-react';
import { STATUSES } from '../utils/constants';
import { useDashboardData } from '../data/workplans';
import { useFilters, VALID_YEARS } from '../context/ProcessRiskFilterContext';
import { PageHeader, SectionLabel } from './PageHeader';
import { EmptyProgramState } from './EmptyState';
import { MonthlyColumns, PairedBars, PeriodTile } from './Charts';
import { DeltaChip, ReadMe, statusGlyph } from './Primitives';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MONTHS_ID,
  checkpointCount,
  coverageLabel,
  deriveScheduleDeviation,
  deriveStatus,
  distinctPics,
  doneCount,
  isMissingEvidence,
  isYearInProgress,
  monthIndex,
  monthlySeries,
  periodsFor,
  programById,
  scheduleDeviationsByPlannedMonth,
  toIndonesianDate,
  undatedEntries,
  workplansOf,
  yearSummary,
} from '../utils/selectors';
import type { Workplan } from '../types';
import { useCountUp } from '../hooks/useCountUp';

type FilterId = 'all' | 'done' | 'open' | 'mismatch' | 'noevidence';

function summarizeDeviations(entries: ReturnType<typeof periodsFor>) {
  const deviations = entries
    .filter((entry) => entry.mismatch)
    .map(deriveScheduleDeviation)
    .filter((item): item is NonNullable<typeof item> => item !== null);
  return {
    early: deviations.filter((item) => item.kind === 'early').length,
    late: deviations.filter((item) => item.kind === 'late').length,
    unknown: deviations.filter((item) => item.kind === 'unknown').length,
  };
}

const FILTERS: { id: FilterId; label: string; hint: string }[] = [
  { id: 'all', label: 'Semua', hint: 'Seluruh kegiatan program ini' },
  { id: 'done', label: 'Ada yang selesai', hint: 'Kegiatan dengan minimal satu dokumen selesai' },
  { id: 'open', label: 'Belum selesai', hint: 'Kegiatan dengan dokumen yang belum selesai' },
  { id: 'mismatch', label: 'Di luar jadwal', hint: 'Pelaksanaan di luar periode rencana' },
  {
    id: 'noevidence',
    label: 'Tanpa lampiran',
    hint: 'Dokumen selesai yang belum melampirkan berkas',
  },
];

export default function ProgramDashboard({ slug }: { slug: string }) {
  useDashboardData();
  const { year, prev, monthRange, filteredHref } = useFilters();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const [detail, setDetail] = useState<Workplan | null>(null);

  const program = programById(slug);
  const rows = workplansOf(slug);
  const selectedMonths = monthRange.isAll ? undefined : monthRange.months;
  const scopedPeriods = useCallback(
    (workplan: Workplan, targetYear: number) =>
      periodsFor(workplan, targetYear).filter(
        (entry) => !selectedMonths || selectedMonths.includes(monthIndex(entry.label) + 1),
      ),
    [selectedMonths],
  );

  const visible = useMemo(() => {
    if (!program) return [];
    return rows.filter((w) => {
      if (query && !w.name.toLowerCase().includes(query.toLowerCase())) return false;
      const current = scopedPeriods(w, year);
      if (filter === 'done') return current.some((p) => deriveStatus(p.value) === 'done');
      if (filter === 'open') return current.some((p) => deriveStatus(p.value) !== 'done');
      if (filter === 'mismatch') return current.some((p) => p.mismatch);
      if (filter === 'noevidence') return current.some(isMissingEvidence);
      return true;
    });
  }, [program, rows, query, filter, year, scopedPeriods]);

  if (!program) notFound();

  const total = checkpointCount(year, slug, selectedMonths);
  const done = doneCount(year, slug, selectedMonths);
  const cmp = yearSummary(year, prev, slug, selectedMonths);
  const coverage = coverageLabel(year);
  const pics = distinctPics(year, slug, selectedMonths);
  const scopedEntries = rows.flatMap((workplan) => scopedPeriods(workplan, year));
  const mismatch = scopedEntries.filter((entry) => entry.mismatch).length;
  const deviations = summarizeDeviations(scopedEntries);
  const undated = monthRange.isAll ? undatedEntries(slug) : [];
  const missingEvidence = scopedEntries.filter(isMissingEvidence).length;
  const monthColumns = monthRange.isAll
    ? MONTHS_ID.map((_, i) => i)
    : monthRange.months.map((month) => month - 1);

  if (total === 0) {
    return (
      <EmptyProgramState
        name={program.name}
        color={program.color}
        description={`Program dengan ${rows.length} kegiatan terdaftar.`}
        message={
          undated.length > 0
            ? `Program ini punya ${undated.length} dokumen yang belum mencantumkan tahun, sehingga belum bisa ditampilkan pada ringkasan ${year}.`
            : `Belum ada dokumen ${program.name} untuk tahun ${year}. Coba pilih tahun lain pada filter di header.`
        }
      />
    );
  }

  return (
    <div className="feature-page">
      <Breadcrumb name={program.name} filteredHref={filteredHref} />
      <PageHeader
        title={program.name}
        description={`${rows.length} kegiatan · ${total} dokumen tercatat pada ${year}.`}
      />

      <div className="feature-content">
        <div className="dashboard-grid dashboard-grid-4">
          <StatCard
            label="Dokumen"
            value={total}
            context={`pada ${year}`}
            icon={<FileText size={15} strokeWidth={2} />}
            accent={program.color}
          />
          <StatCard
            label="Selesai"
            value={done}
            context={
              isYearInProgress(year)
                ? `dari ${total} dokumen terjadwal sejauh ini`
                : `dari ${total} dokumen pada ${year}`
            }
            icon={<CheckCircle2 size={15} strokeWidth={2} />}
            accent="var(--st-done)"
          />
          <StatCard
            label="PIC Terlibat"
            value={pics.length}
            context={
              pics.length === 0
                ? 'belum tercatat'
                : `${pics.slice(0, 2).join(', ')}${pics.length > 2 ? ` +${pics.length - 2} lainnya` : ''}`
            }
            icon={<Users size={15} strokeWidth={2} />}
            accent="#7c3aed"
          />
          <div
            className="card"
            style={{ padding: '16px 18px', display: 'grid', gap: 8, alignContent: 'start' }}
          >
            <span
              style={{
                font: '600 10.5px var(--font-body)',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              Tren Tahunan
            </span>
            {prev === null || cmp.previous === null ? (
              <span style={{ font: '400 12px/1.5 var(--font-body)', color: 'var(--text-muted)' }}>
                Belum ada tahun pembanding untuk program ini.
              </span>
            ) : (
              <span style={{ display: 'grid', gap: 8 }}>
                <PairedBars
                  currentYear={year}
                  previousYear={prev}
                  current={cmp.current}
                  previous={cmp.previous}
                  max={Math.max(cmp.current, cmp.previous ?? 0, 1)}
                  note="Tidak ada tahun pembanding"
                />
                <DeltaChip
                  delta={cmp.delta}
                  tip={{
                    title: `${program.name} · ${year} vs ${prev}`,
                    lines: [
                      `Selesai ${year}: ${cmp.current} (tercatat ${coverage})`,
                      `Selesai ${prev}: ${cmp.previous} (tercatat ${coverageLabel(prev)})`,
                    ],
                    footer: 'Sebaran bulanannya bisa berbeda. Lihat grafik di bawah.',
                  }}
                />
              </span>
            )}
          </div>
        </div>

        {(mismatch > 0 || undated.length > 0 || missingEvidence > 0) && (
          <div
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 16px',
              borderLeft: '3px solid var(--st-progress)',
              font: '400 12px/1.5 var(--font-body)',
              color: 'var(--text-muted)',
            }}
          >
            <TriangleAlert
              size={15}
              strokeWidth={2}
              aria-hidden
              style={{ color: 'var(--st-progress)', flex: '0 0 15px' }}
            />
            <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0 4px' }}>
              {missingEvidence > 0 ? (
                <span>{missingEvidence} dokumen selesai belum melampirkan berkas ·</span>
              ) : null}
              {mismatch > 0 ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        style={{ textDecoration: 'underline dotted', textUnderlineOffset: 3 }}
                      >
                        {mismatch} dokumen dilaksanakan di luar periode rencana
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-72 space-y-1.5 py-2">
                      <p className="font-semibold">Rincian berdasarkan selisih bulan</p>
                      <p>
                        {deviations.early} lebih awal · {deviations.late} lebih lambat
                        {deviations.unknown > 0
                          ? ` · ${deviations.unknown} tanpa tanggal/bulan yang dapat dibandingkan`
                          : ''}
                      </p>
                      <p className="opacity-80">
                        Periode rencana hanya mencatat bulan, sehingga selisih hari tidak dihitung.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
              {undated.length > 0 ? (
                <span>· {undated.length} dokumen belum mencantumkan tahun</span>
              ) : null}
              <span>.</span>
            </span>
          </div>
        )}

        <section>
          <SectionLabel
            label={`Jadwal Dokumen per Bulan ${year}`}
            readMe={
              <ReadMe
                lines={[
                  `Jumlah dokumen program ini menurut Periode Test dan Tahun ${year}.`,
                  prev === null
                    ? 'Belum ada tahun pembanding.'
                    : `Batang abu-abu: bulan yang sama pada ${prev}.`,
                  'Arsir berarti tidak ada jadwal pada bulan tersebut.',
                ]}
              />
            }
          />
          <div className="card" style={{ padding: '18px 20px' }}>
            <MonthlyColumns
              current={monthlySeries(year, slug, selectedMonths)}
              previous={prev === null ? null : monthlySeries(prev, slug, selectedMonths)}
              currentYear={year}
              previousYear={prev}
              highlightMonth={monthRange.months}
              accent={program.color}
              deviationsByMonth={scheduleDeviationsByPlannedMonth(year, slug).map((items, index) =>
                !selectedMonths || selectedMonths.includes(index + 1) ? items : [],
              )}
            />
          </div>
        </section>

        <section>
          <SectionLabel
            label="Kegiatan"
            readMe={
              <ReadMe
                legend={[
                  { label: 'Selesai', color: 'var(--st-done)', glyph: statusGlyph('done') },
                  {
                    label: 'Terjadwal',
                    color: 'var(--st-progress)',
                    glyph: statusGlyph('progress'),
                  },
                  {
                    label: 'Data belum lengkap',
                    color: 'var(--st-notyet)',
                    glyph: statusGlyph('notyet'),
                  },
                ]}
                notes={[
                  { swatch: 'dot', text: 'Abu-abu terang: tidak ada dokumen pada bulan tersebut' },
                  { swatch: 'ring', text: 'Garis oranye: pelaksanaan di luar periode rencana' },
                  {
                    swatch: 'dot',
                    text: 'Titik oranye: selesai tetapi berkas belum dilampirkan',
                  },
                ]}
              />
            }
          />

          <div className="card" style={{ borderTop: `3px solid ${program.color}` }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 8,
                padding: '12px 18px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flex: '1 1 220px',
                  maxWidth: 320,
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border-default)',
                }}
              >
                <Search
                  size={14}
                  strokeWidth={2}
                  style={{ color: 'var(--text-muted)' }}
                  aria-hidden
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari kegiatan..."
                  aria-label="Cari kegiatan"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    font: '400 12.5px var(--font-body)',
                    color: 'var(--text-primary)',
                  }}
                />
              </span>
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  title={f.hint}
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    border: '1px solid var(--border-default)',
                    background: filter === f.id ? 'var(--domain-accent)' : 'var(--bg-card)',
                    color: filter === f.id ? '#fff' : 'var(--text-secondary)',
                    font: '600 12px var(--font-body)',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className={monthRange.isAll ? 'data-table-scroll' : 'data-table-fit'}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: monthRange.isAll ? 900 : undefined,
                }}
              >
                <thead>
                  <tr style={{ background: 'var(--bg-strip)' }}>
                    <th style={{ ...thBase, textAlign: 'left', width: 320, paddingLeft: 18 }}>
                      Kegiatan
                    </th>
                    {monthColumns.map((i) => (
                      <th key={i} style={{ ...thBase, minWidth: 48 }}>
                        {MONTHS_ID[i]}
                      </th>
                    ))}
                    <th
                      style={{
                        ...thBase,
                        textAlign: 'right',
                        width: 150,
                        paddingRight: 16,
                        borderLeft: '1px solid var(--border-subtle)',
                      }}
                    >
                      Ringkasan {year}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td
                        colSpan={monthColumns.length + 2}
                        style={{
                          padding: '36px 18px',
                          textAlign: 'center',
                          font: '400 12.5px var(--font-body)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        Tidak ada kegiatan yang cocok dengan filter ini.
                      </td>
                    </tr>
                  ) : (
                    visible.map((w, idx) => {
                      const current = scopedPeriods(w, year);
                      const previousList = prev === null ? [] : scopedPeriods(w, prev);
                      const curDone = current.filter(
                        (p) => deriveStatus(p.value) === 'done',
                      ).length;
                      return (
                        <tr
                          key={w.row}
                          onClick={() => setDetail(w)}
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && setDetail(w)}
                          style={{
                            cursor: 'pointer',
                            background: idx % 2 ? 'var(--bg-subtle)' : 'transparent',
                            borderBottom: '1px solid var(--border-subtle)',
                          }}
                        >
                          <td style={{ padding: '10px 18px' }}>
                            <span style={{ display: 'block', font: '600 12.5px var(--font-body)' }}>
                              {w.name}
                            </span>
                            <span
                              style={{
                                display: 'block',
                                font: '400 11px var(--font-body)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {[w.category, w.pic].filter(Boolean).join(' · ') ||
                                'Kategori belum dicatat'}
                            </span>
                          </td>
                          {monthColumns.map((i) => {
                            const c = current.find((p) => monthIndex(p.label) === i);
                            return (
                              <td key={i} style={{ padding: '8px 4px', textAlign: 'center' }}>
                                <span style={{ display: 'grid', gap: 3, justifyItems: 'center' }}>
                                  {c ? (
                                    <PeriodTile
                                      entry={c}
                                      year={year}
                                      workplanName={w.name}
                                      remark={w.remark}
                                    />
                                  ) : null}
                                </span>
                              </td>
                            );
                          })}
                          <td
                            style={{
                              padding: '8px 16px',
                              textAlign: 'right',
                              background: 'var(--bg-strip)',
                              borderLeft: '1px solid var(--border-subtle)',
                            }}
                          >
                            <span style={{ display: 'grid', gap: 2, justifyItems: 'end' }}>
                              <span style={{ font: '700 13px var(--font-display)' }}>
                                {curDone}/{current.length} selesai
                              </span>
                              {prev !== null ? (
                                <span
                                  style={{
                                    font: '400 10.5px var(--font-body)',
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  {previousList.length === 0
                                    ? `${prev}: tidak ada data`
                                    : `${prev}: ${
                                        previousList.filter((p) => deriveStatus(p.value) === 'done')
                                          .length
                                      }/${previousList.length}`}
                                </span>
                              ) : null}
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  font: '600 11px var(--font-body)',
                                  color: 'var(--domain-accent)',
                                }}
                              >
                                Riwayat
                                <ChevronRight size={11} strokeWidth={2.4} aria-hidden />
                              </span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p
            style={{
              margin: '10px 2px 0',
              font: '400 11.5px/1.6 var(--font-body)',
              color: 'var(--text-muted)',
            }}
          >
            Klik baris kegiatan untuk melihat riwayat lengkap per tahun beserta nomor dokumen.
          </p>
        </section>
      </div>

      {detail ? <HistoryDrawer workplan={detail} onClose={() => setDetail(null)} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------- fragments */

const thBase: React.CSSProperties = {
  padding: '10px 4px',
  font: '600 11px var(--font-body)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

function Breadcrumb({
  name,
  filteredHref,
}: {
  name: string;
  filteredHref: (href: string) => string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
        font: '400 11.5px var(--font-body)',
        color: 'var(--text-muted)',
      }}
    >
      <Link href={filteredHref('/dashboard/process-risk')} style={{ color: 'inherit', textDecoration: 'none' }}>
        Overview
      </Link>
      <ChevronRight size={12} strokeWidth={2} aria-hidden />
      <Link
        href={filteredHref('/dashboard/process-risk/program')}
        style={{ color: 'inherit', textDecoration: 'none' }}
      >
        Program
      </Link>
      <ChevronRight size={12} strokeWidth={2} aria-hidden />
      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{name}</span>
    </nav>
  );
}

function StatCard({
  label,
  value,
  context,
  icon,
  accent,
}: {
  label: string;
  value: number;
  context: string;
  icon: React.ReactNode;
  accent: string;
}) {
  const displayed = useCountUp(value);
  return (
    <div
      className="card"
      style={{ padding: '16px 18px', display: 'grid', gap: 6, alignContent: 'start' }}
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
            color: 'var(--text-muted)',
          }}
        >
          {label}
        </span>
        <span
          aria-hidden
          style={{
            width: 30,
            height: 30,
            flex: '0 0 30px',
            borderRadius: 9,
            display: 'grid',
            placeItems: 'center',
            color: accent,
            background: `color-mix(in srgb, ${accent} 10%, white)`,
            border: `1px solid color-mix(in srgb, ${accent} 18%, white)`,
          }}
        >
          {icon}
        </span>
      </span>
      <span
        style={{
          font: '700 30px var(--font-display)',
          letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--text-primary)',
        }}
      >
        {displayed}
      </span>
      <span
        style={{
          font: '400 12px/1.35 var(--font-body)',
          color: 'var(--text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {context}
      </span>
    </div>
  );
}

function HistoryDrawer({ workplan, onClose }: { workplan: Workplan; onClose: () => void }) {
  const years = VALID_YEARS;
  const labels = Array.from(
    new Set(years.flatMap((y) => periodsFor(workplan, y).map((p) => p.label))),
  ).sort((a, b) => {
    const ia = monthIndex(a);
    const ib = monthIndex(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Riwayat ${workplan.name}`}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgb(15 23 42 / 0.3)',
      }}
      onClick={onClose}
    >
      <div
        className="scroll-area history-drawer"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 100vw)',
          height: '100%',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, font: '700 17px var(--font-display)' }}>{workplan.name}</h2>
            <p
              style={{
                margin: '4px 0 0',
                font: '400 12px/1.6 var(--font-body)',
                color: 'var(--text-muted)',
              }}
            >
              {[workplan.programName, workplan.category, workplan.pic].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              width: 44,
              height: 44,
              flex: '0 0 44px',
              fontSize: 20,
              cursor: 'pointer',
              lineHeight: 1,
              color: 'var(--text-muted)',
            }}
          >
            ×
          </button>
        </div>

        {workplan.remark ? (
          <p
            style={{
              margin: '14px 0 0',
              padding: '10px 12px',
              borderRadius: 10,
              background: 'var(--bg-strip)',
              border: '1px solid var(--border-subtle)',
              font: '400 12px/1.6 var(--font-body)',
              color: 'var(--text-secondary)',
            }}
          >
            {workplan.remark}
          </p>
        ) : null}

        <div className="data-table-scroll" style={{ marginTop: 18 }}>
          <table style={{ width: '100%', minWidth: 420, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Periode</th>
                {years.map((y) => (
                  <th key={y} style={thStyle}>
                    {y}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label) => (
                <tr key={label} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <td style={{ ...tdStyle, font: '700 12px var(--font-body)' }}>
                    {toIndonesianDate(label)}
                  </td>
                  {years.map((y) => {
                    const entry = periodsFor(workplan, y).find((p) => p.label === label);
                    if (!entry) {
                      return (
                        <td key={y} style={tdStyle}>
                          <span style={{ color: 'var(--text-lightest)' }}>—</span>
                        </td>
                      );
                    }
                    const status = deriveStatus(entry.value);
                    return (
                      <td key={y} style={tdStyle}>
                        <span style={{ display: 'grid', gap: 3 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              font: '600 11.5px var(--font-body)',
                              color:
                                status === 'blank' ? 'var(--text-muted)' : STATUSES[status].color,
                            }}
                          >
                            <span
                              aria-hidden
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: 999,
                                background:
                                  status === 'blank'
                                    ? 'var(--st-blank-border)'
                                    : STATUSES[status].color,
                              }}
                            />
                            {entry.value ? toIndonesianDate(entry.value) : 'Belum ada data'}
                          </span>
                          {entry.docNo ? (
                            <span
                              style={{
                                font: '400 10.5px var(--font-body)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {entry.docNo}
                            </span>
                          ) : null}
                          {entry.mismatch ? (
                            <span
                              style={{
                                font: '600 10.5px var(--font-body)',
                                color: 'var(--st-progress)',
                              }}
                            >
                              Di luar periode rencana
                            </span>
                          ) : null}
                          {isMissingEvidence(entry) ? (
                            <span
                              style={{
                                font: '600 10.5px var(--font-body)',
                                color: 'var(--st-progress)',
                              }}
                            >
                              Berkas belum dilampirkan
                            </span>
                          ) : null}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {workplan.undated.length > 0 ? (
          <p
            style={{
              marginTop: 14,
              font: '400 11.5px/1.6 var(--font-body)',
              color: 'var(--st-progress)',
            }}
          >
            {workplan.undated.length} dokumen pada kegiatan ini belum mencantumkan tahun, sehingga
            tidak muncul di tabel tahun mana pun.
          </p>
        ) : null}

        <p
          style={{
            marginTop: 16,
            font: '400 11.5px/1.6 var(--font-body)',
            color: 'var(--text-muted)',
          }}
        >
          Status dibaca dari data pelaksanaan yang tersedia. Sel kosong berarti belum ada catatan,
          bukan bukti terlambat atau gagal.
        </p>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  font: '600 10.5px var(--font-body)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  background: 'var(--bg-strip)',
};

const tdStyle: React.CSSProperties = {
  padding: '9px 10px',
  font: '400 12px var(--font-body)',
  color: 'var(--text-secondary)',
  verticalAlign: 'top',
};
