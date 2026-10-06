# ARTINOS Instrument — Design System

Design system for **ARTINOS**, a React 19 + React Three Fiber v10 + Three.js WebGPU/TSL creative-development boilerplate: a dockable-panel studio shell (Scene, Render, PostFX, Input, Bindings, Automation, Presets, Graph, Providers, Inspector, Agent, Telemetry, Console) for building realtime WebGPU/TSL tools, editors and audiovisual instruments. The PRD in the source (`BRIEF.md`, "Motionize") describes a still-image-to-living-scene product built on this shell; no product UI for it exists yet in the source — only the shell/instrument system itself.

**Sources** (local codebase, not web-accessible — paths kept here for reference):
- `ARTINOS_BOILERPLATE/` — the full boilerplate (`packages/ui/src/**` is the design-system source: tokens, primitives, shell, panels)
- `ARTINOS_BOILERPLATE/docs/UI-DESIGN-SYSTEM.md` — the written spec ("the six rules", themes, adoption state)
- `ARTINOS_BOILERPLATE/Design system premium refinement-handoff/design-system-premium-refinement/project/ARTINOS System Reference v2.dc.html` — the canonical visual reference sheet (Claude Design handoff) that `tokens.css`/`instrument.css` implement
- `ARTINOS_BOILERPLATE/packages/ui/registry.json` — a curated partial component manifest (8 entries); this design system's component inventory is broader, taken from `packages/ui/src/primitives/**` directly

## Index

- `styles.css` — single import entry point (link this one file)
- `tokens/` — colors, typography, spacing, motion, roles, themes (one file per concern)
- `base.css` — resets, link colors, document defaults
- `components.css` — the component visual layer (buttons, fields, scrub cells, panels, dock chrome…), ported from the source's `instrument.css`
- `components/` — React primitives, grouped by concern (see below)
- `guidelines/` — foundation specimen cards (Design System tab: Colors, Type, Spacing, Motion, Elevation, Brand)
- `ui_kits/studio/` — the studio-shell UI kit: both canonical dock frames (SH.01 bottom, SH.02 side), interactive
- `ui_kits/studio-workspace/` — the **real product surface**: the dock with the shipped panel set docked into it — Scene (8 parameter groups + object tree + project), Render (renderer params, live metrics, capture), PostFX (real catalog: categories, cost tiers, pipeline order, presets, bulk enable), Input (devices, audio/vision analysis, record-replay), Bindings (create route + active routes), Modules, Telemetry, Console. Tab strip places panels by click zone; the rail is the selector on a side dock.
- `templates/studio-dock-bottom/`, `templates/studio-dock-side/` — the two dock frames as copyable starting templates
- `assets/imagery/` — generic photographic imagery used by the source for glass/frost demos
- `thumbnail.html` — project tile

## Components

**Actions** — `Button`, `IconButton`, `Collapsible`
**Choice** — `Toggle`, `Checkbox`, `Select`, `Segmented`, `Tabs`
**Controls** — `Slider` (scrub cell), `NumberField`, `RangeSlider`, `Dial`
**Instrument** — `Knob`, `XYPad`, `Meter`, `Waveform`, `Envelope`, `GradientBar`
**Text** — `TextField`, `TextArea`, `SearchField`
**Vector** — `ColorField`, `VectorField`
**Display** — `KeyValue`, `Progress`, `Badge`, `Sparkline`
**Property** — `PropertyRow`, `PropertySection`
**Layout** — `Section`, `Stack`, `Toolbar`, `Empty`
**Panel** — `PanelCard`
**Files** — `FileField`, `DropZone`, `KeyCapture`, `CurveEditor`
**List** — `VirtualList`, `VirtualGrid`, `ListBrowser`, `Highlight`
**Navigation** — `BrandChip`

Built from the full `packages/ui/src/primitives/**` inventory — every primitive the source ships now has a component here. `ListBrowser`'s matching is a plain substring search, not the source's fuzzy ranker (`headless/fuzzy-match.ts`) — port that if a consuming app needs fuzzy ranking.

