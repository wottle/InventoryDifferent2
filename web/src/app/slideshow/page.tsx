'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';
import Link from 'next/link';
import { useT } from '../../i18n/context';
import { API_BASE_URL } from '../../lib/config';
import { pickThumbnail } from '../../lib/pickThumbnail';
import { useSlideshowSettings } from './hooks/useSlideshowSettings';
import { useSlideshow, SlideDevice } from './hooks/useSlideshow';
import { SlideView } from './_components/SlideView';
import { SettingsDrawer } from './_components/SettingsDrawer';
import { ProgressBar } from './_components/ProgressBar';

const GET_DEVICES = gql`
  query SlideshowGetDevices {
    devices {
      id
      name
      additionalName
      releaseYear
      isFavorite
      status
      historicalNotes
      category { name }
      images {
        id
        path
        thumbnailPath
        isThumbnail
        thumbnailMode
      }
    }
  }
`;

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return { isFullscreen, toggle };
}

export default function SlideshowPage() {
  const t = useT();
  const ts = t.pages.slideshow;

  const { settings, update } = useSlideshowSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  const { data, loading } = useQuery(GET_DEVICES);
  const allDevices: SlideDevice[] = data?.devices ?? [];

  const { slides, currentIndex, paused, next, prev, togglePause } = useSlideshow(allDevices, settings);

  // Two permanent slots for seamless crossfade.
  // The background slot is never unmounted — its component instance stays alive so the
  // Ken Burns animation continues from wherever it was rather than jumping back to start.
  const [slotA, setSlotA] = useState<{ device: SlideDevice; index: number } | null>(null);
  const [slotB, setSlotB] = useState<{ device: SlideDevice; index: number } | null>(null);
  const [activeSlot, setActiveSlot] = useState<'a' | 'b'>('a');
  const activeSlotRef = useRef<'a' | 'b'>('a');
  const activeDeviceIdRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const device = slides[currentIndex];
    if (!device || activeDeviceIdRef.current === device.id) return;
    activeDeviceIdRef.current = device.id;
    const next = activeSlotRef.current === 'a' ? 'b' : 'a';
    activeSlotRef.current = next;
    if (next === 'b') setSlotB({ device, index: currentIndex });
    else setSlotA({ device, index: currentIndex });
    setActiveSlot(next);
  }, [currentIndex, slides]);

  // Preload next slide image so the browser cache is warm before we need it
  useEffect(() => {
    if (slides.length < 2) return;
    const nextDevice = slides[(currentIndex + 1) % slides.length];
    if (!nextDevice) return;
    const thumb = pickThumbnail(nextDevice.images, true);
    if (!thumb) return;
    const img = new window.Image();
    img.src = `${API_BASE_URL}${thumb.path ?? thumb.thumbnailPath}`;
  }, [currentIndex, slides]);

  const currentDevice = (activeSlot === 'a' ? slotA : slotB)?.device ?? null;
  const currentNotes = currentDevice?.historicalNotes ?? undefined;

  // Show controls on mouse move, hide after 3s of inactivity.
  // Also start the timer immediately on mount so controls hide even without mouse movement.
  const showControls = () => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  };

  useEffect(() => {
    showControls(); // kick off the initial hide countdown
    return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white/40 text-sm tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden z-50"
      style={{ cursor: controlsVisible ? 'default' : 'none' }}
      onMouseMove={showControls}
    >
      {/* Slot A — z-index tracks which slot is active so background stays visible but below */}
      <div className="absolute inset-0" style={{ zIndex: activeSlot === 'a' ? 1 : 0 }}>
        {slotA && (
          <SlideView
            key={slotA.index}
            device={slotA.device}
            historicalNotes={activeSlot === 'a' ? currentNotes : undefined}
            showHistoricalNotes={activeSlot === 'a' && settings.showHistoricalNotes}
            slideIndex={slotA.index}
            apiBaseUrl={API_BASE_URL}
            duration={settings.duration}
            noFade={activeSlot !== 'a'}
          />
        )}
      </div>

      {/* Slot B — same device persists in DOM when it transitions to background */}
      <div className="absolute inset-0" style={{ zIndex: activeSlot === 'b' ? 1 : 0 }}>
        {slotB && (
          <SlideView
            key={slotB.index}
            device={slotB.device}
            historicalNotes={activeSlot === 'b' ? currentNotes : undefined}
            showHistoricalNotes={activeSlot === 'b' && settings.showHistoricalNotes}
            slideIndex={slotB.index}
            apiBaseUrl={API_BASE_URL}
            duration={settings.duration}
            noFade={activeSlot !== 'b'}
          />
        )}
      </div>

      {/* Empty states */}
      {slides.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {settings.favoritesOnly ? (
              <>
                <span className="material-symbols-outlined text-white/20 block mb-4" style={{ fontSize: '80px' }}>star</span>
                <p className="text-white/60 text-lg mb-2">{ts.noFavorites}</p>
                <p className="text-white/35 text-sm">{ts.noFavoritesHint}</p>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-white/20 block mb-4" style={{ fontSize: '80px' }}>devices</span>
                <p className="text-white/60 text-lg">{ts.noDevices}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {currentDevice && settings.showProgressBar && (
        <ProgressBar duration={settings.duration} paused={paused} slideKey={currentIndex} />
      )}

      {/* Top controls — fade in on mouse move */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5 transition-opacity duration-200"
        style={{
          zIndex: 20,
          opacity: controlsVisible || settingsOpen ? 1 : 0,
          pointerEvents: controlsVisible || settingsOpen ? 'auto' : 'none',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
        }}
      >
        {/* Wordmark */}
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'linear-gradient(135deg, #5EBD3E, #009CDF)' }}
          />
          <span className="text-[11px] text-white/45 tracking-widest uppercase font-medium">
            InventoryDifferent
          </span>
        </div>

        {/* Playback + settings buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={() => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>home</span>
          </Link>
          <button
            onClick={prev}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>skip_previous</span>
          </button>
          <button
            onClick={togglePause}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{paused ? 'play_arrow' : 'pause'}</span>
          </button>
          <button
            onClick={next}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>skip_next</span>
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
          <button
            onClick={() => setSettingsOpen(o => !o)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors text-white/70 hover:text-white"
            style={{
              background: settingsOpen ? 'rgba(0,88,188,0.6)' : 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>settings</span>
          </button>
        </div>
      </div>

      {/* Settings drawer */}
      {settingsOpen && (
        <SettingsDrawer
          settings={settings}
          onUpdate={update}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
