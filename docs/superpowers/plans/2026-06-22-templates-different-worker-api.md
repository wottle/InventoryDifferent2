# TemplatesDifferent Worker API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Cloudflare Worker API (Hono + D1 + R2 + KV) that serves the TemplatesDifferent vintage Apple template catalog, handles community submissions, and provides admin management endpoints.

**Architecture:** A Hono-based Cloudflare Worker handles all API routing. D1 (SQLite) stores relational data (templates, variants, categories, submissions). R2 stores images under `public/` (approved) and `pending/` (unreviewed). KV stores rate limit counters with 1-hour TTLs. ETags are generated from `updatedAt` timestamps; Cloudflare's CDN caches public endpoints at the edge. Variants inherit NULL fields from their parent — the Worker merges parent+child before responding.

**Tech Stack:** TypeScript, Cloudflare Workers, Hono v4, D1, R2, KV, Vitest + `@cloudflare/vitest-pool-workers`, Wrangler CLI v3, tsx (for seed scripts)

## Global Constraints

- TypeScript strict mode (`"strict": true`, `"noUncheckedIndexedAccess": true`) throughout
- Hono v4 (not v3)
- `@cloudflare/vitest-pool-workers` for all Worker tests — do NOT use Node.js test runner for Worker code
- All D1 queries use parameterized `.bind()` statements — never string interpolation
- No external JWT library — use Workers native SubtleCrypto (HMAC-SHA256)
- Rate limit: 5 submissions per IP per hour, enforced via KV
- Admin password stored as env secret `ADMIN_PASSWORD`, hashed with PBKDF2 via SubtleCrypto
- Image R2 keys: `public/{templateId}/{type}.webp` (approved), `pending/{uploadId}` (unreviewed)
- All responses `Content-Type: application/json` unless serving binary
- CORS: allow all origins on public endpoints

---

**This is Plan 1 of 3.** Plans 2 (Admin Console) and 3 (Public Browser) will be written once this Worker is deployed and tested.

---

## File Map

```
TemplatesDifferent/
└── worker/
    ├── src/
    │   ├── index.ts              Entry point — Hono app, CORS, route registration
    │   ├── types.ts              Env binding type + all shared TS interfaces
    │   ├── auth.ts               JWT sign/verify, PBKDF2 password hash, authMiddleware
    │   ├── cache.ts              ETag generation (djb2), KV rate limiter
    │   ├── r2.ts                 R2 helpers: put, move, delete, key builders
    │   ├── turnstile.ts          Cloudflare Turnstile token verification
    │   ├── db/
    │   │   ├── schema.sql        D1 schema — source of truth for all tables + seed categories
    │   │   └── queries.ts        Typed D1 query helpers for all tables
    │   └── routes/
    │       ├── auth.ts           POST /auth/login, POST /auth/refresh
    │       ├── public.ts         GET /categories, /templates, /templates/:id, /sync
    │       ├── submissions.ts    POST /submissions/image-upload-url, PUT /submissions/upload/:id, POST /submissions
    │       └── admin.ts          All /admin/* routes
    ├── test/
    │   ├── helpers.ts            Seed/clear DB utilities, getTestEnv()
    │   ├── auth.test.ts          JWT + password hash tests
    │   ├── public.test.ts        DB query tests + public route tests (ETag, 304, pagination)
    │   ├── submissions.test.ts   Submission route tests (rate limiting, validation)
    │   └── admin.test.ts         Admin route tests (CRUD, approve/deny, image management)
    ├── seed/
    │   └── import-from-invdifferent.ts  One-time import of existing templates from SQL dump
    ├── wrangler.toml
    ├── vitest.config.ts
    ├── tsconfig.json
    └── package.json
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `TemplatesDifferent/worker/package.json`
- Create: `TemplatesDifferent/worker/wrangler.toml`
- Create: `TemplatesDifferent/worker/tsconfig.json`
- Create: `TemplatesDifferent/worker/vitest.config.ts`
- Create: `TemplatesDifferent/worker/src/types.ts`
- Create: `TemplatesDifferent/worker/src/index.ts` (minimal)

**Interfaces:**
- Produces: `Env` type consumed by every route handler and test

- [ ] **Step 1: Create the project directory and git repo**

```bash
mkdir -p /Users/wottle/Documents/Development/TemplatesDifferent/worker
cd /Users/wottle/Documents/Development/TemplatesDifferent
git init
printf "node_modules/\n.wrangler/\ndist/\n.env\n" > .gitignore
```

- [ ] **Step 2: Create worker/package.json**

```json
{
  "name": "templates-different-worker",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate:local": "wrangler d1 execute templates-different --local --file=src/db/schema.sql",
    "db:migrate:remote": "wrangler d1 execute templates-different --file=src/db/schema.sql"
  },
  "dependencies": {
    "hono": "^4.6.0"
  },
  "devDependencies": {
    "@cloudflare/vitest-pool-workers": "^0.5.0",
    "@cloudflare/workers-types": "^4.20241022.0",
    "tsx": "^4.19.0",
    "typescript": "^5.5.0",
    "vitest": "^2.1.0",
    "wrangler": "^3.80.0"
  }
}
```

- [ ] **Step 3: Install dependencies**

```bash
cd /Users/wottle/Documents/Development/TemplatesDifferent/worker
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 4: Create worker/wrangler.toml**

```toml
name = "templates-different-worker"
main = "src/index.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "templates-different"
database_id = "placeholder-replace-after-create"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "templates-different-images"

[[kv_namespaces]]
binding = "RATE_LIMITS"
id = "placeholder-replace-after-create"

[vars]
ENABLE_TURNSTILE = "false"
ADMIN_CONSOLE_ORIGIN = "http://localhost:3000"
PUBLIC_BROWSER_ORIGIN = "http://localhost:3001"
IMAGES_PUBLIC_BASE_URL = "http://localhost:8787/images"

# Secrets (set via `wrangler secret put`):
# JWT_SECRET        — random 32+ char string
# ADMIN_PASSWORD    — your admin password (plaintext; hashed at first login)
# OPENAI_API_KEY    — for AI image generation
# TURNSTILE_SECRET_KEY — if ENABLE_TURNSTILE=true
```

- [ ] **Step 5: Create worker/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*", "test/**/*", "seed/**/*"]
}
```

- [ ] **Step 6: Create worker/vitest.config.ts**

```typescript
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: {
          d1Databases: ["DB"],
          r2Buckets: ["IMAGES"],
          kvNamespaces: ["RATE_LIMITS"],
          bindings: {
            ENABLE_TURNSTILE: "false",
            ADMIN_CONSOLE_ORIGIN: "http://localhost:3000",
            IMAGES_PUBLIC_BASE_URL: "http://localhost:8787/images",
            JWT_SECRET: "test-secret-32-chars-minimum-length",
            ADMIN_PASSWORD: "test-password",
          },
        },
      },
    },
  },
});
```

- [ ] **Step 7: Create src/types.ts**

```typescript
export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  RATE_LIMITS: KVNamespace;
  ENABLE_TURNSTILE: string;
  ADMIN_CONSOLE_ORIGIN: string;
  PUBLIC_BROWSER_ORIGIN: string;
  IMAGES_PUBLIC_BASE_URL: string;
  JWT_SECRET: string;
  ADMIN_PASSWORD: string;
  OPENAI_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

export interface Template {
  id: number;
  parentId: number | null;
  categoryId: number;
  status: "DRAFT" | "PUBLISHED";
  name: string;
  additionalName: string | null;
  manufacturer: string | null;
  modelNumber: string | null;
  codename: string | null;
  orderNumbers: string | null;
  gestaltId: string | null;
  introductionDate: string | null;
  discontinuedDate: string | null;
  releaseYear: number | null;
  originalPriceLow: number | null;
  originalPriceHigh: number | null;
  estimatedValue: number | null;
  cpuType: string | null;
  cpuSpeed: string | null;
  fpu: string | null;
  dataPathWidth: number | null;
  busSpeed: string | null;
  l2Cache: string | null;
  ram: string | null;
  ramMin: string | null;
  ramMax: string | null;
  ramSlots: number | null;
  ramType: string | null;
  storage: string | null;
  graphicsChip: string | null;
  screenSize: string | null;
  displayType: string | null;
  displayVariant: string | null;
  nativeResolution: string | null;
  expansionSlots: string | null;
  driveBays: string | null;
  ports: string | null;
  ethernet: string | null;
  isWifiEnabled: number | null;
  operatingSystem: string | null;
  minOS: string | null;
  maxOS: string | null;
  weight: string | null;
  dimensions: string | null;
  batteryType: string | null;
  isPramBatteryRemoved: number | null;
  externalUrl: string | null;
  externalLinkLabel: string | null;
  rarity: string | null;
  historicalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  type: "COMPUTER" | "PERIPHERAL" | "ACCESSORY" | "OTHER";
}

export interface Image {
  id: number;
  templateId: number;
  type: "LIGHT" | "DARK";
  r2Key: string;
  status: "PENDING" | "APPROVED";
  submittedBy: string | null;
  createdAt: string;
}

