# Collection Timeline Feature

## Overview

The Collection Timeline plots devices in your collection by their `releaseYear` alongside curated Apple product launches and computing milestones, giving historical context to what you own.

Available at `/timeline` on the web admin and via the Timeline menu item on iOS.

---

## Architecture

### Event Data

Timeline events are stored in the `TimelineEvent` database table and served via GraphQL. This means they can be added or edited without a code deploy — just insert rows directly into the database.

**Schema:**
```sql
TimelineEvent {
  id          SERIAL PRIMARY KEY
  year        INT
  title       TEXT
  description TEXT
  type        TEXT       -- "apple" | "tech" | "cultural"
  sortOrder   INT        -- tie-breaks within the same year
  createdAt   TIMESTAMP
  updatedAt   TIMESTAMP
}
```

**GraphQL query (public, no auth required):**
```graphql
query {
  timelineEvents {
    id year title description type sortOrder
  }
}
```

### Adding / Editing Events

**Via the database directly (recommended for now):**
```sql
INSERT INTO "TimelineEvent" (year, title, description, type, "sortOrder", "updatedAt")
VALUES (1984, 'My New Event', 'Description here.', 'apple', 0, NOW());
```

**Via seed (re-run `npm run prisma:seed`):**
The seed script skips events that already have a matching `title`, so re-running is safe.

### Event Types & Colors

| type | Web color | iOS color |
|---|---|---|
| `apple` | `bg-blue-500` | `.blue` |
| `tech` | `bg-orange-500` | `.orange` |
| `cultural` | `bg-purple-500` | `.purple` |

---

## Web Implementation

- **Page**: `web/src/app/timeline/page.tsx` — `"use client"`, `useQuery` fetching both `devices` and `timelineEvents` in one query. Auth-gated via Apollo (returns error if unauthenticated).
- **Component**: `web/src/components/TimelineView.tsx` — pure Tailwind, no chart library. Three-column grid: devices on the left, year badge center, events on the right.
- **Menu**: Hamburger → Timeline (between Stats and Usage), auth-gated.

---

## iOS Implementation

- **Model**: `Models/TimelineEvent.swift` — `Codable`, `TimelineEventType` enum with `.color` computed property.
- **Service**: `Services/TimelineService.swift` — fetches `timelineEvents` from GraphQL via `APIService`.
- **View**: `Views/TimelineView.swift` — three-state (loading/error/content). Uses `DeviceStore` (already loaded) for devices; fetches events on appear. `LazyVStack` with sticky year section headers.
- **Menu**: Timeline button (teal, `clock.arrow.circlepath`) in the auth-gated menu section between Stats and Chat.

---

## Migration

Migration file: `api/prisma/migrations/20260308000000_add_timeline_events/migration.sql`

Apply on a running database:
```bash
cd api && npx prisma migrate deploy
```

Or via Docker:
```bash
docker exec inventory2-api npx prisma migrate deploy
```

---

## Seed

55 events from 1975–2024 are seeded on first run. Re-running the seed is safe (skips existing titles):
```bash
cd api && npm run prisma:seed
```
