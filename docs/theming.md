# ARTINOS UI — theming

Contents: picking a theme (all 52) · solid vs glass · density · token layers · overriding tokens · custom themes · finish overrides · key tokens

`<artinos-ui>` below means the ARTINOS UI package folder.

## Picking a theme

A theme is the whole look: ground, ink, accent colours, panel glass and the finish of every control (well, insert, seam, LEDs). There is no second setting to coordinate.

```tsx
<ArtinosTheme theme="frost-deep">…</ArtinosTheme>
<div data-ar-theme="glass-dark">…</div>   {/* works without React too */}
```

- **See them all:** run `node <artinos-ui>/artinos.mjs list`, read the table below, or open the live gallery in `<artinos-ui>/showcase/artinos-ui-showcase.html`.
- **In a project with a kit:** `THEMES` / `THEME_META` from the kit's `index.ts`, or the header of its `tokens/themes.css`, list exactly the themes that kit contains. An id that isn't there silently falls back to the studio look.
- **Adding a theme to a kit:** re-export with it rather than hand-copying CSS blocks, because a theme lives in two files and shares rules. Run `node <artinos-ui>/artinos.mjs export --project . --themes satin,onyx --components <same list> --force`.

**Choosing:**
- **Dark app:** `frost-deep` (the showcase default), `studio`, or an untinted, atelier glass or luxe glass theme.
- **Light app:** `studio-light`, `glass-light`, `frost-light`, `pane-light`, `argent`, `ivory`, `porcelain` or `pearl`.
- **UI over a 3D canvas, video or photo:** any glass or frost theme, and set `scene` to what is behind it: `<ArtinosTheme theme="frost-deep" scene="light">` over a light room, product shot or white page. Most glass themes have light ink drawn for dark scenes; over a light one their frost turns the colour of the ink and labels wash out.

**Families:**
- **Untinted:** achromatic panes with no tint, only blur. Accents are the ARTINOS set: teal signal, azure bind, amber warn, rose fault.
- **Optical:** neutral panes with glossy pearl or translucent fills.
- **Atelier:** coordinated full palettes, each with its own radii and finish.
- **Luxe:** coloured premium panes with metallic hairlines and wider label tracking.
- **Studio and signature:** solid grounds. `optical` and `reference` are the original prototype and the Figma source.

