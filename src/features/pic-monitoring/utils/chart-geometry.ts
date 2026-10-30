export interface ChartSegment {
  value: number;
  color: string;
  label?: string;
}

export interface PieSegmentGeometry extends ChartSegment {
  path: string;
}

export function getPieSegmentGeometry(
  segments: readonly ChartSegment[],
  size: number,
): PieSegmentGeometry[] {
  const radius = size / 2 - 4;
  const center = size / 2;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let angle = -Math.PI / 2;

  if (total <= 0) return [];

  return segments.flatMap((segment) => {
    if (segment.value === 0) return [];

    const nextAngle = angle + (segment.value / total) * Math.PI * 2;
    const start = {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
    const end = {
      x: center + radius * Math.cos(nextAngle),
      y: center + radius * Math.sin(nextAngle),
    };
    const largeArc = nextAngle - angle > Math.PI ? 1 : 0;
    const path = `M${center},${center} L${start.x.toFixed(1)},${start.y.toFixed(1)} A${radius},${radius} 0 ${largeArc} 1 ${end.x.toFixed(1)},${end.y.toFixed(1)} Z`;
    angle = nextAngle;

    return [{ ...segment, path }];
  });
}
