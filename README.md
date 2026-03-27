# InventoryDifferent

A self-hosted inventory management system for vintage computer collections. Track acquisition, repair history, sale, and value across a web admin dashboard, public storefront, iOS app, and AI assistant integration.

![License](https://img.shields.io/badge/license-CC%20BY--NC%204.0-lightgrey)

---

## Quick Start

The fastest way to get running is with the pre-built Docker images and a `docker-compose.prod.yml`.

**Prerequisites:** Docker, Docker Compose, and a domain with DNS pointed at your server (Traefik handles HTTPS automatically).

```bash
# 1. Grab the compose file and env template
curl -O https://raw.githubusercontent.com/wottle/InventoryDifferent2/main/docker-compose.prod.yml
curl -O https://raw.githubusercontent.com/wottle/InventoryDifferent2/main/.env.example

# 2. Configure your environment
cp .env.example .env
nano .env   # set DOMAIN, SHOP_DOMAIN, passwords, OPENAI_API_KEY

# 3. Create the uploads directory
mkdir -p /path/to/uploads

# 4. Start everything
docker compose -f docker-compose.prod.yml up -d
```

The admin dashboard will be at `https://DOMAIN` and the public storefront at `https://SHOP_DOMAIN`.

See [DEPLOYMENT.md](DEPLOYMENT.md) for full instructions including Traefik setup, iOS app deployment, and Portainer.

---

## What's Included

| Service | Description | Default Port |
|---|---|---|
| `api/` | GraphQL API (Express + Apollo + Prisma + PostgreSQL) | 4000 |
| `web/` | Admin dashboard (Next.js 14) | 3000 |
| `storefront/` | Public shop frontend (Next.js 14) | 3001 |
| `mcp-server/` | MCP server for AI assistant integrations | stdio |
| `ios/` | Native iOS app (SwiftUI) | — |

**Admin dashboard features:** card/table views, search and multi-filter, financial tracking (spent / received / profit / estimated value), image management with thumbnails, notes, maintenance tasks, tags, custom fields, bulk ZIP import/export, AI chat assistant, barcode/QR scanning, wishlist, stats charts, timeline, print view, and trash with restore.

**Storefront features:** public product grid for items listed for sale, search, filter by status/category, item detail with specs and condition, "Looking For" page from your wishlist.

**iOS app features:** device list with search/filter/sort, detail view with tabbed layout, image management, add/edit device, financials, stats, AI chat, barcode scanner, and value history chart.

---

## Connecting an AI Agent via MCP

The `mcp-server/` directory is a [Model Context Protocol](https://modelcontextprotocol.io) server that exposes your inventory to any MCP-compatible AI agent — Claude, Cursor, etc.

The server communicates over **stdio** (not HTTP), so agents launch it as a subprocess.

### Available Tools

| Tool | Description |
|---|---|
| `list_all_devices` | Compact dump of every device — use for whole-collection reasoning ("what fills gaps?", "best Mac OS 8 machine?") |
| `search_devices` | Filtered search by text, status, category, manufacturer, tags |
| `get_device_details` | Full details for one device (notes, tasks, images) |
| `list_devices` | All devices with flexible field selection |
| `get_financial_summary` | Total spent, received, net position, profit |

### Option A — Docker exec into the running container (recommended for NAS deployments)

If the MCP container is already running (e.g., on your NAS), point your agent at it with `docker exec`:

**Claude / Claude Code** — add to your project's `.mcp.json` or `~/.claude.json`:

```json
{
  "mcpServers": {
    "inventory": {
      "command": "docker",
      "args": ["exec", "-i", "invdifferent2-mcp", "node", "dist/index.js"]
    }
  }
}
```

The container name `invdifferent2-mcp` matches the `container_name` in `docker-compose.prod.yml`. The `DATABASE_URL` is already set inside the container, so no extra env vars are needed.

> **Remote server:** If Docker is on a remote machine, prefix with `ssh`: `"command": "ssh"`, `"args": ["user@yourserver", "docker", "exec", "-i", "invdifferent2-mcp", "node", "dist/index.js"]`

### Option B — Run the MCP server locally against your database

For local development where the database is accessible directly:

```bash
cd mcp-server
npm install
npx prisma generate
npm run build
```

Then configure your agent:

```json
{
  "mcpServers": {
    "inventory": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://postgres:password@localhost:5432/inventory"
      }
    }
  }
}
```

### Option C — Docker image directly

Run the published image as a one-shot subprocess, connected to your database:

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

In Claude Code, run `/mcp` — you should see `inventory` listed with its 5 tools. Then try:

> "List all my computers" — should return all devices including any IN_REPAIR or RETURNED ones.
