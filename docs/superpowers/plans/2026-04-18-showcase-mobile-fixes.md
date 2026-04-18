# Showcase Mobile Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four mobile UX bugs on the showcase site: homepage layout, missing mobile nav, broken era filter touch, and broken category filter deselect.

**Architecture:** Three targeted file edits — responsive Tailwind classes on the homepage grid, a hamburger dropdown added to the Nav component, and `<li>→<button>` + `touch-manipulation` fixes on the Timeline. No new files, no new dependencies.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, React `useState`

---

## File Map

| File | Change |
|------|--------|
| `showcase/src/app/page.tsx` | Add responsive breakpoints to the gallery grid and card heights |
| `showcase/src/components/Nav.tsx` | Add `isOpen` state, hamburger button, mobile dropdown panel |
| `showcase/src/components/TimelineClient.tsx` | Convert era `<ul>/<li>` to `<div>/<button>`, add `touch-manipulation` to era and category buttons |

---

## Task 1: Fix homepage featured journey + quotes grid

**Files:**
- Modify: `showcase/src/app/page.tsx` (lines 193–274)

The gallery grid uses `grid-cols-12 h-[800px]` with `col-span-8` and `col-span-4` and no mobile breakpoint override, causing the 12-column split to apply on all screen widths.

- [ ] **Step 1: Fix the grid container and featured journey tile**

In `showcase/src/app/page.tsx`, make these four targeted class replacements:

1. Line ~193 — grid container:
   - Old: `className="grid grid-cols-12 gap-6 h-[800px]"`
   - New: `className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[800px]"`

2. Line ~198 — featured journey Link (when journey exists):
   - Old: `className="col-span-8 h-full rounded-xl overflow-hidden relative group bg-surface-container-high block"`
   - New: `className="col-span-12 md:col-span-8 h-72 md:h-full rounded-xl overflow-hidden relative group bg-surface-container-high block"`

3. Line ~227 — featured journey placeholder div (when no journey):
   - Old: `className="col-span-8 h-full rounded-xl overflow-hidden relative bg-surface-container-high"`
   - New: `className="col-span-12 md:col-span-8 h-72 md:h-full rounded-xl overflow-hidden relative bg-surface-container-high"`

4. Line ~238 — right column (quotes):
   - Old: `className="col-span-4 flex flex-col gap-6 h-full"`
   - New: `className="col-span-12 md:col-span-4 flex flex-col gap-6 h-auto md:h-full"`

- [ ] **Step 2: Fix quote card heights**

Still in `page.tsx`, replace `h-1/2` with `h-64 md:h-1/2` on all three quote cards (lines ~241, ~255, ~260):

1. quote2 card (has content): `className="h-1/2 rounded-xl ..."` → `className="h-64 md:h-1/2 rounded-xl ..."`
2. quote2 placeholder div: `className="h-1/2 rounded-xl ..."` → `className="h-64 md:h-1/2 rounded-xl ..."`
3. quote card (primary bg): `className="h-1/2 rounded-xl ..."` → `className="h-64 md:h-1/2 rounded-xl ..."`

- [ ] **Step 3: Commit**

```bash
cd /path/to/repo
git add showcase/src/app/page.tsx
git commit -m "Fix homepage gallery grid stacking on mobile"
```

---

## Task 2: Add mobile nav hamburger dropdown

**Files:**
- Modify: `showcase/src/components/Nav.tsx`

The nav links use `hidden md:flex` with no mobile fallback. Add a hamburger toggle (mobile-only) and a dropdown panel.

- [ ] **Step 1: Replace Nav.tsx with the responsive version**

Replace the entire contents of `showcase/src/components/Nav.tsx` with:

```tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/i18n/context';

interface NavProps {
  siteTitle: string;
}

export default function Nav({ siteTitle }: NavProps) {
  const pathname = usePathname();
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: '/journeys', label: t.nav.journeys },
    { href: '/timeline', label: t.nav.timeline },
    { href: '/#about', label: t.nav.about },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm glass-nav">
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tighter text-on-surface uppercase hover:text-primary transition-colors duration-200"
        >
          {siteTitle}
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-10">
          {links.map((link) => {
            const isActive =
              link.href.startsWith('#') || !pathname
                ? false
                : pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? 'tracking-tight text-sm font-medium uppercase text-primary border-b-2 border-primary pb-1 transition-all duration-200'
                    : 'tracking-tight text-sm font-medium uppercase text-on-surface-variant hover:text-on-surface transition-colors duration-200'
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {/* Explore button — desktop only */}
          <Link
            href="/journeys"
            className="hidden md:inline-flex bg-primary text-on-primary px-6 py-2 rounded-full font-medium text-sm hover:opacity-80 transition-all duration-200 active:scale-95"
          >
            {t.nav.explore}
          </Link>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-2 text-on-surface-variant hover:text-on-surface transition-colors touch-manipulation"
            onClick={() => setIsOpen((o) => !o)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-t border-outline-variant/10 shadow-lg transition-opacity duration-150 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col px-8 py-4 gap-1 max-w-7xl mx-auto">
          {links.map((link) => {
            const isActive =
              link.href.startsWith('#') || !pathname
                ? false
                : pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`py-4 text-sm font-medium uppercase tracking-tight border-b border-outline-variant/10 last:border-0 transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-4 pb-2">
            <Link
              href="/journeys"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center bg-primary text-on-primary px-6 py-3 rounded-full font-medium text-sm hover:opacity-80 transition-all duration-200 active:scale-95"
            >
              {t.nav.explore}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add showcase/src/components/Nav.tsx
