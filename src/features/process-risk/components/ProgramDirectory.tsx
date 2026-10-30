'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Inbox, Search, TriangleAlert } from 'lucide-react';
import { useFilters } from '../context/ProcessRiskFilterContext';
import { useDashboardData } from '../data/workplans';
import { PageHeader, SectionLabel } from './PageHeader';
import { Sparkline } from './Charts';
import { ReadMe } from './Primitives';
import {
  MONTHS_ID,
  allPrograms,
  deriveStatus,
  isMissingEvidence,
  isUncategorized,
  lastRecorded,
  monthIndex,
  monthlySeries,
  periodsFor,
  undatedEntries,
  workplansOf,
} from '../utils/selectors';
import { useCountUp } from '../hooks/useCountUp';

type SortId = 'volume' | 'name' | 'completion';

const SORTS: { id: SortId; label: string }[] = [
  { id: 'volume', label: 'Dokumen terbanyak' },
  { id: 'completion', label: 'Penyelesaian tertinggi' },
  { id: 'name', label: 'Nama A–Z' },
];

type FilterId = 'all' | 'complete' | 'open' | 'attention' | 'nodata';

const FILTERS: { id: FilterId; label: string; hint: string }[] = [
  { id: 'all', label: 'Semua', hint: 'Seluruh program terdaftar' },
  {
    id: 'complete',
    label: 'Selesai penuh',
    hint: 'Semua dokumen tahun ini berstatus selesai',
  },
  {
    id: 'open',
    label: 'Ada yang belum',
    hint: 'Masih ada dokumen yang belum selesai',
  },
  {
    id: 'attention',
    label: 'Perlu perhatian',
    hint: 'Selesai tanpa lampiran, data belum lengkap, di luar jadwal, atau tanpa tahun',
  },
  { id: 'nodata', label: 'Tanpa data', hint: 'Tidak ada dokumen pada tahun terpilih' },
];

