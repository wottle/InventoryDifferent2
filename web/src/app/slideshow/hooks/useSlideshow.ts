'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { SlideshowSettings } from './useSlideshowSettings';

export interface SlideDevice {
  id: string;
  name: string;
  additionalName?: string | null;
  releaseYear?: number | null;
  isFavorite: boolean;
  status?: string | null;
  historicalNotes?: string | null;
  category?: { name: string } | null;
  images: Array<{
    id: string;
    path: string;
    thumbnailPath?: string | null;
    isThumbnail: boolean;
    thumbnailMode?: string | null;
  }>;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function useSlideshow(allDevices: SlideDevice[], settings: SlideshowSettings) {
  const slides = useMemo(() => {
    let filtered = settings.statusFilter.length > 0
      ? allDevices.filter(d => settings.statusFilter.includes(d.status ?? 'COLLECTION'))
      : allDevices;
    if (settings.favoritesOnly) {
      filtered = filtered.filter(d => d.isFavorite);
    }
    if (settings.order === 'year') {
      return [...filtered].sort((a, b) => (a.releaseYear ?? 9999) - (b.releaseYear ?? 9999));
    }
    return shuffle(filtered);
  }, [allDevices, settings.statusFilter, settings.favoritesOnly, settings.order]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Reset to first slide when slide list changes
  useEffect(() => { setCurrentIndex(0); }, [slides]);

  const next = useCallback(() => {
    setCurrentIndex(i => (slides.length === 0 ? 0 : (i + 1) % slides.length));
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrentIndex(i => (slides.length === 0 ? 0 : (i - 1 + slides.length) % slides.length));
  }, [slides.length]);

  const togglePause = useCallback(() => setPaused(p => !p), []);

  // Auto-advance timer — resets on every index change or pause toggle
  useEffect(() => {
    if (paused || slides.length === 0) return;
    const id = setTimeout(next, settings.duration * 1000);
    return () => clearTimeout(id);
  }, [currentIndex, paused, settings.duration, next, slides.length]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === ' ') { e.preventDefault(); togglePause(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, togglePause]);

  return { slides, currentIndex, paused, next, prev, togglePause };
}
