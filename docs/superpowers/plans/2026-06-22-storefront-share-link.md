# Storefront Share Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a storefront ("shop") link to the device share sheet on iOS and web, shown only for FOR_SALE/PENDING_SALE/SOLD devices when `SHOP_DOMAIN` is configured.

**Architecture:** The API (which already has the `SHOP_DOMAIN` env var) exposes it via a new public `publicConfig { shopDomain }` GraphQL query. Web and iOS read that value, and when the device status is eligible, render a second labeled "Storefront link" (`https://{SHOP_DOMAIN}/item/{id}`) alongside the existing admin link.

**Tech Stack:** GraphQL (Apollo Server, `graphql-tag`), Next.js 14 + Apollo Client (web), SwiftUI (iOS), vitest (api/web tests).

## Global Constraints

- Storefront URL format: `https://{SHOP_DOMAIN}/item/{id}` — `SHOP_DOMAIN` is a bare hostname (e.g. `shop.example.com`), always prefixed with `https://`.
- Eligible statuses (storefront link shown): `FOR_SALE`, `PENDING_SALE`, `SOLD`. No other status shows it.
- Storefront link shown only when `shopDomain` is non-empty AND status is eligible.
- Both links shown, each clearly labeled (Admin link / Storefront link), each independently copyable.
- All new user-visible labels go through the translation system (web: en/de/fr/es; iOS: en/de/fr/es).
- New client GraphQL queries must pass `api/tests/unit/client-queries.test.ts` (validates queries against the schema) — so the API schema task must land before/with the web query change.
- Social/email share buttons (web) and the asset-tag tab are unchanged.

---

### Task 1: API — `publicConfig` query exposing `shopDomain`

**Files:**
- Modify: `api/src/typeDefs.ts` (add `PublicConfig` type; add `publicConfig` to `Query`)
- Modify: `api/src/resolvers.ts` (add `publicConfig` resolver in the `Query` block)
- Test: `api/tests/integration/public-config.test.ts`

**Interfaces:**
- Produces: GraphQL query `publicConfig: PublicConfig!` where `type PublicConfig { shopDomain: String }`. Resolver returns `{ shopDomain: process.env.SHOP_DOMAIN || null }`.

- [ ] **Step 1: Write the failing test**

Create `api/tests/integration/public-config.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../src/index';
import { getTestPrismaClient, disconnectPrisma } from '../helpers/setup';
import { graphqlQuery } from '../helpers/graphql';
import type { Express } from 'express';

let app: Express;

beforeAll(async () => {
    const result = await createApp(getTestPrismaClient());
    app = result.app;
});

afterAll(async () => {
    await disconnectPrisma();
    delete process.env.SHOP_DOMAIN;
});

describe('publicConfig query', () => {
    it('returns the configured SHOP_DOMAIN', async () => {
        process.env.SHOP_DOMAIN = 'shop.example.com';
        const res = await graphqlQuery(app, `{ publicConfig { shopDomain } }`);
        expect(res.errors).toBeUndefined();
        expect(res.data.publicConfig.shopDomain).toBe('shop.example.com');
    });

    it('returns null when SHOP_DOMAIN is unset', async () => {
        delete process.env.SHOP_DOMAIN;
        const res = await graphqlQuery(app, `{ publicConfig { shopDomain } }`);
        expect(res.errors).toBeUndefined();
        expect(res.data.publicConfig.shopDomain).toBeNull();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && npx vitest run tests/integration/public-config.test.ts`
Expected: FAIL — `Cannot query field "publicConfig" on type "Query"`.

- [ ] **Step 3: Add the type and query to the schema**

In `api/src/typeDefs.ts`, find the `type ShowcaseConfig {` block (around line 534) and add a new type immediately before it:

```graphql
  type PublicConfig {
    shopDomain: String
  }

```

Then find the `Query` block and the line `showcaseConfig: ShowcaseConfig` (around line 656) and add directly below it:

```graphql
    publicConfig: PublicConfig!
```

- [ ] **Step 4: Add the resolver**

In `api/src/resolvers.ts`, inside the `Query: {` block (starts around line 264), add this resolver (place it next to `showcaseConfig` for locality):

