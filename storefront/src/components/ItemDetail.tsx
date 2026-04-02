"use client";

import { useQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "../lib/config";
import { LoadingPanel } from "./LoadingPanel";

const RECORD_DEVICE_VIEW = gql`
  mutation RecordDeviceView($deviceId: Int!) {
    recordDeviceView(deviceId: $deviceId)
  }
`;

const GET_SHOP_DEVICE = gql`
  query GetShopDevice($where: DeviceWhereInput!) {
    device(where: $where) {
      id
      name
      additionalName
      manufacturer
      modelNumber
      releaseYear
      info
      status
      functionalStatus
      condition
      rarity
      listPrice
      soldPrice
      soldDate
      cpu
      ram
      graphics
      storage
      operatingSystem
      isWifiEnabled
      accessories {
        id
        name
      }
      links {
        id
        label
        url
      }
      category {
        id
        name
        type
      }
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
      maintenanceTasks {
        id
        label
        dateCompleted
        notes
      }
      customFieldValues {
        id
        customFieldId
        customFieldName
        value
        isPublic
        sortOrder
      }
    }
  }
`;

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        FOR_SALE: "status-for-sale",
        PENDING_SALE: "status-pending",
        SOLD: "status-sold",
    };
    const labels: Record<string, string> = {
        FOR_SALE: "For Sale",
        PENDING_SALE: "Pending Sale",
        SOLD: "Sold",
    };
    return (
        <span className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-semibold ${styles[status] || ''}`}>
            {labels[status] || status}
        </span>
    );
}

function FunctionalBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        YES: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400",
        PARTIAL: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-400",
        NO: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400",
    };
    const labels: Record<string, string> = {
        YES: "Fully Functional",
        PARTIAL: "Partially Functional",
        NO: "For Parts / Not Working",
    };
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || styles.YES}`}>
            {labels[status] || status}
        </span>
    );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    if (!value) return null;
    return (
        <div className="flex justify-between py-3 border-b border-[var(--border)] last:border-0">
            <dt className="text-sm text-[var(--muted-foreground)]">{label}</dt>
            <dd className="text-sm font-medium text-[var(--foreground)]">{value}</dd>
        </div>
    );
}

function formatDateForDisplay(dateString: string): string {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return 'Invalid date';
    }
}

interface ItemDetailProps {
    id: string;
    contactEmail: string;
}

