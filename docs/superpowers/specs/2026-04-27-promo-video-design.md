# InventoryDifferent Promo Video — Design Spec

## Context

The goal is to produce a promotional video for InventoryDifferent — a vintage computer collection management system — to share with other collectors who might want to adopt it. The video needs to communicate the full capability of the system (web admin, iOS app, public storefront, AI chat, and The Archive showcase) in a way that resonates with the vintage computing community. The retro aesthetic of the app itself is a natural visual identity for the video.

Two cuts will be produced from a single recording session:
- **YouTube cut**: ~3:10, full feature walkthrough
- **Social cut**: ~75 sec, punchy highlights (scenes marked below)

---

## Visual Style

**Text overlays**: Rainbow Stripe aesthetic — matches the app's own identity
- Background: `#111` (near-black)
- Accent stripe: `linear-gradient(90deg, #ff6b6b, #ffa94d, #ffe066, #69db7c, #4dabf7, #cc5de8)`
- Headline font: System sans-serif, 800 weight, white, tight letter-spacing
- Label font: `Share Tech Mono`, monospace, small caps, `#888`
- Each scene card: thin rainbow stripe at top, label above headline

**Music**: Royalty-free synthwave/retrowave (100–120 BPM). Recommended sources:
- Pixabay Music (free) — search "synthwave" or "outrun"
- Uppbeat (free tier) — retrowave category
- Chosic (free) — synthwave filter

**Editing tools**:
- **Keynote** (free, already on Mac) — create all title cards and text overlay cards; export each as a short `.mov` clip
- **iMovie** (free, already on Mac) — assemble screen recording clips + Keynote overlay cards + music

**Screen capture**: macOS built-in screen recording (QuickTime) for web. iPhone Mirroring + QuickTime for iOS scenes.

---

## Scene Breakdown

### Act 1 — The Hook

| # | Duration | Social? | On Screen | Text Overlay |
|---|----------|---------|-----------|--------------|
| 01 | ~5s | ✓ | Close-up of a messy spreadsheet — overflowing columns, mismatched data | *"You collect vintage computers."* → *"Tracking them is another story."* |
| 02 | ~4s | ✓ | Title card — black screen with logo/wordmark | *"Meet InventoryDifferent."* |

### Act 2 — The Feature Reel

| # | Duration | Social? | On Screen | Text Overlay |
|---|----------|---------|-----------|--------------|
| 03 | ~18s | ✓ | Web dashboard card grid — pan across devices, toggle to table view, search in action | *"Every machine. At a glance."* |
| 04 | ~15s | | Device detail — images, specs, notes, maintenance history scrolling | *"The full story of every device."* |
| 05 | ~18s | ✓ | iPhone — list view scrolling, tap into device detail, swipe between tabs (Overview, Specs, Images) | *"Your collection in your pocket."* |
| 06 | ~12s | ✓ | iOS barcode scanner — aim at a device, it matches instantly, navigates to record | *"Find it in seconds."* |
| 07 | ~18s | ✓ | AI chat — type *"Which Mac in my collection is most valuable?"* — watch streaming answer arrive | *"Ask your collection anything."* |
| 08 | ~15s | | Financials page — summary cards, cumulative chart over time, transaction list | *"Know exactly what it's all worth."* |
| 09 | ~12s | | Public storefront — product grid, click into a listing, specs and images | *"Built-in shop for what you're ready to sell."* |

### Act 3 — The Archive (Showcase)

| # | Duration | Social? | On Screen | Text Overlay |
|---|----------|---------|-----------|--------------|
| 10 | ~25s | ✓ | The Archive homepage — journeys grid ("Apple Goes to School", "From Luggable to Featherweight"). Click into a journey — hero image fills screen, chapter cards scroll with device photography and rarity badges. Slow pan across artifact cards. | *"Publish the stories behind the machines."* + URL: `thearchive.inventorydifferent.com` |

### Act 4 — The Close

| # | Duration | Social? | On Screen | Text Overlay |
|---|----------|---------|-----------|--------------|
| 11 | ~12s | | Stats page — donut charts, acquisition-by-year bar chart, top manufacturers | *"Understand your collection at a glance."* |
| 12 | ~10s | ✓ | Full collection grid slowly zooming out — all machines visible | *"Open source. Self-hosted. Yours."* → *"InventoryDifferent"* + GitHub URL |

