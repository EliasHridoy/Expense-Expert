import {
  polarToCartesian,
  createDonutSlicePath,
  generateDonutSlices,
  normalizeBarScale,
  CATEGORY_PALETTE,
} from '../../../src/features/dashboard/utils/svg-chart.util';

describe('svg-chart.util', () => {
  describe('polarToCartesian', () => {
    const cx = 100;
    const cy = 100;
    const r = 50;

    it('calculates 0° as top center (12 o clock)', () => {
      const point = polarToCartesian(cx, cy, r, 0);
      expect(point.x).toBeCloseTo(100, 1);
      expect(point.y).toBeCloseTo(50, 1);
    });

    it('calculates 90° as 3 o clock (right)', () => {
      const point = polarToCartesian(cx, cy, r, 90);
      expect(point.x).toBeCloseTo(150, 1);
      expect(point.y).toBeCloseTo(100, 1);
    });

    it('calculates 180° as 6 o clock (bottom)', () => {
      const point = polarToCartesian(cx, cy, r, 180);
      expect(point.x).toBeCloseTo(100, 1);
      expect(point.y).toBeCloseTo(150, 1);
    });

    it('calculates 270° as 9 o clock (left)', () => {
      const point = polarToCartesian(cx, cy, r, 270);
      expect(point.x).toBeCloseTo(50, 1);
      expect(point.y).toBeCloseTo(100, 1);
    });
  });

  describe('createDonutSlicePath', () => {
    it('returns empty string when endAngle <= startAngle', () => {
      expect(createDonutSlicePath(100, 100, 80, 50, 90, 90)).toBe('');
      expect(createDonutSlicePath(100, 100, 80, 50, 120, 90)).toBe('');
    });

    it('generates a valid SVG path for a 90 degree slice', () => {
      const path = createDonutSlicePath(100, 100, 80, 50, 0, 90);
      expect(path).toContain('M ');
      expect(path).toContain('A 80 80 0 0 1');
      expect(path).toContain('L ');
      expect(path).toContain('A 50 50 0 0 0');
      expect(path.endsWith('Z')).toBe(true);
    });

    it('sets largeArcFlag to 1 for slices > 180 degrees', () => {
      const path = createDonutSlicePath(100, 100, 80, 50, 0, 270);
      expect(path).toContain('A 80 80 0 1 1');
    });

    it('handles 360 degree full donut without 0-length arc collapse', () => {
      const path = createDonutSlicePath(100, 100, 80, 50, 0, 360);
      expect(path).toBeTruthy();
      expect(path).toContain('A 80 80 0 1 1');
    });
  });

  describe('generateDonutSlices', () => {
    it('returns empty array when items array is empty', () => {
      const slices = generateDonutSlices([]);
      expect(slices).toEqual([]);
    });

    it('returns empty array when totalInCents is zero or negative', () => {
      const slices = generateDonutSlices([
        { id: '1', label: 'Zero', valueInCents: 0, color: '#ff0000' },
      ]);
      expect(slices).toEqual([]);
    });

    it('handles 100% single slice correctly with 360 degree arc clamp', () => {
      const items = [{ id: 'groceries', label: 'Groceries', valueInCents: 50000 }];
      const slices = generateDonutSlices(items, 200, 32);

      expect(slices).toHaveLength(1);
      expect(slices[0].id).toBe('groceries');
      expect(slices[0].label).toBe('Groceries');
      expect(slices[0].percentage).toBe(100);
      expect(slices[0].startAngle).toBe(0);
      expect(slices[0].endAngle).toBe(360);
      expect(slices[0].midAngle).toBe(180);
      expect(slices[0].color).toBe(CATEGORY_PALETTE[0]);
      expect(slices[0].pathData).toContain('M ');
      expect(slices[0].pathData.endsWith('Z')).toBe(true);
    });

    it('computes proportional slices and percentages for multiple items', () => {
      const items = [
        { id: 'groceries', label: 'Groceries', valueInCents: 5000 },
        { id: 'utilities', label: 'Utilities', valueInCents: 2500 },
        { id: 'dining', label: 'Dining', valueInCents: 2500 },
      ];

      const slices = generateDonutSlices(items, 200, 32);

      expect(slices).toHaveLength(3);
      expect(slices[0].percentage).toBe(50);
      expect(slices[0].startAngle).toBe(0);
      expect(slices[0].endAngle).toBe(180);

      expect(slices[1].percentage).toBe(25);
      expect(slices[1].startAngle).toBe(180);
      expect(slices[1].endAngle).toBe(270);

      expect(slices[2].percentage).toBe(25);
      expect(slices[2].startAngle).toBe(270);
      expect(slices[2].endAngle).toBe(360);
    });

    it('filters out items with 0 cents among positive items', () => {
      const items = [
        { id: 'groceries', label: 'Groceries', valueInCents: 5000 },
        { id: 'empty', label: 'Empty', valueInCents: 0 },
      ];

      const slices = generateDonutSlices(items);
      expect(slices).toHaveLength(1);
      expect(slices[0].id).toBe('groceries');
      expect(slices[0].percentage).toBe(100);
    });
  });

  describe('normalizeBarScale', () => {
    it('handles zero or empty values with default fallback scale', () => {
      const scale = normalizeBarScale([], 200);
      expect(scale.maxVal).toBe(10000);
      expect(scale.scaleFactor).toBe(200 / 10000);
      expect(scale.gridTicks).toEqual([0, 5000, 10000]);
    });

    it('calculates round maxVal and grid ticks for positive values', () => {
      const values = [12000, 35000, 48000];
      const scale = normalizeBarScale(values, 200);

      expect(scale.maxVal).toBeGreaterThanOrEqual(48000);
      expect(scale.scaleFactor).toBe(200 / scale.maxVal);
      expect(scale.gridTicks).toHaveLength(3);
      expect(scale.gridTicks[0]).toBe(0);
      expect(scale.gridTicks[2]).toBe(scale.maxVal);
    });
  });
});