### How it stays connected

One source of truth per layer, so a change propagates instead of being copied:

- **Tokens → everything.** Components, cards, the UI kit and both dock templates reference roles (`var(--frost-tint)`, `var(--radius-panel)`, `var(--sig-live)`) — never literals. Editing `tokens/roles.css` restyles all of it, including the frosted dock.
- **`components.css` → every component.** The visual anatomy lives once, in class rules; the `.jsx` files carry structure and state only. Change a control height or a state wash there and every consumer updates.
- **Components → UI kit → templates.** `ui_kits/studio/` composes `BrandChip`, `Slider`, `Meter`, `Waveform` from the bundle; both templates mount `Slider` via `x-import` from the same bundle. Nothing re-implements a primitive.

The studio-shell UI kit (`ui_kits/studio/`) recreates both dock frames; no other product surface exists in the source to recreate.

## Shell frames — the canonical reference

`ARTINOS System Reference v2` §00 defines two shell frames; everything else in the system resolves against them. Both are implemented here, in `ui_kits/studio/` (interactive, dock position switchable) and as copyable templates:

- **SH.01 dock bottom** — one frosted card inset 32px left/right and 29px bottom, 276px tall, radius 13. 40px tab strip (panel pills with counts · 272×27 search at a 20px lead gap · status cluster), three panel cards in a 1.2 / 1 / 0.85 ratio separated by 4px gutters, 31px console line at the foot.
- **SH.02 dock left/right** — the same dock stood on its side: 341px wide, inset 20px, tab strip replaced by a 54px vertical rail with 2px inset teal accents, panel cards stacked on the same grow ratio, console keeps the foot.

The brand chip floats over the canvas at 32/22 and is not part of the dock. The console is a line/toast, never a persistent bar.

## Content fundamentals

The source ships no marketing copy — it is a developer-facing system, and its own documentation is the best evidence of voice. Reading `docs/UI-DESIGN-SYSTEM.md` and `instrument.css`'s comments:

- **Tone:** precise, declarative, engineer-to-engineer. Short sentences stating a rule and its reason: *"Components read roles, never primitives."* *"A card that is both raised and recessed is two components wearing one shell."*
- **Numbered rules, not persuasion.** The six rules are declared, not sold: "Numbers never move," "Height comes from a token."
- **No second person, no marketing adjectives.** Never "you'll love," never "seamless" or "powerful" — copy states what a thing *is* and why, e.g. *"the row IS the drag surface: the fill is the value and the hairline is its exact position."*
- **Comments justify decisions with a measured before/after**, e.g. "323 → 54 raw colour references," "0 text nodes below the 8.5px floor." Numbers back every claim.
- **No emoji anywhere** in UI copy, labels, or documentation.
- **Labels are terse, uppercase, mono-caps**: `WEBGPU`, `CONSOLE`, `SCENE`, `62 ENTRIES`.

## Visual foundations

