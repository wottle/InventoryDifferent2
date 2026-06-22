export const APP_VERSION = '2.8.6';

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
    changed: [
      'Removed the unused legacy /devices-old and /list-classic pages, which were superseded by the current device detail and list designs and still referenced removed spec fields',
    ],
    fixed: [
      'Storefront item detail page failed to load (GraphQL 400) because it still requested the old cpu/graphics/storage/operatingSystem fields after they were renamed/restructured — now queries cpuType, cpuSpeed, graphicsChip, storageEntries, and osEntries',
    ],
  },
  {
    version: '2.8.6',
    date: '2026-06-21',
    added: [],
    changed: [],
    fixed: [
      'API CORS policy now restricted to configured DOMAIN, SHOP_DOMAIN, and SHOWCASE_DOMAIN in production — previously any origin could make cross-origin requests to the GraphQL endpoint',
      'API now sets HTTP security headers via Helmet (X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy, etc.)',
    ],
  },
  {
    version: '2.8.5',
    date: '2026-06-21',
    added: [
      'Currency can now be set independently of language — web: set CURRENCY env var; iOS: Settings → Currency picker (USD, EUR, GBP, CAD, AUD, JPY, MXN, ARS, CLP)',
      'All new device spec fields (CPU Type/Speed, Graphics Chip, Screen Size, Display Type/Variant, Native Resolution, PRAM Battery) now fully translated in English, German, French, and Spanish on both web and iOS',
    ],
    changed: [
      'Currency formatting now uses locale-aware formatting everywhere — euro symbol appears on the right for French, German, and Spanish (15,50 €) and on the left for English (€15.50)',
      'Spanish language now defaults to EUR/€ (targeting Spain); other currencies available via the currency override setting',
      '"Add storage" button label corrected to "Add Storage"',
    ],
    fixed: [
      'Euro symbol placement was wrong in Docker deployments due to Alpine\'s small-icu Node.js build — now installs full ICU data',
      'Web device detail and edit form showed hardcoded English labels for new spec fields regardless of language',
      'iOS device detail, Add Device, and Add Wishlist Item showed hardcoded English labels for new spec fields',
      'PRAM Battery status displayed hardcoded "Installed"/"Removed" regardless of language',
    ],
  },
  {
    version: '2.8.4',
    date: '2026-05-29',
    added: [
      'iOS home screen widgets: Stats (small/medium/large), Device Spotlight (small/medium/large), and Recent Additions (medium)',
    ],
    changed: [],
    fixed: [
      'iOS image viewer now responds to swipe gestures directly on the image when zoomed out, not just the surrounding black area',
      'iOS image viewer resets zoom to fit-to-screen when swiping to a different image',
      'iOS image viewer pinch-to-zoom now zooms toward the pinch center instead of always zooming from the image center',
      'iOS image viewer double-tap now zooms to 3× centered on the tapped point instead of the image center',
    ],
  },
  {
    version: '2.8.3',
    date: '2026-05-28',
    added: [],
    changed: [],
    fixed: [
      'Photos page: edit button no longer appears on top of the thumbnail mode picker and delete confirmation dialogs',
    ],
  },
  {
    version: '2.8.2',
    date: '2026-05-28',
    added: [
      'Trash count badge: a red count indicator appears on the Trash nav item whenever deleted devices are waiting in the trash',
    ],
    changed: [
      'Orphaned files list now shows a thumbnail preview for image files so you can identify them before deleting',
    ],
    fixed: [
      'Deleting a photo now removes all associated files (display copy, thumbnail, and the preserved original from non-destructive editing)',
      'Orphan file scan no longer flags the preserved original of an edited photo as an orphan',
      'Re-editing an already-edited photo no longer accumulates orphaned display copies and thumbnails from previous edits',
    ],
  },
  {
    version: '2.8.1',
    date: '2026-05-27',
    added: [
      'Guest access control: admins can lock the collection to signed-in users only via the Settings page',
      'iOS photo upload: after taking a camera photo, the edit view opens automatically so you can rotate or crop before the image is finalised',
    ],
    changed: [],
    fixed: [
      'Photo editing: rotation not applied to display copy or thumbnail when saving a rotate-only edit (EXIF auto-orient was being silently skipped)',
      'Photo editing iOS: "bad extract area" crash when saving a rotated+cropped image on photos with EXIF orientation metadata',
      'Photo edit modal: auth errors (session expired after server restart) now redirect to login instead of silently failing',
    ],
  },
  {
    version: '2.8.0',
    date: '2026-05-26',
    added: [
      'Non-destructive photo editing: rotate (90° increments) and free-form crop device images from the web gallery and iOS image management — original file is always preserved and edits are reflected in thumbnails and the storefront',
      'Usage page: scan for orphaned files (files on disk not referenced by any image record) and delete them individually or in bulk',
      'Logout endpoint (/auth/logout) revokes the refresh token so a leaked token cannot be used to regain access',
      'iOS barcode scanner: when a serial number is not in your inventory, a bottom sheet now decodes Apple serial numbers (pre-2021) to identify the model and offers to pre-fill the Add Device form',
      'iOS barcode scanner: decoded Apple model now matched against your templates and auto-applied when opening Add Device',
      'iOS serial decoder: full modern model table (~9000 entries) replacing placeholder stubs; new vintage codes for Macintosh Portable, PowerBook Duo 270c, PowerBook 165, and PowerBook 190cs',
      'iOS barcode scanner: "Not this model?" button on the not-found sheet strips the decoded model prefill so you can add the device with serial number only',
      'iOS barcode scanner: camera now correctly restarts after the Add Device sheet is dismissed',
      'iOS serial capture (edit device): URL QR codes are now ignored so scanning near a QR code does not overwrite the serial number field',
      'Web barcode scanner: when a serial is not in inventory, identifies the model (Apple serials pre-2021), shows a not-found sheet with model name and year, and offers to pre-fill the Add Device form (authenticated users only — guests see lookup results only)',
      'Web barcode scanner: URL QR codes that are not app deep-links now show a hint instead of producing a "No device found" error',
      'Web barcode scanner: serial number is now pre-filled in the Add Device form when navigating from the not-found sheet',
    ],
    changed: [],
    fixed: [
      'Sessions now survive API server restarts — JWT secret is persisted in the database rather than regenerated on each boot',
      'Showcase admin: new journey now appears in the journeys list immediately after creation without requiring a page refresh',
      'Storefront Looking For page now shows the additional name (variant info) below the device name',
      'Dashboard thumbnails now respect browser light/dark mode (uses the same mode-specific thumbnail picker as the inventory grid)',
      'Search now includes OS, release year, category name, custom field values, and (when authenticated) acquisition source — previously these fields were silently excluded',
      'Barcode scanner serial number lookup now correctly filters by serial number — previously the filter was silently ignored and the first device in the database was always returned',
      'Restoring a device from the trash now immediately reflects in the inventory list — the Apollo cache is evicted on restore so the list does not serve stale data',
    ],
  },
  {
    version: '2.7.0',
    date: '2026-05-09',
    added: [
      'Settings page (/settings) — configure the AI image generation prompt and model (gpt-image-1.5 or gpt-image-2)',
      'Added "Unknown" as a fourth functional status (gray question mark icon); new devices default to Unknown instead of Fully Working',
      'Dashboard page (/dashboard) — unified recent activity feed (acquisitions, status changes, maintenance, notes, power-on events), auth-gated financial snapshot, needs-attention alerts (in repair, PRAM battery pending, unknown condition), and collection health metrics (no images, no notes, missing CPU/RAM specs)',
      'Video uploads — attach short clips to devices alongside photos; ffmpeg generates a thumbnail frame and duration badge; inline player on web, AVPlayer on iOS',
      'Video thumbnail generation is now async — uploads return immediately and the thumbnail appears after ffmpeg finishes in the background (fixes Cloudflare 524 timeouts on large videos)',
      'Device photos page: click any thumbnail to view it full-size in a lightbox; navigate between images and videos with prev/next arrows or keyboard arrow keys',
      'Device detail page: video thumbnails now show the play button overlay and duration badge; lightbox now plays videos with full media controls instead of showing a broken image',
    ],
    changed: [
      'LOANED status color changed from sky blue to violet (lilac) on web and iOS — distinguishes it from IN_REPAIR (teal) and FOR_SALE (blue)',
    ],
    fixed: [
      'iOS: thumbnail not refreshing on the device list after setting or replacing a thumbnail — now invalidates the full image cache and updates the list store immediately',
      'iOS: clearing the Additional Name field and saving no longer leaves the old value — empty field now sends null to the API',
      'Dashboard collection health metrics now exclude sold, donated, and returned devices from counts; missing-specs count also excludes accessories',
      'iOS: thumbnail change from the device detail view now immediately updates the device list (was only partially invalidating cache and not refreshing the list store)',
      'iOS: manage photos overlay buttons now have proper 44pt touch targets and a darkened overlay background for visibility',
      'iOS: device detail hero image now updates immediately when thumbnail is changed from the Photos tab',
      'iOS: wide/landscape thumbnail images no longer cause layout overflow on the device detail page or grid tiles — switched from ZStack to Color.clear + overlay pattern to give images a bounded layout size',
      'iOS: device list thumbnail now reliably updates after a thumbnail change — switched from single-device refresh to full list reload',
    ],
  },
  {
    version: '2.6.0',
    date: '2026-05-03',
    added: [
      'Redesigned device detail page — cinematic hero, editorial 12-column layout, accessories, related devices, links, and photos sub-page',
      'Value history popover on the Estimated Value card — chart anchors to the card, dismisses on outside click or Escape',
      'New list page design — Technical Atelier editorial aesthetic with glassmorphic cards, grid/table view toggle with sortable columns, inline filter/sort bar, persistent view mode and scroll position, and new glassmorphic nav with full More dropdown menu',
      'Barcode/QR scanner button in the filter bar on the main inventory page — scans QR deep-links, device URLs, or serial numbers to navigate directly to the matching device',
      'Fisheye view mode on inventory page — circular thumbnail grid with proximity-based zoom effect',
      'Slideshow view — fullscreen device showcase with Ken Burns imagery, configurable slide duration, favorites filter, random or chronological order, and timed historical notes reveal',
      'LOANED status for devices temporarily lent to others — sky blue badge, counts toward estimated value, lifecycle action returns device to collection',
    ],
    changed: [
      'Device detail (/devices) now uses the new Technical Atelier design; old layout archived at /devices-old',
      'Refined list and card view typography to match the device detail editorial style',
      'All admin sub-pages now use the new Technical Atelier nav bar — route group (main) replaces per-page retro headers',
      'Technical Atelier list design promoted to main page (/); classic design archived at /list-classic',
      'Nav bar settings gear replaced with a person icon — gray links to login when signed out, blue shows a logout dropdown when signed in',
      'Page and nav bar background updated to warm gray (#e5e5e5 light / #2d2d2d dark) for a softer editorial feel',
      'Redesigned inventory table with 10 columns (category, thumbnail, name, year, make/model, date acquired, value, location, status, indicators) with responsive column hiding',
      'Device card value row now uses status-matched color (green for collection, orange for for sale, red for sold, etc.) instead of blue; "For Sale" prefix replaces "List"',
    ],
    fixed: [
      'Monthly cash flow chart on financials page now scrolls to the most recent months on load',
      'Cash flow chart Y-axis stays pinned on the left while scrolling horizontally through periods',
      'iOS: saving a device with custom field changes no longer fails with "Save Failed"',
      'Custom field values now display on the device detail page even when the device has no technical specifications',
      'iOS: hardcoded English strings in redesigned device detail view replaced with translations (remove tag alert, relationship inverse labels)',
      'Web: hardcoded English section headers and tooltip text in device detail page replaced with translations (Quick Overview, Quick Actions, Manufacturer & Model, Serial Number, Location, Last Used, Device Notes, button tooltips)',
      'Web: hardcoded English indicator labels and values, financial card labels, value history popover text, and Technical Specifications section replaced with translations across all four languages',
      'Web: hardcoded English in Lifecycle Actions buttons, Photos/Notes/Maintenance Logs section headers, View all, Show more/Collapse, Add Maintenance Log and Add Note modals, Mark as Sold/Returned modals, and Remove Tag modal replaced with translations',
      'iOS PWA: status bar is now transparent (black-translucent) so the header extends edge-to-edge with no white bar',
      'Mobile: inventory grid now shows two cards per row on large phones (480px+) instead of one',
      'Mobile: More tab now opens a slide-up sheet with all extra pages instead of navigating directly to Stats',
      'Slideshow: fullscreen button in the control bar enters true browser fullscreen, hiding the address bar and browser chrome on all platforms',
      'Slideshow: crossfade between slides — two permanent slots alternate so the background slide\'s Ken Burns animation continues from where it was, eliminating the position-reset jitter',
    ],
  },
  {
    version: '2.5.2',
    date: '2026-04-19',
    added: [
      'iOS: device relationships — link devices to each other with typed relationships (accessory, software, manual, installed inside, etc.) shown in the Related Devices section on both devices',
      'Add periodic cash flow chart to financials pages (web and iOS) — diverging bars show spending vs. receiving per month or year with a net cash line; toggle between monthly and yearly view; horizontally scrollable',
      'Add floating share button to showcase journey and device detail pages — share to Twitter/X, Facebook, or copy the page link',
    ],
    changed: [
      'Related device rows are now tappable and navigate directly to the linked device (iOS and web)',
      'Incoming relationships can now be removed with confirmation, same as outgoing (iOS and web)',
      'Relationship direction can now be swapped when adding — shows a live preview of which device is the source and which is the target',
      'iOS: device detail Photos, Maintenance Logs, and Notes are now child navigation views instead of tabs — tapping "View More" pushes into a full-screen view; back returns to the detail, not the device list',
    ],
    fixed: [],
  },
  {
    version: '2.5.1',
    date: '2026-04-18',
    changed: [],
    added: [
      'Device relationships: link devices to each other with typed relationships (accessory, software, manual, installed inside, etc.) visible from both devices',
      'iOS: adding a new device now automatically opens its detail view',
      'iOS: "Powered On Today" button restored to the Lifecycle Actions card for devices in Collection or In Repair status',
    ],
    fixed: [
      'iOS: thumbnails in the device list no longer go blank when returning from the background',
      'iOS: saving a new device no longer fails with an encoding error when condition or rarity are unset',
    ],
  },
  {
    version: '2.5.0',
    date: '2026-04-18',
    added: [
      'Web Backup page: new Export to CSV section. Pick fields, drag to reorder columns, optional preview of first 5 rows, and download. Images are not included. One-to-many relationships (notes, maintenance tasks, accessories, links, tags, custom fields) are joined into a single cell per device using " | " as the separator, so every device remains one row.',
      'Web Backup page: new Device Selection section header clarifies that the device table feeds both Export Devices (ZIP) and Export CSV. The Filter button now lives here next to the list it controls, instead of the page header.',
      'Showcase journeys: new Volume Number field. Leave blank to auto-assign based on publish date order (earliest = Volume I), or set an explicit volume number for editorial control. The detail page displays the effective volume (explicit or computed) as a Roman numeral (I, II, III...).',
      'Showcase data export now downloads a ZIP file bundling appearance settings, quotes, journeys, and uploaded images (hero and journey covers); import accepts ZIP or the legacy JSON format and reports any image references that were missing from the archive.',
    ],
    changed: [
      'Web Backup page: all four import/export sections (Import Devices, Import CSV, Export Devices, Export CSV) are now collapsible and collapsed by default.',
      'Showcase Journeys page: published dates now include the day of the month.',
    ],
    fixed: [
      'Showcase mobile: homepage featured journey and quotes now stack vertically; nav gains a hamburger menu; timeline era filter and category deselect now respond correctly to touch',
    ],
  },
  {
    version: '2.4.0',
    date: '2026-04-16',
    added: [
      'Showcase admin: export and import appearance, quotes, and journeys as a JSON file; devices missing on the target system are silently dropped from chapters',
      'Showcase: multi-language support via the LANGUAGE env var (en/de/fr/es), matching web and iOS',
      'Showcase: Umami analytics integration via SHOWCASE_UMAMI_SRC and SHOWCASE_UMAMI_WEBSITE_ID environment variables',
      'Showcase homepage: empty placeholder box replaced with a second random quote card',
      'Showcase journey chapters: descriptions are now optional',
    ],
    changed: [
      'Showcase journeys listings (homepage and /journeys) now sort newest to oldest by publishedAt',
      'MCP tools and AI chat device-details responses now include historicalNotes',
    ],
    fixed: [
      'Showcase export/import 404 — added proxy rewrites in showcase next.config so /showcase/export and /showcase/import reach the API server',
      'Showcase journey publish date now formats with the configured LANGUAGE locale',
      'Showcase device detail gallery now excludes images flagged as thumbnails',
      'AI image generation: when assigning a LIGHT or DARK thumbnail to a device that already has a BOTH thumbnail, the BOTH is now promoted to the converse mode (DARK or LIGHT) instead of being unset entirely — fixes both web and iOS which share the /generate-image endpoint',
    ],
  },
  {
    version: '2.3.0',
    date: '2026-04-13',
    added: [
      'iOS: Historical Notes field now displayed below Technical Specifications on device detail and editable in the Add/Edit form',
    ],
    changed: [],
    fixed: [],
  },
  {
    version: '2.2.0',
    date: '2026-04-13',
    added: [
      'historicalNotes field on Device and Template — stores model-level historical context, seeded from templates when creating a device',
      'Showcase timeline and device detail pages show historicalNotes instead of the condition info field',
      'Template admin form includes a Historical Notes textarea',
      'Device form includes a Historical Notes field, pre-filled from template when one is applied',
      'Expanded historical notes seed — covers NeXT Cube/Station variants, PowerBook Duo, LC family, Quadra 605/630/660AV/900/950, PowerBook G3 series, Power Mac mid-range towers, Xserve, and 60+ additional templates',
      'Fix historical notes for all Apple Newton MessagePad and eMate templates (prior seed used wrong name prefix); add notes for Apple Studio Display CRT and LCD models',
      'Journey editor device thumbnails now use LIGHT → DARK → BOTH → first image priority in both the chapter device list and the Add Device search modal',
      'Journey editor: devices within a chapter can now be reordered using up/down buttons; order persists immediately to the server',
      'Journey editor: chapters within a journey can now be reordered using up/down buttons; chapter title input now shows a focus ring so it is clearly editable',
      'Journeys now have a published date — set on first publish, shown on the journey list and in the journey editor stats panel',
      'Showcase homepage journey cards: cover images now visible at full opacity on hover; dark overlay fades away to reveal the full image',
      'Showcase homepage: Featured Journey tile replaces static archive placeholder; Narrative Statement and Collection Overview fields now configurable from Appearance admin',
    ],
    fixed: [
      'Showcase homepage quote card now pulls a random enabled quote from the database instead of a hardcoded Dieter Rams quote',
      'Historical Notes field not pre-populated when editing an existing device — field was missing from the edit page device query',
    ],
  },
  {
    version: '2.1.0',
    date: '2026-04-13',
    added: [
      'Seed 22 default showcase quotes from Apple history figures (Jobs, Ive, Wozniak, Raskin, Kare, Rams, Tognazzini, Think Different)',
      'Journey editor device search now shows additional name and supports searching by it',
      'Journey cover image upload in the journey editor; displayed on journey list and homepage',
      'Showcase public pages now use full-resolution images instead of thumbnails',
    ],
    changed: [],
    fixed: [
      'Showcase footer rendered before page content instead of after it',
      'Showcase hero image not displaying on homepage',
      'Showcase device detail and journey pages double-prefixing image URLs causing 404s',
      'Journey editor device thumbnails broken due to double /uploads/ prefix',
      'Showcase device page restoration section mislabeled as Provenance',
      'Default showcase quotes not appearing — auto-seed on startup if table is empty; admin was showing only enabled quotes making disabled ones unrecoverable',
      'Featured artifacts showing counter instead of device ID; using first image instead of designated thumbnail',
      'Showcase image selection now prefers light-mode thumbnail, then dark-mode, then both-mode, then first image',
      'Journey editor now shows device additional name for existing chapter devices',
    ],
  },
  {
    version: '2.0.0',
    date: '2026-04-12',
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
