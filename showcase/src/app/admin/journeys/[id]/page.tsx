"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GET_ALL_JOURNEYS_FOR_EDIT } from '@/lib/queries';
import JourneyEditor, { type JourneyData } from '@/components/admin/JourneyEditor';

export default function EditJourneyPage() {
  const params = useParams();
  const router = useRouter();
  const { data, loading } = useQuery<{ showcaseAllJourneys: JourneyData[] }>(
    GET_ALL_JOURNEYS_FOR_EDIT
  );

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const journey = loading ? undefined : (data?.showcaseAllJourneys?.find((j) => j.id === id) ?? null);

  useEffect(() => {
    if (!loading && journey === null) {
      router.replace('/admin/journeys');
    }
  }, [loading, journey, router]);

  if (loading || !journey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-on-surface-variant">Loading...</p>
      </div>
    );
  }

  return <JourneyEditor journey={journey} />;
}
