"use client";

import { useMutation } from "@apollo/client";
import gql from "graphql-tag";
import { useState, useRef } from "react";
import { API_BASE_URL } from "../lib/config";

const CREATE_IMAGE = gql`
  mutation CreateImage($input: ImageCreateInput!) {
    createImage(input: $input) {
      id
      path
      caption
      isThumbnail
      isShopImage
    }
  }
`;

interface ImageUploaderProps {
    deviceId: number;
    onUploadComplete: () => void;
    onClose: () => void;
}

export function ImageUploader({ deviceId, onUploadComplete, onClose }: ImageUploaderProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [createImage] = useMutation(CREATE_IMAGE);

    const handleFileSelect = (files: File[]) => {
        const validFiles: File[] = [];
        const newPreviews: string[] = [];

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                setError('Please select only image files');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                return;
            }

            validFiles.push(file);

            // Create preview for this file
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setPreviews(prev => [...prev, result]);
            };
            reader.readAsDataURL(file);
        }

        if (validFiles.length > 0) {
            setError(null);
            setSelectedFiles(prev => [...prev, ...validFiles]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            handleFileSelect(files);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length > 0) {
            handleFileSelect(files);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setError(null);

        try {
            // Upload each file sequentially
            for (const file of selectedFiles) {
                // Upload file to server
                const formData = new FormData();
                formData.append('image', file);

                const uploadResponse = await fetch(`${API_BASE_URL}/upload?deviceId=${deviceId}`, {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    const errorData = await uploadResponse.json();
                    throw new Error(errorData.error || 'Upload failed');
                }

                const { path } = await uploadResponse.json();

                // Create image record in database
                await createImage({
                    variables: {
                        input: {
                            deviceId,
                            path,
                            isThumbnail: false,
                            isShopImage: false,
                        },
                    },
                });
            }

            onUploadComplete();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const clearSelection = () => {
        setSelectedFiles([]);
        setPreviews([]);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Upload Photos
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {previews.length === 0 ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                            dragOver
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                        }`}
                    >
                        <svg
                            width="48"
                            height="48"
                            className="mx-auto text-gray-400 mb-4"
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
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                            Drop an image here or click to select
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                            JPEG, PNG, GIF, WebP up to 10MB
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            multiple
                            onChange={handleInputChange}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                    <img
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        title="Remove image"
                                    >
                                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                        {selectedFiles[index]?.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center">
                            <button
                                onClick={clearSelection}
                                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Clear all
                            </button>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''} selected
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0 || uploading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {uploading ? `Uploading ${selectedFiles.length} image${selectedFiles.length !== 1 ? 's' : ''}...` : `Upload ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
