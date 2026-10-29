import { PieChart } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useFilters } from "@/context/HelpdeskFilterContext";
import { useQuarterFilter } from "@/features/helpdesk/comparison/hooks/useQuarterFilter";
import { fetchRootCauseHierarchy } from "../../actions";
import EmptyState from "@/components/shared/EmptyState";
import { FloatingTip } from "@/components/chart-tooltip";

type LeafItem = {
  name: string;
  value: number;
};

type DivisionItem = {
  name: string;
  value: number;
  details: LeafItem[];
};

type CauseItem = {
  rank: number;
  name: string;
  value: number;
  color: string;
  divisions: DivisionItem[];
};

type TooltipState = {
  x: number;
  y: number;
  name: string;
  value: number;
  color: string;
} | null;

function formatNumber(value: number) {
  return value.toLocaleString("id-ID");
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
) {
  const angleRad = ((angle - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function arcPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const startOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const endOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, startAngle);
  const endInner = polarToCartesian(cx, cy, innerRadius, endAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

function mixWithWhite(hex: string, amount: number) {
  const clean = hex.replace("#", "");

  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  const mixedR = Math.round(r + (255 - r) * amount);
  const mixedG = Math.round(g + (255 - g) * amount);
  const mixedB = Math.round(b + (255 - b) * amount);

  return `rgb(${mixedR}, ${mixedG}, ${mixedB})`;
}

function getTextPosition(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const midAngle = (startAngle + endAngle) / 2;
  const radius = (innerRadius + outerRadius) / 2;

  return polarToCartesian(cx, cy, radius, midAngle);
}

function shortLabel(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

function buildSegments(data: CauseItem[]) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  let currentAngle = 0;

  const rootSegments: {
    cause: CauseItem;
    startAngle: number;
    endAngle: number;
  }[] = [];

  const divisionSegments: {
    cause: CauseItem;
    division: DivisionItem;
    startAngle: number;
    endAngle: number;
  }[] = [];

  const detailSegments: {
    cause: CauseItem;
    detail: LeafItem;
    startAngle: number;
    endAngle: number;
  }[] = [];

  data.forEach((cause, causeIndex) => {
    const causeAngle = (cause.value / total) * 360;
    const causeStart = currentAngle;
    const causeEnd = causeStart + causeAngle;

    rootSegments.push({
      cause,
      startAngle: causeStart,
      endAngle: causeEnd,
    });

    let divisionCurrentAngle = causeStart;

    cause.divisions.forEach((division) => {
      const divisionAngle = (division.value / cause.value) * causeAngle;
      const divisionStart = divisionCurrentAngle;
      const divisionEnd = divisionStart + divisionAngle;

      divisionSegments.push({
        cause,
        division,
        startAngle: divisionStart,
        endAngle: divisionEnd,
      });

      let detailCurrentAngle = divisionStart;

      division.details.forEach((detail) => {
        const detailAngle = (detail.value / division.value) * divisionAngle;
        const detailStart = detailCurrentAngle;
        const detailEnd = detailStart + detailAngle;

        detailSegments.push({
          cause,
          detail,
          startAngle: detailStart,
          endAngle: detailEnd,
        });

        detailCurrentAngle = detailEnd;
      });

      divisionCurrentAngle = divisionEnd;
    });

    currentAngle = causeEnd;

    if (causeIndex === data.length - 1) {
      currentAngle = 360;
    }
  });

  return {
    total,
    rootSegments,
    divisionSegments,
    detailSegments,
  };
}

function SunburstChart({
  title,
  data,
  size = 520,
}: {
  title: string;
  data: CauseItem[];
  size?: number;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const { total, rootSegments, divisionSegments, detailSegments } = useMemo(
    () => buildSegments(data),
    [data],
  );

  const cx = size / 2;
  const cy = size / 2;

  const rootInner = 78;
  const rootOuter = 145;
  const divisionInner = 145;
  const divisionOuter = 205;
  const detailInner = 205;
  const detailOuter = 260;

  return (
    <div
      className="relative flex min-w-0 w-full flex-col items-center overflow-hidden"
      onMouseLeave={() => setTooltip(null)}
    >
      <div className="mb-4 text-sm font-black uppercase text-slate-500">
        {title}
      </div>

      <svg
        className="block h-auto w-full"
        style={{ maxWidth: size }}
        viewBox={`0 0 ${size} ${size}`}
      >
        {rootSegments.map((segment) => {
          const labelPosition = getTextPosition(
            cx,
            cy,
            rootInner,
            rootOuter,
            segment.startAngle,
            segment.endAngle,
          );

          return (
            <g key={`root-${segment.cause.name}`}>
              <path
                d={arcPath(
                  cx,
                  cy,
                  rootInner,
                  rootOuter,
                  segment.startAngle,
                  segment.endAngle,
                )}
                fill={segment.cause.color}
                stroke="#FFFFFF"
                strokeWidth={2}
                onMouseMove={(event) =>
                  setTooltip({
                    x: event.clientX,
                    y: event.clientY,
                    name: segment.cause.name,
                    value: segment.cause.value,
                    color: segment.cause.color,
                  })
                }
              />

              {segment.endAngle - segment.startAngle > 24 && (
                <text
                  x={labelPosition.x}
                  y={labelPosition.y - 8}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none fill-white text-[13px] font-black"
                >
                  #{segment.cause.rank}
                </text>
              )}

              {segment.endAngle - segment.startAngle > 36 && (
                <text
                  x={labelPosition.x}
                  y={labelPosition.y + 8}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none fill-white text-[12px] font-black"
                >
                  {shortLabel(segment.cause.name, 12)}
                </text>
              )}

              {segment.endAngle - segment.startAngle > 42 && (
                <text
                  x={labelPosition.x}
                  y={labelPosition.y + 24}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none fill-white text-[14px] font-black"
                >
                  {formatNumber(segment.cause.value)}
                </text>
              )}
            </g>
          );
        })}

        {divisionSegments.map((segment) => {
          const labelPosition = getTextPosition(
            cx,
            cy,
            divisionInner,
            divisionOuter,
            segment.startAngle,
            segment.endAngle,
          );

          return (
            <g key={`division-${segment.cause.name}-${segment.division.name}`}>
              <path
                d={arcPath(
                  cx,
                  cy,
                  divisionInner,
                  divisionOuter,
                  segment.startAngle,
                  segment.endAngle,
                )}
                fill={mixWithWhite(segment.cause.color, 0.18)}
                stroke="#FFFFFF"
                strokeWidth={2}
                onMouseMove={(event) =>
                  setTooltip({
                    x: event.clientX,
                    y: event.clientY,
                    name: segment.division.name,
                    value: segment.division.value,
                    color: segment.cause.color,
                  })
                }
              />

              {segment.endAngle - segment.startAngle > 14 && (
                <text
                  x={labelPosition.x}
                  y={labelPosition.y - 6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none fill-white text-[10px] font-black"
                >
                  {shortLabel(segment.division.name, 10)}
                </text>
              )}

              {segment.endAngle - segment.startAngle > 20 && (
                <text
                  x={labelPosition.x}
                  y={labelPosition.y + 8}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none fill-white text-[11px] font-black"
                >
                  {formatNumber(segment.division.value)}
                </text>
              )}
            </g>
          );
        })}

        {detailSegments.map((segment) => {
          const labelPosition = getTextPosition(
            cx,
            cy,
            detailInner,
            detailOuter,
            segment.startAngle,
            segment.endAngle,
          );

          return (
            <g
              key={`detail-${segment.cause.name}-${segment.detail.name}-${segment.startAngle}`}
            >
              <path
                d={arcPath(
                  cx,
                  cy,
                  detailInner,
                  detailOuter,
                  segment.startAngle,
                  segment.endAngle,
                )}
                fill={mixWithWhite(segment.cause.color, 0.48)}
                stroke="#FFFFFF"
                strokeWidth={2}
                onMouseMove={(event) =>
                  setTooltip({
                    x: event.clientX,
                    y: event.clientY,
                    name: segment.detail.name,
                    value: segment.detail.value,
                    color: segment.cause.color,
                  })
                }
              />

              {segment.endAngle - segment.startAngle > 7 && (
                <text
                  x={labelPosition.x}
                  y={labelPosition.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none fill-slate-800 text-[8px] font-bold"
                >
                  {shortLabel(segment.detail.name, 9)}
                </text>
              )}
            </g>
          );
        })}

        <circle
          cx={cx}
          cy={cy}
          r={68}
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth={2}
        />

        <text
          x={cx}
          y={cy - 18}
          textAnchor="middle"
          className="fill-slate-400 text-[13px] font-black"
        >
          TOTAL
        </text>

        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          className="fill-slate-950 text-[34px] font-black"
        >
          {formatNumber(total)}
        </text>
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-5">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-3.5 w-3.5 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-bold text-slate-950">
              #{item.rank} {item.name}
            </span>
            <span className="font-medium text-slate-500">
              {formatNumber(item.value)}
            </span>
          </div>
        ))}
      </div>

      {tooltip && (
        <FloatingTip
          x={tooltip.x}
          y={tooltip.y}
          title={tooltip.name}
          rows={[
            {
              color: tooltip.color,
              label: "Tickets",
              value: formatNumber(tooltip.value),
            },
          ]}
        />
      )}
    </div>
  );
}

function HierarchyProblemChartSkeleton() {
  return (
    <div
      className="flex h-80 flex-col items-center justify-center animate-pulse"
      aria-label="Memuat grafik hierarki"
    >
      <div className="relative h-56 w-56 rounded-full bg-slate-100 dark:bg-zinc-800">
        <div className="absolute inset-8 rounded-full bg-slate-200 dark:bg-zinc-700" />
        <div className="absolute inset-16 rounded-full bg-white dark:bg-zinc-900" />
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rotate-45 bg-white dark:bg-zinc-900" />
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 -rotate-45 bg-white dark:bg-zinc-900" />
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-5">
        {["w-20", "w-24", "w-16"].map((widthClass, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded bg-slate-200 dark:bg-zinc-800" />
            <div
              className={`h-3 rounded bg-slate-200 dark:bg-zinc-800 ${widthClass}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HierarchyProblemChart() {
  const { year, month, dept } = useFilters();
  const { quarter } = useQuarterFilter();
  const [data, setData] = useState<CauseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const result = await fetchRootCauseHierarchy({
          year,
          month,
          dept,
          quarter,
        });
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        console.error("Gagal memuat hierarki sunburst:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [year, month, dept, quarter]);

  const top3Data = useMemo(() => data.slice(0, 3), [data]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-zinc-50">
            Problem Hierarchy
          </h2>
          <p className="mt-1 text-sm text-slate-400 dark:text-zinc-500">
            Hierarki Top 3 penyebab masalah utama berdasarkan volume tiket
          </p>
        </div>
      </div>

      {loading ? (
        <HierarchyProblemChartSkeleton />
      ) : top3Data.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="Data Hierarki Masalah Tidak Tersedia"
          description="Tidak ada data hierarki masalah untuk filter terpilih"
        />
      ) : (
        <div className="flex w-full justify-center">
          <SunburstChart title="TOP 1-3" data={top3Data} size={540} />
        </div>
      )}
    </section>
  );
}
