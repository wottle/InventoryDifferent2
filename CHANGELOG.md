# Changelog

All notable changes to InventoryDifferent will be documented here.

## [Unreleased]

### Added
- Seed 22 default showcase quotes from Apple history figures (Jobs, Ive, Wozniak, Raskin, Kare, Rams, Tognazzini, Think Different)

### Fixed
- Showcase footer rendered before page content instead of after it
- Showcase hero image not displaying on homepage

---

## [2.0.0] - 2026-04-12

### Added
- Showcase: new public showcase site with journeys, chapters, featured devices, quotes, and configurable appearance

---

## [1.7.0] - 2026-04-11

### Added
- Backup: CSV import — upload a CSV file and map its columns to device fields for bulk import without needing a ZIP export

### Fixed
- Web: add photo, maintenance log, and note buttons no longer appear when not logged in
- Storefront: browsing to a non-shop item by ID now shows a helpful "not available" page instead of exposing the item

---

## [1.6.1] - 2026-04-11

### Changed
- Backup: table headers are now clickable to sort by any column (ID, category, name, year, status, images, notes)

---

## [1.6.0] - 2026-04-11

### Changed
- Backup: device list now sorted by name instead of ID

---

## [1.5.3] - 2026-04-11

### Fixed
- Import: chunked upload finalize route now registered before the generic chunk route, fixing "Invalid chunk index" error at end of upload

---

## [1.5.2] - 2026-04-11

### Fixed
- Import: large ZIP files now upload in 10 MB chunks, fixing failures behind Cloudflare and other proxies with request body size limits

---

## [1.5.1] - 2026-04-10

### Fixed
- Docker: web and storefront now wait for the API to be fully ready before starting, preventing ECONNREFUSED on first boot

---

## [1.5.0] - 2026-04-10

### Added
- Templates: reference link label field — name the link (e.g. "EveryMac") alongside the URL
- Seed: rarity values set for all 230 Mac/Apple templates; link labels derived from URL on first seed
- i18n: Spanish (Español) language support across web and iOS

### Fixed
- iOS and Web: deleting tags, accessories, and links on device detail now requires confirmation
- Categories and templates now seed automatically on first startup — no manual seed step needed
- Applying a template now creates a DeviceLink instead of storing URL in the legacy externalUrl field

---

## [1.4.1] - 2026-04-06

### Fixed
- Web: Restore scroll position when returning to device list via back navigation
- iOS: Location detail device rows now match list view spacing and full-width separators

---

## [1.4.0] - 2026-04-06

### Added
- iOS: Locations list view accessible from the main menu
- iOS: Create a new location inline from the Add/Edit device form
- Web: Larger 1:1 thumbnails on location detail device list

---

## [1.3.0] - 2026-04-05

### Added
- Structured location system: create named locations (e.g. "Shelf A", "Box B") and assign devices to them
- Each location has a persistent URL and QR code for printing asset tags — scanning navigates directly to that location
- Location detail page shows all devices stored there with thumbnails
- iOS: tapping a device's location navigates to the location detail view
- iOS: location picker in add/edit device replaces free-text field
- iOS: scanning a location QR code opens the location detail view
- iOS: location deep links (inventorydifferent://locations/{id} and universal links) navigate to the location view

### Fixed
- iOS: timeline scroll restoration now returns to the exact tapped device's year instead of the previous year

---

## [1.2.1] - 2026-04-05

### Added
- iOS: timeline device entries are now tappable and navigate to device detail
- iOS: redesigned device detail screen with Precision Editorial layout — hero image with text overlay, indicator grid, valuation cards, inline media/maintenance/notes sections

### Fixed
- iOS: timeline scroll position is approximately preserved (by year) when navigating to a device detail and returning

---

## [1.2.0] - 2026-04-05

### Added
- iOS: camera option when adding device photos — snap directly without saving to the photo library first
- iOS: status indicator icons moved to bottom of thumbnail image in card/grid view, matching web card layout

### Changed
- iOS: status icon pill in grid card now uses a translucent light/dark adaptive background for legibility
- iOS: "Mark for Sale" quick action now uses the storefront icon instead of the tag icon

---

## [1.1.9] - 2026-04-05

### Changed
- Device card: status icon row overlay is now transparent (no background)

### Fixed
- Timeline: event titles and descriptions now display in the correct language — translations were not applied to existing databases due to seed-only data

---

## [1.1.8] - 2026-04-04

### Changed
- Device card: status icon row moved to an overlay bar along the bottom of the thumbnail image to save card space
- Wishlist: template picker now only appears when adding a new item, not when editing an existing one

---

## [1.1.7] - 2026-04-04

### Added
- Manage Categories: delete button with guard — blocked if any devices are assigned to the category

### Changed
- iOS: date fields now use app language locale (not device locale) in device detail, task rows, and note rows
- iOS: currency symbol now respects app language setting (€ for German, $ for English)
- iOS: add/edit device and edit device screens fully translated (en/de)
- Stats page: chart labels for status, functional status, rarity, and category type now display in the selected language
- Timeline: event titles and descriptions now display in the selected language; German and French translations added for all built-in events; legend labels translated; Cultural category removed from legend

---

## [1.1.5] - 2026-04-04

### Added
- iOS: full i18n support — LocalizationManager with runtime language switching, Translations structs (en/de), Settings.bundle language picker (System Default / English / Deutsch), all views updated to use localized strings

### Changed
- Web: financials chart legend/labels, stats chart section headings, backup/export page, print page, and template form all use translation keys (en/de)
- Web: login page and chat panel fully translated (en/de)

---

## [1.1.4] - 2026-04-04

### Fixed
- DeviceCard test updated to expect translated status label

---

## [1.1.3] - 2026-04-04

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
