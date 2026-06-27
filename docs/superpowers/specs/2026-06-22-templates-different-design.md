# TemplatesDifferent — Template Server Design Spec

**Date:** 2026-06-22
**Status:** Approved for implementation planning

---

## Context

InvDifferent2 ships with ~200 vintage Apple device templates seeded from a static SQL dump. These templates are baked into the codebase — users who deploy the system and never update miss new or corrected templates. There is no way for the community to contribute, no thumbnails, no variant modeling, and no concept of a "factory snapshot" vs. a "current state of this machine."

This spec defines a standalone template server — **TemplatesDifferent** — that centralises the template catalog, serves it to any InvDifferent2 deployment via a cached API, supports community submissions, and introduces light/dark AI-generated thumbnails and a parent/child variant model.

InvDifferent2 integration is a **separate future phase** and is intentionally excluded from this build. The template server must be fully working and tested before InvDifferent2 changes begin. Integration will be optional, gated behind a settings toggle in InvDifferent2.

---

## Architecture Overview

Three surfaces, one Cloudflare account, free tier throughout:

| Surface | Tech | Hosting |
|---|---|---|
| Template API | Cloudflare Worker (Hono, TypeScript) | Workers |
| Admin Console | Next.js 14 | Cloudflare Pages |
| Public Browser | Next.js 14 (SSG + ISR) | Cloudflare Pages |

**Storage:**
- **D1** (Cloudflare serverless SQLite) — templates, variants, categories, submissions
- **R2** — images (`public/` for approved, `pending/` for unreviewed)
- **KV** — rate limit counters, admin session tokens

**CDN:** Cloudflare sits in front of everything. Public endpoints are cached at the edge. The origin Worker is rarely hit for reads.

---

## Data Model (D1 Schema)

### Template

```sql
CREATE TABLE Template (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  parentId            INTEGER REFERENCES Template(id),   -- null = top-level; non-null = variant
  categoryId          INTEGER NOT NULL REFERENCES Category(id),
  status              TEXT NOT NULL DEFAULT 'DRAFT',     -- DRAFT | PUBLISHED

  -- Identity
  name                TEXT NOT NULL,
  additionalName      TEXT,
  manufacturer        TEXT DEFAULT 'Apple',
  modelNumber         TEXT,
  codename            TEXT,
  orderNumbers        TEXT,                              -- delimited list
  gestaltId           TEXT,

  -- Dates & pricing (factory snapshot)
  introductionDate    TEXT,                              -- ISO date
  discontinuedDate    TEXT,
  releaseYear         INTEGER,
  originalPriceLow    REAL,
  originalPriceHigh   REAL,
  estimatedValue      REAL,

  -- CPU / architecture
  cpuType             TEXT,
  cpuSpeed            TEXT,
  fpu                 TEXT,
  dataPathWidth       INTEGER,                           -- 16, 32, 64
  busSpeed            TEXT,
  l2Cache             TEXT,

  -- Memory
  ram                 TEXT,                              -- shipped config
  ramMin              TEXT,
  ramMax              TEXT,
  ramSlots            INTEGER,
  ramType             TEXT,                              -- SIMM, DIMM, SO-DIMM

  -- Storage & display
  storage             TEXT,                              -- "+" delimited
  graphicsChip        TEXT,
  screenSize          TEXT,
  displayType         TEXT,
  displayVariant      TEXT,
  nativeResolution    TEXT,

  -- Expansion & connectivity
  expansionSlots      TEXT,
  driveBays           TEXT,
  ports               TEXT,                              -- "+" delimited
  ethernet            TEXT,
  isWifiEnabled       INTEGER,                           -- boolean

  -- Software
  operatingSystem     TEXT,                              -- "+" delimited (shipped OS)
  minOS               TEXT,
  maxOS               TEXT,

  -- Physical
  weight              TEXT,
  dimensions          TEXT,
  batteryType         TEXT,
  isPramBatteryRemoved INTEGER,                          -- boolean

  -- Reference
  externalUrl         TEXT,
  externalLinkLabel   TEXT,
  rarity              TEXT,   -- COMMON|UNCOMMON|RARE|VERY_RARE|EXTREMELY_RARE
  historicalNotes     TEXT,

  createdAt           TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt           TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Variant inheritance rule:** A child variant inherits all NULL fields from its parent. The Worker merges parent + child before responding — consumers always receive a complete flat object.

### Supporting Tables

```sql
CREATE TABLE Category (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL,
  type  TEXT NOT NULL   -- COMPUTER|PERIPHERAL|ACCESSORY|OTHER
);

