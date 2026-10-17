# M3 Design Tokens

Seed color: **#4F46E5** (indigo). No canonical brand color existed; the old CSS used slate #0f172a for buttons. All roles derive from this seed. Tokens live in `apps/web/src/app/globals.css` as CSS variables and map to Tailwind utilities in `apps/web/tailwind.config.ts` (e.g. `bg-primary-container`, `text-on-surface`, `shadow-elevation-2`, `rounded-m3-lg`).

## Color roles — light

| Role | Value | Use |
|---|---|---|
| primary | #4F46E5 | Filled buttons, active states, focus rings |
| on-primary | #FFFFFF | Text/icons on primary |
| primary-container | #E0E7FF | Tonal buttons, highlights |
| on-primary-container | #1E1B4B | Text on primary-container |
| secondary | #5B5BD6 | Secondary actions |
| on-secondary | #FFFFFF | Text on secondary |
| secondary-container | #E4E4FF | Tonal surfaces, selected nav |
| on-secondary-container | #1E1E4D | Text on secondary-container |
| tertiary | #0E7490 | Tertiary accents, info |
| on-tertiary | #FFFFFF | Text on tertiary |
| tertiary-container | #CFFAFE | Tertiary surfaces |
| on-tertiary-container | #083344 | Text on tertiary-container |
| error | #B3261E | Errors, destructive actions |
| on-error | #FFFFFF | Text on error |
| error-container | #F9DEDC | Error surfaces |
| on-error-container | #410E0B | Text on error-container |
| surface | #FEFBFF | Page background |
| on-surface | #1C1B1F | Primary text |
| on-surface-variant | #49454F | Secondary text |
| surface-variant | #E7E0EC | Variant surfaces |
| surface-container-lowest | #FFFFFF | Lowest container |
| surface-container-low | #F7F2FA | Cards |
| surface-container | #F3EDF7 | Default container |
| surface-container-high | #ECE6F0 | Dialogs, hover |
| surface-container-highest | #E6E0E9 | Highest container |
| outline | #79747E | Borders, inputs |
| outline-variant | #CAC4D0 | Subtle borders |
| inverse-surface | #322F35 | Snackbars |
| inverse-on-surface | #F5EFF7 | Text on snackbars |
| inverse-primary | #C7D2FE | Primary on inverse surfaces |
| success | #15803D | Positive states |
| success-container | #DCFCE7 | Positive surfaces |
| warning | #B45309 | Warning states |
| warning-container | #FEF3C7 | Warning surfaces |

## Color roles — dark (true M3 dark theme, not inverted)

primary #C7D2FE, on-primary #1E1B4B, primary-container #3730A3, on-primary-container #E0E7FF;
secondary #CBCBFF, on-secondary #2E2E6D, secondary-container #4545A1, on-secondary-container #E4E4FF;
tertiary #7DD3FC, on-tertiary #083344, tertiary-container #155E75, on-tertiary-container #CFFAFE;
error #F2B8B5, on-error #601410, error-container #8C1D18, on-error-container #F9DEDC;
surface #141218, on-surface #E6E0E9, on-surface-variant #CAC4D0, surface-variant #49454F;
surface-container-lowest #0F0D13, low #1D1B20, container #211F26, high #2B2930, highest #36343B;
outline #938F99, outline-variant #49454F;
inverse-surface #E6E0E9, inverse-on-surface #322F35, inverse-primary #4F46E5;
success #4ADE80, success-container #14532D; warning #FBBF24, warning-container #451A03.

## Elevation (tonal + shadow)

1: cards, menus · 2: buttons (hover), cards (hover) · 3: dialogs, FABs · 4: dialogs (large) · 5: toasts/snackbars. No arbitrary shadows — use `m3-elevation-1`…`m3-elevation-5` / `shadow-elevation-N`.

## Shape

xs 4dp (inputs, small controls) · sm 8dp (chips, small cards) · md 12dp (cards) · lg 16dp (sheets) · xl 28dp (dialogs) · full/pill (buttons, FABs).

## Typography (M3 scale, fluid via clamp())

display-lg/md, headline-lg/md/sm, title-lg/md/sm, body-lg/md/sm, label-lg/md/sm.
Pairing: Inter / Plus Jakarta Sans (system stack — no external font CDN per CSP `font-src 'self' data:`) for UI; IBM Plex Mono (system stack) for code/keys. See DECISIONS.md.

## Motion

Easing: emphasized `cubic-bezier(0.2,0,0,1)`, emphasized-decelerate `(0.05,0.7,0.1,1)`, emphasized-accelerate `(0.3,0,0.8,0.15)`, standard `(0.2,0,0,1)`.
Durations: short 150ms, medium 300ms, long 500ms.
Patterns: page transitions (fade-up), expanding cards, staggered list entrances (40ms stagger).
`prefers-reduced-motion: reduce` → all animations/transitions collapse to ~0ms, instant state.

## State layers & targets

Hover/focus/pressed state layers via `color-mix` overlays on interactive elements. Focus rings: 2px primary, visible. Tap targets: minimum 44px (`.m3-btn`, `.m3-input`, `.m3-tab`, nav links).

## Density

Comfortable default; compact option in Settings persists to `localStorage` (`ag-density`) and sets `data-density="compact"` on `<html>`.
