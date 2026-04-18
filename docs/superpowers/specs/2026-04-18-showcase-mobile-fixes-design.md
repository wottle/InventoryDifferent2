# Showcase Mobile Fixes

**Date:** 2026-04-18  
**Status:** Approved

## Context

Four mobile UX bugs on the showcase site:
1. Homepage featured journey + quotes render side-by-side on mobile (no responsive breakpoint on the 12-column grid)
2. Nav links are hidden on mobile (`hidden md:flex`) with no hamburger fallback — Timeline and Journeys are unreachable
3. Timeline era filter is completely unresponsive to touch on mobile (`<li onClick>` — list items aren't natively tappable)
4. Timeline category filter: tapping to select works, but tapping the selected category to deselect doesn't (iOS double-tap delay bug)

---

## Fix 1 — Homepage grid (`showcase/src/app/page.tsx`)

**Section:** "Gallery / Highlights" — the `grid grid-cols-12 gap-6 h-[800px]` block (lines ~193–275)

### Changes
- `grid grid-cols-12` → `grid grid-cols-1 md:grid-cols-12`
- `h-[800px]` → `h-auto md:h-[800px]`
- Featured journey tile: `col-span-8 h-full` → `col-span-12 md:col-span-8 h-72 md:h-full`
- Right column (quotes): `col-span-4 flex flex-col gap-6 h-full` → `col-span-12 md:col-span-4 flex flex-col gap-6 h-auto md:h-full`
- Each quote card: `h-1/2` → `h-64 md:h-1/2`

### Result
Mobile: featured journey card (full width, 288px tall), then two quote cards stacked below (full width, 256px each).  
Desktop: unchanged 8/4 split at 800px height.

---

## Fix 2 — Mobile nav (`showcase/src/components/Nav.tsx`)

### Changes
Add `isOpen: boolean` state. The nav bar gains two new mobile-only elements:

**Hamburger button** (`md:hidden`, right side of bar):
- Shows three horizontal bars when closed, an X when open
- `onClick` toggles `isOpen`

**Dropdown panel** (rendered below the nav bar when `isOpen`):
- Same glass style: `bg-white/80 backdrop-blur-xl border-t border-outline-variant/10`
- Full width, `absolute top-full left-0 w-full`
- Contains the three nav links (Journeys, Timeline, About) as stacked full-width items with `py-4 px-8` padding
- Explore button at the bottom of the dropdown, full width
- Each link closes the menu (`setIsOpen(false)`) on click
- Animated with `transition-opacity duration-150`: `opacity-0 pointer-events-none` when closed, `opacity-100 pointer-events-auto` when open

**Desktop nav:** unchanged — hamburger is `md:hidden`, existing `hidden md:flex` link row and Explore button stay as-is.

---

## Fix 3 — Timeline era filter touch (`showcase/src/components/TimelineClient.tsx`)

### Era filter: `<li>` → `<button>`
Convert each era list item from `<li onClick>` to `<button>` to ensure native tappability on mobile.

Before:
```jsx
<li
  key={era.label}
  className="flex items-center justify-between group cursor-pointer"
  onClick={() => handleEra(era.range)}
>
```

After:
```jsx
<button
  key={era.label}
  className="flex items-center justify-between w-full group touch-manipulation"
  onClick={() => handleEra(era.range)}
>
```

Wrap in a `<div>` instead of `<ul>/<li>` since the list semantics add no value here. The `space-y-4` spacing moves to the wrapper div.

### Category buttons: add `touch-manipulation`
Add `touch-manipulation` to the existing category `<button>` className. This disables the 300ms iOS double-tap delay that prevents the deselect tap from registering.

Before:
```jsx
className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all border ${...}`}
```

After:
```jsx
className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all border touch-manipulation ${...}`}
```

---

## Files to Change

| File | Fix |
|------|-----|
| `showcase/src/app/page.tsx` | Add responsive breakpoints to homepage grid and card heights |
| `showcase/src/components/Nav.tsx` | Add hamburger toggle + dropdown panel |
| `showcase/src/components/TimelineClient.tsx` | Convert era `<li>` to `<button>`, add `touch-manipulation` to category buttons |

---

## Verification

1. `cd showcase && npm run build` — no Next.js errors
2. Mobile browser (or DevTools device emulation at 390px width):
   - Homepage: featured journey and quotes stack vertically
   - Nav: hamburger button visible; tap opens dropdown with all links; tap a link closes it
   - Timeline: tap era list items → filter applies and toggles off correctly
   - Timeline: tap a category → tap again → deselects correctly
3. Desktop (≥768px): no visual regressions on homepage grid, nav, or timeline sidebar