CREATE TABLE Image (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  templateId   INTEGER NOT NULL REFERENCES Template(id),
  type         TEXT NOT NULL,    -- LIGHT | DARK
  r2Key        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING | APPROVED
  submittedBy  TEXT,             -- null = admin/AI generated
  createdAt    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE Submission (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  templateId     INTEGER REFERENCES Template(id),  -- null = NEW_TEMPLATE
  type           TEXT NOT NULL,   -- CORRECTION | NEW_TEMPLATE | IMAGE
  submitterEmail TEXT,
  payload        TEXT NOT NULL,   -- JSON: field changes, or { r2Key, imageType }
  status         TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING|APPROVED|DENIED
  reviewNote     TEXT,
  createdAt      TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## API (Cloudflare Worker — Hono)

### Public Endpoints (no auth, Cloudflare-cached)

```
GET /categories
    → all categories
    Cache-Control: public, max-age=86400, s-maxage=604800

GET /templates
    ?category=<id>
    ?manufacturer=<string>
    ?search=<string>
    ?parentOnly=true
    ?cursor=<opaque>
    ?limit=<n>               (default 50, max 200)
    → { templates: [...], nextCursor, total }
    ETag: hash of max(updatedAt) in result
    Cache-Control: public, max-age=3600, s-maxage=86400

GET /templates/:id
    → full template merged with parent fields
    → includes variants[], images[{ type, url }], templateServerUrl
    ETag: hash of template + variant updatedAt values
    Cache-Control: public, max-age=3600, s-maxage=86400

GET /sync
    → { version: "<hash of all template updatedAt values>" }
    → InvDifferent2 polls this cheaply; full pull only on version change
    Cache-Control: public, max-age=300, s-maxage=300
```

### Submission Endpoints (no auth, rate limited)

```
POST /submissions/image-upload-url
    → returns short-lived pre-signed R2 upload URL (pending/ prefix)

POST /submissions
    Body: {
      type: "CORRECTION" | "NEW_TEMPLATE" | "IMAGE",
      templateId?: number,
      submitterEmail?: string,
      payload: { ...fields } | { r2Key, imageType }
    }
    Rate limit: 5 per IP per hour (KV counter, 1h TTL)
    Optional: Cloudflare Turnstile (env flag ENABLE_TURNSTILE=true)
    → 201 { submissionId }
```

### Admin Endpoints (JWT auth required)

```
POST /auth/login
POST /auth/refresh

GET  /admin/submissions?status=PENDING|APPROVED|DENIED&type=...
GET  /admin/submissions/:id
PUT  /admin/submissions/:id/approve
PUT  /admin/submissions/:id/deny      Body: { reviewNote }

GET    /admin/templates
POST   /admin/templates
PUT    /admin/templates/:id
DELETE /admin/templates/:id

POST /admin/templates/:id/generate-image   Body: { type: "LIGHT"|"DARK" }
     → calls OpenAI, stores in R2 public/, returns image url

GET  /admin/images/pending
PUT  /admin/images/:id/approve    (R2 move: pending/ → public/)
PUT  /admin/images/:id/deny       (R2 delete from pending/)
```

---

## Admin Console (Next.js 14, Cloudflare Pages)

**Route structure:**
```
/login
/(main)/
  templates/          Table: all templates, status toggle, generate image
  templates/:id       Edit form: all factory-spec fields, image panel
  submissions/        Queue: CORRECTION | NEW_TEMPLATE | IMAGE cards
                      Diff view for corrections (tonal highlight, no borders)
                      Approve / Deny with inline optimistic update + undo toast
  submissions/images/ Grid of pending thumbnails — approve moves to public R2
  categories/         Simple CRUD
```

**Design system:** Technical Atelier — glassmorphism header, International Blue CTAs (`#0058bc` → `#0070eb` gradient), tonal surface shifts for depth, no borders, Inter font.

---

## Public Browser (Next.js 14, Cloudflare Pages)

**Route structure:**
```
/                 Landing — search bar, category filters, featured grid
/templates        Catalog — filter by category/manufacturer/year, sort by name/year/rarity
                  Cards: thumbnail (auto light/dark per OS preference), name, year, CPU, rarity badge
/templates/:id    Detail — hero thumbnail, all factory-spec fields in sections,
                  variants group, "Suggest a Correction" + "Add Image" buttons
/submit           Submission form (deep-linkable: ?templateId=X&type=CORRECTION)
```

**Bot protection:**
- Pages are statically generated (SSG) or edge-cached — origin rarely hit
- `robots.txt` disallows aggressive crawlers
- Rate limiting + optional Turnstile on submission endpoint only
- No client-side API calls on public pages — data embedded at build time via ISR

---

## Project Structure

```
TemplatesDifferent/
├── worker/                         Cloudflare Worker
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   ├── templates.ts
│   │   │   ├── submissions.ts
│   │   │   ├── admin.ts
│   │   │   └── auth.ts
│   │   ├── db/
│   │   │   ├── schema.sql
│   │   │   └── queries.ts
│   │   ├── r2.ts
│   │   ├── cache.ts
│   │   ├── auth.ts
│   │   └── turnstile.ts
│   ├── wrangler.toml
│   └── package.json
│
├── admin/                          Admin Console (Next.js 14)
│   └── src/app/
│       ├── (auth)/login/
│       └── (main)/
│           ├── templates/
│           ├── submissions/
│           └── categories/
│
├── public-browser/                 Public Catalog (Next.js 14, SSG)
│   └── src/app/
│       ├── page.tsx
│       ├── templates/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       └── submit/
│
├── seed/
│   ├── schema.sql                  Matches worker/src/db/schema.sql
│   ├── migrate.ts                  Apply schema via wrangler
│   └── import-from-invdifferent.ts One-time import of existing templates
│
└── docs/
    └── superpowers/specs/
```

**Deployment:**
- `wrangler deploy` for Worker
- Cloudflare Pages CI/CD (GitHub push → auto-deploy) for admin + public browser
- D1 + R2 created via `wrangler d1 create` / `wrangler r2 bucket create`
- Secrets: `JWT_SECRET`, `OPENAI_API_KEY`, `ENABLE_TURNSTILE` via `wrangler secret put`

---

## Testing

**Worker (Vitest + Cloudflare workerd test runner):**
- Unit: route handlers with mocked D1/R2/KV bindings
- Integration: full Worker against local D1 (`wrangler dev --local`)
- Key cases: rate limiting, ETag 304 responses, auth guard on admin routes, R2 object move on image approval

**Admin + Public Browser (Playwright E2E):**
- Login flow, template CRUD, submission approve/deny
- Image upload → approval → visible on public detail page
- Tests run against local Worker (`wrangler dev`)

**Seed/import:**
- Dry-run flag validates all InvDifferent2 templates parse cleanly before committing to D1

---

## Future Phase: InvDifferent2 Integration (not in scope)

When the template server is fully working, InvDifferent2 will be updated to:
- Add `source` (LOCAL|REMOTE), `remoteId`, `remoteVersion`, `templateServerUrl` fields to its `Template` model
- Add a "Sync Remote Templates" action (manual button + optional background cron)
- Show a source badge (Global/Local) in the template picker
- Auto-add `templateServerUrl` as a device reference link when a remote template is applied
- Make remote templates read-only in the edit modal, with a "Suggest a Change" deep-link

Integration will be **opt-in**, enabled via a toggle in the InvDifferent2 settings page.
