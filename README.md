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

**iOS app:** device list with search/filter/sort, detail view, image management, add/edit device, financials, stats, AI chat with voice input/output and hands-free conversation mode, barcode scanner, value history chart.

---

## Docker Images

Pre-built multi-architecture images (amd64 + arm64) are published to Docker Hub:

```
wottle/inventory-api:latest
wottle/inventory-web:latest
wottle/inventory-storefront:latest (optional — only is wanting a shop website)
wottle/inventory-mcp:latest        (optional — AI assistant integration only)
```

Database migrations run automatically on every container start — no manual migration step needed when updating.

Additionally, an example implementation of a umami server in docker-compose to capture usage analytics.

---

## Deployment

### Option 1 — Simple (direct ports, no reverse proxy)

Best for: local network, homelab without Traefik, quick evaluation.

```bash
# 1. Grab files
curl -O https://raw.githubusercontent.com/wottle/InventoryDifferent2/refs/heads/main/docker-compose.simple.yml
curl -O https://raw.githubusercontent.com/wottle/InventoryDifferent2/refs/heads/main/.env.example

# 2. Create an uploads directory for device images
mkdir -p ./uploads

# 3. Configure environment
cp .env.example .env
# Edit .env — at minimum set POSTGRES_PASSWORD and AUTH_PASSWORD
nano .env

# 4. Start
docker compose -f docker-compose.simple.yml up -d
```

Services will be available at:
- Web: `http://your-host:3000`
- Storefront: `http://your-host:3001`
- API: `http://your-host:4000/graphql`

> **iOS / remote access:** The web app resolves the API URL from the browser's origin automatically. For the iOS app — or any client on a different device — set `AUTH_URL` in your `.env` or configure the server URL directly in the iOS app settings.

> **MCP server:** If you plan to connect your collection up to an AI agent, you should uncomment the mcp service in the docker-compose file. The MCP server is available at `http://your-host:3002/mcp` and can be used with AI assistants that support MCP servers. You'll also need to set the `MCP_TOKEN` environment variable in your `.env` file.

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

**Traefik version:** `docker-compose.prod.yml` uses Traefik v1.7 label syntax (`traefik.frontend.rule`, `traefik.port`). If you're running Traefik v2+, you'll need to update the labels to use the v2 router/service/middleware syntax.

**Traefik network name:** The compose file uses an external network named `web`. If your Traefik uses a different name, update the `networks` section in `docker-compose.prod.yml`.

Example Traefik v1.7 static config (if you need to set one up):
```yaml
defaultEntryPoints:
  - http
  - https

entryPoints:
  http:
    address: ":80"
    redirect:
      entryPoint: https
  https:
    address: ":443"
    tls: {}

acme:
  email: your-email@example.com
  storage: /letsencrypt/acme.json
  entryPoint: https
  httpChallenge:
    entryPoint: http
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
| `AUTH_USERNAME` | If set, login requires both username and password (default: password only) |
| `AUTH_PASSWORD` | Admin login password for the web app and iOS app (to make changes) |
| `UPLOADS_PATH` | `./uploads` | Host path where device images are stored. Use an absolute path in production. |

### Recommended

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | *(auto-generated)* | Secret for signing auth tokens. Set explicitly so sessions survive restarts. Minimum 32 characters. |
| `POSTGRES_USER` | `inventory` | PostgreSQL username |
| `POSTGRES_DB` | `inventory` | PostgreSQL database name |

### Optional Features

| Variable | Description |
|----------|-------------|
| `LANGUAGE` | Language for the web app and storefront (default: `en`, supported: `de`, `fr`) |
| `OPENAI_API_KEY` | Enables AI product image generation|
| `ANTHROPIC_API_KEY` | Enables the AI chat assistant |
| `MCP_TOKEN` | Optional token for the MCP server (token required for auth MCP server from AI agent) |
| `CONTACT_EMAIL` | Email shown on the storefront contact button (default: `store@example.com`) |

### Traefik / Domain (prod deployment only)

| Variable | Default | Description |
|----------|---------|-------------|
| `DOMAIN` | — | Domain for the admin web app (e.g., `inventory.example.com`) |
| `SHOP_DOMAIN` | — | Domain for the public storefront (e.g., `shop.example.com`) |

### Analytics (optional)

Set these directly on the web or storefront containers in Portainer (not in `.env`):

| Variable | Description |
|----------|-------------|
| `UMAMI_URL` | URL of your Umami analytics instance |
| `UMAMI_WEBSITE_ID` | Website ID from your Umami dashboard (for web app) |
| `UMAMI_STOREFRONT_WEBSITE_ID` | Website ID from your Umami dashboard (for storefront) |

---

## Language Support

The application supports **English**, **German (Deutsch)**, and **French (Français)** across all platforms.

### Web App

The web app automatically detects your browser's language preference. To change the language:

1. Set your browser's preferred language to English (`en`), German (`de`), or French (`fr`)
2. Refresh the page

**How to change browser language:**
- **Chrome/Edge**: Settings → Languages → Add/reorder languages
- **Firefox**: Settings → Language → Choose your preferred language  
- **Safari**: System Preferences → Language & Region → Preferred Languages

### iOS App

Change the language in iOS Settings:

1. Open **Settings** app on your device
2. Scroll down to **InventoryDifferent**
3. Tap **Language**
4. Select **System Default**, **English**, **Deutsch**, or **Français**

The app will switch languages immediately without needing to restart.

---

## Device Status Lifecycle

Each device moves through a defined set of statuses. The web and iOS apps provide lifecycle shortcut buttons to transition between statuses without manually editing the device.

### Statuses

| Status | Meaning |
|--------|---------|
| **In Collection** | Default state — device is part of your collection |
| **For Sale** | Listed for sale (list price recorded) |
| **Pending Sale** | Sale agreed but not yet completed |
| **Sold** | Sale complete (sale date and price recorded) |
| **Donated** | Given away (donation date recorded) |
| **In Repair** | Sent out or in active repair |
| **Repaired** | Repair complete — awaiting pickup/return to owner |
| **Returned** | Repair returned to owner (return date and optional fee recorded) |

### Lifecycle Flows

```
In Collection → For Sale → Pending Sale → Sold
                        ↘
                          Sold
                        
In Collection → For Sale ← Pending Sale

In Repair → Repaired → Returned
         ← Repaired ← (back if repair incomplete)
```

**Sale flow:** `In Collection` → `For Sale` → `Pending Sale` → `Sold`  
*(Pending Sale can also step back to For Sale, or jump directly to Sold)*

**Repair flow:** `In Repair` → `Repaired` → `Returned`  
*(Repaired can step back to In Repair if the device needs more work)*

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

**Read tools:**

| Tool | Description |
|---|---|
| `list_all_devices` | Compact dump of every device — use for whole-collection reasoning |
| `search_devices` | Filtered search by text, status, category, manufacturer, tags |
| `get_device_details` | Full details for one device (notes, tasks, images) |
| `list_devices` | All devices with flexible field selection |
| `get_financial_summary` | Total spent, received, net position, profit |

**Write tools:**

| Tool | Description |
|---|---|
| `update_device` | Update any device fields (status, value, location, specs, flags, etc.) by ID |
| `add_note` | Append a timestamped note to a device |
| `add_maintenance_task` | Log a completed maintenance task (label, date, notes, optional cost) |

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