<!-- themes:start -->
| family | id | name | kind | look |
|---|---|---|---|---|
| scene | `sheer` | Sheer | glass | A light blur under a thin dark veil: the scene stays close. White ink, flat fills, nothing else. |
|  | `veil` | Veil | glass | The scene blurred under a thin white veil. Flat fills, no border, no highlight, no colour. |
|  | `haze` | Haze | glass | The deepest blur under a faint white veil: the scene becomes soft light. Flat white fills. |
|  | `smoke` | Smoke | glass | The scene blurred under a dark veil, for bright or busy imagery. Flat white fills. |
|  | `ink` | Ink | glass | A dense dark veil over the blur: nearly solid black glass, flat and quiet. |
|  | `mist` | Mist | glass | The scene blurred under a white veil, graphite ink and flat graphite fills. |
|  | `chalk` | Chalk | glass | A dense white veil over the blur: nearly solid white glass, graphite ink. |
|  | `pressed` | Pressed | glass | Flat glass with neumorphic controls: wells pressed in and values raised by soft neutral shadows. |
|  | `hairline` | Hairline | glass | Flat glass held by one 1px line around the pane and each track. No highlights, no colour. |
|  | `frosted` | Frosted | glass | A clearer pane with frosted controls: each track and value frosts the scene further. |
|  | `haze-rim` | Haze Rim | glass | Haze with a crisp hairline round the pane and a lit top edge; values held by a hairline. |
|  | `haze-lift` | Haze Lift | glass | Haze floating high: the pane rides a deep soft shadow and the values float over their tracks. |
|  | `haze-carve` | Haze Carve | glass | Haze carved: tracks set into the frost and edged by a fine groove, values floating softly. |
|  | `haze-glow` | Haze Glow | glass | Haze lit from within: a soft light inside the pane edge and inside each value, held by a hairline. |
|  | `haze-bevel` | Haze Bevel | glass | Haze with a quiet bevel: light along each top edge, shade along each bottom edge, on the pane and every value. |
|  | `haze-night` | Haze Night | glass | The same deep blur under a dark veil: moodier, with a hairline, a lit top edge and floating values. |
|  | `haze-day` | Haze Day | glass | The same deep blur under a bright white veil: graphite ink, a hairline pane and values on a breath of shadow. |
|  | `lift` | Lift | glass | Flat glass with depth: values float a few pixels on a soft shadow, and the pane lifts off the scene. |
|  | `edge` | Edge | glass | Flat glass with one hairline round each value and a lit top edge on the pane. |
|  | `inset` | Inset | glass | Flat glass with tracks set a hair into the pane: a faint shade above, a faint light below. |
|  | `halo` | Halo | glass | Flat glass with volume: a soft light inside the pane edge and inside each value. |
|  | `tile` | Tile | glass | Flat glass with values as thin tiles: a light line along the top, a dark one along the bottom. |
|  | `groove` | Groove | glass | Flat glass with tracks drawn as fine grooves and values floating softly over them. |
|  | `drift` | Drift | glass | The flattest controls on the pane that floats highest: all the depth is in the pane. |
|  | `shade` | Shade | glass | A dense dark veil with a lit top edge; values carry the same thin light along their top. |
|  | `linen` | Linen | glass | Light flat glass: a white veil, a hairline pane and values lifted by a breath of shadow. Graphite ink. |
|  | `cloud` | Cloud | glass | Light flat glass over the deepest blur, values resting on soft shadows. Graphite ink. |
|  | `groove-light` | Groove Light | glass | Groove in white frost: fine grooved tracks, white values floating on a breath of shadow. Graphite ink. |
|  | `inset-light` | Inset Light | glass | Inset in white frost: tracks set a hair into the pane, white values. Graphite ink. |
|  | `carve` | Carve | glass | Groove and Inset together: tracks set into the pane and edged by a fine groove, values floating softly over them. |
|  | `carve-light` | Carve Light | glass | Carve in white frost: set-in, groove-edged tracks and white values floating softly. Graphite ink. |
|  | `groove-smoke` | Groove Smoke | glass | Groove on a dense dark veil for bright or busy scenes: deeper grooves, floating values. |
|  | `inset-smoke` | Inset Smoke | glass | Inset on a dense dark veil for bright or busy scenes: tracks sunk deeper into the pane. |
| materials | `marble` | Marble Frost | glass | Carrara marble values with soft grey veins, pressed into bright frost. |
|  | `slate` | Slate Glass | glass | Matte slate tiles in smoked glass; a faint stone grain shows through the pane. |
|  | `travertine` | Travertine | glass | Warm porous stone values in pressed, sand-toned frost, with a terracotta signal. |
|  | `basalt` | Basalt | glass | Black volcanic stone values with one polished edge, on smoked glass. An ember signal. |
|  | `steel` | Brushed Steel | glass | Skeuomorphic brushed-aluminium values with a machined bevel, in machined tracks on cool frost. |
|  | `bisque` | Bisque | glass | Neumorphic unglazed porcelain: soft domed values raised out of milky frost. A sage signal. |
|  | `concrete` | Concrete | glass | Raw speckled concrete values cut into grey frost. A safety-orange signal. |
|  | `walnut` | Walnut Glass | glass | Oiled walnut values with a fine grain, set in smoked amber glass. A brass signal. |
| blends | `quartz` | Quartz | glass | Frost, hairlines and neumorphism: pressed tracks, raised frosted values held by a hairline rim. |
|  | `loupe` | Loupe | glass | Clear glass and skeuomorphism: values are bevelled lenses that brighten the scene, in a barely blurred pane. |
|  | `shell` | Shell | glass | Deep frost and neumorphism: pressed tracks and softly domed values. |
|  | `engrave` | Engrave | glass | Hairlines and skeuomorphism: tracks engraved into the glass as fine cut lines, values held by a hairline. |
|  | `machined` | Machined | glass | Glass and skeuomorphism: deep machined grooves and chamfered glass caps. |
|  | `matte` | Matte | glass | Frost and depth: matte values float on soft shadows, with no highlights and no rims. |
|  | `glaze` | Glaze | glass | Double-glazed glass: every edge drawn as a white line over a dark one, like thick glass. |
|  | `pebble` | Pebble | glass | Glass and neumorphism: raised pebble values in pressed tracks. |
|  | `vellum` | Vellum | glass | Light frost, hairlines and neumorphism: pressed tracks and raised white values, graphite ink. |
|  | `lumen` | Lumen | glass | Light glass and skeuomorphism: bevelled white glass values in finely cut tracks, graphite ink. |
| untinted-glass | `clear-air` | Air Glass | glass | Almost invisible glass drawn in hairlines: outlined tracks and values, a whisper of blur. |
|  | `clear-polished` | Polished Glass | glass | Clear glass with depth: values float on a soft shadow under one reflected line. |
|  | `clear-lens` | Lens Glass | glass | Optical clarity: lens values held by a hairline glass edge, the pane lifted off the scene. |
|  | `clear-layered` | Layered Glass | glass | Flat glass with neumorphic depth: tracks pressed in, luminous white values raised. |
|  | `clear-bevel` | Bevel Glass | glass | Clear glass with bevelled values: a lit top edge, a shaded lower edge, tracks cut into the glass. |
|  | `clear-cut` | Cut Glass | glass | Values faceted like crystal: one diagonal light across each, held by hairline rims. |
| untinted-frost | `frost-etched` | Etched Frost | glass | Light frost with softly pressed tracks and flat frosted values. |
|  | `frost-silk` | Silk Frost | glass | Neumorphic frost: pressed tracks, raised white silk values, dark lettering. |
|  | `frost-mist` | Mist Frost | glass | Airy frost in hairlines, lifted off the scene on a soft shadow. |
|  | `frost-deep` | Deep Frost | glass | The deepest frost, elevated: pressed tracks and raised dense values with charcoal numerals. |
|  | `frost-satin` | Satin Frost | glass | Brushed-satin values with a lit edge in machined tracks, on deep frost. Dark lettering. |
|  | `frost-ceramic` | Ceramic Frost | glass | Glazed white values with a soft gloss band, set into pressed frost. |
| atelier-glass | `nocturne` | Nocturne | glass | Architectural smoke glass. Black crystal controls and a fine champagne edge. |
|  | `lagoon` | Lagoon | glass | Deep petrol crystal. Aquamarine lenses, luminous sea-glass edges and cool ivory ink. |
|  | `argent` | Argent | glass | Daylight silver glass. Polished silver inserts and precise ink-blue accents. |
|  | `garnet` | Garnet | glass | Wine-dark cut glass. Faceted rose crystal controls, copper reflections and pale rose signals. |
| atelier-frost | `ivory` | Ivory | glass | Warm vellum frost. Soft ivory lenses, espresso lettering and restrained antique-brass details. |
|  | `glacier` | Glacier | glass | Dense polar frost. Sculpted ice-white inserts, cool blue bevels and deep alpine-blue signals. |
|  | `wisteria` | Wisteria | glass | Lilac silk frost. Opaline controls, plum lettering and muted violet accents. |
|  | `dune` | Dune | glass | Smoked taupe frost. Matte sand-glass inserts, quiet bronze edges and warm linen lettering. |
| studio | `studio` | Studio | solid | Studio-grade neutral dark. Satin controls, hairline edges, teal signal. The default. |
|  | `studio-light` | Studio Light | solid | The same instrument on a light neutral desk. White satin controls. |
| signature | `optical` | Optical | solid | The original ARTINOS prototype: polished translucent insert on graphite. |
|  | `reference` | Reference | glass | The ARTINOS Figma source: polished bar, double-line handle, mono 700. |
| glass | `glass` | Glass | glass | Clean clear glass. A neutral veil, clear-rim controls, white ink. |
|  | `glass-light` | Glass Light | glass | Clear glass with a light veil. The view stays bright, the ink is dark. |
|  | `glass-dark` | Glass Dark | glass | Clean smoked glass. A deeper veil, the same clarity, cool blue signal. |
|  | `crystal` | Crystal | glass | The clearest pane: a whisper of tint, bright double hairline, all-rim controls. |
| frost | `frost` | Frost | glass | Frosted glass. A soft diffuse pane, frosted-white controls, dark ink. |
|  | `frost-light` | Frost Light | glass | Bright milky frost with dark ink. Daylight over imagery. |
|  | `frost-dark` | Frost Dark | glass | Dark frosted glass: heavy diffusion under a charcoal veil, frosted-grey controls. |
|  | `ice` | Ice | glass | Clean cool frost: a faint blue-white pane, icy controls, deep navy ink. |
| clear | `pane` | Pane | glass | Clear glass with a soft light sweep and silver-pearl pills. No tint: the colour is whatever is behind. |
|  | `pane-light` | Pane Light | glass | The same clear glass under a light veil. White pills, dark ink. |
|  | `lucid` | Lucid | glass | The clearest pane. Clear glass fills with a bright lit edge, white ink. |
|  | `gallery` | Gallery | glass | Gallery glass: lightly blurred under a neutral shade, hairline rules, crisp frosted fills. |
| clear-frost | `satin` | Satin | glass | Continuous frost. The view melts into soft colour; glossy white pills. |
|  | `monolith` | Monolith | glass | Deep neutral frost that carries the warmth of what is behind; milky frosted fills. |
|  | `opal` | Opal | glass | A smoky column: frost under a deep neutral shade, bright rims, soft glass fills. |
|  | `graphite` | Graphite | glass | Grey frost with the colour drained, translucent grey-glass fills. |
| luxe | `onyx` | Onyx | glass | Black smoked glass with fine gold hairlines, gold seams and ivory ink. A watch dial at night. |
|  | `sapphire` | Sapphire | glass | Deep-blue crystal, platinum hairlines, icy clear controls, silver-blue signal. |
|  | `platinum` | Platinum | glass | Colourless clear glass with a bright platinum double hairline, crystal-clear controls and white ink. |
|  | `diamond` | Diamond | glass | The clearest pane, with a faint prismatic fire in the sheen and the controls. Ice-white signal. |
|  | `emerald` | Emerald | glass | Deep green crystal with pale-gold hairlines and seams, and a fresh emerald signal. |
|  | `rose-gold` | Rose Gold | glass | Clear glass under a blush veil, with rose-gold hairlines, rims and seams. |
|  | `cognac` | Cognac | glass | Warm amber smoked glass with brushed-brass hairlines and candle-lit ink. |
|  | `amethyst` | Amethyst | glass | Deep violet crystal with silver hairlines, clear violet controls and a lavender signal. |
| luxe-frost | `champagne` | Champagne | glass | Warm gold-tinted frost, ivory controls with an antique-gold rim, espresso ink. |
|  | `pearl` | Pearl | glass | Nacreous white frost with a faint iridescent sheen, soft pearl controls, lilac signal. |
|  | `alabaster` | Alabaster | glass | Thick warm-cream frost, cream satin controls with a bronze hairline, umber ink. |
|  | `porcelain` | Porcelain | glass | Cool white glazed frost, glossy white controls, cobalt signal and ink-blue text. |
|  | `jade` | Jade | glass | Pale celadon frost with polished pale-green controls, a jade signal and forest ink. |
|  | `moonstone` | Moonstone | glass | Blue-grey milky frost with a cool glow, milk-white controls and white ink. |
|  | `cashmere` | Cashmere | glass | Soft taupe frost, oat-white controls with a caramel rim, cocoa ink on the controls. |
|  | `velvet` | Velvet | glass | Deep bordeaux frost with silver hairlines, rosy frosted controls and a soft rose signal. |
<!-- themes:end -->

