import Link from 'next/link';
import { getClient } from '@/lib/apollo-rsc';
import { getTranslations } from '@/i18n';
import { GET_SHOWCASE_CONFIG, GET_FEATURED_DEVICES, GET_SHOWCASE_JOURNEYS, GET_SHOWCASE_QUOTES } from '@/lib/queries';
import { pickThumbnail } from '@/lib/image-utils';

interface ShowcaseConfig {
  id: string;
  siteTitle: string;
  tagline: string;
  bioText: string;
  heroImagePath: string | null;
  accentColor: string;
  timelineCuratorNote: string;
  narrativeStatement: string;
  collectionOverview: string;
}

interface DeviceImage {
  path: string;
  isThumbnail: boolean;
  thumbnailMode: string | null;
}

interface Device {
  id: string;
  name: string;
  manufacturer: string | null;
  releaseYear: number | null;
  info: string | null;
  rarity: string | null;
  images: DeviceImage[];
}

interface ShowcaseDevice {
  id: string;
  curatorNote: string | null;
  isFeatured: boolean;
  device: Device;
}

interface ShowcaseChapter {
  id: string;
  title: string;
  sortOrder: number;
}

interface ShowcaseJourney {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImagePath: string | null;
  sortOrder: number;
  published: boolean;
  chapters: ShowcaseChapter[];
}

interface ShowcaseQuote {
  id: string;
  author: string;
  text: string;
  source: string | null;
  isDefault: boolean;
  isEnabled: boolean;
}

const RARE_RARITIES = ['RARE', 'VERY_RARE', 'UNIQUE'];

