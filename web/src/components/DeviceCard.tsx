'use client';

import Link from "next/link";
import { API_BASE_URL } from "../lib/config";
import { useIsDarkMode } from "../lib/useIsDarkMode";
import { pickThumbnail } from "../lib/pickThumbnail";

interface DeviceCardProps {
    device: {
        id: number;
        name: string;
        additionalName: string | null;
        manufacturer: string;
        modelNumber: string;
        releaseYear?: number | null;
        status: string;
        functionalStatus: string;
        condition?: string | null;
        rarity?: string | null;
        isAssetTagged?: boolean;
        estimatedValue?: number | null;
        listPrice?: number | null;
        soldPrice?: number | null;
        category: {
            name: string;
            type: string;
        };
        images: {
            path: string;
            thumbnailPath?: string | null;
            isThumbnail: boolean;
            thumbnailMode?: string | null;
        }[];
        isFavorite?: boolean;
        accessories?: Array<{id: number, name: string}>;
        isPramBatteryRemoved?: boolean;
    };
}

function conditionLabel(condition: string): string {
    const labels: Record<string, string> = {
        NEW: "New",
        LIKE_NEW: "Like New",
        VERY_GOOD: "Very Good",
        GOOD: "Good",
        ACCEPTABLE: "Acceptable",
        FOR_PARTS: "For Parts",
    };
    return labels[condition] ?? condition;
}

