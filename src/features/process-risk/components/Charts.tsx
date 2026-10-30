'use client';

import Link from 'next/link';
import { STATUSES, STATUS_ORDER } from '../utils/constants';
import { statusGlyph, useTip } from './Primitives';
import {
  MONTHS_ID,
  MONTHS_ID_LONG,
  deriveStatus,
  isMissingEvidence,
  toIndonesianDate,
} from '../utils/selectors';
import type { ScheduleDeviation, StatusId } from '../types';
import { useCountUp } from '../hooks/useCountUp';

/* ------------------------------------------------------------------ donut */

const DONUT_SIZE = 128;
const ARC = 16;
const SEG_GAP = 3;

export function CompositionDonut({
  composition,
  total,
  unitLabel,
  programName,
  size = DONUT_SIZE,
}: {
  composition: Record<StatusId, number>;
  total: number;
  unitLabel: string;
  programName: string;
  size?: number;
}) {
  const arc = Math.round(ARC * (size / DONUT_SIZE));
  const r = (size - arc) / 2;
  const c = 2 * Math.PI * r;
  const animatedComposition: Record<StatusId, number> = {
    done: useCountUp(composition.done),
    recorded: useCountUp(composition.recorded),
    progress: useCountUp(composition.progress),
    notyet: useCountUp(composition.notyet),
    blank: useCountUp(composition.blank),
  };
  const animatedTotal = useCountUp(total);
  const geometryTotal = Math.max(
    1,
    STATUS_ORDER.reduce((sum, id) => sum + animatedComposition[id], 0),
  );

  const segments = STATUS_ORDER.reduce<{ id: StatusId; length: number; offset: number }[]>(
    (acc, id) => {
      const n = animatedComposition[id];
      if (!n || total === 0) return acc;
      const previous = acc[acc.length - 1];
      const offset = previous ? previous.offset + previous.length : 0;
      return [...acc, { id, length: (n / geometryTotal) * c, offset }];
    },
    [],
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Komposisi ${programName}: ${STATUS_ORDER.map((s) => `${STATUSES[s].label} ${composition[s]}`).join(', ')}`}
    >
      {segments.length === 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--chart-gray-track, #EEF1F6)"
          strokeWidth={arc}
        />
      )}
      {segments.map(({ id, length, offset }) => (
        <DonutSegment
          key={id}
          id={id}
          count={animatedComposition[id]}
          total={total}
          programName={programName}
          size={size}
          arc={arc}
          radius={r}
          circumference={c}
          length={length}
          offset={offset}
        />
      ))}
      <text
        x="50%"
        y="48%"
        textAnchor="middle"
        style={{
          font: `700 ${Math.round(size * 0.23)}px var(--font-display)`,
          fill: 'var(--text-primary)',
        }}
      >
        {animatedTotal}
      </text>
      <text
        x="50%"
        y="63%"
        textAnchor="middle"
        style={{
          font: `600 ${Math.max(9, Math.round(size * 0.078))}px var(--font-body)`,
          fill: 'var(--text-muted)',
          letterSpacing: '0.06em',
        }}
      >
        {unitLabel}
      </text>
    </svg>
  );
}

function DonutSegment({
  id,
  count,
  total,
  programName,
  size,
  arc,
  radius,
  circumference,
  length,
  offset,
}: {
  id: StatusId;
  count: number;
  total: number;
  programName: string;
  size: number;
  arc: number;
  radius: number;
  circumference: number;
  length: number;
  offset: number;
}) {
  const tip = useTip<SVGCircleElement>({
    title: `${STATUSES[id].label} — ${count} dokumen`,
    lines: [programName, `${Math.round((count / total) * 100)}% dari ${total} dokumen`],
    footer: id === 'blank' ? 'Belum ada data pelaksanaan.' : undefined,
  });

  const dashLen = Math.max(length - SEG_GAP, 0.5);

  return (
    <circle
      {...tip}
      cx={size / 2}
      cy={size / 2}
      r={radius}
      fill="none"
      stroke={id === 'blank' ? 'var(--chart-gray-track, #EEF1F6)' : STATUSES[id].color}
      strokeWidth={arc}
      strokeDasharray={`${dashLen} ${circumference - dashLen}`}
      strokeDashoffset={-offset}
      transform={`rotate(-90 ${size / 2} ${size / 2})`}
      style={{
        cursor: 'default',
        outline: 'none',
        transition: 'stroke-dasharray 500ms ease-out, stroke-dashoffset 500ms ease-out',
      }}
    />
  );
}

/* -------------------------------------------------- monthly column chart */

const COLUMN_HEIGHT = 132;

export function MonthlyColumns({
  current,
  previous,
  currentYear,
  previousYear,
  highlightMonth,
  accent,
  deviationsByMonth,
}: {
  current: number[];
  previous: number[] | null;
  currentYear: number;
  previousYear: number | null;
  highlightMonth: number[];
  accent: string;
  deviationsByMonth?: ScheduleDeviation[][];
}) {
  const max = Math.max(1, ...current, ...(previous ?? []));

  return (
    <div className="chart-scroll" tabIndex={0} aria-label="Grafik jadwal bulanan">
      <div className="monthly-columns" style={{ display: 'grid', gap: 8 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
            alignItems: 'end',
            gap: 6,
            height: COLUMN_HEIGHT,
            padding: '0 2px',
            borderBottom: '1px solid var(--border-divider)',
          }}
        >
          {MONTHS_ID.map((month, i) => (
            <MonthColumn
              key={month}
              monthIndex={i}
              current={current[i] ?? 0}
              previous={previous ? (previous[i] ?? 0) : null}
              currentYear={currentYear}
              previousYear={previousYear}
              max={max}
              highlighted={highlightMonth.includes(i + 1)}
              accent={accent}
              deviations={deviationsByMonth?.[i] ?? []}
            />
          ))}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
            gap: 6,
            padding: '0 2px',
          }}
        >
          {MONTHS_ID.map((month, i) => (
            <span
              key={month}
              style={{
                textAlign: 'center',
                padding: '2px 0',
                borderRadius: 5,
                background: highlightMonth.includes(i + 1) ? 'var(--track)' : 'transparent',
                font: `${highlightMonth.includes(i + 1) ? '700' : '400'} 10.5px var(--font-body)`,
                color: highlightMonth.includes(i + 1)
                  ? 'var(--text-secondary)'
                  : 'var(--text-muted)',
              }}
            >
              {month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthColumn({
  monthIndex,
  current,
  previous,
  currentYear,
  previousYear,
  max,
  highlighted,
  accent,
  deviations,
}: {
  monthIndex: number;
  current: number;
  previous: number | null;
  currentYear: number;
  previousYear: number | null;
  max: number;
  highlighted: boolean;
  accent: string;
  deviations: ScheduleDeviation[];
}) {
  const animated = useCountUp(current);
  const animatedPrevious = useCountUp(previous ?? 0);
  const monthName = MONTHS_ID_LONG[monthIndex];
  const deviationLines = deviations.flatMap((deviation) => {
    if (deviation.kind === 'unknown') return ['Di luar periode: bulan pelaksanaan tidak tercatat'];
    const execMonth = (deviation as unknown as { executionMonth?: number }).executionMonth;
    const executionName = execMonth ? MONTHS_ID_LONG[execMonth - 1] : '';
    const direction = deviation.kind === 'early' ? 'lebih awal' : 'lebih lambat';
    const sign = deviation.kind === 'early' ? '-' : '+';
    const monthDiff = deviation.monthsDelta ?? (deviation as unknown as { monthDifference?: number }).monthDifference ?? 0;
    return [
      `1 ${direction}: dilaksanakan ${executionName} (${sign}${monthDiff} bulan)`,
    ];
  });
  const tip = useTip({
    title: `${monthName} ${currentYear}`,
    lines: [
      `${current} dokumen`,
      previous === null || previousYear === null
        ? 'Tidak ada tahun pembanding'
        : `${previousYear}: ${previous} dokumen`,
      ...deviationLines,
    ],
    footer:
      deviations.length > 0
        ? `${monthName} adalah bulan rencana. Selisih dihitung pada tingkat bulan.`
        : 'Dikelompokkan menurut Periode Test, bukan tanggal pelaksanaan.',
  });

  const barHeight = (value: number) =>
    max === 0 ? 0 : Math.max((value / max) * (COLUMN_HEIGHT - 18), value > 0 ? 4 : 0);

  return (
    <span
      {...tip}
      style={{
        display: 'grid',
        justifyItems: 'center',
        alignContent: 'end',
        gap: 3,
        height: '100%',
        borderRadius: '6px 6px 0 0',
        background: highlighted ? 'var(--bg-strip)' : 'transparent',
        outline: 'none',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'flex-end', gap: 2, width: '100%' }}>
        <span
          style={{
            flex: 1,
            display: 'grid',
            justifyItems: 'center',
            alignContent: 'end',
            gap: 3,
          }}
        >
          <span
            style={{
              font: '700 11px var(--font-display)',
              fontVariantNumeric: 'tabular-nums',
              color: current > 0 ? 'var(--text-primary)' : 'var(--text-lightest)',
            }}
          >
            {animated}
          </span>
          <span
            style={{
              width: '100%',
              height: current === 0 ? 4 : barHeight(current),
              minHeight: 4,
              borderRadius: '5px 5px 0 0',
              background: current === 0 ? 'var(--chart-gray-track, #EEF1F6)' : accent,
              boxShadow:
                current === 0
                  ? undefined
                  : `0 4px 10px -4px color-mix(in srgb, ${accent} 45%, transparent)`,
              transition: 'height 500ms ease-out',
            }}
          />
        </span>
        {previous !== null ? (
          <span
            style={{
              flex: 1,
              display: 'grid',
              justifyItems: 'center',
              alignContent: 'end',
              gap: 3,
            }}
          >
            <span
              style={{
                font: '700 10px var(--font-display)',
                fontVariantNumeric: 'tabular-nums',
                color: previous > 0 ? 'var(--text-muted)' : 'var(--text-lightest)',
              }}
            >
              {animatedPrevious}
            </span>
            <span
              style={{
                width: '100%',
                height: Math.max(barHeight(previous), 4),
                minHeight: 4,
                borderRadius: '5px 5px 0 0',
                background:
                  previous === 0 ? 'var(--chart-gray-track, #EEF1F6)' : 'var(--year-2025)',
                opacity: previous === 0 ? 1 : 0.7,
                transition: 'height 500ms ease-out',
              }}
            />
          </span>
        ) : null}
      </span>
    </span>
  );
}

/* ----------------------------------------------------------- rank bars */

export interface RankItem {
  id: string;
  name: string;
  route: string;
  total: number;
  done: number;
  activities: number;
}

export function ProgramRankBars({ items, year }: { items: RankItem[]; year: number }) {
  const max = Math.max(1, ...items.map((item) => item.total));
  return (
    <div style={{ display: 'grid', gap: 9 }}>
      {items.map((item) => (
        <RankBar key={item.id} item={item} max={max} year={year} />
      ))}
    </div>
  );
}

function RankBar({ item, max, year }: { item: RankItem; max: number; year: number }) {
  const animated = useCountUp(item.total);
  const share = (item.total / max) * 100;
  const donePart = item.total === 0 ? 0 : (item.done / item.total) * 100;
  const tip = useTip({
    title: item.name,
    lines: [
      `${item.total} dokumen pada ${year}`,
      `${item.done} selesai · ${item.total - item.done} belum selesai`,
      `${item.activities} kegiatan di dalam program ini`,
    ],
    footer: 'Klik untuk membuka rincian program.',
  });

  return (
    <Link
      href={item.route}
      className="card-link"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        alignItems: 'center',
        gap: 10,
        textDecoration: 'none',
        color: 'inherit',
        borderRadius: 8,
        padding: '2px 4px',
      }}
    >
      <span {...tip} style={{ display: 'grid', gap: 4, minWidth: 0, outline: 'none' }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            font: '600 12px var(--font-body)',
            color: 'var(--text-secondary)',
            minWidth: 0,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.name}
          </span>
        </span>
        <span
          style={{
            display: 'block',
            height: 10,
            borderRadius: 999,
            overflow: 'hidden',
            background: 'var(--chart-gray-track, #EEF1F6)',
          }}
        >
          <span
            style={{
              display: 'block',
              height: '100%',
              width: `${share}%`,
              borderRadius: 999,
              background: 'color-mix(in srgb, var(--domain-accent) 22%, white)',
              transition: 'width 500ms ease-out',
            }}
          >
            <span
              style={{
                display: 'block',
                height: '100%',
                width: `${donePart}%`,
                borderRadius: 999,
                background: 'var(--domain-accent)',
                boxShadow: '0 1px 3px color-mix(in srgb, var(--domain-accent) 35%, transparent)',
                transition: 'width 500ms ease-out',
              }}
            />
          </span>
        </span>
      </span>
      <span
        style={{
          font: '700 13px var(--font-display)',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--text-primary)',
          minWidth: 22,
          textAlign: 'right',
        }}
      >
        {animated}
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------- heatmap */

export interface HeatRow {
  id: string;
  name: string;
  route: string;
  series: number[];
}

export function ProgramHeatmap({
  rows,
  year,
  highlightMonth,
}: {
  rows: HeatRow[];
  year: number;
  highlightMonth: number[];
}) {
  return (
    <div className="chart-scroll" tabIndex={0} aria-label="Sebaran dokumen per program">
      <div className="program-heatmap" style={{ display: 'grid', gap: 4, width: '100%' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(88px, 1.8fr) repeat(12, minmax(18px, 1fr))',
            gap: 3,
            alignItems: 'center',
          }}
        >
          <span />
          {MONTHS_ID.map((month, i) => (
            <span
              key={month}
              style={{
                textAlign: 'center',
                font: `${highlightMonth.includes(i + 1) ? '700' : '600'} 9.5px var(--font-body)`,
                color: highlightMonth.includes(i + 1)
                  ? 'var(--text-secondary)'
                  : 'var(--text-muted)',
              }}
            >
              {month}
            </span>
          ))}
        </div>
        {rows.map((row) => (
          <Link
            key={row.id}
            href={row.route}
            className="card-link"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(88px, 1.8fr) repeat(12, minmax(18px, 1fr))',
              gap: 3,
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              borderRadius: 6,
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                minWidth: 0,
                paddingRight: 6,
                font: '500 11.5px var(--font-body)',
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.name}
              </span>
            </span>
            {row.series.map((value, i) => (
              <HeatCell
                key={`${row.id}-${i}`}
                value={value}
                programName={row.name}
                monthIndex={i}
                year={year}
                highlighted={highlightMonth.includes(i + 1)}
              />
            ))}
          </Link>
        ))}
      </div>
    </div>
  );
}

function HeatCell({
  value,
  programName,
  monthIndex,
  year,
  highlighted,
}: {
  value: number;
  programName: string;
  monthIndex: number;
  year: number;
  highlighted: boolean;
}) {
  const tip = useTip({
    title: `${MONTHS_ID_LONG[monthIndex]} ${year}`,
    lines: [programName, `${value} dokumen`],
  });

  return (
    <span
      {...(value > 0 ? tip : {})}
      style={{
        height: 20,
        borderRadius: 5,
        display: 'grid',
        placeItems: 'center',
        background: value === 0 ? 'var(--chart-gray-track, #EEF1F6)' : 'var(--domain-accent)',
        boxShadow: highlighted ? 'inset 0 0 0 1.5px var(--st-recorded)' : undefined,
        font: '700 9.5px var(--font-body)',
        color: '#fff',
        outline: 'none',
        transition: 'background-color 300ms ease-out',
      }}
    >
      {value === 0 ? '' : value}
    </span>
  );
}

/* --------------------------------------------------------- paired bars */

export function PairedBars({
  currentYear,
  previousYear,
  current,
  previous,
  max,
  note,
}: {
  currentYear: number;
  previousYear: number | null;
  current: number;
  previous: number | null;
  max: number;
  note?: string;
}) {
  const scale = (v: number) => (max === 0 ? 0 : Math.max((v / max) * 100, v > 0 ? 3 : 0));
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <Bar year={currentYear} value={current} width={scale(current)} color="var(--st-done)" />
      {previousYear !== null && previous !== null ? (
        <Bar
          year={previousYear}
          value={previous}
          width={scale(previous)}
          color="var(--year-2025)"
        />
      ) : (
        <span style={{ font: '400 11px var(--font-body)', color: 'var(--text-muted)' }}>
          {note ?? 'Tidak ada data pembanding'}
        </span>
      )}
    </div>
  );
}

function Bar({
  year,
  value,
  width,
  color,
}: {
  year: number;
  value: number;
  width: number;
  color: string;
}) {
  const displayed = useCountUp(value);
  const animatedWidth = width * (value === 0 ? 0 : displayed / value);
  const tip = useTip({
    title: `${year} · ${value} selesai`,
    lines: [`Dokumen berstatus selesai sepanjang ${year}.`],
    footer: 'Jumlah dokumen tercatat, bukan penilaian kinerja.',
  });

  return (
    <span {...tip} style={{ display: 'flex', alignItems: 'center', gap: 8, outline: 'none' }}>
      <span
        style={{
          width: 32,
          font: '400 10px var(--font-body)',
          color: 'var(--text-muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {year}
      </span>
      <span
        style={{
          flex: 1,
          height: 14,
          borderRadius: 999,
          overflow: 'hidden',
          background: 'var(--chart-gray-track, #EEF1F6)',
        }}
      >
        <span
          style={{
            display: 'block',
            height: '100%',
            width: `${animatedWidth}%`,
            borderRadius: 999,
            background: color,
            boxShadow: `0 1px 3px color-mix(in srgb, ${color} 30%, transparent)`,
            transition: 'width 500ms ease-out',
          }}
        />
      </span>
      <span
        style={{
          width: 22,
          textAlign: 'right',
          font: '700 13px var(--font-display)',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--text-primary)',
        }}
      >
        {displayed}
      </span>
    </span>
  );
}

/* ---------------------------------------------------------- matrix tiles */

export function PeriodTile({
  entry,
  year,
  workplanName,
  remark,
  size = 'lg',
}: {
  entry: {
    label: string;
    value: string;
    docNo?: string;
    pic?: string;
    mismatch?: boolean;
    fileCount?: number;
  };
  year: number;
  workplanName: string;
  remark?: string;
  size?: 'lg' | 'sm';
}) {
  const status = deriveStatus(entry.value);
  const noEvidence = isMissingEvidence(entry);
  const lines = [
    `${entry.label} ${year}`,
    entry.value ? toIndonesianDate(entry.value) : 'Belum ada catatan',
  ];
  if (entry.docNo) lines.push(`No. dokumen: ${entry.docNo}`);
  if (entry.pic) lines.push(`PIC: ${entry.pic}`);
  if (noEvidence) lines.push('Berkas belum dilampirkan pada data sumber.');
  if (remark) lines.push(remark);

  const tip = useTip({
    title: workplanName,
    lines,
    footer: entry.mismatch
      ? 'Tanggal pelaksanaan di luar periode rencana.'
      : status === 'blank'
        ? 'Sel kosong bukan bukti terlambat atau gagal.'
        : undefined,
  });
  const isCurrent = size === 'lg';
  const background =
    status === 'blank'
      ? 'var(--chart-gray-track, #EEF1F6)'
      : isCurrent
        ? STATUSES[status].color
        : 'var(--year-2025)';

  return (
    <span
      {...tip}
      style={{
        position: 'relative',
        width: 24,
        height: isCurrent ? 24 : 16,
        borderRadius: 6,
        display: 'grid',
        placeItems: 'center',
        background,
        color: status === 'blank' ? 'transparent' : '#fff',
        fontSize: isCurrent ? 12 : 10,
        lineHeight: 1,
        boxShadow: entry.mismatch ? 'inset 0 0 0 1.5px var(--st-progress)' : undefined,
      }}
    >
      {status === 'blank' ? '' : statusGlyph(status)}
      {noEvidence && isCurrent ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            width: 9,
            height: 9,
            borderRadius: 999,
            background: 'var(--st-progress)',
            border: '1.5px solid #fff',
          }}
        />
      ) : null}
    </span>
  );
}

/* --------------------------------------------------------------- sparkline */

function SparkBar({
  value,
  monthIndex,
  color,
  height,
  opacity,
}: {
  value: number;
  monthIndex: number;
  color: string;
  height: number;
  opacity: number;
}) {
  const tip = useTip({
    title: MONTHS_ID_LONG[monthIndex] ?? '',
    lines: [`${value} dokumen`],
  });
  return (
    <span
      {...tip}
      style={{
        flex: 1,
        height,
        borderRadius: 3,
        background: value === 0 ? 'var(--chart-gray-track, #EEF1F6)' : color,
        opacity,
        transition: 'height 400ms ease-out',
        cursor: 'default',
        outline: 'none',
      }}
    />
  );
}

export function Sparkline({
  series,
  color,
  highlightMonth,
}: {
  series: number[];
  color: string;
  highlightMonth: number[];
}) {
  const max = Math.max(1, ...series);
  return (
    <span style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
      {series.map((value, i) => (
        <SparkBar
          key={i}
          value={value}
          monthIndex={i}
          color={color}
          height={value === 0 ? 4 : Math.max((value / max) * 32, 5)}
          opacity={highlightMonth.length === 0 || highlightMonth.includes(i + 1) ? 1 : 0.45}
        />
      ))}
    </span>
  );
}
