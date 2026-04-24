"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { API_BASE_URL } from "../../../lib/config";
import { LoadingPanel } from "../../../components/LoadingPanel";
import { useT } from "../../../i18n/context";

const GET_DELETED_DEVICES = gql`
  query GetDeletedDevices {
    devices(where: { deleted: { equals: true } }) {
      id
      name
      additionalName
      dateAcquired
      category {
        id
        name
      }
      images {
        id
        path
        thumbnailPath
        isThumbnail
        thumbnailMode
      }
    }
  }
`;

const RESTORE_DEVICE = gql`
  mutation RestoreDevice($id: Int!) {
    restoreDevice(id: $id) {
      id
      name
    }
  }
`;

const PERMANENTLY_DELETE_DEVICE = gql`
  mutation PermanentlyDeleteDevice($id: Int!) {
    permanentlyDeleteDevice(id: $id)
  }
`;

export default function TrashPage() {
  const t = useT();
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_DELETED_DEVICES);
  const [restoreDevice, { loading: restoring }] = useMutation(RESTORE_DEVICE);
  const [permanentlyDeleteDevice, { loading: deleting }] = useMutation(PERMANENTLY_DELETE_DEVICE);

  const deletedDevices = data?.devices || [];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleRestore = async (id: number) => {
    try {
      await restoreDevice({ variables: { id } });
      refetch();
    } catch (err) {
      console.error("Failed to restore device:", err);
      alert("Failed to restore device. Please try again.");
    }
  };

  const handlePermanentDelete = async (id: number) => {
    try {
      await permanentlyDeleteDevice({ variables: { id } });
      setConfirmDelete(null);
      refetch();
    } catch (err) {
      console.error("Failed to permanently delete device:", err);
      alert("Failed to permanently delete device. Please try again.");
    }
  };

  return (
    <div className="min-h-screen font-sans">
      <header className="sticky top-0 z-30 bg-[var(--card)] border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)]">{t.pages.trash.title}</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {t.pages.trash.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="btn-retro text-sm px-3 py-1.5">
              {t.common.back}
            </Link>
          </div>
        </div>
      </header>

      <main className="p-4">
        {loading && (
          <div className="p-8">
            <LoadingPanel title={t.pages.trash.loading} subtitle={t.pages.trash.loadingSubtitle} />
          </div>
        )}

        {error && (
          <div className="text-center text-red-500 p-8">
            Error loading devices: {error.message}
          </div>
        )}

        {!loading && !error && deletedDevices.length === 0 && (
          <div className="text-center text-[var(--muted-foreground)] p-8 border-2 border-dashed border-[var(--border)] rounded">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <p className="text-lg font-medium">{t.pages.trash.emptyTitle}</p>
            <p className="text-sm mt-1">{t.pages.trash.emptyText}</p>
          </div>
        )}

        {!loading && !error && deletedDevices.length > 0 && (
          <div className="bg-[var(--card)] rounded border border-[var(--border)] overflow-hidden card-retro">
            <div className="px-4 py-3 bg-[var(--muted)] border-b border-[var(--border)]">
              <p className="text-sm text-[var(--muted-foreground)]">
                {deletedDevices.length} {deletedDevices.length !== 1 ? t.pages.trash.deletedDevices : t.pages.trash.deletedDevice}
              </p>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {deletedDevices.map((device: any) => {
                const thumbImage = device.images?.find((i: any) => i.isThumbnail);
                const thumbnail = thumbImage?.thumbnailPath || thumbImage?.path;
                const isConfirming = confirmDelete === device.id;

                return (
                  <div
                    key={device.id}
                    className="flex items-center gap-4 p-4 hover:bg-[var(--muted)]"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 bg-[var(--muted)] rounded overflow-hidden flex-shrink-0">
                      {thumbnail ? (
                        <img
                          src={`${API_BASE_URL}${thumbnail}`}
                          alt={device.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            width="16"
                            height="16"
                            className="text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Device info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[var(--muted-foreground)]">
                          #{device.id}
                        </span>
                        <span className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded">
                          {device.category?.name || t.pages.trash.unknownCategory}
                        </span>
                      </div>
                      <p className="font-medium text-[var(--foreground)] truncate">
                        {device.name}
                      </p>
                      {device.additionalName && (
                        <p className="text-sm text-[var(--muted-foreground)] truncate">
                          {device.additionalName}
                        </p>
                      )}
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {t.pages.trash.acquiredLabel} {formatDate(device.dateAcquired)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isConfirming ? (
                        <>
                          <span className="text-sm text-red-600 dark:text-red-400 mr-2">
                            {t.pages.trash.confirmDelete}
                          </span>
                          <button
                            onClick={() => handlePermanentDelete(device.id)}
                            disabled={deleting}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--apple-red)] hover:brightness-110 disabled:opacity-50 rounded border border-[#c02020]"
                          >
                            {deleting ? t.common.deleting : t.pages.trash.yesDelete}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="btn-retro px-3 py-1.5 text-sm font-medium"
                          >
                            {t.common.cancel}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRestore(device.id)}
                            disabled={restoring}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--apple-green)] hover:brightness-110 disabled:opacity-50 rounded border border-[#4a9c2e]"
                          >
                            {t.pages.trash.restore}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(device.id)}
                            className="px-3 py-1.5 text-sm font-medium text-[var(--apple-red)] bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded border border-[var(--apple-red)]"
                          >
                            {t.pages.trash.deleteForever}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
