# ARTINOS UI — theming

Contents: picking a theme (all 14) · solid vs glass · density · token layers · overriding tokens · custom themes · finish overrides · key tokens

`<artinos-ui>` below means the ARTINOS UI package folder.

## Picking a theme

A theme is the whole look: ground, ink, accent colours, panel glass and the finish of every control (well, insert, seam, LEDs). There is no second setting to coordinate.

```tsx
<ArtinosTheme>…</ArtinosTheme>                 {/* the default: nimbus */}
<ArtinosTheme theme="frost-deep">…</ArtinosTheme>
<div data-ar-theme="glass-dark">…</div>   {/* works without React too */}
```

**The default is `nimbus`**: deep frost, gently carved wells, a bright value gradient and a little more room. `ArtinosTheme` sets it when no `theme` is given and every kit carries it (beside `pro-gray`, the base of every kit). Its earlier id, `haze-carve-custom`, still works.

- **See them all:** run `node <artinos-ui>/artinos.mjs list`, read the table below, or open the live gallery in `<artinos-ui>/showcase/artinos-ui-showcase.html`.
- **In a project with a kit:** `THEMES` / `THEME_META` from the kit's `index.ts`, or the header of its `tokens/themes.css`, list exactly the themes that kit contains. An id that isn't there silently falls back to the studio look.
- **Adding a theme to a kit:** re-export with it rather than hand-copying CSS blocks, because a theme lives in two files and shares rules. Run `node <artinos-ui>/artinos.mjs export --project . --themes pro-gray,onyx --components <same list> --force`.

**The themes.** Fourteen themes in one set, each a complete look of its own: pick the one for the job. `THEMES` lists them in this order, the default first.

<!-- themes:start -->
| id | name | kind | look |
|---|---|---|---|
| `nimbus` | Nimbus | glass | The default. Haze Carve softened: deep frost, gently carved wells, a bright value gradient and a little more room. Calm over any scene. |
| `pro-gray` | Pro Gray | solid | The neutral grey of professional 3D and grading software: mid-grey desk, darker wells, lighter grey fills, an azure signal. |
| `studio-light` | Studio Light | solid | The same instrument on a light neutral desk. White satin controls. |
| `frost-deep` | Deep Frost | glass | The deepest frost, elevated: pressed tracks and raised dense values with charcoal numerals. |
| `onyx` | Onyx | glass | Black smoked glass with fine gold hairlines, gold seams and ivory ink. A watch dial at night. |
| `smoke` | Smoke | glass | The scene blurred under a dark veil, for bright or busy imagery. Flat white fills. |
| `haze-carve` | Haze Carve | glass | Haze carved: tracks set into the frost and edged by a fine groove, values floating softly. |
| `haze-day` | Haze Day | glass | The same deep blur under a bright white veil: graphite ink, a hairline pane and values on a breath of shadow. |
| `ice` | Ice | glass | Clean cool frost: a faint blue-white pane, icy controls, deep navy ink. |
| `tactile-porcelain` | Porcelain | solid | Warm porcelain, rounded low-relief edges and soft directional contact shadows. |
| `tactile-graphite` | Graphite | solid | Matte graphite, compact rounded inserts, deeper sockets and mint seams. |
| `tactile-alloy` | Alloy | solid | Satin alloy, square-shouldered micro-bevels and precise machined seams. |
| `tactile-basalt` | Basalt | solid | Near-black mineral chassis, shallow chamfered inserts and champagne accents. |
| `tactile-opal` | Opal | solid | Opalescent polymer-inspired relief, rounded capsules and diffuse edge highlights. |
<!-- themes:end -->

**Tactile Modernism (experimental):** five solid finishes explore the middle ground between soft UI and physical instruments. Each changes the panel, sheet, well, insert and seam together. Opal suggests translucent polymer through diffuse highlights; it is not a refractive glass renderer. All use the same components, type and density. The second study adds distinct well and insert radii, inset depth, panel edge profiles, directional light and material-specific shadow stacks. Compare them against Nimbus and Studio Light in the showcase. Use `ground` for a complete solid workspace.

