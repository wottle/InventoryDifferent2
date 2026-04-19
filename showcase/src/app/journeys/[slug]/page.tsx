import { notFound } from 'next/navigation';
import { getClient } from '@/lib/apollo-rsc';
import { getTranslations } from '@/i18n';
import { GET_SHOWCASE_JOURNEY_BY_SLUG } from '@/lib/queries';
import { pickThumbnail } from '@/lib/image-utils';

interface ShowcaseDeviceItem {
  id: string;
  curatorNote: string | null;
  sortOrder: number;
  isFeatured: boolean;
  device: {
    id: number;
    name: string;
    manufacturer: string | null;
    releaseYear: number | null;
    info: string | null;
    rarity: string | null;
    images: Array<{ path: string | null; isThumbnail: boolean; thumbnailMode: string | null }>;
  };
}

interface ChapterDetail {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  devices: ShowcaseDeviceItem[];
}

interface JourneyDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImagePath: string | null;
  effectiveVolumeNumber: number;
  published: boolean;
  chapters: ChapterDetail[];
}

const RARE_RARITIES = ['RARE', 'VERY_RARE', 'UNIQUE'];

function rarityLabel(rarity: string | null, t: any): string | null {
  if (!rarity) return null;
  const key = rarity as keyof typeof t.rarity;
  return t.rarity[key] ?? null;
}

function getVolumeLabel(effectiveVolumeNumber: number, t: any): string {
  const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
  return `${t.journeys.volume} ${numerals[effectiveVolumeNumber - 1] || effectiveVolumeNumber}`;
}

