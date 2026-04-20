# Deployment Guide

This guide covers deploying the Vintage Inventory Management System across multiple platforms.

## System Overview

The system consists of five main components:

1. **Admin Web App** - Next.js application for inventory management with AI chat assistant
2. **Public Storefront** - Next.js application for public-facing shop
3. **GraphQL API** - Express/Node.js backend with Prisma ORM
4. **MCP Server** - Model Context Protocol server providing AI tools for inventory queries
5. **iOS App** - Native SwiftUI application for mobile inventory management

## Prerequisites

### For NAS/Server Deployment
- Docker and Docker Compose installed on your NAS
- Traefik running with a network (default: `traefik`)
- DNS configured to point your subdomains to your NAS
- Portainer (optional, for easier management)

### For iOS App
- Xcode 15+ on macOS
- Apple Developer account (for TestFlight or App Store deployment)
- iOS 17+ device or simulator

## Quick Start

### 1. Clone the project

```bash
git clone <your-repo> inventory
cd inventory
```

### 2. Create environment file

```bash
cp .env.example .env
nano .env
```

Configure the following:

```env
# Admin web app domain (must match DNS)
DOMAIN=inventory.yourdomain.com

# Public storefront domain (must match DNS)
SHOP_DOMAIN=shop.yourdomain.com

# Database credentials (change the password!)
POSTGRES_USER=inventory
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=inventory

# Traefik network name (check your Traefik config)
TRAEFIK_NETWORK=traefik

# Path for uploaded images (use absolute path on host)
UPLOADS_PATH=/path/to/inventory/uploads

# OpenAI API Key for chat assistant (required for AI features)
OPENAI_API_KEY=sk-proj-your-key-here
```

### 3. Create uploads directory

```bash
mkdir -p /path/to/inventory/uploads
chmod 755 /path/to/inventory/uploads
```

### 4. Deploy with Docker Compose

```bash
docker compose -f docker-compose.build.yml up -d --build
```

Or deploy via Portainer by creating a new stack and pasting the contents of `docker-compose.build.yml`.

## Traefik Configuration

The production compose file includes Traefik labels that:

- **Admin App** (`DOMAIN`): Routes all requests except API paths to the Next.js admin web app
- **API** (`DOMAIN`): Routes `/graphql`, `/upload`, `/uploads`, `/import`, `/export` to the Express API
- **Storefront** (`SHOP_DOMAIN`): Routes all requests to the public-facing storefront on a separate subdomain
- Enable HTTPS with automatic certificate management via Let's Encrypt
- Set up CORS headers for API access

### Required Traefik Setup

Make sure your Traefik has:

1. **An entrypoint named `websecure`** (typically port 443)
2. **A certificate resolver** (e.g., `letsencrypt`)
3. **An external network** that containers can join

Example Traefik static config snippet:
```yaml
entryPoints:
  web:
    address: ":80"
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: your-email@example.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
```

## Updating

To update the application:

```bash
cd /path/to/inventory
git pull
docker compose -f docker-compose.build.yml up -d --build
```

## Backup

### Database
```bash
docker exec inventory-db pg_dump -U inventory inventory > backup.sql
```

### Images
The uploads are stored at `UPLOADS_PATH`. Include this in your NAS backup routine.

## Troubleshooting

### Check container logs
```bash
docker logs inventory-api
docker logs inventory-web
docker logs inventory-db
```

### Verify Traefik routing
```bash
# Check if Traefik sees the containers
docker exec traefik traefik healthcheck
```

### Database connection issues
Ensure the database is healthy before the API starts:
```bash
docker compose -f docker-compose.build.yml ps
```

### CORS issues
If you see CORS errors in the browser console, verify:
1. The `DOMAIN` in `.env` matches your actual domain
2. Traefik CORS middleware is applied correctly

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Admin Web   │  │  Storefront  │  │   iOS App    │      │
│  │  (Browser)   │  │  (Browser)   │  │  (SwiftUI)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │                  │                  │
          ▼                  ▼                  │
    ┌─────────────┐    ┌─────────────┐         │
    │   Traefik   │    │   Traefik   │         │
    │ (inventory  │    │   (shop     │         │
    │  .domain)   │    │  .domain)   │         │
    └──────┬──────┘    └──────┬──────┘         │
           │                  │                 │
           │                  │                 │
    ┌──────┴──────┬───────────┴─────────────────┘
    │             │                   │
    ▼             ▼                   ▼
┌─────────┐  ┌─────────┐      ┌─────────────┐
│inventory│  │inventory│      │  inventory  │
│  -web   │  │storefront      │    -api     │
│(Next.js)│  │(Next.js)│      │  (Express)  │
└─────────┘  └─────────┘      └──────┬──────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │  inventory  │
                              │    -db      │
                              │ (Postgres)  │
                              └──────┬──────┘
                                     │
                              ┌──────┴──────┐
                              │             │
                              ▼             ▼
                        ┌──────────┐  ┌──────────┐
                        │ /uploads │  │Templates │
                        │ (volume) │  │  (seed)  │
                        └──────────┘  └──────────┘
```

### Component Details

- **Admin Web**: Full-featured inventory management interface with AI chat assistant
- **Storefront**: Public-facing shop for listing items for sale
- **iOS App**: Native mobile app for on-the-go inventory management
- **API**: GraphQL API serving all clients with Prisma ORM
- **MCP Server**: Provides AI tools for searching devices, getting details, and financial summaries
- **Database**: PostgreSQL with device templates and categories
- **Uploads**: Shared volume for device images

### AI Chat Assistant

The admin web app includes an AI-powered chat assistant that can:
- Search your inventory by various criteria
- Provide detailed information about specific devices
- Generate financial summaries and reports
- Answer questions about your vintage computer collection

The chat uses OpenAI's GPT-5-4 model and requires an `OPENAI_API_KEY` to function.

## iOS App Deployment

The iOS app is located in `/ios/InventoryDifferent/` and is built with SwiftUI.

### Development

1. Open the project in Xcode:
   ```bash
   cd ios/InventoryDifferent
   open InventoryDifferent.xcodeproj
   ```

2. Configure API endpoint in `APIService.swift`:
   ```swift
   private let baseURL = "https://inventory.yourdomain.com"
   ```

3. Select a simulator or connected device
4. Build and run (⌘R)

### TestFlight Distribution

1. **Archive the app**: Product → Archive in Xcode
2. **Upload to App Store Connect**: 
   - Select the archive in Organizer
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow the prompts to upload
3. **Configure in App Store Connect**:
   - Add build to TestFlight
   - Add internal/external testers
   - Submit for review (external testing only)

### App Store Release

1. Complete TestFlight testing
2. In App Store Connect:
   - Create a new version
   - Add screenshots, description, keywords
   - Select the build from TestFlight
   - Submit for review
3. Once approved, release to App Store

### Configuration

The iOS app requires:
- **API URL**: Set in `APIService.swift`
- **iOS 17+**: Minimum deployment target
- **Capabilities**: None required (no push notifications, etc.)

## Portainer Deployment

1. Go to Portainer → Stacks → Add Stack
2. Name: `inventory`
3. Build method: Upload or paste `docker-compose.prod.yml` (pre-built images + Traefik) or `docker-compose.build.yml` (build from source)
4. Add environment variables from `.env`
5. Deploy the stack

## DNS Configuration

You'll need to configure DNS records for both domains:

```
A    inventory.yourdomain.com    →  Your server IP
A    shop.yourdomain.com         →  Your server IP
```

Or use CNAME records if pointing to a dynamic DNS hostname.
