"use client";

import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { LoadingPanel } from "../../../../components/LoadingPanel";
import { useT } from "../../../../i18n/context";
import { pickThumbnail } from "../../../../lib/pickThumbnail";
import { useIsDarkMode } from "../../../../lib/useIsDarkMode";
import { API_BASE_URL } from "../../../../lib/config";

const QRCodeSVG = dynamic(() => import("qrcode.react").then((m) => ({ default: m.QRCodeSVG })), { ssr: false });

const GET_LOCATION = gql`
  query GetLocation($id: Int!) {
    location(id: $id) {
      id
      name
      description
      deviceCount
    }
  }
`;

const GET_DEVICES_AT_LOCATION = gql`
  query GetDevicesAtLocation($locationId: Int!) {
    devices(where: { location: { id: { equals: $locationId } }, deleted: { equals: false } }) {
      id
      name
      additionalName
      manufacturer
      releaseYear
      status
      functionalStatus
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

export default function LocationDetailPage() {
  const t = useT();
  const params = useParams();
  const isDark = useIsDarkMode();
  const id = parseInt(params.id as string);

  const { data: locationData, loading: locationLoading } = useQuery(GET_LOCATION, {
    variables: { id },
    skip: !id,
  });

  const { data: devicesData, loading: devicesLoading } = useQuery(GET_DEVICES_AT_LOCATION, {
    variables: { locationId: id },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });

  const location = locationData?.location;
  const devices = devicesData?.devices ?? [];

  const locationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/locations/${id}`
    : `/locations/${id}`;

  if (locationLoading) {
    return (
      <div className="p-4">
        <LoadingPanel title={t.pages.locations.loading} subtitle={t.pages.locations.loadingSubtitle} />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen font-sans p-6">
        <p className="text-[var(--muted-foreground)]">Location not found.</p>
        <Link href="/locations" className="text-[var(--apple-blue)] hover:underline">&larr; Back to Locations</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans">
      <header className="mb-6 flex items-start justify-between border-b border-[var(--border)] pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)]">{location.name}</h1>
          {location.description && (
            <p className="text-sm text-[var(--muted-foreground)] mt-1">{location.description}</p>
          )}
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {location.deviceCount} {t.pages.locations.deviceCount.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          <Link href="/locations" className="btn-retro text-sm px-3 py-1.5">
            &larr; {t.pages.locations.title}
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* QR Code Card */}
        <div className="rounded border border-[var(--border)] bg-[var(--card)] p-6 card-retro flex flex-col items-center gap-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">{t.pages.locations.locationQrTitle}</h2>
          <p className="text-xs text-[var(--muted-foreground)] text-center">{t.pages.locations.locationQrSubtitle}</p>
          <div className="bg-white p-3 rounded">
            <QRCodeSVG value={locationUrl} size={160} level="M" />
          </div>
          <p className="text-xs text-[var(--muted-foreground)] font-mono break-all text-center">{locationUrl}</p>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(locationUrl)}
            className="btn-retro text-xs px-3 py-1"
          >
            Copy URL
          </button>
        </div>

        {/* Device List */}
        <div className="lg:col-span-2">
          {devicesLoading ? (
            <LoadingPanel title={t.pages.locations.loading} subtitle={t.pages.locations.loadingSubtitle} />
          ) : devices.length === 0 ? (
            <p className="text-[var(--muted-foreground)] text-sm">{t.pages.locations.noDevices}</p>
          ) : (
            <div className="overflow-hidden rounded border border-[var(--border)] card-retro">
              <table className="w-full text-sm">
                <thead className="bg-[var(--muted)] text-[var(--foreground)]">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium w-16"></th>
                    <th className="px-4 py-2 text-left font-medium">{t.common.name}</th>
                    <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">{t.sort.category}</th>
                    <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">{t.sort.releaseYear}</th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--card)]">
                  {devices.map((device: any) => {
                    const thumb = pickThumbnail(device.images, isDark) as any;
                    const thumbSrc = thumb?.thumbnailPath
                      ? `${API_BASE_URL}${thumb.thumbnailPath}`
                      : thumb?.path
                      ? `${API_BASE_URL}${thumb.path}`
                      : null;
                    return (
                      <tr key={device.id} className="border-t border-[var(--border)] hover:bg-[var(--muted)]">
                        <td className="px-2 py-2 w-16">
                          {thumbSrc ? (
                            <img src={thumbSrc} alt="" className="w-12 h-12 object-cover rounded aspect-square" />
                          ) : (
                            <div className="w-12 h-12 rounded bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)]">
                              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <Link href={`/devices/${device.id}`} className="text-[var(--apple-blue)] hover:underline font-medium">
                            {device.name}
                          </Link>
                          {device.additionalName && (
                            <span className="text-[var(--muted-foreground)] ml-1 text-xs">{device.additionalName}</span>
                          )}
                          {device.manufacturer && (
                            <p className="text-xs text-[var(--muted-foreground)]">{device.manufacturer}</p>
                          )}
                        </td>
                        <td className="px-4 py-2 hidden sm:table-cell text-[var(--muted-foreground)]">
                          {device.category?.name}
                        </td>
                        <td className="px-4 py-2 hidden sm:table-cell text-[var(--muted-foreground)] tabular-nums">
                          {device.releaseYear}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
