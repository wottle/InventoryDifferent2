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

When changes are ready to ship:
1. Push to `main` — GitHub Actions automatically builds multi-arch images and pushes to Docker Hub
2. Users update by running `docker compose pull && docker compose up -d` — migrations run automatically on container start via `api/entrypoint.sh`

The `./build-and-push.sh` script still exists for manual local builds if needed, but the normal path is CI/CD via GitHub Actions.

The `docker-compose.simple.yml` file is for users without a reverse proxy (direct port exposure). The `docker-compose.prod.yml` file is for Traefik deployments with HTTPS. The `docker-compose.nas.yml` file is the author's personal NAS deployment and is not intended as a template for other users.

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
- Production: `docker-compose.prod.yml` with Traefik reverse proxy
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

Run all applicable builds after making changes to verify nothing is broken before committing.

## Commit Style

- Use short, imperative mood commit messages (1-2 sentences)
- Focus on "why" not "what" — the diff shows what changed
- Use accurate verbs: "add" for new features, "update" for enhancements, "fix" for bug fixes
- Always end with: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- Use a HEREDOC to pass the commit message to ensure proper formatting

## Environment Variables: NEXT_PUBLIC_* Rule

**NEVER use `NEXT_PUBLIC_*` environment variables for values that deployers need to configure at runtime.** Next.js bakes `NEXT_PUBLIC_*` values in at build time, so they cannot be changed after the Docker image is built.

Instead, use one of these patterns:
- **Runtime API route**: Create a `/api/config` endpoint that reads `process.env` at runtime
- **Server-side props**: Pass values from server components where `process.env` is available
- The web app derives the API URL at runtime from `window.location.origin` in the browser (no `NEXT_PUBLIC_*` vars needed) and from `API_URL` env var during SSR. No build-time domain baking is required.

## iOS Development Notes

- When modifying the `Device` struct in `ios/.../Models/Device.swift`, always update ALL preview instances that construct a `Device`. These are found in:
  - `DeviceDetailView.swift` (preview at bottom)
  - `EditDeviceView.swift` (preview at bottom)
  - `ShareView.swift` (preview at bottom)
- Failing to update previews will cause iOS build failures.

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

**Search**: Computed `searchText` field indexes name, manufacturer, model, CPU, info, notes, and tags for fast full-text search

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

**Image management**: gallery with full-size view, set thumbnail/shop/listing flags, delete with confirmation

**Add/Edit device**: full form with all fields, template selection, category picker, custom field values

**Financials**: summary cards (6 metrics), interactive cumulative line chart (landscape), transaction list

**Stats**: summary cards (total devices, working %, avg value, top category); bar charts for status, condition, category type, acquisition year, release decade, top manufacturers

**AI Chat**: natural language queries about inventory via MCP, streaming responses, conversation history

**Timeline**: horizontal scroll view of devices by release year with historical milestones

**Value history chart**: per-device line chart in the Overview tab showing `estimatedValue` snapshots over time; snapshots auto-created on save when value changes (deduplicated)

**Barcode scanner**: live camera preview, QR/barcode detection, serial number lookup, navigate to matched device

**Login**: server URL configuration, password entry, JWT token persistence and refresh

**Wishlist**: list of desired devices grouped by group field, sorted by priority; swipe to delete; tap to edit; "Mark as Acquired" opens AddDeviceView with pre-filled fields

### MCP Server (AI Integration)

Tools available to Claude and other AI assistants:
- `search_devices`: text + filter search (status, functionalStatus, category, manufacturer, tag), up to 50 results
- `get_device_details`: full device data by ID
- `get_financial_summary`: aggregate financial metrics
- `list_devices`: flexible field selection with filtering and sorting

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
- **CSV export**: export the current filtered device list as CSV from the web admin (no images, just data).
- **Duplicate detection**: warn when adding a device whose name + manufacturer closely matches an existing one.
- **Storefront inquiry form**: replace the contact email CTA with an in-app inquiry form that logs messages to the database.

### Larger / Exploratory

- **Multi-user / roles**: expand auth beyond single-password to named users with viewer vs. editor roles.
- **Public collection page**: a read-only view of the entire collection (not just for-sale items) for sharing with other collectors.
- **Mobile barcode add**: from the iOS barcode scanner, if no match is found, pre-fill a new device form using the barcode to look up make/model from an external database (e.g., Open Library / Barcode Lookup API).