**Choosing:**
- **Dark app:** `pro-gray` (solid): the neutral grey of professional 3D and grading software.
- **Light app:** `studio-light` (solid).
- **UI over a 3D canvas, video or photo:** `nimbus`, `frost-deep` or `ice`, or `onyx` for a dark premium look, and set `scene` to what is behind it: `<ArtinosTheme theme="frost-deep" scene="light">` over a light room, product shot or white page. Most glass themes have light ink drawn for dark scenes; over a light one their frost turns the colour of the ink and labels wash out.

`THEMES`, `THEME_META` (label, family, kind, description and a three-colour swatch) and `GLASS_THEMES` are exported, so a theme picker is a few lines:

```tsx
<Select label="Theme" options={THEMES.map((t) => ({ value: t, label: THEME_META[t].label }))} value={theme} onChange={setTheme} appearance="well" />
```

## Solid vs glass

`THEME_META[id].kind` is `'solid'` or `'glass'`.
- **Solid** themes paint their own ground. Use `<ArtinosTheme theme="pro-gray" ground>` on the page or panel container.
- **Glass** themes are panes: `Panel` uses `backdrop-filter` over whatever is behind it. They look right over imagery, video or a live canvas. Over a flat colour they look like a plain tinted card, which is expected. Don't add `ground` to a glass scope that should show the scene through it.
- **Scene.** Glass ink is drawn for a scene that contrasts with it. `scene="light" | "dark"` on `ArtinosTheme` (`data-ar-scene`) sets `--ar-panel-floor`, a wash of the theme's `--ar-bg-app` at `--ar-floor-amount` (72%, more on the 23 themes whose ink needs it), under Panel, Dock panes and the floating Toolbar, and steps `--ar-text-low` and `--ar-text-faint` up to `--ar-text-mid`. Over a mismatched scene every text role then holds 4.5:1; over a scene that already contrasts the floor barely shows. Lower `--ar-floor-amount` for more glass (and less contrast), raise it for more ground. Without `scene`, glass has no floor: right over the scene a theme was drawn for, unreadable over the other kind.

For React Three Fiber, the controls are DOM. Put them in an HTML overlay above the `<Canvas>` (a sibling `div` with `position: absolute`), not inside the Canvas tree, so the glass blurs the rendered scene. drei `<Html>` works for UI attached to 3D objects, but inspector panels belong in the overlay.

## Density

Three families of the same instrument, chosen for a whole scope like a theme: `<ArtinosTheme density="dense">`, or `data-ar-density="dense"` on any element (also per control: `density="dense"`). `DENSITIES` lists them and `DENSITY_META` gives each one's label and scale. A family is a complete definition of its own, in `tokens/density.css`; every theme has its equivalent in each.

| | dense | standard (default) | comfort |
|---|---|---|---|
| for | a working instrument: an editor, an inspector, forty parameters on one screen | the family as drawn: to read as much as to work | read at arm's length, or touched |
| scale (`--ar-k`) | 22 / 28 | 25 / 28 | 1 |
| a 28px theme's control | 22px | 28px | 32px |
| labels · values | 12 · 12 | 12 · 13 | 13 · 14 |
| a section's name · a panel's | 13 · 14 | 14 · 16 | 16 · 18 |
| own row rules | a colour as a chip and its code, small buttons and fields the height of the row | | |

**Proportional, not scaled down.** A theme draws itself at its own size, which is Comfort: its control height (`--ar-control-h`), side padding (`--ar-control-pad`), gap (`--ar-control-gap`), label column (`--ar-label-col`), every corner and inset. The family multiplies all of it by one scale, and every component multiplies its own padding, gaps, small boxes and corners by the same scale. Nimbus Dense is Nimbus, proportionally tighter: a 27px Nimbus capsule becomes 21, its 7px corner 5.5, its 16px shell 12.5 (corners land on half pixels). Words are the exception: 12px is the floor, so type steps along the scale (12 · 13 · 14 · 16 · 18) instead of shrinking, and each type collection keeps its own faces and weights (a heading is stepped by `--ar-title-step` and `--ar-section-step`, figures by `--ar-stat-scale`). A family sets its own rhythm too: `--ar-row-space` (the gap between rows before scaling: 6.4 · 6 · 8px for Dense · Standard · Comfort, so 5 · 5 · 8px once scaled) and `--ar-section-space` (the air around a section: 12 · 16 · 18px).

