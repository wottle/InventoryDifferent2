"use client";

import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import dynamic from "next/dynamic";
import { LoadingPanel } from "../../components/LoadingPanel";

const StatsCharts = dynamic(() => import("../../components/StatsCharts"), {
  ssr: false,
  loading: () => (
    <div className="p-4">
      <LoadingPanel title="Loading charts…" subtitle="Crunching the numbers" />
    </div>
  ),
});

const GET_COLLECTION_STATS = gql`
  query GetCollectionStats {
    collectionStats {
      byStatus { label count }
      byFunctionalStatus { label count }
      byCategoryType { label count }
      byAcquisitionYear { label count }
      byReleaseDecade { label count }
      topManufacturers { label count }
      byRarity { label count }
      totalDevices
      workingPercent
      avgEstimatedValue
      topCategoryType
    }
  }
`;

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `$${Number(value).toFixed(2)}`;
}

export default function StatsPage() {
  const { data, loading, error } = useQuery(GET_COLLECTION_STATS, {
    fetchPolicy: "cache-and-network",
  });

  const stats = data?.collectionStats;

  return (
    <div className="min-h-screen font-sans">
      <header className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)]">Collection Stats</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Visual breakdown of your collection composition and acquisition trends.
          </p>
        </div>
        <Link href="/" className="btn-retro text-sm px-3 py-1.5">
          Back
        </Link>
      </header>

      {loading && (
        <div className="p-4">
          <LoadingPanel title="Loading stats…" subtitle="Tallying the collection" />
        </div>
      )}
      {error && <div className="p-4 text-red-500">Error: {error.message}</div>}

      {!loading && !error && stats && (
        <div className="space-y-6">
          {/* Summary row */}
          <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
            <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">At a Glance</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                <div className="text-xs text-[var(--muted-foreground)]">Total Devices</div>
                <div className="mt-1 text-2xl font-light tabular-nums text-[var(--foreground)]">
                  {stats.totalDevices}
                </div>
              </div>
              <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                <div className="text-xs text-[var(--muted-foreground)]">Working</div>
                <div className="mt-1 text-2xl font-light tabular-nums text-green-600 dark:text-green-400">
                  {stats.workingPercent.toFixed(1)}%
                </div>
              </div>
              <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                <div className="text-xs text-[var(--muted-foreground)]">Avg. Est. Value</div>
                <div className="mt-1 text-2xl font-light tabular-nums text-[var(--foreground)]">
                  {formatCurrency(stats.avgEstimatedValue)}
                </div>
              </div>
              <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                <div className="text-xs text-[var(--muted-foreground)]">Top Category</div>
                <div className="mt-1 text-2xl font-light text-[var(--foreground)] truncate">
                  {stats.topCategoryType || "—"}
                </div>
              </div>
            </div>
          </section>

          <StatsCharts stats={stats} />
        </div>
      )}
    </div>
  );
}
