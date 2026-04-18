# Showcase Export/Import with Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the showcase export to a ZIP file bundling `data.json` (v1.1) plus referenced images, and update the import to accept that ZIP, restore images, and report any image paths referenced but missing from the ZIP.

**Architecture:** Two targeted API route rewrites in `api/src/index.ts` (export becomes ZIP via `archiver`, import gets a dedicated multer instance and ZIP-or-JSON branch) and a UI update in `showcase/src/app/admin/data/page.tsx` (FormData upload, new accept, missing-images warning). Uses `archiver`, `unzipper`, and `multer` — all already in the project. New i18n keys added to all four language files.

**Tech Stack:** Express + multer, archiver (zip), unzipper, Node `fs.promises`, Next.js 14 App Router, Tailwind CSS

---

## File Map

| File | Change |
|------|--------|
| `api/src/index.ts` | Replace `GET /showcase/export` (ZIP output, v1.1); add dedicated `showcaseImportUpload` multer; replace `POST /showcase/import` (multipart, zip/json branch, copy images, return `missingImages`) |
| `showcase/src/app/admin/data/page.tsx` | Send import as FormData; set download filename to `.zip`; accept `.zip,.json`; add `missingImages` to `ImportSummary`; show warning when `missingImages.length > 0` |
| `showcase/src/i18n/translations/en.ts` | Add `missingImagesSingular`, `missingImagesPlural`; update `exportDesc`/`importDesc` |
| `showcase/src/i18n/translations/de.ts` | Same new keys |
| `showcase/src/i18n/translations/fr.ts` | Same new keys |
| `showcase/src/i18n/translations/es.ts` | Same new keys |

---

## Task 1: Rewrite `GET /showcase/export` to return a ZIP

**Files:**
- Modify: `api/src/index.ts` (around lines 1228–1311 — the `GET /showcase/export` handler)

