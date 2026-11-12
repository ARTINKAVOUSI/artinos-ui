---
name: artinos-ui
description: Add ARTINOS UI — the precision-instrument React control system (Slider, RangeSlider, Knob, XYPad, NumberField, TextField, Switch, Checkbox, ToggleGroup, ChipGroup, Segmented, ColorField, Select, FileDrop, Button, Toolbar, Badge, Stat, Meter, Spectrum, Progress, Sparkline, Panel/Section/SectionGroup/Field, Text/Stack/Inline, Tabs, PropertyRow, ItemList/ItemGroup/ItemRow, Menu, Dialog, Toast, Tooltip, CommandPalette, a dockable Dock workspace on the MetaBlock engine and a NodeGraph editor) with 108 glass, frost, studio and luxe themes and twelve type systems — to a project, and build parameter panels, inspectors, studio workspaces and control docks with it. Use this skill whenever the user mentions ARTINOS UI, artinos-ui, the ARTINOS sliders or theme names (nimbus, frost-deep, satin, onyx, pane…), or wants glass/frosted control panels, precision sliders, a parameter inspector or tweak panel, a dockable editor layout, a command palette or a node editor for a React / Next / Vite / React Three Fiber project — even if they don't name the package. Also use it for theming an existing artinos-ui kit, adding themes or components to it, or updating it.
---

# ARTINOS UI in a project

ARTINOS UI is a copy-paste React component package: no npm package, no provider, no build plugin. Only `react` and `react-dom` (18.3+) are required. Everything lives in one folder:

`{{PACKAGE}}`

It holds the source (`src/`), the guides (`docs/`), the showcase with the Theme Studio, and the one command, `artinos.mjs`. A project gets a **kit**: a trimmed copy with only the components and themes it uses, plus its own README and guides. The kit is generated: never edit it by hand.

**The four guides** (in the package's `docs/` and in every kit's `docs/`; here as `references/`):
- `references/design.md`: the look and the feel, the three layout levels, the type scale, what never to do, and the check to run on a screenshot. **Read all of it before building anything.**
- `references/catalogue.md`: every kind of every component, and which one a parameter calls for.
- `references/components.md`: every prop, default and example.
- `references/theming.md`: themes, scenes, tokens, density and custom themes.

## Workflow

### 1. Read the target project first

Each of these changes the steps below:
- **React version** in `package.json`: needs React 18.3+ and `react-dom`.
- **Framework:** Vite, Next.js (App or Pages router), or webpack. The kit is `.tsx` source with CSS `@import`, which Vite and Next compile as-is. A plain-JS Next project will offer to add TypeScript the first time it sees `.tsx`; that's normal.
- **Where the source lives** (`src/`, `app/`, `components/`) and any path alias (`@/…`).
- **An existing kit** (an `artinos-ui` folder with `artinos.css` and `index.ts`). If there is one, this is an **update**: go to *Updating a kit* below. Never add a second copy.
- **What the UI sits over.** A 3D canvas, video or photo suits glass and frost themes; a flat app suits solid themes (`studio`, `studio-light`).

### 2. Choose themes, type and components

```bash
node "{{PACKAGE}}/artinos.mjs" list
```

**Theme.** Use what the user named. If they named none, use the default, **`nimbus`** (soft carved Haze glass; `ArtinosTheme` uses it when `theme` is omitted, and every kit carries it), and say so. Choose another only when the host calls for it:
- a flat dark app with nothing behind the panels → `studio` or `frost-deep`
- a light app → `studio-light` or `frost-light`
- over imagery or a canvas → `nimbus`, `frost-deep`, `glass`, `haze`, `satin` or `onyx`, and set `scene` to what is behind it: `<ArtinosTheme scene="light">` over a light room, product shot or white page (without it, light-ink glass over a light scene is unreadable)
- start from the eight hero themes (`list` shows them first); reach for a variation only when the user wants a different finish, and name the hero it comes from.