**A theme's own settings per family.** Each family can carry its own version of a theme: what it changes in Dense is not applied in Standard or Comfort. In React: `<ArtinosTheme theme="nimbus" tokens={{ /* every family */ }} densityTokens={{ dense: { signal: '#ff4fa3' } }}>`. In CSS, a block per family after the theme's own: `[data-ar-theme='my-theme'][data-ar-density='dense'], [data-ar-density='dense'] [data-ar-theme='my-theme']:not([data-ar-density]) { … }`. The Theme Studio works this way: an edit lands in the family being previewed (the bar says which), and its CSS, JSON and TSX exports carry each family's settings.

**Write sizes the same way.** In your own CSS inside a theme scope, multiply a fixed size by the scale (`padding: calc(12px * var(--ar-k, 1))`), or build it from the tokens (`var(--ar-h)`, `var(--ar-row-gap)`). A custom theme sets `control-h`, `control-pad` and `control-gap`, never `h`, so every family scales it. Use one family for a whole tool, never one dense panel among standard ones.

## Accents

Any theme can take any accent: `<ArtinosTheme theme="veil" accent="violet">` or `data-ar-accent="violet"` on the theme's element. Only the signal changes (live edges, LEDs, focus, selection, the ruler index). The accents are `teal` · `azure` · `violet` · `rose` · `coral` · `amber` · `lime` · `mono`; each has a bright value for dark themes and a deeper one for light themes, chosen by the theme's `color-scheme` through `light-dark()`. `ACCENTS` and `ACCENT_META` list them for a picker. Themes that draw their live edge in their own metal (the luxe themes, for example) keep it; the accent still sets focus and selection.

## Type systems

Twelve systems, each a complete design for one use; `docs/design.md` has the method they share and how the pairings are built. Every system uses the same sizes (one ladder: 12 · 13 · 14 · 16 · 18 · 20 · 24 · 28 · 36 · 48), so a page and a panel keep their proportions; a system changes the faces, weights, tracking, title width (`--ar-title-stretch`) and how an opening line and a small mark are set. Four are one family; five pair a display face with a text face; three set hairline control text under heavy titles.

| system | faces | for | how it reads |
|---|---|---|---|
| `sleek` | Geist · Geist Mono | control panels, tools, dashboards | one family from label to headline; section numbers, meta lines and eyebrows in the mono. Precise and quiet. |
| `product` | Inter Display · Inter · JetBrains Mono | product apps, inspectors | Inter's display cut for titles, its text cut for every control. Neutral and refined. |
| `native` | the system face · the system mono | desktop-like apps | SF Pro on Apple, Segoe UI Variable on Windows. Nothing to load. |
| `legible` | Atkinson Hyperlegible Next · Mono | accessibility, kiosks, long reading | letters drawn so similar shapes are hard to confuse, bolder titles, open line spacing. |
| `instrument` | Instrument Sans · Inter · Geist Mono | studio tools, creative software | narrowed Instrument Sans titles over Inter: drawn and precise, warmer than a plain grotesk. An `<em>` word turns to Instrument Serif italic. |
| `salon` | Instrument Serif · Geist · Geist Mono | premium products, launch pages around a tool | tall serif titles and italic opening lines over crisp Geist controls: the serif names, the sans measures. |
| `wide` | Mona Sans · Inter · Geist Mono | hardware, devices, confident brands | Mona Sans at its widest for titles over a neutral Inter: engineered headlines, calm controls. |
| `grotesk` | Space Grotesk · Inter · JetBrains Mono | technical and developer products | Space Grotesk titles with their engineered quirks over Inter. |
| `editorial` | Newsreader · Inter · JetBrains Mono | docs, onboarding, pages around panels | serif titles and opening lines over Inter paragraphs and controls. |
| `fine` (default) | Inter Tight · Inter · JetBrains Mono | precision instruments, pro audio and video | hairline Inter on every control in a bright ink under extra-bold, tight Inter Tight titles; hairline 28 figures. |
| `mass` | Archivo · Geist · Geist Mono | hardware, industrial products | hairline Geist controls under black, expanded Archivo titles: fine instruments in a heavy chassis. |
| `round` | Unbounded · Hanken Grotesk · JetBrains Mono | consumer devices, friendly products | hairline Hanken Grotesk controls under wide, rounded Unbounded titles; section names in the accent. |

