# Showcase Site — Design Spec

**Date:** 2026-04-11  
**Status:** Approved for implementation

---

## Context

InvDifferent users want a way to share their collection publicly as a curated, narrative-driven experience — not a shop, not a raw inventory list, but a digital museum for other collectors and enthusiasts. The showcase is a separate Docker container (`wottle/inventory-showcase:latest`) that reads from the same API and PostgreSQL database as the existing web admin and storefront.

---

## Architecture

### Approach
A new standalone Next.js 14 app in `showcase/` alongside `storefront/` and `web/`. It has its own public-facing UI and a password-protected `/admin` section. It connects to the existing GraphQL API for all data.

**Why standalone:** The storefront has a distinct retro Apple aesthetic. The showcase uses a completely different "Precision Editorial / Glass-on-Snow" design system. Mixing them in one app would create confusion. The container model is already established in this project.

### New service (added to docker-compose files)
```yaml
showcase:
  image: wottle/inventory-showcase:latest
  environment:
    API_URL: http://api:4000
    AUTH_PASSWORD: ${AUTH_PASSWORD}
    JWT_SECRET: ${JWT_SECRET}
  volumes:
    - uploads:/uploads
  ports:
    - "3003:3000"  # or behind Traefik (3002 is reserved for mcp-server)
```

### Environment variables
- `API_URL` — internal API URL (required)
- `AUTH_PASSWORD` — reuses existing var; same password protects the showcase admin
- `JWT_SECRET` — reuses existing var for JWT signing
- `SHOWCASE_DOMAIN` — for Traefik prod config (optional)

### Image uploads
- Journey cover images: `/uploads/showcase/journeys/{journeyId}/`
- Site hero image: `/uploads/showcase/config/`
- Served via the API's existing `/uploads` static file route
- `coverImagePath` / `heroImagePath` fields store paths relative to `/uploads/`

---

## Data Model

Five new Prisma models added to `api/prisma/schema.prisma`. Migrations run automatically on container start via `api/entrypoint.sh`.

```prisma
model ShowcaseJourney {
  id             String            @id @default(uuid())
  title          String
  slug           String            @unique
  description    String
  coverImagePath String?           // e.g. "showcase/journeys/abc-123/cover.webp"
  sortOrder      Int               @default(0)
  published      Boolean           @default(false)
  chapters       ShowcaseChapter[]
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
}

model ShowcaseChapter {
  id          String           @id @default(uuid())
  journey     ShowcaseJourney  @relation(fields: [journeyId], references: [id], onDelete: Cascade)
  journeyId   String
  title       String
  description String
  sortOrder   Int              @default(0)
  devices     ShowcaseDevice[]
}

model ShowcaseDevice {
  id           String          @id @default(uuid())
  chapter      ShowcaseChapter @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  chapterId    String
  device       Device          @relation(fields: [deviceId], references: [id])
  deviceId     String
  curatorNote  String?         // per-device narrative written by owner; unique per chapter context
  sortOrder    Int             @default(0)
  isFeatured   Boolean         @default(false) // pins to landing page featured grid
}

model ShowcaseQuote {
  id        String  @id @default(uuid())
  author    String
  text      String
  source    String?           // e.g. "Macworld 1998" or "Think Different campaign"
  isDefault Boolean @default(false) // baked-in quotes ship with container
  isEnabled Boolean @default(true)
  sortOrder Int     @default(0)
}

model ShowcaseConfig {
  id                  String  @id @default("singleton")
  siteTitle           String  @default("The Collection")
  tagline             String  @default("")
  bioText             String  @default("")
  heroImagePath       String?             // e.g. "showcase/config/hero.webp"
  accentColor         String  @default("#0058bc")
  timelineCuratorNote String  @default("") // shown in timeline sidebar Curator's Note card
}
```

The existing `Device` model in `schema.prisma` also needs the reverse relation added:
```prisma
// In existing Device model — add:
showcaseDevices ShowcaseDevice[]
```