- **Colors:** neutral graphite (`ink-*`) for dark, neutral paper (`paper-*`) for light — deliberately hue-free grounds ("grey is the ground; hue belongs to the signal ramp"). One signal hue per meaning: teal = live/armed, azure = externally bound, amber = degraded/warn, rose = fault/stopped. Two backgrounds max per surface (app + one raised layer); accent hue never used decoratively.
- **Type:** Chivo (UI) + Chivo Mono (numerals, labels, caps), loaded from Google Fonts (see Known gaps). Only three weights are used anywhere: 200 (display), 300 (body/value), 500 (mono caps/panel labels) — never 400/600/700. Numerals are always mono + tabular so a value change never shifts a column; the unit is always a separate, quieter element.
- **Spacing:** 2px base, 8 steps (`--space-1`…`--space-8`, 2→32px). Panels separate by a 12px gutter, not a border (rule 04).
- **Backgrounds:** no illustration, no patterns, no gradients as decoration. The one photographic use is the 3D viewport itself showing through frosted-glass chrome — imagery is content, not backdrop art.
- **Materials:** frosted glass is the *only* elevated material, present in all four themes (only the tint changes) — `background: frost-sheen, frost-tint; backdrop-filter: blur(38–52px) saturate(~105–112%)`. Recessed wells (inputs, tracks) use an inset shadow, never a fill color, so "recessed" always means "editable" (rule 02).
- **Animation:** small and functional only — 70/130/220/380ms named by *what* moves (value/state/surface/layout), not decorative. Entering uses `ease-enter` (decelerate in); leaving uses `ease-exit` in less time (accelerate away) so dismissal never feels like waiting. `prefers-reduced-motion` zeroes all four durations; nothing is animation-dependent.
- **Hover / press states:** hover raises a background wash one step (`bg-hover`, ~5% white); active/armed states use the signal wash + a signal-colored inset ring, never a color swap on the whole control. No scale/shrink on press anywhere in the system.
- **Borders vs. shadows:** hairlines (`line-subtle` → `line-strong`) mark a card's own edge or the boundary of a floating layer — they are not used *between* two sibling panels (gutters do that job, rule 04). Elevation is entirely shadow/blur-based; there is no drop-shadow-as-decoration.
- **Transparency & blur:** blur is reserved for the dock/menu/toast/dialog "floating chrome" layer (materials: frost, `bg-float`) — content surfaces (panels, cards) are flat, never blurred, to avoid nested-filter seams.
- **Corner radii:** four steps only — 5 (control), 8 (card), 12 (panel), 16 (shell). No ad hoc radii.
- **Cards:** panels are transparent fills with a 1px `line-subtle` inset ring — "a lift, not a card" (barely above the dock surface), never a drop shadow, never a colored left border.
- **Layout:** three control heights only (24/28/32px) — a one-off height signals the component is doing two jobs (rule 06). Fixed elements: the brand chip floats top-left over the canvas; the console is a toast, bottom-right, not a persistent bar.
- **Imagery color vibe:** the one generic photographic asset in the source (a courtyard scene, `assets/imagery/courtyard-scene.png`) is warm, naturalistic and used specifically to test the "auto" theme's canvas-adaptive tint — not a brand mood image.

## Iconography

The source imports **lucide-react** (confirmed in `packages/ui/README.md` and used throughout `shell/*.tsx` — `X`, `Search`, `Move`, `Minimize2`, `PictureInPicture2`, `CornerDownLeft`, `ChevronDown`, `Cpu`, `Activity`, `Monitor`, `Layers`, `Timer`). No custom icon font, no SVG sprite sheet, and no emoji anywhere. Use lucide at 11–14px, always paired with a `title`/`aria-label` since icon-only buttons carry no visible text. The one non-lucide glyph in the system is the brand mark itself — a plain `#` character in a filled teal square, not an icon-font glyph.

## Fonts — known gap

No font files exist in the source; it loads Chivo + Chivo Mono from Google Fonts at runtime (`docs/UI-DESIGN-SYSTEM.md`, "Known gaps": *"Typefaces load from Google Fonts… this is an external network dependency"*). This design system does the same via `@import` in `tokens/fonts.css`, matching the source exactly — not a substitution. Self-host if an offline build is needed; ask if you'd like the woff2 files fetched and vendored in.

## Logo — none provided

No logo file exists anywhere in the source. The brand mark is rendered in plain type/shape wherever a mark would go (`#` glyph + "ARTINOS" wordmark, see `guidelines/brand-mark.html`) — do not draw or approximate a logo.

## Intentional additions

- **`PanelCard`** — the AS.01 panel anatomy (header, body, foot line) as a reusable card. The source only ships it fused to the dock's windowing/runtime behaviour; consumers need the shape without it.
- **`BrandChip`** — the source's shell component, lifted out of the runtime panel host so the mark can be used anywhere.
