"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { API_BASE_URL } from "../../../lib/config";
import { pickThumbnail } from "../../../lib/pickThumbnail";
import {
  computeGridSize,
  inCircle,
  computeRowWidths,
  computeColHeights,
} from "./fisheyeGridMath";

const MAX_SCALE = 3.5;
const RADIUS = 2.6;
const GAP = 3;
const PAD = 10;
const LERP = 0.18;

interface ImageData {
  path: string;
  thumbnailPath?: string | null;
  isThumbnail: boolean;
  thumbnailMode?: string | null;
}

interface FisheyeDevice {
  id: number;
  name: string;
  images: ImageData[];
}

interface Props {
  devices: FisheyeDevice[];
}

function computeBase(C: number): number {
  if (typeof window === "undefined") return 32;
  const available = Math.min(
    window.innerWidth - 64,
    window.innerHeight - 160
  );
  return Math.max(20, Math.floor(available / (C + 1)) - GAP);
}

export function FisheyeGrid({ devices }: Props) {
  const n = devices.length;
  const C = useMemo(() => computeGridSize(n), [n]);
  const [BASE, setBase] = useState(() => computeBase(C));
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const onResize = () => setBase(computeBase(C));
    window.addEventListener("resize", onResize, { passive: true });
    setBase(computeBase(C));
    return () => window.removeEventListener("resize", onResize);
  }, [C]);

  const STEP = BASE + GAP;
  const containerSize = C * STEP - GAP + PAD * 2;

  const slots = useMemo(() => {
    type Slot = {
      c: number;
      r: number;
      device: FisheyeDevice | null;
      isInCircle: boolean;
    };
    const result: Slot[] = [];
    let di = 0;
    for (let r = 0; r < C; r++) {
      for (let c = 0; c < C; c++) {
        const ic = inCircle(c, r, C);
        result.push({
          c, r,
          device: ic && di < n ? devices[di++] : null,
          isInCircle: ic,
        });
      }
    }
    return result;
  }, [C, n, devices]);

  const cellRefs = useRef<(HTMLAnchorElement | HTMLDivElement | null)[]>([]);

  const baseCenters = useMemo(
    () => slots.map(({ c, r }) => ({
      x: PAD + c * STEP + BASE / 2,
      y: PAD + r * STEP + BASE / 2,
    })),
    [slots, STEP, BASE]
  );

  type CellTransform = { dx: number; dy: number; sx: number; sy: number };
  const currentT = useRef<CellTransform[]>([]);
  const targetT = useRef<CellTransform[]>([]);
  const animRef = useRef<number | null>(null);

  const zero = (): CellTransform => ({ dx: 0, dy: 0, sx: 1, sy: 1 });

  const computeTargets = useCallback(
    (mc: number, mr: number) => {
      const rw = Array.from({ length: C }, (_, r) =>
        computeRowWidths(r, mc, mr, C, BASE, RADIUS, MAX_SCALE)
      );
      const ch = Array.from({ length: C }, (_, c) =>
        computeColHeights(c, mc, mr, C, BASE, RADIUS, MAX_SCALE)
      );
      slots.forEach(({ c, r }, idx) => {
        const tw = rw[r][c];
        const th = ch[c][r];
        let tx = PAD;
        for (let i = 0; i < c; i++) tx += rw[r][i] + GAP;
        let ty = PAD;
        for (let j = 0; j < r; j++) ty += ch[c][j] + GAP;
        const base = baseCenters[idx];
        targetT.current[idx] = {
          dx: tx + tw / 2 - base.x,
          dy: ty + th / 2 - base.y,
          sx: tw / BASE,
          sy: th / BASE,
        };
      });
    },
    [slots, baseCenters, C, BASE]
  );

  const runLoop = useCallback(() => {
    let needsMore = false;
    slots.forEach((_slot, idx) => {
      const el = cellRefs.current[idx];
      if (!el) return;
      const tgt = targetT.current[idx] ?? zero();
      const cur = currentT.current[idx] ?? zero();
      cur.dx += (tgt.dx - cur.dx) * LERP;
      cur.dy += (tgt.dy - cur.dy) * LERP;
      cur.sx += (tgt.sx - cur.sx) * LERP;
      cur.sy += (tgt.sy - cur.sy) * LERP;
      currentT.current[idx] = cur;
      if (
        Math.abs(tgt.dx - cur.dx) > 0.1 ||
        Math.abs(tgt.dy - cur.dy) > 0.1 ||
        Math.abs(tgt.sx - cur.sx) > 0.001 ||
        Math.abs(tgt.sy - cur.sy) > 0.001
      ) needsMore = true;
      el.style.transform = `translate(${cur.dx.toFixed(2)}px,${cur.dy.toFixed(2)}px) scale(${cur.sx.toFixed(4)},${cur.sy.toFixed(4)})`;
    });
    animRef.current = needsMore ? requestAnimationFrame(runLoop) : null;
  }, [slots]);

  const startLoop = useCallback(() => {
    if (!animRef.current) animRef.current = requestAnimationFrame(runLoop);
  }, [runLoop]);

  useEffect(() => {
    slots.forEach((_slot, idx) => {
      targetT.current[idx] = zero();
      currentT.current[idx] = zero();
    });
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    cellRefs.current.forEach(el => { if (el) el.style.transform = ""; });
  }, [devices, slots]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      computeTargets(
        (e.clientX - rect.left - PAD) / STEP,
        (e.clientY - rect.top - PAD) / STEP,
      );
      startLoop();
    },
    [STEP, computeTargets, startLoop]
  );

  const onMouseLeave = useCallback(() => {
    slots.forEach((_slot, idx) => { targetT.current[idx] = zero(); });
    startLoop();
  }, [slots, startLoop]);

  const iconSize = Math.max(12, Math.floor(BASE * 0.4));

  return (
    <div
      style={{ position: "relative", width: containerSize, height: containerSize, margin: "32px auto" }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {slots.map(({ c, r, device, isInCircle }, idx) => {
        if (!isInCircle) return null;

        const baseX = PAD + c * STEP;
        const baseY = PAD + r * STEP;
        const cellStyle: React.CSSProperties = {
          position: "absolute",
          left: baseX,
          top: baseY,
          width: BASE,
          height: BASE,
          borderRadius: 4,
          overflow: "hidden",
          willChange: "transform",
          visibility: !device ? "hidden" : "visible",
        };

        if (!device) {
          return (
            <div
              key={`empty-${c}-${r}`}
              ref={el => { cellRefs.current[idx] = el; }}
              style={cellStyle}
            />
          );
        }

        const thumb = pickThumbnail(device.images, isDark);
        const src = thumb
          ? `${API_BASE_URL}${thumb.thumbnailPath || thumb.path}`
          : null;

        return (
          <Link
            key={device.id}
            href={`/devices/${device.id}`}
            ref={el => { cellRefs.current[idx] = el as HTMLAnchorElement; }}
            style={cellStyle}
          >
            {src ? (
              <img
                src={src}
                alt={device.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                loading="lazy"
              />
            ) : (
              <div
                style={{
                  width: "100%", height: "100%",
                  background: "var(--surface-container, #3d3d3d)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: iconSize, color: "#888" }}>
                  devices
                </span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
