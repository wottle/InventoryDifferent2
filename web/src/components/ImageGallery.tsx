"use client";

import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useState } from "react";
import { API_BASE_URL } from "../lib/config";

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
      isShopImage
      isListingImage
    }
  }
`;

interface Image {
    id: number;
    path: string;
    thumbnailPath?: string | null;
    caption: string | null;
    isThumbnail: boolean;
    isShopImage: boolean;
    isListingImage: boolean;
}

interface ImageGalleryProps {
    images: Image[];
    onImagesChanged: () => void;
}

export function ImageGallery({ images, onImagesChanged }: ImageGalleryProps) {
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [deleteImage, { loading: deleting }] = useMutation(DELETE_IMAGE);
    const [updateImage, { loading: updating }] = useMutation(UPDATE_IMAGE);

    const handleDelete = async (id: number) => {
        try {
            await deleteImage({ variables: { id } });
            setDeleteConfirmId(null);
            onImagesChanged();
        } catch (err) {
            console.error('Error deleting image:', err);
        }
    };

    const handleSetThumbnail = async (id: number) => {
        try {
            await updateImage({
                variables: {
                    input: { id, isThumbnail: true },
                },
            });
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

    if (images.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No photos yet
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {images.map((image) => (
                <div
                    key={image.id}
                    className="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
                >
                    <img
                        src={`${API_BASE_URL}${image.thumbnailPath || image.path}`}
                        alt={image.caption || 'Device image'}
                        className="w-full h-full object-cover"
                    />

                    {/* Thumbnail badge */}
                    {image.isThumbnail && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-medium rounded">
                            Thumbnail
                        </div>
                    )}

                    {image.isShopImage && (
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
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100 p-2">
                        <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                            {/* Top-left: Thumbnail (grid/image icon) */}
                            <div className="flex items-start justify-start">
                                <button
                                    onClick={() => handleSetThumbnail(image.id)}
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
                            </div>

                            {/* Top-right: Delete */}
                            <div className="flex items-start justify-end">
                                <button
                                    onClick={() => setDeleteConfirmId(image.id)}
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
                                <button
                                    onClick={() => handleSetListingImage(image.id)}
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
                            </div>

                            {/* Bottom-right: Shop image toggle */}
                            <div className="flex items-end justify-end">
                                <button
                                    onClick={() => handleToggleShopImage(image.id, !image.isShopImage)}
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
                            </div>
                        </div>
                    </div>

                    {/* Delete confirmation overlay */}
                    {deleteConfirmId === image.id && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4">
                            <p className="text-white text-sm text-center mb-3">Delete this photo?</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleDelete(image.id)}
                                    disabled={deleting}
                                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