export interface Submission {
  id: number;
  templateId: number | null;
  type: "CORRECTION" | "NEW_TEMPLATE" | "IMAGE";
  submitterEmail: string | null;
  payload: string;
  status: "PENDING" | "APPROVED" | "DENIED";
  reviewNote: string | null;
  createdAt: string;
}
```

- [ ] **Step 8: Create minimal src/index.ts**

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({ origin: "*" }));
app.get("/health", (c) => c.json({ ok: true }));

export default app;
```

- [ ] **Step 9: Verify dev server starts**

```bash
cd /Users/wottle/Documents/Development/TemplatesDifferent/worker
npx wrangler dev --local
```

In another terminal:
```bash
curl http://localhost:8787/health
```

Expected: `{"ok":true}`. Stop server with Ctrl+C.

- [ ] **Step 10: Commit**

```bash
cd /Users/wottle/Documents/Development/TemplatesDifferent
git add worker/
git commit -m "feat: scaffold worker project with Hono, Wrangler, Vitest"
```

---

## Task 2: D1 Schema

**Files:**
- Create: `worker/src/db/schema.sql`

**Interfaces:**
- Produces: D1 tables `Category`, `Template`, `Image`, `Submission` used by all query helpers in Task 3

- [ ] **Step 1: Create worker/src/db/schema.sql**

```sql
CREATE TABLE IF NOT EXISTS Category (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL,
  type  TEXT NOT NULL CHECK(type IN ('COMPUTER', 'PERIPHERAL', 'ACCESSORY', 'OTHER'))
);

CREATE TABLE IF NOT EXISTS Template (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  parentId             INTEGER REFERENCES Template(id) ON DELETE SET NULL,
  categoryId           INTEGER NOT NULL REFERENCES Category(id),
  status               TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'PUBLISHED')),

  name                 TEXT NOT NULL,
  additionalName       TEXT,
  manufacturer         TEXT DEFAULT 'Apple',
  modelNumber          TEXT,
  codename             TEXT,
  orderNumbers         TEXT,
  gestaltId            TEXT,

  introductionDate     TEXT,
  discontinuedDate     TEXT,
  releaseYear          INTEGER,
  originalPriceLow     REAL,
  originalPriceHigh    REAL,
  estimatedValue       REAL,

  cpuType              TEXT,
  cpuSpeed             TEXT,
  fpu                  TEXT,
  dataPathWidth        INTEGER,
  busSpeed             TEXT,
  l2Cache              TEXT,

  ram                  TEXT,
  ramMin               TEXT,
  ramMax               TEXT,
  ramSlots             INTEGER,
  ramType              TEXT,

  storage              TEXT,
  graphicsChip         TEXT,
  screenSize           TEXT,
  displayType          TEXT,
  displayVariant       TEXT,
  nativeResolution     TEXT,

  expansionSlots       TEXT,
  driveBays            TEXT,
  ports                TEXT,
  ethernet             TEXT,
  isWifiEnabled        INTEGER CHECK(isWifiEnabled IN (0, 1)),

  operatingSystem      TEXT,
  minOS                TEXT,
  maxOS                TEXT,

  weight               TEXT,
  dimensions           TEXT,
  batteryType          TEXT,
  isPramBatteryRemoved INTEGER CHECK(isPramBatteryRemoved IN (0, 1)),

  externalUrl          TEXT,
  externalLinkLabel    TEXT,
  rarity               TEXT CHECK(rarity IN ('COMMON','UNCOMMON','RARE','VERY_RARE','EXTREMELY_RARE')),
  historicalNotes      TEXT,

  createdAt            TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_template_parent   ON Template(parentId);
CREATE INDEX IF NOT EXISTS idx_template_category ON Template(categoryId);
CREATE INDEX IF NOT EXISTS idx_template_status   ON Template(status);
CREATE INDEX IF NOT EXISTS idx_template_updated  ON Template(updatedAt);

CREATE TABLE IF NOT EXISTS Image (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  templateId   INTEGER NOT NULL REFERENCES Template(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK(type IN ('LIGHT', 'DARK')),
  r2Key        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED')),
  submittedBy  TEXT,
  createdAt    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_image_template ON Image(templateId);
CREATE INDEX IF NOT EXISTS idx_image_status   ON Image(status);

CREATE TABLE IF NOT EXISTS Submission (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  templateId     INTEGER REFERENCES Template(id) ON DELETE SET NULL,
  type           TEXT NOT NULL CHECK(type IN ('CORRECTION', 'NEW_TEMPLATE', 'IMAGE')),
  submitterEmail TEXT,
  payload        TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'DENIED')),
  reviewNote     TEXT,
  createdAt      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_submission_status   ON Submission(status);
CREATE INDEX IF NOT EXISTS idx_submission_template ON Submission(templateId);

-- Default categories (idempotent)
INSERT OR IGNORE INTO Category (id, name, type) VALUES
  (1,  'Compact Macs', 'COMPUTER'),
  (2,  'All-in-Ones',  'COMPUTER'),
  (3,  'Desktops',     'COMPUTER'),
  (4,  'Towers',       'COMPUTER'),
  (5,  'Servers',      'COMPUTER'),
  (6,  'Laptops',      'COMPUTER'),
  (7,  'Portables',    'COMPUTER'),
  (8,  'Keyboards',    'PERIPHERAL'),
  (9,  'Monitors',     'PERIPHERAL'),
  (10, 'Accessories',  'ACCESSORY');
```

- [ ] **Step 2: Apply schema to local D1**

```bash
cd /Users/wottle/Documents/Development/TemplatesDifferent/worker
npx wrangler d1 execute templates-different --local --file=src/db/schema.sql
```

Expected: `Successfully applied` message. Wrangler creates the local D1 automatically.

- [ ] **Step 3: Verify tables exist**

```bash
npx wrangler d1 execute templates-different --local --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

Expected output: `Category`, `Image`, `Submission`, `Template`.

- [ ] **Step 4: Commit**

```bash
cd /Users/wottle/Documents/Development/TemplatesDifferent
git add worker/src/db/schema.sql
git commit -m "feat: add D1 schema — Template, Category, Image, Submission tables"
```

---

## Task 3: DB Query Layer

**Files:**
- Create: `worker/src/db/queries.ts`
- Create: `worker/test/helpers.ts`
- Create: `worker/test/public.test.ts` (query tests only)

**Interfaces:**
- Consumes: `Template`, `Category`, `Image`, `Submission` from `src/types.ts`
- Produces:
  - `getCategories(db): Promise<Category[]>`
  - `getTemplates(db, opts?): Promise<{ templates: TemplateWithCategory[], nextCursor: string|null, total: number }>`
  - `getTemplateById(db, id, imagesBaseUrl): Promise<TemplateWithImages|null>` (merged with parent, includes variants + approved images)
  - `getSyncVersion(db): Promise<string>`
  - `createTemplate(db, data): Promise<Template>`
  - `updateTemplate(db, id, data): Promise<Template|null>`
  - `deleteTemplate(db, id): Promise<boolean>`
  - `getSubmissions(db, opts?): Promise<{ submissions: Submission[], nextCursor: string|null }>`
  - `getSubmissionById(db, id): Promise<Submission|null>`
  - `createSubmission(db, data): Promise<Submission>`
  - `updateSubmissionStatus(db, id, status, reviewNote?): Promise<Submission|null>`
  - `getPendingImages(db): Promise<Image[]>`
  - `createImage(db, data): Promise<Image>`
  - `updateImageStatus(db, id, status): Promise<Image|null>`

- [ ] **Step 1: Create worker/test/helpers.ts**

```typescript
import { env } from "cloudflare:test";
import type { Env } from "../src/types";

