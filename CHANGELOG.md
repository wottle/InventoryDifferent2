# Changelog

All notable changes to InventoryDifferent will be documented here.

## [Unreleased]

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
