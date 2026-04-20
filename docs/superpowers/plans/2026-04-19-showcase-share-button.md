# Showcase Share Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating share button to journey detail and device detail pages in the showcase app, allowing visitors to share pages on Twitter/X, Facebook, or copy the link.

**Architecture:** A single `ShareButton` client component renders a fixed-position circular button on the right edge of the page. Clicking it toggles a labeled-row popover with three actions (Post on X, Share on Facebook, Copy link). Share URLs are built from `window.location.href`. Five new i18n keys are added to a new `common` translation section so strings are localised in all four languages.

**Tech Stack:** Next.js 14 App Router, React (client component), Tailwind CSS, TypeScript, existing `useT()` hook from `@/i18n/context`

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `showcase/src/i18n/translations/en.ts` | Modify | Add `common` section to `Translations` type and English values |
| `showcase/src/i18n/translations/de.ts` | Modify | Add German values for `common` section |
| `showcase/src/i18n/translations/fr.ts` | Modify | Add French values for `common` section |
| `showcase/src/i18n/translations/es.ts` | Modify | Add Spanish values for `common` section |
| `showcase/src/components/ShareButton.tsx` | Create | Floating share button client component |
| `showcase/src/app/journeys/[slug]/page.tsx` | Modify | Add `<ShareButton title={journey.title} />` |
| `showcase/src/app/device/[id]/page.tsx` | Modify | Add `<ShareButton title={device.name} />` |
| `web/src/lib/releaseNotes.ts` | Modify | Add Unreleased bullet |
| `CHANGELOG.md` | Modify | Add Unreleased bullet |

---

### Task 1: Add i18n keys for the share UI

**Files:**
- Modify: `showcase/src/i18n/translations/en.ts`
- Modify: `showcase/src/i18n/translations/de.ts`
- Modify: `showcase/src/i18n/translations/fr.ts`
- Modify: `showcase/src/i18n/translations/es.ts`

The `Translations` type lives in `en.ts` — add `common` there, then add values to all four files. The existing `Translations` type ends at line 241, just before `export const en`. The `adminJourneyEditor` section is the last key in the type.

- [ ] **Step 1: Add `common` to `Translations` type and English values in `en.ts`**

In `showcase/src/i18n/translations/en.ts`, add a `common` key to the `Translations` type block (after `adminJourneyEditor`) and add the English values to the `en` export:

In the type block (after the closing brace of `adminJourneyEditor` on line ~240, before the `};` that closes `Translations`):

```typescript
  common: {
    share: string;
    postOnX: string;
    shareOnFacebook: string;
    copyLink: string;
    copied: string;
  };
```

In the `en` export (after the closing brace of `adminJourneyEditor` values, before the final `};`):

```typescript
  common: {
    share: 'Share',
    postOnX: 'Post on X',
    shareOnFacebook: 'Share on Facebook',
    copyLink: 'Copy link',
    copied: 'Copied!',
  },
```

- [ ] **Step 2: Add German values in `de.ts`**

Add after the closing brace of `adminJourneyEditor` values, before the final `};`:

```typescript
  common: {
    share: 'Teilen',
    postOnX: 'Auf X posten',
    shareOnFacebook: 'Auf Facebook teilen',
    copyLink: 'Link kopieren',
    copied: 'Kopiert!',
  },
```

- [ ] **Step 3: Add French values in `fr.ts`**

Add after the closing brace of `adminJourneyEditor` values, before the final `};`:

```typescript
  common: {
    share: 'Partager',
    postOnX: 'Publier sur X',
    shareOnFacebook: 'Partager sur Facebook',
    copyLink: 'Copier le lien',
    copied: 'Copié\u00a0!',
  },
```

- [ ] **Step 4: Add Spanish values in `es.ts`**

Add after the closing brace of `adminJourneyEditor` values, before the final `};`:

```typescript
  common: {
    share: 'Compartir',
    postOnX: 'Publicar en X',
    shareOnFacebook: 'Compartir en Facebook',
    copyLink: 'Copiar enlace',
    copied: '\u00a1Copiado!',
  },
```

- [ ] **Step 5: Verify TypeScript compiles**

Run from the `showcase/` directory:

```bash
cd showcase && npx tsc --noEmit 2>&1 | head -30
```

Expected: no output (no errors). If there are type errors they will appear here — fix them before continuing.

- [ ] **Step 6: Commit**