Set one on the theme scope or on any element; it inherits, carries through nested themes and follows portalled overlays (lists, menus, the palette, tooltips, the slider HUD). A bare `data-ar-type` element inside a theme re-points the components inside it too.

```tsx
<ArtinosTheme theme="onyx" type="product"> … </ArtinosTheme>
<div data-ar-type="editorial"> … </div>
```

Earlier ids (`sleek-air`, `couture`, `swiss`, `terminal`, `manrope`…) still work through `TYPE_ALIASES` and map to the nearest system. A kit ships the systems it was exported with (`--type instrument,salon`; `fine`, the default, always comes along) and `tokens/fonts.css` loads exactly their faces from Google Fonts. The registry is `TYPE_COLLECTIONS` / `TYPE_META[id]` (`label`, `ui`, `mono`, `display`, `serif`, `description`, `fonts`).

## Token layers

Three layers, each reading only the one above it:

| layer | examples | file |
|---|---|---|
| primitives | `--ar-ink-*`, `--ar-teal-*`, `--ar-azure-500` | `tokens.css` |
| roles | `--ar-bg-app`, `--ar-text-hi`, `--ar-signal`, `--ar-panel-tint` | `tokens.css` (studio) + `themes.css` |
| control finish | `--ar-insert`, `--ar-seam`, `--ar-trough`, `--ar-insert-ink` | `materials.css` |

Components read tokens, never literal colours, so restyling is always "set tokens on a scope", never "edit a component".

## Overriding tokens

Inline on any scope (short names get the `--ar-` prefix):

```tsx
<ArtinosTheme theme="frost-deep" tokens={{ signal: '#FF4FA3', 'signal-hi': '#FFB3D6' }}>…</ArtinosTheme>
```

Or in CSS, loaded after `artinos.css`:

```css
.brand[data-ar-theme='frost-deep'] { --ar-signal: #ff4fa3; --ar-signal-hi: #ffb3d6; }
```

`themeStyle(tokens)` returns the same inline style object without the wrapper.

The live seam, LEDs and focus ring derive from `--ar-signal` (the live seam is `color-mix(in srgb, var(--ar-signal) 78%, #000)`), so changing the signal recolours all of them. Some themes pin their seam or LED colours in their finish. If a signal change doesn't reach them, also set `--ar-seam-active` / `--ar-led-on`.

## Custom themes

For a fully custom look, use the **Theme Studio** in the showcase (`<artinos-ui>/showcase/artinos-ui-showcase.html#studio`). It edits every token live against the full component gallery:
- ground, ink, lines and accents;
- panel glass;
- well, insert and seam;
- typography, size and motion;
- any raw token.

**Inspect** (`I`) lets you click any part of a component to edit just the tokens it reads. Saved themes stay in that browser, and export as:
- **CSS:** a standalone block with every resolved token.
- **JSON:** re-importable into the studio.
- **TSX:** the overrides as `tokens`.

```css
[data-ar-theme='my-theme'] { --ar-signal: #ff4fa3; /* …every token… */ }
```

Add it to a kit by re-exporting with `--custom my-theme.css`. It lands in `tokens/custom-themes.css`, which `artinos.css` imports. Then use `<ArtinosTheme theme="my-theme">`. `theme` accepts any name, and a custom theme doesn't need its base theme in the kit. The showcase's Export kit can include saved themes directly.

## Finish overrides (advanced)

Each theme already has its control finish. To force another on one control or scope, set `material` (or `data-ar-material`) to one of:
- `optical`: the original prototype insert;
- `reference`: the Figma source, with a polished bar, double-line handle and mono 700;
- `soft`, `frost`, `milk`, `clear`, `tint`, `smoked` or `metal`.

Put it on the same element as `data-ar-theme` or below it. Kits exported with `--no-materials` don't contain these.

## Key tokens

