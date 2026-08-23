/**
 * SVG Chart Utility
 *
 * Provides trigonometric geometry calculations, SVG path generation,
 * and coordinate normalizers for universal cross-platform charts.
 */

export interface SvgPieSlice {
  id: string;
  label: string;
  valueInCents: number;
  percentage: number;
  color: string;
  pathData: string;
  startAngle: number;
  endAngle: number;
  midAngle: number;
}

export const CATEGORY_PALETTE: readonly string[] = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#64748b', // Slate
];

/**
 * Converts polar coordinates (radius, angleInDegrees) to cartesian coordinates (x, y).
 * 0° starts at 12 o'clock (top center).
 */
export function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: Number((centerX + radius * Math.cos(angleInRadians)).toFixed(4)),
    y: Number((centerY + radius * Math.sin(angleInRadians)).toFixed(4)),
  };
}

/**
 * Generates an SVG path string for a donut slice (annulus segment).
 */
export function createDonutSlicePath(
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  if (endAngle <= startAngle) {
    return '';
  }

  // Prevent complete overlap / 0-length arc collapse on full 360 degree slice
  const safeEndAngle = endAngle - startAngle >= 360 ? startAngle + 359.999 : endAngle;

  const outerStart = polarToCartesian(centerX, centerY, outerRadius, startAngle);
  const outerEnd = polarToCartesian(centerX, centerY, outerRadius, safeEndAngle);
  const innerStart = polarToCartesian(centerX, centerY, innerRadius, safeEndAngle);
  const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle);

  const largeArcFlag = safeEndAngle - startAngle > 180 ? '1' : '0';

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

/**
 * Generates an array of prepared SVG slice paths from categorized totals.
 */
export function generateDonutSlices(
  items: Array<{ id: string; label: string; valueInCents: number; color?: string }>,
  size: number = 200,
  strokeWidth: number = 32
): SvgPieSlice[] {
  const totalInCents = items.reduce((sum, i) => sum + Math.max(0, i.valueInCents), 0);
  if (totalInCents <= 0 || items.length === 0) {
    return [];
  }

  const validItems = items.filter((item) => item.valueInCents > 0);
  if (validItems.length === 0) {
    return [];
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size / 2 - 4; // Padding for selection stroke
  const innerRadius = Math.max(0, outerRadius - strokeWidth);

  let currentAngle = 0;

  return validItems.map((item, index) => {
    const sliceAngle = (item.valueInCents / totalInCents) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;
    currentAngle += sliceAngle;

    const pathData = createDonutSlicePath(
      centerX,
      centerY,
      outerRadius,
      innerRadius,
      startAngle,
      endAngle
    );

    const percentage = Math.round((item.valueInCents / totalInCents) * 1000) / 10;
    const color = item.color ?? CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];

    return {
      id: item.id,
      label: item.label,
      valueInCents: item.valueInCents,
      percentage,
      color,
      pathData,
      startAngle,
      endAngle,
      midAngle,
    };
  });
}

/**
 * Computes rounded upper bound maxVal and grid tick intervals for scaling bar charts.
 */
export function normalizeBarScale(
  values: number[],
  targetHeight: number
): { maxVal: number; scaleFactor: number; gridTicks: number[] } {
  const rawMax = Math.max(...values.map((v) => Math.max(0, v)), 0);

  if (rawMax <= 0) {
    const defaultMax = 10000; // $100.00 default scale in cents
    return {
      maxVal: defaultMax,
      scaleFactor: targetHeight > 0 ? targetHeight / defaultMax : 0,
      gridTicks: [0, defaultMax * 0.5, defaultMax],
    };
  }

  // Calculate nice round number for max value
  const magnitude = 10 ** Math.floor(Math.log10(rawMax));
  const norm = rawMax / magnitude;
  let niceFactor = 10;
  if (norm <= 1) niceFactor = 1;
  else if (norm <= 2) niceFactor = 2;
  else if (norm <= 2.5) niceFactor = 2.5;
  else if (norm <= 5) niceFactor = 5;
  else niceFactor = 10;

  let maxVal = Math.ceil(norm / (niceFactor / 2)) * (niceFactor / 2) * magnitude;
  if (maxVal < rawMax) {
    maxVal = niceFactor * magnitude;
  }
  if (maxVal <= 0) {
    maxVal = 10000;
  }

  const scaleFactor = targetHeight > 0 && maxVal > 0 ? targetHeight / maxVal : 0;
  const gridTicks = [0, Math.round(maxVal * 0.5), maxVal];

  return {
    maxVal,
    scaleFactor,
    gridTicks,
  };
}
