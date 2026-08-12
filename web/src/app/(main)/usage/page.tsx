"use client";

import { useQuery, useLazyQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useState } from "react";
import { LoadingPanel } from "../../../components/LoadingPanel";
import { useT } from "../../../i18n/context";
import { useAuth } from "../../../lib/auth-context";
import { useRequireAuth } from "../../../lib/useRequireAuth";
import { API_BASE_URL } from "../../../lib/config";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
function isImagePath(p: string) {
  const ext = p.slice(p.lastIndexOf(".")).toLowerCase();
  return IMAGE_EXTS.has(ext);
}

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

const GET_ORPHANED_FILES = gql`
  query GetOrphanedFiles {
    orphanedFiles {
      path
      sizeBytes
    }
  }
`;

const DELETE_ORPHANED_FILES = gql`
  mutation DeleteOrphanedFiles($paths: [String!]!) {
    deleteOrphanedFiles(paths: $paths)
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
  const redirecting = useRequireAuth();
  const { isAuthenticated } = useAuth();
  const { loading, error, data } = useQuery(GET_SYSTEM_USAGE);

  // Orphaned files state
  type OrphanedFile = { path: string; sizeBytes: number };
  const [scanState, setScanState] = useState<"idle" | "loading" | "done">("idle");
  const [orphans, setOrphans] = useState<OrphanedFile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmingPath, setConfirmingPath] = useState<string | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const [scanOrphans] = useLazyQuery(GET_ORPHANED_FILES, {
    fetchPolicy: "network-only",
    onCompleted: (d) => {
      setOrphans(d.orphanedFiles ?? []);
      setSelected(new Set());
      setScanState("done");
    },
    onError: () => setScanState("idle"),
  });

  const [deleteOrphanedFiles, { loading: deleting }] = useMutation(DELETE_ORPHANED_FILES);

  function handleScan() {
    setScanState("loading");
    setOrphans([]);
    setSelected(new Set());
    scanOrphans();
  }

  function toggleSelect(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === orphans.length ? new Set() : new Set(orphans.map((o) => o.path))
    );
  }

  async function handleDeleteSingle(path: string) {
    if (confirmingPath !== path) {
      setConfirmingPath(path);
      return;
    }
    setConfirmingPath(null);
    await deleteOrphanedFiles({ variables: { paths: [path] } });
    setOrphans((prev) => prev.filter((o) => o.path !== path));
    setSelected((prev) => { const next = new Set(prev); next.delete(path); return next; });
  }

  async function handleDeleteBulk() {
    const paths = Array.from(selected);
    setShowBulkConfirm(false);
    await deleteOrphanedFiles({ variables: { paths } });
    setOrphans((prev) => prev.filter((o) => !selected.has(o.path)));
    setSelected(new Set());
  }

  const orphanTotalBytes = orphans.reduce((sum, o) => sum + o.sizeBytes, 0);

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

  if (redirecting) return <LoadingPanel title={t.nav.usage} />;

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-light text-[var(--foreground)] mb-6">{t.pages.usage.title}</h1>

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

        {/* Orphaned Files Section — auth-gated */}
        {isAuthenticated && <><section className="rounded border border-[var(--border)] bg-[var(--card)] p-6 card-retro">
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">{t.pages.usage.orphanedFiles}</h2>

          {scanState === "idle" && (
            <button
              onClick={handleScan}
              className="rounded border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              {t.pages.usage.scanButton}
            </button>
          )}

          {scanState === "loading" && (
            <div className="text-sm text-[var(--muted-foreground)]">Scanning…</div>
          )}

          {scanState === "done" && orphans.length === 0 && (
            <div className="space-y-3">
              <div className="text-sm text-green-600 dark:text-green-400">{t.pages.usage.noOrphansFound}</div>
              <button
                onClick={handleScan}
                className="rounded border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                {t.pages.usage.scanAgainButton}
              </button>
            </div>
          )}

          {scanState === "done" && orphans.length > 0 && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.size === orphans.length}
                    onChange={toggleAll}
                    className="cursor-pointer"
                  />
                  {t.pages.usage.selectAll}
                </label>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {orphans.length} {t.pages.usage.orphansSummary} · {formatBytes(orphanTotalBytes)}
                </span>
                <button
                  onClick={() => setShowBulkConfirm(true)}
                  disabled={selected.size === 0 || deleting}
                  className="rounded border border-red-400 px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors ml-auto"
                >
                  {t.pages.usage.deleteSelected} ({selected.size})
                </button>
              </div>

              {/* File list */}
              <div className="divide-y divide-[var(--border)] rounded border border-[var(--border)]">
                {orphans.map((orphan) => (
                  <div key={orphan.path} className="flex items-center gap-3 px-4 py-3 bg-[var(--background)]">
                    <input
                      type="checkbox"
                      checked={selected.has(orphan.path)}
                      onChange={() => toggleSelect(orphan.path)}
                      className="cursor-pointer flex-shrink-0"
                    />
                    {isImagePath(orphan.path) ? (
                      <img
                        src={`${API_BASE_URL}${orphan.path}`}
                        alt=""
                        className="flex-shrink-0 h-10 w-10 rounded object-cover bg-[var(--muted)]"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="flex-shrink-0 h-10 w-10 rounded bg-[var(--muted)] flex items-center justify-center text-[10px] text-[var(--muted-foreground)] font-mono">
                        {orphan.path.slice(orphan.path.lastIndexOf(".") + 1).toUpperCase()}
                      </div>
                    )}
                    <span className="flex-1 min-w-0 truncate text-sm font-mono text-[var(--foreground)]">
                      {orphan.path.replace("/uploads/", "")}
                    </span>
                    <span className="flex-shrink-0 text-xs text-[var(--muted-foreground)] tabular-nums">
                      {formatBytes(orphan.sizeBytes)}
                    </span>
                    <button
                      onClick={() => handleDeleteSingle(orphan.path)}
                      disabled={deleting}
                      className={`flex-shrink-0 rounded border px-3 py-1 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        confirmingPath === orphan.path
                          ? "border-red-500 bg-red-500 text-white hover:bg-red-600"
                          : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-red-400 hover:text-red-600"
                      }`}
                    >
                      {confirmingPath === orphan.path
                        ? t.pages.usage.confirmDeleteSingle
                        : "×"}
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleScan}
                className="rounded border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                {t.pages.usage.scanAgainButton}
              </button>
            </div>
          )}
        </section>

        {/* Bulk delete confirmation modal */}
        {showBulkConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                {t.pages.usage.confirmDeleteBulkTitle}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                {selected.size} {t.pages.usage.orphansSummary}. {t.pages.usage.confirmDeleteBulkBody}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowBulkConfirm(false)}
                  className="rounded border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBulk}
                  className="rounded border border-red-500 bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 transition-colors"
                >
                  {t.pages.usage.deleteSelected}
                </button>
              </div>
            </div>
          </div>
        )}</>}
      </div>
    </div>
  );
}