`THEMES`, `THEME_META` (label, family, kind, description and a three-colour swatch) and `GLASS_THEMES` are exported, so a theme picker is a few lines:

```tsx
<Select label="Theme" options={THEMES.map((t) => ({ value: t, label: THEME_META[t].label }))} value={theme} onChange={setTheme} appearance="well" />
```

## Solid vs glass

`THEME_META[id].kind` is `'solid'` or `'glass'`.
- **Solid** themes paint their own ground. Use `<ArtinosTheme theme="studio" ground>` on the page or panel container.
- **Glass** themes are panes: `Panel` uses `backdrop-filter` over whatever is behind it. They look right over imagery, video or a live canvas. Over a flat colour they look like a plain tinted card, which is expected. Don't add `ground` to a glass scope that should show the scene through it.
- **Scene.** Glass ink is drawn for a scene that contrasts with it. `scene="light" | "dark"` on `ArtinosTheme` (`data-ar-scene`) sets `--ar-panel-floor`, a wash of the theme's `--ar-bg-app` at `--ar-floor-amount` (72%), under Panel, Dock panes and the floating Toolbar. Over a scene that already contrasts it barely shows; over a mismatched one it keeps the ink at about 4.5:1. Lower `--ar-floor-amount` for more glass, raise it for more ground.

