---
name: artinos-ui
description: Add ARTINOS UI — the precision-instrument React control system (Slider, RangeSlider, NumberField, Switch, ToggleGroup, Segmented, ColorField, Select, Panel/Section/Field, Tabs) with 52 glass, frost, studio and luxe themes — to another project, and build parameter panels, inspectors and control docks with it. Use this skill whenever the user mentions ARTINOS UI, artinos-ui, the ARTINOS sliders or theme names (frost-deep, satin, onyx, pane…), or wants glass/frosted control panels, precision sliders, a parameter inspector or tweak panel for a React / Next / Vite / React Three Fiber project — even if they don't name the package. Also use it for theming an existing artinos-ui install, adding themes or components to it, or updating it.
---

# ARTINOS UI in other projects

ARTINOS UI is a copy-paste React component package: one folder, no npm package, no provider, no build plugin. Only `react` and `react-dom` (18.3+) are required. The source of truth is the package at:

`D:/CODES26/ARTINOS-R3F/UI COMPONENT PACKAGE/artinos-ui` (its `README.md` is the full manual; the showcase with the Theme Studio and Export kit is `../showcase/artinos-ui-showcase.html`).

Bring it into a project as a **trimmed kit** made by the bundled exporter, so the project only carries the components and themes it uses. Hand-copying the whole folder also works, but it ships all 52 themes (~150 KB of token CSS) and every component.

## Workflow

### 1. Read the target project first

Check before writing anything, because each of these changes the steps below:
- **React version** in `package.json` — needs React 18.3+ and `react-dom`.
- **Bundler / framework** — Vite, Next.js (App or Pages router), webpack/CRA. The kit is `.tsx` source with CSS `@import`; Vite and Next compile it as-is. A plain-JS Next project will offer to add TypeScript the first time it sees `.tsx`; that is normal.
- **Where source lives** (`src/`, `app/`, `components/`) and any path alias (`@/…`) — put the kit at e.g. `src/artinos-ui` or `src/components/artinos-ui`.
- **An existing `artinos-ui` folder** — then this is an update: re-export over it (step 3 with `--force`) instead of creating a second copy, and keep the same themes plus any new ones.
- **What the UI sits over** — a 3D canvas, video or photo suits glass/frost themes; a flat app suits solid themes (`studio`, `studio-light`). See `references/theming.md`.

### 2. Choose themes and components

Pick only what the task needs; it is easy to re-export later. List what's available:

```bash
node "D:/CODES26/ARTINOS-R3F/UI COMPONENT PACKAGE/artinos.mjs" list
```

If the user didn't name a theme, choose one that fits the host (dark app → `frost-deep` or `studio`; light app → `studio-light` or `frost-light`; over imagery or a canvas → any glass/frost theme). Include the component set the UI actually uses — `Panel` is worth adding for any grouped inspector. `ArtinosTheme` (the theme scope) is always included, and so is `studio`, the base every theme builds on.

### 3. Export the kit into the project

Run from the target project's root:

```bash
node "D:/CODES26/ARTINOS-R3F/UI COMPONENT PACKAGE/artinos.mjs" setup --project . --themes frost-deep,studio-light --components Slider,RangeSlider,Select,Switch,Panel
```

`setup` does three things:
- It writes the kit to `src/artinos-ui`, or to `artinos-ui` when there is no `src/`; `--out <dir>` changes this.
- It installs this skill into the project's `.claude/skills/`, so later sessions there have it.
- It prints the wiring steps for the detected framework.

Use `export` instead of `setup` for the kit alone. If the package folder isn't at that path, `scripts/artinos-kit.mjs` inside this skill does the same export with `--out <dir> --src <path-to>/artinos-ui`.

- `--themes all` / `--components all` for everything; `--dry-run` to preview files and sizes.
- `--no-docs` leaves out the kit's `docs/` (the component API and theming guides, copied from this skill's references). Keep them unless the user objects: they let later sessions in the project work without this package.
- `--custom my-theme.css` adds a Theme Studio export (repeatable).
- `--no-fonts` drops the Google Fonts `@import` (offline apps, strict CSP, or self-hosted fonts). System fonts are the fallback.
- `--no-materials` drops the optional `material` prop overrides.
- `--force` updates an existing kit in place; files the kit no longer needs are removed.
- If the script can't find the package source, pass `--src "<path>/artinos-ui"` or set `ARTINOS_UI_SRC`.