```typescript
        publicConfig: () => {
            return { shopDomain: process.env.SHOP_DOMAIN || null };
        },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd api && npx vitest run tests/integration/public-config.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Verify schema build and types**

Run: `cd api && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add api/src/typeDefs.ts api/src/resolvers.ts api/tests/integration/public-config.test.ts
git commit -m "feat(api): add publicConfig query exposing SHOP_DOMAIN

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Web — storefront link in the share modal

**Files:**
- Modify: `web/src/i18n/translations/en.ts` (type + English values), `de.ts`, `fr.ts`, `es.ts` (values)
- Modify: `web/src/components/ShareModal.tsx` (new `storefrontUrl` prop; render both labeled links)
- Modify: `web/src/app/devices/[id]/page.tsx` (fetch `publicConfig`, compute storefront URL, pass prop)
- Test: `web/tests/components/ShareModal.test.tsx`

**Interfaces:**
- Consumes: `publicConfig { shopDomain }` from Task 1.
- Produces: `ShareModal` accepts optional prop `storefrontUrl?: string | null`. When truthy, renders a second link block labeled `t.detail.storefrontLink`.

- [ ] **Step 1: Add translation keys (type + English)**

In `web/src/i18n/translations/en.ts`, find the `detail` section type that declares `deviceLink: string;` (around line 388) and add two keys after it:

```typescript
    adminLink: string;
    storefrontLink: string;
```

Then in the English values object, find `deviceLink: "Device Link",` (around line 1413) and add after it:

```typescript
    adminLink: "Admin Link",
    storefrontLink: "Storefront Link",
```

- [ ] **Step 2: Add German/French/Spanish values**

In `web/src/i18n/translations/de.ts`, find the `deviceLink:` line in the `detail` section and add after it:

```typescript
    adminLink: "Admin-Link",
    storefrontLink: "Shop-Link",
```

In `web/src/i18n/translations/fr.ts`, after the `detail` section's `deviceLink:` line:

```typescript
    adminLink: "Lien admin",
    storefrontLink: "Lien boutique",
```

In `web/src/i18n/translations/es.ts`, after the `detail` section's `deviceLink:` line:

```typescript
    adminLink: "Enlace de administración",
    storefrontLink: "Enlace de tienda",
```

- [ ] **Step 3: Write the failing component test**

Create `web/tests/components/ShareModal.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShareModal } from '@/components/ShareModal';

const baseProps = {
    isOpen: true,
    onClose: () => {},
    deviceUrl: 'https://inventory.example.com/devices/42',
    deviceName: 'Macintosh SE',
    additionalName: null,
    deviceId: 42,
};

describe('ShareModal storefront link', () => {
    it('shows both admin and storefront links when storefrontUrl is provided', () => {
        render(<ShareModal {...baseProps} storefrontUrl="https://shop.example.com/item/42" />);
        expect(screen.getByText('Admin Link')).toBeTruthy();
        expect(screen.getByText('Storefront Link')).toBeTruthy();
        expect(screen.getByDisplayValue('https://shop.example.com/item/42')).toBeTruthy();
    });

    it('shows only the admin link when storefrontUrl is absent', () => {
        render(<ShareModal {...baseProps} />);
        expect(screen.getByText('Admin Link')).toBeTruthy();
        expect(screen.queryByText('Storefront Link')).toBeNull();
    });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd web && npx vitest run tests/components/ShareModal.test.tsx`
Expected: FAIL — `Admin Link` not found (label is currently "Device Link", and there is no storefront link).

- [ ] **Step 5: Update ShareModal to render both labeled links**

In `web/src/components/ShareModal.tsx`:

(a) Add the prop to the interface (after `deviceId: number;`):

```typescript
    storefrontUrl?: string | null;
```

(b) Add it to the destructured params:

```typescript
export function ShareModal({ isOpen, onClose, deviceUrl, deviceName, additionalName, deviceId, storefrontUrl }: ShareModalProps) {
```

(c) Add a second copy state next to `const [copied, setCopied] = useState(false);`:

```typescript
    const [storefrontCopied, setStorefrontCopied] = useState(false);
```

(d) Add a copy handler next to `handleCopyLink`:

```typescript
    const handleCopyStorefront = async () => {
        if (!storefrontUrl) return;
        try {
            await navigator.clipboard.writeText(storefrontUrl);
            setStorefrontCopied(true);
            setTimeout(() => setStorefrontCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };
```

