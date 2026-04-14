"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { TimelineDevice } from '@/app/timeline/page';
import { useT } from '@/i18n/context';

interface TimelineClientProps {
  devices: TimelineDevice[];
  journeyTitles: string[];
  categoryNames: string[];
  curatorNote: string;
}

const ERA_RANGES: [number, number][] = [
  [1976, 1983],
  [1984, 1993],
  [1994, 1997],
  [1998, 2011],
  [2012, 2030],
];

const RARE_RARITIES = ['RARE', 'VERY_RARE', 'UNIQUE'];

const PAGE_SIZE = 12;

export default function TimelineClient({
  devices,
  journeyTitles,
  categoryNames,
  curatorNote,
}: TimelineClientProps) {
  const t = useT();

  const ERAS = [
    { label: t.timeline.eraFoundation, range: ERA_RANGES[0] },
    { label: t.timeline.eraSculley, range: ERA_RANGES[1] },
    { label: t.timeline.eraInterim, range: ERA_RANGES[2] },
    { label: t.timeline.eraReturn, range: ERA_RANGES[3] },
    { label: t.timeline.eraModern, range: ERA_RANGES[4] },
  ];

  const [selectedJourney, setSelectedJourney] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEra, setSelectedEra] = useState<[number, number] | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      if (selectedJourney && d.journeyTitle !== selectedJourney) return false;
      if (selectedCategory && d.categoryName !== selectedCategory) return false;
      if (selectedEra) {
        const year = d.releaseYear;
        if (year === null) return false;
        if (year < selectedEra[0] || year > selectedEra[1]) return false;
      }
      return true;
    });
  }, [devices, selectedJourney, selectedCategory, selectedEra]);

  const visible = filtered.slice(0, visibleCount);

  function handleJourneyPill(title: string | null) {
    setSelectedJourney(title);
    setVisibleCount(PAGE_SIZE);
  }

  function handleCategory(name: string) {
    setSelectedCategory((prev) => (prev === name ? null : name));
    setVisibleCount(PAGE_SIZE);
  }

  function handleEra(range: [number, number]) {
    setSelectedEra((prev) =>
      prev && prev[0] === range[0] && prev[1] === range[1] ? null : range
    );
    setVisibleCount(PAGE_SIZE);
  }

  function handleLoadMore() {
    setVisibleCount((n) => n + PAGE_SIZE);
  }

  return (
    <main className="pt-32 pb-24 px-6 md:px-12 max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <label className="text-xs uppercase tracking-widest text-tertiary font-bold mb-4 block">
              {t.timeline.chronologicalCatalog}
            </label>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-none">
              {t.timeline.heading}
            </h1>
          </div>

          {/* Era Pills */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => handleJourneyPill(null)}
              className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-semibold transition-colors ${
                selectedJourney === null
                  ? 'bg-surface-container-high text-on-surface'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {t.timeline.allEras}
            </button>
            {journeyTitles.map((title) => (
              <button
                key={title}
                onClick={() => handleJourneyPill(title)}
                className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-semibold transition-colors ${
                  selectedJourney === title
                    ? 'bg-surface-container-high text-on-surface'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-10">
          {/* Historical Eras */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-outline mb-6">
              {t.timeline.historicalEras}
            </h3>
            <ul className="space-y-4">
              {ERAS.map((era) => {
                const count = devices.filter((d) => {
                  const y = d.releaseYear;
                  return y !== null && y >= era.range[0] && y <= era.range[1];
                }).length;
                const isActive =
                  selectedEra &&
                  selectedEra[0] === era.range[0] &&
                  selectedEra[1] === era.range[1];
                return (
                  <li
                    key={era.label}
                    className="flex items-center justify-between group cursor-pointer"
                    onClick={() => handleEra(era.range)}
                  >
                    <span
                      className={`font-medium transition-colors ${
                        isActive
                          ? 'text-primary font-bold'
                          : 'text-on-surface group-hover:text-primary'
                      }`}
                    >
                      {era.label} ({era.range[0]}–{era.range[1]})
                    </span>
                    <span
                      className={`text-[10px] px-2 py-1 rounded transition-all ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'bg-surface-container-high text-outline group-hover:bg-primary group-hover:text-white'
                      }`}
                    >
                      {String(count).padStart(2, '0')}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Category Filter */}
          {categoryNames.length > 0 && (
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-outline mb-6">
                {t.timeline.categoryFilter}
              </h3>
              <div className="flex flex-wrap gap-2">
                {categoryNames.map((name) => {
                  const isActive = selectedCategory === name;
                  return (
                    <button
                      key={name}
                      onClick={() => handleCategory(name)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all border ${
                        isActive
                          ? 'border-primary text-primary bg-surface-container-lowest'
                          : 'border-outline-variant/15 text-on-surface-variant bg-surface-container-lowest hover:border-primary'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Curator's Note */}
          {curatorNote && (
            <div className="p-6 bg-surface-container rounded-xl border border-outline-variant/10">
              <svg
                className="w-5 h-5 text-tertiary mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z" />
              </svg>
              <h4 className="text-sm font-bold text-on-surface mb-2">{t.timeline.curatorsNote}</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">{curatorNote}</p>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-9">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="text-on-surface-variant text-lg font-medium mb-2">
                {t.timeline.noDevices}
              </p>
              <p className="text-on-surface-variant text-sm opacity-60">
                {t.timeline.noDevicesSubtext}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {visible.map((device) => {
                const isRare = RARE_RARITIES.includes(device.rarity ?? '');
                const rarityKey = device.rarity as keyof typeof t.rarity | null;
                const rarity = rarityKey && t.rarity[rarityKey] ? t.rarity[rarityKey] : (device.rarity ?? '');
                return (
                  <div
                    key={device.showcaseId}
                    className="group flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden transition-all hover:-translate-y-1"
                    style={{ boxShadow: '0 0 32px 0 rgba(26,28,31,0.04)' }}
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                      {device.imagePath ? (
                        <img
                          src={device.imagePath}
                          alt={device.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-highest transition-transform duration-700 group-hover:scale-105" />
                      )}
                      {device.releaseYear !== null && (
                        <div className="absolute top-4 left-4 bg-tertiary/90 backdrop-blur-md px-3 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                          {device.releaseYear}
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-8 flex flex-col flex-grow">
                      {device.categoryName && (
                        <label className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2">
                          {device.categoryName}
                        </label>
                      )}
                      <h2 className="text-2xl font-bold text-on-surface mb-3 tracking-tight">
                        {device.name}
                      </h2>
                      {(device.historicalNotes || device.info) && (
                        <p className="text-sm text-on-surface-variant leading-relaxed mb-8 line-clamp-2">
                          {device.historicalNotes || device.info}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between">
                        <Link
                          href={`/device/${device.id}`}
                          className="text-sm font-bold text-on-surface flex items-center gap-2 group/btn hover:text-primary transition-colors"
                        >
                          {t.timeline.viewRecord}
                          <svg
                            className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                        </Link>
                        {rarity && (
                          <span
                            className={`text-[10px] font-medium ${
                              isRare ? 'text-tertiary' : 'text-outline'
                            }`}
                          >
                            {rarity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More */}
          {visibleCount < filtered.length && (
            <div className="mt-20 flex justify-center">
              <button
                onClick={handleLoadMore}
                className="bg-surface-container-high text-on-surface-variant px-10 py-4 rounded-full text-xs uppercase font-bold tracking-widest hover:bg-surface-container-highest transition-all flex items-center gap-3"
              >
                {t.timeline.loadMore}
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
