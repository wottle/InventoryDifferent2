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
- Status: AVAILABLE | FOR_SALE | PENDING_SALE | SOLD | DONATED
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
