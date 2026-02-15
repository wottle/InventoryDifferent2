import Link from "next/link";
import { API_BASE_URL } from "../lib/config";

interface ProductCardProps {
    device: {
        id: number;
        name: string;
        additionalName: string | null;
        manufacturer: string | null;
        modelNumber: string | null;
        releaseYear?: number | null;
        status: string;
        functionalStatus: string;
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
            isShopImage: boolean;
            isListingImage: boolean;
        }[];
    };
}

export function ProductCard({ device }: ProductCardProps) {
    // Prefer listing image, then first shop image, then thumbnail
    const listingImage = device.images.find((i) => i.isListingImage);
    const shopImage = device.images.find((i) => i.isShopImage);
    const thumbImage = device.images.find((i) => i.isThumbnail);
    const displayImage = listingImage || shopImage || thumbImage;
    const thumbnail = displayImage?.thumbnailPath || displayImage?.path;

    const formatPrice = (price: number | null | undefined) => {
        if (price == null) return null;
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const getStatusBadge = () => {
        const baseClasses = "text-xs font-semibold px-2 py-1 rounded bg-gray-900/75 backdrop-blur-sm";
        switch (device.status) {
            case 'FOR_SALE':
                return (
                    <span className={`${baseClasses} text-orange-400`}>
                        For Sale
                    </span>
                );
            case 'PENDING_SALE':
                return (
                    <span className={`${baseClasses} text-yellow-400`}>
                        Pending
                    </span>
                );
            case 'SOLD':
                return (
                    <span className={`${baseClasses} text-gray-300`}>
                        Sold
                    </span>
                );
            default:
                return null;
        }
    };

    const getPriceDisplay = () => {
        switch (device.status) {
            case 'FOR_SALE':
                return (
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {formatPrice(device.listPrice) || 'Contact for Price'}
                    </span>
                );
            case 'PENDING_SALE':
                return (
                    <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                        {formatPrice(device.listPrice) || 'Pending'}
                    </span>
                );
            case 'SOLD':
                return (
                    <span className="text-lg font-bold text-gray-500 dark:text-gray-400 line-through">
                        {formatPrice(device.soldPrice || device.listPrice) || 'Sold'}
                    </span>
                );
            default:
                return null;
        }
    };

    const getFunctionalBadge = () => {
        switch (device.functionalStatus) {
            case 'YES':
                return (
                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Working
                    </span>
                );
            case 'PARTIAL':
                return (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                        </svg>
                        Partial
                    </span>
                );
            case 'NO':
                return (
                    <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                        For Parts
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <Link href={`/item/${device.id}`} className="block group">
            <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 h-full flex flex-col card-retro">
                {/* Image */}
                <div className="aspect-square w-full bg-[var(--muted)] relative overflow-hidden">
                    {thumbnail ? (
                        <img
                            src={`${API_BASE_URL}${thumbnail}`}
                            alt={device.name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-[var(--muted-foreground)]">
                            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="opacity-30">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                    
                    {/* Status Badge Overlay */}
                    <div className="absolute top-2 right-2">
                        {getStatusBadge()}
                    </div>
                </div>

                {/* Content */}
                <div className="p-3 flex-1 flex flex-col">
                    {/* Category & Year */}
                    <div className="mb-1">
                        <span className="text-[10px] font-medium uppercase text-[var(--muted-foreground)] bg-[var(--muted)] px-1.5 py-0.5 rounded">
                            {device.category.name}{device.releaseYear ? ` • ${device.releaseYear}` : ''}
                        </span>
                    </div>

                    {/* Name */}
                    <h2 className="line-clamp-1 text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--apple-blue)] transition-colors">
                        {device.name}
                    </h2>

                    {/* Additional Name / Model */}
                    <p className="line-clamp-1 text-xs text-[var(--muted-foreground)] mb-2">
                        {device.additionalName || `${device.manufacturer || ''} ${device.modelNumber || ''}`.trim() || '\u00A0'}
                    </p>

                    {/* Price & Status */}
                    <div className="mt-auto flex items-center justify-between">
                        {getPriceDisplay()}
                        {getFunctionalBadge()}
                    </div>
                </div>
            </div>
        </Link>
    );
}
