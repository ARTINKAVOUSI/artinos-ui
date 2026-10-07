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
- **UI over a 3D canvas, video or photo:** any glass or frost theme.

**Families:**
- **Untinted:** achromatic panes with no tint, only blur. Accents are the ARTINOS set: teal signal, azure bind, amber warn, rose fault.
- **Optical:** neutral panes with glossy pearl or translucent fills.
- **Atelier:** coordinated full palettes, each with its own radii and finish.
- **Luxe:** coloured premium panes with metallic hairlines and wider label tracking.
- **Studio and signature:** solid grounds. `optical` and `reference` are the original prototype and the Figma source.

<!-- themes:start -->
| family | id | name | kind | look |
|---|---|---|---|---|
| untinted-glass | `clear-air` | Air Glass | glass | Almost invisible glass. A fine perimeter, clear inserts and a quiet reflected edge. |
|  | `clear-polished` | Polished Glass | glass | Polished clear glass. A narrow reflected highlight, glossy inserts and precise edge contrast. |
|  | `clear-lens` | Lens Glass | glass | Clear optical depth. Softly focused panes, transparent lenses and a fine inner reflection. |
|  | `clear-layered` | Layered Glass | glass | Clear panes with luminous laminated inserts. Restrained double reflections and dark engraved readouts. |
| untinted-frost | `frost-etched` | Etched Frost | glass | Fine etched glass. Light diffusion, translucent matte inserts and delicate satin edges. |
|  | `frost-silk` | Silk Frost | glass | Silky continuous frost. Soft diffusion beneath translucent white inserts with understated dark lettering. |
|  | `frost-mist` | Mist Frost | glass | Airy diffuse glass. A soft reflected veil, floating translucent inserts and a gently lit perimeter. |
|  | `frost-deep` | Deep Frost | glass | Deep optical diffusion. The scene melts behind clear frost; dense satin inserts carry crisp charcoal numerals. |
| atelier-glass | `nocturne` | Nocturne | glass | Architectural smoke glass. Cut corners, black crystal controls and a fine champagne edge. |
|  | `lagoon` | Lagoon | glass | Deep petrol crystal. Rounded aquamarine lenses, luminous sea-glass edges and cool ivory ink. |
|  | `argent` | Argent | glass | Daylight silver glass. Crisp square edges, polished silver inserts and precise ink-blue accents. |
|  | `garnet` | Garnet | glass | Wine-dark cut glass. Faceted rose crystal controls, copper reflections and pale rose signals. |
| atelier-frost | `ivory` | Ivory | glass | Warm vellum frost. Soft ivory lenses, espresso lettering and restrained antique-brass details. |
|  | `glacier` | Glacier | glass | Dense polar frost. Sculpted ice-white inserts, cool blue bevels and deep alpine-blue signals. |
|  | `wisteria` | Wisteria | glass | Lilac silk frost. Softly rounded opaline controls, plum lettering and muted violet accents. |
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

For React Three Fiber, the controls are DOM. Put them in an HTML overlay above the `<Canvas>` (a sibling `div` with `position: absolute`), not inside the Canvas tree, so the glass blurs the rendered scene. drei `<Html>` works for UI attached to 3D objects, but inspector panels belong in the overlay.

## Density

`dense` (24px) · `standard` (26px, default) · `comfort` (30px). Per control: `density="dense"`. Per scope: `<ArtinosTheme density="comfort">` or `data-ar-density="comfort"`. Type size, padding and radii follow.

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

The design language in one paragraph: every part is built from five materials. **Panel glass** holds things (Panel, Dock panes, a floating Toolbar). The **frosted sheet** floats (lists, menus, the palette, dialogs, toasts, tooltips, graph nodes). The **well** is where a value is edited (fields, troughs, key caps, canvases). The **insert** is the polished part you press or drag (buttons, knob caps, slider fills). The **seam or LED** marks what is live. Text comes in two voices: mono caps control text for labels, rows and buttons, and light UI body text on the scale below. Motion uses the duration and curve tokens only.