(e) Replace the existing "Copy Link" block. Find:

```tsx
                            {/* Copy Link */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                                    {t.detail.deviceLink}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={deviceUrl}
                                        readOnly
                                        className="input-retro flex-1 px-3 py-2 text-sm text-[var(--foreground)] bg-[var(--muted)]"
                                    />
                                    <button
                                        onClick={handleCopyLink}
                                        className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
                                            copied
                                                ? 'bg-green-600 text-white border-green-600'
                                                : 'bg-[var(--apple-blue)] text-white border-[#007acc] hover:brightness-110'
                                        }`}
                                    >
                                        {copied ? t.detail.copied : t.detail.copy}
                                    </button>
                                </div>
                            </div>
```

with:

```tsx
                            {/* Admin Link */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                                    {t.detail.adminLink}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={deviceUrl}
                                        readOnly
                                        className="input-retro flex-1 px-3 py-2 text-sm text-[var(--foreground)] bg-[var(--muted)]"
                                    />
                                    <button
                                        onClick={handleCopyLink}
                                        className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
                                            copied
                                                ? 'bg-green-600 text-white border-green-600'
                                                : 'bg-[var(--apple-blue)] text-white border-[#007acc] hover:brightness-110'
                                        }`}
                                    >
                                        {copied ? t.detail.copied : t.detail.copy}
                                    </button>
                                </div>
                            </div>

                            {/* Storefront Link */}
                            {storefrontUrl && (
                                <div>
                                    <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                                        {t.detail.storefrontLink}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={storefrontUrl}
                                            readOnly
                                            className="input-retro flex-1 px-3 py-2 text-sm text-[var(--foreground)] bg-[var(--muted)]"
                                        />
                                        <button
                                            onClick={handleCopyStorefront}
                                            className={`px-4 py-2 text-sm font-medium rounded border transition-colors ${
                                                storefrontCopied
                                                    ? 'bg-green-600 text-white border-green-600'
                                                    : 'bg-[var(--apple-blue)] text-white border-[#007acc] hover:brightness-110'
                                            }`}
                                        >
                                            {storefrontCopied ? t.detail.copied : t.detail.copy}
                                        </button>
                                    </div>
                                </div>
                            )}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd web && npx vitest run tests/components/ShareModal.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 7: Fetch publicConfig and pass storefrontUrl from the detail page**

In `web/src/app/devices/[id]/page.tsx`, add `publicConfig` to the existing `GET_DEVICE` query. Find the opening of the device selection (the `device(where: $where) {` block, fields start around line 23) and add a sibling top-level field to the query — insert `publicConfig { shopDomain }` immediately after the closing `}` of the `device(where: $where) { ... }` selection but still inside the `query GetDevice(...) { ... }`. Concretely, locate the end of the device block:

```graphql
    }
  }
`;
```

and change it to:

```graphql
    }
    publicConfig {
      shopDomain
    }
  }
`;
```

- [ ] **Step 8: Compute the storefront URL and pass it to ShareModal**

In the same file, find the `<ShareModal` render (around line 2165) and add the `storefrontUrl` prop. Replace:

```tsx
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          deviceUrl={typeof window !== 'undefined' ? window.location.href : `/devices/${id}`}
          deviceName={device.name}
          additionalName={device.additionalName}
          deviceId={parseInt(id as string)}
        />
```

with:

```tsx
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          deviceUrl={typeof window !== 'undefined' ? window.location.href : `/devices/${id}`}
          deviceName={device.name}
          additionalName={device.additionalName}
          deviceId={parseInt(id as string)}
          storefrontUrl={
            data?.publicConfig?.shopDomain && ['FOR_SALE', 'PENDING_SALE', 'SOLD'].includes(device.status)
              ? `https://${data.publicConfig.shopDomain}/item/${id}`
              : null
          }
        />
```

- [ ] **Step 9: Verify client query validation, types, and build**

Run: `cd api && npx vitest run tests/unit/client-queries.test.ts`
Expected: PASS — the new `publicConfig` field in `GET_DEVICE` validates against the schema.

Run: `cd web && npx tsc --noEmit`
Expected: no errors.

Run: `cd web && npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 10: Update release notes**

In `web/src/lib/releaseNotes.ts`, add to the `Unreleased` entry's `added` array:

