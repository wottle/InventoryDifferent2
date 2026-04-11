export const APP_VERSION = '1.7.0';

export interface ReleaseEntry {
  version: string;
  date: string;
  added?: string[];
  changed?: string[];
  fixed?: string[];
}

export const releaseNotes: ReleaseEntry[] = [
  {
    version: 'Unreleased',
    date: '',
    added: [
      'Showcase: new public showcase site with journeys, chapters, featured devices, quotes, and configurable appearance',
    ],
    changed: [],
    fixed: [],
  },
  {
    version: '1.7.0',
    date: '2026-04-11',
    added: [
      'Backup: CSV import — upload a CSV file and map its columns to device fields for bulk import without needing a ZIP export',
    ],
    changed: [],
    fixed: [
      'Web: add photo, maintenance log, and note buttons no longer appear when not logged in',
      'Storefront: browsing to a non-shop item by ID now shows a helpful "not available" page instead of exposing the item',
    ],
  },
  {
    version: '1.6.1',
    date: '2026-04-11',
    added: [],
    changed: [
      'Backup: table headers are now clickable to sort by any column (ID, category, name, year, status, images, notes)',
    ],
    fixed: [],
  },
  {
    version: '1.6.0',
    date: '2026-04-11',
    added: [],
    changed: [
      'Backup: device list now sorted by name instead of ID',
    ],
    fixed: [],
  },
  {
    version: '1.5.3',
    date: '2026-04-11',
    added: [],
    changed: [],
    fixed: [
      'Import: chunked upload finalize route now registered before the generic chunk route, fixing "Invalid chunk index" error at end of upload',
    ],
  },
  {
    version: '1.5.2',
    date: '2026-04-11',
    added: [],
    changed: [],
    fixed: [
      'Import: large ZIP files now upload in 10 MB chunks, fixing failures behind Cloudflare and other proxies with request body size limits',
    ],
  },
  {
    version: '1.5.1',
    date: '2026-04-10',
    added: [],
    changed: [],
    fixed: [
      'Docker: web and storefront now wait for the API to be fully ready before starting, preventing ECONNREFUSED on first boot',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-04-10',
    added: [
      'Templates: reference link label field — name the link (e.g. "EveryMac") alongside the URL',
      'Seed: rarity values set for all 230 Mac/Apple templates; link labels derived from URL on first seed',
      'i18n: Spanish (Español) language support across web and iOS',
    ],
    changed: [],
    fixed: [
      'iOS and Web: deleting tags, accessories, and links on device detail now requires confirmation',
      'Categories and templates now seed automatically on first startup — no manual seed step needed',
      'Applying a template now creates a DeviceLink instead of storing URL in the legacy externalUrl field',
    ],
  },
  {
    version: '1.4.1',
    date: '2026-04-06',
    added: [],
    changed: [],
    fixed: [
      'Web: Restore scroll position when returning to device list via back navigation',
      'iOS: Location detail device rows now match list view spacing and full-width separators',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-04-06',
    added: [
      'iOS: Locations list view accessible from the main menu',
      'iOS: Create a new location inline from the Add/Edit device form',
      'Web: Larger 1:1 thumbnails on location detail device list',
    ],
    changed: [],
    fixed: [],
  },
  {
    version: '1.3.0',
    date: '2026-04-05',
    added: [
      'Structured location system: create named locations (e.g. "Shelf A", "Box B") and assign devices to them',
      'Each location has a persistent URL and QR code for printing asset tags — scanning navigates directly to that location',
      'Location detail page shows all devices stored there with thumbnails',
      'iOS: tapping a device\'s location navigates to the location detail view',
      'iOS: location picker in add/edit device replaces free-text field',
      'iOS: scanning a location QR code opens the location detail view',
      'iOS: location deep links (inventorydifferent://locations/{id} and universal links) navigate to the location view',
    ],
    changed: [],
    fixed: [
      'iOS: timeline scroll restoration now returns to the exact tapped device\'s year instead of the previous year',
    ],
  },
  {
    version: '1.2.1',
    date: '2026-04-05',
    added: [
      'iOS: timeline device entries are now tappable and navigate to device detail',
      'iOS: redesigned device detail screen with Precision Editorial layout — hero image with text overlay, indicator grid, valuation cards, inline media/maintenance/notes sections',
    ],
    changed: [],
    fixed: [
      'iOS: timeline scroll position is approximately preserved (by year) when navigating to a device detail and returning',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-04-05',
    added: [
      'iOS: camera option when adding device photos — snap directly without saving to the photo library first',
      'iOS: status indicator icons moved to bottom of thumbnail image in card/grid view, matching web card layout',
    ],
    changed: [
      'iOS: status icon pill in grid card now uses a translucent light/dark adaptive background for legibility',
      'iOS: "Mark for Sale" quick action now uses the storefront icon instead of the tag icon',
    ],
    fixed: [],
  },
  {
    version: '1.1.9',
    date: '2026-04-05',
    added: [],
    changed: [
      'Device card: status icon row overlay is now transparent (no background)',
    ],
    fixed: [
      'Timeline: event titles and descriptions now display in the correct language — translations were not applied to existing databases due to seed-only data',
    ],
  },
  {
    version: '1.1.8',
    date: '2026-04-04',
    added: [],
    changed: [
      'Device card: status icon row moved to an overlay bar along the bottom of the thumbnail image to save card space',
      'Wishlist: template picker now only appears when adding a new item, not when editing an existing one',
    ],
    fixed: [],
  },
  {
    version: '1.1.7',
    date: '2026-04-04',
    added: [
      'Manage Categories: delete button with guard — blocked if devices are assigned to the category',
    ],
    changed: [
      'Stats page: chart labels for status, functional status, rarity, and category type now display in the selected language',
      'Timeline: event titles and descriptions now display in the selected language (German and French translations added for all built-in events); legend labels translated; Cultural category removed from legend',
    ],
    fixed: [],
  },
  {
    version: '1.1.6',
    date: '2026-04-04',
    added: [
      'French language support (Français) — full translations for iOS app and web app',
      'iOS: Settings.bundle now includes French language option',
      'Web: French translation file (fr.ts) with complete UI translations',
      'Documentation: language switching instructions added to README and CLAUDE.md',
    ],
    changed: [
      'iOS: date fields now use app language locale (not device locale) in device detail, task rows, and note rows',
      'iOS: currency symbol now respects app language setting (€ for German/French, $ for English)',
      'iOS: add/edit device and edit device screens fully translated (en/de/fr)',
      'iOS: barcode scanner view fully translated (en/de/fr)',
      'Web: barcode scanner modal fully translated (en/de/fr)',
    ],
    fixed: [],
  },
  {
    version: '1.1.5',
    date: '2026-04-04',
    added: [
      'iOS: full i18n support — LocalizationManager with runtime language switching, Translations structs (en/de), Settings.bundle language picker (System Default / English / Deutsch), all views updated to use localized strings',
    ],
    changed: [
      'Web: financials chart legend/labels, stats chart section headings, backup/export page, print page, and template form all use translation keys (en/de)',
      'Web: login page and chat panel fully translated (en/de)',
    ],
    fixed: [],
  },
  {
    version: '1.1.4',
    date: '2026-04-04',
    added: [],
    changed: [],
    fixed: [
      'DeviceCard test updated to expect translated status label',
    ],
  },
  {
    version: '1.1.3',
    date: '2026-04-04',
    added: [],
    changed: [
      'i18n: all remaining sub-pages (timeline, stats, usage, trash, categories, financials, wishlist, custom fields, templates, print) and device form fully translated (en/de)',
    ],
    fixed: [],
  },
  {
    version: '1.1.2',
    date: '2026-04-03',
    added: [],
    changed: [
      'i18n: main menu, nav tooltips, inventory footer, device detail section headers, field labels, forms, and all inline buttons now translated (en/de)',
      'i18n: status badge on card view, table column headers, icon tooltips, currency symbol, and accessory suggestions now translated (en/de)',
    ],
    fixed: [],
  },
  {
    version: '1.1.1',
    date: '2026-04-03',
    added: [],
    changed: [],
    fixed: [
      'LANGUAGE env var now correctly applied at runtime — setting it in docker-compose no longer requires a rebuild',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-04-03',
    added: [
      'i18n infrastructure: LANGUAGE env var (en/de) controls UI language across web app; enum labels (status, condition, rarity, functional status) and filter panel now fully translated',
    ],
    changed: [],
    fixed: [],
  },
  {
    version: '1.0.7',
    date: '2026-04-03',
    added: [],
    changed: [
      'Rarity color scheme: common=gray, uncommon=green, rare=sage, very rare=blue, extremely rare=purple (web and iOS)',
      'Rarity icon moved to right of label on web device detail screen',
    ],
    fixed: [],
  },
  {
    version: '1.0.6',
    date: '2026-04-03',
    added: [],
    changed: [
      'Rarity indicator changed from gem to crown icon; color-coded by rarity level on web cards, list, and iOS',
      'Functional status, rarity, and PRAM battery icons now shown next to their field labels on web and iOS device detail screens',
      'Status indicators row added to iOS grid card view',
      'iOS: sort by Condition and Rarity (most rare first)',
    ],
    fixed: [],
  },
  {
    version: '1.0.5',
    date: '2026-04-03',
    added: [],
    changed: [
      'Rarity gem icon repositioned to status indicators row (between functional status and asset tag); now uses custom faceted gem shape on web and iOS',
      'Rarity sort puts most rare first when sorting ascending (web and iOS)',
    ],
    fixed: [],
  },
  {
    version: '1.0.4',
    date: '2026-04-03',
    added: [
      'Rarity diamond icon in status indicators — color-coded from gray (common) to yellow (uncommon) to green (rare); shown on web cards, list view, and iOS device list',
      'iOS: sort by Condition and Rarity',
    ],
    changed: [],
    fixed: [
      'Sort by condition and rarity now works — fields were missing from the device list query',
    ],
  },
  {
    version: '1.0.3',
    date: '2026-04-02',
    added: [
      'Sort devices by condition or rarity on the inventory page',
    ],
    changed: [],
    fixed: [
      'Filtering by condition or rarity now correctly applies to the API query',
    ],
  },
  {
    version: '1.0.2',
    date: '2026-04-02',
    added: [
      'AI image generation page: thumbnail mode selector (Both/Light/Dark) and source image priority explanation',
    ],
    changed: [],
    fixed: [],
  },
  {
    version: '1.0.1',
    date: '2026-04-01',
    added: [
      'iOS: persistent field labels on add/edit device and wishlist forms — fields are now identifiable even when filled',
      'Light/dark mode thumbnails — set separate thumbnails for light and dark mode; web, iOS, and storefront automatically display the correct one based on the current color scheme',
    ],
    changed: [],
    fixed: [
      'Condition and rarity fields now display on device detail page and pre-populate correctly in edit form',
      'Template sorting on manage templates page is now case-insensitive',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-03-31',
    added: [
      'Wishlist page with priority badges, grouping, and "Mark as Acquired" flow',
      'Stats page with collection composition charts (status, condition, category, acquisition year, manufacturer)',
      'Timeline page — devices by release year interspersed with historical tech milestones',
      'Value history chart per device (auto-snapshots estimatedValue on save)',
      'AI product image generation via OpenAI',
      'Custom fields with public/private visibility control',
      'MCP server with read and write tools for AI assistant integration',
      'iOS: grid tile view mode with adaptive columns, wishlist, value history chart, voice AI chat',
      '286 device templates including Apple III, Power Mac mid-range towers, and Mac Pro 2006–2012',
    ],
    changed: [
      'Device status AVAILABLE renamed to COLLECTION',
      'Docker compose DB credentials now use environment variables with defaults',
    ],
    fixed: [
      'Prepared repo for public release: removed personal domains, Apple Team ID, and hardcoded secrets',
    ],
  },
];
