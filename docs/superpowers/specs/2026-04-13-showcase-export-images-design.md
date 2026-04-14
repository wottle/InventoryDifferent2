# Showcase Export/Import with Images

**Date:** 2026-04-13  
**Status:** Approved

## Context

The showcase admin already supports JSON export/import of appearance, quotes, and journeys. Image files (hero image, journey cover images) are not included in the JSON export, so restoring or migrating a showcase to a new system leaves broken image references.

This spec extends the export to bundle referenced images into a ZIP and updates the import to restore those images.

## Scope

Two image types are involved:
- **Hero image** — `ShowcaseConfig.heroImagePath`, stored at `devices/showcase-config/{uuid}.ext`
- **Journey cover images** — `ShowcaseJourney.coverImagePath`, stored at `devices/showcase-journey-{journeyId}/{uuid}.ext`

All files live under `/app/uploads/` on the API server.

---

## Export

**Endpoint:** `GET /showcase/export` (unchanged URL, requires auth)  
**Response:** `showcase-export.zip` (`Content-Disposition: attachment`)

### ZIP structure
```
showcase-export.zip
├── data.json
└── images/
    ├── devices/showcase-config/{uuid}.ext        ← hero image (if set and exists on disk)
    └── devices/showcase-journey-{id}/{uuid}.ext  ← one per journey (if set and exists on disk)
```

### data.json
Same structure as before. `exportVersion` bumped to `"1.1"`. Image paths are included as-is; any image missing from disk is omitted from the ZIP but its path is preserved in `data.json` so the import can detect and report it.

### Behavior
- Missing image files (path set but file absent on disk): silently omit from ZIP, keep path in JSON.
- No images configured: `images/` folder is omitted from ZIP (or present but empty — either is fine).

---

## Import

**Endpoint:** `POST /showcase/import` (unchanged URL, requires auth)  
**Input:** Multipart form upload, field name `file`

### Format detection
Determined by file extension of the uploaded file:
- `.zip` — new format; `data.json` inside must have `exportVersion: "1.1"`
- `.json` — old format; must have `exportVersion: "1.0"`, processed with existing logic unchanged

Both formats return a 400 if the version doesn't match the expected value for that format.

### ZIP import flow
1. Extract ZIP in a temp directory.
2. Read and parse `data.json`.
3. Copy all files under `images/` to `/app/uploads/`, preserving subdirectory structure. Overwrite existing files.
4. Before running data import: for each image path referenced in `data.json` (`config.heroImagePath`, each `journey.coverImagePath`), check whether the corresponding file exists in the ZIP's `images/` folder. If absent, set the path to `null` in the parsed data before saving.
5. Run existing data import logic (config upsert, quotes replace, journeys upsert-by-slug, chapter/device rebuild).
6. Clean up temp directory.

### Response
```json
{
  "success": true,
  "journeysImported": 3,
  "chaptersImported": 12,
  "devicesLinked": 45,
  "devicesSkipped": 2,
  "quotesImported": 6,
  "missingImages": ["devices/showcase-config/abc.jpg"]
}
```
`missingImages` is always present (empty array if none).

---

## UI Changes (`showcase/src/app/admin/data/page.tsx`)

- **Export button:** label unchanged; downloaded file is now `showcase-export.zip`.
- **Import file input:** `accept=".zip,.json"`.
- **Missing images warning:** displayed below the success summary when `missingImages.length > 0`:
  > *"1 image was not found in the export and has been cleared — you'll need to re-upload it."* (pluralized appropriately)

---

## Files to Change

| File | Change |
|------|--------|
| `api/src/index.ts` | Rewrite `GET /showcase/export` to produce ZIP; rewrite `POST /showcase/import` to accept file upload, detect ZIP vs JSON |
| `showcase/src/app/admin/data/page.tsx` | Update export download filename; update file input accept; add missing-images warning |

---

## Verification

1. `cd api && npm run build` — no TypeScript errors
2. `cd showcase && npm run build` — no Next.js errors
3. Manual test — export with images set → ZIP downloads with `data.json` + `images/` folder
4. Manual test — import ZIP on same system → data restored, images still visible
5. Manual test — import ZIP where a journey cover was missing from disk → `missingImages` populated, image reference cleared, warning shown in UI
6. Manual test — import old `.json` file → works as before
