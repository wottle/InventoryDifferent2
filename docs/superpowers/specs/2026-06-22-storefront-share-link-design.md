# Storefront Share Link — Design

**Date:** 2026-06-22
**Status:** Approved

## Goal

When a user opens the share sheet for a device (iOS or web), add the ability to
share the device's **storefront URL** in addition to the existing admin link.

The storefront link is shown only when **both** conditions hold:

1. The device status is one of `FOR_SALE`, `PENDING_SALE`, or `SOLD`.
2. `SHOP_DOMAIN` is configured on the deployment.

If `SHOP_DOMAIN` is not set, or the device is in any other status (e.g.
`COLLECTION`, `IN_REPAIR`, `DONATED`, `RETURNED`), the storefront link does not
appear. The admin link is always shown.

Both links are displayed side by side, each clearly labeled (**Admin link** /
**Storefront link**), each independently copyable/shareable.

## Storefront URL format

Storefront device pages are served at `/item/{id}`. `SHOP_DOMAIN` is stored as a
bare hostname (e.g. `shop.example.com`). The storefront URL is therefore:

```
https://{SHOP_DOMAIN}/item/{id}
```

## Eligibility rule (shared concept across platforms)

```
showStorefrontLink = shopDomain is non-empty
                     AND status ∈ { FOR_SALE, PENDING_SALE, SOLD }
```

## Architecture

### 1. API — single source of truth

`SHOP_DOMAIN` already exists as an environment variable on the **API** container
(used today for CORS allow-listing). Rather than plumbing the value into the web
and iOS clients separately, expose it from the API via a small public GraphQL
query that both clients already have transport for:

```graphql
type PublicConfig {
  shopDomain: String
}

# Query
publicConfig: PublicConfig!
```

- Resolver returns `process.env.SHOP_DOMAIN || null`.
- The query is **public** (no auth required). The value is a non-sensitive public
  hostname, and keeping it unauthenticated keeps both the authenticated web admin
  and the iOS app simple.
- This avoids adding a `SHOP_DOMAIN` env var to the web container.

Files:
- `api/src/typeDefs.ts` — add `PublicConfig` type and `publicConfig` query.
- `api/src/resolvers.ts` — add `publicConfig` resolver.

### 2. Web (admin dashboard)

- The device detail page (`web/src/app/devices/[id]/page.tsx`) already runs an
  Apollo query for the device. Fetch `publicConfig { shopDomain }` as well
  (added to the same page's data fetching, or a small dedicated hook/query).
- Compute the storefront URL when the eligibility rule is met:
  `https://{shopDomain}/item/{id}`.
- Pass it to `ShareModal.tsx` as a new optional prop (e.g. `storefrontUrl?: string`).
- `ShareModal.tsx` renders the existing **Admin link** plus, when
  `storefrontUrl` is present, a labeled **Storefront link** with its own copy
  button. Social/email buttons remain unchanged (they continue to use the
  existing device/admin URL).

Files:
- `web/src/app/devices/[id]/page.tsx` — fetch shopDomain, compute & pass prop.
- `web/src/components/ShareModal.tsx` — render both labeled links.

### 3. iOS

- Add `fetchPublicConfig()` to `DeviceService` returning the shop domain
  (cached after first fetch to avoid repeated round-trips).
- `ShareView.swift`: on appear, fetch the shop domain; when the eligibility rule
  is met, compute the storefront URL and display both labeled links. Include the
  storefront URL in the native share action.

Files:
- `ios/.../Services/DeviceService.swift` — `fetchPublicConfig()`.
- `ios/.../Views/ShareView.swift` — both labeled links + share action.

### 4. Internationalization

Add new label keys for **Admin link** and **Storefront link**:

- Web: `web/src/i18n/translations/{en,de,fr,es}.ts` (define type in `en.ts`).
- iOS: `ios/.../i18n/Translations.swift` + `Translations+{en,de,fr,es}.swift`.

## Error handling / edge cases

- `publicConfig.shopDomain` is `null`/empty → storefront link never shown.
- API/network failure fetching config → treat as no shop domain (admin link only);
  do not block the share sheet.
- Trailing slash / protocol: `SHOP_DOMAIN` is stored bare; always prefix `https://`.

## Verification

- API: `publicConfig` returns the configured domain, and `null` when unset.
- Web: `npm run build` + `npx tsc --noEmit` pass; eligible device shows both
  links, ineligible shows only admin, unset `SHOP_DOMAIN` shows only admin.
- iOS: `xcodebuild` succeeds; same three manual cases verified.

## Out of scope (YAGNI)

- No admin UI to edit `SHOP_DOMAIN` (env-driven, like today).
- No QR code for the storefront link.
- No changes to the storefront app itself.
- Social/email share buttons continue to use the existing admin/device URL only.
