import Link from 'next/link';
import { getClient } from '@/lib/apollo-rsc';
import { getTranslations } from '@/i18n';
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


export default async function JourneysPage() {
  const t = getTranslations(process.env.LANGUAGE);

  function formatPublishedDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(process.env.LANGUAGE ?? 'en', { year: 'numeric', month: 'long' });
  }

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
            <label className="text-xs uppercase tracking-widest text-outline font-bold mb-4 block">
              {t.journeys.curatedNarratives}
            </label>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-none mb-6">
              {t.journeys.heading}
            </h1>
            <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
              {t.journeys.subheading}
            </p>
          </div>
          <div className="flex gap-4 pb-2">
            <div className="flex gap-8">
              <div>
                <p className="text-3xl font-black tracking-tighter text-on-surface">{journeys.length}</p>
                <p className="text-xs text-outline uppercase tracking-widest">
                  {t.journeys.journeysLabel}
                </p>
              </div>
              <div>
                <p className="text-3xl font-black tracking-tighter text-on-surface">
                  {journeys.reduce((acc, j) => acc + j.chapters.reduce((a, c) => a + c.devices.length, 0), 0)}
                </p>
                <p className="text-xs text-outline uppercase tracking-widest">
                  {t.journeys.artifactsLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Empty State */}
      {journeys.length === 0 && (
        <div className="flex flex-col items-center justify-center py-40 text-center">
          <p className="text-on-surface-variant text-lg font-medium mb-2">{t.journeys.noJourneys}</p>
          <p className="text-sm text-outline">{t.journeys.noJourneysSubtext}</p>
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
                    <h2 className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tighter">
                      {featured.title}
                    </h2>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1">
                    {featured.publishedAt && (
                      <p className="text-xs font-label uppercase tracking-widest text-outline mb-2">
                        {t.journeys.published} {formatPublishedDate(featured.publishedAt!)}
                      </p>
                    )}
                    <p className="text-lg md:text-xl text-on-surface-variant italic font-light max-w-2xl leading-relaxed">
                      {featured.description}
                    </p>
                  </div>
                  <span className="mt-4 md:mt-0 flex items-center gap-2 text-primary font-semibold group-hover:gap-4 transition-all whitespace-nowrap">
                    {t.journeys.exploreJourney}
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
                    <span className="text-[0.65rem] uppercase tracking-widest font-bold text-primary">
                      {t.journeys.published}
                    </span>
                    {journey.publishedAt && (
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
