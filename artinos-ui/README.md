# ARTINOS UI

A precision-instrument control system for React: one compact surface per parameter. The capsule is the control, the seam is the handle, the readout is the precision zone. Pick one of fifty-two themes (studio, signature, clean glass, frosted glass, luxe, atelier or untinted) and every control follows. Build your own in the Theme Studio.

**copy → paste → import → use.** This folder is the whole package. No provider, build plugin, Tailwind or registry.

## Install

1. Copy the `artinos-ui/` folder into your project (e.g. `src/artinos-ui`).
2. Make sure `react` and `react-dom` are installed (React 18.3+; built and tested on React 19).
3. Import the stylesheet once at the app root, then import components.

```tsx
import './artinos-ui/artinos.css';
import { ArtinosTheme, Slider, Switch } from './artinos-ui';

export function Inspector() {
  const [rough, setRough] = useState(0.52);
  return (
    <ArtinosTheme theme="studio">
      <Slider label="Roughness" value={rough} onChange={setRough} toggleable />
      <Switch label="Shadows" defaultValue />
    </ArtinosTheme>
  );
}
```

Requirements and notes:
- TypeScript source (`.tsx`); it compiles under `strict`, `verbatimModuleSyntax` and `noUnused*`. Any bundler that handles TSX and CSS `@import` works (Vite, Next, webpack).
- Every component file starts with `'use client'`: they are interactive and need the DOM. The precision HUD and the Select list portal to `<body>` via `react-dom`.
- `tokens/fonts.css` loads Chivo and Chivo Mono (plus Roboto Mono for the `reference` finish) from Google Fonts. To self-host, delete that `@import` from `artinos.css`. Every font stack falls back to system fonts.
- Browsers: evergreen Chrome, Edge, Safari and Firefox. The CSS uses `@property`, `color-mix()`, `:has()` and `backdrop-filter`.

## Folder

```
artinos-ui/
  artinos.css      single stylesheet entry (import once)
  index.ts         every component, constant and type
  tokens/          tokens.css · themes.css · materials.css · fonts.css
  core/            RollingValue · ArtinosTheme · utils · hooks · options · core.css
  slider/          Slider · RangeSlider · engine · parts (HUD) · slider.css
  controls/        NumberField · Switch · ToggleGroup · Segmented · ColorField · Select · controls.css
  layout/          Panel · Section · Field · Tabs · layout.css
```

To take only some components or themes, use the **Export kit** in the showcase (`showcase/artinos-ui-showcase.html#export`). Pick themes (including ones you saved in the Theme Studio) and components, and it writes a trimmed copy of this folder: only the files those components import, only the chosen themes in the token CSS, and a matching `index.ts`, `artinos.css` and `README.md`. Download it as a .zip or write it straight into a project folder. By hand: copy `tokens/`, `core/` and the component's folder, then import the matching CSS files.

## Themes

**Pick one theme; everything follows.** A theme is the whole look: ground, ink, signal, panel glass, and the finish of every control (insert, well, seam, LEDs). There's no second setting to choose.

