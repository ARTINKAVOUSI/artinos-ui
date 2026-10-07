---
name: artinos-ui
description: Add ARTINOS UI — the precision-instrument React control system (Slider, RangeSlider, Knob, XYPad, NumberField, TextField, Switch, ToggleGroup, Segmented, ColorField, Select, FileDrop, Button, Toolbar, Badge, Meter, Sparkline, Panel/Section/Field, Tabs, PropertyRow, Menu, Dialog, Toast, Tooltip, CommandPalette, a dockable Dock workspace and a NodeGraph editor) with 52 glass, frost, studio and luxe themes — to a project, and build parameter panels, inspectors, studio workspaces and control docks with it. Use this skill whenever the user mentions ARTINOS UI, artinos-ui, the ARTINOS sliders or theme names (frost-deep, satin, onyx, pane…), or wants glass/frosted control panels, precision sliders, a parameter inspector or tweak panel, a dockable editor layout, a command palette or a node editor for a React / Next / Vite / React Three Fiber project — even if they don't name the package. Also use it for theming an existing artinos-ui kit, adding themes or components to it, or updating it.
---

# ARTINOS UI in a project

ARTINOS UI is a copy-paste React component package: no npm package, no provider, no build plugin. Only `react` and `react-dom` (18.3+) are required. Everything lives in one folder:

`{{PACKAGE}}`

It holds the source (`src/`), the guides (`docs/`), the showcase with the Theme Studio, and the one command, `artinos.mjs`.

A project gets a **kit**: a trimmed copy with only the components and themes it uses, plus its own README and guides.

## Workflow

### 1. Read the target project first

Each of these changes the steps below:
- **React version** in `package.json`: needs React 18.3+ and `react-dom`.
- **Framework:** Vite, Next.js (App or Pages router), or webpack. The kit is `.tsx` source with CSS `@import`, which Vite and Next compile as-is. A plain-JS Next project will offer to add TypeScript the first time it sees `.tsx`; that's normal.
- **Where the source lives** (`src/`, `app/`, `components/`) and any path alias (`@/…`).
- **An existing kit** (an `artinos-ui` folder with `artinos.css` and `index.ts`). If there is one, update it with `--force`; don't add a second copy. Keep its themes, plus any new ones.
- **What the UI sits over.** A 3D canvas, video or photo suits glass and frost themes; a flat app suits solid themes (`studio`, `studio-light`). See `references/theming.md`.

### 2. Choose themes and components

```bash
node "{{PACKAGE}}/artinos.mjs" list
```

Use what the user named. If they named no theme, pick one that fits the host and say which you picked:
- dark app → `frost-deep` or `studio`
- light app → `studio-light` or `frost-light`
- over imagery or a canvas → any glass or frost theme

Pick only the components the UI uses; each one brings the files it imports. `ArtinosTheme` and the `studio` base theme are always included.
- **Grouped controls:** add `Panel`.
- **Inspector rows** with reset, binding and status: add `PropertyRow`.
- **A studio or editor layout** with dockable, floating and tabbed panels around a canvas: add `Dock`. It brings its engine, its menu, the command palette and `Button`/`Kbd`.
- **Overlays:** `Menu`, `Dialog`, `Toast`, `Tooltip`, `CommandPalette`.
- **A node editor:** `NodeGraph`.
- `GraphGPU` (graph → three.js TSL) needs `three`. It is left out of `--components all`; ask for it by name.

### 3. Set up the project

Run from the target project's root:

```bash
node "{{PACKAGE}}/artinos.mjs" setup --project . --themes frost-deep,studio-light --components Slider,RangeSlider,Select,Switch,Panel
```

This writes the kit to `src/artinos-ui/`, or to `artinos-ui/` when there is no `src/`; `--out <dir>` changes that. The kit contains:
- the chosen components and every file they import;
- the chosen themes;
- `index.ts` and `artinos.css`;
- `README.md`;
- `docs/components.md` and `docs/theming.md`.

