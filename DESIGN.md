# Flash Words design system

## 1. Visual theme and atmosphere

Flash Words is a high-contrast editorial motion desk. It borrows the urgency of print-room proof sheets and kinetic type posters: warm paper surfaces, near-black ink, and one acid signal color. The canvas is the visual anchor, not a decorative hero.

## 2. Palette and roles

- `--ink`: `oklch(16% 0.012 95)`, primary copy and dark canvas.
- `--paper`: `oklch(95% 0.018 96)`, application canvas.
- `--paper-deep`: `oklch(90% 0.022 96)`, side rails and grouped controls.
- `--signal`: `oklch(86% 0.22 125)`, primary actions and active state.
- `--danger`: `oklch(58% 0.2 28)`, validation and export errors.
- `--muted`: `oklch(48% 0.012 95)`, secondary copy.

## 3. Typography

- Display Latin: Archivo Black, chosen for its compressed poster weight.
- Interface: system Latin followed by PingFang SC and Noto Sans SC.
- Motion canvas: Noto Sans SC Variable by default, Noto Serif SC and Archivo Black as alternatives.
- UI sizes: 12, 13, 15, 20, 28px. Display logo: 24px with -0.022em Latin tracking.

## 4. Components

- Buttons use an 8px radius, at least 40px height, ink/signal inversion, and 0.96 active scale.
- Inputs are flat paper fields separated by strong layout dividers rather than floating cards.
- Template selectors are small typographic posters with a visible selected outline.
- The composition recipe is a compact five-slot control, not a professional timeline; automatic direction remains the default.
- Status rows keep one fixed type size to prevent layout jitter.

## 5. Layout

- Desktop uses 296px control rail, flexible canvas stage, 272px export rail.
- Spacing scale: 4, 8, 12, 16, 24, 32px.
- The central canvas receives the most area and highest contrast.
- Recipe slots stay inside the preset section so composition reads from preset to detail without opening another surface.

## 6. Depth

No glass effects. Depth uses background steps and one hard stage shadow. Borders are reserved for structural dividers.

## 7. Guardrails

- Do not add purple, blue gradients, glass cards, or generic feature grids.
- Keep one signal color per screen.
- Do not animate layout properties.
- Do not make export settings visually louder than the canvas.
- Preserve visible keyboard focus and reduced-motion behavior.
- Keep all user media local.

## 8. Responsive behavior

- Below 980px, export settings move under the stage.
- Below 720px, the control rail becomes a normal stacked section.
- Touch targets remain at least 40px. High-resolution export is clearly labeled as desktop-oriented.

## 9. Agent prompt guide

- Build controls on `oklch(90% 0.022 96)` with 8px radius and 1px structural dividers in `oklch(16% 0.012 95 / 18%)`.
- Build primary buttons at 13px weight 750, 40px high, background `oklch(86% 0.22 125)`, ink text, 8px radius, active scale 0.96.
- Build the stage on `oklch(16% 0.012 95)`, square or 9:16, with a hard `8px 8px 0` ink shadow and no rounded canvas corners.