**Key decisions:**
- A device can appear in multiple journeys (different `curatorNote` per chapter context)
- `isFeatured` on `ShowcaseDevice` selects devices for the landing page hero grid, independent of journey membership
- `isDefault` on `ShowcaseQuote` distinguishes baked-in quotes from user-added ones; a reset is always possible
- `ShowcaseConfig` is always a single row (`id = "singleton"`), upserted on first admin save

---

## GraphQL API Changes

Added to `api/src/typeDefs.ts` and `api/src/resolvers.ts`.

### Public queries
```graphql
showcaseConfig: ShowcaseConfig
showcaseJourneys: [ShowcaseJourney!]!         # published only
showcaseJourney(slug: String!): ShowcaseJourney
showcaseFeaturedDevices: [ShowcaseDevice!]!   # isFeatured = true
showcaseQuotes: [ShowcaseQuote!]!             # isEnabled = true
```

### Admin mutations (require auth)
```graphql
upsertShowcaseConfig(input: ShowcaseConfigInput!): ShowcaseConfig
createJourney(input: JourneyInput!): ShowcaseJourney
updateJourney(id: ID!, input: JourneyInput!): ShowcaseJourney
deleteJourney(id: ID!): Boolean
upsertChapter(input: ChapterInput!): ShowcaseChapter
deleteChapter(id: ID!): Boolean
upsertShowcaseDevice(input: ShowcaseDeviceInput!): ShowcaseDevice
removeShowcaseDevice(id: ID!): Boolean
upsertShowcaseQuote(input: ShowcaseQuoteInput!): ShowcaseQuote
deleteShowcaseQuote(id: ID!): Boolean
```

---

## Site Structure

### Public routes
| Route | Description |
|-------|-------------|
| `/` | Landing — hero, featured devices, journey cards, quote strip, bio |
| `/journeys` | All published journeys as editorial cards |
| `/journeys/[slug]` | Single journey — split hero, sticky chapter nav, chapter sections with devices and quotes |
| `/timeline` | Full device grid with era pills and sidebar filters (Historical Eras, Category) |
| `/device/[id]` | Device deep-dive — split hero, narrative, specs, gallery, maintenance history |

### Admin routes (password-protected)
| Route | Description |
|-------|-------------|
| `/admin` | Login + dashboard overview |
| `/admin/journeys` | List journeys; create, reorder, toggle published |
| `/admin/journeys/[id]` | Journey editor — chapters + device curation with drag-to-reorder |
| `/admin/quotes` | Quote library — view defaults, add custom, toggle on/off |
| `/admin/appearance` | Site title, tagline, bio, hero image, accent color |

### Navigation (public)
```
[Site Title]    Journeys    Timeline    About           [search icon]
```

### Journey hierarchy
```
ShowcaseJourney  (title, slug, description, cover image, sortOrder, published)
  └── ShowcaseChapter  (title, description, sortOrder)
        └── ShowcaseDevice  (deviceId, curatorNote, sortOrder, isFeatured)
```

---

## Design System

**"Precision Editorial / Glass-on-Snow"** — defined in `/design/web/showcase/landing_page/DESIGN.md`. All pages use the same Tailwind config.

### Key tokens
- Primary (Blue): `#0058bc` / Primary Container: `#0070eb`
- Tertiary (Gold): `#6f5d00` / Tertiary Container: `#c5aa22`
- Surface: `#f9f9fe` → Surface Container Lowest: `#ffffff`
- On-Surface: `#1a1c1f` / On-Surface Variant: `#414755`

