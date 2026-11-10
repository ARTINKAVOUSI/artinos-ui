---
name: artinos-ui
description: Add ARTINOS UI — the precision-instrument React control system (Slider, RangeSlider, Knob, XYPad, NumberField, TextField, Switch, Checkbox, ToggleGroup, ChipGroup, Segmented, ColorField, Select, FileDrop, Button, Toolbar, Badge, Stat, Meter, Spectrum, Progress, Sparkline, Panel/Section/SectionGroup/Field, Text/Stack/Inline, Tabs, PropertyRow, ItemRow, Menu, Dialog, Toast, Tooltip, CommandPalette, a dockable Dock workspace and a NodeGraph editor) with 108 glass, frost, studio and luxe themes — to a project, and build parameter panels, inspectors, studio workspaces and control docks with it. Use this skill whenever the user mentions ARTINOS UI, artinos-ui, the ARTINOS sliders or theme names (frost-deep, satin, onyx, pane…), or wants glass/frosted control panels, precision sliders, a parameter inspector or tweak panel, a dockable editor layout, a command palette or a node editor for a React / Next / Vite / React Three Fiber project — even if they don't name the package. Also use it for theming an existing artinos-ui kit, adding themes or components to it, or updating it.
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

Use what the user named. If they named no theme, use the default, **`nimbus`** (a soft carved Haze glass; `ArtinosTheme` sets it when `theme` is omitted, and every kit carries it), and say so. Choose another only when the host calls for it (and, when the brand calls for it, a type system: see `--type` in step 3):
- a flat dark app with nothing behind the panels → `studio` or `frost-deep`
- light app → `studio-light` or `frost-light`
- over imagery or a canvas → `frost-deep`, `glass`, `haze`, `satin` or `onyx`, and set `scene` to what is behind it: `<ArtinosTheme theme="frost-deep" scene="light">` over a light room, product shot or white page (without it, light-ink glass over a light scene is unreadable)
- start from the eight hero themes (`list` shows them first); reach for a variation only when the user wants a different finish, and name the hero it comes from.

Pick only the components the UI uses; each one brings the files it imports. `ArtinosTheme`, the `studio` base theme and the default `nimbus` are always included. Decide what each parameter *is* before deciding which component shows it: `references/catalogue.md` has the lookup table (parameter → component → kind), and the short version is in step 5.
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
- `docs/design.md` (the rules of the look), `docs/components.md`, `docs/catalogue.md` and `docs/theming.md`.

`setup` also installs this skill into the project's `.claude/skills/`, and prints the import lines for the detected entry file. `export` does the kit alone.

Options:
- `--dry-run` previews the files.
- `--force` updates an existing kit; files it no longer needs are removed.
- `--custom my-theme.css` adds a Theme Studio export (repeatable).
- `--type instrument,salon` adds type systems (`fine`, the default, always comes along: hairline Inter controls under extra-bold Inter Tight titles). There are twelve, each a complete design for one use. One family: `sleek` (Geist; control panels, tools, dashboards), `product` (Inter, display cut for titles; product apps), `native` (the system face; desktop-like apps), `legible` (Atkinson Hyperlegible; accessibility). Pairings, a display face over a text face: `instrument` (narrowed Instrument Sans over Inter; studio and creative tools), `salon` (Instrument Serif over Geist; premium products), `wide` (Mona Sans wide over Inter; hardware and brands), `grotesk` (Space Grotesk over Inter; technical products), `editorial` (Newsreader over Inter; docs and pages). Hairline and heavy, thin control text in a bright ink under heavy titles: `fine` (hairline Inter under extra-bold Inter Tight; precision and pro tools), `mass` (hairline Geist under black expanded Archivo; hardware), `round` (hairline Hanken Grotesk under rounded Unbounded; consumer devices). Use them with `<ArtinosTheme type="instrument">`. Pick by use, one per product; the display face is for titles only. See `references/design.md` → The type systems.
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

Read three references, in this order, before writing a panel:
1. `references/design.md`: the rules of the look. The levels of a panel, the reading scale of a page, layout, colour, what never to do, one panel built to the rules and the check to run on a screenshot. It is short; read all of it.
2. `references/catalogue.md`: every *kind* of every component and which to use for a given parameter.
3. `references/components.md`: every prop, default and example.

The family is wide, and a panel that shows every number as a plain slider wastes most of it.

**What a finished ARTINOS screen looks like** (the rest is in `design.md`):
- **One scale, twelve looks.** Sizes come from one ladder (12 · 13 · 14 · 16 · 18 · 20 · 24 · 28 · 36 · 48) in every system. A system sets the faces and its whole look: hairline or extra-bold headlines, a tick, bar or hairline on section names, accent or bright names, a fading serif title, hairline, bold or italic serif figures. Every Panel, Section and StatStrip draws it; never restyle them. One system per product.
- **A name is quiet, its answer is loud.** Labels 12 medium in a solid grey; values 13 semibold in the full ink. You get this by passing `label` and a value, and by never styling either.
- **Every level is told two ways at once** (size, weight, ink or face). On a page: eyebrow 12 in the mark face · title 24/600 · lead 16 · body 14 on 22 · note 13. In a panel: `Panel title` 16 · `Section title` 14 · value 13 · label 12.
- **A page section is eyebrow, title, one lead, then paragraphs** that open with the part's name in `strong`; facts go in a key table or list, help in a `Callout`.
- **Space and hairlines group, not boxes:** rows 8 apart, sections 18 either side of a line in a panel and 48 on a page, one label column per group.