The design language in one paragraph: every part is built from five materials. **Panel glass** holds things (Panel, Dock panes, a floating Toolbar). The **frosted sheet** floats (lists, menus, the palette, dialogs, toasts, tooltips, graph nodes). The **well** is where a value is edited (fields, troughs, key caps, canvases). The **insert** is the polished part you press or drag (buttons, knob caps, slider fills). The **seam or LED** marks what is live. Text is one voice: the sans sets labels, buttons, chips, segments, menu actions, prose and every number and readout, with tabular digits so figures line up; the mono is kept for code. A section name is 14 in the title face (weight `--ar-weight-section`; extra-bold in Fine), the brightest line of its group, over 12px rows, with a hairline through its title row; no capitals. Body text is 13px in a panel; titles are bold and close-set. Motion uses the duration and curve tokens only. Everything that scrolls inside a theme scope (lists, the palette, dock panels, your own panels) gets the family's one scrollbar: a thin rounded thumb in the theme's ink, no buttons, no track; a page outside the scope can copy the `::-webkit-scrollbar` rules from `core/core.css` onto `html`.

Roles (theme level):
- ground and surfaces: `--ar-bg-app`, `--ar-bg-surface`, `--ar-bg-raised`, `--ar-bg-well`, `--ar-bg-hover`, `--ar-bg-active`
- ink: `--ar-text-hi`, `--ar-text-mid`, `--ar-text-low`, `--ar-text-faint` — a theme sets `--ar-text-hi`; the quieter steps are derived from it at fixed strengths (90 · 74 · 58%), so titles, values, labels and notes keep the same distance in every theme and in its own hue. Override a step with an inline token (`tokens={{ 'text-low': … }}`) when you need to.
- lines: `--ar-line-subtle`, `--ar-line`, `--ar-line-strong`, `--ar-tick`, `--ar-tick-major`
- accents: `--ar-signal`, `--ar-signal-hi`, `--ar-signal-line`, `--ar-signal-wash`, `--ar-signal-ink`, `--ar-bind`, `--ar-warn`, `--ar-fault`, `--ar-focus-ring`
- reading: `--ar-type-section`, `--ar-type-group`, `--ar-type-value`, `--ar-type-label`, `--ar-type-note`, `--ar-type-hero`, `--ar-type-quote` (each a whole `font`), `--ar-paper` (the bright ink the tones are cut from), and `--ar-tone-title`, `--ar-tone-value`, `--ar-tone-body`, `--ar-tone-note`, `--ar-tone-label`, `--ar-tone-hint` (the paper ink at fixed strengths, so the steps between roles are the same on every theme), and `--ar-tone-accent` (the accent as text: the signal half blended toward the ink, so small words stay readable on glass in any accent). A theme needs no values of its own for any of them.
- focus: `--ar-focus-ink` (the signal eased toward the ink), `--ar-focus-lift` (the light a recessed surface takes), `--ar-focus-raise` (the filter that lifts a polished part), `--ar-focus-ring` (the same light as a one-line box-shadow, for your own parts) and `--ar-selection` (selected text). They are worked out from the signal, so a theme or an accent needs no focus colour of its own.
- panel glass: `--ar-edge-light` (the lit top edge of a Panel or dock pane, brightest in the middle; `transparent` turns it off), `--ar-panel-tint`, `--ar-panel-floor` (set by `scene`), `--ar-floor-amount`, `--ar-panel-blur` (a `backdrop-filter` value), `--ar-panel-sheen`, `--ar-panel-shadow`, `--ar-panel-text-shadow`
- floating ink and the typed-entry field: `--ar-float-bg`, `--ar-float-ring`, `--ar-float-shadow`, `--ar-float-ink`, `--ar-float-ink-low`
- radii: `--ar-radius-control`, `--ar-radius-card`, `--ar-radius-panel`, `--ar-radius-shell`
- typography (see [Typography](#typography) below): `--ar-font-ui`, `--ar-font-num`, `--ar-weight-*`, `--ar-text-*`, `--ar-caps-*`, `--ar-track-*`, `--ar-leading-*`
- size (density-driven): `--ar-h`, `--ar-label-size`, `--ar-value-size`, `--ar-pad-x`, `--ar-gap`
- motion:
  - durations: `--ar-dur-value` (70ms, a value following the hand), `--ar-dur-state` (130ms, hover and press), `--ar-dur-surface` (220ms, a material changing), `--ar-dur-layout` (380ms, things moving apart), `--ar-dur-enter` (200ms, an overlay arriving), `--ar-dur-exit` (130ms, leaving, always quicker);
  - curves: `--ar-ease` (general), `--ar-ease-roll` (settling: rolls, glides, sheets), `--ar-ease-spring` (a small overshoot: pops, knobs, pucks), `--ar-ease-exit` (departures);
  - `prefers-reduced-motion: reduce` sets every duration to 0. Set them to 0 yourself on a scope to turn motion off there.
- the reader's settings (in `core/core.css`, after the ramps):
  - `prefers-contrast: more`: every text role takes `--ar-text-hi` and the glass gets a 92% floor of its own ground;
  - `prefers-reduced-transparency: reduce`: panes and sheets become the solid `--ar-bg-app`, with no blur;
  - `forced-colors: active` (Windows High Contrast): focus is a 2px `Highlight` outline, wells, panels and overlays get a 1px `CanvasText` outline, and fills, knobs, chosen segments and seams take `Highlight` / `CanvasText`, since the system drops the box-shadows they are drawn with.

Control finish (materials level):
- well: `--ar-trough`, `--ar-trough-backdrop`, `--ar-well`, `--ar-inset`, `--ar-radius` (7px). `--ar-well` is drawn on a layer over what the well holds, so the shading falls on fills, thumbs, caps and the chosen segment as on the empty trough; a state that changes it on one control sets `--ar-well-shade` on that well (default `var(--ar-well)`)
- insert: `--ar-insert`, `--ar-insert-sheen` (light laid over every theme's insert — a soft top light and a gentle shade below; `none` turns it off), `--ar-insert-shadow`, `--ar-insert-backdrop`, `--ar-insert-radius` (6px), `--ar-insert-ink`, `--ar-insert-unit-ink`, `--ar-insert-text-shadow`, `--ar-insert-off-filter`
- ink off the insert: `--ar-label-ink`, `--ar-value-ink`, `--ar-unit-ink`, `--ar-off-ink`, `--ar-base-text-shadow`
- figures: `--ar-figure-font` is the face of every number (readouts, fields, vector cells, colour codes, ruler marks, values, graph readouts); unset, it is `--ar-control-font`. Fine sets it to its title face (Inter Tight) with `--ar-weight-readout: 300`.
- seam (handle): `--ar-seam`, `--ar-seam-hover`, `--ar-seam-active`, `--ar-seam-w`, `--ar-seam-offset` (8px from the fill end), `--ar-seam-scale`, `--ar-seam-glow`
- LEDs, cells, gradients, ruler: `--ar-led-on`, `--ar-led-off`, `--ar-led-glow`, `--ar-cell`, `--ar-cell-shadow`, `--ar-grad-well`, `--ar-ruler-ink`, `--ar-index`
- typography of controls: the voice of control text — `--ar-voice-font` (the sans), `--ar-voice-case` (`none`; option labels made from an all-lowercase id read in sentence case — `"fixed"` → "Fixed" — while names such as "glTF" or "sRGB" stay as written), `--ar-voice-tracking`, `--ar-voice-size` (label size + 1px), `--ar-voice-weight` (regular); the numbers — `--ar-control-font` (the mono), `--ar-value-weight`; capitals for small headings — `--ar-label-weight`, `--ar-label-tracking`, `--ar-label-case`. To bring back mono caps controls, set the voice tokens to `var(--ar-control-font)`, `uppercase` and `var(--ar-label-tracking)`.
- frosted sheet, shared by everything that floats (the Select list, menus, the command palette, dialogs, toasts, tooltips, the slider HUD, the dock menu) and by graph nodes: `--ar-sheet-bg` (grain, a milky veil and the theme's ground at half strength), `--ar-sheet-blur`, `--ar-sheet-shadow`, `--ar-float-depth` (a close contact shadow under every floating sheet, so it floats rather than lies flat), `--ar-row-radius` (6px: rows in menus, lists and the palette sit inset under a rounded gliding highlight)
- Select list (defaults to the sheet): `--ar-list-bg`, `--ar-list-backdrop`, `--ar-list-shadow`, `--ar-list-insert`, `--ar-list-hover`, `--ar-list-ink`

### Typography

The default system is **Fine**: hairline **Inter** (300, in a bright ink) on every label and control, **Inter Tight** extra-bold for titles, **JetBrains Mono** for code only; figures are Inter with tabular digits. Levels are told by size, weight and ink, not by a second face. Every quiet ink is solid: the ink mixed toward `--ar-ink-mid` (a neutral mid grey with a breath of the theme accent), never see-through. Earlier type ids (`manrope`, `luxe`, `modern`…) still work through `TYPE_ALIASES`. **Every text size comes from one ladder: 12 · 13 · 14 · 16 · 18 · 20 · 24 · 28 · 36 · 48 px, the same in every type system.** Panels, dock panes and dialogs keep one fixed compact scale whichever type set surrounds them: a title of 16 and section names of 14 (both in the title face at the system's title weight: extra-bold in Fine), values of 13 (firm, full ink) and labels of 12 (500 at 76% ink; in Fine and the other hairline systems 300 at 90%). A type collection's multipliers snap back to it with `round()`, so no size lands between steps, and whole-pixel line heights follow. A set's scale never inverts the order: a `title` is 16, 20 or 24, a `heading` at least 14, a `lead` at least 14 and never lighter than regular, and a `note` keeps its own size in every set. Weight runs against size: display sizes (28 and up) are light, titles of 20 and under are semibold, and nothing below 28px is lighter than regular, so text holds on glass. There are no tracked capitals. Each panel role is a whole font and an ink: `--ar-type-panel`, `--ar-type-section`, `--ar-type-group`, `--ar-type-value`, `--ar-type-label`, `--ar-type-note` with `--ar-tone-title` (100%), `--ar-tone-value` (100%), `--ar-tone-body` (88%), `--ar-tone-label` (76%), `--ar-tone-note` (66%) and `--ar-tone-hint` (54%), each the theme's main ink mixed toward `--ar-ink-mid`. `--ar-name-strength` (86%) is how much of its ink a control's own label keeps beside its readout. `design.md` has the rules these serve. Everything uses the tokens below; no component sets a literal size, weight or tracking.

- families: `--ar-font-ui` (the sans), `--ar-font-num` (figures: the sans with tabular digits), `--ar-font-mark` (section numbers, eyebrows, meta lines: Geist Mono in Sleek), `--ar-font-code` (code), `--ar-font-display` (titles: the sans by default; a collection may give it its sans, or a display or serif face), `--ar-font-heading` (a section's name on a pane: the title face, or the sans in the sets whose title face is a serif, so a 14px name stays crisp), `--ar-font-lead` (the opening sentence: the sans by default, used by `lead`, `statement` and `quote`), `--ar-font-serif` (Instrument Serif: large accent words, `numeral` and `face="serif"` titles). A [type collection](#type-collections) sets the sans, mono and title faces, and may set its own serif (`--ar-serif-adjust` evens out that serif's apparent size). It may also set `--ar-title-scale`, `--ar-title-case`, `--ar-title-stretch`, `--ar-weight-display`, `--ar-weight-title`, `--ar-track-heading`, `--ar-track-heading-sm`, `--ar-leading-heading`, `--ar-font-prose`, `--ar-prose-scale`, `--ar-leading-prose`, `--ar-lead-style`, `--ar-weight-lead`, `--ar-lead-scale`, `--ar-font-accent`, `--ar-accent-style`, `--ar-weight-accent`, `--ar-font-numeral`, `--ar-numeral-style`, `--ar-font-mark`, `--ar-mark-case`, `--ar-mark-track` and `--ar-weight-mark`. A theme's controls read `--ar-control-font` (the figures face; Roboto Mono in `reference`).
- weights, the weights the fonts are loaded at (`font-synthesis: none`, so nothing is faked): `--ar-weight-thin` (300, a hero figure at 40px and up), `--ar-weight-regular` (400, prose, values, rows), `--ar-weight-medium` (500, labels, tabs, small marks), `--ar-weight-title` (800 in Fine, 600 in most systems: titles of 20px and under, section and panel names), `--ar-weight-bold` (600, strong text and small group names); `--ar-weight-light` is `--ar-weight-regular` under another name and is kept for themes that read it. `--ar-weight-text` (regular) is small sans text, inputs, rows and menus. Control readouts use `--ar-value-weight` (`--ar-weight-readout`: 500 in Fine, 600 elsewhere; 700 in `reference`). `--ar-weight-name` (500; 300 in the hairline systems, Fine included) is a label beside a value; control words (buttons, chips, segments) are medium. `--ar-track-small` (+0.01em; +0.025em in Fine) opens 12px words.
- space: `--ar-space-1` … `--ar-space-9` (2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 px) and the roles density tunes — `--ar-row-gap` (rows in a group), `--ar-group-gap` (groups in a panel), `--ar-section-gap` (air around a section), `--ar-section-apart` (section to section: the gap + 8px, 26px at standard; the hairline is in each title row), `--ar-panel-pad-x` / `--ar-panel-pad-y` (a panel's padding) — plus `--ar-measure` (64ch, a paragraph's longest line). The catalogue's *Layout and text* chapter has the rules.
- the ladder: `--ar-step-12` · `13` · `14` · `16` · `18` · `20` · `24` · `28` · `36` · `48`. Every size token below is one of these steps; change a step and every role set at it follows.
- the control scale: `--ar-text-xs` (12px: hints and captions; the same step as `--ar-text-sm`), `--ar-text-sm` (12px, secondary lines, tabs, menu rows), `--ar-text-md` (13px, body), `--ar-text-lg` (14px, sheet titles), `--ar-text-xl` (16px), `--ar-text-2xl` (20px), `--ar-text-3xl` (28px, display). Mono readouts that aren't caps use the same steps.
- small marks outside a control (foot lines, counts, badges, keycaps, port tags), weight 500: `--ar-caps-sm` (12px) and `--ar-caps-xs` (12px: the floor holds for the smallest mark too). The caps switch sets them in tracked capitals: `--ar-caps-case` (`none`, or `uppercase`) and `--ar-caps-on` (0, or 1 to apply `--ar-track-caps` and the control-label tracking); a collection that turns it on steps the sizes down to 10 · 9.5px. Small headings (a section's title, a kicker) have their own: `--ar-head-case`, `--ar-head-tracking`, `--ar-head-bump`. Control labels are `--ar-label-size`, set by density: 12 · 12 · 13px for dense · standard · comfort. Control words (`--ar-voice-size`) are recomputed on every density scope, so a Comfort panel inside a Standard page has 13px words throughout. The `.ar-caps` class (and `.ar-caps--xs`) applies the whole recipe.
- the reading scale, for the `Text` roles: `--ar-read-hero` (48px), `--ar-read-display` (36), `--ar-read-title` (24), `--ar-read-heading` (18), `--ar-read-subheading` (14), `--ar-read-lead` (16), `--ar-read-body` (14), `--ar-read-note` (13), plus `--ar-read-statement` (20), `--ar-read-numeral` (28), `--ar-read-quote` (16) and `--ar-read-figure` (28). The same in every system (`--ar-title-scale` is 1). A Panel, dock pane or Dialog uses a fixed compact scale (hero 24 · display 20 · title 16 · heading 14 · subheading 13 · lead 14 · body 13 · note 12).
- control text is tuned by density and theme: `--ar-label-size` (12 · 12 · 13px for dense · standard · comfort) and `--ar-value-size` (13 · 13 · 14px: a readout is a size above its name), and the control-typography tokens under Control finish.
- tracking: `--ar-track-caps` (0.1em, for capitals; applied only when the caps switch is on), `--ar-track-text` (0, set as drawn), `--ar-track-title` (-0.012em, 18px and up), `--ar-track-display` (-0.022em, 28px and up).
- title treatments, set per type system (design.md → Each system's look): `--ar-panel-mark`, `--ar-panel-rule`, `--ar-panel-title-accent`, `--ar-title-gradient` / `--ar-title-fill`, `--ar-section-tick` / `--ar-section-tick-w`, `--ar-section-rule`, `--ar-section-accent`, `--ar-section-quiet`, `--ar-group-accent`, and the StatStrip figure: `--ar-stat-font`, `--ar-stat-weight`, `--ar-stat-size`, `--ar-stat-style`, `--ar-stat-accent`. Keywords, lengths and percentages only.
- leading: `--ar-leading-none` (1, single-line marks), `--ar-leading-snug` (1.3, titles and menu rows), `--ar-leading-text` (1.55, prose), `--ar-leading-code` (1.65, code and long reading).

```css
.my-mark  { font: var(--ar-weight-medium) var(--ar-caps-sm) / 1 var(--ar-font-num); letter-spacing: calc(var(--ar-track-caps) * var(--ar-caps-on)); text-transform: var(--ar-caps-case); }
.my-title  { font: var(--ar-weight-title) var(--ar-text-xl) / var(--ar-leading-snug) var(--ar-font-display); letter-spacing: var(--ar-track-title); }
```
