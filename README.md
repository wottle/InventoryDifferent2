# InventoryDifferent

A vintage computer collection inventory management system. Tracks acquisition, repair, sale, and history of vintage computers, peripherals, and accessories.

## Components

| Service | Description | Default Port |
|---|---|---|
| `api/` | GraphQL API (Express + Apollo + Prisma + PostgreSQL) | 4000 |
| `web/` | Admin dashboard (Next.js 14) | 3000 |
| `storefront/` | Public shop frontend (Next.js 14) | 3001 |
| `mcp-server/` | MCP server for AI assistant integrations | stdio |
| `ios/` | Native iOS app (SwiftUI) | — |

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment instructions.

---

## Connecting an AI Agent via MCP

The `mcp-server/` directory is a [Model Context Protocol](https://modelcontextprotocol.io) server that exposes your inventory to any MCP-compatible AI agent — Claude Code, Claude Desktop, Cursor, etc.

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

**Claude Code** — add to your project's `.mcp.json` or `~/.claude.json`:

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

The container name `invdifferent2-mcp` matches the `container_name` in `docker-compose.nas.yml`. The `DATABASE_URL` is already set inside the container, so no extra env vars are needed.

> **Remote NAS:** If Docker is on a remote machine, prefix with `ssh`: `"command": "ssh"`, `"args": ["user@nas", "docker", "exec", "-i", "invdifferent2-mcp", "node", "dist/index.js"]`

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

Or run with `tsx` during development (no build step):

```json
{
  "mcpServers": {
    "inventory": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/mcp-server/src/index.ts"],
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

### Claude Code project config (`.mcp.json`)

To share the MCP config with everyone who clones this repo, add a `.mcp.json` at the project root. Claude Code picks it up automatically:

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

### Verifying the connection

In Claude Code, run:

```
/mcp
```

You should see `inventory` listed with its 5 tools. Then try:

> "List all my computers" — should return all devices including any IN_REPAIR or RETURNED ones.
