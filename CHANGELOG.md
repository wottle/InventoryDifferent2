# Changelog

All notable changes to InventoryDifferent will be documented here.

## [Unreleased]

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
