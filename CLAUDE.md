# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InvDifferent2 is a vintage computer collection inventory management system. It's a full-stack monorepo with:
- **api/**: GraphQL API (Express + Apollo Server + Prisma + PostgreSQL)
- **web/**: Admin dashboard (Next.js 14 App Router)
- **storefront/**: Public shop frontend (Next.js 14)
- **mcp-server/**: AI integration via Model Context Protocol
- **ios/**: Native iOS app (SwiftUI)

## Distribution Model

This project is distributed as pre-built Docker images published to Docker Hub (`wottle/inventory-*:latest`). The primary deployment path for end users is pulling these images via `docker-compose.simple.yml` (simple/local) or `docker-compose.prod.yml` (Traefik + HTTPS). End-user setup instructions live in `README.md`.

## Branch & PR Workflow

All work follows a **dev-first** flow — `dev` is the staging branch, `main` is production:

1. Create a feature or fix branch from `dev` (e.g. `fix/my-bug`, `feature/my-feature`)
2. Open a PR targeting **`dev`** — never target `main` directly
3. Merge to `dev` → GitHub Actions builds and pushes `:dev` images for staging verification
4. Test on staging (`docker compose pull && docker compose up -d`)
5. When confirmed working, merge `dev` → `main` to publish `:latest` for end users

To promote `dev` → `main`:
- Merge via PR, **or**
- Via Actions → Retag Docker Images (skips rebuild if images are already good)

Users update by running `docker compose pull && docker compose up -d` — migrations run automatically on container start via `api/entrypoint.sh`.

The `./build-and-push.sh` script still exists for manual local builds if needed, but the normal path is CI/CD via GitHub Actions.

The `docker-compose.simple.yml` file is for users without a reverse proxy (direct port exposure). The `docker-compose.prod.yml` file is for Traefik deployments with HTTPS using pre-built Hub images. The `docker-compose.build.yml` file is for building from source with Traefik. The `docker-compose.nas.yml` file is the author's personal NAS deployment and is not intended as a template for other users.

## Development Commands

```bash
# Start all services with Docker
docker-compose up

# Individual service development
cd api && npm run build && npm start    # API on port 4000
cd web && npm run dev                    # Admin web on port 3000
cd storefront && npm run dev             # Shop on port 3001
cd mcp-server && npm run dev             # MCP server on port 3002

# Database operations (from api/)
npx prisma migrate dev                   # Run migrations
npx prisma generate                      # Regenerate client
npm run prisma:seed                      # Seed database

# Linting (web/)
npm run lint

# Build for production
cd api && npm run build                  # Compiles to dist/
cd web && npm run build                  # Next.js build
cd storefront && npm run build

# Docker multi-arch build and push (manual; normally handled by GitHub Actions on push to main)
./build-and-push.sh
```

## Architecture

### Data Flow
```
iOS App / Web / Storefront → GraphQL API (port 4000) → PostgreSQL
                                  ↓
                            /uploads (file storage)
```

### GraphQL API Structure (api/)
- `src/index.ts`: Express server, file upload handlers, import/export logic
- `src/resolvers.ts`: All GraphQL resolver implementations
- `src/typeDefs.ts`: GraphQL schema definitions
- `prisma/schema.prisma`: Database schema (source of truth for data model)

### Key API Endpoints
- `/graphql`: Apollo GraphQL server
- `/upload`: File upload (multer, 10MB limit)
- `/imports`: ZIP bulk import/export (2GB limit)
- `/uploads`: Static file serving
- `/auth/login`: POST - Admin login (returns JWT tokens)
- `/auth/refresh`: POST - Refresh access token
- `/auth/status`: GET - Check authentication status

### Web App Structure (web/)
- Uses Next.js 14 App Router
- Apollo Client configured in `src/app/layout.tsx`
- Main pages: `/devices`, `/categories`, `/templates`, `/financials`, `/trash`
- AI chat integration in `src/components/CollectionChat.tsx`

### MCP Server (mcp-server/)
Provides tools for AI assistants to query inventory:
- Device search and filtering
- Financial summaries
- Uses same GraphQL API as web clients

## Data Model (Core Entities)

**Device**: Main inventory item
- Status: COLLECTION | FOR_SALE | PENDING_SALE | SOLD | DONATED | IN_REPAIR | RETURNED
- FunctionalStatus: YES | PARTIAL | NO
- Relations: category, images, notes, maintenanceTasks, tags

**Category**: Device categories with types (COMPUTER | PERIPHERAL | ACCESSORY | OTHER)

See `api/prisma/schema.prisma` for complete schema.

## Schema Change Checklist

When adding, removing, or renaming fields in `api/prisma/schema.prisma`, every layer that touches that data must be updated in the **same commit**. Missing any one of these will break the Docker build or produce silent data loss.

**Required updates for any Device/Template field change:**

1. **`api/prisma/schema.prisma`** — source of truth; write the migration SQL in `api/prisma/migrations/`
2. **`mcp-server/prisma/schema.prisma`** — mirror of Device/Template models; must stay in sync or `tsc` fails at Docker build time
3. **`api/src/typeDefs.ts`** — GraphQL schema; add/remove the field from the relevant type and any input types
4. **`api/src/resolvers.ts`** — read/write the field in the appropriate resolvers
5. **`api/src/index.ts`** — any REST endpoints, bulk import/export, or search text construction that references the field
6. **`mcp-server/src/index.ts`** — all four tool handlers (`search_devices`, `get_device_details`, `list_all_devices`, `list_devices`) include/select and map device fields
7. **`api/prisma/seed.ts`** — `parseTemplatesFromSql` and the template upsert `update`/`create` blocks; parsing logic must match the migration SQL so fresh installs produce the same structured data as migrated databases
8. **Web** (`web/src/`) — form components, display components, GraphQL queries/fragments, TypeScript types
9. **iOS** (`ios/`) — `Models/Device.swift`, `Models/Template.swift`, views that display or edit the field, GraphQL query strings in Services

**For new relation tables** (e.g. adding a `DeviceStorage` join table):
- Add the model to **both** `api/prisma/schema.prisma` and `mcp-server/prisma/schema.prisma`
- Add the relation field on `Device` in both schemas
- Run `npx prisma generate` in **both** `api/` and `mcp-server/` after schema changes
- Update seed logic to populate/migrate the relation rows (not just the scalar columns)

**Verification before committing:**
```bash
cd api && npx tsc --noEmit          # must pass
cd mcp-server && npx tsc --noEmit   # must pass
cd web && npm run build              # must pass
```

## GraphQL Patterns

Filtering uses `DeviceWhereInput`:
```graphql
devices(where: { status: FOR_SALE, categoryId: "..." })
device(where: { id: "..." })
```

All CRUD operations follow pattern: `createX`, `updateX`, `deleteX`

## File Upload Handling

- Files stored at `/uploads/devices/{deviceId}/`
- UUID filenames for uniqueness
- Sharp generates thumbnails on import
- EXIF date extraction from images

## Authentication

Single-user JWT-based authentication protects sensitive inventory data while allowing public browsing.

### Configuration
- `AUTH_PASSWORD`: Admin password (required for auth to be enabled)
- `JWT_SECRET`: Secret for signing JWTs (auto-generated if not set)

### Behavior
- If `AUTH_PASSWORD` is not set, authentication is disabled (backwards compatible)
- When enabled, unauthenticated users can view devices but not see prices, notes, or acquisition info
- All mutations and admin pages (financials, categories, templates, trash) require authentication
- Storefront remains fully public

### Auth Flow
1. Client calls `POST /auth/login` with password
2. API returns access token (1h) and refresh token (7d)
3. Client includes `Authorization: Bearer <token>` header on requests
4. Client refreshes token before expiry via `POST /auth/refresh`

## Environment Configuration

Key variables (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: Required for AI chat features
- `DOMAIN` / `SHOP_DOMAIN`: Production domains
- `AUTH_PASSWORD`: Admin password for authentication
- `JWT_SECRET`: Secret for JWT signing

## Deployment

- Development: `docker-compose.yml`
- Production (pre-built): `docker-compose.prod.yml` with Traefik reverse proxy
- Production (build from source): `docker-compose.build.yml` with Traefik reverse proxy
- NAS deployment: `docker-compose.nas.yml`

### Database Migrations

`api/entrypoint.sh` runs `npx prisma migrate deploy` automatically on every container start. Migrations are applied automatically when redeploying a new image — no manual migration step is needed on the NAS.

See `DEPLOYMENT.md` for detailed deployment instructions.

## Docker Images

Docker Hub images (all multi-arch: amd64 + arm64):
- `wottle/inventory-api:latest`
- `wottle/inventory-web:latest`
- `wottle/inventory-storefront:latest`
- `wottle/inventory-mcp:latest`

Build and push all images: `./build-and-push.sh`

## GitHub Actions Workflow Files

The security hook blocks the Write and Edit tools on `.github/workflows/*.yml` files. Use Bash with a heredoc instead:
```bash
cat > .github/workflows/foo.yml << 'EOF'
...
EOF
```

## Build Verification Order

When verifying builds, always build in this order:
1. `cd api && npm run build` — API (TypeScript compilation)
2. `cd web && npm run build` — Web admin dashboard (Next.js)
3. `cd storefront && npm run build` — Storefront (Next.js)
4. iOS via `xcodebuild` (when iOS changes were made)

### iOS Build Command
```bash
xcodebuild -scheme InventoryDifferent -destination 'platform=iOS Simulator,id=9116C8FB-2461-4260-B7DD-FE254FD202DE' build 2>&1 | grep -E "(BUILD SUCCEEDED|BUILD FAILED|error:)"
```
SourceKit/LSP will often report "Cannot find type X in scope" for cross-file references — these are indexing artifacts, not real errors. Always verify with `xcodebuild`, not IDE diagnostics.

Also run `npx tsc --noEmit` in any changed package (api/web/storefront) — CI requires this to pass. A successful `npm run build` does not guarantee tsc is clean.

Run all applicable builds after making changes to verify nothing is broken before committing.

## Multi-Language (i18n) Support

The app supports English, German, French, and Spanish. Every user-visible string **must** go through the translation system — never hardcode UI text.

### Web (Next.js)

- **Translation files**: `web/src/i18n/translations/en.ts`, `de.ts`, `fr.ts`, and `es.ts`
  - `en.ts` defines the `Translations` TypeScript type **and** the English values
  - `de.ts`, `fr.ts`, and `es.ts` export only values (share the type from `en.ts`)
- **Consuming translations**: call `const t = useT()` (from `../../i18n/context`) in any client component, then use `t.<section>.<key>`
- **Language selection**: The web app automatically detects the browser's language preference. To change the language:
  1. Set your browser's preferred language to English (`en`), German (`de`), French (`fr`), or Spanish (`es`)
  2. Refresh the page
  - **Chrome/Edge**: Settings → Languages → Add/reorder languages
  - **Firefox**: Settings → Language → Choose your preferred language
  - **Safari**: System Preferences → Language & Region → Preferred Languages
- **Adding a new feature**: 
  1. Add the key(s) to the `Translations` type in `en.ts`
  2. Add the English values in `en.ts`
  3. Add the German values in `de.ts`
  4. Add the French values in `fr.ts`
  5. Add the Spanish values in `es.ts`
  6. Use `t.<section>.<key>` in the component — never a hardcoded string
- **Section naming convention**: top-level sections are `common`, `nav`, `home`, `detail`, `filter`, `sort`, `card`, `table`, `icons`, `form`, `login`, `chat`, and `pages.<pageName>` for page-specific strings
- **Dynamic strings with counts/interpolation**: split into prefix/suffix keys or use JS concatenation — do not skip translation

### iOS (SwiftUI)

- **Translation files**: `ios/.../i18n/Translations.swift` (struct definitions), `Translations+en.swift`, `Translations+de.swift`, `Translations+fr.swift`
- **Consuming translations**: all views have `@EnvironmentObject var lm: LocalizationManager` and use `let t = lm.t` at the top of `body` (or at the top of helper functions that return `some View`)
- **Language selection**: via Settings.bundle — system default, English, Deutsch, or Français. Runtime switching without restart.
  - Open iOS Settings → scroll to InventoryDifferent → Language → select your preference
- **Adding a new feature**:
  1. Add the key(s) to the appropriate struct in `Translations.swift`
  2. Add English values in `Translations+en.swift`
  3. Add German values in `Translations+de.swift`
  4. Add French values in `Translations+fr.swift`
  5. Use `lm.t.<section>.<key>` in views — never hardcode strings
- **Scope rule**: `let t = lm.t` must be declared at function scope (not inside a ViewBuilder closure) so it's visible to all sibling closures in the same function

### Enum display names

- **Web**: use `(t.status as Record<string, string>)[device.status]` to map API enum values to translated labels
- **iOS**: enum `displayName` properties read from `LocalizationManager.shared.t` (singleton access)
- **Note**: chart data labels coming from the API are still in English (Phase 6 — API-level i18n — is not yet implemented). Color maps in `StatsCharts.tsx` are keyed on English label strings for this reason.

## Commit Style

- Use short, imperative mood commit messages (1-2 sentences)
- Focus on "why" not "what" — the diff shows what changed
- Use accurate verbs: "add" for new features, "update" for enhancements, "fix" for bug fixes
- Always end with: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- Use a HEREDOC to pass the commit message to ensure proper formatting

## Release Notes Workflow

The app displays a version number in the web footer (clickable for release notes). The source of truth is `web/src/lib/releaseNotes.ts`.

**During development:** Every commit that adds a feature, changes behaviour, or fixes a bug MUST also update the `Unreleased` entry in `web/src/lib/releaseNotes.ts`. Add the bullet in the same commit as the code change — never leave it for later. Use `added` for new features, `changed` for behaviour changes, and `fixed` for bug fixes. Also keep `CHANGELOG.md` in sync.

**To cut a release:** Use the `/package_release` skill, which will:
1. Prompt for the new version number
2. Rename the `Unreleased` entry to the new version + today's date
3. Prepend a fresh `Unreleased` entry
4. Apply the same changes to `CHANGELOG.md`
5. Commit both files

## Web Docker Build Context

`web/Dockerfile` copies only the `web/` directory — files from `../tools/` or other packages are not available at `docker build` time. Any shared data files the web needs must be committed inside `web/src/` (the generator script handles this for decoder data by writing to `web/src/lib/`).

## Environment Variables: NEXT_PUBLIC_* Rule

**NEVER use `NEXT_PUBLIC_*` environment variables for values that deployers need to configure at runtime.** Next.js bakes `NEXT_PUBLIC_*` values in at build time, so they cannot be changed after the Docker image is built.

Instead, use one of these patterns:
- **Runtime API route**: Create a `/api/config` endpoint that reads `process.env` at runtime
- **Server-side props**: Pass values from server components where `process.env` is available
- The web app derives the API URL at runtime from `window.location.origin` in the browser (no `NEXT_PUBLIC_*` vars needed) and from `API_URL` env var during SSR. No build-time domain baking is required.

## iOS Development Notes

- When modifying the `Device` struct in `ios/.../Models/Device.swift`, always update ALL preview instances that construct a `Device`. These are found in:
  - `EditDeviceView.swift` (preview at bottom)
  - `ShareView.swift` (preview at bottom)
- Failing to update previews will cause iOS build failures.

---

## Apple Serial Number Decoder (`tools/serial-decoder/`)

A standalone Swift CLI that decodes Apple serial numbers to identify hardware models. Used to validate the algorithm before iOS integration.

```bash
cd tools/serial-decoder
swift run SerialDecoderCLI F9472LNB02        # decode a single serial
swift run SerialDecoderCLI --json F9472LNB02 # JSON output
swift run SerialDecoderCLI --test            # run all test cases
swift test                                   # run XCTest suite
```

### Adding or updating model codes

The canonical data lives in two JSON files — edit these, never the generated Swift/TS files:

> **Note:** The generator syncs *data* only. Logic changes to `AppleSerialDecoder.swift`, `ModernSerialDecoder.swift`, or `VintageSerialDecoder.swift` must be manually mirrored to `web/src/lib/appleSerialDecoder.ts`.

- **`tools/decoder-data/modern_models.json`** — array of `[configCode, modelIdentifier, modelName]`
- **`tools/decoder-data/vintage_model_codes.json`** — object of `{modelCode: name | null}`

After editing, run the generator to update all platform files at once:

```bash
python3 scripts/generate_decoder_data.py
```

This regenerates:
- `ios/.../SerialDecoder/Data/modern_models.swift` (chunked, avoids swift-frontend OOM)
- `ios/.../SerialDecoder/Data/vintage_model_codes.swift`
- `tools/serial-decoder/Sources/SerialDecoderLib/Data/modern_models.swift`
- `tools/serial-decoder/Sources/SerialDecoderLib/Data/vintage_model_codes.swift`
- `web/src/lib/modern_models.json` (imported directly by TypeScript — no TS wrapper needed)
- `web/src/lib/vintage_model_codes.json`

Commit all generated files together with the JSON source change.

Sources for vintage model codes: [myoldmac.net](http://myoldmac.net/FAQ/Mac-Serialnumber-decoder-e.php), the [MacRumors serial format thread](https://forums.macrumors.com/threads/decoding-apple-serials-where-when-hardware-was-assembled-1983-2021-and-apple-model-numbers-1977-present.2310423/).

### Regenerating the modern model table from OpenCorePkg

To pull in a new upstream release of the model database:

```bash
# Download modelinfo_autogen.h from:
# https://github.com/acidanthera/OpenCorePkg/tree/master/Utilities/macserial
python3 scripts/parse_modelinfo.py path/to/modelinfo_autogen.h \
  > tools/decoder-data/modern_models.json   # update the canonical source
python3 scripts/generate_decoder_data.py    # regenerate all platform files
```

### Decoder format reference

| Serial length | Format | Year range | Model identified by |
|---|---|---|---|
| 8–10 chars, digit at pos 2 | Vintage | 1983–1989 | Last N chars (model code) |
| 11 chars | Modern (old) | 1989–2010 | Last 3 chars (config code) |
| 12 chars | Modern (new) | 2010–2021 | Last 4 chars (config code) |
| 12 chars, post-Apr 2021 | Randomized | 2021+ | Not decodable |

### Template matching

After decoding a serial, both iOS and web look for a matching template using normalised string comparison: lowercase, strip parenthetical suffixes like `(ROM 01)`, collapse whitespace, and treat `"mac"`/`"macintosh"` as equivalent. Both platforms must use identical logic — see `BarcodeScannerView.swift::findMatchingTemplate` and `web/src/app/page.tsx::findMatchingTemplate`.

---

## Feature Catalog

A comprehensive list of all implemented features, organized by platform. Use this as a reference when planning new features to avoid duplication and ensure consistency across platforms.

### Core Data Model

**Device** (main inventory item)
- Identification: name, additionalName, manufacturer, modelNumber, serialNumber, releaseYear, location, info
- Status: COLLECTION | FOR_SALE | PENDING_SALE | SOLD | DONATED | IN_REPAIR | RETURNED
- FunctionalStatus: YES | PARTIAL | NO
- Flags: isFavorite, hasOriginalBox, isAssetTagged, isWifiEnabled, isPramBatteryRemoved
- Timestamps: dateAcquired, lastPowerOnDate, soldDate (also used as "returned date" for RETURNED)
- Financials: priceAcquired, estimatedValue, listPrice, soldPrice (also used as "repair fee" for RETURNED), whereAcquired
- Specs: cpu, ram, graphics, storage, operatingSystem
- External: externalUrl
- Relations: category, images, notes, maintenanceTasks, tags, customFieldValues
- Soft delete: deleted flag

**Category**: name, type (COMPUTER | PERIPHERAL | ACCESSORY | OTHER), sortOrder

**Image**: path, thumbnailPath (320x320 WebP), dateTaken (EXIF), caption, isShopImage, isThumbnail, isListingImage

**Note**: content, date (auto-timestamped)

**MaintenanceTask**: label (predefined or custom), dateCompleted, notes, cost (optional, rolls up to totalMaintenanceCost in financials)

**Tag**: name (many-to-many with devices)

**Template**: Pre-configured device specs linked to a category for rapid device creation

**CustomField**: name, isPublic (controls storefront visibility), sortOrder; per-device CustomFieldValue

### API Features

**GraphQL queries**: devices (with filtering), device, categories, tags, templates, customFields, financialOverview, financialTransactions, systemUsage, maintenanceTaskLabels, collectionStats

**GraphQL mutations**: full CRUD for devices, images, notes, maintenanceTasks, tags, customFields/values, categories, templates; restoreDevice, permanentlyDeleteDevice

**REST endpoints**: auth (login/refresh/status), file upload (10MB, auto-thumbnail), bulk ZIP import/export (2GB, async with progress polling), static file serving

**Search**: Computed `searchText` field indexes name, additionalName, manufacturer, modelNumber, serialNumber, CPU, RAM, graphics, storage, OS, info, releaseYear, location name, category name, tags, custom field values, maintenance task labels/notes, and (when authenticated) notes and whereAcquired for fast full-text search

### Web Admin Dashboard (`/`)

**Inventory page** (`/`):
- Card grid (responsive 1–7 columns) and data table view modes
- Real-time search across all text fields
- Filter by category (multi), status (multi), functional status (multi), favorites
- Sort by name, manufacturer, releaseYear, dateAcquired, estimatedValue, location, status, functionalStatus
- Barcode/QR scanner via browser BarcodeDetector API
- Summary footer: device count, estimated value, total spent, total sold (auth-gated)
- Favorite toggle per device
- Persisted filter/sort/view preferences in localStorage

**Device detail** (`/devices/[id]`):
- Full field display with edit navigation
- Image gallery with upload, caption editing, role assignment (thumbnail/shop/listing)
- Notes: add, edit, delete with timestamps
- Maintenance tasks: add with predefined or custom labels, mark complete
- Tags: add and remove
- Custom field values
- Last power-on date logging
- QR/barcode deep-link generation
- Value history chart (auth-gated; renders when ≥ 2 snapshots exist)

**Device create/edit** (`/devices/new`, `/devices/[id]/edit`):
- Full form covering all device fields
- Template application to pre-fill specs
- Conditional sales section for FOR_SALE status

**Financials** (`/financials`): total spent, total received, net cash, estimated value owned, net position, total profit; interactive cumulative chart over time; transaction list with running totals. TransactionType enum: ACQUISITION | SALE | DONATION | MAINTENANCE | REPAIR_RETURN. IN_REPAIR and RETURNED are excluded from estimatedValueOwned. RETURNED devices with soldPrice generate a REPAIR_RETURN transaction (labeled "Repair Fee").

**Categories** (`/categories`): view, create, edit categories with type and sort order

**Templates** (`/templates`): view, create, edit, delete templates; one-click device creation from template

**Custom Fields** (`/customFields`): create, edit, delete fields; toggle public/private; set sort order

**Print** (`/print`): filtered print-friendly device table

**Backup** (`/backup`): export selected devices to ZIP (with images, progress tracking); bulk import from ZIP (progress polling, error reporting)

**Trash** (`/trash`): view soft-deleted devices; restore or permanently delete

**Wishlist** (`/wishlist`): list of desired devices grouped by `group` field; priority badges (High/Medium/Low); per-item fields: name, manufacturer, model, category, target price, source URL/notes, notes; "Acquired" button pre-fills `/devices/new?name=...`; create/edit via inline form; auth-gated

**Stats** (`/stats`): collection composition donut charts (by status, condition, category type); acquisition per year bar chart; release era bar chart; top manufacturers horizontal bar chart; summary cards (total devices, working %, avg estimated value, top category)

**System Usage** (`/usage`): counts of all entity types and total storage used

**Timeline** (`/timeline`): visual timeline of devices by `releaseYear` interspersed with historical Apple/tech milestones; devices shown as highlighted nodes, external events provide context; event data managed via admin CRUD

### Storefront

- Product grid for FOR_SALE, PENDING_SALE, and (via filter) SOLD devices
- Search, filter (status including SOLD, category), and sort (price, name, year, category, status)
- Item detail: specs, images, condition, maintenance history, public custom fields, list price or "contact for price"
- Contact email CTA from env variable
- Umami analytics events for searches, filter changes, sorts
- No auth required; sensitive fields (notes, acquisition data) excluded from API responses
- **Looking For** (`/looking-for`): public page showing wishlist items (name, manufacturer, model, category, year only — NO price/notes/source); grouped by group field; contact CTA

### iOS App

**Device list**: search, filter (category, status, favorites), sort, pull-to-refresh, barcode scanner, add device; toggle between list view and grid tile view (2-col portrait, adaptive landscape/iPad); preference persisted via `@AppStorage("deviceViewMode")`

**Device detail** (tabbed): Overview, Specs, Images, Notes, Tasks tabs; favorite toggle; share QR code; edit/delete; value history chart (when ≥ 2 snapshots)

**Image management**: gallery with full-size viewer; set thumbnail/shop/listing flags; delete with confirmation. Full-screen viewer supports: pinch-to-zoom (up to 6×), double-tap to zoom in/reset (works on image and black letterbox area), bounded pan (can't drag image off-screen), swipe on image at 1× to navigate prev/next, swipe past the edge boundary while zoomed to navigate prev/next, zoom resets to fit-to-screen when switching images

**Add/Edit device**: full form with all fields, template selection, category picker, custom field values

**Financials**: summary cards (6 metrics), interactive cumulative line chart (landscape), transaction list

**Stats**: summary cards (total devices, working %, avg value, top category); bar charts for status, condition, category type, acquisition year, release decade, top manufacturers

**AI Chat**: natural language queries about inventory via MCP, streaming responses, conversation history; voice input (speech-to-text via SFSpeechRecognizer) and voice output (text-to-speech via AVSpeechSynthesizer); conversation mode for hands-free back-and-forth; mic pulse animation while listening; toggle to mute/unmute spoken responses

**Timeline**: horizontal scroll view of devices by release year with historical milestones

**Value history chart**: per-device line chart in the Overview tab showing `estimatedValue` snapshots over time; snapshots auto-created on save when value changes (deduplicated)

**Barcode scanner**: live camera preview, QR/barcode detection, serial number lookup, navigate to matched device

**Login**: server URL configuration, password entry, JWT token persistence and refresh

**Wishlist**: list of desired devices grouped by group field, sorted by priority; swipe to delete; tap to edit; "Mark as Acquired" opens AddDeviceView with pre-filled fields

### MCP Server (AI Integration)

Tools available to Claude and other AI assistants:

**Read tools:**
- `list_all_devices`: compact dump of every device — for whole-collection reasoning
- `search_devices`: text + filter search (status, functionalStatus, category, manufacturer, tag), up to 50 results
- `get_device_details`: full device data by ID (notes, tasks, images)
- `get_financial_summary`: aggregate financial metrics
- `list_devices`: flexible field selection with filtering and sorting

**Write tools:**
- `update_device`: update any device fields (status, estimatedValue, location, specs, flags, etc.) by device ID
- `add_note`: append a timestamped note to a device
- `add_maintenance_task`: log a completed maintenance task (label, date, notes, cost) to a device

Used by both the web CollectionChat component and the iOS ChatView.

### Cross-Cutting Features

- **Soft delete**: devices marked deleted, restorable from trash
- **Financial tracking**: acquisition → ownership → sale profit chain
- **Template system**: reusable device spec presets
- **Custom metadata**: extensible fields with public/private visibility control
- **Image roles**: thumbnail (list display), shop image (storefront card), listing image (storefront detail blurred background)
- **Deep linking**: devices accessible via URL and QR/barcode code
- **Bulk import/export**: ZIP with images, streaming, async progress tracking
- **Multi-platform**: web admin, public storefront, iOS native — all on same GraphQL API
- **Auth-gated data**: financial/acquisition fields hidden from unauthenticated users; storefront always fully public
- **Retro aesthetic**: rainbow stripe, vintage fonts, loading messages throughout web UI

---

## Feature Ideas

Potential future features, roughly prioritized. These have not been started — check the Feature Catalog above before implementing to avoid duplication.

### High Value / Low Effort

- **Loan tracking**: mark a device as loaned out to a person with a due-back date; show overdue loans on the inventory page. New `Loan` model (deviceId, borrower, dueDate, returnedDate).
- **Bulk edit**: select multiple devices on the inventory page and batch-update status, category, or tags.
- ~~**Wishlist**: a separate status or section for devices you want to acquire; track target price and potential sources.~~ **Implemented** — see Feature Catalog.

### Medium Effort

- **Maintenance reminders**: add an optional due date to maintenance tasks; surface overdue/upcoming tasks on the dashboard and iOS home screen.
- ~~**CSV export**: export the current filtered device list as CSV from the web admin (no images, just data).~~ **Implemented** — see Feature Catalog.
- **Duplicate detection**: warn when adding a device whose name + manufacturer closely matches an existing one.
- **Storefront inquiry form**: replace the contact email CTA with an in-app inquiry form that logs messages to the database.

### Larger / Exploratory

- **Multi-user / roles**: expand auth beyond single-password to named users with viewer vs. editor roles.
- ~~**Public collection page**: a read-only view of the entire collection (not just for-sale items) for sharing with other collectors.~~ **Implemented** (The Archive showcase app) — see Feature Catalog.
- ~~**Mobile barcode add**: from the iOS barcode scanner, if no match is found, pre-fill a new device form using the barcode to look up make/model from an external database (e.g., Open Library / Barcode Lookup API).~~ **Implemented** — see Feature Catalog.

---

## App Flow Reference

The `DATA` object at the top of `docs/architecture/flows.html` is the authoritative source for how data moves between packages in this app. **Read it before implementing any feature that touches more than one package.**

The file is self-contained — open it directly in any browser (`file://` works, no server needed).

### When to update `flows.html`

- **Adding a new user-facing action**: add a new entry to the `flows` array inside `DATA` with accurate `steps`, `packages`, and `edges` references.
- **Changing how a feature works** (new endpoint, new package involved, changed data path): update the relevant flow's steps to match the new implementation.
- **Removing a feature**: remove its flow entry.

Updates to `flows.html` must be made in the same commit as the code change — never leave them for later.

### Viewing the diagram

Open `docs/architecture/flows.html` directly in a browser. No server required. Click a flow in the right panel to highlight the packages and edges involved. Click individual steps to trace the exact path.

### Data schema reference

| Key | Purpose |
|-----|---------|
| `packages[].id` | Unique identifier used in edge `from`/`to` and step `packages` arrays |
| `packages[].tier` | Layout tier: `client` \| `middleware` \| `api` \| `storage` |
| `edges[].id` | Unique identifier used in step `edges` arrays |
| `flows[].steps[].packages` | Package IDs active during this step (highlighted on diagram) |
| `flows[].steps[].edges` | Edge IDs active during this step (animated arrows on diagram) |
