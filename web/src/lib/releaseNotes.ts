export const APP_VERSION = '3.0.3';

export interface ReleaseEntry {
  version: string;
  date: string;
  added?: string[];
  changed?: string[];
  fixed?: string[];
  isArchive?: boolean;
  dateRange?: string;
  summary?: string;
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
    version: '3.0.3',
    date: '2026-08-12',
    added: [],
    changed: [],
    fixed: [
      'nav bar now hides admin and financial links for unauthenticated users — only Devices, Stats, Timeline, and Slideshow are shown when not logged in',
      'pages that require login (Financials, Wishlist, Categories, Locations, Custom Fields, Trash, Print, Templates, Usage, Backup, Settings, Dashboard, Generate Images) now redirect to the login page instead of rendering a broken or partially broken view',
      'slideshow control bar buttons are now clickable — the active slide was rendering above the controls due to missing z-index; controls also correctly pass through pointer events when hidden so mouse-move detection always works',
      'slideshow controls now auto-hide after 3 seconds of inactivity and reappear on any mouse movement',
      'slideshow progress bar now renders correctly — a broken wrapper div with position:relative was collapsing to zero height and hiding it',
      'slideshow historical notes now load reliably — notes are fetched with the initial device list instead of via a fragile lazy-query chain',
      'export/import now preserves historicalNotes, storage entries, and OS entries — these three fields were silently dropped in every export; device relationships were already correctly exported and restored',
    ],
  },
  {
    version: '3.0.2',
    date: '2026-08-12',
    added: [],
    changed: [],
    fixed: [
      'AI image generation: text-description-only mode no longer returns a 400 "Unknown parameter: response_format" error — the model setting is now honoured and response_format is only sent for dall-e models',
      'AI image generation: reference image is now resized to max 1024×1024 before uploading to OpenAI, preventing connection timeouts caused by large original photos',
      'AI image generation: bulk generation page now correctly waits for each job to complete before marking it Done — previously it marked Done immediately after starting the background job, so no images were ever saved',
      'AI image generation: improved error messages — OpenAI rate limits, content policy rejections, API key problems, and timeouts now show specific actionable messages instead of raw SDK errors; bulk generation page shows error text inline instead of only on hover; a contextual hint appears below errors in the modal for content policy, rate limit, and timeout failures',
      'web and showcase Docker images now build on amd64 to avoid QEMU arm64 crashes during npm install',
    ],
  },
  {
    version: '3.0.1',
    date: '2026-08-10',
    added: [
      'Italian (it) language support on web and iOS',
      'Apple serial decoder: added PowerBook 540c, 520c, 180, 190, Macintosh IIx, IIsi, LC 475, LC III, PowerBook 100, Power Mac 8600, G3 Minitower, and 6500/250',
      'Docker Compose files now include CURRENCY env variable mapping (default: USD) so users can set their currency via .env without editing compose files',
    ],
    changed: [],
    fixed: [
      'Privacy policy pages now readable in dark mode on web and storefront',
      'MCP server schema now correctly mirrors the API schema — REPAIRED and LOANED status values, UNKNOWN functional status, custom fields, device relationships, and updated Template fields are all now present',
    ],
  },
  {
    version: '3.0.0',
    date: '2026-07-11',
    added: [
      'iOS: defensive API decoding — the app no longer crashes if the server returns missing or null fields, unknown enum values, or empty arrays; a yellow warning banner appears when the server is older than the app',
      'iOS: app is now App Store ready — custom URL scheme (inventorydifferent://) enables deep linking on any server deployment; Apple-associated-domains file updated with correct Team ID for the primary domain',
    ],
    changed: [],
    fixed: [
      'Web and iOS chat: fixed empty collection responses caused by invalid GraphQL field names (storage, operatingSystem, cpu, graphics) that were removed when the data model was restructured into relation arrays',
      'Storefront container fails to start with "Could not find a production build" due to a stale Docker build cache; the build cache is now correctly invalidated on each release',
    ],
  },
  {
    version: '2.x series',
    date: '',
    isArchive: true,
    dateRange: '2026-04-12 to 2026-07-04',
    summary: 'Showcase public site with editorial journeys; historicalNotes on devices and templates; device relationships; Technical Atelier redesign (inventory page, device detail, slideshow, fisheye view); LOANED status; non-destructive photo editing; video uploads with ffmpeg thumbnails; barcode scanner improvements with Apple serial decoding; iOS home screen widgets; dashboard page; CSV export; guest access controls; currency settings; and the TemplatesDifferent external template catalog.',
  },
  {
    version: '1.x series',
    date: '',
    isArchive: true,
    dateRange: '2026-03-31 to 2026-04-11',
    summary: 'Initial public release — wishlist, stats, timeline, value history chart, AI image generation, custom fields with public/private visibility, MCP server for AI assistant integration, iOS grid tile view and voice AI chat, multi-language i18n (English, German, French, Spanish), rarity and condition fields, structured location system with QR codes, and iOS redesigned device detail.',
  },
];
