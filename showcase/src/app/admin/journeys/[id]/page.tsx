"use client";

import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { GET_ALL_JOURNEYS_FOR_EDIT } from '@/lib/queries';
import JourneyEditor, { type JourneyData } from '@/components/admin/JourneyEditor';

export default function EditJourneyPage() {
  const params = useParams();
  const { data, loading } = useQuery<{ showcaseAllJourneys: JourneyData[] }>(
    GET_ALL_JOURNEYS_FOR_EDIT
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const journey = data?.showcaseAllJourneys?.find((j) => j.id === params.id) ?? null;

  return <JourneyEditor journey={journey} />;
}