**Type system.** `fine` is the default and always included: hairline Inter controls under extra-bold Inter Tight titles, made for control panels and pro tools. Add another only for a different kind of product, one per product (`references/design.md` → The type systems): `sleek`, `product` or `instrument` for tools; `mass` or `round` for hardware and devices; `grotesk` technical; `wide` a strong brand; `salon` a premium product page; `editorial` long text; `native` a desktop feel; `legible` public or assistive use.

**Components.** Decide what each parameter *is* before deciding which component shows it (`references/catalogue.md` has the table; the short version is in step 5). Pick only what the UI uses; each brings the files it imports. `ArtinosTheme`, the `studio` base and `nimbus` are always included.
- **Grouped controls:** `Panel` (it brings `Section`, `SectionGroup`, `Field`).
- **Inspector rows** with reset, binding and status: `PropertyRow`.
- **Lists of things** (layers, renders, materials, files): `ItemRow` (brings `ItemList`, `ItemGroup`).
- **A studio or editor around a canvas:** `Dock`. It brings the MetaBlock engine, its menu, the command palette and `PanelBar`. Add `DockSections` (`createDockSections`: sections that move between panes) and `Params` (`createParamPanes`: settings from a schema) when the UI uses them.
- **Overlays:** `Menu`, `Dialog`, `Toast`, `Tooltip`, `CommandPalette`.
- **A node editor:** `NodeGraph`. `GraphGPU` (graph → three.js TSL) needs `three`; it is left out of `--components all`, so ask for it by name.

### 3. Set up the project

Run from the target project's root:

```bash
node "{{PACKAGE}}/artinos.mjs" setup --project . --themes nimbus,studio-light --components Slider,RangeSlider,Select,Switch,Panel
```

This writes the kit to `src/artinos-ui/`, or to `artinos-ui/` when there is no `src/` (`--out <dir>` changes that). The kit holds the chosen components and every file they import, the chosen themes, `index.ts`, `artinos.css`, `README.md` and the four guides in `docs/`. `setup` also installs this skill into the project's `.claude/skills/` and prints the import lines for the detected entry file; `export` writes the kit alone.

Options:
- `--type instrument,salon` adds type systems (`fine` always comes along); use one with `<ArtinosTheme type="instrument">`.
- `--custom my-theme.css` adds a Theme Studio export (repeatable).
- `--dry-run` previews the files and sizes, writing nothing.
- `--no-fonts` drops the Google Fonts import (offline apps, a strict CSP); system fonts are the fallback.
- `--no-materials` drops the optional `material` overrides.
- `--no-docs` leaves out the guides. Keep them unless asked: they let later sessions work without the package.

### 4. Wire it up

Import the stylesheet **once** at the app root, before your own styles:

| host | where |
|---|---|
| Vite / CRA | `src/main.tsx`: `import './artinos-ui/artinos.css';` |
| Next.js App Router | `app/layout.tsx`: `import '@/artinos-ui/artinos.css';` (global CSS is allowed there) |
| Next.js Pages Router | `pages/_app.tsx` |

Import components from the kit folder and wrap the UI in a theme scope:

```tsx
import { ArtinosTheme, Panel, Section, Slider } from './artinos-ui';

<ArtinosTheme>                                   {/* nimbus, fine */}
  <Panel title="Material" subtitle="Optical body">
    <Section title="Surface" count={2}>
      <Slider label="Transmission" value={t} onChange={setT} format="percent" decimals={0} />
      <Slider label="Roughness" value={r} onChange={setR} onCommit={save} />
    </Section>
  </Panel>
</ArtinosTheme>
```

Next.js App Router: every stateful component file starts with `'use client'`, and `ArtinosTheme` is hook-free, so all of them render from Server Components. State that drives them must live in a client component.

### 5. Build the UI

Read `references/design.md` in full, then build the ARTINOS way. These are the package's rules, not suggestions.

**The feel.** A well-made instrument: calm over the scene, exact, restrained, direct, alive only where something changes. When a choice is open, take the more restrained one. No dashboard of coloured cards, no bold borders, no capitals, no icons on every heading, no tint over the glass.

