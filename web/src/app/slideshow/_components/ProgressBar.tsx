'use client';

import { useEffect, useRef } from 'react';

interface ProgressBarProps {
  duration: number;
  paused: boolean;
  slideKey: number;
}

export function ProgressBar({ duration, paused, slideKey }: ProgressBarProps) {
  const fillRef = useRef<HTMLDivElement>(null);

  // Reset and start animation on new slide
  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.width = '0%';
    void el.offsetWidth; // force reflow
    el.style.transition = paused ? 'none' : `width ${duration}s linear`;
    el.style.width = paused ? '0%' : '100%';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideKey, duration]);

  // Pause/resume from current position
  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;
    const currentWidth = el.getBoundingClientRect().width;
    const parentWidth = el.parentElement?.getBoundingClientRect().width ?? 1;
    const pct = (currentWidth / parentWidth) * 100;
    if (paused) {
      el.style.transition = 'none';
      el.style.width = `${pct}%`;
    } else {
      const remaining = duration * (1 - pct / 100);
      el.style.transition = `width ${Math.max(0, remaining)}s linear`;
      el.style.width = '100%';
    }
  }, [paused, duration]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10" style={{ zIndex: 20 }}>
      <div
        ref={fillRef}
        className="h-full"
        style={{ background: 'linear-gradient(to right, #0058bc, #0070eb)', width: '0%' }}
      />
    </div>
  );
}
