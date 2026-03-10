# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InvDifferent2 is a vintage computer collection inventory management system. It's a full-stack monorepo with:
- **api/**: GraphQL API (Express + Apollo Server + Prisma + PostgreSQL)
- **web/**: Admin dashboard (Next.js 14 App Router)
- **storefront/**: Public shop frontend (Next.js 14)
- **mcp-server/**: AI integration via Model Context Protocol
- **ios/**: Native iOS app (SwiftUI)

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

# Docker multi-arch build and push
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
- Status: AVAILABLE | FOR_SALE | PENDING_SALE | SOLD | DONATED | IN_REPAIR | RETURNED
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
- The `NEXT_PUBLIC_API_URL` is an intentional exception — it's baked into the Docker image via `build-and-push.sh` with the production domain

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
- Status: AVAILABLE | FOR_SALE | PENDING_SALE | SOLD | DONATED | IN_REPAIR | RETURNED
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

**Stats** (`/stats`): collection composition donut charts (by status, condition, category type); acquisition per year bar chart; release era bar chart; top manufacturers horizontal bar chart; summary cards (total devices, working %, avg estimated value, top category)

**System Usage** (`/usage`): counts of all entity types and total storage used

### Storefront

- Product grid for FOR_SALE and PENDING_SALE devices
- Search, filter (status, category), and sort (price, name, year, category, status)
- Item detail: specs, images, condition, maintenance history, public custom fields, list price or "contact for price"
- Contact email CTA from env variable
- Umami analytics events for searches, filter changes, sorts
- No auth required; sensitive fields (notes, acquisition data) excluded from API responses

### iOS App

**Device list**: search, filter (category, status, favorites), sort, pull-to-refresh, barcode scanner, add device

**Device detail** (tabbed): Overview, Specs, Images, Notes, Tasks tabs; favorite toggle; share QR code; edit/delete

**Image management**: gallery with full-size view, set thumbnail/shop/listing flags, delete with confirmation

**Add/Edit device**: full form with all fields, template selection, category picker, custom field values

**Financials**: summary cards (6 metrics), interactive cumulative line chart (landscape), transaction list

**Stats**: summary cards (total devices, working %, avg value, top category); bar charts for status, condition, category type, acquisition year, release decade, top manufacturers

**AI Chat**: natural language queries about inventory via MCP, streaming responses, conversation history

**Barcode scanner**: live camera preview, QR/barcode detection, serial number lookup, navigate to matched device

**Login**: server URL configuration, password entry, JWT token persistence and refresh

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
- **Wishlist**: a separate status or section for devices you want to acquire; track target price and potential sources.
- **Storefront "sold" archive**: show SOLD devices on the storefront as a historical gallery rather than hiding them entirely.

### Medium Effort

- **Maintenance reminders**: add an optional due date to maintenance tasks; surface overdue/upcoming tasks on the dashboard and iOS home screen.
- **Value history**: periodically snapshot `estimatedValue` per device so you can chart how valuations change over time. Requires a new `ValueSnapshot` table.
- **CSV export**: export the current filtered device list as CSV from the web admin (no images, just data).
- **Duplicate detection**: warn when adding a device whose name + manufacturer closely matches an existing one.
- **Storefront inquiry form**: replace the contact email CTA with an in-app inquiry form that logs messages to the database.

### Larger / Exploratory

- **Multi-user / roles**: expand auth beyond single-password to named users with viewer vs. editor roles.
- **Public collection page**: a read-only view of the entire collection (not just for-sale items) for sharing with other collectors.
- **Insurance report**: generate a printable PDF valuation report grouped by category, with photos, for insurance purposes.
- **Mobile barcode add**: from the iOS barcode scanner, if no match is found, pre-fill a new device form using the barcode to look up make/model from an external database (e.g., Open Library / Barcode Lookup API).
- **Collection timeline**: a visual timeline that plots each device by its `releaseYear`, interspersed with significant Apple product launches and broader cultural/historical milestones (e.g. Macintosh 1984, NeXT acquisition, iPod, iPhone). Devices in the collection are highlighted nodes; external events provide historical context. Could live at `/timeline` on web and as a horizontal scroll view on iOS. Historical event data would be a static JSON fixture bundled with the app.