function DeviceCard({ item, t }: { item: ShowcaseDeviceItem; t: any }) {
  const { device, curatorNote } = item;
  const imagePath = pickThumbnail(device.images.map(i => ({ path: i.path ?? '', isThumbnail: i.isThumbnail, thumbnailMode: i.thumbnailMode })));
  const badge = rarityLabel(device.rarity, t);

  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col">
      <div className="h-48 bg-surface-container-high overflow-hidden">
        {imagePath ? (
          <img
            src={imagePath}
            alt={device.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-container to-surface-container-highest" />
        )}
      </div>
      <div className="p-6 flex-grow flex flex-col gap-3">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-lg font-bold tracking-tight">{device.name}</h4>
          {badge && (
            <span className="shrink-0 px-2 py-0.5 bg-tertiary text-on-tertiary text-[10px] font-bold uppercase tracking-wider rounded">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-on-surface-variant">
          {[device.manufacturer, device.releaseYear].filter(Boolean).join(' • ')}
        </p>
        {curatorNote && (
          <div className="bg-surface-container-high rounded-lg p-4 mt-2">
            <p className="text-sm text-on-surface-variant italic">{curatorNote}</p>
          </div>
        )}
        <a
          href={`/device/${device.id}`}
          className="mt-auto flex items-center gap-1 text-primary text-sm font-semibold hover:opacity-80 transition-opacity"
        >
          {t.journeyDetail.viewRecord}
        </a>
      </div>
    </div>
  );
}

function ChapterSection({ chapter, index, t }: { chapter: ChapterDetail; index: number; t: any }) {
  const isOdd = index % 2 === 0; // 0-indexed: 0=Pattern A, 1=Pattern B, etc.
  const chapterNum = String(index + 1).padStart(2, '0');
  const sortedDevices = [...chapter.devices].sort((a, b) => a.sortOrder - b.sortOrder);

  const deviceGrid = (
    <div className={`grid grid-cols-1 ${sortedDevices.length === 1 ? '' : 'md:grid-cols-2'} gap-6`}>
      {sortedDevices.map((item) => (
        <DeviceCard key={item.id} item={item} t={t} />
      ))}
    </div>
  );

  if (isOdd) {
    // Pattern A: text left, devices right
    return (
      <section className="py-24 px-8 md:px-24 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-5 flex flex-col gap-8">
              <div>
                <span className="text-[0.6875rem] font-bold tracking-[0.2em] uppercase text-tertiary mb-2 block">
                  {t.journeyDetail.chapter} {chapterNum}
                </span>
                <h2 className="text-4xl font-bold tracking-tight leading-none text-on-surface">
                  {chapter.title}
                </h2>
              </div>
              {chapter.description && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary">{t.journeyDetail.theNarrative}</h3>
                  <p className="text-on-surface-variant leading-relaxed text-lg">{chapter.description}</p>
                </div>
              )}
            </div>
            <div className="lg:col-span-7">{deviceGrid}</div>
          </div>
        </div>
      </section>
    );
  }

  // Pattern B: centered header, devices below
  return (
    <section className="py-24 px-8 md:px-24 bg-surface-container-low">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="text-[0.6875rem] font-bold tracking-[0.2em] uppercase text-tertiary mb-2 block">
            {t.journeyDetail.chapter} {chapterNum}
          </span>
          <h2 className={`text-4xl font-bold tracking-tight text-on-surface ${chapter.description ? 'mb-8' : ''}`}>{chapter.title}</h2>
          {chapter.description && (
            <p className="text-on-surface-variant text-lg leading-relaxed">{chapter.description}</p>
          )}
        </div>
        {deviceGrid}
      </div>
    </section>
  );
}

export default async function JourneyDetailPage({ params }: { params: { slug: string } }) {
  const t = getTranslations(process.env.LANGUAGE);
  let journey: JourneyDetail | null = null;

  try {
    const { data } = await getClient().query<{ showcaseJourney: JourneyDetail | null }>({
      query: GET_SHOWCASE_JOURNEY_BY_SLUG,
      variables: { slug: params.slug },
    });
    journey = data?.showcaseJourney ?? null;
  } catch {
    // Fall through to notFound
  }

  if (!journey || !journey.published) {
    notFound();
  }

  const coverUrl = journey.coverImagePath ? `/uploads/${journey.coverImagePath}` : null;
  const sortedChapters = [...journey.chapters].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <main>
      {/* Hero Section */}
      <section className="relative h-[921px] flex items-center justify-center overflow-hidden bg-surface-container-lowest">
        {coverUrl && (
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full bg-cover bg-center opacity-40 mix-blend-multiply"
              style={{ backgroundImage: `url('${coverUrl}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/40 to-surface" />
          </div>
        )}
        {!coverUrl && (
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-surface-container-low to-surface" />
        )}
        <div className="relative z-10 text-center px-6 max-w-5xl">
          <p className="text-xs font-medium tracking-widest uppercase mb-4 text-primary">
            {getVolumeLabel(journey.effectiveVolumeNumber, t)}
          </p>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-on-surface mb-6 leading-[0.9]">
            {journey.title}
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {journey.description}
          </p>
        </div>
      </section>

      {/* Chapter Sections */}
      {sortedChapters.map((chapter, index) => (
        <ChapterSection key={chapter.id} chapter={chapter} index={index} t={t} />
      ))}

      {/* CTA Section */}
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto bg-on-surface text-surface rounded-[2rem] overflow-hidden relative">
          {/* Dot grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative z-10 px-12 py-20 text-center">
            <span className="text-xs font-bold tracking-[0.4em] uppercase text-tertiary mb-6 block">
              {t.journeyDetail.nextStop}
            </span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">
              {t.journeyDetail.exploreArchive}
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/timeline"
                className="px-8 py-4 bg-surface text-on-surface rounded-full font-bold text-sm hover:opacity-90 transition-all"
              >
                {t.journeyDetail.browseTimeline}
              </a>
              <a
                href="/journeys"
                className="px-8 py-4 border border-surface/30 text-surface rounded-full font-bold text-sm hover:bg-surface/10 transition-all"
              >
                {t.journeyDetail.allJourneys}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
