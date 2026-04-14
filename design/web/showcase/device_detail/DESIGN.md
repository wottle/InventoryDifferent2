# Design System Specification: Precision Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Technical Atelier."** 

We are moving away from the "generic tech" aesthetic toward a high-end, editorial experience that mirrors the precision of luxury horology or aerospace engineering. This system rejects the rigid, boxed-in nature of standard mobile frameworks. Instead, it prioritizes **intentional asymmetry**, **tonal depth**, and **breathable compositions**. 

By utilizing a "Glass-on-Snow" aesthetic, we create a signature visual identity where information doesn't just sit on the screen—it is curated within a physical space. We break the template look by using extreme typographic scale contrasts and overlapping card elements that suggest a continuous, tactile canvas rather than a series of isolated screens.

---

## 2. Colors & Surface Philosophy
Our palette is rooted in a refined spectrum of whites and soft grays, punctuated by "International Blue" and "Liquid Gold" accents.

### The Palette (Key Tokens)
- **Primary (Blue):** `#0058bc` — Used for critical actions and brand presence.
- **Tertiary (Gold):** `#6f5d00` — Used for premium status indicators and highlights.
- **Surface (Background):** `#f9f9fe` — A cool-toned, expansive base.
- **Surface Container (Lowest to Highest):** `#ffffff` to `#e2e2e7`.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders (`#000` or `#CCC`) are strictly prohibited for sectioning. Boundaries must be defined solely through background color shifts. 
*   *Implementation:* Place a `surface-container-lowest` (#ffffff) card on top of a `surface` (#f9f9fe) background. The change in hex value provides all the edge definition required.

### The "Glass & Gradient" Rule
To elevate beyond flat design, use **Glassmorphism** for persistent elements (navigation bars, floating action buttons). Use `surface-container-low` at 80% opacity with a `20px` backdrop-blur. 
*   **Signature Textures:** Apply a subtle linear gradient from `primary` (#0058bc) to `primary-container` (#0070eb) at a 135° angle for primary CTAs to create a "polished sapphire" effect.

---

## 3. Typography: The Editorial Voice
We utilize a San Francisco-style sans-serif (Inter) with a focus on hierarchy that feels like a premium technical journal.

- **Display (Large/Med/Sm):** `3.5rem` down to `2.25rem`. Use these sparingly for hero device names or specification "hero" numbers (e.g., "5nm Chip").
- **Headline (Lg/Md/Sm):** `2rem` to `1.5rem`. These should have tight letter-spacing (-0.02em) to feel authoritative.
- **Body (Lg/Md/Sm):** `1rem` to `0.75rem`. Use `body-md` (#414755) for general descriptions to maintain a softer contrast than pure black.
- **Label (Md/Sm):** `0.75rem` to `0.6875rem`. All labels should be uppercase with +0.05em tracking when used as "Overlines" above headlines.

**Hierarchy Note:** Always pair a `display-lg` value with a `label-md` nearby. This "Big-Small" pairing creates the editorial tension necessary for a high-end feel.

---

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to create "pop"; we use layering to create "presence."

- **The Layering Principle:** Depth is achieved by stacking the surface-container tiers. 
    - *Level 0 (Base):* `surface`
    - *Level 1 (Section):* `surface-container-low`
    - *Level 2 (Interaction):* `surface-container-lowest` (pure white)
- **Ambient Shadows:** Only use shadows for floating modals. Use a `32px` blur, 0px Y-offset, and 4% opacity of the `on-surface` color. It should feel like a soft glow, not a drop shadow.
- **The "Ghost Border" Fallback:** If accessibility requires a stroke (e.g., in high-contrast modes), use `outline-variant` (#c1c6d7) at **15% opacity**. It should be felt, not seen.

---

## 5. Components & Interaction Patterns

### Cards (The Technical Spec Layout)
**Forbid the use of divider lines.** To separate specs (e.g., Battery Life vs. Processor), use `1.5rem` (xl) vertical padding and a background shift to a `surface-container-high` chip for the value. Cards should use the `xl` (1.5rem) roundedness scale for a friendly yet sophisticated feel.

### Buttons
- **Primary:** Gradient fill (Primary to Primary-Container), `full` (pill) rounding, white text.
- **Secondary:** `surface-container-high` background with `on-surface` text. No border.
- **Tertiary:** Pure text using `primary` color with an icon chevron.

### Device Status Chips
Use the `tertiary` (Gold) palette for high-priority status (e.g., "Charging," "Premium") and the `primary` (Blue) for standard status (e.g., "Connected"). Use `sm` (0.25rem) rounding for these chips to distinguish them from the "pill" shaped action buttons.

### Input Fields
Soft-wash backgrounds using `surface-container-low`. Upon focus, the background transitions to `surface-container-lowest` with a 1px "Ghost Border" in `primary`.

### Lists
Lists must not use dividers. Use `surface-container-low` for the list container and `surface-container-lowest` for the individual list items, separated by `0.5rem` (DEFAULT) spacing to create a "gapped" list look.

---

## 6. Do’s and Don'ts

### Do:
- **Do** use negative space aggressively. If a layout feels "full," remove an element or increase the `surface` padding.
- **Do** use `surface-bright` for areas meant to catch the eye, like a featured technical spec.
- **Do** use high-quality iconography with a "thin" or "light" weight to match the SF-style typography.

### Don’t:
- **Don’t** use pure black (#000000). Use `on-surface` (#1a1c1f) for text to keep the aesthetic "soft-modern."
- **Don’t** use "Standard" Material ripples. Use a gentle opacity fade (e.g., 100% to 80%) for touch states to maintain the premium feel.
- **Don’t** use heavy shadows. If you think it needs a shadow, try giving it a slightly lighter background color first.