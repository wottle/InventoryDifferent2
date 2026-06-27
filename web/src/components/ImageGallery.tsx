"use client";

import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useState, useEffect } from "react";
import { Pencil, Download } from "lucide-react";
import { API_BASE_URL } from "../lib/config";
import { EditImageModal, type EditableImage } from "./EditImageModal";

const DELETE_IMAGE = gql`
  mutation DeleteImage($id: Int!) {
    deleteImage(id: $id)
  }
`;

const UPDATE_IMAGE = gql`
  mutation UpdateImage($input: ImageUpdateInput!) {
    updateImage(input: $input) {
      id
      isThumbnail
      thumbnailMode
      isShopImage
      isListingImage
    }
  }
`;

interface Image {
    id: number;
    path: string;
    thumbnailPath?: string | null;
    originalPath?: string | null;
    rotation?: number | null;
    cropLeft?: number | null;
    cropTop?: number | null;
    cropWidth?: number | null;
    cropHeight?: number | null;
    caption: string | null;
    isThumbnail: boolean;
    thumbnailMode?: string | null;
    isShopImage: boolean;
    isListingImage: boolean;
    mediaType?: string | null;
    duration?: number | null;
}

interface ImageGalleryProps {
    images: Image[];
    onImagesChanged: () => void;
}

