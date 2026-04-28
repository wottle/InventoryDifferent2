export function computeGridSize(n: number): number {
  if (n <= 0) return 1;
  let C = 1;
  while (true) {
    const cx = (C - 1) / 2;
    const cy = (C - 1) / 2;
    const radius = (C - 1) / 2;
    let count = 0;
    for (let r = 0; r < C; r++)
      for (let c = 0; c < C; c++)
        if (Math.hypot(c - cx, r - cy) <= radius) count++;
    if (count >= n) return C;
    C += C % 2 === 0 ? 1 : 2;
  }
}

export function inCircle(c: number, r: number, C: number): boolean {
  const cx = (C - 1) / 2;
  const cy = (C - 1) / 2;
  return Math.hypot(c - cx, r - cy) <= (C - 1) / 2;
}

export function computeRowWidths(
  r: number,
  mouseCol: number,
  mouseRow: number,
  C: number,
  BASE: number,
  RADIUS: number,
  MAX_SCALE: number
): number[] {
  const widths = new Array<number>(C).fill(BASE);
  const affected: { c: number; raw: number }[] = [];
  for (let c = 0; c < C; c++) {
    const dist = Math.hypot(c - mouseCol, r - mouseRow);
    if (dist <= RADIUS) {
      const t = 1 - dist / RADIUS;
      affected.push({ c, raw: (1 + (MAX_SCALE - 1) * t * t) * BASE });
    }
  }
  if (affected.length === 0) return widths;
  const rawSum = affected.reduce((s, a) => s + a.raw, 0);
  const budget = affected.length * BASE;
  for (const { c, raw } of affected) widths[c] = (raw * budget) / rawSum;
  return widths;
}

export function computeColHeights(
  c: number,
  mouseCol: number,
  mouseRow: number,
  C: number,
  BASE: number,
  RADIUS: number,
  MAX_SCALE: number
): number[] {
  const heights = new Array<number>(C).fill(BASE);
  const affected: { r: number; raw: number }[] = [];
  for (let r = 0; r < C; r++) {
    const dist = Math.hypot(c - mouseCol, r - mouseRow);
    if (dist <= RADIUS) {
      const t = 1 - dist / RADIUS;
      affected.push({ r, raw: (1 + (MAX_SCALE - 1) * t * t) * BASE });
    }
  }
  if (affected.length === 0) return heights;
  const rawSum = affected.reduce((s, a) => s + a.raw, 0);
  const budget = affected.length * BASE;
  for (const { r, raw } of affected) heights[r] = (raw * budget) / rawSum;
  return heights;
}