Roles (theme level):
- ground and surfaces: `--ar-bg-app`, `--ar-bg-surface`, `--ar-bg-raised`, `--ar-bg-well`, `--ar-bg-hover`, `--ar-bg-active`
- ink: `--ar-text-hi`, `--ar-text-mid`, `--ar-text-low`, `--ar-text-faint`, `--ar-text-ghost`
- lines: `--ar-line-subtle`, `--ar-line`, `--ar-line-strong`, `--ar-tick`, `--ar-tick-major`
- accents: `--ar-signal`, `--ar-signal-hi`, `--ar-signal-line`, `--ar-signal-wash`, `--ar-signal-ink`, `--ar-bind`, `--ar-warn`, `--ar-fault`, `--ar-focus-ring`
- panel glass: `--ar-panel-tint`, `--ar-panel-blur` (a `backdrop-filter` value), `--ar-panel-sheen`, `--ar-panel-shadow`, `--ar-panel-text-shadow`
- floating ink and the typed-entry field: `--ar-float-bg`, `--ar-float-ring`, `--ar-float-shadow`, `--ar-float-ink`, `--ar-float-ink-low`
- type and radii: `--ar-font-ui`, `--ar-font-num`, `--ar-radius-control`, `--ar-radius-card`, `--ar-radius-panel`, `--ar-radius-shell`
- body text scale (UI font, weight 300): `--ar-text-xs` (10.5px, hints and captions), `--ar-text-sm` (11.5px, secondary lines and tabs), `--ar-text-md` (12px, body), `--ar-text-lg` (14px, sheet titles), `--ar-text-xl` (17px, panel titles). Labels, rows and buttons use the control-text tokens below instead.
- size (density-driven): `--ar-h`, `--ar-label-size`, `--ar-value-size`, `--ar-pad-x`, `--ar-gap`
- motion:
  - durations: `--ar-dur-value` (70ms, a value following the hand), `--ar-dur-state` (130ms, hover and press), `--ar-dur-surface` (220ms, a material changing), `--ar-dur-layout` (380ms, things moving apart), `--ar-dur-enter` (200ms, an overlay arriving), `--ar-dur-exit` (130ms, leaving, always quicker);
  - curves: `--ar-ease` (general), `--ar-ease-roll` (settling: rolls, glides, sheets), `--ar-ease-spring` (a small overshoot: pops, knobs, pucks), `--ar-ease-exit` (departures);
  - `prefers-reduced-motion: reduce` sets every duration to 0. Set them to 0 yourself on a scope to turn motion off there.

Control finish (materials level):
- well: `--ar-trough`, `--ar-trough-backdrop`, `--ar-well`, `--ar-inset`, `--ar-radius` (7px)
- insert: `--ar-insert`, `--ar-insert-shadow`, `--ar-insert-backdrop`, `--ar-insert-radius` (6px), `--ar-insert-ink`, `--ar-insert-unit-ink`, `--ar-insert-text-shadow`, `--ar-insert-off-filter`
- ink off the insert: `--ar-label-ink`, `--ar-value-ink`, `--ar-unit-ink`, `--ar-off-ink`, `--ar-base-text-shadow`
- seam (handle): `--ar-seam`, `--ar-seam-hover`, `--ar-seam-active`, `--ar-seam-w`, `--ar-seam-offset` (8px from the fill end), `--ar-seam-scale`, `--ar-seam-glow`
- LEDs, cells, gradients, ruler: `--ar-led-on`, `--ar-led-off`, `--ar-led-glow`, `--ar-cell`, `--ar-cell-shadow`, `--ar-grad-well`, `--ar-ruler-ink`, `--ar-index`
- typography of controls: `--ar-control-font`, `--ar-label-weight`, `--ar-value-weight`, `--ar-label-tracking`, `--ar-label-case`
- frosted sheet, shared by everything that floats (the Select list, menus, the command palette, dialogs, toasts, tooltips, the slider HUD, the dock menu) and by graph nodes: `--ar-sheet-bg` (grain, a milky veil and the theme's ground at half strength), `--ar-sheet-blur`, `--ar-sheet-shadow`
- Select list (defaults to the sheet): `--ar-list-bg`, `--ar-list-backdrop`, `--ar-list-shadow`, `--ar-list-insert`, `--ar-list-hover`, `--ar-list-ink`
