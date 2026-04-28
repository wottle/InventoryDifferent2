import { describe, it, expect } from 'vitest';
import {
  computeGridSize,
  inCircle,
  computeRowWidths,
  computeColHeights,
} from '@/app/list-new/_components/fisheyeGridMath';

describe('computeGridSize', () => {
  it('returns 1 for 0 or 1 devices', () => {
    expect(computeGridSize(0)).toBe(1);
    expect(computeGridSize(1)).toBe(1);
  });

  it('always returns an odd number', () => {
    for (let n = 1; n <= 120; n++) {
      expect(computeGridSize(n) % 2).toBe(1);
    }
  });

  it('circle in returned grid holds at least n cells', () => {
    for (const n of [1, 5, 10, 20, 50, 100]) {
      const C = computeGridSize(n);
      let count = 0;
      for (let r = 0; r < C; r++)
        for (let c = 0; c < C; c++)
          if (inCircle(c, r, C)) count++;
      expect(count).toBeGreaterThanOrEqual(n);
    }
  });

  it('is the smallest such odd grid', () => {
    for (const n of [5, 20, 50]) {
      const C = computeGridSize(n);
      if (C <= 1) continue;
      const prev = C - 2;
      let prevCount = 0;
      for (let r = 0; r < prev; r++)
        for (let c = 0; c < prev; c++)
          if (inCircle(c, r, prev)) prevCount++;
      expect(prevCount).toBeLessThan(n);
    }
  });
});

describe('inCircle', () => {
  it('center cell is always in circle', () => {
    for (const C of [1, 3, 5, 7, 9, 11]) {
      const cx = (C - 1) / 2;
      expect(inCircle(cx, cx, C)).toBe(true);
    }
  });

  it('corner cells are not in circle for C >= 3', () => {
    for (const C of [3, 5, 7, 9, 11]) {
      expect(inCircle(0, 0, C)).toBe(false);
      expect(inCircle(C - 1, 0, C)).toBe(false);
      expect(inCircle(0, C - 1, C)).toBe(false);
      expect(inCircle(C - 1, C - 1, C)).toBe(false);
    }
  });
});

describe('computeRowWidths', () => {
  it('returns all BASE when mouse is far away', () => {
    const widths = computeRowWidths(0, -50, -50, 9, 32, 2.6, 2.5);
    expect(widths.every(w => w === 32)).toBe(true);
  });

  it('total width is conserved (equals C * BASE)', () => {
    const C = 9, BASE = 32;
    const widths = computeRowWidths(4, 4, 4, C, BASE, 2.6, 2.5);
    expect(widths.reduce((s, w) => s + w, 0)).toBeCloseTo(C * BASE, 1);
  });

  it('center column is wider than immediate neighbors', () => {
    const widths = computeRowWidths(4, 4, 4, 9, 32, 2.6, 2.5);
    expect(widths[4]).toBeGreaterThan(widths[3]);
    expect(widths[4]).toBeGreaterThan(widths[5]);
  });

  it('returns C values', () => {
    expect(computeRowWidths(0, 0, 0, 7, 32, 2.6, 2.5)).toHaveLength(7);
  });
});

describe('computeColHeights', () => {
  it('returns all BASE when mouse is far away', () => {
    const heights = computeColHeights(0, -50, -50, 9, 32, 2.6, 2.5);
    expect(heights.every(h => h === 32)).toBe(true);
  });

  it('total height is conserved (equals C * BASE)', () => {
    const C = 9, BASE = 32;
    const heights = computeColHeights(4, 4, 4, C, BASE, 2.6, 2.5);
    expect(heights.reduce((s, h) => s + h, 0)).toBeCloseTo(C * BASE, 1);
  });

  it('center row is taller than immediate neighbors', () => {
    const heights = computeColHeights(4, 4, 4, 9, 32, 2.6, 2.5);
    expect(heights[4]).toBeGreaterThan(heights[3]);
    expect(heights[4]).toBeGreaterThan(heights[5]);
  });
});