| family | theme | look |
|---|---|---|
| untinted glass | `clear-air` | Air Glass: almost invisible panes, clear inserts, fine reflected edges. |
| | `clear-polished` | Polished Glass: crisp surface reflections and glossy transparent inserts. |
| | `clear-lens` | Lens Glass: optical depth with softly focused panes and clear lenses. |
| | `clear-layered` | Layered Glass: luminous laminated inserts on a clear pane. |
| untinted frost | `frost-etched` | Etched Frost: fine diffusion and translucent matte controls. |
| | `frost-silk` | Silk Frost: continuous diffusion, translucent white inserts, dark lettering. |
| | `frost-mist` | Mist Frost: airy diffuse glass, softly lit edges and floating translucent inserts. |
| | `frost-deep` | Deep Frost: strong optical diffusion and dense satin inserts. |
| atelier glass | `nocturne` | Architectural smoke glass, square black crystal inserts, champagne edges. |
| atelier glass | `lagoon` | Petrol crystal, rounded aquamarine lenses, luminous sea-glass rims. |
| atelier glass | `argent` | Daylight silver glass, precise square bevels, ink-blue accents. |
| atelier glass | `garnet` | Wine-dark glass, faceted rose crystal, fine copper reflections. |
| atelier frost | `ivory` | Warm vellum frost, soft ivory inserts, espresso ink and antique brass. |
| atelier frost | `glacier` | Dense polar frost, sculpted ice-white inserts, alpine-blue accents. |
| atelier frost | `wisteria` | Lilac silk frost, rounded opaline inserts, plum ink and violet accents. |
| atelier frost | `dune` | Smoked taupe frost, matte sand-glass inserts, bronze seams and linen ink. |
| studio | `studio` (default) | Studio-grade neutral dark. Satin controls, hairline edges, teal signal. |
| | `studio-light` | The same instrument on a light neutral desk. White satin controls. |
| signature | `optical` | The original ARTINOS prototype: polished translucent insert on graphite. |
| | `reference` | The ARTINOS Figma source: polished bar, double-line handle, mono 700, mint signal. |
| glass | `glass` | Clean clear glass. A neutral veil, clear-rim controls, white ink. |
| | `glass-light` | Clear glass with a light veil. The view stays bright, the ink is dark. |
| | `glass-dark` | Clean smoked glass. A deeper veil, cool blue signal. |
| | `crystal` | The clearest pane: a whisper of tint, bright double hairline, all-rim controls. |
| frost | `frost` | Frosted glass. A soft diffuse pane, frosted-white controls, dark ink. |
| | `frost-light` | Bright milky frost with dark ink. Daylight over imagery. |
| | `frost-dark` | Dark frosted glass: heavy diffusion under a charcoal veil, frosted-grey controls. |
| | `ice` | Clean cool frost: a faint blue-white pane, icy controls, deep navy ink. |
| optical glass | `pane` | Clear glass with a soft light sweep and silver-pearl pills. No tint: the colour is whatever is behind. |
| | `pane-light` | The same clear glass under a light veil. White pills, dark ink. |
| | `lucid` | The clearest pane. Clear glass fills with a bright lit edge. |
| | `gallery` | Gallery glass: lightly blurred under a neutral shade, crisp frosted fills. |
| optical frost | `satin` | Continuous frost; glossy white pills. |
| | `monolith` | Deep neutral frost that carries the warmth of what is behind; milky frosted fills. |
| | `opal` | A smoky column: deep neutral shade, bright rims, soft glass fills. |
| | `graphite` | Grey frost with the colour drained, grey-glass fills. |
| luxe glass | `onyx` | Black smoked glass with fine gold hairlines, gold seams and ivory ink. A watch dial at night. |
| | `sapphire` | Deep-blue crystal, platinum hairlines, icy clear controls, silver-blue signal. |
| | `platinum` | Colourless clear glass, bright platinum double hairline, crystal-clear controls, white ink. |
| | `diamond` | The clearest pane, with a faint prismatic fire in the sheen and the controls. |
| | `emerald` | Deep green crystal, pale-gold hairlines and seams, emerald signal. |
| | `rose-gold` | Clear glass under a blush veil, rose-gold hairlines, rims and seams. |
| | `cognac` | Warm amber smoked glass, brushed-brass hairlines, candle-lit ink. |
| | `amethyst` | Deep violet crystal, silver hairlines, lavender signal. |
| luxe frost | `champagne` | Warm gold-tinted frost, ivory controls with an antique-gold rim, espresso ink. |
| | `pearl` | Nacreous white frost with a faint iridescent sheen, soft pearl controls, lilac signal. |
| | `alabaster` | Thick warm-cream frost, cream satin controls with a bronze hairline, umber ink. |
| | `porcelain` | Cool white glazed frost, glossy white controls, cobalt signal. |
| | `jade` | Pale celadon frost, polished pale-green controls, jade signal, forest ink. |
| | `moonstone` | Blue-grey milky frost with a cool glow, milk-white controls, white ink. |
| | `cashmere` | Soft taupe frost, oat-white controls with a caramel rim. |
| | `velvet` | Deep bordeaux frost, silver hairlines, rosy frosted controls, rose signal. |

