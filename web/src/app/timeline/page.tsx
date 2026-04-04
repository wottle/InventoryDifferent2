"use client";

import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { LoadingPanel } from "../../components/LoadingPanel";
import TimelineView from "../../components/TimelineView";
import { useT } from "../../i18n/context";

const GET_TIMELINE = gql`
  query GetTimeline {
    devices {
      id
      name
      additionalName
      manufacturer
      releaseYear
      images {
        path
        thumbnailPath
        isThumbnail
        thumbnailMode
      }
      category {
        name
      }
    }
    timelineEvents {
      id
      year
      title
      description
      type
      sortOrder
    }
  }
`;

export default function TimelinePage() {
  const t = useT();
  const { data, loading, error } = useQuery(GET_TIMELINE, {
    fetchPolicy: "cache-and-network",
  });

  const devices = (data?.devices ?? []).filter((d: any) => d.releaseYear != null);
  const events = data?.timelineEvents ?? [];

  return (
    <div className="min-h-screen font-sans">
      <header className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)]">{t.pages.timeline.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {t.pages.timeline.subtitle}
          </p>
        </div>
        <Link href="/" className="btn-retro text-sm px-3 py-1.5">
          {t.common.back}
        </Link>
      </header>

      {loading && (
        <div className="p-4">
          <LoadingPanel title={t.pages.timeline.loading} subtitle={t.pages.timeline.loadingSubtitle} />
        </div>
      )}
      {error && <div className="p-4 text-red-500">Error: {error.message}</div>}

      {!loading && !error && data && (
        <TimelineView devices={devices} events={events} />
      )}
    </div>
  );
}
