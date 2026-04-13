import { getClient } from '@/lib/apollo-rsc';
import { GET_TIMELINE_DATA } from '@/lib/queries';
import TimelineClient from '@/components/TimelineClient';
import { pickThumbnail } from '@/lib/image-utils';

interface ShowcaseConfig {
  timelineCuratorNote: string;
}

interface DeviceImage {
  path: string;
  isThumbnail: boolean;
  thumbnailMode: string | null;
}

interface DeviceCategory {
  name: string;
  type: string;
}

interface RawDevice {
  id: number;
  name: string;
  manufacturer: string | null;
  releaseYear: number | null;
  info: string | null;
  rarity: string | null;
  category: DeviceCategory | null;
  images: DeviceImage[];
}

interface RawShowcaseDevice {
  id: string;
  isFeatured: boolean;
  device: RawDevice;
}

interface RawChapter {
  devices: RawShowcaseDevice[];
}

interface RawJourney {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  chapters: RawChapter[];
}

export interface TimelineDevice {
  showcaseId: string;
  id: number;
  name: string;
  manufacturer: string | null;
  releaseYear: number | null;
  info: string | null;
  rarity: string | null;
  categoryName: string | null;
  categoryType: string | null;
  imagePath: string | null;
  journeyTitle: string;
}

export default async function TimelinePage() {
  let curatorNote = '';
  let devices: TimelineDevice[] = [];
  let journeyTitles: string[] = [];
  let categoryNames: string[] = [];

  try {
    const { data } = await getClient().query<{
      showcaseConfig: ShowcaseConfig | null;
      showcaseJourneys: RawJourney[];
    }>({
      query: GET_TIMELINE_DATA,
    });

    curatorNote = data?.showcaseConfig?.timelineCuratorNote ?? '';

    const journeys = data?.showcaseJourneys ?? [];

    // Deduplicate devices across all journeys, track first journey per device
    const deviceMap = new Map<number, TimelineDevice>();
    for (const journey of journeys) {
      for (const chapter of journey.chapters) {
        for (const sd of chapter.devices) {
          if (!deviceMap.has(sd.device.id)) {
            deviceMap.set(sd.device.id, {
              showcaseId: sd.id,
              id: sd.device.id,
              name: sd.device.name,
              manufacturer: sd.device.manufacturer,
              releaseYear: sd.device.releaseYear,
              info: sd.device.info,
              rarity: sd.device.rarity,
              categoryName: sd.device.category?.name ?? null,
              categoryType: sd.device.category?.type ?? null,
              imagePath: pickThumbnail(sd.device.images) ?? null,
              journeyTitle: journey.title,
            });
          }
        }
      }
    }

    // Sort by releaseYear ascending, nulls last
    devices = Array.from(deviceMap.values()).sort((a, b) => {
      if (a.releaseYear === null && b.releaseYear === null) return 0;
      if (a.releaseYear === null) return 1;
      if (b.releaseYear === null) return -1;
      return a.releaseYear - b.releaseYear;
    });

    // Extract unique journey titles (in order)
    const seenTitles = new Set<string>();
    for (const journey of journeys) {
      if (!seenTitles.has(journey.title)) {
        seenTitles.add(journey.title);
        journeyTitles.push(journey.title);
      }
    }

    // Extract unique category names (sorted)
    const seenCats = new Set<string>();
    for (const d of devices) {
      if (d.categoryName && !seenCats.has(d.categoryName)) {
        seenCats.add(d.categoryName);
        categoryNames.push(d.categoryName);
      }
    }
    categoryNames.sort();
  } catch {
    // Render with empty state if API is unavailable
  }

  return (
    <TimelineClient
      devices={devices}
      journeyTitles={journeyTitles}
      categoryNames={categoryNames}
      curatorNote={curatorNote}
    />
  );
}