**Social cut** = scenes 01, 02, 03, 05, 06, 07, 10, 12 — each trimmed to a 5–8 sec excerpt → ~75 sec total

---

## Recording Checklist

Before recording, prepare the environment:

- [ ] **Web**: Browser in full screen, hide bookmarks bar, use a clean browser profile if possible
- [ ] **Data**: Tidy any sensitive financial figures (blur or use round numbers); real collection otherwise
- [ ] **iOS**: iPhone charged, notifications silenced (Do Not Disturb), screen brightness high
- [ ] **iOS Mirroring**: Connect iPhone via USB, open QuickTime → New Movie Recording → select iPhone as camera
- [ ] **Resolution**: Record at highest resolution available (1080p minimum, 4K if possible)
- [ ] **Cursor**: Hide or slow down cursor movement in System Settings for cleaner screen recordings
- [ ] **Scene 10 (Archive)**: Record on a slightly slower scroll — the photography deserves time to read

### Suggested Recording Order

1. Web dashboard scenes (03, 04, 08, 09, 11) — all in one browser session
2. AI chat scene (07) — pick a compelling question that shows real data
3. iOS scenes (05, 06) — use iPhone Mirroring + QuickTime
4. The Archive scenes (10) — separate browser session at thearchive.inventorydifferent.com
5. Problem hook (01) — can fake a spreadsheet or use a real old tracking sheet
6. Title cards (02, 12) — created in Keynote, exported as video clips

---

## Production Notes

### Keynote — Title Cards & Text Overlays

Each scene's text overlay is a short Keynote slide exported as video:

1. **Slide setup**: Set slide size to 1920×1080. Background `#111111`.
2. **Rainbow stripe**: Insert a rectangle, full width, 8px tall, pinned to top. Fill with a linear gradient: `#ff6b6b → #ffa94d → #ffe066 → #69db7c → #4dabf7 → #cc5de8`.
3. **Label text**: Small caps, Share Tech Mono (download free from Google Fonts), `#888888`, ~18pt.
4. **Headline text**: System sans-serif (SF Pro or Helvetica Neue), bold/heavy, white, ~60–72pt, tight tracking.
5. **Animation**: Use "Appear" or a simple fade-in build on the text — no fancy transitions.
6. **Export**: File → Export To → Movie → set duration to match scene length (or export short 1–2 sec card and hold in iMovie).
7. Create one master slide, then duplicate and change copy for each scene. 12 slides total.

### iMovie — Assembly

- Create a new project at 1080p
- Import all screen recording clips and Keynote-exported overlay cards
- For each scene: lay the screen recording on the main track, place the Keynote title card as a cutaway or use iMovie's built-in title tool for simpler overlays
- Music: drag track into the background audio lane; iMovie auto-ducks audio under voiceover (disable ducking if not needed)
- Transitions: use **None** (straight cut) between scenes — avoid iMovie's default crossfade
- For the social cut: duplicate the project, delete non-social scenes, trim each remaining clip to 5–8 sec
- Export: File → Share → File → Resolution 1080p, Quality High, H.264

---

## Deliverables

1. **YouTube cut** — ~3:10, 16:9, H.264/H.265, with title + description copy referencing GitHub
2. **Social cut** — ~75 sec, same aspect ratio (16:9) or cropped to 9:16 for mobile-first platforms
3. *(Optional)* Thumbnail — static frame from Scene 10 (The Archive) or Scene 03 (dashboard), with title text overlay

---

## Verification

- [ ] Watch full YouTube cut end-to-end — does pacing feel right? No scene too long or too short?
- [ ] Watch social cut — does it tell a complete story in 75 sec without the full context?
- [ ] Scene 10 (Archive): is the URL `thearchive.inventorydifferent.com` legible on screen?
- [ ] Scene 12 (Close): is the GitHub URL correct and readable?
- [ ] Audio levels consistent across all scenes — no jarring volume jumps
- [ ] No sensitive financial data visible in any frame
