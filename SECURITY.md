# Security Policy

## Supported Versions

This is a personal/hobby project with a single active branch. Security fixes are applied to the latest version only.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, email **mike@wottle.com** with:
- A description of the vulnerability
- Steps to reproduce it
- The potential impact
- Any suggested fix (optional but appreciated)

I'll acknowledge receipt within a few days and aim to release a fix promptly for anything serious.

## Security Notes for Deployers

A few things worth knowing when running this yourself:

**Authentication is optional but strongly recommended.** If you set `AUTH_PASSWORD` in your environment, the admin dashboard and all mutations require a valid JWT. Without it, the API is fully open — fine for a trusted local network, not for public internet.

**The storefront is always public by design.** Financial data, notes, and acquisition info are excluded from unauthenticated API responses, but device names, specs, and images are visible.

**Secrets belong in environment variables, not in the repo.** Never commit `.env`, `nas.env`, or any file containing real credentials. The `.gitignore` covers these by default.

**The `JWT_SECRET` should be set explicitly.** If you don't set it, one is auto-generated at startup — meaning sessions are invalidated on every restart. Set a stable random value with `openssl rand -hex 32`.

**HTTPS is strongly recommended for any internet-facing deployment.** The provided Traefik configuration handles this automatically with Let's Encrypt.