export async function applySchema() {
  const db = (env as unknown as Env).DB;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Category (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS Template (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parentId INTEGER,
      categoryId INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      name TEXT NOT NULL,
      additionalName TEXT, manufacturer TEXT DEFAULT 'Apple',
      modelNumber TEXT, codename TEXT, orderNumbers TEXT, gestaltId TEXT,
      introductionDate TEXT, discontinuedDate TEXT, releaseYear INTEGER,
      originalPriceLow REAL, originalPriceHigh REAL, estimatedValue REAL,
      cpuType TEXT, cpuSpeed TEXT, fpu TEXT, dataPathWidth INTEGER, busSpeed TEXT, l2Cache TEXT,
      ram TEXT, ramMin TEXT, ramMax TEXT, ramSlots INTEGER, ramType TEXT,
      storage TEXT, graphicsChip TEXT, screenSize TEXT, displayType TEXT,
      displayVariant TEXT, nativeResolution TEXT,
      expansionSlots TEXT, driveBays TEXT, ports TEXT, ethernet TEXT, isWifiEnabled INTEGER,
      operatingSystem TEXT, minOS TEXT, maxOS TEXT,
      weight TEXT, dimensions TEXT, batteryType TEXT, isPramBatteryRemoved INTEGER,
      externalUrl TEXT, externalLinkLabel TEXT, rarity TEXT, historicalNotes TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS Image (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      templateId INTEGER NOT NULL,
      type TEXT NOT NULL, r2Key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      submittedBy TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS Submission (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      templateId INTEGER,
      type TEXT NOT NULL, submitterEmail TEXT, payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      reviewNote TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export async function seedDatabase() {
  const db = (env as unknown as Env).DB;
  await db.exec(`
    INSERT OR IGNORE INTO Category (id, name, type) VALUES (1, 'Compact Macs', 'COMPUTER');
    INSERT INTO Template (id, categoryId, status, name, manufacturer, releaseYear, updatedAt)
      VALUES (1, 1, 'PUBLISHED', 'Macintosh SE', 'Apple', 1987, '2024-01-01T00:00:00Z');
    INSERT INTO Template (id, parentId, categoryId, status, name, additionalName, ram, updatedAt)
      VALUES (2, 1, 1, 'PUBLISHED', 'Macintosh SE', 'FDHD', '4 MB', '2024-01-02T00:00:00Z');
  `);
}

export async function clearDatabase() {
  const db = (env as unknown as Env).DB;
  await db.exec("DELETE FROM Submission; DELETE FROM Image; DELETE FROM Template; DELETE FROM Category;");
}

export function getTestEnv(): Env {
  return env as unknown as Env;
}
```

- [ ] **Step 2: Create worker/src/db/queries.ts**

```typescript
import type { Template, Category, Image, Submission } from "../types";

export interface TemplateWithCategory extends Template {
  category: Category;
}

export interface TemplateWithImages extends TemplateWithCategory {
  variants: TemplateWithCategory[];
  images: { type: string; url: string }[];
  templateServerUrl: string;
}

function mergeVariant(parent: Template, child: Template): Template {
  const merged: Record<string, unknown> = { ...parent };
  for (const key of Object.keys(child) as (keyof Template)[]) {
    if (child[key] !== null && key !== "id" && key !== "parentId") {
      merged[key] = child[key];
    }
  }
  merged["id"] = child.id;
  merged["parentId"] = child.parentId;
  return merged as Template;
}

function rowToTemplate(row: Record<string, unknown>): TemplateWithCategory {
  return {
    ...(row as unknown as Template),
    category: {
      id: row["cat_id"] as number,
      name: row["cat_name"] as string,
      type: row["cat_type"] as Category["type"],
    },
  };
}

export async function getCategories(db: D1Database): Promise<Category[]> {
  const result = await db.prepare("SELECT * FROM Category ORDER BY name").all<Category>();
  return result.results;
}

export async function getTemplates(
  db: D1Database,
  opts: {
    categoryId?: number;
    search?: string;
    parentOnly?: boolean;
    cursor?: string;
    limit?: number;
  } = {}
): Promise<{ templates: TemplateWithCategory[]; nextCursor: string | null; total: number }> {
  const limit = Math.min(opts.limit ?? 50, 200);
  const cursorId = opts.cursor ? parseInt(atob(opts.cursor), 10) : 0;

  const conditions: string[] = ["t.status = 'PUBLISHED'"];
  const params: (string | number)[] = [];

  if (opts.parentOnly) conditions.push("t.parentId IS NULL");
  if (opts.categoryId != null) { conditions.push("t.categoryId = ?"); params.push(opts.categoryId); }
  if (opts.search) {
    conditions.push("(t.name LIKE ? OR t.additionalName LIKE ? OR t.codename LIKE ?)");
    const s = `%${opts.search}%`;
    params.push(s, s, s);
  }
  if (cursorId > 0) { conditions.push("t.id > ?"); params.push(cursorId); }

  const where = conditions.join(" AND ");

  const rows = await db
    .prepare(
      `SELECT t.*, c.id as cat_id, c.name as cat_name, c.type as cat_type
       FROM Template t JOIN Category c ON t.categoryId = c.id
       WHERE ${where} ORDER BY t.id ASC LIMIT ?`
    )
    .bind(...params, limit + 1)
    .all<Record<string, unknown>>();

  const countParams = params.filter((_, i) => !(cursorId > 0 && i === params.length - 1));
  const countWhere = conditions.slice(0, cursorId > 0 ? -1 : undefined).join(" AND ");
  const countRow = await db
    .prepare(`SELECT COUNT(*) as n FROM Template t WHERE ${countWhere}`)
    .bind(...countParams)
    .first<{ n: number }>();

  const hasMore = rows.results.length > limit;
  const items = rows.results.slice(0, limit);
  const templates = items.map(rowToTemplate);
  const lastId = items[items.length - 1]?.["id"];
  const nextCursor = hasMore && lastId != null ? btoa(String(lastId)) : null;

  return { templates, nextCursor, total: countRow?.n ?? 0 };
}

export async function getTemplateById(
  db: D1Database,
  id: number,
  imagesBaseUrl: string
): Promise<TemplateWithImages | null> {
  const row = await db
    .prepare(
      `SELECT t.*, c.id as cat_id, c.name as cat_name, c.type as cat_type
       FROM Template t JOIN Category c ON t.categoryId = c.id
       WHERE t.id = ? AND t.status = 'PUBLISHED'`
    )
    .bind(id)
    .first<Record<string, unknown>>();

  if (!row) return null;

  let merged = row;
  if (row["parentId"]) {
    const parent = await db
      .prepare("SELECT * FROM Template WHERE id = ?")
      .bind(row["parentId"])
      .first<Template>();
    if (parent) {
      const m = mergeVariant(parent, row as unknown as Template);
      merged = { ...m, cat_id: row["cat_id"], cat_name: row["cat_name"], cat_type: row["cat_type"] };
    }
  }

  const rootId = (row["parentId"] ?? row["id"]) as number;
  const variantRows = await db
    .prepare(
      `SELECT t.*, c.id as cat_id, c.name as cat_name, c.type as cat_type
       FROM Template t JOIN Category c ON t.categoryId = c.id
       WHERE (t.parentId = ? OR (t.parentId IS NULL AND t.id = ?)) AND t.status = 'PUBLISHED'`
    )
    .bind(rootId, rootId)
    .all<Record<string, unknown>>();

  const variants = variantRows.results.map(rowToTemplate);

  const imageRows = await db
    .prepare("SELECT * FROM Image WHERE templateId = ? AND status = 'APPROVED'")
    .bind(id)
    .all<Image>();

  const images = imageRows.results.map((img) => ({
    type: img.type,
    url: `${imagesBaseUrl}/${img.r2Key}`,
  }));

  return {
    ...rowToTemplate(merged),
    variants,
    images,
    templateServerUrl: `/templates/${id}`,
  };
}

export async function getSyncVersion(db: D1Database): Promise<string> {
  const row = await db
    .prepare("SELECT MAX(updatedAt) as latest FROM Template WHERE status = 'PUBLISHED'")
    .first<{ latest: string | null }>();
  return row?.latest ?? "0";
}

export async function createTemplate(
  db: D1Database,
  data: Partial<Omit<Template, "id" | "createdAt" | "updatedAt">> & { name: string; categoryId: number }
): Promise<Template> {
  const fields = Object.keys(data).filter((k) => (data as Record<string, unknown>)[k] !== undefined);
  const placeholders = fields.map(() => "?").join(", ");
  const values = fields.map((k) => (data as Record<string, unknown>)[k]);

  const result = await db
    .prepare(
      `INSERT INTO Template (${fields.join(", ")}, updatedAt)
       VALUES (${placeholders}, datetime('now')) RETURNING *`
    )
    .bind(...values)
    .first<Template>();

  if (!result) throw new Error("createTemplate: insert returned null");
  return result;
}

export async function updateTemplate(
  db: D1Database,
  id: number,
  data: Partial<Omit<Template, "id" | "createdAt" | "updatedAt">>
): Promise<Template | null> {
  const fields = Object.keys(data).filter((k) => (data as Record<string, unknown>)[k] !== undefined);
  if (fields.length === 0) {
    return db.prepare("SELECT * FROM Template WHERE id = ?").bind(id).first<Template>();
  }
  const sets = fields.map((f) => `${f} = ?`).join(", ");
  const values = fields.map((k) => (data as Record<string, unknown>)[k]);

  return db
    .prepare(`UPDATE Template SET ${sets}, updatedAt = datetime('now') WHERE id = ? RETURNING *`)
    .bind(...values, id)
    .first<Template>();
}

export async function deleteTemplate(db: D1Database, id: number): Promise<boolean> {
  const result = await db.prepare("DELETE FROM Template WHERE id = ? RETURNING id").bind(id).first();
  return result !== null;
}

export async function getSubmissions(
  db: D1Database,
  opts: { status?: string; type?: string; limit?: number; cursor?: string } = {}
): Promise<{ submissions: Submission[]; nextCursor: string | null }> {
  const limit = Math.min(opts.limit ?? 50, 200);
  const cursorId = opts.cursor ? parseInt(atob(opts.cursor), 10) : 0;
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (opts.status) { conditions.push("status = ?"); params.push(opts.status); }
  if (opts.type) { conditions.push("type = ?"); params.push(opts.type); }
  if (cursorId > 0) { conditions.push("id > ?"); params.push(cursorId); }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const rows = await db
    .prepare(`SELECT * FROM Submission ${where} ORDER BY id ASC LIMIT ?`)
    .bind(...params, limit + 1)
    .all<Submission>();

  const hasMore = rows.results.length > limit;
  const items = rows.results.slice(0, limit);
  const lastId = items[items.length - 1]?.id;
  const nextCursor = hasMore && lastId != null ? btoa(String(lastId)) : null;
  return { submissions: items, nextCursor };
}

export async function getSubmissionById(db: D1Database, id: number): Promise<Submission | null> {
  return db.prepare("SELECT * FROM Submission WHERE id = ?").bind(id).first<Submission>();
}

export async function createSubmission(
  db: D1Database,
  data: { templateId: number | null; type: string; submitterEmail: string | null; payload: string; reviewNote: null }
): Promise<Submission> {
  const result = await db
    .prepare(
      `INSERT INTO Submission (templateId, type, submitterEmail, payload)
       VALUES (?, ?, ?, ?) RETURNING *`
    )
    .bind(data.templateId, data.type, data.submitterEmail, data.payload)
    .first<Submission>();

  if (!result) throw new Error("createSubmission: insert returned null");
  return result;
}

export async function updateSubmissionStatus(
  db: D1Database,
  id: number,
  status: "APPROVED" | "DENIED",
  reviewNote?: string
): Promise<Submission | null> {
  return db
    .prepare("UPDATE Submission SET status = ?, reviewNote = ? WHERE id = ? RETURNING *")
    .bind(status, reviewNote ?? null, id)
    .first<Submission>();
}

export async function getPendingImages(db: D1Database): Promise<Image[]> {
  const rows = await db
    .prepare("SELECT * FROM Image WHERE status = 'PENDING' ORDER BY createdAt DESC")
    .all<Image>();
  return rows.results;
}

export async function createImage(
  db: D1Database,
  data: Omit<Image, "id" | "createdAt">
): Promise<Image> {
  const result = await db
    .prepare(
      `INSERT INTO Image (templateId, type, r2Key, status, submittedBy)
       VALUES (?, ?, ?, ?, ?) RETURNING *`
    )
    .bind(data.templateId, data.type, data.r2Key, data.status, data.submittedBy)
    .first<Image>();

  if (!result) throw new Error("createImage: insert returned null");
  return result;
}

export async function updateImageStatus(
  db: D1Database,
  id: number,
  status: "APPROVED" | "DENIED"
): Promise<Image | null> {
  if (status === "DENIED") {
    return db.prepare("DELETE FROM Image WHERE id = ? RETURNING *").bind(id).first<Image>();
  }
  return db.prepare("UPDATE Image SET status = 'APPROVED' WHERE id = ? RETURNING *").bind(id).first<Image>();
}
```

- [ ] **Step 3: Write query tests**

Create `worker/test/public.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { applySchema, seedDatabase, clearDatabase, getTestEnv } from "./helpers";
import {
  getCategories, getTemplates, getTemplateById, getSyncVersion,
} from "../src/db/queries";

describe("DB queries", () => {
  beforeEach(async () => {
    await applySchema();
    await clearDatabase();
    await seedDatabase();
  });

  it("getCategories returns seeded categories", async () => {
    const cats = await getCategories(getTestEnv().DB);
    expect(cats.length).toBeGreaterThan(0);
    expect(cats[0]).toHaveProperty("name");
    expect(cats[0]).toHaveProperty("type");
  });

  it("getTemplates returns published templates", async () => {
    const result = await getTemplates(getTestEnv().DB);
    expect(result.templates.length).toBe(2);
    expect(result.total).toBe(2);
  });

  it("getTemplates parentOnly filters children", async () => {
    const result = await getTemplates(getTestEnv().DB, { parentOnly: true });
    expect(result.templates.length).toBe(1);
    expect(result.templates[0]?.parentId).toBeNull();
  });

  it("getTemplateById merges variant with parent", async () => {
    const t = await getTemplateById(getTestEnv().DB, 2, "http://localhost");
    expect(t).not.toBeNull();
    expect(t?.additionalName).toBe("FDHD");
    expect(t?.name).toBe("Macintosh SE");       // inherited from parent
    expect(t?.manufacturer).toBe("Apple");       // inherited from parent
    expect(t?.ram).toBe("4 MB");                 // overridden by child
  });

  it("getSyncVersion returns a non-empty string", async () => {
    const v = await getSyncVersion(getTestEnv().DB);
    expect(typeof v).toBe("string");
    expect(v.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
cd /Users/wottle/Documents/Development/TemplatesDifferent/worker
npm test -- test/public.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/wottle/Documents/Development/TemplatesDifferent
git add worker/src/db/queries.ts worker/test/helpers.ts worker/test/public.test.ts
git commit -m "feat: add typed D1 query layer with variant merge and tests"
```

---

## Task 4: Auth (JWT + Login/Refresh)

**Files:**
- Create: `worker/src/auth.ts`
- Create: `worker/src/routes/auth.ts`
- Create: `worker/test/auth.test.ts`
- Modify: `worker/src/index.ts`

**Interfaces:**
- Produces:
  - `signJwt(payload, secret, expiresInSeconds): Promise<string>`
  - `verifyJwt(token, secret): Promise<Record<string,unknown>|null>`
  - `hashPassword(password, secret): Promise<string>`
  - `verifyPassword(password, hash, secret): Promise<boolean>`
  - `authMiddleware`: Hono middleware — reads `Authorization: Bearer <token>`, returns 401 if invalid

- [ ] **Step 1: Write failing tests**

Create `worker/test/auth.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { signJwt, verifyJwt, hashPassword, verifyPassword } from "../src/auth";
import { applySchema } from "./helpers";
import app from "../src/index";

const SECRET = "test-secret-32-chars-minimum-length";

describe("JWT", () => {
  it("signs and verifies a valid token", async () => {
    const token = await signJwt({ type: "access" }, SECRET, 3600);
    const payload = await verifyJwt(token, SECRET);
    expect(payload).not.toBeNull();
    expect(payload?.["type"]).toBe("access");
  });

  it("rejects an expired token", async () => {
    const token = await signJwt({ type: "access" }, SECRET, -1);
    expect(await verifyJwt(token, SECRET)).toBeNull();
  });

  it("rejects a tampered token", async () => {
    const token = await signJwt({ type: "access" }, SECRET, 3600);
    const tampered = token.slice(0, -5) + "XXXXX";
    expect(await verifyJwt(tampered, SECRET)).toBeNull();
  });
});

describe("Password", () => {
  it("verifies correct password", async () => {
    const hash = await hashPassword("my-password", SECRET);
    expect(await verifyPassword("my-password", hash, SECRET)).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("my-password", SECRET);
    expect(await verifyPassword("wrong", hash, SECRET)).toBe(false);
  });
});

describe("POST /auth/login", () => {
  it("returns tokens for correct password", async () => {
    const res = await app.request("http://localhost/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "test-password" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(typeof body.accessToken).toBe("string");
    expect(typeof body.refreshToken).toBe("string");
  });

  it("returns 401 for wrong password", async () => {
    const res = await app.request("http://localhost/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong" }),
    });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- test/auth.test.ts
```

Expected: FAIL — `signJwt` not defined.

- [ ] **Step 3: Create worker/src/auth.ts**

```typescript
import type { Context, Next } from "hono";
import type { Env } from "./types";

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]
  );
}

export async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds: number
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64url(new TextEncoder().encode(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSeconds })));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${base64url(sig)}`;
}

export async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts as [string, string, string];
    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify("HMAC", key, base64urlDecode(sig), new TextEncoder().encode(`${header}.${body}`));
    if (!valid) return null;
    const p = JSON.parse(new TextDecoder().decode(base64urlDecode(body))) as Record<string, unknown>;
    if (typeof p["exp"] === "number" && p["exp"] < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string, secret: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password + secret), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" }, key, 256);
  return `${btoa(String.fromCharCode(...salt))}.${btoa(String.fromCharCode(...new Uint8Array(bits)))}`;
}

export async function verifyPassword(password: string, hash: string, secret: string): Promise<boolean> {
  try {
    const [saltB64, hashB64] = hash.split(".");
    if (!saltB64 || !hashB64) return false;
    const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password + secret), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" }, key, 256);
    const candidate = btoa(String.fromCharCode(...new Uint8Array(bits)));
    const a = new TextEncoder().encode(candidate);
    const b = new TextEncoder().encode(hashB64);
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
    return diff === 0;
  } catch {
    return false;
  }
}

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return c.json({ error: "Unauthorized" }, 401);
  const payload = await verifyJwt(header.slice(7), c.env.JWT_SECRET);
  if (!payload || payload["type"] !== "access") return c.json({ error: "Unauthorized" }, 401);
  await next();
}
```

- [ ] **Step 4: Create worker/src/routes/auth.ts**

```typescript
import { Hono } from "hono";
import type { Env } from "../types";
import { signJwt, verifyJwt, hashPassword, verifyPassword } from "../auth";

const auth = new Hono<{ Bindings: Env }>();

// Hash computed once on first login — cached in Worker memory for the lifetime of the isolate
let cachedHash: string | null = null;

auth.post("/login", async (c) => {
  const body = await c.req.json<{ password?: string }>();
  if (!body.password) return c.json({ error: "Password required" }, 400);

  if (!cachedHash) {
    cachedHash = await hashPassword(c.env.ADMIN_PASSWORD, c.env.JWT_SECRET);
  }

  const valid = await verifyPassword(body.password, cachedHash, c.env.JWT_SECRET);
  if (!valid) return c.json({ error: "Invalid password" }, 401);

  const accessToken = await signJwt({ type: "access" }, c.env.JWT_SECRET, 3600);
  const refreshToken = await signJwt({ type: "refresh" }, c.env.JWT_SECRET, 90 * 24 * 3600);
  return c.json({ accessToken, refreshToken });
});

auth.post("/refresh", async (c) => {
  const body = await c.req.json<{ refreshToken?: string }>();
  if (!body.refreshToken) return c.json({ error: "Refresh token required" }, 400);
  const payload = await verifyJwt(body.refreshToken, c.env.JWT_SECRET);
  if (!payload || payload["type"] !== "refresh") return c.json({ error: "Invalid refresh token" }, 401);
  const accessToken = await signJwt({ type: "access" }, c.env.JWT_SECRET, 3600);
  return c.json({ accessToken });
});

export default auth;
```

- [ ] **Step 5: Wire auth into src/index.ts**

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import authRoutes from "./routes/auth";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({ origin: "*" }));
app.get("/health", (c) => c.json({ ok: true }));
app.route("/auth", authRoutes);

export default app;
```

- [ ] **Step 6: Run tests**

```bash
npm test -- test/auth.test.ts
```

Expected: 7 tests pass.

- [ ] **Step 7: Commit**

```bash
cd /Users/wottle/Documents/Development/TemplatesDifferent
git add worker/src/auth.ts worker/src/routes/auth.ts worker/src/index.ts worker/test/auth.test.ts
git commit -m "feat: JWT auth, PBKDF2 password hashing, login/refresh routes"
```

---

## Task 5: Cache Utilities

**Files:**
- Create: `worker/src/cache.ts`
- Modify: `worker/test/public.test.ts` (add cache tests)

**Interfaces:**
- Produces:
  - `generateETag(values: string[]): string`
  - `isNotModified(request: Request, etag: string): boolean`
  - `checkRateLimit(kv, ip, limit, windowSeconds): Promise<boolean>` (true = allowed)

- [ ] **Step 1: Add failing tests to test/public.test.ts**

Append after the existing `describe("DB queries")` block:

```typescript
import { generateETag, isNotModified, checkRateLimit } from "../src/cache";

describe("ETag", () => {
  it("is deterministic for same values", () => {
    expect(generateETag(["a", "b"])).toBe(generateETag(["a", "b"]));
  });

  it("differs for different values", () => {
    expect(generateETag(["a"])).not.toBe(generateETag(["b"]));
  });

  it("isNotModified returns true when ETag matches", () => {
    const etag = '"abc"';
    const req = new Request("http://x.com", { headers: { "If-None-Match": etag } });
    expect(isNotModified(req, etag)).toBe(true);
  });

  it("isNotModified returns false when ETag differs", () => {
    const req = new Request("http://x.com", { headers: { "If-None-Match": '"old"' } });
    expect(isNotModified(req, '"new"')).toBe(false);
  });
});

describe("Rate limiter", () => {
  it("allows the first request", async () => {
    expect(await checkRateLimit(getTestEnv().RATE_LIMITS, "1.1.1.1", 5, 3600)).toBe(true);
  });

  it("blocks after limit is reached", async () => {
    const kv = getTestEnv().RATE_LIMITS;
    const ip = "2.2.2.2";
    for (let i = 0; i < 5; i++) await checkRateLimit(kv, ip, 5, 3600);
    expect(await checkRateLimit(kv, ip, 5, 3600)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- test/public.test.ts
```

Expected: FAIL — `generateETag` not found.

- [ ] **Step 3: Create worker/src/cache.ts**

```typescript
export function generateETag(values: string[]): string {
  const str = values.join("|");
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return `"${hash.toString(16)}"`;
}

export function isNotModified(request: Request, etag: string): boolean {
  return request.headers.get("If-None-Match") === etag;
}

export async function checkRateLimit(
  kv: KVNamespace,
  ip: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const window = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `rl:${ip}:${window}`;
  const current = await kv.get(key);
  const count = current ? parseInt(current, 10) : 0;
  if (count >= limit) return false;
  await kv.put(key, String(count + 1), { expirationTtl: windowSeconds });
  return true;
}
```

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/wottle/Documents/Development/TemplatesDifferent
git add worker/src/cache.ts worker/test/public.test.ts
git commit -m "feat: ETag generation and KV-based rate limiter"
```

---

## Task 6: Public Read Routes

**Files:**
- Create: `worker/src/routes/public.ts`
- Modify: `worker/src/index.ts`
- Modify: `worker/test/public.test.ts` (add route tests)

**Interfaces:**
- Consumes: `getCategories`, `getTemplates`, `getTemplateById`, `getSyncVersion`; `generateETag`, `isNotModified`
- Produces: `GET /categories`, `GET /templates`, `GET /templates/:id`, `GET /sync`

- [ ] **Step 1: Add route tests to test/public.test.ts**

Append after the rate limiter tests:

```typescript
import app from "../src/index";

describe("GET /categories", () => {
  beforeEach(async () => { await applySchema(); await clearDatabase(); await seedDatabase(); });

  it("returns an array of categories", async () => {
    const res = await app.request("http://localhost/categories");
    expect(res.status).toBe(200);
    const body = await res.json() as any[];
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toHaveProperty("type");
  });

  it("includes an ETag header", async () => {
    const res = await app.request("http://localhost/categories");
    expect(res.headers.get("ETag")).toBeTruthy();
  });
});

describe("GET /templates", () => {
  beforeEach(async () => { await applySchema(); await clearDatabase(); await seedDatabase(); });

  it("returns paginated templates", async () => {
    const res = await app.request("http://localhost/templates");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(Array.isArray(body.templates)).toBe(true);
    expect(typeof body.total).toBe("number");
  });

  it("returns 304 when ETag matches", async () => {
    const res1 = await app.request("http://localhost/templates");
    const etag = res1.headers.get("ETag")!;
    const res2 = await app.request("http://localhost/templates", {
      headers: { "If-None-Match": etag },
    });
    expect(res2.status).toBe(304);
  });
});

describe("GET /templates/:id", () => {
  beforeEach(async () => { await applySchema(); await clearDatabase(); await seedDatabase(); });

  it("returns a template with variants and images arrays", async () => {
    const res = await app.request("http://localhost/templates/1");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.name).toBe("Macintosh SE");
    expect(Array.isArray(body.variants)).toBe(true);
    expect(Array.isArray(body.images)).toBe(true);
  });

  it("returns 404 for unknown id", async () => {
    const res = await app.request("http://localhost/templates/9999");
    expect(res.status).toBe(404);
  });
});

describe("GET /sync", () => {
  it("returns a version string", async () => {
    const res = await app.request("http://localhost/sync");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(typeof body.version).toBe("string");
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- test/public.test.ts
```

Expected: FAIL — route handlers not registered.

- [ ] **Step 3: Create worker/src/routes/public.ts**

```typescript
import { Hono } from "hono";
import type { Env } from "../types";
import { getCategories, getTemplates, getTemplateById, getSyncVersion } from "../db/queries";
import { generateETag, isNotModified } from "../cache";

const pub = new Hono<{ Bindings: Env }>();

pub.get("/categories", async (c) => {
  const cats = await getCategories(c.env.DB);
  const etag = generateETag(cats.map((cat) => String(cat.id)));
  if (isNotModified(c.req.raw, etag)) return new Response(null, { status: 304 });
  return c.json(cats, 200, { ETag: etag, "Cache-Control": "public, max-age=86400, s-maxage=604800" });
});

pub.get("/templates", async (c) => {
  const { category, search, parentOnly, cursor, limit } = c.req.query();
  const result = await getTemplates(c.env.DB, {
    categoryId: category ? parseInt(category) : undefined,
    search: search || undefined,
    parentOnly: parentOnly === "true",
    cursor: cursor || undefined,
    limit: limit ? parseInt(limit) : undefined,
  });
  const etag = generateETag(result.templates.map((t) => t.updatedAt));
  if (isNotModified(c.req.raw, etag)) return new Response(null, { status: 304 });
  return c.json(result, 200, { ETag: etag, "Cache-Control": "public, max-age=3600, s-maxage=86400" });
});

pub.get("/templates/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid ID" }, 400);
  const template = await getTemplateById(c.env.DB, id, c.env.IMAGES_PUBLIC_BASE_URL);
  if (!template) return c.json({ error: "Not found" }, 404);
  const etag = generateETag([template.updatedAt, ...template.variants.map((v) => v.updatedAt)]);
  if (isNotModified(c.req.raw, etag)) return new Response(null, { status: 304 });
  return c.json(template, 200, { ETag: etag, "Cache-Control": "public, max-age=3600, s-maxage=86400" });
});

pub.get("/sync", async (c) => {
  const version = await getSyncVersion(c.env.DB);
  return c.json({ version }, 200, { "Cache-Control": "public, max-age=300, s-maxage=300" });
});

export default pub;
```

- [ ] **Step 4: Update src/index.ts**

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import authRoutes from "./routes/auth";
import pubRoutes from "./routes/public";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({ origin: "*" }));
app.get("/health", (c) => c.json({ ok: true }));
app.route("/auth", authRoutes);
app.route("/", pubRoutes);

export default app;
```

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/wottle/Documents/Development/TemplatesDifferent
git add worker/src/routes/public.ts worker/src/index.ts worker/test/public.test.ts
git commit -m "feat: public read routes with ETag caching (categories, templates, sync)"
```

---

## Task 7: Submission Routes

**Files:**
- Create: `worker/src/r2.ts`
- Create: `worker/src/turnstile.ts`
- Create: `worker/src/routes/submissions.ts`
- Create: `worker/test/submissions.test.ts`
- Modify: `worker/src/index.ts`

**Interfaces:**
- Consumes: `checkRateLimit` from `src/cache.ts`; `createSubmission` from `src/db/queries.ts`
- Produces:
  - `pendingKey(uploadId): string` — `pending/{uploadId}`
  - `approvedKey(templateId, type): string` — `public/{templateId}/{type}.webp`
  - `moveR2Object(bucket, srcKey, destKey): Promise<void>`
  - `deleteR2Object(bucket, key): Promise<void>`
  - `POST /submissions/upload/:uploadId` — binary upload to R2 pending prefix
  - `POST /submissions/image-upload-url` — returns upload endpoint URL + r2Key
  - `POST /submissions` — creates submission record (rate limited, optional Turnstile)

- [ ] **Step 1: Create worker/src/r2.ts**

```typescript
export function pendingKey(uploadId: string): string {
  return `pending/${uploadId}`;
}

export function approvedKey(templateId: number, type: "LIGHT" | "DARK"): string {
  return `public/${templateId}/${type.toLowerCase()}.webp`;
}

export async function moveR2Object(
  bucket: R2Bucket,
  sourceKey: string,
  destKey: string
): Promise<void> {
  const obj = await bucket.get(sourceKey);
  if (!obj) throw new Error(`R2 object not found: ${sourceKey}`);
  await bucket.put(destKey, await obj.arrayBuffer(), {
    httpMetadata: obj.httpMetadata,
    customMetadata: obj.customMetadata,
  });
  await bucket.delete(sourceKey);
}

export async function deleteR2Object(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}
```

- [ ] **Step 2: Create worker/src/turnstile.ts**

```typescript
export async function verifyTurnstile(token: string, secretKey: string): Promise<boolean> {
  const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: secretKey, response: token }),
  });
  const data = await resp.json<{ success: boolean }>();
  return data.success === true;
}
```

- [ ] **Step 3: Write failing submission tests**

Create `worker/test/submissions.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { applySchema, seedDatabase, clearDatabase } from "./helpers";
import app from "../src/index";

describe("POST /submissions", () => {
  beforeEach(async () => { await applySchema(); await clearDatabase(); await seedDatabase(); });

  it("accepts a valid correction", async () => {
    const res = await app.request("http://localhost/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": "1.2.3.4" },
      body: JSON.stringify({ type: "CORRECTION", templateId: 1, payload: { cpuSpeed: "8 MHz" } }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(typeof body.submissionId).toBe("number");
  });

  it("rejects missing type", async () => {
    const res = await app.request("http://localhost/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": "5.5.5.5" },
      body: JSON.stringify({ payload: { name: "x" } }),
    });
    expect(res.status).toBe(400);
  });

  it("rate limits after 5 requests from same IP", async () => {
    const headers = { "Content-Type": "application/json", "CF-Connecting-IP": "9.8.7.6" };
    const body = JSON.stringify({ type: "CORRECTION", templateId: 1, payload: { name: "x" } });
    for (let i = 0; i < 5; i++) {
      await app.request("http://localhost/submissions", { method: "POST", headers, body });
    }
    const res = await app.request("http://localhost/submissions", { method: "POST", headers, body });
    expect(res.status).toBe(429);
  });
});
```

- [ ] **Step 4: Run to confirm failure**

```bash
npm test -- test/submissions.test.ts
```

Expected: FAIL — route not registered.

- [ ] **Step 5: Create worker/src/routes/submissions.ts**

```typescript
import { Hono } from "hono";
import type { Env } from "../types";
import { checkRateLimit } from "../cache";
import { createSubmission } from "../db/queries";
import { verifyTurnstile } from "../turnstile";
import { pendingKey } from "../r2";

const VALID_TYPES = new Set(["CORRECTION", "NEW_TEMPLATE", "IMAGE"]);

const submissions = new Hono<{ Bindings: Env }>();

submissions.post("/image-upload-url", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  if (!(await checkRateLimit(c.env.RATE_LIMITS, ip, 5, 3600))) {
    return c.json({ error: "Rate limit exceeded" }, 429);
  }
  const uploadId = crypto.randomUUID();
  return c.json({ r2Key: pendingKey(uploadId), uploadEndpoint: `/submissions/upload/${uploadId}` });
});

submissions.put("/upload/:uploadId", async (c) => {
  const r2Key = pendingKey(c.req.param("uploadId"));
  const body = await c.req.arrayBuffer();
  await c.env.IMAGES.put(r2Key, body, {
    httpMetadata: { contentType: c.req.header("Content-Type") ?? "image/webp" },
  });
  return c.json({ r2Key });
});

submissions.post("/", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  if (!(await checkRateLimit(c.env.RATE_LIMITS, ip, 5, 3600))) {
    return c.json({ error: "Rate limit exceeded" }, 429);
  }

  let body: Record<string, unknown>;
  try { body = await c.req.json(); }
  catch { return c.json({ error: "Invalid JSON" }, 400); }

  const { type, templateId, submitterEmail, payload, turnstileToken } = body as Record<string, unknown>;

  if (!type || !VALID_TYPES.has(type as string)) {
    return c.json({ error: "Invalid submission type" }, 400);
  }
  if (!payload || typeof payload !== "object") {
    return c.json({ error: "payload required" }, 400);
  }

  if (c.env.ENABLE_TURNSTILE === "true" && c.env.TURNSTILE_SECRET_KEY) {
    if (!turnstileToken || !(await verifyTurnstile(turnstileToken as string, c.env.TURNSTILE_SECRET_KEY))) {
      return c.json({ error: "Turnstile verification failed" }, 403);
    }
  }

  const submission = await createSubmission(c.env.DB, {
    templateId: typeof templateId === "number" ? templateId : null,
    type: type as string,
    submitterEmail: typeof submitterEmail === "string" ? submitterEmail : null,
    payload: JSON.stringify(payload),
    reviewNote: null,
  });

  return c.json({ submissionId: submission.id }, 201);
});

export default submissions;
```

- [ ] **Step 6: Update src/index.ts**

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import authRoutes from "./routes/auth";
import pubRoutes from "./routes/public";
import submissionRoutes from "./routes/submissions";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({ origin: "*" }));
app.get("/health", (c) => c.json({ ok: true }));
app.route("/auth", authRoutes);
app.route("/submissions", submissionRoutes);
app.route("/", pubRoutes);

export default app;
```

- [ ] **Step 7: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
cd /Users/wottle/Documents/Development/TemplatesDifferent
git add worker/src/r2.ts worker/src/turnstile.ts worker/src/routes/submissions.ts worker/src/index.ts worker/test/submissions.test.ts
git commit -m "feat: submission routes with rate limiting and optional Turnstile"
```

---

## Task 8: Admin Routes

**Files:**
- Create: `worker/src/routes/admin.ts`
- Create: `worker/test/admin.test.ts`
- Modify: `worker/src/index.ts`

**Interfaces:**
- Consumes: `authMiddleware`; all query functions; `approvedKey`, `pendingKey`, `moveR2Object`, `deleteR2Object` from `src/r2.ts`
- Produces: All `/admin/*` endpoints

- [ ] **Step 1: Write failing admin tests**

Create `worker/test/admin.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { applySchema, clearDatabase, seedDatabase, getTestEnv } from "./helpers";
import { signJwt } from "../src/auth";
import app from "../src/index";

async function token(): Promise<string> {
  return signJwt({ type: "access" }, getTestEnv().JWT_SECRET, 3600);
}

function authHeader(t: string) {
  return { Authorization: `Bearer ${t}` };
}

describe("Admin auth guard", () => {
  it("returns 401 without token", async () => {
    const res = await app.request("http://localhost/admin/templates");
    expect(res.status).toBe(401);
  });
});

describe("Admin template CRUD", () => {
  beforeEach(async () => { await applySchema(); await clearDatabase(); await seedDatabase(); });

  it("GET /admin/templates returns all templates", async () => {
    const t = await token();
    const res = await app.request("http://localhost/admin/templates", { headers: authHeader(t) });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(Array.isArray(body.templates)).toBe(true);
  });

  it("POST /admin/templates creates a template", async () => {
    const t = await token();
    const res = await app.request("http://localhost/admin/templates", {
      method: "POST",
      headers: { ...authHeader(t), "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Mac Plus", categoryId: 1, manufacturer: "Apple" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.name).toBe("Mac Plus");
  });

  it("PUT /admin/templates/:id updates a template", async () => {
    const t = await token();
    const res = await app.request("http://localhost/admin/templates/1", {
      method: "PUT",
      headers: { ...authHeader(t), "Content-Type": "application/json" },
      body: JSON.stringify({ cpuSpeed: "8 MHz" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.cpuSpeed).toBe("8 MHz");
  });

  it("DELETE /admin/templates/:id removes a template", async () => {
    const t = await token();
    const res = await app.request("http://localhost/admin/templates/1", {
      method: "DELETE",
      headers: authHeader(t),
    });
    expect(res.status).toBe(200);
  });
});

describe("Admin submission management", () => {
  beforeEach(async () => { await applySchema(); await clearDatabase(); await seedDatabase(); });

  it("GET /admin/submissions returns list", async () => {
    const t = await token();
    const res = await app.request("http://localhost/admin/submissions", { headers: authHeader(t) });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(Array.isArray(body.submissions)).toBe(true);
  });

  it("approves a CORRECTION and applies field change to template", async () => {
    const t = await token();

    // Submit a correction
    const subRes = await app.request("http://localhost/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": "7.7.7.7" },
      body: JSON.stringify({ type: "CORRECTION", templateId: 1, payload: { cpuSpeed: "16 MHz" } }),
    });
    const { submissionId } = await subRes.json() as any;

    // Approve it
    const approveRes = await app.request(`http://localhost/admin/submissions/${submissionId}/approve`, {
      method: "PUT",
      headers: authHeader(t),
    });
    expect(approveRes.status).toBe(200);

    // Verify template was updated
    const tmpl = await getTestEnv().DB.prepare("SELECT cpuSpeed FROM Template WHERE id = 1").first<any>();
    expect(tmpl?.cpuSpeed).toBe("16 MHz");
  });

  it("denies a submission with a review note", async () => {
    const t = await token();

    const subRes = await app.request("http://localhost/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": "8.8.8.8" },
      body: JSON.stringify({ type: "CORRECTION", templateId: 1, payload: { name: "Wrong" } }),
    });
    const { submissionId } = await subRes.json() as any;

    const denyRes = await app.request(`http://localhost/admin/submissions/${submissionId}/deny`, {
      method: "PUT",
      headers: { ...authHeader(t), "Content-Type": "application/json" },
      body: JSON.stringify({ reviewNote: "Incorrect data" }),
    });
    expect(denyRes.status).toBe(200);
    const body = await denyRes.json() as any;
    expect(body.status).toBe("DENIED");
    expect(body.reviewNote).toBe("Incorrect data");
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- test/admin.test.ts
```

Expected: FAIL — admin routes not registered.

- [ ] **Step 3: Create worker/src/routes/admin.ts**

```typescript
import { Hono } from "hono";
import type { Env } from "../types";
import { authMiddleware } from "../auth";
import {
  getTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate,
  getSubmissions, getSubmissionById, updateSubmissionStatus, createSubmission,
  getPendingImages, createImage, updateImageStatus,
} from "../db/queries";
import { approvedKey, pendingKey, moveR2Object, deleteR2Object } from "../r2";

const admin = new Hono<{ Bindings: Env }>();
admin.use("*", authMiddleware);

// ── Templates ────────────────────────────────────────────────────────────

admin.get("/templates", async (c) => {
  const { category, search, cursor, limit } = c.req.query();
  const result = await getTemplates(c.env.DB, {
    categoryId: category ? parseInt(category) : undefined,
    search: search || undefined,
    cursor: cursor || undefined,
    limit: limit ? parseInt(limit) : undefined,
  });
  return c.json(result);
});

admin.post("/templates", async (c) => {
  const body = await c.req.json<Record<string, unknown>>();
  if (!body["name"] || !body["categoryId"]) {
    return c.json({ error: "name and categoryId required" }, 400);
  }
  const template = await createTemplate(c.env.DB, body as any);
  return c.json(template, 201);
});

admin.put("/templates/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<Record<string, unknown>>();
  const template = await updateTemplate(c.env.DB, id, body as any);
  if (!template) return c.json({ error: "Not found" }, 404);
  return c.json(template);
});

admin.delete("/templates/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const deleted = await deleteTemplate(c.env.DB, id);
  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ deleted: true });
});

admin.post("/templates/:id/generate-image", async (c) => {
  if (!c.env.OPENAI_API_KEY) return c.json({ error: "OpenAI not configured" }, 503);

  const id = parseInt(c.req.param("id"));
  const { type } = await c.req.json<{ type: "LIGHT" | "DARK" }>();
  if (type !== "LIGHT" && type !== "DARK") return c.json({ error: "type must be LIGHT or DARK" }, 400);

  const template = await getTemplateById(c.env.DB, id, c.env.IMAGES_PUBLIC_BASE_URL);
  if (!template) return c.json({ error: "Not found" }, 404);

  const theme = type === "LIGHT"
    ? "white background, bright studio lighting"
    : "dark background, moody low-key lighting";
  const prompt = `A clean product photograph of an Apple ${template.name}${template.additionalName ? " " + template.additionalName : ""} vintage computer, ${theme}, no text, no logos, museum quality, isolated on plain background`;

  const openaiRes = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${c.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "dall-e-3", prompt, n: 1, size: "1024x1024", response_format: "url" }),
  });
  if (!openaiRes.ok) return c.json({ error: "OpenAI request failed" }, 502);

  const data = await openaiRes.json<{ data: { url: string }[] }>();
  const imageUrl = data.data[0]?.url;
  if (!imageUrl) return c.json({ error: "No image returned" }, 502);

  const imgRes = await fetch(imageUrl);
  const imgBuf = await imgRes.arrayBuffer();
  const r2Key = approvedKey(id, type);
  await c.env.IMAGES.put(r2Key, imgBuf, { httpMetadata: { contentType: "image/png" } });

  const image = await createImage(c.env.DB, { templateId: id, type, r2Key, status: "APPROVED", submittedBy: null });
  return c.json({ url: `${c.env.IMAGES_PUBLIC_BASE_URL}/${r2Key}`, imageId: image.id });
});