**Three levels, built from the inside out:** parts in a **section**, sections in a **panel**.
- **Panel** — one thing wherever it sits: a `Panel` on a page, a `DockPanel` in a `Dock`. Open it with `title`, `subtitle`, a live `Badge` in `actions`, then a `StatStrip` of the two to four figures people look for first; `footer` for status; `tabs` when it has modes; one `labelWidth` for every row inside.
- **Section** — the one way to group: a set of settings, a category, a fold. One idea, about seven parts. The title stands alone (no icon) with a hairline through its title row to its `count`; `modified` + `onReset` when it can be put back; `enabled` when the whole group can be off; `columns` for related numbers; `SectionGroup accordion` for categories; `variant="card"` for the one group that matters most.
- **Parts** — everything else, always inside a section: `Field` and `PropertyRow` rows, controls, readouts (`StatStrip`, `Meter`, `Sparkline`), lists (`ItemList` / `ItemRow`), and text (`Text variant="overline"` names a sub-group, `note` helps, `Callout` must not be missed).
- Never skip a level: a control straight in a panel has no group to fold, reset or move.

**Every panel is a MetaBlock.** Put panels in a `Dock`, so each can be dragged, floated, docked, joined to another as a tab, split and maximized: around a canvas (`viewport`), or with no canvas as a workspace of panels (`dock: 'center'` fills the middle). Write the panel once as a `Panel`: given as a `DockPanel`'s `content` it becomes the pane (the tab names it; subtitle, actions, tabs and footer stay). Restrict a panel only through `capabilities`.

**Tabs switch a panel's views. They are names in hairline capitals (the package sets this; it is the one place for capitals), never icons except in the icon look; a vertical rail is the strip turned 90°.** Looks: `variant="line"` across the top; `Panel tabsPlacement="side"` for a settings sheet or many views; `variant="pill" fill` for two to four modes; `variant="icon"` for a tool rail; `count`, `dot` and `onClose` per tab (`references/catalogue.md` → Tabs). A group of panels has its own tabs in the same looks: `Dock tabs={{ left: 'side', right: { look: 'pill' }, bottom: { look: 'icon' } }}` with an `icon` per panel; it is the group's MetaBlock meta, changed from any tab's menu (Tabs · Look) and kept with the layout. Never a panel's side rail beside its group's side rail.

**A tool around a canvas is a `Dock`.** The canvas goes in `viewport`; browsers and lists dock left, settings right, readouts and consoles bottom. Never position floating panels with CSS. Each pane's tools go in a `PanelBar`, which rises into the tab strip. A panel is a MetaBlock: `capabilities: { closable: false, floatable: false }` on a `DockPanel` keeps it docked and open; `api.workspace` (from `onReady` or `useDock()`) moves panels in code (`floatBlock`, `dockBlock`, `maximizeBlock`, `returnBlock`, `undo`).

**Settings come from data.** Describe each value once (key, label, group, kind, range, `face`: percent, log, count, bipolar, degrees) and let `createParamPanes` build the sections: the right control per value, each group's count and reset, a toggle that owns a group as its on/off, Advanced and Reset in the pane bar. Hand-written sections that should move between panes go through `createDockSections`; its `Pane` works in a `Panel` and in a `DockPanel`.

**Lists pick their look from what is listed:**

| what is listed | `ItemList` | the row |
|---|---|---|
| a scene, a file tree | `size="sm"` | `icon`, `depth` + `expanded`, `status`, a visibility `IconButton` |
| layers, bodies | default | `swatch` or `icon`, `meta`, `trailing` tools |
| renders, videos, uploads | `variant="divided" size="lg"` | `thumbnail` `thumbShape="wide"`, `description`, `value`, `progress`, `checked` |
| materials, images, presets by look | `variant="grid" tileWidth` | `thumbnail` (`round` for materials and people); `ItemGroup` per family |
| a few rich choices | `variant="cards"` | `icon`, `meta`, `value`, a `Badge` |

The current one is `selected`; `empty` says what to do when there is nothing yet.