### Core rules
- **No explicit borders** — section separation via background tonal shifts only
- **Glassmorphism nav** — `bg-[#f9f9fe]/80 backdrop-blur-xl` on all pages
- **Ambient shadow only** — `box-shadow: 0 0 32px 0 rgba(26,28,31,0.04)` for cards
- **Pill buttons** — `rounded-full` for all CTAs
- **Editorial typography** — Inter, extreme scale contrasts, `tracking-tighter` on headlines
- **Year badges** — `bg-tertiary/90 backdrop-blur-md` overlaid on card images
- **Rarity/status chips** — `bg-tertiary` (gold) for rare/premium, `bg-primary` (blue) for standard

### Reference HTML designs
- Landing: `/design/web/showcase/landing_page/code.html`
- Timeline: `/design/web/showcase/timeline/code.html`
- Device detail: `/design/web/showcase/device_detail/code.html`
- Journey: no reference — design new in same system (see brainstorm mockup)

---

## Page Specifications

### Landing page (`/`)
Sections in order:
1. Glassmorphic sticky nav
2. Hero — full-height, device photo with `mix-blend-multiply` overlay, gradient left-to-right, `text-8xl` headline, single CTA "Explore the Journeys"
3. Narrative — asymmetric 12-col grid (7+5), large editorial paragraph + bio excerpt + primary divider line
4. Asymmetric gallery — 12-col (8+4), large photo left, stacked right (photo + primary-blue quote card)
5. Featured Artifacts — 3-col portrait `aspect-[4/5]` cards from `isFeatured` devices; catalog numbers; left-border accent on curator note
6. Journeys — 3-col cards with cover gradient, chapter/device count, description, "Read the story →"
7. CTA — full-width centered, large headline, "Browse the Timeline" pill button
8. Footer

### Journeys index (`/journeys`)
- Page header: "THE JOURNEYS" label + large title
- Grid of published journey cards (same style as landing journeys section)

### Journey page (`/journeys/[slug]`)
1. Split hero — cover image left (50%), journey metadata right (title in `text-[5rem]` font-black, description, chapter/device count badges, era badge)
2. Body: `grid-cols-12` — sticky chapter nav left (col-span-3), chapters content right (col-span-9)
3. Chapter nav: scrollspy TOC with active blue indicator bar
4. Each chapter: gold `Chapter 0N` overline, `text-5xl` chapter title, description paragraph, 2-col device card grid
5. Device cards: identical to timeline cards + `curatorNote` blockquote (border-l-2 border-primary/30, italic)
6. Between chapters: full-width primary-blue quote card (random enabled `ShowcaseQuote`, selected server-side per page load)
7. Odd-device-count chapter: "Up Next · Chapter N" teaser card fills the grid
8. End: "Next Journey" section with title, description, CTA button

### Timeline (`/timeline`)
- Matches reference design exactly
- Era pills in header built from journey titles (not hardcoded)
- Sidebar "Historical Eras" built from `releaseYear` ranges across showcased devices
- Sidebar "Category Filter" = device category types
- Sidebar "Curator's Note" = `ShowcaseConfig.timelineCuratorNote` (editable in `/admin/appearance`)
- 2-col card grid: `aspect-[4/3]` image, gold year badge, primary category label, bold name, description, "View Record →", inventory number (from `id`)

### Device detail (`/device/[id]`)
1. Split hero — device thumbnail left (50% full-height), metadata right
   - `manufacturer` · `releaseYear`
   - Title: `name` in `text-[6rem]` font-black
   - Subtitle: `info` excerpt
   - Chips: `rarity`, `functionalStatus`, `condition`, `hasOriginalBox` flag
   - "Featured In" — links to journeys containing this device
2. The Story — `info` field rendered as long-form narrative (2-col)
3. Technical Blueprint — spec grid from device fields:
   - Processor: `cpu` (big-number treatment if parseable MHz/GHz)
   - Memory: `ram` (big-number treatment if parseable)
   - Storage: `storage` (big-number treatment if parseable)
   - Graphics: `graphics` (text label treatment)
   - Operating System: `operatingSystem`
   - Condition & Flags: `condition` + `hasOriginalBox` + `isPramBatteryRemoved` + `isWifiEnabled`