Studio and optical paint their own ground. The glass, frost, luxe and reference themes are panes, made to sit over a photo, video or live 3D canvas. The optical themes add no tint: clear transmission, frost and blur only, so the colour is whatever is behind the pane. The luxe families add metallic hairlines and wider label tracking.

```tsx
<ArtinosTheme theme="frost">…</ArtinosTheme>
<div data-ar-theme="glass-dark">…</div>   {/* works without React too */}
```

The design rule behind the studio, glass, frost and luxe families is restraint: 1px highlights, hairline edges, shallow wells, no grain or heavy shadows. On glass, legibility comes from the pane's tint, not from effects on the text.

`THEMES`, `THEME_META` (label, family, kind, description and a three-colour swatch for each theme) and `GLASS_THEMES` are exported, so a theme picker is a few lines.

### Untinted collection

Eight additional themes appear first in the pickers and gallery. Their panel tint is fully transparent, their reflections and controls use only neutral white, black and grey, and their backdrop filters use blur alone. Colours seen through the glass come from the content behind it. Air, Polished, Lens and Layered use 3–14px panel blur; Etched, Silk, Mist and Deep use 24–72px.

All eight inherit the default control forms: 7px well radius, 6px insert radius, 2px inset, the original seam geometry, Chivo Mono typography and standard density settings. The panel and card radii also inherit the defaults. Focus rings, menus, status indicators, wells and inserts are coordinated in monochrome. Menus use a stronger neutral backing for legibility. Clear glass is best placed over imagery with sufficient text contrast; Silk and Deep offer stronger diffusion for busy scenes.

Use `<ArtinosTheme theme="clear-polished">` or select a theme in Theme Studio. All eight support token editing, saving and CSS / JSON / TSX export.

### Atelier collection

Eight coordinated glass and frost themes are available in the showcase and theme pickers. Each sets the full surface and text palette, status colours, focus rings, floating menus, panel diffusion, edge highlights, control finish, seam, and corner radii. Glass diffusion ranges from 12–22px; frost uses 44–58px. Their translucent panels work over either showcase photograph or the theme's own ground with the backdrop set to None.

Use `<ArtinosTheme theme="nocturne">` (or any name above). Theme Studio exposes the same tokens for editing and CSS, JSON or TSX export. Density remains independent, and an explicit `material` prop overrides the control finish.

### Your own themes: the Theme Studio

The showcase includes a full theme editor (`showcase/artinos-ui-showcase.html#studio`). Start from any theme and tune every token: ground, ink, lines, signal, panel glass (tint, blur, sheen, edge), well, insert (body, rim, gloss), seam and LEDs, typography, size and motion, or any raw token. The complete component gallery updates live as you work. Save and edit as many themes as you like, then export one as a standalone CSS theme:

```css
/* my-theme.css, loaded after artinos.css */
[data-ar-theme='my-theme'] { --ar-signal: #ff4fa3; /* …every resolved token… */ }
```
```tsx
<ArtinosTheme theme="my-theme">…</ArtinosTheme>
```

`theme` accepts any name, so an exported theme works exactly like a built-in one. The studio also exports JSON (to re-import later) and TSX (the overrides as `tokens`).

### Density

`dense` (24px) · `standard` (26px, default) · `comfort` (30px). Set it per control with `density="dense"`, or on any scope with `data-ar-density`.

### Custom themes

Start from any theme and override tokens on a scope, inline or in CSS. The live seam, LEDs and focus ring are mixed from `--ar-signal`, so changing the signal recolours all of them.

```tsx
<ArtinosTheme theme="studio" tokens={{ signal: '#FF4FA3', 'bg-app': '#120E14', radius: '9px' }}>…</ArtinosTheme>
```
```css
.my-brand[data-ar-theme='studio'] { --ar-signal: #ff4fa3; --ar-radius: 9px; }
```

`themeStyle(tokens)` returns the same inline style object for use without the wrapper.

### How it's built

Three token layers, each reading only the one above it:

| layer | examples | file |
|---|---|---|
| primitives | `--ar-ink-*`, `--ar-teal-*` | `tokens.css` |
| roles | `--ar-bg-well`, `--ar-text-hi`, `--ar-signal`, `--ar-panel-tint` | `tokens.css` (studio) + `themes.css` |
| control finish | `--ar-insert`, `--ar-seam`, `--ar-trough`, `--ar-insert-ink` | `materials.css` |

