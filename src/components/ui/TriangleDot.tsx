/* eslint-disable @typescript-eslint/no-explicit-any */
// Marker segitiga (arrow) standar untuk garis putus-putus:
// isi putih + ring warna garis, arah panah mengikuti kemiringan garis
export default function TriangleDot(props: any) {
  const { cx, cy, value, color = "#f59e0b", size = 4.5, index, points } = props;
  if (value == null || cx == null || cy == null) return null;

  // Hitung arah dari tetangga titik (sebelum -> sesudah); fallback horizontal
  let angle = 0;
  if (Array.isArray(points) && points.length > 1 && typeof index === "number") {
    const prev = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    if (
      prev &&
      next &&
      typeof prev.x === "number" &&
      typeof prev.y === "number" &&
      typeof next.x === "number" &&
      typeof next.y === "number" &&
      next.x !== prev.x
    ) {
      angle = (Math.atan2(next.y - prev.y, next.x - prev.x) * 180) / Math.PI;
    }
  }

  return (
    <polygon
      points={`${cx + size},${cy} ${cx - size * 0.8},${cy - size} ${cx - size * 0.8},${cy + size}`}
      transform={angle ? `rotate(${angle} ${cx} ${cy})` : undefined}
      fill="#ffffff"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
      style={{ pointerEvents: "none" }}
    />
  );
}