The current handler returns JSON. Replace it to stream a ZIP using `archiver` (already imported on line 1118 inline; we'll `require` it the same way). The ZIP contains `data.json` (exportVersion bumped to `"1.1"`) plus any image files that actually exist on disk.

### Context

- Uploads live at `/app/uploads/{path}`. For example, `heroImagePath: "devices/showcase-config/abc.jpg"` is on disk at `/app/uploads/devices/showcase-config/abc.jpg`.
- Journey cover images: `coverImagePath: "devices/showcase-journey-{id}/xyz.jpg"`.
- Images that are set in the DB but missing on disk are silently omitted from the ZIP (their path is still preserved in `data.json` — the importer uses this to detect and report them).
- `archiver` is used elsewhere in this file (line 1118) with `require('archiver')` — use the same pattern.

- [ ] **Step 1: Replace the `GET /showcase/export` handler**

Find and replace the entire block from `app.get('/showcase/export', ...)` through its closing `});` (lines ~1228–1311) with:

```typescript
    app.get('/showcase/export', requireAuth, async (_req, res) => {
        try {
            const [config, quotes, journeys] = await Promise.all([
                defaultPrisma.showcaseConfig.findFirst(),
                defaultPrisma.showcaseQuote.findMany({ orderBy: { sortOrder: 'asc' } }),
                defaultPrisma.showcaseJourney.findMany({
                    include: {
                        chapters: {
                            include: { devices: true },
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                    orderBy: { sortOrder: 'asc' },
                }),
            ]);

            // Enrich ShowcaseDevice entries with device name/manufacturer for human reference
            const journeysWithNames = await Promise.all(
                journeys.map(async (journey) => ({
                    title: journey.title,
                    slug: journey.slug,
                    description: journey.description,
                    coverImagePath: journey.coverImagePath,
                    sortOrder: journey.sortOrder,
                    published: journey.published,
                    publishedAt: journey.publishedAt ? journey.publishedAt.toISOString() : null,
                    chapters: await Promise.all(
                        journey.chapters.map(async (chapter) => ({
                            title: chapter.title,
                            description: chapter.description,
                            sortOrder: chapter.sortOrder,
                            devices: await Promise.all(
                                chapter.devices.map(async (sd) => {
                                    const device = await defaultPrisma.device.findUnique({
                                        where: { id: sd.deviceId },
                                        select: { name: true, manufacturer: true },
                                    });
                                    return {
                                        deviceId: sd.deviceId,
                                        deviceName: device?.name ?? null,
                                        deviceManufacturer: device?.manufacturer ?? null,
                                        curatorNote: sd.curatorNote,
                                        sortOrder: sd.sortOrder,
                                        isFeatured: sd.isFeatured,
                                    };
                                })
                            ),
                        }))
                    ),
                }))
            );

            const exportData = {
                exportDate: new Date().toISOString(),
                exportVersion: '1.1',
                config: config ? {
                    siteTitle: config.siteTitle,
                    tagline: config.tagline,
                    bioText: config.bioText,
                    heroImagePath: config.heroImagePath,
                    accentColor: config.accentColor,
                    timelineCuratorNote: config.timelineCuratorNote,
                    narrativeStatement: config.narrativeStatement,
                    collectionOverview: config.collectionOverview,
                } : null,
                quotes: quotes.map((q) => ({
                    author: q.author,
                    text: q.text,
                    source: q.source,
                    isDefault: q.isDefault,
                    isEnabled: q.isEnabled,
                    sortOrder: q.sortOrder,
                })),
                journeys: journeysWithNames,
            };

            // Collect all image paths referenced in config/journeys
            const imagePaths: string[] = [];
            if (config?.heroImagePath) imagePaths.push(config.heroImagePath);
            for (const j of journeys) {
                if (j.coverImagePath) imagePaths.push(j.coverImagePath);
            }

            const uploadsDir = '/app/uploads';
            const archiver = require('archiver');
            const archive = archiver('zip', { zlib: { level: 5 } });

            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename="showcase-export.zip"');
            archive.pipe(res);

            // Add data.json
            archive.append(JSON.stringify(exportData, null, 2), { name: 'data.json' });

            // Add images that exist on disk
            for (const imgPath of imagePaths) {
                const fullPath = path.join(uploadsDir, imgPath);
                if (fs.existsSync(fullPath)) {
                    archive.file(fullPath, { name: `images/${imgPath}` });
                }
            }

            await archive.finalize();
        } catch (err) {
            console.error('Showcase export error:', err);
            if (!res.headersSent) {
                return res.status(500).json({ error: 'Export failed' });
            }
        }
    });
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd api && npm run build
```

Expected: `Found 0 errors.` Any error is a blocker — fix before proceeding.

- [ ] **Step 3: Commit**

```bash
git add api/src/index.ts
git commit -m "$(cat <<'EOF'
Rewrite showcase export to return ZIP with bundled images

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Rewrite `POST /showcase/import` to accept ZIP or JSON file upload

**Files:**
- Modify: `api/src/index.ts` (lines ~1313–1422 — the `POST /showcase/import` handler, plus the area just above it for the new multer instance)

The current handler uses `express.json()` and accepts only JSON body with `exportVersion: "1.0"`. Replace it with a multer-based handler that:
1. Accepts a file upload (field name `file`, `.zip` or `.json`)
2. For `.zip`: extracts with `unzipper`, copies images to `/app/uploads/`, nulls out image refs that were missing from the ZIP, then runs the existing data import logic
3. For `.json`: reads the file, parses it, requires `exportVersion: "1.0"`, runs existing import logic (backward compatible)
4. Always returns `missingImages` in the response (empty array for JSON imports)

### Context

- `unzipper` is already required at the top of the file (line 25) as `const unzipper = require('unzipper');`
- The existing device import (lines ~264–287) sets up a `multer.diskStorage` instance storing to `/tmp/imports` — follow the same pattern for a new `showcaseImportUpload` instance storing to `/tmp/showcase-imports`
- `uuidv4` is already imported at the top
- `path` and `fs` are already imported at the top

- [ ] **Step 1: Add the `showcaseImportUpload` multer instance**

Find the line `// ============== SHOWCASE EXPORT / IMPORT ==============` (line ~1226) and insert the multer setup immediately before it:

```typescript
    const showcaseImportStorage = multer.diskStorage({
        destination: (_req, _file, cb) => {
            const tempDir = '/tmp/showcase-imports';
            fs.mkdirSync(tempDir, { recursive: true });
            cb(null, tempDir);
        },
        filename: (_req, file, cb) => {
            cb(null, `showcase-import-${uuidv4()}${path.extname(file.originalname).toLowerCase()}`);
        },
    });

    const showcaseImportUpload = multer({
        storage: showcaseImportStorage,
        limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    });

```

- [ ] **Step 2: Replace the `POST /showcase/import` handler**

Find and replace the entire block from `app.post('/showcase/import', requireAuth, express.json({ limit: '10mb' }), ...)` through its closing `});` (lines ~1313–1422) with:

```typescript
    app.post('/showcase/import', requireAuth, showcaseImportUpload.single('file'), async (req, res) => {
        const uploadedFile = req.file;
        if (!uploadedFile) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const ext = path.extname(uploadedFile.originalname).toLowerCase();
        let data: any;
        let extractDir: string | null = null;
        const missingImages: string[] = [];

        let journeysImported = 0;
        let chaptersImported = 0;
        let devicesLinked = 0;
        let devicesSkipped = 0;
        let quotesImported = 0;

        try {
            if (ext === '.zip') {
                extractDir = `/tmp/showcase-extract-${uuidv4()}`;
                await fs.promises.mkdir(extractDir, { recursive: true });

                await new Promise<void>((resolve, reject) => {
                    fs.createReadStream(uploadedFile.path)
                        .pipe(unzipper.Extract({ path: extractDir! }))
                        .on('close', resolve)
                        .on('error', reject);
                });

                const dataJsonPath = path.join(extractDir, 'data.json');
                const dataJsonText = await fs.promises.readFile(dataJsonPath, 'utf-8');
                data = JSON.parse(dataJsonText);

                if (data.exportVersion !== '1.1') {
                    return res.status(400).json({ error: 'Invalid or unsupported showcase export file (ZIP must be version 1.1)' });
                }

                // Copy all images from images/ to /app/uploads/, preserving subdirectory structure
                const imagesDir = path.join(extractDir, 'images');
                const uploadsDir = '/app/uploads';

                const copyDirRecursive = async (src: string, dest: string): Promise<void> => {
                    await fs.promises.mkdir(dest, { recursive: true });
                    const entries = await fs.promises.readdir(src, { withFileTypes: true });
                    for (const entry of entries) {
                        const srcPath = path.join(src, entry.name);
                        const destPath = path.join(dest, entry.name);
                        if (entry.isDirectory()) {
                            await copyDirRecursive(srcPath, destPath);
                        } else {
                            await fs.promises.copyFile(srcPath, destPath);
                        }
                    }
                };

                if (fs.existsSync(imagesDir)) {
                    await copyDirRecursive(imagesDir, uploadsDir);
                }

                // Null out any image references that were not in the ZIP
                const checkImagePath = (imgPath: string | null): string | null => {
                    if (!imgPath) return null;
                    const inZip = path.join(extractDir!, 'images', imgPath);
                    if (!fs.existsSync(inZip)) {
                        missingImages.push(imgPath);
                        return null;
                    }
                    return imgPath;
                };

                if (data.config) {
                    data.config.heroImagePath = checkImagePath(data.config.heroImagePath);
                }
                if (Array.isArray(data.journeys)) {
                    for (const j of data.journeys) {
                        j.coverImagePath = checkImagePath(j.coverImagePath ?? null);
                    }
                }

            } else if (ext === '.json') {
                const text = await fs.promises.readFile(uploadedFile.path, 'utf-8');
                data = JSON.parse(text);

                if (!data || data.exportVersion !== '1.0') {
                    return res.status(400).json({ error: 'Invalid or unsupported showcase export file' });
                }
            } else {
                return res.status(400).json({ error: 'File must be .zip or .json' });
            }

            // 1. Config
            if (data.config) {
                await defaultPrisma.showcaseConfig.upsert({
                    where: { id: 'singleton' },
                    update: data.config,
                    create: { id: 'singleton', ...data.config },
                });
            }

            // 2. Quotes — replace all non-default quotes with imported non-default ones
            if (Array.isArray(data.quotes)) {
                await defaultPrisma.showcaseQuote.deleteMany({ where: { isDefault: false } });
                const nonDefaultQuotes = data.quotes.filter((q: any) => !q.isDefault);
                if (nonDefaultQuotes.length > 0) {
                    await defaultPrisma.showcaseQuote.createMany({
                        data: nonDefaultQuotes.map((q: any) => ({
                            author: q.author,
                            text: q.text,
                            source: q.source ?? null,
                            isDefault: false,
                            isEnabled: q.isEnabled ?? true,
                            sortOrder: q.sortOrder ?? 0,
                        })),
                    });
                    quotesImported = nonDefaultQuotes.length;
                }
            }

            // 3. Journeys — upsert by slug
            if (Array.isArray(data.journeys)) {
                for (const j of data.journeys) {
                    const journeyData = {
                        title: j.title,
                        description: j.description,
                        coverImagePath: j.coverImagePath ?? null,
                        sortOrder: j.sortOrder ?? 0,
                        published: j.published ?? false,
                        publishedAt: j.publishedAt ? new Date(j.publishedAt) : null,
                    };

                    const journey = await defaultPrisma.showcaseJourney.upsert({
                        where: { slug: j.slug },
                        update: journeyData,
                        create: { slug: j.slug, ...journeyData },
                    });

                    // Delete existing chapters (cascades to ShowcaseDevice)
                    await defaultPrisma.showcaseChapter.deleteMany({ where: { journeyId: journey.id } });

                    if (Array.isArray(j.chapters)) {
                        for (const c of j.chapters) {
                            const chapter = await defaultPrisma.showcaseChapter.create({
                                data: {
                                    journeyId: journey.id,
                                    title: c.title,
                                    description: c.description,
                                    sortOrder: c.sortOrder ?? 0,
                                },
                            });
                            chaptersImported++;

                            if (Array.isArray(c.devices)) {
                                for (const d of c.devices) {
                                    const deviceExists = await defaultPrisma.device.findUnique({
                                        where: { id: d.deviceId },
                                        select: { id: true },
                                    });
                                    if (deviceExists) {
                                        await defaultPrisma.showcaseDevice.create({
                                            data: {
                                                chapterId: chapter.id,
                                                deviceId: d.deviceId,
                                                curatorNote: d.curatorNote ?? null,
                                                sortOrder: d.sortOrder ?? 0,
                                                isFeatured: d.isFeatured ?? false,
                                            },
                                        });
                                        devicesLinked++;
                                    } else {
                                        devicesSkipped++;
                                    }
                                }
                            }
                        }
                    }

                    journeysImported++;
                }
            }

            return res.json({ success: true, journeysImported, chaptersImported, devicesLinked, devicesSkipped, quotesImported, missingImages });
        } catch (err) {
            console.error('Showcase import error:', err);
            return res.status(500).json({ error: 'Import failed' });
        } finally {
            await fs.promises.unlink(uploadedFile.path).catch(() => {});
            if (extractDir) {
                await fs.promises.rm(extractDir, { recursive: true, force: true }).catch(() => {});
            }
        }
    });
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd api && npm run build
```

Expected: `Found 0 errors.`

- [ ] **Step 4: Commit**

```bash
git add api/src/index.ts
git commit -m "$(cat <<'EOF'
Rewrite showcase import to accept ZIP or JSON file upload, copy images, report missing

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Add i18n keys for missing images warning

**Files:**
- Modify: `showcase/src/i18n/translations/en.ts` (type definition + English values, two places)
- Modify: `showcase/src/i18n/translations/de.ts`
- Modify: `showcase/src/i18n/translations/fr.ts`
- Modify: `showcase/src/i18n/translations/es.ts`

Two new keys are needed in `adminData`:
- `missingImagesSingular` — suffix used when `missingImages.length === 1`
- `missingImagesPlural` — suffix used when `missingImages.length > 1`

The UI will render: `{count} {count !== 1 ? t.adminData.missingImagesPlural : t.adminData.missingImagesSingular}`

So the values should read as noun phrases that complete the count:
- English singular: `"image was not found in the export and has been cleared — re-upload it from the Appearance page."`
- English plural: `"images were not found in the export and have been cleared — re-upload them from the Appearance page."`

Also update `exportDesc` and `importDesc` in English (and the other languages) to accurately describe the new ZIP format.

- [ ] **Step 1: Add type keys and English values in `en.ts`**

In `showcase/src/i18n/translations/en.ts`, find the `adminData` type block (around line 163) and add the two new keys after `devicesSkippedNote`:

```typescript
    devicesSkippedNote: string;
    missingImagesSingular: string;
    missingImagesPlural: string;
```

Then find the English values block for `adminData` (around line 403) and:

1. Update `exportDesc`:
   - Old: `'Downloads a JSON file containing all appearance settings, quotes, and journeys (including chapter and device assignments).'`
   - New: `'Downloads a ZIP file containing all appearance settings, quotes, and journeys — plus any uploaded images (hero image and journey covers).'`

2. Update `importDesc`:
   - Old: `'Imports appearance, quotes, and journeys from a previously exported JSON file. Journeys are matched by slug — existing journeys with the same slug are updated, new slugs are created. Devices not found in this system are silently dropped from chapters.'`
   - New: `'Imports appearance, quotes, and journeys from a previously exported ZIP or JSON file. Journeys are matched by slug — existing journeys with the same slug are updated, new slugs are created. Devices not found in this system are silently dropped from chapters.'`

3. Add after `devicesSkippedNote`:
   ```typescript
   missingImagesSingular: 'image was not found in the export and has been cleared — re-upload it from the Appearance page.',
   missingImagesPlural: 'images were not found in the export and have been cleared — re-upload them from the Appearance page.',
   ```

- [ ] **Step 2: Add German values in `de.ts`**

In `showcase/src/i18n/translations/de.ts`, find the `adminData` block and:

1. Update `exportDesc`:
   - Old: `'Lädt eine JSON-Datei herunter, die alle Darstellungseinstellungen, Zitate und Reisen enthält (einschließlich Kapitel- und Gerätezuordnungen).'`
   - New: `'Lädt eine ZIP-Datei herunter, die alle Darstellungseinstellungen, Zitate und Reisen enthält – einschließlich hochgeladener Bilder (Hero-Bild und Journey-Cover).'`

2. Update `importDesc`:
   - Old: `'Importiert Darstellung, Zitate und Reisen aus einer zuvor exportierten JSON-Datei. Reisen werden per Slug abgeglichen — bestehende Reisen mit demselben Slug werden aktualisiert, neue Slugs werden erstellt. Geräte, die in diesem System nicht gefunden werden, werden still aus Kapiteln entfernt.'`
   - New: `'Importiert Darstellung, Zitate und Reisen aus einer zuvor exportierten ZIP- oder JSON-Datei. Reisen werden per Slug abgeglichen — bestehende Reisen mit demselben Slug werden aktualisiert, neue Slugs werden erstellt. Geräte, die in diesem System nicht gefunden werden, werden still aus Kapiteln entfernt.'`

3. Add after `devicesSkippedNote`:
   ```typescript
   missingImagesSingular: 'Bild wurde im Export nicht gefunden und wurde geleert – laden Sie es über die Seite „Darstellung" erneut hoch.',
   missingImagesPlural: 'Bilder wurden im Export nicht gefunden und wurden geleert – laden Sie sie über die Seite „Darstellung" erneut hoch.',
   ```

- [ ] **Step 3: Add French values in `fr.ts`**

In `showcase/src/i18n/translations/fr.ts`, find the `adminData` block and:

1. Update `exportDesc`:
   - Old: `'Télécharge un fichier JSON contenant tous les paramètres d\u2019apparence, les citations et les voyages (y compris les chapitres et les appareils associés).'`
   - New: `'Télécharge un fichier ZIP contenant tous les paramètres d\u2019apparence, les citations et les voyages — ainsi que les images téléversées (image principale et couvertures de voyages).'`

2. Update `importDesc`:
   - Old: `'Importe l\u2019apparence, les citations et les voyages depuis un fichier JSON précédemment exporté. Les voyages sont associés par slug \u2014 les voyages existants avec le même slug sont mis à jour, les nouveaux slugs sont créés. Les appareils non trouvés dans ce système sont silencieusement retirés des chapitres.'`
   - New: `'Importe l\u2019apparence, les citations et les voyages depuis un fichier ZIP ou JSON précédemment exporté. Les voyages sont associés par slug \u2014 les voyages existants avec le même slug sont mis à jour, les nouveaux slugs sont créés. Les appareils non trouvés dans ce système sont silencieusement retirés des chapitres.'`

3. Add after `devicesSkippedNote`:
   ```typescript
   missingImagesSingular: "image n\u2019a pas été trouvée dans l\u2019export et a été effacée \u2014 re-téléversez-la depuis la page Apparence.",
   missingImagesPlural: "images n\u2019ont pas été trouvées dans l\u2019export et ont été effacées \u2014 re-téléversez-les depuis la page Apparence.",
   ```

- [ ] **Step 4: Add Spanish values in `es.ts`**

In `showcase/src/i18n/translations/es.ts`, find the `adminData` block and:

1. Update `exportDesc`:
   - Old: `'Descarga un archivo JSON con todos los ajustes de apariencia, citas y travesías (incluyendo capítulos y dispositivos asignados).'`
   - New: `'Descarga un archivo ZIP con todos los ajustes de apariencia, citas y travesías, incluyendo las imágenes subidas (imagen principal y portadas de travesías).'`

2. Update `importDesc`:
   - Old: `'Importa apariencia, citas y travesías desde un archivo JSON exportado previamente. Las travesías se asocian por slug \u2014 las existentes con el mismo slug se actualizan, los nuevos slugs se crean. Los dispositivos no encontrados en este sistema se eliminan silenciosamente de los capítulos.'`
   - New: `'Importa apariencia, citas y travesías desde un archivo ZIP o JSON exportado previamente. Las travesías se asocian por slug \u2014 las existentes con el mismo slug se actualizan, los nuevos slugs se crean. Los dispositivos no encontrados en este sistema se eliminan silenciosamente de los capítulos.'`

3. Add after `devicesSkippedNote`:
   ```typescript
   missingImagesSingular: 'imagen no se encontró en el export y ha sido eliminada — vuelva a subirla desde la página de Apariencia.',
   missingImagesPlural: 'imágenes no se encontraron en el export y han sido eliminadas — vuelva a subirlas desde la página de Apariencia.',
   ```

- [ ] **Step 5: Verify showcase builds**

```bash
cd showcase && npm run build
```

Expected: build completes with no TypeScript or Next.js errors.

- [ ] **Step 6: Commit**

```bash
git add showcase/src/i18n/translations/en.ts showcase/src/i18n/translations/de.ts showcase/src/i18n/translations/fr.ts showcase/src/i18n/translations/es.ts
git commit -m "$(cat <<'EOF'
Add missing-images i18n keys and update export/import descriptions for ZIP format

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Update showcase data page UI

**Files:**
- Modify: `showcase/src/app/admin/data/page.tsx`

Three changes:
1. Export: download filename → `showcase-export.zip`
2. Import file input: `accept=".zip,.json,application/zip,application/json"`
3. Import handler: send as `FormData` (multipart) instead of JSON body
4. `ImportSummary` interface: add `missingImages: string[]`
5. Success display: add orange warning block when `missingImages.length > 0`

The error key `errorInvalidJson` is no longer used (the server handles all format detection now) — but leave it in the translations since removing it would be churn with no benefit.

- [ ] **Step 1: Replace the entire file**

Replace `showcase/src/app/admin/data/page.tsx` with:

```tsx
"use client";

import { useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { API_BASE_URL } from '@/lib/config';
import { useT } from '@/i18n/context';

interface ImportSummary {
  journeysImported: number;
  chaptersImported: number;
  devicesLinked: number;
  devicesSkipped: number;
  quotesImported: number;
  missingImages: string[];
}

export default function AdminDataPage() {
  const t = useT();
  const { getAccessToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setExportError('');
    try {
      const token = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/showcase/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'showcase-export.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setImportError('');
    setImportSummary(null);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setImportError('');
    setImportSummary(null);
    try {
      const token = getAccessToken();
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetch(`${API_BASE_URL}/showcase/import`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Server error ${response.status}`);
      }
      setImportSummary({ ...result, missingImages: result.missingImages ?? [] });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setImportError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-headline font-bold text-on-surface mb-1">{t.adminData.title}</h1>
        <p className="text-sm text-on-surface-variant">
          {t.adminData.subtitle}
        </p>
      </div>

      {/* Export */}
      <section className="bg-surface-container rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-on-surface">{t.adminData.exportSection}</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {t.adminData.exportDesc}
          </p>
        </div>
        {exportError && (
          <p className="text-sm text-error">{exportError}</p>
        )}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition"
        >
          {exporting ? (
            <>
              <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              {t.adminData.exporting}
            </>
          ) : (
            t.adminData.exportBtn
          )}
        </button>
      </section>

      {/* Import */}
      <section className="bg-surface-container rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-on-surface">{t.adminData.importSection}</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {t.adminData.importDesc}
          </p>
        </div>

        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.json,application/zip,application/json"
            onChange={handleFileChange}
            className="block text-sm text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-surface-container-high file:text-on-surface file:text-sm file:cursor-pointer hover:file:bg-surface-container-highest"
          />
          <button
            onClick={handleImport}
            disabled={importing || !selectedFile}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {importing ? (
              <>
                <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                {t.adminData.importing}
              </>
            ) : (
              t.adminData.importBtn
            )}
          </button>
        </div>

        {importError && (
          <p className="text-sm text-error">{importError}</p>
        )}

        {importSummary && (
          <div className="rounded-lg bg-surface-container-high p-4 space-y-1.5">
            <p className="text-sm font-semibold text-on-surface">{t.adminData.importComplete}</p>
            <ul className="text-sm text-on-surface-variant space-y-0.5">
              <li>{importSummary.journeysImported} {importSummary.journeysImported !== 1 ? t.adminData.journeyPlural : t.adminData.journeySingular} imported</li>
              <li>{importSummary.chaptersImported} {importSummary.chaptersImported !== 1 ? t.adminData.chapterPlural : t.adminData.chapterSingular} imported</li>
              <li>{importSummary.devicesLinked} {importSummary.devicesLinked !== 1 ? t.adminData.deviceLinkedPlural : t.adminData.deviceLinkedSingular}</li>
              {importSummary.devicesSkipped > 0 && (
                <li className="text-on-surface-variant/70">
                  {importSummary.devicesSkipped} {importSummary.devicesSkipped !== 1 ? t.adminData.deviceSkippedPlural : t.adminData.deviceSkippedSingular}
                </li>
              )}
              <li>{importSummary.quotesImported} {importSummary.quotesImported !== 1 ? t.adminData.quotePlural : t.adminData.quoteSingular} imported</li>
            </ul>
            {importSummary.missingImages.length > 0 && (
              <p className="text-sm text-amber-700 mt-2">
                {importSummary.missingImages.length}{' '}
                {importSummary.missingImages.length !== 1
                  ? t.adminData.missingImagesPlural
                  : t.adminData.missingImagesSingular}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify showcase builds**

```bash
cd showcase && npm run build
```

Expected: build completes with no TypeScript or Next.js errors.

- [ ] **Step 3: Commit**

```bash
git add showcase/src/app/admin/data/page.tsx
git commit -m "$(cat <<'EOF'
Update showcase data page: ZIP download, multipart upload, missing-images warning

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Build verification and release notes

**Files:**
- Verify: `api/` and `showcase/` builds
- Modify: `web/src/lib/releaseNotes.ts`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Run full builds**

```bash
cd api && npm run build && cd ../showcase && npm run build
```

Expected: both complete with zero errors. Any error is a blocker.

- [ ] **Step 2: Manual verification checklist**

Open the showcase admin at `/admin/data`.

1. **Export** — Click "Export Showcase Data". A file named `showcase-export.zip` should download. Unzip it — confirm `data.json` exists with `exportVersion: "1.1"` and (if images are configured) an `images/` folder with the hero image and/or journey cover images.

2. **Import ZIP on same system** — Import the ZIP you just downloaded. Summary shows counts, no missing-images warning.

3. **Import ZIP with missing image** — Create a ZIP where the `images/` folder is absent or incomplete (remove one file), import it. Summary shows the missing-images warning: "1 image was not found in the export and has been cleared…"

4. **Import old JSON** — Export from a system that still has v1.0 JSON (or craft one manually: `{"exportVersion":"1.0","quotes":[],"journeys":[]}`). Import it — should succeed with no missing-images warning.

5. **Desktop regression** — The data page looks correct at normal viewport width.

- [ ] **Step 3: Update release notes**

In `web/src/lib/releaseNotes.ts`, add to the `Unreleased` `added` array:

```ts
'Showcase Data export now downloads a ZIP file bundling appearance settings, quotes, journeys, and uploaded images (hero and journey covers); import accepts ZIP or the legacy JSON format and reports any image references that were missing from the archive',
```

In `CHANGELOG.md`, add under `[Unreleased]` → `### Added`:

```
- Showcase Data export now downloads a ZIP file bundling appearance settings, quotes, journeys, and uploaded images (hero and journey covers); import accepts ZIP or the legacy JSON format and reports any image references that were missing from the archive
```

- [ ] **Step 4: Commit release notes**

```bash
git add web/src/lib/releaseNotes.ts CHANGELOG.md
git commit -m "$(cat <<'EOF'
Update release notes for showcase ZIP export/import with images

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```