export default function ProgramDirectory() {
  useDashboardData();
  const { year, monthRange, filteredHref } = useFilters();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortId>('volume');
  const [filter, setFilter] = useState<FilterId>('all');

  const programs = allPrograms();

  const list = useMemo(
    () =>
      programs.map((program) => {
        const workplans = workplansOf(program.id);
        const scoped = workplans.map((workplan) => ({
          workplan,
          entries: periodsFor(workplan, year).filter(
            (entry) => monthRange.isAll || monthRange.months.includes(monthIndex(entry.label) + 1),
          ),
        }));
        const entries = scoped.flatMap(({ entries: periodEntries }) => periodEntries);
        const total = entries.length;
        const done = entries.filter((entry) => deriveStatus(entry.value) === 'done').length;
        const noEvidence = entries.filter(isMissingEvidence).length;
        const incomplete = entries.filter((entry) => deriveStatus(entry.value) === 'notyet').length;
        const mismatch = entries.filter((entry) => entry.mismatch).length;
        const undated = monthRange.isAll ? undatedEntries(program.id).length : 0;
        return {
          ...program,
          total,
          done,
          noEvidence,
          incomplete,
          mismatch,
          undated,
          attention: noEvidence + incomplete + mismatch + undated,
          activities: scoped.filter(({ entries: periodEntries }) => periodEntries.length > 0)
            .length,
          allActivities: workplans.length,
          completion: total === 0 ? -1 : done / total,
          series: monthlySeries(year, program.id),
        };
      }),
    [programs, year, monthRange],
  );

  const counts = useMemo<Record<FilterId, number>>(
    () => ({
      all: list.length,
      complete: list.filter((p) => p.total > 0 && p.done === p.total).length,
      open: list.filter((p) => p.total > 0 && p.done < p.total).length,
      attention: list.filter((p) => p.attention > 0).length,
      nodata: list.filter((p) => p.total === 0).length,
    }),
    [list],
  );

  const cards = useMemo(() => {
    const byFilter = list.filter((program) => {
      if (filter === 'complete') return program.total > 0 && program.done === program.total;
      if (filter === 'open') return program.total > 0 && program.done < program.total;
      if (filter === 'attention') return program.attention > 0;
      if (filter === 'nodata') return program.total === 0;
      return true;
    });

    const filtered = query.trim()
      ? byFilter.filter((program) => {
          const needle = query.trim().toLowerCase();
          if (program.name.toLowerCase().includes(needle)) return true;
          return workplansOf(program.id).some((w) => w.name.toLowerCase().includes(needle));
        })
      : byFilter;

    return [...filtered].sort((a, b) => {
      if (isUncategorized(a.id) !== isUncategorized(b.id)) return isUncategorized(a.id) ? 1 : -1;
      if (sort === 'name') return a.name.localeCompare(b.name, 'id-ID');
      if (sort === 'completion') return b.completion - a.completion || b.total - a.total;
      return b.total - a.total || a.name.localeCompare(b.name, 'id-ID');
    });
  }, [list, query, sort, filter]);

  const withData = list.filter((program) => program.total > 0).length;
  const scopeLabel = monthRange.isAll
    ? `${year}`
    : `${MONTHS_ID[(monthRange.start ?? 1) - 1]}${monthRange.start === monthRange.end ? '' : `–${MONTHS_ID[(monthRange.end ?? 1) - 1]}`} ${year}`;

  return (
    <div className="feature-page">
      <PageHeader
        title="Program"
        description={`${programs.length} program terdaftar, ${withData} di antaranya memiliki dokumen pada ${scopeLabel}.`}
      />

      <div className="feature-content">
        <section>
          <SectionLabel
            label="Daftar Program"
            readMe={
              <ReadMe
                lines={[
                  'Setiap kartu mewakili satu program yang terdaftar.',
                  'Angka besar mengikuti tahun dan Bulan yang dipilih di header.',
                  'Batang kecil menunjukkan sebaran dokumen sepanjang 12 bulan.',
                  'Klik kartu untuk melihat seluruh kegiatan di dalam program.',
                ]}
              />
            }
          />

          <div
            className="card"
            style={{
              display: 'grid',
              gap: 10,
              padding: '12px 16px',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flex: '1 1 240px',
                  maxWidth: 340,
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
                  placeholder="Cari program atau kegiatan..."
                  aria-label="Cari program atau kegiatan"
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
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <span
                  style={{
                    font: '400 11.5px var(--font-body)',
                    color: 'var(--text-muted)',
                    marginRight: 2,
                  }}
                >
                  Urutkan
                </span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortId)}
                  aria-label="Urutkan program"
                  className="secondary-select"
                  style={{
                    padding: '7px 10px',
                    borderRadius: 10,
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    font: '600 12px var(--font-body)',
                    cursor: 'pointer',
                  }}
                >
                  {SORTS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 6,
                paddingTop: 10,
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              {FILTERS.map((option) => {
                const active = filter === option.id;
                const count = counts[option.id];
                return (
                  <button
                    key={option.id}
                    type="button"
                    title={option.hint}
                    onClick={() => setFilter(option.id)}
                    aria-pressed={active}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 11px',
                      borderRadius: 999,
                      cursor: 'pointer',
                      border: '1px solid var(--border-default)',
                      background: active ? 'var(--domain-accent)' : 'var(--bg-card)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      font: '600 12px var(--font-body)',
                    }}
                  >
                    {option.label}
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 999,
                        background: active ? 'rgba(255, 255, 255, 0.22)' : 'var(--track)',
                        color: active ? '#fff' : 'var(--text-muted)',
                        font: '700 10.5px var(--font-body)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {cards.length === 0 ? (
            <div
              className="card"
              style={{
                display: 'grid',
                justifyItems: 'center',
                gap: 8,
                padding: '48px 24px',
                textAlign: 'center',
                font: '400 12.5px var(--font-body)',
                color: 'var(--text-muted)',
              }}
            >
              <Inbox size={22} strokeWidth={1.6} aria-hidden />
              {query.trim()
                ? `Tidak ada program yang cocok dengan pencarian “${query}”.`
                : 'Tidak ada program pada kategori filter ini.'}
            </div>
          ) : (
            <div className="dashboard-grid dashboard-grid-3">
              {cards.map((program) => (
                <Link
                  key={program.id}
                  href={filteredHref(program.route)}
                  className="card card-link"
                  style={{
                    display: 'grid',
                    alignContent: 'start',
                    gap: 12,
                    padding: '16px 18px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <span style={{ display: 'grid', gap: 3, minWidth: 0 }}>
                    <span
                      style={{
                        font: '700 14px var(--font-body)',
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={program.name}
                    >
                      {program.name}
                    </span>
                    <span
                      style={{ font: '400 11.5px var(--font-body)', color: 'var(--text-muted)' }}
                    >
                      {program.allActivities} kegiatan terdaftar
                      {program.activities !== program.allActivities
                        ? ` · ${program.activities} aktif ${scopeLabel}`
                        : ''}
                    </span>
                  </span>

                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <span style={{ display: 'grid', gap: 1 }}>
                      <Counter value={program.total} color="var(--domain-accent)" />
                      <span
                        style={{ font: '400 11px var(--font-body)', color: 'var(--text-muted)' }}
                      >
                        dokumen {scopeLabel}
                      </span>
                    </span>
                    {program.total > 0 ? (
                      <span
                        style={{
                          padding: '3px 9px',
                          borderRadius: 999,
                          background:
                            program.done === program.total
                              ? 'color-mix(in srgb, var(--st-done) 10%, white)'
                              : 'color-mix(in srgb, var(--st-progress) 12%, white)',
                          border:
                            program.done === program.total
                              ? '1px solid color-mix(in srgb, var(--st-done) 22%, white)'
                              : '1px solid color-mix(in srgb, var(--st-progress) 30%, white)',
                          color:
                            program.done === program.total
                              ? 'var(--st-done)'
                              : 'var(--st-progress)',
                          font: '700 11.5px var(--font-body)',
                          fontVariantNumeric: 'tabular-nums',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {program.done}/{program.total} selesai
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '3px 9px',
                          borderRadius: 999,
                          background: 'var(--track)',
                          color: 'var(--text-muted)',
                          font: '600 11px var(--font-body)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Tidak ada di {scopeLabel}
                      </span>
                    )}
                  </span>

                  <Sparkline
                    series={program.series}
                    color="var(--domain-accent)"
                    highlightMonth={monthRange.months}
                  />

                  {program.attention > 0 ? (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        font: '600 11px var(--font-body)',
                        color: 'var(--st-progress)',
                      }}
                    >
                      <TriangleAlert size={12} strokeWidth={2.2} aria-hidden />
                      <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
                        {[
                          program.noEvidence > 0
                            ? `${program.noEvidence} selesai tanpa lampiran`
                            : null,
                          program.incomplete > 0
                            ? `${program.incomplete} data belum lengkap`
                            : null,
                          program.mismatch > 0 ? `${program.mismatch} di luar jadwal` : null,
                          program.undated > 0 ? `${program.undated} tanpa tahun` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                  ) : null}

                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      paddingTop: 10,
                      borderTop: '1px solid var(--border-subtle)',
                      font: '400 11px var(--font-body)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>
                      {lastRecorded(year, undefined, program.id, monthRange.months)
                        ? `Terakhir ${lastRecorded(year, undefined, program.id, monthRange.months)}`
                        : 'Belum ada pelaksanaan tercatat'}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        font: '600 12px var(--font-body)',
                        color: 'var(--domain-accent)',
                      }}
                    >
                      Rincian
                      <span aria-hidden className="cta-arrow">
                        ›
                      </span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Counter({ value, color }: { value: number; color: string }) {
  const displayed = useCountUp(value);
  return (
    <span
      style={{
        font: '700 28px var(--font-display)',
        letterSpacing: '-0.03em',
        fontVariantNumeric: 'tabular-nums',
        color: value > 0 ? color : 'var(--text-lightest)',
      }}
    >
      {displayed}
    </span>
  );
}
