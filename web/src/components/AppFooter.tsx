"use client";

import { useState } from "react";
import { APP_VERSION, releaseNotes, type ReleaseEntry } from "../lib/releaseNotes";

function ReleaseNotesModal({ onClose }: { onClose: () => void }) {
    const visibleReleases = releaseNotes.filter(
        (r) => r.version !== 'Unreleased' || (r.added?.length || r.changed?.length || r.fixed?.length)
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg mx-4 card-retro bg-[var(--card)] rounded border border-[var(--border)] shadow-xl flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
                    <h2 className="text-base font-semibold">Release Notes</h2>
                    <button
                        onClick={onClose}
                        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        aria-label="Close"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
                <div className="overflow-y-auto p-5 space-y-6">
                    {visibleReleases.map((release) => (
                        <ReleaseSection key={release.version} release={release} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ReleaseSection({ release }: { release: ReleaseEntry }) {
    return (
        <div>
            <div className="flex items-baseline gap-3 mb-3">
                <span className="font-semibold text-[var(--apple-blue)]">
                    {release.version === 'Unreleased' ? 'Unreleased' : `v${release.version}`}
                </span>
                {release.date && (
                    <span className="text-xs text-[var(--muted-foreground)]">{release.date}</span>
                )}
            </div>
            {release.added && release.added.length > 0 && (
                <ChangeGroup label="Added" items={release.added} color="text-green-600 dark:text-green-400" />
            )}
            {release.changed && release.changed.length > 0 && (
                <ChangeGroup label="Changed" items={release.changed} color="text-[var(--apple-blue)]" />
            )}
            {release.fixed && release.fixed.length > 0 && (
                <ChangeGroup label="Fixed" items={release.fixed} color="text-orange-500" />
            )}
        </div>
    );
}

function ChangeGroup({ label, items, color }: { label: string; items: string[]; color: string }) {
    return (
        <div className="mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</span>
            <ul className="mt-1 space-y-1">
                {items.map((item, i) => (
                    <li key={i} className="text-sm text-[var(--foreground)] flex gap-2">
                        <span className="text-[var(--muted-foreground)] shrink-0">–</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function AppFooter() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div className="fixed bottom-2 left-4 z-30">
                <button
                    onClick={() => setIsOpen(true)}
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                    v{APP_VERSION}
                </button>
            </div>
            {isOpen && <ReleaseNotesModal onClose={() => setIsOpen(false)} />}
        </>
    );
}