The kit folder contains its own `README.md` with a usage snippet for exactly what was exported, plus `index.ts` and `artinos.css` that include only those parts. Don't edit files inside the kit to restyle; use tokens (step 5), so a later re-export doesn't wipe the changes.

### 4. Wire it up

Import the stylesheet **once** at the app root, before your own styles, so tokens are defined everywhere:

| host | where |
|---|---|
| Vite / CRA | `src/main.tsx`: `import './artinos-ui/artinos.css';` |
| Next.js App Router | `app/layout.tsx`: `import '@/artinos-ui/artinos.css';` (global CSS is allowed there) |
| Next.js Pages Router | `pages/_app.tsx` |

Then import components from the kit folder (`import { ArtinosTheme, Slider, Panel } from './artinos-ui';`) and wrap the UI in a theme scope:

```tsx
<ArtinosTheme theme="frost-deep" className="inspector">
  <Panel title="Material" subtitle="Optical body">
    <Slider label="Transmission" value={t} onChange={setT} format="percent" decimals={0} />
    <Slider label="Roughness" value={r} onChange={setR} onCommit={save} />
  </Panel>
</ArtinosTheme>
```

In Next.js App Router, every stateful component file already starts with `'use client'`, and `ArtinosTheme` is hook-free, so all of them can be rendered from Server Components. State that drives them (`useState`) must still live in a client component.

### 5. Build the UI

Use `references/components.md` for every prop, default and example. Read it before writing controls; the API has conveniences that are easy to miss:
- `format` (`percent`, `db`, `hz`, `angle`, `time`) instead of hand-formatting.
- `mapping="log"` for frequencies and exposures.
- `detents` for meaningful points like 0 dB.
- `onCommit` for expensive work (it fires once on release, while `onChange` fires live).
- `bipolar` for ± values, and `steps` for discrete choices.

Every control works controlled or uncontrolled.

For theming, custom colours, density and custom themes, use `references/theming.md`. In short:
- Change the look with `theme`.
- Retint with `tokens={{ signal: '#…' }}` or CSS custom properties on a scope.
- Change size with `density`.
- For a fully custom theme, use the Theme Studio, export its CSS and re-export the kit with `--custom`.

### 6. Verify

Run the project's type-check and build, then look at the result in the browser. Things to confirm:
- The UI picks up the theme. If controls render unstyled, `artinos.css` isn't imported, or it's imported in a component that isn't loaded.
- Glass themes show something behind them. Over a flat background they look like a plain tinted card, which is expected.
- The theme ids you used exist in the kit (`tokens/themes.css`). An unknown id silently falls back to the studio base look.

## Things that commonly go wrong

- **Theme not in the kit.** A trimmed kit contains only the exported themes. To use another one, re-run the exporter with it added (`--force`). Don't paste CSS blocks by hand; theme finishes live in two files and share rules.
- **Styles imported twice or late.** Import `artinos.css` once at the root. Importing it inside a lazily loaded route makes the first paint unstyled.
- **Clipped dropdowns and HUD.** Select lists and the slider precision HUD portal to `<body>` and carry the theme tokens with them. So a parent with `overflow: hidden` or its own `backdrop-filter` is fine; don't try to "fix" clipping by moving them.
- **R3F / canvas apps.** The controls are DOM. Render panels in an absolutely positioned overlay beside the `<Canvas>`, not inside the Canvas tree. The glass then blurs the rendered scene.
- **Wheel scrolling.** Sliders change on wheel only when focused, so page scroll isn't hijacked. That's intended.
- **Double-click on a slider body toggles it off** (value kept). Pass `toggleable={false}` for sliders that must never be disabled, such as sliders inside your own editor tools.
- **Old browsers.** The CSS needs `@property`, `color-mix()`, `:has()` and `backdrop-filter` (evergreen Chrome, Edge, Safari, Firefox).