// ── Submissions ──────────────────────────────────────────────────────────

admin.get("/submissions", async (c) => {
  const { status, type, cursor, limit } = c.req.query();
  const result = await getSubmissions(c.env.DB, {
    status: status || undefined,
    type: type || undefined,
    cursor: cursor || undefined,
    limit: limit ? parseInt(limit) : undefined,
  });
  return c.json(result);
});

admin.get("/submissions/:id", async (c) => {
  const sub = await getSubmissionById(c.env.DB, parseInt(c.req.param("id")));
  if (!sub) return c.json({ error: "Not found" }, 404);
  return c.json(sub);
});

admin.put("/submissions/:id/approve", async (c) => {
  const id = parseInt(c.req.param("id"));
  const sub = await getSubmissionById(c.env.DB, id);
  if (!sub) return c.json({ error: "Not found" }, 404);

  const payload = JSON.parse(sub.payload) as Record<string, unknown>;

  if (sub.type === "NEW_TEMPLATE") {
    await createTemplate(c.env.DB, payload as any);
  } else if (sub.type === "CORRECTION" && sub.templateId) {
    await updateTemplate(c.env.DB, sub.templateId, payload as any);
  } else if (sub.type === "IMAGE" && sub.templateId) {
    const { r2Key, imageType } = payload as { r2Key: string; imageType: "LIGHT" | "DARK" };
    const destKey = approvedKey(sub.templateId, imageType);
    await moveR2Object(c.env.IMAGES, r2Key, destKey);
    await createImage(c.env.DB, { templateId: sub.templateId, type: imageType, r2Key: destKey, status: "APPROVED", submittedBy: sub.submitterEmail });
  }

  const updated = await updateSubmissionStatus(c.env.DB, id, "APPROVED");
  return c.json(updated);
});

