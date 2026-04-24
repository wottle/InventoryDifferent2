# Sub-Page Nav Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all 13 admin sub-pages into a Next.js route group `(main)` so they share the new Technical Atelier `NavBar` and background, replacing each page's old retro inline header/back-link.

**Architecture:** A `(main)` route group gets a shared `layout.tsx` that escapes the root `container mx-auto p-4` wrapper, sets the new body background (`#f9f9fe` / dark `#111318`), and renders `NavBarNew`. Each page is `git mv`'d into the group and its inline `<header>` back-link is removed. Page content (retro styling, existing components) is untouched — that's a separate future effort per page.

**Tech Stack:** Next.js 14 App Router (route groups, nested layouts), React, Tailwind CSS, TypeScript

---

## File Map

| Action | Path |
|--------|------|
| Move (shared) | `src/app/list-new/_components/NavBar.tsx` → `src/components/NavBarNew.tsx` |
| Update import | `src/app/list-new/page.tsx` |
| Create | `src/app/(main)/layout.tsx` |
| `git mv` × 13 | `src/app/{financials,wishlist,stats,timeline,usage,print,backup,generate-images,categories,locations,templates,customFields,trash}/` → `src/app/(main)/{…}/` |
| Modify × 13 | Each page's `page.tsx` — remove inline `<header>` back-link block |

---

### Task 1: Promote NavBar to shared component

**Files:**
- Create: `web/src/components/NavBarNew.tsx` (copy of `list-new/_components/NavBar.tsx`)
- Modify: `web/src/app/list-new/_components/NavBar.tsx` (replace with re-export)
- Modify: `web/src/app/list-new/page.tsx` (no change needed — imports from `./_components/NavBar` which now re-exports)

- [ ] **Copy NavBar to shared location**

```bash
cp web/src/app/list-new/_components/NavBar.tsx web/src/components/NavBarNew.tsx
```

- [ ] **Replace list-new's NavBar with a re-export**

Replace the entire contents of `web/src/app/list-new/_components/NavBar.tsx` with:

```tsx
export { NavBar } from '../../../components/NavBarNew';
```

- [ ] **Verify dev server still loads `/list-new` with no errors**

```bash
cd web && npm run dev
# Open http://localhost:3000/list-new — NavBar should render identically
```

- [ ] **Commit**

```bash
git add web/src/components/NavBarNew.tsx web/src/app/list-new/_components/NavBar.tsx
git commit -m "refactor(nav): promote NavBar to shared src/components/NavBarNew"
```

---

### Task 2: Create the `(main)` route group layout

**Files:**
- Create: `web/src/app/(main)/layout.tsx`

The layout must:
1. Escape the root `container mx-auto p-4` via negative margins
2. Override the body background to the new palette
3. Render `NavBarNew`
4. Render children inside a padded content area with bottom clearance for the mobile bottom nav

- [ ] **Create `web/src/app/(main)/layout.tsx`**

