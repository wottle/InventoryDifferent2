# List & Card View Typography Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the iOS device list row and grid card views to use the "Precision Editorial" typography system from `DeviceDetailViewRedesign.swift`, making all three views feel like a cohesive design system.

**Architecture:** Three components in two files are updated. `StatusBadge` (shared by both views) is updated first since it affects both. `DeviceRowView` is restructured to replace the category/year/badge meta row with an uppercase overline + badge-in-icon-row pattern. `DeviceGridItemView` gains the same overline in its text area. No new files are created; the `edPrimary` colour is inlined with a comment in both files rather than extracted to a shared token file.

**Tech Stack:** SwiftUI, iOS 16+. Build verification via `xcodebuild`.

---

## Files Modified

| File | What changes |
|---|---|
| `ios/InventoryDifferent/InventoryDifferent/Views/DeviceListView.swift` | `StatusBadge` shape + font; `DeviceRowView` layout restructure + typography; `ValueSaleInfo` font |
| `ios/InventoryDifferent/InventoryDifferent/Views/DeviceGridItemView.swift` | Text area: add overline, update name/sub/value fonts |

---

## Task 1: Update `StatusBadge` font and shape

`StatusBadge` is defined in `DeviceListView.swift` and used in both list rows and card grid items. Updating it here propagates to both views automatically.

**Files:**
- Modify: `ios/InventoryDifferent/InventoryDifferent/Views/DeviceListView.swift`

- [ ] **Step 1: Open `DeviceListView.swift` and locate `StatusBadge` (line ~473)**

The struct looks like this:

```swift
struct StatusBadge: View {
    let status: Status
    
    var body: some View {
        Text(status.displayName)
            .font(.caption2)
            .fontWeight(.medium)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(backgroundColor)
            .foregroundColor(textColor)
            .clipShape(Capsule())
    }
    
    private var textColor: Color {
        status == .PENDING_SALE ? .black : .white
    }
    ...
}
```

- [ ] **Step 2: Replace the `body` computed property inside `StatusBadge`**

Replace only the `body` property (leave `textColor` and `backgroundColor` untouched):

```swift
var body: some View {
    Text(status.displayName)
        .font(.system(size: 10, weight: .bold))
        .textCase(.uppercase)
        .tracking(0.5)
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .background(backgroundColor)
        .foregroundColor(textColor)
        .clipShape(RoundedRectangle(cornerRadius: 4))
}
```

Key changes:
- `.font(.caption2).fontWeight(.medium)` → `.font(.system(size: 10, weight: .bold))`
- Added `.textCase(.uppercase)` and `.tracking(0.5)`
- `.clipShape(Capsule())` → `.clipShape(RoundedRectangle(cornerRadius: 4))`
- `textColor` kept: PENDING_SALE still uses `.black`, all others `.white`

- [ ] **Step 3: Build to verify `StatusBadge` compiles**

```bash
cd /Users/wottle/Documents/Development/InvDifferent2
xcodebuild -scheme InventoryDifferent \
  -destination 'platform=iOS Simulator,id=9116C8FB-2461-4260-B7DD-FE254FD202DE' \
  build 2>&1 | grep -E "(BUILD SUCCEEDED|BUILD FAILED|error:)"
```

Expected: `BUILD SUCCEEDED`

---

## Task 2: Restructure `DeviceRowView` layout and typography

Replaces the old "category • year + badge" meta row with an uppercase blue overline, updates name/subtitle typography, and moves the status badge to the right end of the icon row.

**Files:**
- Modify: `ios/InventoryDifferent/InventoryDifferent/Views/DeviceListView.swift`

- [ ] **Step 1: Add the `edPrimary` colour and `overlineText` computed property to `DeviceRowView`**

`DeviceRowView` currently has `thumbnailURL` as its only computed property. Add two more immediately after the closing brace of `thumbnailURL`:

```swift
// International Blue — matches edPrimary in DeviceDetailViewRedesign
private let edPrimary = Color(red: 0, green: 88 / 255, blue: 188 / 255)

private var overlineText: String {
    var parts = [device.category.name]
    if let year = device.releaseYear { parts.append(String(year)) }
    return parts.joined(separator: " · ")
}
```

- [ ] **Step 2: Replace the `VStack` inside `DeviceRowView.body`**

The current VStack (inside the outer HStack, after the thumbnail) is:

