"use client";

import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import dynamic from "next/dynamic";
import { LoadingPanel } from "../../components/LoadingPanel";
import { useT } from "../../i18n/context";

// StatsCharts dynamic import — loading text is static (component renders before t is available)
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

export default function StatsPage() {
  const t = useT();
  const { data, loading, error } = useQuery(GET_COLLECTION_STATS, {
    fetchPolicy: "cache-and-network",
  });

  const stats = data?.collectionStats;

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "—";
    return `${t.common.currencySymbol}${Number(value).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen font-sans">
      <header className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)]">{t.pages.stats.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {t.pages.stats.subtitle}
          </p>
        </div>
        <Link href="/" className="btn-retro text-sm px-3 py-1.5">
          {t.common.back}
        </Link>
      </header>

      {loading && (
        <div className="p-4">
          <LoadingPanel title={t.pages.stats.loading} subtitle={t.pages.stats.loadingSubtitle} />
        </div>
      )}
      {error && <div className="p-4 text-red-500">Error: {error.message}</div>}

      {!loading && !error && stats && (
        <div className="space-y-6">
          {/* Summary row */}
          <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
            <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.pages.stats.atAGlance}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                <div className="text-xs text-[var(--muted-foreground)]">{t.pages.stats.totalDevices}</div>
                <div className="mt-1 text-2xl font-light tabular-nums text-[var(--foreground)]">
                  {stats.totalDevices}
                </div>
              </div>
              <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                <div className="text-xs text-[var(--muted-foreground)]">{t.pages.stats.working}</div>
                <div className="mt-1 text-2xl font-light tabular-nums text-green-600 dark:text-green-400">
                  {stats.workingPercent.toFixed(1)}%
                </div>
              </div>
              <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                <div className="text-xs text-[var(--muted-foreground)]">{t.pages.stats.avgEstValue}</div>
                <div className="mt-1 text-2xl font-light tabular-nums text-[var(--foreground)]">
                  {formatCurrency(stats.avgEstimatedValue)}
                </div>
              </div>
              <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
                <div className="text-xs text-[var(--muted-foreground)]">{t.pages.stats.topCategory}</div>
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