admin.put("/submissions/:id/deny", async (c) => {
  const id = parseInt(c.req.param("id"));
  const sub = await getSubmissionById(c.env.DB, id);
  if (!sub) return c.json({ error: "Not found" }, 404);

  if (sub.type === "IMAGE") {
    const payload = JSON.parse(sub.payload) as { r2Key?: string };
    if (payload.r2Key) await deleteR2Object(c.env.IMAGES, payload.r2Key).catch(() => {});
  }

  const { reviewNote } = await c.req.json<{ reviewNote?: string }>();
  const updated = await updateSubmissionStatus(c.env.DB, id, "DENIED", reviewNote);
  return c.json(updated);
});

// ── Images ───────────────────────────────────────────────────────────────

admin.get("/images/pending", async (c) => {
  const images = await getPendingImages(c.env.DB);
  return c.json(images);
});

admin.put("/images/:id/approve", async (c) => {
  const id = parseInt(c.req.param("id"));
  const image = await updateImageStatus(c.env.DB, id, "APPROVED");
  if (!image) return c.json({ error: "Not found" }, 404);
  const destKey = approvedKey(image.templateId, image.type as "LIGHT" | "DARK");
  await moveR2Object(c.env.IMAGES, image.r2Key, destKey).catch(() => {});
  return c.json(image);
});