```swift
VStack(alignment: .leading, spacing: 3) {
    // Name
    Text(device.name)
        .font(.headline)
        .lineLimit(1)
    
    // Additional name
    if let additionalName = device.additionalName, !additionalName.isEmpty {
        Text(additionalName)
            .font(.subheadline)
            .foregroundColor(.secondary)
            .lineLimit(1)
    }
    
    // Category, release year, and status badge
    HStack(spacing: 6) {
        Text(device.category.name)
            .font(.caption)
            .foregroundColor(.secondary)
        
        if let year = device.releaseYear {
            Text("•")
                .font(.caption)
                .foregroundColor(.secondary)
            Text(String(year))
                .font(.caption)
                .foregroundColor(.secondary)
        }
        
        StatusBadge(status: device.status)
    }
    
    // Status indicator icons row
    StatusIndicatorsRow(device: device)
    
    // Value/Sale info
    ValueSaleInfo(device: device)
}
```

Replace it entirely with:

```swift
VStack(alignment: .leading, spacing: 3) {
    // Overline: Category · Year
    Text(overlineText)
        .font(.system(size: 10, weight: .bold))
        .textCase(.uppercase)
        .tracking(1.5)
        .foregroundColor(edPrimary)
        .lineLimit(1)

    // Name
    Text(device.name)
        .font(.system(size: 16, weight: .bold))
        .tracking(-0.3)
        .lineLimit(1)

    // Additional name
    if let additionalName = device.additionalName, !additionalName.isEmpty {
        Text(additionalName)
            .font(.system(size: 13, weight: .semibold))
            .tracking(-0.1)
            .foregroundColor(.secondary)
            .lineLimit(1)
    }

    // Status indicator icons + badge right-aligned
    HStack(spacing: 6) {
        StatusIndicatorsRow(device: device)
        Spacer()
        StatusBadge(status: device.status)
    }

    // Value/Sale info
    ValueSaleInfo(device: device)
}
```

- [ ] **Step 3: Build to verify**

```bash
xcodebuild -scheme InventoryDifferent \
  -destination 'platform=iOS Simulator,id=9116C8FB-2461-4260-B7DD-FE254FD202DE' \
  build 2>&1 | grep -E "(BUILD SUCCEEDED|BUILD FAILED|error:)"
```

Expected: `BUILD SUCCEEDED`

---

## Task 3: Update `ValueSaleInfo` font

`ValueSaleInfo` is also in `DeviceListView.swift`. Every `Text` in its body currently uses `.font(.caption)` (12pt regular). Update all of them to `.font(.system(size: 11, weight: .semibold))`.

**Files:**
- Modify: `ios/InventoryDifferent/InventoryDifferent/Views/DeviceListView.swift`

- [ ] **Step 1: Locate `ValueSaleInfo` (around line ~416)**

The struct body is a `Group` containing a `switch` over `device.status`. Every branch applies `.font(.caption)` to its `Text`. There are 8 branches (COLLECTION, FOR_SALE, PENDING_SALE, SOLD, DONATED, IN_REPAIR, REPAIRED, RETURNED).

- [ ] **Step 2: Replace every `.font(.caption)` inside `ValueSaleInfo.body` with `.font(.system(size: 11, weight: .semibold))`**

Use a global find-and-replace scoped to the `ValueSaleInfo` struct. Every occurrence looks like one of these patterns:

```swift
// Before (all variants):
.font(.caption)

// After:
.font(.system(size: 11, weight: .semibold))
```

After the change, spot-check three branches to confirm they look like this:

```swift
case .COLLECTION:
    if let value = device.estimatedValue {
        Text("\(t.deviceList.estValue)\(formatPrice(value))")
            .font(.system(size: 11, weight: .semibold))
            .foregroundColor(.green)
    }
case .FOR_SALE:
    Text("\(t.deviceList.forSale)\(device.listPrice.map { formatPrice($0) } ?? t.deviceList.tbd)")
        .font(.system(size: 11, weight: .semibold))
        .foregroundColor(.orange)
case .RETURNED:
    if let fee = device.soldPrice, fee > 0 {
        Text("\(t.deviceList.returnedFee)\(formatPrice(fee))")
            .font(.system(size: 11, weight: .semibold))
            .foregroundColor(.red)
    } else {
        Text(t.deviceList.returned)
            .font(.system(size: 11, weight: .semibold))
            .foregroundColor(.red)
    }
```