```typescript
      'Device share sheet now offers a Storefront link (https://SHOP_DOMAIN/item/ID) for devices that are For Sale, Pending Sale, or Sold when SHOP_DOMAIN is configured',
```

- [ ] **Step 11: Commit**

```bash
git add web/src/components/ShareModal.tsx web/src/app/devices/[id]/page.tsx \
  web/src/i18n/translations/en.ts web/src/i18n/translations/de.ts \
  web/src/i18n/translations/fr.ts web/src/i18n/translations/es.ts \
  web/tests/components/ShareModal.test.tsx web/src/lib/releaseNotes.ts
git commit -m "feat(web): add storefront link to device share sheet

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: iOS — storefront link in the share sheet

**Files:**
- Modify: `ios/.../Services/DeviceService.swift` (add `fetchPublicConfig()`)
- Modify: `ios/.../i18n/Translations.swift` (add `adminLink`/`storefrontLink` to the existing `ShareT` struct)
- Modify: `ios/.../i18n/Translations+en.swift`, `+de.swift`, `+fr.swift`, `+es.swift` (values)
- Modify: `ios/.../Views/ShareView.swift` (fetch shopDomain; render both labeled links; include storefront URL in share action)

**Interfaces:**
- Consumes: `publicConfig { shopDomain }` from Task 1.
- Produces: `DeviceService.shared.fetchPublicConfig() async throws -> String?` (returns shop domain, cached); `Translations.share.adminLink` / `.storefrontLink`.

- [ ] **Step 1: Add `fetchPublicConfig()` to DeviceService**

In `ios/.../Services/DeviceService.swift`, add this method inside the `DeviceService` class (place it near the top, after `private init() {}`):

```swift
    private var cachedShopDomain: String?? = nil

    /// Returns the configured storefront domain (or nil). Cached after first fetch.
    func fetchPublicConfig() async throws -> String? {
        if let cached = cachedShopDomain { return cached }
        let query = """
        query GetPublicConfig {
            publicConfig {
                shopDomain
            }
        }
        """
        struct Response: Decodable {
            struct PublicConfig: Decodable { let shopDomain: String? }
            let publicConfig: PublicConfig
        }
        let response: Response = try await api.execute(query: query)
        cachedShopDomain = response.publicConfig.shopDomain
        return response.publicConfig.shopDomain
    }
```

- [ ] **Step 2: Add two fields to the existing `ShareT` struct**

NOTE: `ShareT` already exists in `ios/.../i18n/Translations.swift` (around line 219) and is wired into the top-level `Translations` struct as `let share: ShareT` (around line 364). It is currently unused by `ShareView` (which hardcodes its strings), but we extend it so the two new labels are localized. Do NOT create a new struct.

Find the existing struct and add the two fields:

```swift
    struct ShareT {
        let title, done, shareLink, assetTag, deviceLink: String
        let copy, copied, shareVia, shareViaSheet: String
        let assetTagPreview, labelOptimized: String
        let savedToPhotos, saveToPhotos, shareAssetTag: String
        let idPrefix: String
        let adminLink, storefrontLink: String
    }
```

- [ ] **Step 3: Add values to the existing `share: .init(...)` block in all four languages**

In `ios/.../i18n/Translations+en.swift`, find the `share: .init(` block (around line 476) and add the two new values before its closing `)` (keep the existing fields):

```swift
            adminLink: "Admin Link",
            storefrontLink: "Storefront Link"