admin.put("/images/:id/deny", async (c) => {
  const id = parseInt(c.req.param("id"));
  const image = await updateImageStatus(c.env.DB, id, "DENIED");
  if (!image) return c.json({ error: "Not found" }, 404);
  await deleteR2Object(c.env.IMAGES, image.r2Key).catch(() => {});
  return c.json({ deleted: true });
});

export default admin;
```

- [ ] **Step 4: Update src/index.ts**

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import authRoutes from "./routes/auth";
import pubRoutes from "./routes/public";
import submissionRoutes from "./routes/submissions";
import adminRoutes from "./routes/admin";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({ origin: "*" }));
app.get("/health", (c) => c.json({ ok: true }));
app.route("/auth", authRoutes);
app.route("/submissions", submissionRoutes);
app.route("/admin", adminRoutes);
app.route("/", pubRoutes);

export default app;
```

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/wottle/Documents/Development/TemplatesDifferent
git add worker/src/routes/admin.ts worker/src/index.ts worker/test/admin.test.ts
git commit -m "feat: admin routes — template CRUD, submission approve/deny, image management"
```

---

## Task 9: Seed/Import Script

**Files:**
- Create: `worker/seed/import-from-invdifferent.ts`

**Interfaces:**
- Consumes: `device_templates.sql` from InvDifferent2; Worker API at `WORKER_URL` env var
- Produces: All templates from InvDifferent2 SQL dump imported via `POST /admin/templates`

- [ ] **Step 1: Create worker/seed/import-from-invdifferent.ts**

```typescript
/**
 * One-time import of templates from InvDifferent2's device_templates.sql.
 *
 * Usage (dry run — no HTTP calls):
 *   DRY_RUN=true npx tsx seed/import-from-invdifferent.ts
 *
 * Usage (live against local worker):
 *   WORKER_URL=http://localhost:8787 JWT=<token> npx tsx seed/import-from-invdifferent.ts
 */