4. Gallery — horizontal scroll of device images (all non-thumbnail images)
5. Provenance — `location` + `externalUrl` + `MaintenanceTask` records as left-border timeline

---

## Admin UI Specifications

### Journey editor (`/admin/journeys/[id]`)
- **Left panel (260px):** journey metadata form (title, slug, description, cover image upload, stats)
- **Right area:** chapters list with drag-to-reorder
  - Each chapter: drag handle, chapter number badge, title, device count, edit/delete actions
  - Expanded chapter: description text, device rows with thumbnail + name + curatorNote preview + featured star + drag handle + edit button
  - "Add device to this chapter" row opens a searchable device picker (fetches all non-deleted devices from existing inventory)
- **Top bar:** back to journeys list, journey title, Draft/Published badge, Preview button, Publish button

### Quotes admin (`/admin/quotes`)
- List of all quotes (default + custom), grouped: Defaults first, Custom below
- Each row: author, truncated text, source, toggle on/off, delete (custom only)
- "Add Quote" form: author, text, source (optional)
- Default quotes are seeded in the migration and cannot be deleted, only toggled

### Appearance admin (`/admin/appearance`)
- Form fields: Site Title, Tagline, Bio Text (textarea), Hero Image (upload), Accent Color (color picker + hex input)
- Live preview of nav bar with current title and accent color

---

## Default Quotes (baked in)

Seeded via Prisma seed or migration:

| Author | Quote |
|--------|-------|
| Steve Jobs | "Design is not just what it looks like and feels like. Design is how it works." |
| Steve Jobs | "The people who are crazy enough to think they can change the world are the ones who do." |
| Dieter Rams | "Good design is as little design as possible." |
| Jony Ive | "We try to develop products that seem somehow inevitable." |
| Steve Wozniak | "Never trust a computer you can't throw out a window." |
| Susan Kare | "Icons are the vocabulary of the visual language of the interface." |

---

## Tech Stack

```
showcase/
  src/
    app/
      page.tsx                  # landing
      journeys/
        page.tsx                # journeys index
        [slug]/page.tsx         # single journey
      timeline/page.tsx
      device/[id]/page.tsx
      admin/
        page.tsx                # login + dashboard
        journeys/
          page.tsx              # journey list
          [id]/page.tsx         # journey editor
        quotes/page.tsx
        appearance/page.tsx
      api/
        config/route.ts         # runtime config (API_URL, etc.)
    components/
      ...shared components
    lib/
      apollo-wrapper.tsx        # same pattern as storefront
      auth.ts                   # JWT helpers, same as web
  package.json
  Dockerfile
  tailwind.config.js            # Precision Editorial tokens
  next.config.js
```

- **Next.js 14** App Router, TypeScript
- **Tailwind CSS** with the Precision Editorial token set
- **Apollo Client** with SSR support (same `@apollo/experimental-nextjs-app-support` pattern as storefront)
- **Auth:** JWT via `AUTH_PASSWORD` / `JWT_SECRET` env vars, same flow as web admin

---

## Verification

After implementation, verify end-to-end:

1. `cd api && npm run build` — API compiles with new models and resolvers
2. `cd showcase && npm run build` — showcase Next.js build passes
3. Docker: `docker compose up` — showcase container starts, connects to API
4. Admin flow: navigate to `/admin`, log in with `AUTH_PASSWORD`, create a journey, add chapters, assign devices with curator notes, publish
5. Public flow: visit `/`, see featured devices; navigate to `/journeys/[slug]`, confirm chapters and curator notes render; visit `/timeline`, confirm filters work; visit `/device/[id]`, confirm all spec fields and maintenance history render
6. Theming: change accent color in `/admin/appearance`, confirm color updates on public pages
7. Quotes: disable a default quote in `/admin/quotes`, confirm it no longer appears on landing page
8. Multi-journey: add same device to two journeys with different curator notes, confirm both render correctly with separate notes