### Advanced: finish override

Each theme already has its control finish. To force a different one on a single control or scope, set `material` (or `data-ar-material`) to `optical` (the original prototype insert) · `reference` (the Figma source: polished bar, double-line handle, mono 700) · `soft` · `frost` · `milk` · `clear` · `tint` · `smoked` · `metal`. Put it on the same element as `data-ar-theme` or below it.

## Components

Every control is controlled (`value` + `onChange`) or uncontrolled (`defaultValue`), and accepts `density`, `className` and `style` (plus the advanced `material` override).

| component | what it is |
|---|---|
| `Slider` | The precision surface. Variants: `material` · `stepped` · `gradient` · `ruler` · `curve` · `wave`. Layouts: `integrated` · `paired`. Props include `steps`, `detents`, `mapping` (`linear` · `log` · `exp` · `power` · custom), `format` (`number` · `percent` · `db` · `angle` · `hz` · `time`), `formatter`, `bipolar` / `origin`, `status` (`bound` · `automated` · `warn` · `fault`), `enabled` / `toggleable` (double-click off and on, value preserved; on by default, `toggleable={false}` opts out; passing `toggleable` also shows the enable dot), `precision` (2 or 3 levels), `onCommit`. |
| `RangeSlider` | An interval in the same capsule. The seam grabs an end, a press inside moves the whole interval, `minSpan` keeps the ends apart; each end is its own focusable slider. |
| `NumberField` | A recessed numeric cell. Drag to scrub (Alt 0.1×, Shift 10×), click or type to edit, arrow keys and wheel step. |
| `Switch` | `shutter` (the insert travels, LED lights) or `compact` (inspector knob). |
| `ToggleGroup` | Independent flags in one well: LED chips or icon chips; `multiple={false}` for solo. |
| `Segmented` | One of n; the insert travels. Text or icon options. |
| `ColorField` | The colour as the insert, with ink that follows luminance. Click the swatch for the picker or the hex to type; `alpha` adds a scrubbable opacity readout. |
| `Select` | Insert or `appearance="well"`. The list panel is portalled to body, with keyboard and type-ahead. Options can carry icons. |
| `Panel` · `Section` · `Field` · `Tabs` | Card with header, tabs slot and foot line; a collapsible titled group; a label + controls row; a tab strip with a travelling underline. |
| `RollingValue` | The odometer readout: only changed digits roll, in the direction of change. |
| `ArtinosTheme` | Optional scope wrapper: `theme`, `density`, inline `tokens`, and `ground` to paint the theme background. |

### Slider interaction

| gesture | result |
|---|---|
| press the body | value jumps there, then drags |
| press within 13px of the seam | grabs the value, no jump |
| press the readout | precision scrub. Vertical distance picks 1× (0–26px), 0.1× (26–78px) or 0.01× (78px and beyond); a local HUD is shown |
| Alt / Shift / Ctrl | fine / ultra-fine / snap (detents, or 5% steps) |
| arrows · Home · End · wheel (focused only) | step · min · max |
| Ctrl + arrow | next detent |
| double-click the value · Enter · F2 | type a value in the readout's own units: `0.73`, `47%`, `2.5k` (Hz), `-inf` (dB), `90°`. RangeSlider takes `0.2 – 0.7` or one number for the active end. Enter applies, Escape cancels |
| Esc during drag | cancel back to the start value |
| double-click the body | switch off / on; the stored value is kept. Every slider and range slider, unless `toggleable={false}` |

Ruler variant: the scale moves beneath a fixed index. Dragging right moves the scale with your hand, scrubbing from the readout zooms the engraving, `marks` magnetise lightly, and `snapStep` settles the value on release.

## Performance

There is no permanent animation loop. The ruler zoom is the only `requestAnimationFrame` loop, and it runs only for the 220ms transition. Position is driven by three registered CSS properties (`--ar-lo`, `--ar-hi`, `--ar-p`), so fill, seam and ink clip move together. Ticks and detents are a handful of nodes.