export default function ItemDetail({ id, contactEmail }: ItemDetailProps) {
    const [selectedImage, setSelectedImage] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxZoom, setLightboxZoom] = useState(1);
    const [recordView] = useMutation(RECORD_DEVICE_VIEW);
    const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
    const lightboxContainerRef = useRef<HTMLDivElement | null>(null);
    const lastPointerOffsetRef = useRef<{ x: number; y: number } | null>(null);

    const { loading, error, data } = useQuery(GET_SHOP_DEVICE, {
        variables: {
            where: {
                id: parseInt(id as string),
                deleted: { equals: false },
                status: { in: ['FOR_SALE', 'PENDING_SALE', 'SOLD'] }
            }
        },
        skip: !id,
        fetchPolicy: "cache-and-network",
    });

    useEffect(() => {
        if (data?.device) {
            const d = data.device;
            // Record view for popularity tracking
            recordView({ variables: { deviceId: d.id } }).catch(() => {});
            // Track analytics event
            if (typeof window !== 'undefined' && (window as any).umami) {
                const name = d.additionalName ? `${d.name} ${d.additionalName}` : d.name;
                (window as any).umami.track('device-view', {
                    deviceId: d.id,
                    deviceName: name,
                    category: d.category?.name || 'Unknown',
                    status: d.status,
                });
            }
        }
    }, [data?.device?.id]);

    const applyLightboxZoom = useCallback(
        (getNextZoom: (prevZoom: number) => number, anchorOffset?: { x: number; y: number }) => {
            setLightboxZoom((prevZoom) => {
                const nextZoom = Math.min(6, Math.max(1, getNextZoom(prevZoom)));
                setLightboxPan((prevPan) => {
                    if (nextZoom <= 1.01) return { x: 0, y: 0 };
                    const anchor = anchorOffset ?? lastPointerOffsetRef.current ?? { x: 0, y: 0 };
                    const ratio = nextZoom / prevZoom;
                    return {
                        x: prevPan.x * ratio + anchor.x * (1 - ratio),
                        y: prevPan.y * ratio + anchor.y * (1 - ratio),
                    };
                });
                return nextZoom;
            });
        },
        []
    );

    useEffect(() => {
        if (!isLightboxOpen) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [isLightboxOpen]);

    useEffect(() => {
        if (!isLightboxOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setIsLightboxOpen(false);
                return;
            }
            if (e.key === '+' || e.key === '=' || e.key === '-') {
                e.preventDefault();
                applyLightboxZoom((prev) => (e.key === '-' ? prev / 1.2 : prev * 1.2));
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [applyLightboxZoom, isLightboxOpen]);

    if (loading) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="container mx-auto px-4 py-16">
                    <LoadingPanel title="Loading item..." subtitle="Fetching details" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="container mx-auto px-4 py-16 text-center">
                    <div className="inline-flex items-center justify-center rounded-full bg-red-100 mb-4" style={{ width: 48, height: 48 }}>
                        <svg width="24" height="24" className="text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-[var(--foreground)] font-medium">Something went wrong</p>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">{error.message}</p>
                </div>
            </div>
        );
    }

    if (!data?.device) {
        return (
            <div className="min-h-screen">
                <Header />
                <div className="container mx-auto px-4 py-16 text-center">
                    <div className="inline-flex items-center justify-center rounded-full bg-gray-100 mb-4" style={{ width: 48, height: 48 }}>
                        <svg width="24" height="24" className="text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-[var(--foreground)] font-medium">Item not found</p>
                    <Link href="/" className="text-sm text-[var(--apple-blue)] hover:underline mt-2 inline-block">
                        Return to shop
                    </Link>
                </div>
            </div>
        );
    }

    const device = data.device;
    const images = device.images || [];

    // Only show shop images in the storefront (images marked as isShopImage)
    const shopImages = [...images]
        .filter((i: any) => i.isShopImage)
        .sort((a: any, b: any) => {
            return new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime();
        });

    // Fall back to thumbnail if no shop images exist
    const thumbnailImage = images.find((i: any) => i.isThumbnail);
    const displayImages = shopImages.length > 0 ? shopImages : (thumbnailImage ? [thumbnailImage] : []);
    const currentImage = displayImages[selectedImage] || displayImages[0];

    const formatPrice = (price: number | null | undefined) => {
        if (price == null) return null;
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const getPriceDisplay = () => {
        switch (device.status) {
            case 'FOR_SALE':
                return (
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {formatPrice(device.listPrice) || 'Contact for Price'}
                    </div>
                );
            case 'PENDING_SALE':
                return (
                    <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                        {formatPrice(device.listPrice) || 'Pending'}
                    </div>
                );
            case 'SOLD':
                return (
                    <div className="text-3xl font-bold text-gray-500 dark:text-gray-400 line-through">
                        {formatPrice(device.soldPrice || device.listPrice) || 'Sold'}
                    </div>
                );
            default:
                return null;
        }
    };

    const openLightbox = () => {
        if (!currentImage || currentImage.isThumbnail) return;
        setLightboxZoom(1);
        setLightboxPan({ x: 0, y: 0 });
        setIsLightboxOpen(true);
    };

    return (
        <div className="min-h-screen">
            <Header />

            <main className="container mx-auto px-4 py-6">
                {/* Back Link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-6 group"
                >
                    <svg width="16" height="16" className="transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Shop
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Images */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="group relative aspect-square w-full rounded-xl bg-[var(--muted)] overflow-hidden card-retro">
                            {currentImage ? (
                                <img
                                    src={`${API_BASE_URL}${currentImage.path}`}
                                    alt={currentImage.caption || device.name}
                                    className={`h-full w-full object-contain ${currentImage.isThumbnail ? "" : "cursor-zoom-in"}`}
                                    onClick={currentImage.isThumbnail ? undefined : openLightbox}
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                    <svg width="64" height="64" className="text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}

                            {/* Image Navigation */}
                            {displayImages.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedImage((prev) => (prev - 1 + displayImages.length) % displayImages.length)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-[var(--card)]/80 p-2 text-[var(--foreground)] shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--card)]"
                                    >
                                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedImage((prev) => (prev + 1) % displayImages.length)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[var(--card)]/80 p-2 text-[var(--foreground)] shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--card)]"
                                    >
                                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnail Strip */}
                        {displayImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {displayImages.map((img: any, idx: number) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden transition-all ${
                                            selectedImage === idx
                                                ? "ring-2 ring-[var(--apple-blue)] ring-offset-2 ring-offset-[var(--background)]"
                                                : "opacity-70 hover:opacity-100"
                                        }`}
                                    >
                                        <img
                                            src={`${API_BASE_URL}${img.thumbnailPath || img.path}`}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Details */}
                    <div className="space-y-6">
                        {/* Header */}
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-xs font-medium uppercase text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded">
                                    {device.category.name}
                                </span>
                                <StatusBadge status={device.status} />
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-1">
                                {device.name}
                            </h1>

                            {device.additionalName && (
                                <p className="text-lg text-[var(--muted-foreground)]">
                                    {device.additionalName}
                                </p>
                            )}
                        </div>

                        {/* Price */}
                        <div className="p-4 bg-[var(--card)] rounded-lg border border-[var(--border)] card-retro">
                            {getPriceDisplay()}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <FunctionalBadge status={device.functionalStatus} />
                                {(device.rarity === "VERY_RARE" || device.rarity === "EXTREMELY_RARE") && (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                        ✦ {device.rarity === "EXTREMELY_RARE" ? "Extremely Rare" : "Very Rare"}
                                    </span>
                                )}
                                {device.accessories?.map((acc: any) => (
                                    <span key={acc.id} className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                                        {acc.name === 'Original Box' && (
                                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        )}
                                        {acc.name}
                                    </span>
                                ))}
                            </div>
                            {device.status === 'SOLD' && device.soldDate && (
                                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                                    Sold on {formatDateForDisplay(device.soldDate)}
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        {device.info && (
                            <div className="p-4 bg-[var(--card)] rounded-lg border border-[var(--border)] card-retro">
                                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-2">Description</h2>
                                <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">
                                    {device.info}
                                </p>
                            </div>
                        )}

                        {/* Specifications */}
                        <div className="p-4 bg-[var(--card)] rounded-lg border border-[var(--border)] card-retro">
                            <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">Specifications</h2>
                            <dl>
                                <DetailRow label="Condition" value={device.condition ? (
                                    device.condition === "NEW" ? "New" :
                                    device.condition === "LIKE_NEW" ? "Like New" :
                                    device.condition === "VERY_GOOD" ? "Very Good" :
                                    device.condition === "GOOD" ? "Good" :
                                    device.condition === "ACCEPTABLE" ? "Acceptable" :
                                    device.condition === "FOR_PARTS" ? "For Parts" :
                                    device.condition
                                ) : null} />
                                <DetailRow label="Manufacturer" value={device.manufacturer} />
                                <DetailRow label="Model" value={device.modelNumber} />
                                <DetailRow label="Release Year" value={device.releaseYear} />
                                {device.category.type === 'COMPUTER' && (
                                    <>
                                        <DetailRow label="CPU" value={device.cpu} />
                                        <DetailRow label="RAM" value={device.ram} />
                                        <DetailRow label="Graphics" value={device.graphics} />
                                        <DetailRow label="Storage" value={device.storage} />
                                        <DetailRow label="Operating System" value={device.operatingSystem} />
                                        <DetailRow label="Wi-Fi" value={device.isWifiEnabled ? 'Yes' : device.isWifiEnabled === false ? 'No' : null} />
                                    </>
                                )}
                            </dl>
                        </div>

                        {/* Custom Fields */}
                        {device.customFieldValues && device.customFieldValues.length > 0 && (
                            <div className="p-4 bg-[var(--card)] rounded-lg border border-[var(--border)] card-retro">
                                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">Additional Details</h2>
                                <dl>
                                    {[...device.customFieldValues].sort((a: any, b: any) => a.sortOrder - b.sortOrder || a.customFieldName.localeCompare(b.customFieldName)).map((cfv: any) => (
                                        <DetailRow key={cfv.id} label={cfv.customFieldName} value={cfv.value} />
                                    ))}
                                </dl>
                            </div>
                        )}

                        {/* Service History */}
                        {device.maintenanceTasks && device.maintenanceTasks.length > 0 && (
                            <div className="p-4 bg-[var(--card)] rounded-lg border border-[var(--border)] card-retro">
                                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-emerald-600 dark:text-emerald-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Service History
                                </h2>
                                <ul className="space-y-2">
                                    {device.maintenanceTasks.map((task: any) => (
                                        <li key={task.id} className="flex items-start gap-3 text-sm">
                                            <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-medium text-[var(--foreground)]">{task.label}</span>
                                                    <span className="text-xs text-[var(--muted-foreground)]">
                                                        {formatDateForDisplay(task.dateCompleted)}
                                                    </span>
                                                </div>
                                                {task.notes && (
                                                    <p className="text-[var(--muted-foreground)] mt-0.5">{task.notes}</p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Reference Links */}
                        {device.links && device.links.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {device.links.map((link: any) => (
                                    <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm text-[var(--apple-blue)] hover:underline"
                                    >
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        )}

                        {/* Contact CTA */}
                        {device.status === 'FOR_SALE' && (
                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                <p className="text-sm text-orange-800 dark:text-orange-200">
                                    Interested in this item? Contact us at{" "}
                                    <a
                                        href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Inquiry about ${device.name}${device.additionalName ? ` ${device.additionalName}` : ''}`)}&body=${encodeURIComponent(`Hi,\n\nI'm interested in the ${device.name}${device.additionalName ? ` ${device.additionalName}` : ''} listed on your shop.\n\nListing: ${typeof window !== 'undefined' ? window.location.href : ''}\n`)}`}
                                        className="font-medium underline hover:no-underline"
                                    >
                                        {contactEmail}
                                    </a>
                                    {" "}for more details or to arrange a purchase.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Lightbox */}
            {isLightboxOpen && currentImage && (
                <div
                    ref={lightboxContainerRef}
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img
                        src={`${API_BASE_URL}${currentImage.path}`}
                        alt={currentImage.caption || device.name}
                        className="max-h-[90vh] max-w-[90vw] object-contain"
                        style={{
                            transform: `scale(${lightboxZoom}) translate(${lightboxPan.x / lightboxZoom}px, ${lightboxPan.y / lightboxZoom}px)`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}

function Header() {
    return (
        <header className="bg-[var(--card)] border-b border-[var(--border)]">
            <div className="rainbow-stripe"></div>
            <div className="container mx-auto px-4 py-4">
                <Link href="/" className="flex items-center gap-3">
                    <img src="/logo.png" alt="Shop" width={36} height={36} />
                    <div>
                        <h1 className="text-xl font-light tracking-tight">
                            <span style={{ color: '#5EBD3E' }}>Inv</span>
                            <span style={{ color: '#FFB900' }}>ent</span>
                            <span style={{ color: '#F78200' }}>ory</span>
                            <span style={{ color: '#E23838' }}>Dif</span>
                            <span style={{ color: '#973999' }}>fer</span>
                            <span style={{ color: '#009CDF' }}>ent</span>
                            <span className="text-[var(--muted-foreground)] ml-2 font-normal">Shop</span>
                        </h1>
                    </div>
                </Link>
            </div>
        </header>
    );
}
