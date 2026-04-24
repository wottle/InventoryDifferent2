# List & Card View Typography Redesign

**Date:** 2026-04-20  
**Status:** Approved

## Goal

Update the iOS device list and grid card views to use the same "Precision Editorial / Technical Atelier" typography system introduced in `DeviceDetailViewRedesign.swift`. The detail view and list/card views should feel like a cohesive system.

## Affected Files

- `ios/InventoryDifferent/InventoryDifferent/Views/DeviceListView.swift`
  - `DeviceRowView` (list mode)
  - `StatusBadge`
  - `ValueSaleInfo`
- `ios/InventoryDifferent/InventoryDifferent/Views/DeviceGridItemView.swift`

## Design Tokens (from DeviceDetailViewRedesign.swift)

| Token | Value |
|---|---|
| International Blue (edPrimary) | `Color(red: 0, green: 88/255, blue: 188/255)` = `#0058BC` |
| Overline style | `size: 10–11, weight: .bold, .uppercase, tracking: 1.5–2` in `.edPrimary` |
| Title style | `weight: .bold` (was `.semibold`/`.headline`), `tracking: -0.3` |
| Subtitle style | `size: 13, weight: .semibold` (was 15pt regular subheadline) |
| Status chip | `size: 10–11, weight: .bold, .uppercase, tracking: 0.5`, `cornerRadius: 4` (was capsule) |
| Value text | `size: 11, weight: .semibold` (was 12pt caption) |

## List Row (`DeviceRowView`) Changes

### Current layout (top to bottom)
1. Device name — `.headline` (17pt semibold)
2. Additional name — `.subheadline` (15pt regular, secondary)
3. Meta row: Category • Year + StatusBadge — `.caption` (12pt)
4. StatusIndicatorsRow — 12pt icons
5. ValueSaleInfo — `.caption` (12pt)

### Proposed layout (top to bottom)
1. **Overline** — Category · Year in `size: 10, weight: .bold, uppercase, tracking: 1.5` in `.edPrimary` (new)
2. Device name — `size: 16, weight: .bold, tracking: -0.3` (was `.headline`)
3. Additional name — `size: 13, weight: .semibold, tracking: -0.1` in `.secondary` (was `.subheadline` regular)
4. Icon row — StatusIndicatorsRow icons (unchanged size) + StatusBadge right-aligned in same HStack (badge moves here from meta row)
5. ValueSaleInfo — `size: 11, weight: .semibold` (was `.caption`)

The separate "meta row" (category/year/badge) is replaced by the overline + badge-in-icon-row pattern.

## `StatusBadge` Changes

- Font: `size: 11, weight: .bold, .uppercase, tracking: 0.5` (was `.caption2, .medium`)
- Shape: `RoundedRectangle(cornerRadius: 4)` (was `Capsule()`)
- Colors: unchanged

## `ValueSaleInfo` Changes

- Font: `.system(size: 11, weight: .semibold)` (was `.caption` / 12pt regular)
- All color variants (green, orange, red, etc.) unchanged

## Grid Card (`DeviceGridItemView`) Changes

### Text area — current layout
1. Name — `.caption, .semibold` (12pt semibold)
2. Additional name or manufacturer or category — `.caption2` (11pt regular, secondary)
3. ValueSaleInfo — `.caption2` (11pt)

### Text area — proposed layout
1. **Overline** — Category · Year in `size: 9, weight: .bold, uppercase, tracking: 1.2` in `.edPrimary` (new)
2. Name — `size: 12, weight: .bold, tracking: -0.2` (was `.caption, .semibold`)
3. Additional name / manufacturer / category — `size: 10, weight: .semibold` in `.secondary` (was `.caption2` regular)
4. ValueSaleInfo — `size: 10, weight: .semibold` (was `.caption2`)

### Status badge overlay (top-right)
Uses the same updated `StatusBadge` component — picks up the squared chip shape and uppercase style automatically.

## What Does NOT Change

- Thumbnail image size and corner radius
- StatusIndicatorsRow icon set, sizes, and colors
- Favorite star overlay (card view)
- Icon strip overlay at bottom of card thumbnail
- All status colors (green, orange, red, teal, etc.)
- Row padding and spacing values
- Grid column layout and card corner radius

## Implementation Notes

- The `edPrimary` color is currently defined as a `private extension Color` inside `DeviceDetailViewRedesign.swift`. Since `DeviceListView.swift` and `DeviceGridItemView.swift` need access to the same color, either:
  - Move the `edPrimary` extension to a shared file (e.g. a new `DesignTokens.swift`), or
  - Duplicate the color value inline with a comment referencing the design system.
  - **Recommendation:** Duplicate inline for now (one file change, no new file needed) since there are only two additional use sites. Reference comment: `// edPrimary — matches DeviceDetailViewRedesign`
- Build verification: iOS only (`xcodebuild` command in CLAUDE.md)
- No translation changes needed — all affected strings are already translated
- Add a `changed` release notes entry in `web/src/lib/releaseNotes.ts` (Unreleased) — per project convention, every code commit requires one. Suggested text: "Refined list and card view typography to match the device detail editorial style"