```bash
git add showcase/src/i18n/translations/en.ts showcase/src/i18n/translations/de.ts showcase/src/i18n/translations/fr.ts showcase/src/i18n/translations/es.ts
git commit -m "$(cat <<'EOF'
Add common i18n keys for share button (en/de/fr/es)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Create the ShareButton component

**Files:**
- Create: `showcase/src/components/ShareButton.tsx`

This is a `"use client"` component. It uses `useT()` from `@/i18n/context` to get translated strings, and `useState` + `useEffect` for popover toggle state and outside-click detection.

The button is fixed to the right edge, vertically centred. Clicking it toggles a popover that appears above the button with three labeled rows: Post on X, Share on Facebook, Copy link. The copy row temporarily shows "Copied!" for 2 seconds.

Twitter/X share URL: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
Facebook share URL: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
Copy: `navigator.clipboard.writeText(url)`

- [ ] **Step 1: Create `showcase/src/components/ShareButton.tsx`**

```tsx
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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — silently do nothing
    }
    setOpen(false);
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd showcase && npx tsc --noEmit 2>&1 | head -30
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add showcase/src/components/ShareButton.tsx
git commit -m "$(cat <<'EOF'
Add ShareButton client component for showcase pages

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Wire ShareButton into the journey detail page

**Files:**
- Modify: `showcase/src/app/journeys/[slug]/page.tsx`

The page is a server component — it cannot use `useT()`. `ShareButton` is a client component that calls `useT()` itself, so no props from the server side are needed for translations. Pass only `title`.

The `<ShareButton>` element goes just before the closing `</main>` tag (line 253). It must be imported at the top of the file.

- [ ] **Step 1: Add the import**

At the top of `showcase/src/app/journeys/[slug]/page.tsx`, after the existing imports, add:

```tsx
import ShareButton from '@/components/ShareButton';
```

- [ ] **Step 2: Add `<ShareButton>` before `</main>`**

Find the line with `</main>` (the last line of the JSX in the return block). Place the component just before it:

Before:
```tsx
    </main>
  );
}
```

After:
```tsx
      <ShareButton title={journey.title} />
    </main>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd showcase && npx tsc --noEmit 2>&1 | head -30
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add showcase/src/app/journeys/\[slug\]/page.tsx
git commit -m "$(cat <<'EOF'
Add share button to journey detail page

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Wire ShareButton into the device detail page

**Files:**
- Modify: `showcase/src/app/device/[id]/page.tsx`

Same pattern as Task 3. The device detail page is also a server component. Pass `title={device.name}`.

The `<ShareButton>` element goes just before the closing `</main>` tag (line 377). The import goes with the existing imports at the top.

- [ ] **Step 1: Add the import**

At the top of `showcase/src/app/device/[id]/page.tsx`, after the existing imports, add:

```tsx
import ShareButton from '@/components/ShareButton';
```

- [ ] **Step 2: Add `<ShareButton>` before `</main>`**

Find the closing `</main>` at the end of the return block. Place the component just before it:

Before:
```tsx
    </main>
  );
}
```

After:
```tsx
      <ShareButton title={device.name} />
    </main>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd showcase && npx tsc --noEmit 2>&1 | head -30
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add showcase/src/app/device/\[id\]/page.tsx
git commit -m "$(cat <<'EOF'
Add share button to device detail page

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Update release notes and changelog

**Files:**
- Modify: `web/src/lib/releaseNotes.ts`
- Modify: `CHANGELOG.md`

Both files have an `Unreleased` section at the top. Add one bullet under `added`.

- [ ] **Step 1: Add bullet to `web/src/lib/releaseNotes.ts`**

Find the `Unreleased` entry's `added` array. Add this string to it (keep it with any other items already in that array):

```
'Add floating share button to showcase journey and device detail pages — share to Twitter/X, Facebook, or copy the page link'
```

- [ ] **Step 2: Add the same bullet to `CHANGELOG.md`**

Under `## [Unreleased]` → `### Added`, add:

```markdown
- Add floating share button to showcase journey and device detail pages — share to Twitter/X, Facebook, or copy the page link
```

- [ ] **Step 3: Run the showcase build to confirm no errors**

```bash
cd showcase && npm run build 2>&1 | tail -20
```

Expected: ends with `✓ Compiled successfully` or similar — no TypeScript or build errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/releaseNotes.ts CHANGELOG.md
git commit -m "$(cat <<'EOF'
Update release notes for showcase share button

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```
