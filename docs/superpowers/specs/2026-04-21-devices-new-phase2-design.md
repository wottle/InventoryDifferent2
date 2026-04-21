# Device Detail Redesign — Phase 2 Spec

**Date:** 2026-04-21
**Status:** Approved
**Builds on:** `web/src/app/devices_new/[id]/page.tsx` (Phase 1)

---

## Overview

Phase 2 adds three categories of missing content to the redesigned device detail page, plus dedicated full-page sub-pages for notes, maintenance logs, and photos.

**Decisions made:**
- Accessories, Related Devices, and Links → left editorial column (after Historical Notes, before Tags)
- Value History → anchored popover tooltip from the Estimated Value card (no modal backdrop)
- Notes / Logs / Photos → dedicated sub-page routes with back navigation

---

## 1. Left Column Additions

### 1a. Accessories

Renders a compact chip list of `device.accessories`. Only shown when accessories exist or user is authenticated.

**Visual:** `<section>` with heading `ACCESSORIES`, chips in a flex-wrap row. Each chip shows the accessory name. Authenticated users see a `×` remove button per chip and an inline text input + Add button to attach new ones.

**Mutations reused:** `ADD_DEVICE_ACCESSORY`, `REMOVE_DEVICE_ACCESSORY` (already in GQL block in page.tsx).

**State needed:** `accessoryName` string, `addingAccessory` boolean (mirrors existing tag pattern exactly).

### 1b. Related Devices

Renders linked devices from `device.relationsFrom` and `device.relationsTo`. Only shown when at least one relationship exists.

**Visual:** `<section>` with heading `RELATED DEVICES`. Each entry is a horizontal row card:
- 40×40px thumbnail (using `pickThumbnail(device.images)` logic, or placeholder icon)
- Device name + manufacturer in two-line text block
- Relationship type badge (e.g. `COMPATIBLE`, `SUCCESSOR`, `ACCESSORY_OF`) rendered as a small uppercase label
- The card is a `<Link>` to `/devices_new/{relatedDeviceId}`

Combine both directions: `relationsFrom` has `toDevice`, `relationsTo` has `fromDevice`. Deduplicate by device id before rendering.

**No mutations** in the detail page — relationships are managed on the edit page. No add/remove UI here.

### 1c. Links

Renders `device.links` (each has `id`, `label`, `url`). Only shown when links exist or user is authenticated.

**Visual:** `<section>` with heading `LINKS`. Each link is a row with an external-link icon, label text, and the URL truncated. The entire row is an `<a target="_blank" rel="noopener noreferrer">`. Authenticated users see a `×` remove button per link and a two-field inline form (label + URL) to add new ones.

**Mutations reused:** `ADD_DEVICE_LINK`, `REMOVE_DEVICE_LINK` (already in GQL block).

**State needed:** `linkFormData: { label: string, url: string }`, `addingLink` boolean.

**Section order in left column (final):**
1. Quick Overview
2. Indicator Cards
3. Financials (auth-gated)
4. Technical Specifications
5. Historical Significance
6. **Accessories** ← new
7. **Related Devices** ← new
8. **Links** ← new
9. Tags

---

## 2. Value History Popover

### Trigger

The existing Estimated Value card (white card, `border-l-4 border-tertiary`) becomes clickable. A small "History ↗" label or chart icon button appears in the card's top-right corner. Clicking it opens the popover.

### Popover Behavior

- Positioned absolutely relative to the financial card container using a `ref` on the card and `useState` for open/closed
- No backdrop — the page remains interactive behind it
- Clicking outside the popover (detected via `useEffect` + `mousedown` listener) dismisses it
- `Escape` key also dismisses

### Popover Visual

A white rounded card (`rounded-xl shadow-lg border border-outline-variant/20`) with:
- Directional arrow (CSS `::before` pseudo or small rotated div) pointing toward the trigger card
- Header: "VALUE HISTORY" label (10px uppercase) + close `×` button
- `DeviceValueChart` component (existing, reused as-is)
- Footer: "N snapshots · first recorded [date]" or "No history yet" if `< 2` snapshots

**Popover width:** `w-72` (288px), positioned below the trigger card by default (using `top: 100% + 8px` relative to the card). If near the bottom of the viewport, flip to above. On small screens, stretches to full card width.

### Data

Already fetched: `const { data: valueHistoryData } = useQuery(GET_VALUE_HISTORY, ...)` exists in the page. No new queries needed.

