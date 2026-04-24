"use client";

import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { LoadingPanel } from "../../../components/LoadingPanel";
import { useT } from "../../../i18n/context";

const GET_SYSTEM_USAGE = gql`
  query GetSystemUsage {
    systemUsage {
      deviceCount
      noteCount
      taskCount
      imageCount
      categoryCount
      templateCount
      tagCount
      totalStorageBytes
    }
  }
`;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function UsagePage() {
  const t = useT();
  const { loading, error, data } = useQuery(GET_SYSTEM_USAGE);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <LoadingPanel title={t.pages.usage.loading} subtitle={t.pages.usage.loadingSubtitle} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center text-red-500">Error loading usage data: {error.message}</div>
        </div>
      </div>
    );
  }

  const usage = data?.systemUsage;

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-[var(--foreground)]">{t.pages.usage.title}</h1>
            <p className="text-sm text-[var(--muted-foreground)]">{t.pages.usage.subtitle}</p>
          </div>
          <Link
            href="/"
            className="btn-retro inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--foreground)]"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t.common.back}
          </Link>
        </header>

        <section className="rounded border border-[var(--border)] bg-[var(--card)] p-6 card-retro">
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.pages.usage.dataCounts}</h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
              <div className="text-xs text-[var(--muted-foreground)]">{t.pages.usage.devices}</div>
              <div className="mt-1 text-3xl font-light tabular-nums text-[var(--foreground)]">
                {usage?.deviceCount ?? 0}
              </div>
            </div>
            <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
              <div className="text-xs text-[var(--muted-foreground)]">{t.pages.usage.images}</div>
              <div className="mt-1 text-3xl font-light tabular-nums text-[var(--foreground)]">
                {usage?.imageCount ?? 0}
              </div>
            </div>
            <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
              <div className="text-xs text-[var(--muted-foreground)]">{t.common.notes}</div>
              <div className="mt-1 text-3xl font-light tabular-nums text-[var(--foreground)]">
                {usage?.noteCount ?? 0}
              </div>
            </div>
            <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
              <div className="text-xs text-[var(--muted-foreground)]">{t.pages.usage.maintenanceTasks}</div>
              <div className="mt-1 text-3xl font-light tabular-nums text-[var(--foreground)]">
                {usage?.taskCount ?? 0}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
              <div className="text-xs text-[var(--muted-foreground)]">{t.pages.usage.categories}</div>
              <div className="mt-1 text-2xl font-light tabular-nums text-[var(--foreground)]">
                {usage?.categoryCount ?? 0}
              </div>
            </div>
            <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
              <div className="text-xs text-[var(--muted-foreground)]">{t.pages.usage.templates}</div>
              <div className="mt-1 text-2xl font-light tabular-nums text-[var(--foreground)]">
                {usage?.templateCount ?? 0}
              </div>
            </div>
            <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
              <div className="text-xs text-[var(--muted-foreground)]">{t.pages.usage.tags}</div>
              <div className="mt-1 text-2xl font-light tabular-nums text-[var(--foreground)]">
                {usage?.tagCount ?? 0}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded border border-[var(--border)] bg-[var(--card)] p-6 card-retro">
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.pages.usage.storage}</h2>

          <div className="rounded border border-[var(--border)] p-4 bg-[var(--background)]">
            <div className="text-xs text-[var(--muted-foreground)]">{t.pages.usage.totalImageStorage}</div>
            <div className="mt-1 text-3xl font-light tabular-nums text-[var(--foreground)]">
              {formatBytes(usage?.totalStorageBytes ?? 0)}
            </div>
            <div className="mt-1 text-xs text-[var(--muted-foreground)]">
              {(usage?.totalStorageBytes ?? 0).toLocaleString()} {t.pages.usage.bytes}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
