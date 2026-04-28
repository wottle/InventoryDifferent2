"use client";

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useT } from "../i18n/context";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    deviceUrl: string;
    deviceName: string;
    additionalName?: string | null;
    deviceId: number;
}

export function ShareModal({ isOpen, onClose, deviceUrl, deviceName, additionalName, deviceId }: ShareModalProps) {
    const t = useT();
    const [copied, setCopied] = useState(false);
    const [imageCopied, setImageCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'share' | 'asset-tag'>('share');
    const assetTagRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(deviceUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const shareToTwitter = () => {
        const text = `Check out this ${deviceName}${additionalName ? ` ${additionalName}` : ''}`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(deviceUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const shareToFacebook = () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(deviceUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const shareToLinkedIn = () => {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(deviceUrl)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const shareViaEmail = () => {
        const subject = `Check out this ${deviceName}${additionalName ? ` ${additionalName}` : ''}`;
        const body = `I wanted to share this device with you:\n\n${deviceName}${additionalName ? ` ${additionalName}` : ''}\n\n${deviceUrl}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const generateLabelImage = async (action: 'copy' | 'download') => {
        // Create a canvas for the label - using high DPI for print quality
        // Brother D610BT supports 24mm tape, so we'll create a landscape label
        const dpi = 300;
        const labelWidthInches = 3;
        const labelHeightInches = 0.94; // ~24mm
        const width = labelWidthInches * dpi;
        const height = labelHeightInches * dpi;
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Generate QR code as data URL
        const qrSize = height - 40; // Leave some padding
        const qrCanvas = document.createElement('canvas');
        qrCanvas.width = qrSize;
        qrCanvas.height = qrSize;
        
        // Use the qrcode library to generate QR
        const QRCode = await import('qrcode');
        await QRCode.toCanvas(qrCanvas, deviceUrl, {
            width: qrSize,
            margin: 0,
            errorCorrectionLevel: 'M'
        });

        // Draw QR code on main canvas
        const qrX = 20;
        const qrY = (height - qrSize) / 2;
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

        // Text settings
        const textX = qrX + qrSize + 30;
        const maxTextWidth = width - textX - 20;
        
        // Device name - large and bold
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        let textY = height * 0.35;
        ctx.fillText(deviceName, textX, textY, maxTextWidth);

        // Additional name
        if (additionalName) {
            ctx.font = '500 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillStyle = '#333333';
            textY += 60;
            ctx.fillText(additionalName, textX, textY, maxTextWidth);
        }

        // Device ID
        ctx.font = '36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#666666';
        textY += 50;
        ctx.fillText(`ID: ${deviceId}`, textX, textY, maxTextWidth);

        if (action === 'copy') {
            // Copy to clipboard
            try {
                const blob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed to create blob')), 'image/png');
                });
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                setImageCopied(true);
                setTimeout(() => setImageCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy image:', err);
                // Fallback: download instead
                downloadCanvas(canvas);
            }
        } else {
            downloadCanvas(canvas);
        }
    };

    const downloadCanvas = (canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `asset-tag-${deviceId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const displayName = additionalName ? `${deviceName} ${additionalName}` : deviceName;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-[var(--card)] rounded-xl shadow-xl border border-[var(--border)] w-full max-w-md mx-4 card-retro">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <h2 className="text-lg font-semibold text-[var(--foreground)]">{t.detail.shareTitle}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                    >
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--border)]">
                    <button
                        onClick={() => setActiveTab('share')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'share'
                                ? 'text-[var(--foreground)] border-b-2 border-[var(--apple-blue)]'
                                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                        }`}
                    >
                        {t.detail.shareLink}
                    </button>
                    <button
                        onClick={() => setActiveTab('asset-tag')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'asset-tag'
                                ? 'text-[var(--foreground)] border-b-2 border-[var(--apple-blue)]'
                                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                        }`}
                    >
                        {t.detail.assetTag}
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {activeTab === 'share' ? (
                        <div className="space-y-4">
                            {/* Copy Link */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                                    {t.detail.deviceLink}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={deviceUrl}
                                        readOnly
                                        className="input-retro flex-1 px-3 py-2 text-sm text-[var(--foreground)] bg-[var(--muted)]"
                                    />
                                    <button
                                        onClick={handleCopyLink}
                                        className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
                                            copied
                                                ? 'bg-green-600 text-white border-green-600'
                                                : 'bg-[var(--apple-blue)] text-white border-[#007acc] hover:brightness-110'
                                        }`}
                                    >
                                        {copied ? t.detail.copied : t.detail.copy}
                                    </button>
                                </div>
                            </div>

                            {/* Social Share Buttons */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                                    {t.detail.shareToSocialMedia}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={shareToTwitter}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#1DA1F2] text-white rounded hover:brightness-110 transition-colors"
                                    >
                                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                        </svg>
                                        X / Twitter
                                    </button>
                                    <button
                                        onClick={shareToFacebook}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#1877F2] text-white rounded hover:brightness-110 transition-colors"
                                    >
                                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                        </svg>
                                        Facebook
                                    </button>
                                    <button
                                        onClick={shareToLinkedIn}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#0A66C2] text-white rounded hover:brightness-110 transition-colors"
                                    >
                                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                        </svg>
                                        LinkedIn
                                    </button>
                                    <button
                                        onClick={shareViaEmail}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-[var(--muted)] text-[var(--foreground)] rounded border border-[var(--border)] hover:bg-[var(--card)] transition-colors"
                                    >
                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Email
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Asset Tag Preview */}
                            <div 
                                ref={assetTagRef}
                                className="bg-white rounded-lg p-4 border border-[var(--border)]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0">
                                        <QRCodeSVG 
                                            value={deviceUrl} 
                                            size={96}
                                            level="M"
                                            includeMargin={false}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-bold text-gray-900 leading-tight">
                                            {deviceName}
                                        </p>
                                        {additionalName && (
                                            <p className="text-sm font-medium text-gray-700 mt-0.5 leading-tight">
                                                {additionalName}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                            ID: {deviceId}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-[var(--muted-foreground)] text-center">
                                {t.detail.assetTagPreview}
                            </p>

                            {/* Brother P-Touch Buttons */}
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-[var(--muted-foreground)]">
                                    {t.detail.brotherPTouchLabel}
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => generateLabelImage('copy')}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded border transition-colors ${
                                            imageCopied
                                                ? 'bg-green-600 text-white border-green-600'
                                                : 'bg-[var(--apple-blue)] text-white border-[#007acc] hover:brightness-110'
                                        }`}
                                    >
                                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                        {imageCopied ? t.detail.copied : t.detail.copyImage}
                                    </button>
                                    <button
                                        onClick={() => generateLabelImage('download')}
                                        className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-[var(--muted)] text-[var(--foreground)] rounded border border-[var(--border)] hover:bg-[var(--card)] transition-colors"
                                    >
                                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        {t.detail.downloadPng}
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