```tsx
import { NavBar } from '../../components/NavBarNew';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-surface dark:bg-[#111318] font-inter">
      <style>{`
        body { background-color: #f9f9fe !important; }
        @media (prefers-color-scheme: dark) { body { background-color: #111318 !important; } }
      `}</style>
      <NavBar />
      <main className="max-w-[1440px] mx-auto px-8 pt-6 pb-32 md:pb-12">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Verify layout file exists**

```bash
ls web/src/app/(main)/layout.tsx
```

- [ ] **Commit**

```bash
git add web/src/app/\(main\)/layout.tsx
git commit -m "feat(nav): add (main) route group layout with NavBar and new background"
```

---

### Task 3: Move the 13 sub-pages into the route group

Route group directories use `(name)` syntax — Next.js ignores the segment for URL routing, so `/financials` stays `/financials`.

- [ ] **`git mv` all 13 page directories**

```bash
cd web/src/app
git mv financials      "(main)/financials"
git mv wishlist        "(main)/wishlist"
git mv stats           "(main)/stats"
git mv timeline        "(main)/timeline"
git mv usage           "(main)/usage"
git mv print           "(main)/print"
git mv backup          "(main)/backup"
git mv generate-images "(main)/generate-images"
git mv categories      "(main)/categories"
git mv locations       "(main)/locations"
git mv templates       "(main)/templates"
git mv customFields    "(main)/customFields"
git mv trash           "(main)/trash"
```

- [ ] **Fix import paths** — each moved `page.tsx` uses `../../components/…` and `../../lib/…`. After the move the pages are one level deeper, so paths become `../../../components/…` and `../../../lib/…`.

Run this to find all affected import lines:
```bash
grep -rn "from '../../" web/src/app/\(main\)/ --include="*.tsx"
```

For each file, do a global replace of `'../../` → `'../../../` (only the relative `../../` imports — absolute imports starting with `@` or non-relative paths are unaffected).

Example for financials:
```bash
sed -i '' "s|from '../../|from '../../../|g" web/src/app/\(main\)/financials/page.tsx
```

Repeat for all 13 pages:
```bash
for f in web/src/app/\(main\)/*/page.tsx; do
  sed -i '' "s|from '../../|from '../../../|g" "$f"
done
```

- [ ] **Verify dev server starts without module-not-found errors**

```bash
cd web && npm run dev
# Check terminal output — should be no red module resolution errors
# Navigate to http://localhost:3000/financials — page should load (still with old retro header for now)
```

- [ ] **Commit**

```bash
cd web
git add src/app/\(main\)/
git add -u src/app/financials src/app/wishlist src/app/stats src/app/timeline src/app/usage src/app/print src/app/backup src/app/"generate-images" src/app/categories src/app/locations src/app/templates src/app/customFields src/app/trash
git commit -m "refactor(nav): move 13 sub-pages into (main) route group"
```

---

### Task 4: Remove inline headers — simple pages (9 pages)

These 9 pages all share the same pattern: a `<header>` block containing a title/subtitle `<div>` and a `<Link href="/">` back-link. The entire `<header>…</header>` block is replaced by a bare `<h1>` page title so the content stays oriented.

The (main) layout already provides `<main className="max-w-[1440px] mx-auto px-8 pt-6 …">` so pages no longer need their own max-width wrapper or top padding.

**Files:**
- Modify: `web/src/app/(main)/financials/page.tsx`
- Modify: `web/src/app/(main)/wishlist/page.tsx`
- Modify: `web/src/app/(main)/stats/page.tsx`
- Modify: `web/src/app/(main)/timeline/page.tsx`
- Modify: `web/src/app/(main)/categories/page.tsx`
- Modify: `web/src/app/(main)/locations/page.tsx`
- Modify: `web/src/app/(main)/templates/page.tsx`
- Modify: `web/src/app/(main)/customFields/page.tsx`

**Pattern to remove** (exact classes vary slightly per page):
```tsx
<header className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
  <div>
    <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)]">{t.pages.X.title}</h1>
    <p className="text-sm text-[var(--muted-foreground)]">…</p>   {/* optional subtitle */}
  </div>
  <Link href="/" className="btn-retro text-sm px-3 py-1.5">
    {t.common.back}
  </Link>
</header>
```

**Replace with** (page title only, preserving the h1 for orientation):
```tsx
<h1 className="text-2xl font-light tracking-tight text-[var(--foreground)] mb-6">{t.pages.X.title}</h1>
```

- [ ] **financials** — find header at line ~193, remove the `<header>` block, add bare `<h1>`

  After edit, the return statement should open with:
  ```tsx
  return (
    <div>
      <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)] mb-6">{t.pages.financials.title}</h1>
      {/* rest of page content */}
  ```

  Also remove the `Link` import if it's only used for the back-link (check for other `<Link>` usages first):
  ```bash
  grep -n "<Link" web/src/app/\(main\)/financials/page.tsx
  ```

- [ ] **wishlist** — header at line ~618, same transformation. `<Link>` is used for other purposes — keep the import.

- [ ] **stats** — header at line ~60, same transformation.

- [ ] **timeline** — header at line ~54, same transformation.

- [ ] **categories** — header at line ~148. `<Link>` used elsewhere — keep import.

- [ ] **locations** — header at line ~139, same transformation.

- [ ] **templates** — header at line ~302. Keep `<Link>` import (used for device links).

- [ ] **customFields** — header at line ~151, same transformation.

- [ ] **Verify all 8 pages load in browser with NavBar visible and no stacked old header**

```bash
# With dev server running, open each in browser:
# http://localhost:3000/financials
# http://localhost:3000/wishlist
# http://localhost:3000/stats
# http://localhost:3000/timeline
# http://localhost:3000/categories
# http://localhost:3000/locations
# http://localhost:3000/templates
# http://localhost:3000/customFields
```

- [ ] **Commit**

```bash
git add web/src/app/\(main\)/financials/page.tsx \
        web/src/app/\(main\)/wishlist/page.tsx \
        web/src/app/\(main\)/stats/page.tsx \
        web/src/app/\(main\)/timeline/page.tsx \
        web/src/app/\(main\)/categories/page.tsx \
        web/src/app/\(main\)/locations/page.tsx \
        web/src/app/\(main\)/templates/page.tsx \
        web/src/app/\(main\)/customFields/page.tsx
git commit -m "feat(nav): replace inline headers with new NavBar on 8 simple sub-pages"
```

---

### Task 5: Remove inline headers — usage page

**Files:**
- Modify: `web/src/app/(main)/usage/page.tsx`

Usage has a slightly different structure: header at line ~61 inside a `<div className="p-4">` wrapper using `<header className="flex items-center justify-between">`.

- [ ] **Remove usage's inline header** — find the block:

```tsx
<header className="flex items-center justify-between">
  <h1 …>…</h1>
  <Link
    href="/"
    className="btn-retro inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--foreground)]"
  >
    …back…
  </Link>
</header>
```

Replace with:
```tsx
<h1 className="text-2xl font-light tracking-tight text-[var(--foreground)] mb-6">{t.pages.usage.title}</h1>
```

- [ ] **Verify `/usage` loads correctly**

- [ ] **Commit**

```bash
git add web/src/app/\(main\)/usage/page.tsx
git commit -m "feat(nav): replace inline header with new NavBar on usage page"
```

---

### Task 6: Remove back-links — generate-images page

**Files:**
- Modify: `web/src/app/(main)/generate-images/page.tsx`

This page has no `<header>` element — the back-link is a plain `<div className="flex items-center gap-3">` containing an SVG back arrow + `<h1>`.

- [ ] **Find and replace** the header div at line ~206:

```tsx
{/* Remove this entire block: */}
<div className="flex items-center gap-3">
  <Link href="/" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </Link>
  <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)]">AI Product Images</h1>
