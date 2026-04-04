# Changelog

All notable changes to InventoryDifferent will be documented here.

## [Unreleased]

### Changed
- i18n: all remaining sub-pages (timeline, stats, usage, trash, categories, financials, wishlist, custom fields, templates, print) and device form fully translated (en/de)

---

## [1.1.2] - 2026-04-03

### Changed
- i18n: main menu, nav tooltips, inventory footer, device detail section headers, field labels, forms, and all inline buttons now translated (en/de)
- i18n: status badge on card view, table column headers, icon tooltips, currency symbol, and accessory suggestions now translated (en/de)

---

## [1.1.1] - 2026-04-03

### Fixed
- LANGUAGE env var now correctly applied at runtime — setting it in docker-compose no longer requires a rebuild

---

## [1.1.0] - 2026-04-03

### Added
- i18n infrastructure: LANGUAGE env var (en/de) controls UI language across web app; enum labels (status, condition, rarity, functional status) and filter panel now fully translated

---

## [1.0.7] - 2026-04-03

### Changed
- Rarity color scheme: common=gray, uncommon=green, rare=sage, very rare=blue, extremely rare=purple (web and iOS)
- Rarity icon moved to right of label on web device detail screen

---

## [1.0.6] - 2026-04-03

### Changed
- Rarity indicator changed from gem to crown icon; color-coded by rarity level on web cards, list, and iOS
- Functional status, rarity, and PRAM battery icons now shown next to their field labels on web and iOS device detail screens
- Status indicators row added to iOS grid card view
- iOS: sort by Condition and Rarity (most rare first)

---

## [1.0.5] - 2026-04-03

### Changed
- Rarity gem icon repositioned to status indicators row (between functional status and asset tag); now uses custom faceted gem shape on web and iOS
- Rarity sort puts most rare first when sorting ascending (web and iOS)

---

## [1.0.4] - 2026-04-03

### Added
- Rarity diamond icon in status indicators — color-coded from gray (common) to yellow (uncommon) to green (rare); shown on web cards, list view, and iOS device list
- iOS: sort by Condition and Rarity

### Fixed
- Sort by condition and rarity now works — fields were missing from the device list query

---

## [1.0.3] - 2026-04-02

### Added
- Sort devices by condition or rarity on the inventory page

### Fixed
- Filtering by condition or rarity now correctly applies to the API query

---

## [1.0.2] - 2026-04-02

### Added
- AI image generation page: thumbnail mode selector (Both/Light/Dark) and source image priority explanation

---

## [1.0.1] - 2026-04-01

### Added
- iOS: persistent field labels on add/edit device and wishlist forms — fields are now identifiable even when filled
- Light/dark mode thumbnails — set separate thumbnails for light and dark mode; web, iOS, and storefront automatically display the correct one based on the current color scheme

### Fixed
- Condition and rarity fields now display on device detail page and pre-populate correctly in edit form
- Template sorting on manage templates page is now case-insensitive

---

## [1.0.0] - 2026-03-31

### Added
- Wishlist page with priority badges, grouping, and "Mark as Acquired" flow
- Stats page with collection composition charts (status, condition, category, acquisition year, manufacturer)
- Timeline page — devices by release year interspersed with historical tech milestones
- Value history chart per device (auto-snapshots estimatedValue on save)
- AI product image generation using OpenAI image models
- Accessories and external links fields on devices
- Custom fields with public/private visibility control
- System settings table for runtime configuration
- Device loan tracking model (foundation laid)
- iOS: grid tile view mode with adaptive columns (portrait/landscape/iPad)
- iOS: wishlist with swipe-to-delete and "Mark as Acquired"
- iOS: value history chart in device Overview tab
- MCP tool `list_all_devices` for whole-collection reasoning

### Changed
- Device status `AVAILABLE` renamed to `COLLECTION`
- Docker compose DB credentials now use environment variables with defaults

### Fixed
- Prepare repo for public release: removed personal domains, Apple Team ID, hardcoded secrets

---

*This project uses [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.*
