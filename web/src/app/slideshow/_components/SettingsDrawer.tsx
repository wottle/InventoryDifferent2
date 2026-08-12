'use client';

import { useT } from '../../../i18n/context';
import { SlideshowSettings } from '../hooks/useSlideshowSettings';

interface SettingsDrawerProps {
  settings: SlideshowSettings;
  onUpdate: (patch: Partial<SlideshowSettings>) => void;
  onClose: () => void;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${on ? 'bg-[#0058bc]' : 'bg-white/20'}`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'right-0.5' : 'left-0.5'}`}
      />
    </button>
  );
}

export function SettingsDrawer({ settings, onUpdate, onClose }: SettingsDrawerProps) {
  const t = useT();
  const ts = t.pages.slideshow;

  return (
    <>
      {/* Backdrop — clicking outside closes drawer */}
      <div className="absolute inset-0" style={{ zIndex: 20 }} onClick={onClose} />

      {/* Drawer panel */}
      <div
        className="absolute top-0 right-0 bottom-0 w-72 flex flex-col overflow-y-auto"
        style={{ zIndex: 21 }}
        style={{
          background: 'rgba(20,20,22,0.92)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-white/40">
            {ts.settings}
          </span>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Slide duration */}
        <div className="px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] text-white/85">{ts.duration}</span>
            <span className="text-[11px] text-white/40">{settings.duration} {ts.durationUnit}</span>
          </div>
          <input
            type="range"
            min={3}
            max={30}
            step={1}
            value={settings.duration}
            onChange={e => onUpdate({ duration: Number(e.target.value) })}
            className="w-full accent-[#0058bc]"
          />
        </div>

        {/* Favorites only */}
        <div className="px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] text-white/85">{ts.favoritesOnly}</div>
              <div className="text-[11px] text-white/35 mt-0.5">{ts.favoritesOnlyHint}</div>
            </div>
            <Toggle
              on={settings.favoritesOnly}
              onToggle={() => onUpdate({ favoritesOnly: !settings.favoritesOnly })}
            />
          </div>
        </div>

        {/* Order */}
        <div className="px-5 py-4 border-b border-white/[0.08]">
          <div className="text-[13px] text-white/85 mb-3">{ts.order}</div>
          <div
            className="flex rounded-lg overflow-hidden p-0.5 gap-0.5"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            {(['random', 'year'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => onUpdate({ order: opt })}
                className={`flex-1 text-[11px] py-1.5 rounded-md transition-colors ${
                  settings.order === opt
                    ? 'bg-white/20 text-white'
                    : 'text-white/45 hover:text-white/70'
                }`}
              >
                {opt === 'random' ? ts.orderRandom : ts.orderByYear}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter */}
        <div className="px-5 py-4 border-b border-white/[0.08]">
          <div className="text-[13px] text-white/85 mb-1">{ts.statusFilter}</div>
          <div className="text-[11px] text-white/35 mb-3">{ts.statusFilterHint}</div>
          <div className="grid grid-cols-2 gap-1.5">
            {(['COLLECTION', 'FOR_SALE', 'PENDING_SALE', 'IN_REPAIR', 'REPAIRED', 'SOLD', 'DONATED', 'RETURNED'] as const).map(s => {
              const active = settings.statusFilter.includes(s);
              const toggle = () => {
                const next = active
                  ? settings.statusFilter.filter(x => x !== s)
                  : [...settings.statusFilter, s];
                onUpdate({ statusFilter: next });
              };
              return (
                <button
                  key={s}
                  onClick={toggle}
                  className={`text-[11px] py-1.5 px-2 rounded-md text-left transition-colors ${
                    active ? 'bg-[#0058bc]/70 text-white' : 'text-white/45 hover:text-white/70'
                  }`}
                  style={{ background: active ? 'rgba(0,88,188,0.5)' : 'rgba(255,255,255,0.08)' }}
                >
                  {t.status[s]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Historical notes */}
        <div className="px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] text-white/85">{ts.historicalNotes}</div>
              <div className="text-[11px] text-white/35 mt-0.5">{ts.historicalNotesHint}</div>
            </div>
            <Toggle
              on={settings.showHistoricalNotes}
              onToggle={() => onUpdate({ showHistoricalNotes: !settings.showHistoricalNotes })}
            />
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] text-white/85">{ts.progressBar}</div>
              <div className="text-[11px] text-white/35 mt-0.5">{ts.progressBarHint}</div>
            </div>
            <Toggle
              on={settings.showProgressBar}
              onToggle={() => onUpdate({ showProgressBar: !settings.showProgressBar })}
            />
          </div>
        </div>
      </div>
    </>
  );
}
