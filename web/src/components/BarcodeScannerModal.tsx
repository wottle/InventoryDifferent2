"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BarcodeDetector } from "barcode-detector";

type BarcodeScannerModalProps = {
    open: boolean;
    onClose: () => void;
    onDetected: (value: string) => boolean | void | Promise<boolean | void>;
    title?: string;
    formats?: string[];
    message?: string;
};

const DEFAULT_FORMATS = ["code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "itf"];

export function BarcodeScannerModal({ open, onClose, onDetected, title, formats, message }: BarcodeScannerModalProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const detectTimerRef = useRef<number | null>(null);

    const onCloseRef = useRef(onClose);
    const onDetectedRef = useRef(onDetected);

    const lastDetectedRef = useRef<{ value: string; time: number } | null>(null);

    const [error, setError] = useState<string>("");

    const isSupported = useMemo(() => {
        if (typeof window === "undefined") return false;
        return !!navigator?.mediaDevices?.getUserMedia;
    }, []);

    const stop = () => {
        if (detectTimerRef.current) {
            window.clearInterval(detectTimerRef.current);
            detectTimerRef.current = null;
        }

        if (streamRef.current) {
            for (const track of streamRef.current.getTracks()) {
                track.stop();
            }
            streamRef.current = null;
        }

        const video = videoRef.current;
        if (video) {
            try {
                (video as any).srcObject = null;
            } catch {
                // ignore
            }
        }
    };

    useEffect(() => {
        onCloseRef.current = onClose;
        onDetectedRef.current = onDetected;
    }, [onClose, onDetected]);

    useEffect(() => {
        if (!open) {
            stop();
            setError("");
            return;
        }

        if (!isSupported) {
            setError("Barcode scanning is not supported on this browser.");
            return;
        }

        let cancelled = false;

        const start = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
                    audio: false,
                });

                if (cancelled) {
                    for (const track of stream.getTracks()) track.stop();
                    return;
                }

                streamRef.current = stream;

                const video = videoRef.current;
                if (!video) {
                    setError("Unable to start camera preview.");
                    return;
                }

                (video as any).srcObject = stream;
                await video.play().catch(() => undefined);

                const detector = new BarcodeDetector({
                    formats: (formats && formats.length > 0 ? formats : DEFAULT_FORMATS) as any,
                });

                detectTimerRef.current = window.setInterval(async () => {
                    if (!videoRef.current) return;
                    if (videoRef.current.readyState < 2) return;

                    try {
                        const barcodes: any[] = await detector.detect(videoRef.current);
                        if (barcodes && barcodes.length > 0) {
                            const value = String(barcodes[0]?.rawValue ?? "").trim();
                            if (value) {
                                const now = Date.now();
                                const last = lastDetectedRef.current;
                                if (last && last.value === value && now - last.time < 2000) {
                                    return;
                                }

                                lastDetectedRef.current = { value, time: now };

                                const result = await Promise.resolve(onDetectedRef.current(value));
                                const accepted = result !== false;
                                if (accepted) {
                                    stop();
                                    onCloseRef.current();
                                }
                            }
                        }
                    } catch {
                        // ignore detect errors; keep scanning
                    }
                }, 250);
            } catch (e: any) {
                const msg = typeof e?.message === "string" ? e.message : "Unable to access the camera.";
                setError(msg);
            }
        };

        start();

        return () => {
            cancelled = true;
            stop();
        };
    }, [open, isSupported, formats]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />

            <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {title ?? "Scan Barcode"}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                        Close
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    {error ? (
                        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
                    ) : (
                        <div className="space-y-2">
                            {message && <div className="text-sm text-red-600 dark:text-red-400">{message}</div>}
                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-black">
                                <video ref={videoRef} className="w-full h-64 object-cover" playsInline muted />
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Point the camera at the barcode.
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