For React Three Fiber, the controls are DOM. Put them in an HTML overlay above the `<Canvas>` (a sibling `div` with `position: absolute`), not inside the Canvas tree, so the glass blurs the rendered scene. drei `<Html>` works for UI attached to 3D objects, but inspector panels belong in the overlay.

## Density

`dense` (24px) · `standard` (26px, default) · `comfort` (30px). Per control: `density="dense"`. Per scope: `<ArtinosTheme density="comfort">` or `data-ar-density="comfort"`. Type size, padding and radii follow.

## Accents

Any theme can take any accent: `<ArtinosTheme theme="veil" accent="violet">` or `data-ar-accent="violet"` on the theme's element. Only the signal changes (live edges, LEDs, focus, selection, the ruler index). The accents are `teal` · `azure` · `violet` · `rose` · `coral` · `amber` · `lime` · `mono`; each has a bright value for dark themes and a deeper one for light themes, chosen by the theme's `color-scheme` through `light-dark()`. `ACCENTS` and `ACCENT_META` list them for a picker. Themes that draw their live edge in their own metal (the luxe themes, for example) keep it; the accent still sets focus and selection.

## Type collections

By default type is two voices of one family: a sans sets words and its mono sibling sets figures and small marks, so numbers line up and read as measurements; headings are sentence case, with no tracked capitals. A **type collection** swaps the faces and re-tunes only what the faces change (the figures face, caps, tracking, the thinnest weight a face has); sizes, weights and leading stay, so every component keeps its proportions. Some collections add a display face for titles at 22px and up (`--ar-font-display`).