- [ ] **Step 3: Build to verify**

```bash
xcodebuild -scheme InventoryDifferent \
  -destination 'platform=iOS Simulator,id=9116C8FB-2461-4260-B7DD-FE254FD202DE' \
  build 2>&1 | grep -E "(BUILD SUCCEEDED|BUILD FAILED|error:)"
```

Expected: `BUILD SUCCEEDED`

---

## Task 4: Update `DeviceGridItemView` typography

Adds the blue overline to the card text area and updates name/subtitle/value fonts.

**Files:**
- Modify: `ios/InventoryDifferent/InventoryDifferent/Views/DeviceGridItemView.swift`

- [ ] **Step 1: Add `edPrimary` colour and `cardOverline` computed property to `DeviceGridItemView`**

Currently `DeviceGridItemView` has only `thumbnailURL` as a computed property. Add immediately after it:

```swift
// International Blue — matches edPrimary in DeviceDetailViewRedesign
private let edPrimary = Color(red: 0, green: 88 / 255, blue: 188 / 255)

private var cardOverline: String {
    var parts = [device.category.name]
    if let year = device.releaseYear { parts.append(String(year)) }
    return parts.joined(separator: " · ")
}
```

- [ ] **Step 2: Replace the text area `VStack` inside `DeviceGridItemView`**

Current text area (after the `ZStack` thumbnail section):

```swift
// Text area
VStack(alignment: .leading, spacing: 2) {
    Text(device.name)
        .font(.caption)
        .fontWeight(.semibold)
        .lineLimit(1)

    Text(device.additionalName?.isEmpty == false ? device.additionalName! : device.manufacturer ?? device.category.name)
        .font(.caption2)
        .foregroundColor(.secondary)
        .lineLimit(1)

    ValueSaleInfo(device: device)
        .font(.caption2)
}
.padding(.horizontal, 8)
.padding(.vertical, 6)
```

Replace with:

```swift
// Text area
VStack(alignment: .leading, spacing: 2) {
    Text(cardOverline)
        .font(.system(size: 9, weight: .bold))
        .textCase(.uppercase)
        .tracking(1.2)
        .foregroundColor(edPrimary)
        .lineLimit(1)

    Text(device.name)
        .font(.system(size: 12, weight: .bold))
        .tracking(-0.2)
        .lineLimit(1)

    Text(device.additionalName?.isEmpty == false ? device.additionalName! : device.manufacturer ?? device.category.name)
        .font(.system(size: 10, weight: .semibold))
        .foregroundColor(.secondary)
        .lineLimit(1)

    ValueSaleInfo(device: device)
        .font(.system(size: 10, weight: .semibold))
}
.padding(.horizontal, 8)
.padding(.vertical, 6)
```

Note: `ValueSaleInfo` sets its own per-`Text` font in Task 3, but the `.font()` modifier on the parent VStack acts as a fallback — keep it here for forward-compatibility if new cases are added.

- [ ] **Step 3: Build to verify**

```bash
xcodebuild -scheme InventoryDifferent \
  -destination 'platform=iOS Simulator,id=9116C8FB-2461-4260-B7DD-FE254FD202DE' \
  build 2>&1 | grep -E "(BUILD SUCCEEDED|BUILD FAILED|error:)"
```

Expected: `BUILD SUCCEEDED`

---

## Task 5: Update release notes and commit

**Files:**
- Modify: `web/src/lib/releaseNotes.ts`

- [ ] **Step 1: Add a `changed` entry to the `Unreleased` section in `web/src/lib/releaseNotes.ts`**

Open the file and find the `Unreleased` entry at the top. Add to its `changed` array (create the array if it doesn't exist):

```ts
changed: [
  // ...existing entries...
  "Refined list and card view typography to match the device detail editorial style",
],
```

- [ ] **Step 2: Commit all changes**

```bash
cd /Users/wottle/Documents/Development/InvDifferent2
git add \
  ios/InventoryDifferent/InventoryDifferent/Views/DeviceListView.swift \
  ios/InventoryDifferent/InventoryDifferent/Views/DeviceGridItemView.swift \
  web/src/lib/releaseNotes.ts

git commit -m "$(cat <<'EOF'
Update list and card typography to match detail view editorial style

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```