export function ImageGallery({ images, onImagesChanged }: ImageGalleryProps) {
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [thumbnailChoiceId, setThumbnailChoiceId] = useState<number | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [editingImage, setEditingImage] = useState<EditableImage | null>(null);
    const [deleteImage, { loading: deleting }] = useMutation(DELETE_IMAGE);
    const [updateImage, { loading: updating }] = useMutation(UPDATE_IMAGE);

    const handleDownload = async (image: Image) => {
        const url = `${API_BASE_URL}${image.path}`;
        const response = await fetch(url);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = image.path.split('/').pop() || 'image';
        a.click();
        URL.revokeObjectURL(objectUrl);
    };

    const openLightbox = (index: number) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);
    const navLightbox = (delta: number) =>
        setLightboxIndex(prev => prev === null ? null : (prev + delta + images.length) % images.length);

    useEffect(() => {
        if (lightboxIndex === null) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') navLightbox(-1);
            if (e.key === 'ArrowRight') navLightbox(1);
            if (e.key === 'Escape') closeLightbox();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [lightboxIndex, images.length]);

    const formatDuration = (seconds: number): string => {
        const hrs  = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const hasExistingThumbnail = images.some(i => i.isThumbnail);

    const handleDelete = async (id: number) => {
        try {
            await deleteImage({ variables: { id } });
            setDeleteConfirmId(null);
            onImagesChanged();
        } catch (err) {
            console.error('Error deleting image:', err);
        }
    };

    const handleThumbnailClick = (id: number, isAlreadyThumbnail: boolean) => {
        if (isAlreadyThumbnail) return;
        if (hasExistingThumbnail) {
            setThumbnailChoiceId(id);
        } else {
            applyThumbnailMode(id, 'BOTH');
        }
    };

    const applyThumbnailMode = async (id: number, mode: 'BOTH' | 'LIGHT' | 'DARK') => {
        try {
            await updateImage({
                variables: {
                    input: { id, isThumbnail: true, thumbnailMode: mode },
                },
            });
            setThumbnailChoiceId(null);
            onImagesChanged();
        } catch (err) {
            console.error('Error setting thumbnail:', err);
        }
    };

    const handleToggleShopImage = async (id: number, nextValue: boolean) => {
        try {
            await updateImage({
                variables: {
                    input: { id, isShopImage: nextValue },
                },
            });
            onImagesChanged();
        } catch (err) {
            console.error('Error toggling shop image:', err);
        }
    };

    const handleSetListingImage = async (id: number) => {
        try {
            await updateImage({
                variables: {
                    input: { id, isListingImage: true },
                },
            });
            onImagesChanged();
        } catch (err) {
            console.error('Error setting listing image:', err);
        }
    };

    const getThumbnailBadgeLabel = (image: Image) => {
        if (!image.isThumbnail) return null;
        if (image.thumbnailMode === 'LIGHT') return 'Light Thumb';
        if (image.thumbnailMode === 'DARK') return 'Dark Thumb';
        return 'Thumbnail';
    };

    if (images.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No photos yet
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {images.map((image, index) => {
                const thumbLabel = getThumbnailBadgeLabel(image);
                return (
                    <div
                        key={image.id}
                        className="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => openLightbox(index)}
                    >
                        <img
                            src={`${API_BASE_URL}${image.thumbnailPath || image.path}`}
                            alt={image.caption || 'Device image'}
                            className="w-full h-full object-cover"
                        />

                        {/* Video play overlay */}
                        {image.mediaType === 'VIDEO' && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); openLightbox(index); }}
                                    className="absolute inset-0 flex items-center justify-center"
                                    title="Play video"
                                >
                                    <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </button>
                                {image.duration != null && (
                                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-mono rounded pointer-events-none">
                                        {formatDuration(image.duration)}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Thumbnail badge */}
                        {thumbLabel && (
                            <div className={`absolute top-1 left-1 px-1.5 py-0.5 text-white text-[10px] font-medium rounded ${
                                image.thumbnailMode === 'LIGHT' ? 'bg-sky-500' :
                                image.thumbnailMode === 'DARK' ? 'bg-indigo-600' :
                                'bg-blue-600'
                            }`}>
                                {thumbLabel}
                            </div>
                        )}

                        {image.isShopImage && image.mediaType !== 'VIDEO' && (
                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-emerald-600 text-white text-[10px] font-medium rounded">
                                Shop
                            </div>
                        )}

                        {image.isListingImage && (
                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-medium rounded">
                                Listing
                            </div>
                        )}

                        {/* Hover overlay with actions - 2x2 grid */}
                        <div className={`absolute inset-0 transition-colors p-2 ${thumbnailChoiceId === image.id || deleteConfirmId === image.id ? 'opacity-0 pointer-events-none' : 'bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100'}`}>
                            {/* Centered edit button */}
                            {image.mediaType !== 'VIDEO' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingImage(image); }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full text-gray-700 hover:bg-white transition-colors z-10"
                                    title="Edit photo"
                                >
                                    <Pencil size={15} />
                                </button>
                            )}
                            <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                                {/* Top-left: Thumbnail (grid/image icon) */}
                                <div className="flex items-start justify-start">
                                    {image.mediaType !== 'VIDEO' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleThumbnailClick(image.id, image.isThumbnail); }}
                                            disabled={updating || image.isThumbnail}
                                            className={`p-1.5 rounded-full transition-colors ${
                                                image.isThumbnail
                                                    ? "bg-blue-600/90 text-white"
                                                    : "bg-white/90 text-gray-700 hover:bg-white"
                                            }`}
                                            title={image.isThumbnail ? "Current thumbnail" : "Set as thumbnail"}
                                        >
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Top-right: Delete */}
                                <div className="flex items-start justify-end">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(image.id); }}
                                        className="p-1.5 bg-white/90 rounded-full text-red-600 hover:bg-white transition-colors"
                                        title="Delete image"
                                    >
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Bottom-left: Listing image (storefront icon) */}
                                <div className="flex items-end justify-start">
                                    {image.mediaType !== 'VIDEO' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleSetListingImage(image.id); }}
                                            disabled={updating || image.isListingImage}
                                            className={`p-1.5 rounded-full transition-colors ${
                                                image.isListingImage
                                                    ? "bg-orange-500/90 text-white"
                                                    : "bg-white/90 text-orange-600 hover:bg-white"
                                            }`}
                                            title={image.isListingImage ? "Current listing image" : "Set as listing image"}
                                        >
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v4H3V3zM4 7v13a1 1 0 001 1h14a1 1 0 001-1V7M10 12h4" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Bottom-right: Shop image toggle */}
                                <div className="flex items-end justify-end">
                                    {image.mediaType !== 'VIDEO' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggleShopImage(image.id, !image.isShopImage); }}
                                            disabled={updating}
                                            className={`p-1.5 rounded-full transition-colors ${
                                                image.isShopImage
                                                    ? "bg-emerald-600/90 text-white hover:bg-emerald-600"
                                                    : "bg-white/90 text-gray-700 hover:bg-white"
                                            }`}
                                            title={image.isShopImage ? "Remove from shop" : "Add to shop"}
                                        >
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M16 11V7a4 4 0 00-8 0v4M5 11h14l-1 10H6L5 11z"
                                                />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Thumbnail mode choice overlay */}
                        {thumbnailChoiceId === image.id && (
                            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-2 gap-1.5">
                                <p className="text-white text-[10px] font-medium text-center mb-0.5">Set thumbnail as:</p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); applyThumbnailMode(image.id, 'BOTH'); }}
                                    disabled={updating}
                                    className="w-full px-2 py-1 bg-blue-600 text-white text-[10px] font-medium rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Replace
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); applyThumbnailMode(image.id, 'LIGHT'); }}
                                    disabled={updating}
                                    className="w-full px-2 py-1 bg-sky-500 text-white text-[10px] font-medium rounded hover:bg-sky-600 disabled:opacity-50"
                                >
                                    Light Mode
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); applyThumbnailMode(image.id, 'DARK'); }}
                                    disabled={updating}
                                    className="w-full px-2 py-1 bg-indigo-600 text-white text-[10px] font-medium rounded hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Dark Mode
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setThumbnailChoiceId(null); }}
                                    className="w-full px-2 py-1 bg-white/20 text-white text-[10px] rounded hover:bg-white/30"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* Delete confirmation overlay */}
                        {deleteConfirmId === image.id && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4">
                                <p className="text-white text-sm text-center mb-3">Delete this photo?</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(image.id); }}
                                        disabled={deleting}
                                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {deleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                                        className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Lightbox overlay */}
            {lightboxIndex !== null && (() => {
                const image = images[lightboxIndex];
                return (
                    <div
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                        onClick={closeLightbox}
                    >
                        {/* Download button — images only */}
                        {image.mediaType !== 'VIDEO' && (
                            <button
                                className="absolute top-4 right-16 w-9 h-9 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
                                onClick={(e) => { e.stopPropagation(); handleDownload(image); }}
                                title="Download image"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        )}

                        {/* Close button */}
                        <button
                            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
                            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
                            title="Close"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                        </button>

                        {/* Counter */}
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm font-mono pointer-events-none">
                            {lightboxIndex + 1} / {images.length}
                        </div>

                        {/* Prev arrow */}
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
                            onClick={(e) => { e.stopPropagation(); navLightbox(-1); }}
                            title="Previous"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                            </svg>
                        </button>

                        {/* Next arrow */}
                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
                            onClick={(e) => { e.stopPropagation(); navLightbox(1); }}
                            title="Next"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                            </svg>
                        </button>

                        {/* Media + caption — stopPropagation so clicking media doesn't close */}
                        <div
                            className="flex flex-col items-center gap-3"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {image.mediaType === 'VIDEO' ? (
                                <video
                                    src={`${API_BASE_URL}${image.path}`}
                                    poster={image.thumbnailPath ? `${API_BASE_URL}${image.thumbnailPath}` : undefined}
                                    controls
                                    autoPlay
                                    className="max-w-[90vw] max-h-[80vh] rounded-lg"
                                />
                            ) : (
                                <img
                                    src={`${API_BASE_URL}${image.path}`}
                                    alt={image.caption || 'Device image'}
                                    className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
                                />
                            )}
                            {image.caption && (
                                <p className="text-white/55 text-sm italic text-center">{image.caption}</p>
                            )}
                        </div>
                    </div>
                );
            })()}

            {editingImage && (
                <EditImageModal
                    image={editingImage}
                    onClose={() => setEditingImage(null)}
                    onSaved={() => { setEditingImage(null); onImagesChanged(); }}
                />
            )}
        </div>
    );
}
