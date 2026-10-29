"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useXAxisScale, useYAxisScale, usePlotArea } from "recharts";

export interface SinglePointSeries {
  dataKey: string;
  color: string;
  /** Gambar arsir wedge gradient dari titik ke kanan-bawah (untuk seri area). */
  fill?: boolean;
  format?: (value: number) => string;
}

interface SinglePointOverlayProps {
  data: any[];
  xKey: string;
  series: SinglePointSeries[];
}

// Overlay standar untuk chart yang hanya punya SATU titik data (mis. filter
// satu bulan): recharts tidak menggambar area fill dari 1 titik, jadi arsir
// wedge + pill label nilai digambar manual di atas plot.
export default function SinglePointOverlay({
  data,
  xKey,
  series,
}: SinglePointOverlayProps) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const plot = usePlotArea();
  if (!xScale || !yScale || !plot || !Array.isArray(data)) return null;

  const plotRight = plot.x + plot.width;
  const plotBottom = plot.y + plot.height;

  const marks = series.flatMap((s) => {
    const rows = data.filter((row) => typeof row?.[s.dataKey] === "number");
    if (rows.length !== 1) return [];
    const row = rows[0];
    const value = row[s.dataKey] as number;
    const cx = xScale(row[xKey], { position: "middle" });
    const cy = yScale(value);
    if (cx == null || cy == null) return [];
    return [{ ...s, value, cx, cy }];
  });

  if (!marks.length) return null;

  // Pill diletakkan di atas marker; geser ke atas jika dua seri bertumpuk.
  const sorted = [...marks].sort((a, b) => a.cy - b.cy);
  const labelY = new Map<string, number>();
  let occupied = Infinity;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const m = sorted[i];
    let ly = m.cy - 13;
    if (occupied - ly < 17) ly = occupied - 17;
    labelY.set(m.dataKey, ly);
    occupied = ly;
  }

  // Jika pill keluar dari tepi atas plot (nilai di puncak, mis. 100%),
  // pindahkan ke bawah marker; stack ke bawah bila lebih dari satu.
  const minLy = plot.y + 9;
  let occupiedBelow = -Infinity;
  for (const m of sorted) {
    const ly = labelY.get(m.dataKey) ?? m.cy - 13;
    if (ly < minLy) {
      const flipped = Math.max(m.cy + 21, occupiedBelow + 17);
      labelY.set(m.dataKey, flipped);
      occupiedBelow = flipped;
    }
  }

  return (
    <g>
      <defs>
        {marks
          .filter((m) => m.fill)
          .map((m) => (
            <linearGradient
              key={m.dataKey}
              id={`spov-${m.color.slice(1)}`}
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor={m.color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={m.color} stopOpacity={0} />
            </linearGradient>
          ))}
      </defs>
      {marks
        .filter((m) => m.fill)
        .map((m) => (
          <path
            key={`w-${m.dataKey}`}
            d={`M${m.cx},${m.cy} L${plotRight},${plotBottom} L${m.cx},${plotBottom} Z`}
            fill={`url(#spov-${m.color.slice(1)})`}
            style={{ pointerEvents: "none" }}
          />
        ))}
      {marks.map((m) => {
        const text = m.format ? m.format(m.value) : String(m.value);
        const w = Math.max(26, text.length * 6.5 + 12);
        const ly = labelY.get(m.dataKey) ?? m.cy - 13;
        return (
          <g key={`l-${m.dataKey}`} style={{ pointerEvents: "none" }}>
            <rect
              x={m.cx - w / 2}
              y={ly - 8}
              width={w}
              height={15}
              rx={4}
              fill={m.color}
              fillOpacity={0.12}
            />
            <text
              x={m.cx}
              y={ly + 3.5}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              fill={m.color}
            >
              {text}
            </text>
          </g>
        );
      })}
    </g>
  );
}