```

In `Translations+de.swift`, in its `share: .init(` block:

```swift
            adminLink: "Admin-Link",
            storefrontLink: "Shop-Link"
```

In `Translations+fr.swift`:

```swift
            adminLink: "Lien admin",
            storefrontLink: "Lien boutique"
```

In `Translations+es.swift`:

```swift
            adminLink: "Enlace de administración",
            storefrontLink: "Enlace de tienda"
```

(If the last existing value in a block lacks a trailing comma, add one before inserting the new lines.)

- [ ] **Step 4: Add storefront URL state and fetch to ShareView**

In `ios/.../Views/ShareView.swift`, add state below `@State private var assetTagSaved = false`:

```swift
    @State private var shopDomain: String?
```

Add a computed property next to `deviceUrl`:

```swift
    private var storefrontUrl: String? {
        guard let domain = shopDomain, !domain.isEmpty else { return nil }
        let eligible: [Status] = [.FOR_SALE, .PENDING_SALE, .SOLD]
        guard eligible.contains(device.status) else { return nil }
        return "https://\(domain)/item/\(device.id)"
    }
```

Attach a `.task` to the `NavigationStack` (add it next to the existing `.toolbar { ... }` modifier in `body`):

```swift
            .task {
                shopDomain = try? await DeviceService.shared.fetchPublicConfig()
            }
```

- [ ] **Step 5: Render both labeled links in shareLinkView**

In `shareLinkView`, replace the existing "Device Link" `VStack` (the block starting `VStack(alignment: .leading, spacing: 8) {` containing `Text("Device Link")`) with an Admin Link block plus a conditional Storefront Link block:

```swift
                VStack(alignment: .leading, spacing: 8) {
                    Text(LocalizationManager.shared.t.share.adminLink)
                        .font(.headline)

                    HStack {
                        Text(deviceUrl)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding()
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        Button {
                            UIPasteboard.general.string = deviceUrl
                            copied = true
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                copied = false
                            }
                        } label: {
                            Text(copied ? "Copied!" : "Copy")
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 12)
                                .background(copied ? Color.green : Color.accentColor)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }
                .padding(.horizontal)

                if let storefrontUrl {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(LocalizationManager.shared.t.share.storefrontLink)
                            .font(.headline)

                        HStack {
                            Text(storefrontUrl)
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(2)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding()
                                .background(Color(.systemGray6))
                                .clipShape(RoundedRectangle(cornerRadius: 8))

                            Button {
                                UIPasteboard.general.string = storefrontUrl
                                storefrontCopied = true
                                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                    storefrontCopied = false
                                }
                            } label: {
                                Text(storefrontCopied ? "Copied!" : "Copy")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 12)
                                    .background(storefrontCopied ? Color.green : Color.accentColor)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                            }
                        }
                    }
                    .padding(.horizontal)
                }
```

Add the matching state near `@State private var copied = false`:

```swift
    @State private var storefrontCopied = false
```

- [ ] **Step 6: Include the storefront URL in the share action**

In `shareViaActivitySheet()`, replace:

```swift
        let items: [Any] = [text, URL(string: deviceUrl)!]
```

with:

```swift
        var items: [Any] = [text, URL(string: deviceUrl)!]
        if let storefrontUrl, let url = URL(string: storefrontUrl) {
            items.append(url)
        }
```

- [ ] **Step 7: Build to verify**

Run:
```bash
xcodebuild -scheme InventoryDifferent -project ios/InventoryDifferent/InventoryDifferent.xcodeproj -destination 'platform=iOS Simulator,id=9116C8FB-2461-4260-B7DD-FE254FD202DE' build 2>&1 | grep -E "(BUILD SUCCEEDED|BUILD FAILED|error:)"
```
Expected: `** BUILD SUCCEEDED **` (SourceKit "cannot find type" diagnostics in the editor are cross-file indexing artifacts; trust xcodebuild).

- [ ] **Step 8: Commit**

```bash
git add ios/InventoryDifferent/InventoryDifferent/Services/DeviceService.swift \
  ios/InventoryDifferent/InventoryDifferent/i18n/Translations.swift \
  ios/InventoryDifferent/InventoryDifferent/i18n/Translations+en.swift \
  ios/InventoryDifferent/InventoryDifferent/i18n/Translations+de.swift \
  ios/InventoryDifferent/InventoryDifferent/i18n/Translations+fr.swift \
  ios/InventoryDifferent/InventoryDifferent/i18n/Translations+es.swift \
  ios/InventoryDifferent/InventoryDifferent/Views/ShareView.swift
git commit -m "feat(ios): add storefront link to device share sheet

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Manual Verification (after all tasks)

1. **Web, eligible + domain set:** With `SHOP_DOMAIN` configured, open a FOR_SALE device → Share → see both "Admin Link" and "Storefront Link" (`https://shop.../item/ID`); copy each.
2. **Web, ineligible:** Open a COLLECTION device → Share → only "Admin Link".
3. **Web, no domain:** With `SHOP_DOMAIN` unset, open a FOR_SALE device → only "Admin Link".
4. **iOS:** Same three cases via the iOS share sheet; the native share action includes the storefront URL when present.
