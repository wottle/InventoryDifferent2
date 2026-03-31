export const APP_VERSION = '1.0.0';

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