`setup` also installs this skill into the project's `.claude/skills/`, and prints the import lines for the detected entry file. `export` does the kit alone.

Options:
- `--dry-run` previews the files.
- `--force` updates an existing kit; files it no longer needs are removed.
- `--custom my-theme.css` adds a Theme Studio export (repeatable).
- `--no-fonts` drops the Google Fonts import, for offline apps or a strict CSP; system fonts are the fallback.
- `--no-materials` drops the optional `material` overrides.
- `--no-docs` leaves out the guides. Keep them unless asked: they let later sessions work without the package.

Don't restyle by editing kit files, because a re-export overwrites them. Use tokens (step 5).

### 4. Wire it up

Import the stylesheet **once** at the app root, before your own styles:

| host | where |
|---|---|
| Vite / CRA | `src/main.tsx`: `import './artinos-ui/artinos.css';` |
| Next.js App Router | `app/layout.tsx`: `import '@/artinos-ui/artinos.css';` (global CSS is allowed there) |
| Next.js Pages Router | `pages/_app.tsx` |

Import components from the kit folder and wrap the UI in a theme scope:

```tsx
import { ArtinosTheme, Panel, Slider } from './artinos-ui';

<ArtinosTheme theme="frost-deep" className="inspector">
  <Panel title="Material" subtitle="Optical body">
    <Slider label="Transmission" value={t} onChange={setT} format="percent" decimals={0} />
    <Slider label="Roughness" value={r} onChange={setR} onCommit={save} />
  </Panel>
</ArtinosTheme>
```

Next.js App Router: every stateful component file starts with `'use client'`, and `ArtinosTheme` is hook-free, so all of them render from Server Components. State that drives them must live in a client component.

### 5. Build the UI

Read `references/components.md` before writing controls. It has every prop, default and example, and the API has conveniences that are easy to miss:
- `format` (`percent`, `db`, `hz`, `angle`, `time`) instead of hand-formatting;
- `mapping="log"` for frequencies and exposures;
- `detents` for meaningful points like 0 dB;
- `onCommit` for expensive work (it fires once, on release);
- `bipolar` for ± values;
- `steps` for discrete choices.

`references/theming.md` covers themes, `tokens={{ signal: '#…' }}` overrides, density, custom themes and every token.

### 6. Verify

Run the project's type-check and build, then look at it in the browser:
- **Controls unstyled:** `artinos.css` isn't imported at the root, or it's imported in a lazily loaded module.
- **Glass themes look flat:** they need something behind them. Over a flat background they look like a plain tinted card.
- **Theme looks like studio:** the id you used isn't in the kit's `tokens/themes.css`, and unknown ids fall back silently. Re-export with it.

## Things that commonly go wrong

- **Theme not in the kit.** Re-run `export --force` with it added. Don't paste CSS blocks by hand.
- **Clipped dropdowns or HUD.** Select lists and the slider HUD portal to `<body>` with the theme tokens. Parents with `overflow: hidden` or `backdrop-filter` are fine, so don't try to fix it by moving them.
- **R3F / canvas apps.** The controls are DOM. Render panels in an absolutely positioned overlay beside the `<Canvas>`, not inside it. For a full editor, pass the `<Canvas>` as the Dock's `viewport`, and the panels dock around it.
- **Dock is blank or zero-height.** It fills its parent, so give the parent a height (`100vh`, or a sized grid cell).
- **`useToast` throws.** Wrap the app (or the subtree) in `<ToastProvider>` once.
- **Saved dock layout looks stale.** `storageKey` restores the last arrangement. It is skipped automatically when panel ids change; call `useDock().resetLayout()` to start over.
- **Wheel input.** Sliders change on wheel only when focused, so page scroll isn't hijacked.
- **Double-click on a slider body** toggles it off, keeping its value. Pass `toggleable={false}` where that must never happen.
- **Browsers.** The CSS needs `@property`, `color-mix()`, `:has()` and `backdrop-filter`, which every evergreen browser has.