import * as fs from "fs";
import * as path from "path";

const INVDIFFERENT_PATH = process.env["INVDIFFERENT_PATH"] ?? "/Users/wottle/Documents/Development/InvDifferent2";
const WORKER_URL = process.env["WORKER_URL"] ?? "http://localhost:8787";
const JWT = process.env["JWT"] ?? "";
const DRY_RUN = process.env["DRY_RUN"] === "true";

function parseCpu(cpu: string): { cpuType: string | null; cpuSpeed: string | null } {
  const idx = cpu.indexOf(" @ ");
  if (idx !== -1) {
    return { cpuType: cpu.slice(0, idx).trim(), cpuSpeed: cpu.slice(idx + 3).trim() };
  }
  return { cpuType: cpu.trim(), cpuSpeed: null };
}

function parseTemplatesFromSQL(sql: string): Record<string, unknown>[] {
  const templates: Record<string, unknown>[] = [];
  // Match each VALUES tuple
  const tupleRegex = /\(([^)]+)\)/g;
  const insertMatch = sql.match(/INSERT INTO `device_templates`[^;]+VALUES([\s\S]+?);/);
  if (!insertMatch?.[1]) return templates;

  let m: RegExpExecArray | null;
  while ((m = tupleRegex.exec(insertMatch[1])) !== null) {
    const parts = m[1]!.split(",").map((v) => {
      const t = v.trim();
      if (t === "NULL") return null;
      if (t.startsWith("'") && t.endsWith("'")) return t.slice(1, -1).replace(/\\'/g, "'");
      return isNaN(Number(t)) ? t : Number(t);
    });

    // Column order from device_templates.sql:
    // 0=id, 1=device_name, 2=cpu, 3=ram, 4=graphics, 5=storage, 6=release_year, 7=estimated_value
    const [, name, cpu, ram, , storage, releaseYear, estimatedValue] = parts;
    const { cpuType, cpuSpeed } = cpu ? parseCpu(String(cpu)) : { cpuType: null, cpuSpeed: null };

    templates.push({
      name: String(name),
      categoryId: 1, // Default — update categories manually after import
      manufacturer: "Apple",
      status: "PUBLISHED",
      cpuType,
      cpuSpeed,
      ram: ram ? String(ram) : null,
      storage: storage ? String(storage) : null,
      releaseYear: releaseYear ? Number(releaseYear) : null,
      estimatedValue: estimatedValue ? Number(estimatedValue) : null,
    });
  }

  return templates;
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no HTTP calls)" : "LIVE"}`);
  if (!DRY_RUN && !JWT) {
    console.error("JWT env var required for live mode. Get a token from POST /auth/login.");
    process.exit(1);
  }

  const sqlPath = path.join(INVDIFFERENT_PATH, "api", "device_templates.sql");
  if (!fs.existsSync(sqlPath)) {
    console.error(`SQL file not found: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, "utf-8");
  const templates = parseTemplatesFromSQL(sql);
  console.log(`Found ${templates.length} templates to import\n`);

  let imported = 0;
  let failed = 0;

  for (const template of templates) {
    if (DRY_RUN) {
      console.log(`[DRY] ${template["name"]}`);
      imported++;
      continue;
    }

    const res = await fetch(`${WORKER_URL}/admin/templates`, {
      method: "POST",
      headers: { Authorization: `Bearer ${JWT}`, "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });

    if (res.ok) {
      console.log(`✓ ${template["name"]}`);
      imported++;
    } else {
      const err = await res.text();
      console.error(`✗ ${template["name"]} — ${res.status}: ${err}`);
      failed++;
    }
  }

  console.log(`\nDone. Imported: ${imported}, Failed: ${failed}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Dry-run test**

```bash
cd /Users/wottle/Documents/Development/TemplatesDifferent/worker
DRY_RUN=true npx tsx seed/import-from-invdifferent.ts
```

Expected: Prints all template names, no errors, "Failed: 0".

- [ ] **Step 3: Commit**

```bash
cd /Users/wottle/Documents/Development/TemplatesDifferent
git add worker/seed/import-from-invdifferent.ts
git commit -m "feat: dry-run import script from InvDifferent2 SQL dump"
```

---

## Task 10: Integration Smoke Test

- [ ] **Step 1: Run the full test suite**

```bash
cd /Users/wottle/Documents/Development/TemplatesDifferent/worker
npm test
```

Expected: All tests pass. Record the test count.

- [ ] **Step 2: Apply schema to local D1 and start dev server**

```bash
npm run db:migrate:local
npx wrangler dev --local
```

- [ ] **Step 3: Smoke test public endpoints**

In a second terminal:

```bash
curl -s http://localhost:8787/health | jq
# Expected: {"ok":true}

curl -s http://localhost:8787/categories | jq 'length'
# Expected: 10 (seeded categories)

curl -s http://localhost:8787/sync | jq
# Expected: {"version":"0"} (no templates yet)
```

- [ ] **Step 4: Smoke test login and admin**

```bash
TOKEN=$(curl -s -X POST http://localhost:8787/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"test-password"}' | jq -r .accessToken)

# Create a template
curl -s -X POST http://localhost:8787/admin/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Macintosh SE","categoryId":1,"manufacturer":"Apple","releaseYear":1987,"status":"PUBLISHED"}' | jq .id

# Fetch it
curl -s http://localhost:8787/templates/1 | jq '.name'
# Expected: "Macintosh SE"
```

- [ ] **Step 5: Smoke test rate limiting**

```bash
for i in {1..6}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8787/submissions \
    -H "Content-Type: application/json" \
    -H "CF-Connecting-IP: 77.77.77.77" \
    -d '{"type":"CORRECTION","templateId":1,"payload":{"name":"x"}}')
  echo "Request $i: $STATUS"
done
```

Expected: Five `201`, then one `429`.

- [ ] **Step 6: Commit final state**

```bash
cd /Users/wottle/Documents/Development/TemplatesDifferent
git add -A
git commit -m "feat: worker API complete — all routes, tests, and smoke tests passing"
```

---

## Self-Review

**Spec coverage:**
- ✅ `GET /categories`, `/templates`, `/templates/:id`, `/sync` — public, cached, with ETags
- ✅ Variant merge (parent fields inherited when child field is NULL)
- ✅ `POST /submissions` + rate limiting (5/IP/hour via KV) + optional Turnstile
- ✅ Image upload to R2 pending prefix via `PUT /submissions/upload/:id`
- ✅ Admin CRUD: templates, submissions (approve/deny with payload application), images
- ✅ OpenAI image generation → R2 public prefix
- ✅ JWT auth (HMAC-SHA256, Workers native), PBKDF2 password hashing
- ✅ Full D1 schema with all fields from spec (gestaltId, codename, ramMax, ports, etc.)
- ✅ Vitest + `@cloudflare/vitest-pool-workers` test suite
- ✅ Seed/import script with dry-run mode
- ✅ CORS on all public endpoints

**Plans 2 and 3** (Admin Console and Public Browser) will be written after this Worker is deployed and tested against the real D1/R2/KV bindings.