export default async function HomePage() {
  const t = getTranslations(process.env.LANGUAGE);
  let config: ShowcaseConfig | null = null;
  let featuredDevices: ShowcaseDevice[] = [];
  let journeys: ShowcaseJourney[] = [];
  let quote: ShowcaseQuote | null = null;
  let quote2: ShowcaseQuote | null = null;

  try {
    const [configResult, devicesResult, journeysResult, quotesResult] = await Promise.allSettled([
      getClient().query<{ showcaseConfig: ShowcaseConfig | null }>({ query: GET_SHOWCASE_CONFIG }),
      getClient().query<{ showcaseFeaturedDevices: ShowcaseDevice[] }>({ query: GET_FEATURED_DEVICES }),
      getClient().query<{ showcaseJourneys: ShowcaseJourney[] }>({ query: GET_SHOWCASE_JOURNEYS }),
      getClient().query<{ showcaseQuotes: ShowcaseQuote[] }>({ query: GET_SHOWCASE_QUOTES }),
    ]);

    if (configResult.status === 'fulfilled') {
      config = configResult.value.data?.showcaseConfig ?? null;
    }
    if (devicesResult.status === 'fulfilled') {
      featuredDevices = devicesResult.value.data?.showcaseFeaturedDevices ?? [];
    }
    if (journeysResult.status === 'fulfilled') {
      journeys = journeysResult.value.data?.showcaseJourneys ?? [];
    }
    if (quotesResult.status === 'fulfilled') {
      const quotes = quotesResult.value.data?.showcaseQuotes ?? [];
      if (quotes.length > 0) {
        const idx = Math.floor(Math.random() * quotes.length);
        quote = quotes[idx];
        if (quotes.length > 1) {
          let idx2;
          do { idx2 = Math.floor(Math.random() * quotes.length); } while (idx2 === idx);
          quote2 = quotes[idx2];
        }
      }
    }
  } catch {
    // Render with defaults
  }

  const siteTitle = config?.siteTitle || 'The Collection';
  const tagline = config?.tagline || 'A Legacy of Silicon & Steel';
  const bioText = config?.bioText || 'Three decades of computing history, curated and cared for. Each machine a chapter in a longer story.';
  const heroImagePath = config?.heroImagePath || null;
  const narrativeStatement = config?.narrativeStatement || "Precision isn\u2019t just a measurement; it\u2019s a philosophy. We celebrate the era when hardware was sculpted, and every screw served a purpose.";
  const collectionOverview = config?.collectionOverview || '';

  const featuredJourney = journeys[0] ?? null;

  return (
    <main>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-surface-container-lowest">
        {heroImagePath ? (
          <div className="absolute inset-0 z-0">
            <img
              src={`/uploads/${heroImagePath}`}
              alt="Collection hero"
              className="w-full h-full object-cover opacity-60 mix-blend-multiply"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/60 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-surface via-surface/80 to-surface-container-low" />
        )}
        <div className="container mx-auto px-8 relative z-10">
          <div className="max-w-3xl">
            <label className="text-[0.65rem] font-bold uppercase tracking-widest text-outline mb-2 block">
              {t.home.curatedNarratives}
            </label>
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter leading-[0.9] text-on-surface mb-8">
              {tagline}
            </h1>
            <p className="text-xl text-on-surface-variant max-w-xl leading-relaxed mb-10">
              {bioText}
            </p>
            <div className="flex gap-4">
              <Link
                href="/journeys"
                className="bg-primary text-on-primary px-8 py-4 rounded-full font-semibold hover:opacity-90 transition-all flex items-center gap-2 group"
              >
                {t.home.startExploring}
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative Section */}
      <section id="about" className="scroll-mt-[68px] py-32 px-8 bg-surface">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-end">
          <div className="md:col-span-7">
            <label className="text-xs uppercase tracking-widest text-outline font-bold mb-6 block">
              {t.home.theNarrative}
            </label>
            <p className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-on-surface">
              {narrativeStatement}
            </p>
          </div>
          {collectionOverview && (
            <div className="md:col-span-5">
              <p className="text-lg text-on-surface-variant leading-relaxed mb-6">
                {collectionOverview}
              </p>
              <div className="h-px w-20 bg-primary" />
            </div>
          )}
        </div>
      </section>

      {/* Gallery / Highlights Section */}
      <section className="py-20 bg-surface-container-low overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid grid-cols-12 gap-6 h-[800px]">
            {/* Featured Journey tile */}
            {featuredJourney ? (
              <Link
                href={`/journeys/${featuredJourney.slug}`}
                className="col-span-8 h-full rounded-xl overflow-hidden relative group bg-surface-container-high block"
              >
                {featuredJourney.coverImagePath ? (
                  <img
                    src={`/uploads/${featuredJourney.coverImagePath}`}
                    alt={featuredJourney.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8 z-10">
                  <span className="text-xs uppercase tracking-widest text-white/60 font-bold">
                    {t.home.featuredJourney} · {featuredJourney.chapters.length} {featuredJourney.chapters.length === 1 ? t.home.chapterSingular : t.home.chapterPlural}
                  </span>
                  <h3 className="text-3xl font-bold text-white mt-1 mb-2">{featuredJourney.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed line-clamp-2 max-w-lg">{featuredJourney.description}</p>
                </div>
                <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5">
                    {t.home.readTheStory}
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </Link>
            ) : (
              <div className="col-span-8 h-full rounded-xl overflow-hidden relative bg-surface-container-high">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-8 left-8 text-white z-10">
                  <span className="text-xs uppercase tracking-widest opacity-60">{t.home.theArchive}</span>
                  <h3 className="text-2xl font-bold">{t.home.comingSoon}</h3>
                </div>
              </div>
            )}

            {/* Right column */}
            <div className="col-span-4 flex flex-col gap-6 h-full">
              {/* Second quote card (inverted) */}
              {quote2 ? (
                <div className="h-1/2 rounded-xl overflow-hidden bg-surface-container-high p-10 flex flex-col justify-center">
                  <svg
                    className="w-12 h-12 mb-6 text-primary opacity-60"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-xl font-medium leading-snug text-primary">
                    &ldquo;{quote2.text}&rdquo;
                  </p>
                  <span className="mt-4 text-on-surface-variant text-sm">— {quote2.author}{quote2.source ? `, ${quote2.source}` : ''}</span>
                </div>
              ) : (
                <div className="h-1/2 rounded-xl overflow-hidden bg-surface-container-high" />
              )}

              {/* Quote card */}
              {quote && (
                <div className="h-1/2 rounded-xl overflow-hidden bg-primary p-10 flex flex-col justify-center text-on-primary">
                  <svg
                    className="w-12 h-12 mb-6 opacity-80"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-2xl font-medium leading-snug">
                    &ldquo;{quote.text}&rdquo;
                  </p>
                  <span className="mt-4 opacity-60">— {quote.author}{quote.source ? `, ${quote.source}` : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Artifacts Section */}
      {featuredDevices.length > 0 && (
        <section className="py-32 px-8 bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-16">
              <div>
                <span className="text-sm uppercase tracking-widest text-primary font-bold">
                  {t.home.selectionLabel}
                </span>
                <h2 className="text-5xl font-black tracking-tighter mt-2">{t.home.featuredArtifacts}</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredDevices.map((showcaseDevice) => {
                const { device, curatorNote } = showcaseDevice;
                const thumbnailUrl = pickThumbnail(device.images);
                const isRare = RARE_RARITIES.includes(device.rarity || '');
                const rarityKey = device.rarity as keyof typeof t.rarity | null;
                const badgeText = (rarityKey && t.rarity[rarityKey]) ? t.rarity[rarityKey] : t.home.featuredJourney;
                const description = curatorNote ||
                  (device.info ? device.info.slice(0, 150) + (device.info.length > 150 ? '…' : '') : null);

                return (
                  <Link
                    key={showcaseDevice.id}
                    href={`/device/${device.id}`}
                    className="group block"
                  >
                    <div className="aspect-[4/5] bg-surface-container-high rounded-xl overflow-hidden mb-6 relative">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={device.name}
                          className="w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-highest transition-transform duration-500 group-hover:scale-105" />
                      )}
                      <span
                        className={`absolute top-4 right-4 ${isRare ? 'bg-tertiary' : 'bg-primary'} text-white text-[10px] px-2 py-1 rounded tracking-tighter uppercase font-bold`}
                      >
                        {badgeText}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight">{device.name}</h3>
                        <p className="text-on-surface-variant font-medium">
                          {[device.releaseYear, device.manufacturer].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <span className="text-primary font-black italic text-lg">
                        #{String(device.id).padStart(3, '0')}
                      </span>
                    </div>
                    {description && (
                      <p className="mt-4 text-on-surface-variant text-sm leading-relaxed border-l-2 border-primary/20 pl-4">
                        {description}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Artifacts Placeholder (when no data yet) */}
      {featuredDevices.length === 0 && (
        <section className="py-32 px-8 bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <span className="text-[0.6rem] font-bold uppercase tracking-widest text-outline">
                {t.home.featuredJourney}
              </span>
              <h2 className="text-5xl font-black tracking-tighter mt-2">{t.home.featuredArtifacts}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="group">
                  <div className="aspect-[4/5] bg-surface-container-high rounded-xl overflow-hidden mb-6" />
                  <div className="h-6 w-48 bg-surface-container-high rounded mb-2" />
                  <div className="h-4 w-32 bg-surface-container rounded" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Journeys Section */}
      {journeys.length > 0 && (
        <section className="py-32 px-8 bg-surface-container-low">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-16">
              <div>
                <span className="text-sm uppercase tracking-widest text-primary font-bold">
                  {t.home.curatedNarratives}
                </span>
                <h2 className="text-5xl font-black tracking-tighter mt-2">{t.home.theJourneys}</h2>
              </div>
              <Link
                href="/journeys"
                className="text-primary font-semibold text-sm flex items-center gap-1 hover:opacity-70 transition-opacity"
              >
                {t.home.allJourneys}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {journeys.slice(0, 3).map((journey) => (
                <Link
                  key={journey.id}
                  href={`/journeys/${journey.slug}`}
                  className="bg-surface-container-lowest rounded-xl overflow-hidden group cursor-pointer"
                  style={{ boxShadow: '0 0 32px 0 rgba(26,28,31,0.04)' }}
                >
                  <div className="h-48 relative overflow-hidden flex items-end p-6 bg-gradient-to-br from-slate-800 to-slate-900">
                    {journey.coverImagePath && (
                      <img
                        src={`/uploads/${journey.coverImagePath}`}
                        alt={journey.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-70 transition-opacity duration-500 group-hover:opacity-100"
                      />
                    )}
                    {/* Overlay fades away on hover to reveal the full image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10 transition-opacity duration-500 group-hover:opacity-0" />
                    <div className="relative z-10">
                      <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">
                        {journey.chapters.length} {journey.chapters.length === 1 ? t.home.chapterSingular : t.home.chapterPlural}
                      </span>
                      <h3 className="text-xl font-bold text-white mt-1">{journey.title}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {journey.description}
                    </p>
                    <div className="mt-4 text-primary text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      {t.home.readTheStory}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-40 bg-surface-container-lowest">
        <div className="max-w-4xl mx-auto text-center px-8">
          <h2 className="text-6xl font-black tracking-tighter text-on-surface mb-8">
            {t.home.ctaHeading}
          </h2>
          <p className="text-xl text-on-surface-variant mb-12 max-w-2xl mx-auto">
            {t.home.ctaSubtext}
          </p>
          <div className="inline-flex flex-col items-center">
            <Link
              href="/timeline"
              className="bg-primary hover:bg-primary-container text-on-primary px-12 py-5 rounded-full text-lg font-bold transition-all shadow-xl shadow-primary/20 hover:shadow-primary/40 mb-6 uppercase tracking-widest"
            >
              {t.home.exploreAllDevices}
            </Link>
            <div className="flex items-center gap-6 text-on-surface-variant text-sm font-medium">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                {t.home.everyDeviceDocumented}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                {t.home.originalPhotography}
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
