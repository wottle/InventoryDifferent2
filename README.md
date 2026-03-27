# InventoryDifferent

A self-hosted inventory management system for vintage computer collections. Track acquisition, repair history, sale, and value across a web admin dashboard, public storefront, iOS app, and AI assistant integration.

![License](https://img.shields.io/badge/license-CC%20BY--NC%204.0-lightgrey)

---

## What's Included

| Service | Description | Default Port |
|---|---|---|
| `api/` | GraphQL API (Express + Apollo + Prisma + PostgreSQL) | 4000 |
| `web/` | Admin dashboard (Next.js 14) | 3000 |
| `storefront/` | Public shop frontend (Next.js 14) | 3001 |
| `mcp-server/` | MCP server for AI assistant integrations | stdio |
| `ios/` | Native iOS app (SwiftUI) | — |

**Admin dashboard:** card/table views, search and multi-filter, financial tracking, image management, notes, maintenance tasks, tags, custom fields, accessories checklist, reference links, bulk ZIP import/export, AI chat assistant, barcode/QR scanning, wishlist, stats charts, timeline, print view, trash with restore.

**Storefront:** public product grid for items listed for sale, search, filter by status/category, item detail with specs and condition, "Looking For" page from your wishlist.

**iOS app:** device list with search/filter/sort, detail view, image management, add/edit device, financials, stats, AI chat, barcode scanner, value history chart.

---

## Docker Images

Pre-built multi-architecture images (amd64 + arm64) are published to Docker Hub:

```
wottle/inventory-api:latest
wottle/inventory-web:latest
wottle/inventory-storefront:latest
wottle/inventory-mcp:latest        (optional — AI assistant integration only)
```

Database migrations run automatically on every container start — no manual migration step needed when updating.

---

## Deployment

### Option 1 — Simple (direct ports, no reverse proxy)

Best for: local network, homelab without Traefik, quick evaluation.

```bash
# 1. Create an uploads directory for device images
mkdir -p ./uploads

# 2. Configure environment
cp .env.example .env
# Edit .env — at minimum set POSTGRES_PASSWORD and AUTH_PASSWORD

# 3. Start
docker compose -f docker-compose.simple.yml up -d
```

Services will be available at:
- Admin: `http://your-host:3000`
- Storefront: `http://your-host:3001`
- API: `http://your-host:4000/graphql`

> **iOS / remote access:** The web app resolves the API URL from the browser's origin automatically. For the iOS app — or any client on a different device — set `AUTH_URL` in your `.env` or configure the server URL directly in the iOS app settings.

> **Asset tagging note:** If you use the QR code asset tagging feature, the generated codes embed your server's URL. A local IP address (`192.168.x.x`) or a hostname that may change will cause those QR codes to stop working when scanned from a device that isn't on your home network, or after your IP changes. If you plan to use asset tagging, Option 2 (a persistent public domain) is strongly recommended so your QR codes remain valid long-term.

---

### Option 2 — Traefik with HTTPS (recommended for internet-facing installs)

Best for: NAS, VPS, or home server with a public domain and Traefik already running.

**Prerequisites:**
- Traefik running with an external Docker network (default name: `web`)
- DNS A records pointing your domains to your server
- A certificate resolver in Traefik (e.g., Let's Encrypt)

```bash
# 1. Grab files
curl -O https://raw.githubusercontent.com/wottle/InventoryDifferent2/main/docker-compose.prod.yml
curl -O https://raw.githubusercontent.com/wottle/InventoryDifferent2/main/.env.example

# 2. Configure
cp .env.example .env
nano .env

# 3. Create uploads directory (use absolute path)
mkdir -p /data/inventory/uploads

# 4. Deploy
docker compose -f docker-compose.prod.yml up -d
```

The compose file routes traffic so:
- `DOMAIN` → admin web app, and API paths (`/graphql`, `/upload`, `/uploads`, `/import`, `/export`, `/auth`, `/generate-image`)
- `SHOP_DOMAIN` → public storefront

**Traefik network name:** The compose file uses an external network named `web`. If your Traefik uses a different name, update the `networks` section in `docker-compose.prod.yml`.

Example Traefik static config (if you need to set one up):
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

---

### Option 3 — Portainer Stack

1. Go to **Portainer → Stacks → Add Stack**
2. Name the stack `inventory`
3. Paste the contents of `docker-compose.simple.yml` (or `docker-compose.prod.yml` for Traefik)
4. Add your environment variables in the "Environment variables" section (see below)
5. Deploy

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `AUTH_PASSWORD` | Admin login password for the web app and iOS app |

### Recommended

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | *(auto-generated)* | Secret for signing auth tokens. Set explicitly so sessions survive restarts. Minimum 32 characters. |
| `POSTGRES_USER` | `inventory` | PostgreSQL username |
| `POSTGRES_DB` | `inventory` | PostgreSQL database name |

### Optional Features

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Enables AI product image generation and the AI chat assistant |
| `AUTH_USERNAME` | If set, login requires both username and password (default: password only) |
| `CONTACT_EMAIL` | Email shown on the storefront contact button (default: `store@example.com`) |

### Storage

| Variable | Default | Description |
|----------|---------|-------------|
| `UPLOADS_PATH` | `./uploads` | Host path where device images are stored. Use an absolute path in production. |

### Traefik / Domain (prod deployment only)

| Variable | Default | Description |
|----------|---------|-------------|
| `DOMAIN` | — | Domain for the admin web app (e.g., `inventory.example.com`) |
| `SHOP_DOMAIN` | — | Domain for the public storefront (e.g., `shop.example.com`) |
| `CERT_RESOLVER` | `letsencrypt` | Traefik certificate resolver name |

### Analytics (optional)

Set these directly on the web or storefront containers in Portainer (not in `.env`):

| Variable | Description |
|----------|-------------|
| `UMAMI_URL` | URL of your Umami analytics instance |
| `UMAMI_WEBSITE_ID` | Website ID from your Umami dashboard |

---

## iOS App

The iOS app connects to your self-hosted API. No App Store account needed for local/TestFlight distribution.

### Build from Source

1. Open `ios/InventoryDifferent/InventoryDifferent.xcodeproj` in Xcode
2. Build and run (⌘R) on a simulator or device
3. On first launch, enter your server URL (e.g., `https://inventory.yourdomain.com` or `http://192.168.1.x:4000`) and your `AUTH_PASSWORD`

**Requirements:** macOS with Xcode 15+, iOS 17+ device or simulator.

### TestFlight Distribution

1. **Archive:** Product → Archive in Xcode
2. **Upload:** Organizer → Distribute App → App Store Connect
3. **TestFlight:** Add the build in App Store Connect and invite testers

---

## Updating

```bash
# Pull new images and restart
docker compose -f docker-compose.simple.yml pull
docker compose -f docker-compose.simple.yml up -d

# (or docker-compose.prod.yml for Traefik deployments)
```

Migrations run automatically on startup — your data is preserved.

---

## Backup

### Database

```bash
docker exec inventory-db pg_dump -U inventory inventory > backup_$(date +%Y%m%d).sql
```

### Images

Back up the directory at `UPLOADS_PATH` alongside your database dump.

### Restore

```bash
docker exec -i inventory-db psql -U inventory inventory < backup.sql
# Then restore the uploads directory to UPLOADS_PATH
```

---

## Connecting an AI Agent via MCP

The `mcp-server/` is a [Model Context Protocol](https://modelcontextprotocol.io) server that exposes your inventory to any MCP-compatible AI agent — Claude, Cursor, etc.

The server communicates over **stdio** (not HTTP), so agents launch it as a subprocess.

### Available Tools

| Tool | Description |
|---|---|
| `list_all_devices` | Compact dump of every device — use for whole-collection reasoning |
| `search_devices` | Filtered search by text, status, category, manufacturer, tags |
| `get_device_details` | Full details for one device (notes, tasks, images) |
| `list_devices` | All devices with flexible field selection |
| `get_financial_summary` | Total spent, received, net position, profit |

### Option A — Docker exec into the running container (recommended for NAS deployments)

If the MCP container is already running, point your agent at it with `docker exec`:

**Claude / Claude Code** — add to your project's `.mcp.json` or `~/.claude.json`:

```json
{
  "mcpServers": {
    "inventory": {
      "command": "docker",
      "args": ["exec", "-i", "inventory-mcp", "node", "dist/index.js"]
    }
  }
}
```

The `DATABASE_URL` is already set inside the container, so no extra env vars are needed.

> **Remote server:** If Docker is on a remote machine, prefix with SSH:
> `"command": "ssh"`, `"args": ["user@yourserver", "docker", "exec", "-i", "inventory-mcp", "node", "dist/index.js"]`

### Option B — Run locally against your database

```bash
cd mcp-server
npm install
npx prisma generate
npm run build
```

```json
{
  "mcpServers": {
    "inventory": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://inventory:password@localhost:5432/inventory"
      }
    }
  }
}
```

### Option C — Docker image directly

```json
{
  "mcpServers": {
    "inventory": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "DATABASE_URL=postgresql://user:pass@your-db-host:5432/inventory",
        "wottle/inventory-mcp:latest"
      ]
    }
  }
}
```

### Verifying the connection

In Claude Code, run `/mcp` — you should see `inventory` listed with its tools. Then try:

> "List all my computers" — should return all devices in your collection.

---

## Troubleshooting

**Admin web shows "API unavailable"**
Check API container logs: `docker logs inventory-api`. Verify `API_URL` is reachable from inside the web container.

**Can't log in**
Confirm `AUTH_PASSWORD` is set. If `AUTH_USERNAME` is set, both fields are required at login.

**Images not showing**
Check `UPLOADS_PATH` points to a writable directory and the volume mount is correct.

**Traefik not routing**
- Confirm the external network exists: `docker network ls | grep web`
- Check Traefik sees the containers: `docker logs traefik`
- Verify DNS is pointing to the right IP