export function DeviceCard({ device }: DeviceCardProps) {
    const isDark = useIsDarkMode();
    const thumbImage = pickThumbnail(device.images, isDark);
    const thumbnail = thumbImage?.thumbnailPath || thumbImage?.path;

    const getFunctionalStatusIcon = (status: string) => {
        switch (status) {
            case 'YES':
                return (
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-green-600 dark:text-green-400">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case 'PARTIAL':
                return (
                    <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                        <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-yellow-600 dark:text-yellow-400">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            case 'NO':
                return (
                    <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-600 dark:text-red-400">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                );
            default:
                return null;
        }
    };

    const getStatusIcons = () => {
        return (
            <div className="flex gap-1">
                {/* Favorite indicator */}
                {device.isFavorite && (
                    <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center" title="Favorite">
                        <span className="text-yellow-600 dark:text-yellow-400 text-xs">★</span>
                    </div>
                )}

                {/* Original Box indicator */}
                {device.accessories?.some((a: any) => a.name === 'Original Box') && (
                    <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center" title="Has Original Box">
                        <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-purple-600 dark:text-purple-400">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                )}

                {/* PRAM Battery indicator - only for computers */}
                {device.category.type === "COMPUTER" && !device.isPramBatteryRemoved && (
                    <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center" title="PRAM Battery Not Removed">
                        <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-600 dark:text-red-400">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                )}
            </div>
        );
    };

    // Format currency
    const formatPrice = (price: number | null | undefined) => {
        if (price == null) return null;
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    // Value/Sale info line component
    const ValueSaleInfo = () => {
        switch (device.status) {
            case 'COLLECTION':
                return device.estimatedValue ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                        Est. Value: {formatPrice(device.estimatedValue)}
                    </span>
                ) : null;
            case 'FOR_SALE':
                return (
                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                        For Sale: {formatPrice(device.listPrice) || 'TBD'}
                    </span>
                );
            case 'PENDING_SALE':
                return (
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                        Pending: {formatPrice(device.listPrice) || 'TBD'}
                    </span>
                );
            case 'SOLD':
                return (
                    <span className="text-red-600 dark:text-red-400 font-medium">
                        Sold: {formatPrice(device.soldPrice) || 'N/A'}
                    </span>
                );
            case 'DONATED':
                return (
                    <span className="text-purple-600 dark:text-purple-400 font-medium">
                        Donated
                    </span>
                );
            case 'IN_REPAIR':
                return (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                        In Repair
                    </span>
                );
            case 'RETURNED':
                return (
                    <span className="text-teal-600 dark:text-teal-400 font-medium">
                        Returned
                    </span>
                );
            default:
                return null;
        }
    };

    // Shared status icons component for both desktop and mobile
    const StatusIconsRow = () => (
        <div className="flex items-center gap-2">
            {/* Functional Status - thumbs up/caution/thumbs down */}
            {device.functionalStatus === 'YES' && (
                <span title="Functional: YES">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z"/>
                    </svg>
                </span>
            )}
            {device.functionalStatus === 'PARTIAL' && (
                <span title="Functional: PARTIAL">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>
                </span>
            )}
            {device.functionalStatus === 'NO' && (
                <span title="Functional: NO">
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
                    </svg>
                </span>
            )}

            {/* Rarity - diamond icon, only shown when rarity is set */}
            {device.rarity && (() => {
                const rarityColors: Record<string, string> = {
                    COMMON: 'text-gray-400 dark:text-gray-500',
                    UNCOMMON: 'text-yellow-400',
                    RARE: 'text-green-500',
                    VERY_RARE: 'text-blue-500',
                    EXTREMELY_RARE: 'text-purple-500',
                };
                const rarityLabels: Record<string, string> = {
                    COMMON: 'Common',
                    UNCOMMON: 'Uncommon',
                    RARE: 'Rare',
                    VERY_RARE: 'Very Rare',
                    EXTREMELY_RARE: 'Extremely Rare',
                };
                const color = rarityColors[device.rarity] ?? 'text-gray-400';
                const label = rarityLabels[device.rarity] ?? device.rarity;
                return (
                    <span title={`Rarity: ${label}`}>
                        <svg className={`w-4 h-4 ${color}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5 20v-2h14v2H5zm0-4V9l3 3 4-6 4 6 3-3v7H5z"/>
                        </svg>
                    </span>
                );
            })()}

            {/* Asset Tagged - tag icon */}
            <span title={device.isAssetTagged ? 'Asset Tagged' : 'Not Asset Tagged'}>
                <svg 
                    className={`w-4 h-4 ${device.isAssetTagged ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`} 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
                </svg>
            </span>

            {/* Original Box - box icon */}
            <span title={device.accessories?.some((a: any) => a.name === 'Original Box') ? 'Has Original Box' : 'No Original Box'}>
                <svg
                    className={`w-4 h-4 ${device.accessories?.some((a: any) => a.name === 'Original Box') ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            </span>

            {/* PRAM Battery - battery icon, only for computers */}
            {device.category.type === 'COMPUTER' && (
                <span title={device.isPramBatteryRemoved ? 'PRAM Battery Removed' : 'PRAM Battery NOT Removed'}>
                    <svg 
                        className={`w-4 h-4 ${device.isPramBatteryRemoved ? 'text-green-500' : 'text-red-500'}`} 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
                    </svg>
                </span>
            )}

            {/* Favorite - star icon */}
            <span title={device.isFavorite ? 'Favorite' : 'Not a Favorite'}>
                <svg
                    className={`w-4 h-4 ${device.isFavorite ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
            </span>
        </div>
    );

    const DesktopCard = () => (
        <div className="flex overflow-hidden rounded border border-[var(--border)] bg-[var(--card)] shadow-sm transition-shadow hover:shadow-md h-full flex-col card-retro">
            <div className="aspect-square w-full bg-[var(--muted)] object-cover relative overflow-hidden">
                <div className="flex h-full items-center justify-center text-[var(--muted-foreground)]">
                    {thumbnail ? (
                        <img
                            src={`${API_BASE_URL}${thumbnail}`}
                            alt={device.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105 rounded-lg"
                        />
                    ) : (
                        <span className="text-xs">No Image</span>
                    )}
                </div>
                <div className="absolute top-1 right-1 flex flex-col items-end gap-1">
                    <span
                        className={`text-[10px] font-bold px-1 py-0.5 rounded shadow-sm bg-gray-700 ${
                            device.status === "COLLECTION" ? "text-[var(--apple-green)]" :
                            device.status === "SOLD" ? "text-red-500" :
                            device.status === "PENDING_SALE" ? "text-yellow-500" :
                            device.status === "FOR_SALE" ? "text-orange-500" :
                            device.status === "DONATED" ? "text-purple-500" :
                            device.status === "IN_REPAIR" ? "text-teal-500" :
                            device.status === "RETURNED" ? "text-red-500" :
                            "text-[var(--muted-foreground)]"
                        }`}
                    >
                        {device.status}
                    </span>
                </div>
            </div>
            <div className="p-2 flex-1 flex flex-col">
                <div className="mb-1">
                    <span className="text-[10px] font-medium uppercase text-[var(--muted-foreground)] bg-[var(--muted)] px-1 py-0.5 rounded">
                        {device.category.name}{device.releaseYear ? ` • ${device.releaseYear}` : ''}
                    </span>
                </div>
                <h2 className="line-clamp-1 text-sm font-semibold mb-0.5 text-[var(--foreground)] group-hover:text-[var(--apple-blue)] transition-colors">
                    {device.name}
                </h2>
                <p className="line-clamp-1 text-xs text-[var(--muted-foreground)] mb-1">
                    {device.additionalName || `${device.manufacturer || ''} ${device.modelNumber || ''}`.trim() || ''}
                </p>
                {device.condition && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {conditionLabel(device.condition)}
                    </p>
                )}
                <div className="text-xs mb-1">
                    <ValueSaleInfo />
                </div>
                <div className="mt-auto flex items-center justify-center gap-0.5">
                    <StatusIconsRow />
                </div>
            </div>
        </div>
    );

    return (
        <Link href={`/devices/${device.id}`} className="block group">
            <DesktopCard />
        </Link>
    );
}