**Pick each control from the parameter**, not from habit:

| the value is… | use |
|---|---|
| a continuous amount | `Slider` (`format="percent"` if it reads as one) |
| signed, around a neutral point (pan, bias, EV) | `Slider bipolar detents={[0]}` |
| a small count or level (samples, quality 1–5) | `Slider variant="stepped" steps={n} decimals={0}` |
| a loudness | `Slider format="db" detents={[0]}` |
| a frequency, duration or exposure (spans decades) | `Slider mapping="log" format="hz"` / `"time"` |
| a colour-scale parameter (white balance, hue, saturation) | `Slider variant="gradient" gradient="temperature" \| "hue" \| "saturate" \| "exposure"` |
| a camera-style setting (focal length, focus, tempo, yaw) | `Slider variant="ruler" span marks snapStep` |
| a response or easing to look at | `Slider variant="curve"` |
| a position in a clip or buffer | `Slider variant="wave" samples` |
| an interval | `RangeSlider minSpan` |
| a dial in a tight spot · two coupled values | `Knob` · `XYPad` |
| an exact number people type | `NumberField` |
| a position or scale (three numbers) · an object's rotation · where the camera looks from | `Vector3Field` · `Trackball` · `ViewGizmo` (and `TransformGizmo`, with `three`, for handles in the scene) |
| on/off · flags · one of 2–4 · one of many · a colour · a file | `Switch` · `ToggleGroup` · `Segmented` · `Select` · `ColorField` · `FileDrop` |
| a read-only level · frequency bars · trend · figure · task · key figure with its change | `Meter` · `Spectrum` · `Sparkline` · `RollingValue` · `Progress` · `Stat` |
| a value that streams or must keep exact time (audio, scrubbing, telemetry) | the instrument's `motion` (`'audio'`, `'instant'`, default `'auto'`), and `source` instead of `value` when it changes faster than React should render |

Conveniences that are easy to miss: `format` (`percent`, `db`, `hz`, `angle`, `time`) and `unit` instead of hand-formatting; `mapping="log"` / `"exp"` (geometry only, the value stays exact); `detents` for meaningful points like 0 dB; `onCommit` for expensive work (fires once, on release); `toggleable` (on by default: double-click switches a parameter off and keeps its value).

**Type, colour and space are the package's, never yours.**
- No `font-size`, `font-weight`, `font-family`, `letter-spacing`, `text-transform` or text `color` in app CSS inside a theme scope. Pass `label` and a value, `title` and `subtitle`, and every level is already drawn: a name is quiet (12, medium, 76% ink), its answer loud (13, semibold, full ink), a section name 14, a panel name 16, one scale (12 · 13 · 14 · 16 · 18 · 20 · 24 · 28 · 36 · 48), 12 the floor for every word in a panel.
- For a part of your own, take a whole role: `font: var(--ar-type-label); color: var(--ar-tone-label)` (also `-value`, `-section`, `-group`, `-panel`, `-note`). Page text uses `Text` roles (`eyebrow`, `title`, `lead`, `body`, `note`…).
- Every gap from the space scale: `Stack` / `Inline` with `gap="row"`, `"group"` or a step; never hand-set margins.
- Glass stays as the theme draws it: never add a wash, tint or darker floor to a panel to rescue text. One accent per screen (`accent=` or `tokens={{ signal }}`).
- Restyle with tokens (`tokens={{ … }}` on `ArtinosTheme`, or `--ar-*` in your CSS), never by editing kit files. If text looks wrong, fix the token or the role, never the app's CSS.

### 6. Verify

Run the project's type-check and build, then look at it in the browser. Take a screenshot and run the check at the end of `references/design.md`: from arm's length a panel name, a section name, a value and a label must be told apart without reading them; one type system, one accent, one primary action, one label column per panel; every control in a section and every section in a panel; no text set by hand, in capitals, in a mono or under 12px. Then the catalogue's checklist for the controls themselves.

## Updating a kit

