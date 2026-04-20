"use client";

import { useState, useEffect, useRef } from 'react';
import { useT } from '@/i18n/context';

interface ShareButtonProps {
  title: string;
}

export default function ShareButton({ title }: ShareButtonProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function getUrl() {
    return typeof window !== 'undefined' ? window.location.href : '';
  }

  function shareOnX() {
    const url = encodeURIComponent(getUrl());
    const text = encodeURIComponent(title);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  }

  function shareOnFacebook() {
    const url = encodeURIComponent(getUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 2000);
    } catch {
      setOpen(false);
    }
  }

  return (
    <div
      ref={ref}
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-end gap-2"
    >
      {/* Popover */}
      {open && (
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-2 flex flex-col gap-1 w-44 shadow-xl">
          <button
            onClick={shareOnX}
            aria-label={t.common.postOnX}
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-highest transition-colors text-left w-full"
          >
            {/* X / Twitter logo */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-on-surface-variant">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            {t.common.postOnX}
          </button>
          <button
            onClick={shareOnFacebook}
            aria-label={t.common.shareOnFacebook}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors text-left w-full"
          >
            {/* Facebook logo */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-on-surface-variant">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            {t.common.shareOnFacebook}
          </button>
          <button
            onClick={copyLink}
            aria-label={copied ? t.common.copied : t.common.copyLink}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors text-left w-full"
          >
            {/* Link icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-on-surface-variant">
              <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {copied ? t.common.copied : t.common.copyLink}
          </button>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t.common.share}
        className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
      >
        {/* Share icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      </button>
    </div>
  );
}