git commit -m "Add mobile hamburger dropdown to showcase nav"
```

---

## Task 3: Fix timeline era filter touch + category deselect

**Files:**
- Modify: `showcase/src/components/TimelineClient.tsx` (lines 135–199)

Two issues: era filter uses `<li onClick>` (unreliable on mobile touch); category deselect broken by iOS 300ms double-tap delay.

- [ ] **Step 1: Convert era filter from `<ul>/<li>` to `<div>/<button>`**

In `showcase/src/components/TimelineClient.tsx`, find the era filter block (starts with `<ul className="space-y-4">`, around line 135) and replace it:

Old:
```tsx
<ul className="space-y-4">
  {ERAS.map((era) => {
    const count = devices.filter((d) => {
      const y = d.releaseYear;
      return y !== null && y >= era.range[0] && y <= era.range[1];
    }).length;
    const isActive =
      selectedEra &&
      selectedEra[0] === era.range[0] &&
      selectedEra[1] === era.range[1];
    return (
      <li
        key={era.label}
        className="flex items-center justify-between group cursor-pointer"
        onClick={() => handleEra(era.range)}
      >
        <span
          className={`font-medium transition-colors ${
            isActive
              ? 'text-primary font-bold'
              : 'text-on-surface group-hover:text-primary'
          }`}
        >
          {era.label} ({era.range[0]}–{era.range[1]})
        </span>
        <span
          className={`text-[10px] px-2 py-1 rounded transition-all ${
            isActive
              ? 'bg-primary text-white'
              : 'bg-surface-container-high text-outline group-hover:bg-primary group-hover:text-white'
          }`}
        >
          {String(count).padStart(2, '0')}
        </span>
      </li>
    );
  })}
</ul>
```

New:
```tsx
<div className="space-y-4">
  {ERAS.map((era) => {
    const count = devices.filter((d) => {
      const y = d.releaseYear;
      return y !== null && y >= era.range[0] && y <= era.range[1];
    }).length;
    const isActive =
      selectedEra &&
      selectedEra[0] === era.range[0] &&
      selectedEra[1] === era.range[1];
    return (
      <button
        key={era.label}
        className="flex items-center justify-between w-full group touch-manipulation"
        onClick={() => handleEra(era.range)}
      >
        <span
          className={`font-medium transition-colors ${
            isActive
              ? 'text-primary font-bold'
              : 'text-on-surface group-hover:text-primary'
          }`}
        >
          {era.label} ({era.range[0]}–{era.range[1]})
        </span>
        <span
          className={`text-[10px] px-2 py-1 rounded transition-all ${
            isActive
              ? 'bg-primary text-white'
              : 'bg-surface-container-high text-outline group-hover:bg-primary group-hover:text-white'
          }`}
        >
          {String(count).padStart(2, '0')}
        </span>
      </button>
    );
  })}
</div>
```

- [ ] **Step 2: Add `touch-manipulation` to category buttons**

Find the category filter buttons (around line 185) and add `touch-manipulation` to the className:

Old:
```tsx
className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all border ${
  isActive
    ? 'border-primary text-primary bg-surface-container-lowest'
    : 'border-outline-variant/15 text-on-surface-variant bg-surface-container-lowest hover:border-primary'
}`}
```

New:
```tsx
className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all border touch-manipulation ${
  isActive
    ? 'border-primary text-primary bg-surface-container-lowest'
    : 'border-outline-variant/15 text-on-surface-variant bg-surface-container-lowest hover:border-primary'
}`}
```

- [ ] **Step 3: Commit**

```bash
git add showcase/src/components/TimelineClient.tsx
git commit -m "Fix timeline era filter and category deselect on mobile"
```

---

## Task 4: Build verification

- [ ] **Step 1: Run showcase build**

```bash
cd showcase && npm run build
```

Expected: build completes with no TypeScript or Next.js errors. Any error is a blocker — fix before proceeding.

- [ ] **Step 2: Manual mobile verification**

Open the showcase in a browser with DevTools device emulation set to a 390px-wide viewport (iPhone 14 Pro).

Check each fix:

1. **Homepage** — navigate to `/`. The gallery section should show the featured journey card full-width on top, with the two quote cards stacked below it. No horizontal overflow.

2. **Nav** — a hamburger icon (three bars) should be visible on the right of the nav bar. Tap it → dropdown slides in with Journeys, Timeline, About links and Explore button. Tap a link → menu closes and navigates correctly. Tap hamburger again → menu closes.

3. **Timeline era filter** — navigate to `/timeline`. Tap any era in the left sidebar → the device grid filters to that era. Tap the same era again → filter clears (all devices visible). Tap a different era → switches correctly.

4. **Timeline category filter** — tap a category chip → it highlights (active). Tap the highlighted chip → it deselects (back to showing all). Confirm no double-tap required.

5. **Desktop regression** — resize to ≥768px width. Homepage grid shows 8/4 split at 800px height. Nav shows normal horizontal links (no hamburger). Timeline sidebar is correct.

- [ ] **Step 3: Update release notes**

In `web/src/lib/releaseNotes.ts`, add to the `Unreleased` `fixed` array:

```ts
'Showcase mobile: homepage featured journey and quotes now stack vertically; nav gains a hamburger menu; timeline era filter and category deselect now respond correctly to touch',
```

In `CHANGELOG.md`, add to `[Unreleased]` under `### Fixed`:

```
- Showcase mobile: homepage featured journey and quotes now stack vertically; nav gains a hamburger menu; timeline era filter and category deselect now respond correctly to touch
```

- [ ] **Step 4: Commit release notes**

```bash
git add web/src/lib/releaseNotes.ts CHANGELOG.md
git commit -m "Update release notes for showcase mobile fixes"
```
