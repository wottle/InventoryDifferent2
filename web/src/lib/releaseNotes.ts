export const APP_VERSION = '1.1.5';

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
    added: [],
    changed: [],
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