**Pick the face from the parameter**, not from habit:

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
| on/off · flags · one of 2–4 · one of many · a colour · a file | `Switch` · `ToggleGroup` · `Segmented` · `Select` · `ColorField` · `FileDrop` |
| a read-only level · frequency bars · trend · figure · task · key figure with its change | `Meter` · `Spectrum` · `Sparkline` · `RollingValue` · `Progress` · `Stat` |
| a value that streams or must keep exact time (audio, scrubbing, telemetry) | the instrument's `motion` (`'audio'`, `'instant'`, default `'auto'`), and `source` instead of `value` when it changes faster than React should render |

Conveniences that are easy to miss:
- `format` (`percent`, `db`, `hz`, `angle`, `time`) and `unit` instead of hand-formatting;
- `mapping="log"` / `"exp"`: geometry only, the value stays exact;
- `detents` for meaningful points like 0 dB or the default;
- `onCommit` for expensive work (it fires once, on release);
- `toggleable` (on by default): double-click switches a parameter off and keeps its value; `Section enabled` switches a whole group;
- `PropertyRow modified onReset binding status` for inspector rows that can change or are driven.

**Compose the panel by the rules** (`references/catalogue.md`, *Layout and text*):
- every gap from the space scale: `Stack` / `Inline` with `gap="row"`, `"group"` or a step; never hand-set margins, pixel gaps or font sizes;
- every piece of text a `Text` role (`title` · `body` · `caption` · `kicker` · `value`…) or a component's own (`title`, `subtitle`, `label`, `description`, `hint`); sentence case, no capitals;
- one label column per group: `labelWidth` on the Panel or Section;
- a Section holds one idea and about seven rows; related numbers side by side (`columns`); a list of things is `ItemList` / `ItemRow`; one `primary` action per view.

**The ARTINOS look: build this way by default.** These are the package's own rules, not suggestions:
- **A tool around a canvas is a `Dock`.** The canvas goes in `viewport`; browsers and lists dock left, settings right, readouts and consoles bottom. Never hand-position floating `Panel`s with CSS. Each pane's actions go in a `PanelBar`, which rises into the tab strip.
- **Settings come from data.** Describe each value once (key, label, group, kind, range, `face`: percent, log, count, bipolar, degrees) and let `createParamPanes` set it: the right control per value, groups with icon, count and reset, a toggle that owns a group as its on/off, Advanced and Reset in the pane bar, dockable groups. Never hand-write a slider per setting.
- **Every group says what it is at a glance:** an `icon`, a `count`, a reset while it differs from its defaults, and `enabled` when the whole group can be off.
- **A list leads with what is current.** The current item first, on a `Section variant="card" heading="text"` with its description and a live `Badge`; then the rest in a `SectionGroup accordion` of categories, each row an `ItemRow` with a `swatch` or icon and `meta`, the current one `selected`.
- **Readouts live in a pane** (`StatStrip`, `Meter`, `Sparkline`), never loose over the canvas.
- **Type is the package's, never yours.** No font sizes, weights or colours in the app: a section title is a small sentence-case title, a label is never larger than its value, figures are the sans with tabular digits (no coding mono in a panel). Fine is the default type system. The package already sets all of this; an app that adds its own `font-family`, `font-size`, `text-transform: uppercase`, `letter-spacing` or a monospace font on panel text breaks it. The rules it holds: one voice (words and figures in one sans, mono only for code), no tracked capitals, 12px floor for every word in a panel at any density (quieter text is told by ink and weight), panel titles 16 and section names 14 in the title face at semibold, values 13 semibold in the full ink, labels 12 medium in a solid 76% grey (quiet inks are mixed, never see-through). One family (Geist) carries every level. For a part of your own, take a whole role: `font: var(--ar-type-label); color: var(--ar-tone-label)` (also `-value`, `-section`, `-group`, `-panel`, `-note`). If text looks wrong, fix the token in the package, never the app.
- **Glass stays as the theme draws it.** Pick a glass or frost theme for a canvas, and do not add washes or tints over panels.

**Compose a studio or inspector with the whole family**, not bare panels:
- a `Panel` with `icon`, `title`, `subtitle`, `actions` (Reset, a mode `Switch`) and a `footer` status line; `tabs` when it has modes;
- inside it, related settings in a `SectionGroup` (`accordion` or `toolbar` for Expand all · Collapse all); each `Section` with a `count`, a `description`, a reset in `actions`, and `enabled` when the whole group can be switched off; `variant="card"` for the one group that matters most;
- live readouts as a `StatStrip` at the top of a Panel, never floating loose over the canvas;
- lists as `ItemList` / `ItemRow` with a `swatch` or icon, `meta` and trailing badges, the current one `selected`;
- an editor around a canvas as a `Dock` (built on MetaBlock) rather than absolutely positioned panels;
- over a light room, backdrop or render, `scene="light"` on `ArtinosTheme` or a light theme: a glass theme's white ink fails on a light scene.

`references/theming.md` covers themes, `tokens={{ signal: '#…' }}` overrides, density, custom themes and every token.

### 6. Verify

Run the project's type-check and build, then look at it in the browser. Take a screenshot and run the check at the end of `references/design.md` on it: from arm's length the panel name, a section name, a value and a label must be told apart without reading them; one accent, one primary action, one label column per group; no text set by hand, in capitals, in a mono or under 12px. Then the catalogue's checklist for the controls themselves. Then the usual failures:
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
- **Everything is a plain slider.** Frequencies without `mapping="log"`, focal lengths that aren't rulers, white balance that isn't a gradient, counts that aren't stepped, intervals as two sliders. Go back through `references/catalogue.md`'s checklist.
- **Browsers.** The CSS needs `@property`, `color-mix()`, `:has()` and `backdrop-filter`, which every evergreen browser has.
