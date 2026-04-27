"use client";

import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ImageUploader } from "../../../../components/ImageUploader";
import { ImageGallery } from "../../../../components/ImageGallery";
import { GenerateImageModal } from "../../../../components/GenerateImageModal";
import { LoadingPanel } from "../../../../components/LoadingPanel";
import { useAuth } from "../../../../lib/auth-context";
import { API_BASE_URL } from "../../../../lib/config";
import { useT } from "../../../../i18n/context";

const GET_DEVICE_PHOTOS = gql`
  query GetDevicePhotos($where: DeviceWhereInput!) {
    device(where: $where) {
      id
      name
      images {
        id
        path
        thumbnailPath
        caption
        dateTaken
        isThumbnail
        thumbnailMode
        isShopImage
        isListingImage
      }
    }
  }
`;

export default function DevicePhotosPage() {
  const params = useParams();
  const id = params.id;
  const { isAuthenticated } = useAuth();
  const t = useT();
  const [showUploader, setShowUploader] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [openaiEnabled, setOpenaiEnabled] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/generate-image/config`)
      .then(r => r.json())
      .then(d => setOpenaiEnabled(!!d.enabled))
      .catch(() => {});
  }, []);

  const { loading, error, data, refetch } = useQuery(GET_DEVICE_PHOTOS, {
    variables: { where: { id: parseInt(id as string), deleted: { equals: false } } },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingPanel title={t.pages.photosPage.loadingTitle} subtitle={t.pages.photosPage.loadingSubtitle} />
      </div>
    );
  }

  if (error || !data?.device) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-on-surface-variant text-sm">{t.pages.photosPage.error}</p>
      </div>
    );
  }

  const device = data.device;
  const images = [...(device.images || [])].sort((a: any, b: any) => {
    if (a.isThumbnail !== b.isThumbnail) return a.isThumbnail ? -1 : 1;
    const aDate = a.dateTaken ? new Date(a.dateTaken).getTime() : 0;
    const bDate = b.dateTaken ? new Date(b.dateTaken).getTime() : 0;
    if (bDate !== aDate) return bDate - aDate;
    return b.id - a.id;
  });

  return (
    <div className="font-inter text-on-surface bg-[var(--background)]">
      {/* Back nav + upload button */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/devices/${id}`}
          className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors group"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          {device.name}
        </Link>
        {isAuthenticated && (
          <div className="flex items-center gap-2">
            {openaiEnabled && (
              <button
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container text-on-surface text-sm font-semibold rounded-xl hover:bg-surface-container-high transition-all active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {t.pages.photosPage.aiImage}
              </button>
            )}
            <button
              onClick={() => setShowUploader(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              {t.detail.addPhotos}
            </button>
          </div>
        )}
      </div>

      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">{t.detail.photos}</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          {images.length} {images.length !== 1 ? t.pages.photosPage.photoCountPlural : t.pages.photosPage.photoCount}
        </p>
      </div>

      {/* Legend (authenticated only) */}
      {isAuthenticated && images.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4 text-[11px] font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block" /> {t.pages.photosPage.legendThumbnailBoth}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-500 inline-block" /> {t.pages.photosPage.legendLightThumb}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-600 inline-block" /> {t.pages.photosPage.legendDarkThumb}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-500 inline-block" /> {t.pages.photosPage.legendListing}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600 inline-block" /> {t.pages.photosPage.legendShop}
          </span>
        </div>
      )}

      {/* Gallery */}
      <div className="bg-[var(--card)] rounded-xl p-6 shadow-sm">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 opacity-20">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
            <p className="text-sm">{t.pages.photosPage.noPhotosYet}</p>
            {isAuthenticated && (
              <button
                onClick={() => setShowUploader(true)}
                className="mt-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
              >
                {t.detail.addPhotos}
              </button>
            )}
          </div>
        ) : (
          <ImageGallery images={images} onImagesChanged={refetch} />
        )}
      </div>

      {/* Uploader modal */}
      {showUploader && (
        <ImageUploader
          deviceId={device.id}
          onUploadComplete={() => { refetch(); }}
          onClose={() => setShowUploader(false)}
        />
      )}

      {/* AI Generate modal */}
      {showGenerateModal && (
        <GenerateImageModal
          deviceId={device.id}
          images={images}
          onClose={() => setShowGenerateModal(false)}
          onGenerated={() => { refetch(); setShowGenerateModal(false); }}
        />
      )}
    </div>
  );
}
