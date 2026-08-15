export interface ChartPoint {
  x: number;
  y: number;
}

export function scaleSeries(values: number[], width: number, height: number, padding = 12): ChartPoint[] {
  if (values.length === 0) {
    return [];
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  return values.map((value, index) => {
    const normalizedX = values.length === 1 ? 0.5 : index / (values.length - 1);
    const normalizedY = max === min ? 0.5 : (value - min) / (max - min);
    return {
      x: padding + normalizedX * usableWidth,
      y: padding + (1 - normalizedY) * usableHeight
    };
  });
}

export function buildLinePath(points: ChartPoint[]): string {
  if (!points.length) {
    return "";
  }
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
}

export function buildAreaPath(points: ChartPoint[], height: number): string {
  if (!points.length) {
    return "";
  }
  const start = points[0];
  const end = points[points.length - 1];
  return `${buildLinePath(points)} L ${end.x.toFixed(1)} ${height} L ${start.x.toFixed(1)} ${height} Z`;
}

export function barWidth(totalWidth: number, count: number, padding = 12): number {
  if (count <= 0) {
    return 0;
  }
  return (totalWidth - padding * 2) / count;
}