| collection | sans · mono (· display) | character |
|---|---|---|
| `instrument` (default) | Geist · Geist Mono | a sans for words, its mono sibling for every figure; sentence-case headings |
| `geist` | Geist · Geist Mono | the default faces with small headings and marks in tracked capitals: the exact, technical look |
| `grotesk` | Chivo · Chivo Mono | a grotesk with an engineering edge: crisp caps, a mono with character |
| `editorial` | IBM Plex Sans · IBM Plex Mono | drawn, editorial; open counters, a mono with character |
| `modern` | Inter · JetBrains Mono | the proven pairing of modern tools; tall x-height, a wide legible mono |
| `atelier` | DM Sans · DM Mono | warm geometric, soft terminals, a lighter touch |
| `red-hat` | Red Hat Text · Red Hat Mono · Red Hat Display | a three-voice superfamily, friendly and crisp, with its own display face |
| `luxe` | Inter · JetBrains Mono · Cormorant Garamond | a serif display over a neutral sans: editorial luxury, made for the luxe themes |

Set one on the theme scope or on any element; it inherits, carries through nested themes and follows portalled overlays (lists, menus, the palette, tooltips, the slider HUD). A bare `data-ar-type` element inside a theme re-points the components inside it too (their control text takes the collection's mono, or the sans in the themes that set their controls proportionally):

```tsx
<ArtinosTheme theme="onyx" type="luxe"> … </ArtinosTheme>
<div data-ar-type="editorial"> … </div>
```

A kit ships the collections it was exported with (`--type luxe,editorial`; `instrument` always comes along) and `tokens/fonts.css` loads exactly their faces from Google Fonts. The registry is `TYPE_COLLECTIONS` / `TYPE_META[id]` (`label`, `ui`, `mono`, `display`, `description`). To self-host, delete the import from `artinos.css` and declare the same families at 200 · 300 · 400 · 500 with `@font-face`. Theme Studio's Typography group can also set the faces token by token.

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

The design language in one paragraph: every part is built from five materials. **Panel glass** holds things (Panel, Dock panes, a floating Toolbar). The **frosted sheet** floats (lists, menus, the palette, dialogs, toasts, tooltips, graph nodes). The **well** is where a value is edited (fields, troughs, key caps, canvases). The **insert** is the polished part you press or drag (buttons, knob caps, slider fills). The **seam or LED** marks what is live. Text comes in two voices: the sans speaks — labels, buttons, chips, segments, menu actions and prose, in sentence case — and the mono measures: every number, readout, hex code and key cap. Capitals are kept for small headings (section titles, kickers). Body text is regular to 13px and light for titles. Motion uses the duration and curve tokens only. Everything that scrolls inside a theme scope (lists, the palette, dock panels, your own panels) gets the family's one scrollbar: a thin rounded thumb in the theme's ink, no buttons, no track; a page outside the scope can copy the `::-webkit-scrollbar` rules from `core/core.css` onto `html`.

Roles (theme level):
- ground and surfaces: `--ar-bg-app`, `--ar-bg-surface`, `--ar-bg-raised`, `--ar-bg-well`, `--ar-bg-hover`, `--ar-bg-active`
- ink: `--ar-text-hi`, `--ar-text-mid`, `--ar-text-low`, `--ar-text-faint`, `--ar-text-ghost` — a theme sets `--ar-text-hi`; the quieter steps are derived from it at fixed strengths (90 · 74 · 60 · 40%), so titles, values, labels and notes keep the same distance in every theme and in its own hue. Override a step with an inline token (`tokens={{ 'text-low': … }}`) when you need to.
- lines: `--ar-line-subtle`, `--ar-line`, `--ar-line-strong`, `--ar-tick`, `--ar-tick-major`
- accents: `--ar-signal`, `--ar-signal-hi`, `--ar-signal-line`, `--ar-signal-wash`, `--ar-signal-ink`, `--ar-bind`, `--ar-warn`, `--ar-fault`, `--ar-focus-ring`
- panel glass: `--ar-edge-light` (the lit top edge of a Panel or dock pane, brightest in the middle; `transparent` turns it off), `--ar-panel-tint`, `--ar-panel-floor` (set by `scene`), `--ar-floor-amount`, `--ar-panel-blur` (a `backdrop-filter` value), `--ar-panel-sheen`, `--ar-panel-shadow`, `--ar-panel-text-shadow`
- floating ink and the typed-entry field: `--ar-float-bg`, `--ar-float-ring`, `--ar-float-shadow`, `--ar-float-ink`, `--ar-float-ink-low`
- radii: `--ar-radius-control`, `--ar-radius-card`, `--ar-radius-panel`, `--ar-radius-shell`
- typography (see [Typography](#typography) below): `--ar-font-ui`, `--ar-font-num`, `--ar-weight-*`, `--ar-text-*`, `--ar-caps-*`, `--ar-track-*`, `--ar-leading-*`
- size (density-driven): `--ar-h`, `--ar-label-size`, `--ar-value-size`, `--ar-pad-x`, `--ar-gap`
- motion:
  - durations: `--ar-dur-value` (70ms, a value following the hand), `--ar-dur-state` (130ms, hover and press), `--ar-dur-surface` (220ms, a material changing), `--ar-dur-layout` (380ms, things moving apart), `--ar-dur-enter` (200ms, an overlay arriving), `--ar-dur-exit` (130ms, leaving, always quicker);
  - curves: `--ar-ease` (general), `--ar-ease-roll` (settling: rolls, glides, sheets), `--ar-ease-spring` (a small overshoot: pops, knobs, pucks), `--ar-ease-exit` (departures);
  - `prefers-reduced-motion: reduce` sets every duration to 0. Set them to 0 yourself on a scope to turn motion off there.

Control finish (materials level):
- well: `--ar-trough`, `--ar-trough-backdrop`, `--ar-well`, `--ar-inset`, `--ar-radius` (7px)
- insert: `--ar-insert`, `--ar-insert-sheen` (light laid over every theme's insert — a soft top light and a gentle shade below; `none` turns it off), `--ar-insert-shadow`, `--ar-insert-backdrop`, `--ar-insert-radius` (6px), `--ar-insert-ink`, `--ar-insert-unit-ink`, `--ar-insert-text-shadow`, `--ar-insert-off-filter`
- ink off the insert: `--ar-label-ink`, `--ar-value-ink`, `--ar-unit-ink`, `--ar-off-ink`, `--ar-base-text-shadow`
- seam (handle): `--ar-seam`, `--ar-seam-hover`, `--ar-seam-active`, `--ar-seam-w`, `--ar-seam-offset` (8px from the fill end), `--ar-seam-scale`, `--ar-seam-glow`
- LEDs, cells, gradients, ruler: `--ar-led-on`, `--ar-led-off`, `--ar-led-glow`, `--ar-cell`, `--ar-cell-shadow`, `--ar-grad-well`, `--ar-ruler-ink`, `--ar-index`
- typography of controls: the voice of control text — `--ar-voice-font` (the sans), `--ar-voice-case` (`none`; option labels made from an all-lowercase id read in sentence case — `"fixed"` → "Fixed" — while names such as "glTF" or "sRGB" stay as written), `--ar-voice-tracking`, `--ar-voice-size` (label size + 1px), `--ar-voice-weight` (regular); the numbers — `--ar-control-font` (the mono), `--ar-value-weight`; capitals for small headings — `--ar-label-weight`, `--ar-label-tracking`, `--ar-label-case`. To bring back mono caps controls, set the voice tokens to `var(--ar-control-font)`, `uppercase` and `var(--ar-label-tracking)`.
- frosted sheet, shared by everything that floats (the Select list, menus, the command palette, dialogs, toasts, tooltips, the slider HUD, the dock menu) and by graph nodes: `--ar-sheet-bg` (grain, a milky veil and the theme's ground at half strength), `--ar-sheet-blur`, `--ar-sheet-shadow`, `--ar-float-depth` (a close contact shadow under every floating sheet, so it floats rather than lies flat), `--ar-row-radius` (6px: rows in menus, lists and the palette sit inset under a rounded gliding highlight)
- Select list (defaults to the sheet): `--ar-list-bg`, `--ar-list-backdrop`, `--ar-list-shadow`, `--ar-list-insert`, `--ar-list-hover`, `--ar-list-ink`

### Typography

Two voices of one family. **Geist** sets titles, prose, menus, labels and buttons; **Geist Mono**, drawn on the same skeleton, sets readouts, counts, badges and code, so figures line up and read as measurements. Small headings are sentence case at medium weight; `geist` sets them, and the small marks, in tracked capitals. Everything uses the tokens below; no component sets a literal size, weight or tracking.

- families: `--ar-font-ui` (the sans), `--ar-font-num` (figures and small marks: a mono, Geist Mono by default), `--ar-font-code` (code), `--ar-font-display` (titles at 22px and up; the sans unless a collection gives it a display or serif face), `--ar-font-serif` (Instrument Serif: the `quote` role and `face="serif"` titles). A [type collection](#type-collections) sets all three. A theme's controls read `--ar-control-font` (the figures face; Roboto Mono in `reference`).
- weights, exactly the four the fonts are loaded at (`font-synthesis: none`, so nothing is faked): `--ar-weight-thin` (200, display figures), `--ar-weight-light` (300, titles from 14px up), `--ar-weight-regular` (400, emphasis), `--ar-weight-medium` (500, caps); `--ar-weight-text` (regular) is small sans text up to `--ar-text-md`, inputs, rows and menus, where light strokes thin out on glass. Control readouts use `--ar-value-weight` (400 by default).
- space: `--ar-space-1` … `--ar-space-9` (2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 px) and the roles density tunes — `--ar-row-gap` (rows in a group), `--ar-group-gap` (groups in a panel), `--ar-panel-pad-x` / `--ar-panel-pad-y` (a panel's padding) — plus `--ar-measure` (62ch, a paragraph's longest line). The catalogue's *Layout and text* chapter has the rules.
- the sans scale, `--ar-weight-text` to md and light above: `--ar-text-xs` (11px, hints and captions), `--ar-text-sm` (12px, secondary lines, tabs, menu rows), `--ar-text-md` (13px, body), `--ar-text-lead` (15px, lead paragraphs, weight 300), `--ar-text-lg` (14px, sheet titles), `--ar-text-xl` (17px, panel titles), `--ar-text-2xl` (22px, page section titles), `--ar-text-3xl` (34px, display, weight 200). Mono readouts that aren't caps use the same steps.
- small marks outside a control (foot lines, counts, badges, keycaps, port tags), weight 500: `--ar-caps-sm` (11px) and `--ar-caps-xs` (10.5px, the smallest mark). The caps switch sets them in tracked capitals: `--ar-caps-case` (`none`, or `uppercase`) and `--ar-caps-on` (0, or 1 to apply `--ar-track-caps` and the control-label tracking); a collection that turns it on steps the sizes down to 10 · 9.5px. Small headings (a section's title, a kicker) have their own: `--ar-head-case`, `--ar-head-tracking`, `--ar-head-bump`. Control labels are `--ar-label-size`, set by density: 10.5 · 11 · 11.5px for dense · standard · comfort. The `.ar-caps` class (and `.ar-caps--xs`) applies the whole recipe.
- control text is tuned by density and theme: `--ar-label-size` (labels draw at `--ar-voice-size`, one pixel up), `--ar-value-size`, and the control-typography tokens under Control finish.
- tracking: `--ar-track-caps` (0.1em, for capitals; applied only when the caps switch is on), `--ar-track-text` (0, set as drawn), `--ar-track-title` (-0.01em, 17px and up), `--ar-track-display` (-0.025em, 30px and up).
- leading: `--ar-leading-none` (1, single-line marks), `--ar-leading-snug` (1.3, titles and menu rows), `--ar-leading-text` (1.5, prose), `--ar-leading-code` (1.65, code and long reading).

```css
.my-mark  { font: var(--ar-weight-medium) var(--ar-caps-sm) / 1 var(--ar-font-num); letter-spacing: calc(var(--ar-track-caps) * var(--ar-caps-on)); text-transform: var(--ar-caps-case); }
.my-title  { font: var(--ar-weight-light) var(--ar-text-xl) / var(--ar-leading-snug) var(--ar-font-ui); letter-spacing: var(--ar-track-title); }
```
