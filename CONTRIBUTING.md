# Contributing to InventoryDifferent

Thanks for your interest in contributing! This is a personal project I've open-sourced, so contributions are welcome but expectations are relaxed — no CI pipeline, no formal review process, just good-faith collaboration.

## Reporting Bugs

Open a [GitHub issue](../../issues/new?template=bug_report.md) with:
- What you were doing and what you expected to happen
- What actually happened (error messages, screenshots)
- Your deployment setup (NAS, VPS, local Docker, etc.) and any relevant env vars

## Suggesting Features

Open a [GitHub issue](../../issues/new?template=feature_request.md) describing the use case. Check the [Feature Ideas section in CLAUDE.md](CLAUDE.md#feature-ideas) first — there's already a backlog of things I'm considering.

## Submitting a Pull Request

1. Fork the repo and create a branch from `main`
2. Make your changes — see [Development Setup](#development-setup) below
3. Test your changes manually (there's no automated test suite currently)
4. Keep the PR focused — one feature or fix per PR makes review much easier
5. Open the PR with a clear description of what changed and why

PRs for bug fixes, dependency updates, documentation improvements, and items from the feature backlog are all welcome.

## Development Setup

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (for the database)
- Xcode 15+ (for iOS changes only)

### Running locally

```bash
# Start the database
docker compose up postgres -d

# API (port 4000)
cd api
npm install
npx prisma generate
npx prisma migrate dev
npm run dev   # or: npm run build && npm start

# Web admin (port 3000) — in a new terminal
cd web
npm install
npm run dev

# Storefront (port 3001) — in a new terminal
cd storefront
npm install
npm run dev

# MCP server (optional)
cd mcp-server
npm install
npx prisma generate
npm run dev
```

Copy `api/.env.example` to `api/.env` and set `DATABASE_URL` before starting the API.

### Building for production

```bash
cd api && npm run build
cd web && npm run build
cd storefront && npm run build
```

### iOS

Open `ios/InventoryDifferent/InventoryDifferent.xcodeproj` in Xcode. You'll need to:
- Set your own Apple Developer Team ID in the project settings
- Update the bundle identifier from `com.yourorg.InventoryDifferent` to your own
- Update `InventoryDifferent.entitlements` with your own domain for Universal Links (or remove those entries if you don't need deep linking)

## Code Style

- TypeScript throughout the API, web, and storefront
- No linter config is enforced, but try to match the style of surrounding code
- Commit messages: short imperative mood, focus on the "why" over the "what"

## License

By contributing, you agree that your contributions will be licensed under the same [CC BY-NC 4.0 license](LICENSE.md) as the rest of the project.