When the project already has a kit, update it in place from the project's root, naming **everything it should hold**: the themes, components and type systems it has now plus any new ones (the kit's `README.md` lists its themes, type systems and components).

```bash
node "{{PACKAGE}}/artinos.mjs" setup --project . --themes nimbus,frost-deep --components Slider,Panel,Dock,DockSections,ItemRow --type fine --dry-run
node "{{PACKAGE}}/artinos.mjs" setup --project . --themes nimbus,frost-deep --components Slider,Panel,Dock,DockSections,ItemRow --type fine --force
```

- `--force` rewrites the kit and removes files it no longer needs; anything the app changed inside the kit is lost, which is why restyling lives in tokens.
- Then run the type-check: an update can rename or remove a prop. Fix the app's code to the guides, never the kit. Recent changes worth checking: `Tabs` takes `orientation`, `variant` (`line` · `pill` · `icon`), `fill`, `onClose` and per-item `count` / `dot`; `Panel` takes `tabsPlacement`; `DockPanel` takes `dock: 'center'` and `icon`, `Dock` takes `tabs`, and a `Panel` inside a Dock pane now drops its own glass and title; `Section` and `createParamPanes` groups no longer take `icon` (a section title stands alone); `DockPanel` takes `capabilities`; `ItemList` takes `variant`, `size`, `tileWidth` and `empty`, and `ItemRow` takes `thumbnail`, `icon`, `description`, `value`, `status`, `progress`, `checked` and a tree (`depth`, `expanded`).
- Re-read `references/design.md` after an update: the rules move with the package.
- The skill itself is refreshed by `setup`; `node "{{PACKAGE}}/artinos.mjs" skill --user` refreshes it for every project.

## Things that commonly go wrong

- **Controls unstyled:** `artinos.css` isn't imported at the root, or it's imported in a lazily loaded module.
- **Theme looks like studio:** the id isn't in the kit's `tokens/themes.css`; unknown ids fall back silently. Re-run `setup --force` with it added; don't paste CSS blocks by hand.
- **Glass themes look flat:** they need something behind them. Over a flat background they look like a plain tinted card.
- **Unreadable over a light scene:** set `scene="light"` on `ArtinosTheme`, or use a light theme.
- **Clipped dropdowns or HUD.** Select lists and the slider HUD portal to `<body>` with the theme tokens. Parents with `overflow: hidden` or `backdrop-filter` are fine; don't move them.
- **R3F / canvas apps.** The controls are DOM. For an editor, pass the `<Canvas>` as the Dock's `viewport` and the panels dock around it; for a few controls, render a `Panel` in an absolutely positioned overlay beside the `<Canvas>`, never inside it.
- **Dock is blank or zero-height.** It fills its parent: give the parent a height (`100vh`, or a sized grid cell).
- **Saved dock layout looks stale.** `storageKey` restores the last arrangement; it is skipped when panel ids change. `useDock().resetLayout()` starts over. A changed `capabilities` applies to a fresh layout.
- **`useToast` throws.** Wrap the app (or the subtree) in `<ToastProvider>` once.
- **Wheel input.** Sliders change on wheel only when focused, so page scroll isn't hijacked.
- **Double-click on a slider body** toggles it off, keeping its value. Pass `toggleable={false}` where that must never happen.
- **Everything is a plain slider.** Frequencies without `mapping="log"`, focal lengths that aren't rulers, white balance that isn't a gradient, counts that aren't stepped, intervals as two sliders. Go back through `references/catalogue.md`'s checklist.
- **Browsers.** The CSS needs `@property`, `color-mix()`, `:has()` and `backdrop-filter`, which every evergreen browser has.


### Optional Inspector

When the user wants a Leva/Tweakpane-style settings editor, select the `Inspector` kit component. It composes existing `Panel`, `Section`, `PropertyRow`, `ParamControl` and controls; do not create another control design. Use `createInspectorStore` for simple cases, or an app-provided `ParamStore` for real-time simulations. Keep the store instance stable. Use `createParamPanes` if the sections themselves must move or tear off independently. See `docs/components.md`.