Chart data shape (already used in existing page pattern):
```tsx
const chartData = (valueHistoryData?.valueHistory ?? []).map((v: any) => ({
  date: new Date(v.snapshotDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
  dateMs: new Date(v.snapshotDate).getTime(),
  value: v.estimatedValue,
}));
```

---

## 3. Sub-Pages

Three new `"use client"` pages under `web/src/app/devices_new/[id]/`:

| Route | File |
|---|---|
| `/devices_new/[id]/notes` | `web/src/app/devices_new/[id]/notes/page.tsx` |
| `/devices_new/[id]/logs` | `web/src/app/devices_new/[id]/logs/page.tsx` |
| `/devices_new/[id]/photos` | `web/src/app/devices_new/[id]/photos/page.tsx` |

All three share the same structural pattern:
1. Back nav: `← {device.name}` link back to `/devices_new/{id}`
2. Page title + item count
3. Auth-gated add button
4. Full content list
5. Reuse the same `GET_DEVICE` query (via `useQuery`) — no new GQL needed

### 3a. Notes page (`/notes`)

**Layout:** Full-width timeline. Each note occupies its own card-style entry:
- Date in `10px uppercase` label
- Note content in `text-sm italic text-on-surface-variant`
- Auth: edit (inline expand to textarea) and delete (with confirm) buttons per note
- Add note form at the top when authenticated (content textarea + date input, same as modal in detail page but inline)
- Sort: newest first, with a toggle to flip to oldest first

**Mutations:** `CREATE_NOTE`, `UPDATE_NOTE`, `DELETE_NOTE` — all already defined in the detail page; copy the GQL documents.

### 3b. Logs page (`/logs`)

**Layout:** Vertical list of maintenance task cards, newest first. Each card shows:
- Label (bold)
- Date completed
- Notes (if any)
- Cost (if any), formatted as `$X.XX`
- Auth: delete button with confirmation

**Summary banner** at top: total cost of all tasks (`$X.XX across N tasks`), auth-gated.

**Mutations:** `CREATE_MAINTENANCE_TASK`, `DELETE_MAINTENANCE_TASK` — copy GQL from detail page. Add button at top when authenticated opens the existing maintenance form (same fields as detail page modal, but rendered as a card at top of list rather than a floating modal).

### 3c. Photos page (`/photos`)

**Layout:** Masonry-style grid (CSS columns, not JS masonry library). Three columns on `lg+`, two on `md`, one on mobile. Each image:
- Shows full image (not thumbnail crop) — `object-contain` within a `max-h-96` container
- Caption below if present
- Auth: set thumbnail / set shop image / set listing image role buttons (small icon buttons)
- Auth: delete button with confirmation
- Click opens a full-screen lightbox (reuse the lightbox logic from the detail page)

**Upload:** Auth-gated `ImageUploader` component rendered as a prominent add area at the top of the page.

**Image roles:** Small pill badges (`THUMBNAIL`, `SHOP`, `LISTING`) shown on images that have those roles set.

**Mutations:** reuse existing image mutation GQL from the detail page. New GQL needed: image role update mutations (check existing page for `UPDATE_IMAGE_CAPTION`, `UPDATE_IMAGE_THUMBNAIL_MODE`, `DELETE_IMAGE`).

---

## 4. Detail Page "View All" Links

The existing 5-item preview sections in `page.tsx` need "View all →" links added:

| Section | Link target |
|---|---|
| Photos grid (right column) | `/devices_new/{id}/photos` |
| Maintenance Logs (right column) | `/devices_new/{id}/logs` |
| Recent Notes (right column) | `/devices_new/{id}/notes` |

Each link sits in the section header row, right-aligned, `text-xs text-primary font-semibold`.

---

## 5. Files Summary

| Action | File |
|---|---|
| Modify | `web/src/app/devices_new/[id]/page.tsx` |
| Create | `web/src/app/devices_new/[id]/notes/page.tsx` |
| Create | `web/src/app/devices_new/[id]/logs/page.tsx` |
| Create | `web/src/app/devices_new/[id]/photos/page.tsx` |

No new components, no Tailwind changes, no new GQL operations (beyond copying existing ones to sub-page files).

---

## 6. Out of Scope

- Dark mode support for new sections (follow-up)
- Relationship add/remove on the detail page (edit page concern)
- Pagination on sub-pages (all items shown, acceptable for v1 collection sizes)
- Photos masonry using a JS library (CSS columns is sufficient)
