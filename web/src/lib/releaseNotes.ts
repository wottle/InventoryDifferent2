export const APP_VERSION = '1.0.4';

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
    version: '1.0.4',
    date: '2026-04-03',
    added: [
      'Rarity gem icon on device cards and list view — color-coded from gray (common) to yellow (uncommon) to green (rare); also shown in iOS device list',
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