</div>
```

Replace with:
```tsx
<h1 className="text-2xl font-light tracking-tight text-[var(--foreground)] mb-6">AI Product Images</h1>
```

- [ ] **Check if `Link` import is still needed** — grep for other `<Link` usages; remove import if unused.

- [ ] **Verify `/generate-images` loads correctly**

- [ ] **Commit**

```bash
git add web/src/app/\(main\)/generate-images/page.tsx
git commit -m "feat(nav): replace inline back-link with new NavBar on generate-images page"
```

---

### Task 7: Remove back-links — print, backup, trash pages

These three pages have sticky `<header>` elements that contain functional UI (filter button, print button, restore/delete buttons) — not just navigation. **Keep the sticky header and its action buttons; only remove the `<Link href="/">` back-link inside it.**

**Files:**
- Modify: `web/src/app/(main)/print/page.tsx`
- Modify: `web/src/app/(main)/backup/page.tsx`
- Modify: `web/src/app/(main)/trash/page.tsx`

- [ ] **print** — locate the back-link at line ~472 inside the sticky header:

```tsx
<Link href="/" className="btn-retro px-3 py-2 text-sm font-medium">
  {t.common.back}
</Link>
```

Delete just that `<Link>` element. The filter and generate-print buttons stay.

- [ ] **backup** — locate back-link at line ~495:

```tsx
<Link href="/" className="btn-retro text-sm px-3 py-1.5">
  {t.common.back}
</Link>
```

Delete that `<Link>` element. If the wrapping `<div className="flex items-center gap-2">` becomes empty, delete the wrapper too.

- [ ] **trash** — locate back-link at line ~99:

```tsx
<Link href="/" className="btn-retro text-sm px-3 py-1.5">
  {t.common.back}
</Link>
```

Delete just that element.

- [ ] **Check `Link` imports** in all three — if `<Link>` is no longer used anywhere in the file, remove the import.

- [ ] **Verify all three pages load with sticky header (minus back-link) visible and new NavBar above**

```bash
# http://localhost:3000/print
# http://localhost:3000/backup
# http://localhost:3000/trash
```

- [ ] **Commit**

```bash
git add web/src/app/\(main\)/print/page.tsx \
        web/src/app/\(main\)/backup/page.tsx \
        web/src/app/\(main\)/trash/page.tsx
git commit -m "feat(nav): remove back-links from sticky-header pages (print, backup, trash)"
```

---

### Task 8: Update release notes + final build check

**Files:**
- Modify: `web/src/lib/releaseNotes.ts`

- [ ] **Add release note** to the `Unreleased` `changed` array in `web/src/lib/releaseNotes.ts`:

```ts
'All admin sub-pages now use the new Technical Atelier nav bar — route group (main) replaces per-page retro headers',
```

- [ ] **Run full web build to verify no TypeScript errors**

```bash
cd web && npm run build
# Expected: "✓ Compiled successfully" with no type errors
```

- [ ] **Smoke-test key pages in browser** — check that no pages show a doubled header (old + new) and that the NavBar's active-state highlighting works correctly for each route:

  - `/financials` — "Financials" highlighted in More dropdown
  - `/wishlist` — "Wishlist" highlighted in More dropdown
  - `/categories` — "Manage Categories" highlighted in More dropdown
  - `/trash` — "Trash" highlighted in More dropdown
  - `/list-new` — "Devices" highlighted in top nav (unchanged)

- [ ] **Commit**

```bash
git add web/src/lib/releaseNotes.ts
git commit -m "docs: update release notes for sub-page nav migration"
```

---

## Notes

- **`(main)` is invisible to the URL router.** `/financials` stays `/financials` — no redirects needed.
- **Root `/` page is unaffected** — it's outside the route group.
- **`/list-new` is unaffected** — it has its own layout and its `NavBar.tsx` now re-exports from the shared `NavBarNew`.
- **`/login` is unaffected** — standalone page, outside the group.
- **Page content styling is intentionally untouched** — `btn-retro`, `var(--border)`, etc. remain. Per-page content redesign is a separate future effort.
- **The (main) layout owns `<main>`** — each page's content renders directly inside it, so pages should no longer wrap their content in their own full-page `<div className="min-h-screen …">` containers. If a page has such a wrapper, it won't break anything but will create redundant nesting — leave for the content redesign pass.
