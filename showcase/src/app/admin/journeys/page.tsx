"use client";

import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { useT } from '@/i18n/context';
import {
  GET_ALL_SHOWCASE_JOURNEYS_ADMIN,
  UPDATE_JOURNEY,
  DELETE_JOURNEY,
} from '@/lib/queries';

interface AdminJourney {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImagePath: string | null;
  sortOrder: number;
  published: boolean;
  publishedAt: string | null;
  chapters: Array<{
    id: string;
    title: string;
    devices: Array<{ id: string }>;
  }>;
}

export default function AdminJourneysPage() {
  const router = useRouter();
  const t = useT();
  const { data, loading, refetch } = useQuery<{ showcaseAllJourneys: AdminJourney[] }>(
    GET_ALL_SHOWCASE_JOURNEYS_ADMIN
  );

  const [updateJourney] = useMutation(UPDATE_JOURNEY);
  const [deleteJourney] = useMutation(DELETE_JOURNEY);

  const journeys = data?.showcaseAllJourneys ?? [];

  const handleTogglePublished = async (journey: AdminJourney) => {
    await updateJourney({
      variables: {
        id: journey.id,
        input: {
          title: journey.title,
          slug: journey.slug,
          description: journey.description ?? '',
          published: !journey.published,
        },
      },
      optimisticResponse: {
        updateJourney: {
          __typename: 'ShowcaseJourney',
          id: journey.id,
          published: !journey.published,
        },
      },
    });
    refetch();
  };

  const handleDelete = async (journey: AdminJourney) => {
    if (!window.confirm(`Delete "${journey.title}"? This cannot be undone.`)) return;
    await deleteJourney({ variables: { id: journey.id } });
    refetch();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-headline font-bold tracking-tight text-on-surface">{t.adminJourneys.title}</h1>
        <button
          onClick={() => router.push('/admin/journeys/new')}
          className="bg-primary text-on-primary font-semibold rounded-full px-5 py-2 text-sm hover:opacity-90 transition"
        >
          {t.adminJourneys.newJourney}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && journeys.length === 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-16 text-center">
          <p className="text-on-surface-variant mb-2">{t.adminJourneys.emptyTitle}</p>
          <p className="text-sm text-outline">{t.adminJourneys.emptySubtext}</p>
        </div>
      )}

      {/* Journey list */}
      {!loading && journeys.length > 0 && (
        <div className="flex flex-col gap-3">
          {journeys.map((journey) => {
            const chapterCount = journey.chapters.length;
            const deviceCount = journey.chapters.reduce((acc, c) => acc + c.devices.length, 0);

            return (
              <div
                key={journey.id}
                className="bg-surface-container-lowest rounded-xl px-6 py-4 flex items-center gap-4 hover:bg-surface-container-low transition"
              >
                {/* Published toggle */}
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={journey.published}
                    onChange={() => handleTogglePublished(journey)}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                  <span className="text-xs text-on-surface-variant">
                    {journey.published ? t.adminJourneys.published : t.adminJourneys.draft}
                  </span>
                </label>

                {/* Journey info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface truncate">{journey.title}</p>
                  <p className="text-sm text-on-surface-variant truncate">
                    /{journey.slug} &middot; {chapterCount} {chapterCount === 1 ? t.adminJourneys.chapterSingular : t.adminJourneys.chapterPlural} &middot; {deviceCount} {deviceCount === 1 ? t.adminJourneys.deviceSingular : t.adminJourneys.devicePlural}
                    {journey.publishedAt && (
                      <> &middot; Published {new Date(journey.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => router.push(`/admin/journeys/${journey.id}`)}
                    className="px-4 py-1.5 rounded-full text-sm font-medium border border-outline-variant text-on-surface hover:bg-surface-container-low transition"
                  >
                    {t.adminJourneys.edit}
                  </button>
                  <button
                    onClick={() => handleDelete(journey)}
                    className="px-4 py-1.5 rounded-full text-sm font-medium text-error border border-error/30 hover:bg-error/10 transition"
                  >
                    {t.adminJourneys.delete}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
