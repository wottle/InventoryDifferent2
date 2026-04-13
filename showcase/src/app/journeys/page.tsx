import Link from 'next/link';
import { getClient } from '@/lib/apollo-rsc';
import { GET_ALL_SHOWCASE_JOURNEYS } from '@/lib/queries';

interface JourneyListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImagePath: string | null;
  sortOrder: number;
  published: boolean;
  publishedAt: string | null;
  chapters: Array<{ id: string; devices: Array<{ id: string }> }>;
}

function formatPublishedDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getVolumeLabel(sortOrder: number): string {
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
  return `Volume ${numerals[sortOrder - 1] || sortOrder}`;
}

export default async function JourneysPage() {
  let journeys: JourneyListItem[] = [];

  try {
    const { data } = await getClient().query<{ showcaseJourneys: JourneyListItem[] }>({
      query: GET_ALL_SHOWCASE_JOURNEYS,
    });
    journeys = (data?.showcaseJourneys ?? []).filter((j) => j.published);
  } catch {
    // Render with empty state
  }

  const totalDevices = journeys.reduce(
    (acc, j) => acc + j.chapters.reduce((a, c) => a + c.devices.length, 0),
    0
  );

  const [featured, ...rest] = journeys;

  return (
    <main className="pt-32 pb-24 px-6 md:px-12 lg:px-24">
      {/* Hero Header */}
      <header className="mb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-3xl">
            <span className="text-xs font-label font-semibold tracking-[0.05em] uppercase text-tertiary mb-4 block">
              Curated Narratives
            </span>
            <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tighter text-on-surface mb-8 leading-none">
              Digital <br />Histories.
            </h1>
            <p className="text-xl text-on-surface-variant font-light leading-relaxed max-w-2xl">
              A chronological odyssey through the silicon and polycarbonate that defined an era.
            </p>
          </div>
          <div className="flex gap-4 pb-2">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold">{journeys.length}</span>
              <span className="text-[0.6875rem] font-label uppercase text-outline">Journeys</span>
            </div>
            <div className="w-px h-12 bg-outline-variant opacity-30" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold">{totalDevices}+</span>
              <span className="text-[0.6875rem] font-label uppercase text-outline">Artifacts</span>
            </div>
          </div>
        </div>
      </header>

      {/* Empty State */}
      {journeys.length === 0 && (
        <div className="flex flex-col items-center justify-center py-40 text-center">
          <p className="text-on-surface-variant text-xl font-light mb-4">No journeys published yet.</p>
          <p className="text-sm text-outline">Check back soon for curated narratives.</p>
        </div>
      )}

      {/* Editorial Grid */}
      {journeys.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-y-32">
          {/* First journey: full-width featured */}
          {featured && (
            <div className="md:col-span-12 group cursor-pointer">
              <Link href={`/journeys/${featured.slug}`} className="block">
                <div className="relative overflow-hidden rounded-xl aspect-[21/9] bg-surface-container-low mb-8 transition-transform duration-500 hover:scale-[1.01]">
                  {featured.coverImagePath ? (
                    <img
                      src={`/uploads/${featured.coverImagePath}`}
                      alt={featured.title}
                      className="w-full h-full object-cover grayscale contrast-125 opacity-90 group-hover:grayscale-0 transition-all duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-highest" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-12 left-12">
                    <span className="inline-block px-3 py-1 bg-tertiary text-on-tertiary text-[0.6875rem] font-label uppercase tracking-wider rounded-sm mb-4">
                      {getVolumeLabel(featured.sortOrder)}
                    </span>
                    <h2 className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tighter">
                      {featured.title}
                    </h2>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1">
                    {formatPublishedDate(featured.publishedAt) && (
                      <p className="text-xs font-label uppercase tracking-widest text-outline mb-2">
                        Published {formatPublishedDate(featured.publishedAt)}
                      </p>
                    )}
                    <p className="text-lg md:text-xl text-on-surface-variant italic font-light max-w-2xl leading-relaxed">
                      {featured.description}
                    </p>
                  </div>
                  <span className="mt-4 md:mt-0 flex items-center gap-2 text-primary font-semibold group-hover:gap-4 transition-all whitespace-nowrap">
                    Explore Journey →
                  </span>
                </div>
              </Link>
            </div>
          )}

          {/* Remaining journeys in alternating pairs */}
          {rest.map((journey, idx) => {
            const isOdd = idx % 2 === 0; // 0-indexed, so idx=0 is the 2nd journey overall (left/wide)
            const colClass = isOdd ? 'md:col-span-7' : 'md:col-span-5 md:mt-24';
            const aspectClass = isOdd ? 'aspect-[4/5]' : 'aspect-[3/4]';
            const coverUrl = journey.coverImagePath ? `/uploads/${journey.coverImagePath}` : null;

            return (
              <div key={journey.id} className={`${colClass} group cursor-pointer`}>
                <Link href={`/journeys/${journey.slug}`} className="block">
                  <div
                    className={`relative rounded-xl overflow-hidden ${aspectClass} bg-surface-container-high mb-6 transition-all duration-500`}
                    style={{ boxShadow: '0 32px 64px -12px rgba(26, 28, 31, 0.04)' }}
                  >
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={journey.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-highest" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[0.6875rem] font-label uppercase tracking-widest text-outline">
                      {getVolumeLabel(journey.sortOrder)}
                    </span>
                    {formatPublishedDate(journey.publishedAt) && (
                      <>
                        <span className="text-outline opacity-30">·</span>
                        <span className="text-[0.6875rem] font-label uppercase tracking-widest text-outline">
                          {formatPublishedDate(journey.publishedAt)}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-3xl font-headline font-bold tracking-tight mb-4">{journey.title}</h3>
                  <p className="text-on-surface-variant leading-relaxed max-w-lg">{journey.description}</p>
                </Link>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
