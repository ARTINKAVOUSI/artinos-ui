# ARTINOS UI — component API

The original controls (Slider through Select) are **controlled** (`value` + `onChange`) or **uncontrolled** (`defaultValue`). They accept `className`, `style`, `id` and two scope props: `density` (`'dense' | 'standard' | 'comfort'`) and `material` (an advanced finish override).

The newer components (Knob, XYPad, TextField, the overlays, the Dock and the graph) are controlled only, and most accept `className`.

Everything is a named export of the kit's `index.ts`.

This is the prop reference. For *which kind* to use — the six slider faces, the control shapes, the row states, and a lookup from parameter to control — read `catalogue.md` first.

Contents:
- Controls: Slider · RangeSlider · NumberField · Switch · ToggleGroup · ChipGroup · Segmented · ColorField · Select · Knob · XYPad · TextField · FileDrop
- Layout: Panel / Section / Field · Tabs · PropertyRow · ItemList / ItemRow
- Actions: Button · IconButton · Toolbar · Kbd · Badge
- Display: RollingValue · RollingText · Stat · Meter · Progress · Sparkline
- Overlays: Menu · ContextMenu · Dialog · Toast · Tooltip · CommandPalette
- Workspace: Dock · PanelBar · MetaBlock · NodeGraph · LiveGraphView · graph/gpu
- Also: Motion · ArtinosTheme · shared types · recipes · requirements

## Slider

The precision surface. The capsule is the control, the seam is the handle, the readout is the precision zone.

| prop | type | default | notes |
|---|---|---|---|
| `label` | string | | shown inside the capsule (`integrated`) or beside it (`paired`) |
| `value` / `defaultValue` | number | | |
| `onChange` | (v) => void | | live, every change |
| `onCommit` | (v) => void | | once, on release — use for expensive work |
| `min` / `max` | number | 0 / 1 | |
| `step` | number | 1% of range | keyboard / wheel increment |
| `steps` | number | | quantize to n values; `variant="stepped"` draws cells (default 6) |
| `detents` | number[] | | magnetic points (6px, 22px with Ctrl) |
| `mapping` | `'linear' \| 'log' \| 'exp' \| 'power' \| {to, from}` | linear | geometry only; value stays exact. `log` needs min > 0 |
| `origin` / `bipolar` | number / boolean | | fill grows from origin; bipolar = from 0 (or midpoint) |
| `format` | `'number' \| 'percent' \| 'db' \| 'angle' \| 'hz' \| 'time'` | number | percent shows v×100 |
| `decimals` | number | 2 | |
| `unit` | string | | quieter unit after the number |
| `formatter` | (v, decimals) => string \| {text, unit} | | overrides `format` |
| `variant` | `'material' \| 'stepped' \| 'gradient' \| 'ruler' \| 'curve' \| 'wave'` | material | |
| `gradient` | `'temperature' \| 'hue' \| 'saturate' \| 'exposure' \| {stops, describe}` | temperature | gradient variant |
| `describe` | (t, color, value) => string | | gradient caption while dragging |
| `layout` | `'integrated' \| 'paired'` | integrated | |
| `labelWidth` | number \| string | 106 | paired layout |
| `enabled` / `defaultEnabled` / `onEnabledChange` | boolean | true | parameter on/off |
| `toggleable` | boolean | true | double-click the body toggles enabled; `false` opts out. Passing it explicitly also shows the enable dot |
| `indicator` | boolean | | force the enable dot on/off |
| `precision` | 2 \| 3 | 3 | scrub levels: 1× · 0.1× (· 0.01×) |
| `span` / `marks` / `snapStep` | number / number[] / number | | ruler variant: visible span, magnetic marks, settle grid |
| `curve` | `'sigmoid' \| 'smooth' \| 'gamma' \| (x)=>number` | sigmoid | curve variant |
| `samples` | number[] (0..1) | | wave variant amplitudes |
| `status` | `'bound' \| 'automated' \| 'warn' \| 'fault'` | | semantic tint on seam and dot |
| `aria-label` | string | label | |

Interaction is built in; there's nothing to wire:

| gesture | result |
|---|---|
| press the body | value jumps there, then drags |
| press within 13px of the seam | grabs the value, no jump |
| press the readout | precision scrub: vertical distance picks 1× (0–26px), 0.1× (26–78px) or 0.01× (beyond), with a local HUD |
| Alt / Shift / Ctrl | fine / ultra-fine / snap (detents, or 5% steps) |
| arrows · Home · End · wheel (focused only) | step · min · max |
| Ctrl + arrow | next detent |
| double-click the value · Enter · F2 | type a value in the readout's units: `0.73`, `47%`, `2.5k` (Hz), `-inf` (dB), `90°`. Enter applies, Escape cancels |
| Esc during a drag | cancel back to the start value |
| double-click the body | switch off / on; the value is kept (unless `toggleable={false}`) |

Ruler variant: the scale moves beneath a fixed index, scrubbing from the readout zooms the engraving, `marks` magnetise lightly, and `snapStep` settles the value on release.

```tsx
<Slider label="Roughness" value={rough} onChange={setRough} />
<Slider label="Gain" format="db" min={-60} max={12} decimals={1} detents={[0]} onCommit={save} />
<Slider label="Cutoff" format="hz" min={20} max={20000} mapping="log" decimals={0} />
<Slider label="Pan" min={-1} max={1} bipolar />
<Slider variant="stepped" steps={5} label="Samples" min={1} max={5} decimals={0} />
<Slider variant="gradient" gradient="temperature" label="Temperature" />
<Slider variant="ruler" label="Focal" min={12} max={200} span={40} unit="mm" decimals={0} marks={[35, 50, 85]} snapStep={1} />
<Slider variant="curve" curve="smooth" label="Ease" />
```

## RangeSlider

An interval in the same capsule. Seam press grabs an end; press inside moves the whole span; press outside moves the nearest end. Each end is its own focusable slider. Typing accepts `0.2 – 0.7` or one number for the active end.

Props: `label`, `value` / `defaultValue` / `onChange` / `onCommit` with `RangeValue = [number, number]`, `min`, `max`, `step`, `steps`, `detents`, `mapping`, **`minSpan`** (smallest distance between ends, default 0), `format`, `decimals`, `unit`, `formatter`, `layout`, `labelWidth`, `enabled` / `defaultEnabled` / `onEnabledChange`, `toggleable`, `indicator`, `precision`, `aria-label`.

```tsx
const [band, setBand] = useState<RangeValue>([0.2, 0.7]);
<RangeSlider label="Band" value={band} onChange={setBand} minSpan={0.05} />
```

## NumberField

A recessed numeric cell. Drag to scrub (Alt 0.1×, Shift 10×), click/type to edit, arrows and wheel step.

Props: `label`, `value` / `defaultValue` / `onChange` / `onCommit`, `min`, `max`, `step`, `decimals`, `format`, `unit`, `formatter`, `pixelsPerStep` (default 4), `align` (`'center' | 'end'`), `disabled`, `aria-label`.

```tsx
<NumberField label="Width" value={w} onChange={setW} min={0} max={4096} decimals={0} unit="px" />
```

## Switch

`variant="shutter"` (default: the insert travels and the label sits on it) or `"compact"` (a small knob, no visible text — pair it with a `Field` label).

Props: `label` (text + accessible name), `labelOn`, `labelOff`, `value` / `defaultValue` (false) / `onChange(on)`, `variant`, `disabled`, `aria-label`.

```tsx
<Switch label="Shadows" defaultValue />
<Field label="Live update"><Switch variant="compact" label="Live update" value={live} onChange={setLive} /></Field>
```

## ToggleGroup

Independent flags in one well: LED chips or icon chips.

Props: `label`, `options: OptionInput[]`, `value` / `defaultValue` / `onChange` with **`V[]`**, `multiple` (default true; `false` = solo group that can be emptied), `led` (default true).

```tsx
<ToggleGroup label="Passes" options={['AO', 'SSR', 'BLOOM']} defaultValue={['AO']} />
```

## Segmented

One of n; the insert travels. Props: `label` (accessible name), `options`, `value` / `defaultValue` / `onChange` with a single `V`.

```tsx
<Segmented options={['LOW', 'MED', 'HIGH']} defaultValue="MED" label="Quality" />
```

## ColorField

The colour as the insert, ink follows luminance. Click the swatch for the native picker, or the hex to type.

Props: `label` (omit for a full-width swatch), `value` / `defaultValue` ('#00C8B3') / `onChange(hex)`, `alpha` (value becomes `#RRGGBBAA`, adds a scrubbable opacity readout). Hex is `#RRGGBB`.

## Select

Insert face or `appearance="well"`. The list portals to `<body>` (carrying the theme's tokens), with keyboard and type-ahead. A long list scrolls within what is left of the viewport under the face, on the family's thin scrollbar, and the keyboard keeps the highlighted row in view.

Props: `label` (placeholder + accessible name), `options: OptionInput[]`, `value` / `defaultValue` / `onChange`, `appearance` (`'insert' | 'well'`, default insert), `disabled`.

```tsx
<Select label="Output" options={[{ value: 'png', label: 'PNG' }, { value: 'exr', label: 'EXR' }]} value={fmt} onChange={setFmt} appearance="well" />
```

## ChipGroup

A wrapping set of choices: moods, tags, categories, filters. Off, a chip is an outlined pill; on, it is the polished insert.

Props: `label` (accessible name), `options` (strings, or `{ value, label, icon, title, disabled, count }`; `count` draws in the mono after the label), `value` / `defaultValue` / `onChange` with **`V[]`**, `multiple` (default true; `false` = one at a time, which can also be emptied).

```tsx
<ChipGroup label="Mood" options={['Joy', 'Curious', 'Shy']} defaultValue={['Curious']} />
<ChipGroup label="Category" multiple={false} options={[{ value: 'image', label: 'Image', count: 48 }, { value: 'video', label: 'Video', count: 22 }]} />
```

## Panel · Section · Field

- **Panel** — glass card. Props: `title`, `subtitle`, `actions` (header right), `tabs` (slot between header and body, e.g. `<Tabs>`), `footer` (foot status line), `as` (default `section`), `children`.
- **Section** — a titled group under a quiet heading, with no line across. Everything about the group lives in its one title row: LED (switchable groups) · title · count · actions · chevron. Props:
  - `title` (required), `heading` (`'caps'` a small sans heading in capitals, default · `'text'` a larger sans title);
  - `count`: quiet info right after the title — a number (it rolls when it changes) or a short note such as `"1 changed · 3"` (wrap a word in `<b>` to lift it). It dims with the group when off;
  - `actions`: slim things that belong to the group, such as a status `Badge` or an `IconButton`; they are trimmed to the row's height;
  - `enabled` / `defaultEnabled` / `onEnabledChange`: the group's on/off, shown by an LED before the title (lit when on; dark with a ghosted title when off). **One click** on the title row folds the group; **double-click** (or **Shift+Enter**) switches it on or off. Off folds it closed and makes it inert; values are kept, and on restores the fold it had. A switchable group always shows its chevron. On switchable groups a single click waits ~220ms to tell it from a double-click;
  - `collapsible`, `open` / `defaultOpen` (true) / `onOpenChange`: the title row and chevron open and close the group without switching it off. A switchable group is always foldable and always shows its chevron.
- **Field** — a label + control row. Props: `label` (required), `labelWidth` (default 72px via `--ar-field-label-w`), `children`.

```tsx
<Panel title="Material" subtitle="Optical body" footer="Ready">
  <Section title="Surface" count={3} collapsible>
    <Slider label="Transmission" defaultValue={0.72} format="percent" decimals={0} />
    <Field label="Preset"><Select options={['Neutral', 'Warm']} defaultValue="Neutral" appearance="well" /></Field>
  </Section>
</Panel>
```

## Tabs

A tab strip with a travelling underline. Props: `items: OptionInput[]`, `value` / `defaultValue` / `onChange`, `label` (list accessible name), `idBase` (ids: `${idBase}-tab-${v}` / `${idBase}-panel-${v}` — use it to wire `aria-controls` to your panels).

```tsx
<Panel title="Metablock" tabs={<Tabs items={['Scene', 'Studio', 'Detail']} value={tab} onChange={setTab} idBase="mb" />}>…</Panel>
```

## RollingValue

The odometer readout used by every number in the family: slider, range and number readouts, the Knob, the XYPad, the Meter, ColorField's opacity, Section counts and the graph's readouts. Only the digits that change roll, in the direction of the change, and a carry (59.99 → 60.00) resolves right to left.

Props:
- `text` (required): the formatted number. Any characters other than digits stay still.
- `unit`: a quieter unit after the number.
- `dir`: 1 rolls up, -1 rolls down. Default: read from the numbers.
- `fast`: a short roll. Default: on while the value changes more often than every 450ms, so a streaming readout stays legible.
- `base`: the canonical number of decimals (default 2). Digits beyond it grow in and out.

`RollingText` takes any readout string. A bare number with at most a short unit rolls as one readout; in a sentence (`56.1 L · 50 of its seed`) only the numbers roll and the words stay plain text in their own font; with no digits it is plain text (`—`, `true`, a name).

```tsx
<RollingValue text={fps.toFixed(0)} unit="fps" base={0} />
<RollingText text={status} />
```

## Knob · XYPad

- **Knob**: a rotary control. A tick arc and a signal arc circle a round well, the insert is the cap and a lit seam is its pointer. Drag vertically (Shift is fine), use the wheel or the arrows, and double-click to reset. Props: `label` (required), `value` / `onChange` / `onCommit`, `min` / `max` (0 / 1), `step` (0.01), `defaultValue` (the double-click target), `size` (px, default 40), `showLabel` (default true).
- **XYPad**: two values in one well, with a hairline quarter grid, a tick crosshair and an insert puck. Props: `label` (required, drawn in the corner), `value` / `onChange` / `onCommit` as `[x, y]`, `xRange` / `yRange` (default `[-1, 1]`), `height` (default 110; width follows the container). Arrow keys nudge the puck.

```tsx
<Knob label="Mix" value={mix} onChange={setMix} defaultValue={0.5} />
<XYPad label="Pan / Tilt" value={pt} onChange={setPt} height={140} />
```

## TextField · FileDrop

- **TextField**: a single-line input cut into a well. Typed text uses the body font; the icon lights with the signal while the field has focus. Props: `value` / `onChange(string)` (both required), `label` (accessible name), `icon`, `clearable`, `size` (`'md' | 'sm'`), plus every `<input>` attribute. `type="search"` adds a magnifier and a clear button, and Escape clears the text. It forwards a ref to the `<input>`.
- **FileDrop**: a wide well with an etched, dashed rim that lights with the signal while a file is held over it. Click it to browse. Props: `onFiles(files)` (required), `accept` (input syntax, e.g. `"image/*,.glb"`), `multiple` (default true), `title`, `hint` (written in mono caps), `disabled`.

```tsx
<TextField type="search" label="Filter" placeholder="Filter parameters…" value={q} onChange={setQ} />
<FileDrop accept=".glb,image/*" title="Drop a model or image" hint="GLB · PNG · JPG" onFiles={load} />
```

## Button · IconButton · Toolbar · Kbd · Badge

- **Button**: a labelled action in three weights. `variant`:
  - `'primary'`: the family's polished insert in its well with a lit LED; the one main action in a view;
  - `'danger'`: the same, with the LED in the fault colour;
  - `'default'`: a quiet raised face with a hairline, for every other action;
  - `'ghost'`: bare label ink.

  A label cut by an ellipsis shows in full as the button's tooltip (unless you gave it a `title`).

  Other props: `size` (`'md' | 'sm'`), `icon` (leading), `trailing` (a right-aligned hint, typically `<Kbd>`), `block` (full width), plus every `<button>` attribute.
- **IconButton**: square and icon-only. The required `label` is both the accessible name and the tooltip. `active` makes it a toggle drawn as an insert while pressed; `filled` gives it a well at rest, for use over bright scenes; `size` is `'md' | 'sm'`; `labelled` shows the label beside the icon — `true` always, `'active'` only while `active`, so a tool strip names the current tool and keeps the rest as icons.
- **Toolbar**: groups actions with `role="toolbar"`. Props: `label` (required), `orientation`, `floating` (a small pane of the theme's glass, for use over a canvas). Use `<ToolbarGroup label>` to set related buttons in one shared well (a tool strip, a set of views), `<ToolbarSeparator />` for a hairline and `<ToolbarSpacer />` to push the rest to the far end. A good toolbar is a few groups, then a spacer, then its actions from quiet to primary: `ghost` · `default` · one `primary`.
- **Kbd**: key caps drawn as tiny wells. `keys={['mod', 'K']}`: `mod` shows ⌘ on Apple platforms and Ctrl elsewhere (the same for `shift` and `alt`). The platform is read after hydration, so server-rendered HTML always matches.
- **Badge**: a status tag drawn as a wash and a hairline in its state's colour. `tone`: `'neutral' | 'live' | 'warm' | 'danger'`. `dot` adds a glowing dot in front.

```tsx
<Toolbar label="Format" floating>
  <IconButton label="Bold" icon={<BoldIcon />} active={bold} onClick={() => setBold(!bold)} />
  <ToolbarSeparator />
  <Button variant="primary" size="sm" trailing={<Kbd keys={['mod', 'Enter']} />}>Render</Button>
</Toolbar>
<Badge tone="live" dot>Live</Badge>
```

## Stat · Meter · Progress · Sparkline

Read-only instruments.
- **Stat**: one figure that matters. Props: `label` (required), `value` (a formatted string or a number shown with `decimals`; its digits roll), `unit`, `delta` (signed change, drawn with an arrow) with `deltaText` (how it reads, e.g. `"+2.4%"`) and `better` (`'up'` default or `'down'`: the arrow takes the signal colour when the change is good, the fault colour when not), `trend` (recent samples, drawn as a Sparkline under the figure) with `threshold`, `tone`, `caption` (a quiet line under it), `framed` (default true: a quiet tile; false sets it bare in your own card), `size` (`'md' | 'lg'`).
- **Progress**: a task under way. Props: `label`, `value` (0..1; leave it out for an indeterminate sweep), `valueText` (default the percentage; `null` hides it), `status` (`'running' | 'done' | 'error'`: done fills and settles in the signal colour; error keeps the fill where it stopped, in the fault colour), `caption` ("3 of 12 files", or what went wrong and what to do).
- **Meter**: a level bar, drawn as a thin well with a signal fill and a tabular readout. Props: `label` (required; drawn at the left in a label column, width `--ar-meter-label-w`, 92px), `hideLabel` (screen readers only, for a row that already names it), `value`, `min` / `max`, `valueText` (default: the value; `null` hides it), `peak` (holds the peak, then lets it fall), `tone` (`'live' | 'warm' | 'neutral'`).
- **Sparkline**: a trend line with an optional fill. Props: `label` (required), `values` (oldest first), `min` / `max` (fixed range; otherwise fitted to the data), `width` / `height` (120 × 28), `fill` (default true), `threshold` (a dashed reference line), `tone`.

## ItemList · ItemRow

A list of things: layers, bodies, presets, files. Rows stand in an `ItemList` (`role="list"`, `label`) 2px apart with no dividers.

**ItemRow** props: `title` (the name, in the sans), `meta` (a quiet second line; truncates), `swatch` (a colour drawn as a round swatch) or `leading` (any icon or thumbnail), `trailing` (tools at the end: a `Badge`, `Switch variant="compact"`, `IconButton`, `Menu`; clicks there never select the row), `selected` (the active wash and the signal edge on the left), `onSelect` (makes the row a button), `disabled` (the name side goes quiet; the trailing tools stay live).

```tsx
<ItemList label="Layers">
  <ItemRow title="Orb" meta="Glass shell · 12,480 tris" swatch="#4fd1ba" selected={picked === 'orb'} onSelect={() => setPicked('orb')}
           trailing={<><Badge tone="live" dot>Live</Badge><Switch variant="compact" aria-label="Show Orb" value={on} onChange={setOn} /></>} />
</ItemList>
```

## PropertyRow

The inspector row. It arranges a label column, the control, and a reset button and actions that appear on hover; it never owns the value.

Props:
- `label`, `children` (the control);
- `density`:
  - `'default'`: the control names itself, so the label is hidden;
  - `'compact'`: the label sits in a column;
  - `'multiline'`;
- `binding`: names the driver, in mono caps in the bind colour;
- `status`: `'bound' | 'warn' | 'fault'`, with `message` explaining it in words;
- `modified`: a signal dot in the left gutter, outside the row, so it takes no width;
- `onReset`: with `modified`, the dot becomes the reset under the pointer or keyboard focus, in the same gutter spot, so the control keeps its full width and rows stay aligned;
- `actions`: extra affordances at the right end, shown on hover or focus (these do take width; prefer the Section's `actions` for state that belongs to the group);
- `highlighted`: a search reveal;
- `dataControl`: written as `data-control`;
- `disabled`.

The label column width is the Field's `--ar-field-label-w` (104px here).

The gutter mark needs about 14px of space to the left of the row; every Panel, Section and Dock panel provides it.

```tsx
<PropertyRow label="Gain" density="compact" modified={gain !== 0} onReset={() => setGain(0)} binding="LFO 1">
  <Slider label="Gain" value={gain} onChange={setGain} format="db" min={-24} max={24} />
</PropertyRow>
```

## Overlays: Menu · ContextMenu · Dialog · Toast · Tooltip · CommandPalette

Everything that floats sits on one sheet: the float surface that a Select's list opens on, with the same blur, ring and shadow. Rows are light body text; group headings and shortcuts are mono caps. Menus, toasts, tooltips and the palette portal to `<body>` through `ThemedPortal`, so they keep the theme, density and token overrides of the place they were opened.

- **Menu** opens from its `trigger` (one button, wired for you). It takes `items: MenuEntry[]` and `align` (`'start' | 'end'`).
  - A `MenuEntry` is either an item, `{ id, label, icon?, shortcut?, disabled?, danger?, checked?, onSelect }`, or `{ type: 'separator' }`, or `{ type: 'label', label }`.
  - Keyboard: arrows, Home, End, Enter and Escape. An outside press closes it, and it stays on screen.
- **ContextMenu** wraps any content and opens on right-click. `items` is a function, built when the menu opens. `disabled` lets the browser's own menu through. The wrapper adds no box (`display: contents`).
- **Dialog** is the native `<dialog>` shown modal, so focus trapping and Escape work. Props: `open`, `onClose`, `title`, `description`, `footer` (right-aligned buttons, above a hairline), `width` (380), `children`.
- **Toast**: wrap the app once in `<ToastProvider placement="bottom-right">` (also `'bottom-center' | 'top-right'`). Then `const notify = useToast()` and call `notify({ title, description?, tone?, duration?, action? })`.
  - `tone` is `'neutral' | 'success' | 'warning' | 'error'` and is drawn as a small LED.
  - `duration: 0` keeps the toast until it is dismissed.
  - The call returns a dismiss function.
- **Tooltip** takes `content`, `children` (one focusable element), `side` (`'top' | 'bottom' | 'left' | 'right'`) and `delay` (450ms). It shows on hover and on keyboard focus.
- **CommandPalette** is a search sheet that matches fuzzily on label and keywords. Props: `commands: Command[]` (`{ id, label, group?, keywords?, shortcut?, icon?, run }`), `open` / `onOpenChange`, `hotkey` (default Ctrl/⌘ + K; `null` turns it off), `placeholder`.

```tsx
<Menu trigger={<Button icon={<MoreIcon />}>Object</Button>} items={[
  { type: 'label', label: 'Object' },
  { id: 'dup', label: 'Duplicate', shortcut: 'Ctrl D', onSelect: duplicate },
  { type: 'separator' },
  { id: 'del', label: 'Delete', danger: true, onSelect: remove },
]} />
<Dialog open={confirm} onClose={() => setConfirm(false)} title="Delete layer?" footer={<><Button variant="ghost" onClick={cancel}>Cancel</Button><Button variant="danger" onClick={remove}>Delete</Button></>} />
```

## Dock · PanelBar · useDock

A studio workspace in one component, with no setup.

- Panels sit as tabs in docks on the left, right and bottom, or float.
- A tab can be dragged out to float it, onto an edge to dock it, or onto another dock to merge.
- A pane can be split, maximized, sent back home or closed. Right-click a tab for every placement.
- An optional `viewport` (a 3D canvas, a video, an image) fills the space behind the docks.
- Panes are the theme's panel glass, tab strips use the signal underline, and the drag feedback (drop preview, intent chip, ghost) is drawn in the family's materials.

Props:
- `panels: DockPanel[]`, each `{ id, title, description?, keywords?, dock?: 'left' | 'right' | 'bottom' | 'float', active?, content, footer? }`;
- `viewport`;
- `storageKey`: saves the arrangement to localStorage, and restores it only while every saved id still exists;
- `sizes`: fractions per edge; default left .22, right .24, bottom .36. A side dock never drops below 220px (taking at most 40% of the room left), a top or bottom dock below 120px (at most half), so a small workspace keeps usable columns;
- `floatBounds`;
- `commands`: extra palette entries;
- `palette`: the search entry plus the ⌘/Ctrl K palette; default true. The tabs give way to it (they scroll) so it never leaves the strip; a strip under 520px wide (a side dock) puts the tabs on a row of their own and the panel bar, search and toolbar on the row below, and under 340px search folds to a magnifier;
- `toolbar`: the right end of every strip;
- `brand`: a corner chip;
- `hideKey`: e.g. `'h'` hides the docks;
- `viewProps`: engine tuning such as padding, gap and snapping;
- `onReady(api)`;
- `className`, `style`.

Inside a panel:
- `useDock()` returns the `DockApi`: `{ workspace, openPanel(id), resetLayout(), openPalette(), visible, setVisible }`.
- `<PanelBar>` holds a panel's toolbar. It rises into the dock's tab strip when there is room, and otherwise stays at the top of the panel.
- The panel body exposes `data-layout="portrait | landscape"` and `--ar-dock-panel-h` for responsive content.
- A panel that throws shows a Retry card instead of taking the dock down.

The Dock fills its parent, so give the parent a height.

```tsx
<div style={{ height: '100vh' }}>
  <Dock
    storageKey="my-app.layout"
    viewport={<canvas ref={canvasRef} />}
    panels={[
      { id: 'inspector', title: 'Inspector', dock: 'left', content: <Inspector /> },
      { id: 'layers', title: 'Layers', dock: 'right', content: <Layers /> },
      { id: 'console', title: 'Console', dock: 'bottom', active: true, content: <Console />, footer: 'Sampling · 220 ms' },
    ]}
  />
</div>
```

**MetaBlock** is the framework-free docking engine underneath. Use it directly when you need your own chrome: `new MetaBlockWorkspace(...)` with `<MetaBlockWorkspaceView workspace renderBlock renderGroupChrome …>`, `useWorkspaceRevision(workspace)`, `defaultCapabilities` and the `types` exports. Its stylesheet is `dock/metablock/WorkspaceView.css`. Its `--mb-*` / `--au-*` variables are bound to the theme only under `.ar-dock`, so set them yourself on a custom host.

## NodeGraph · LiveGraphView · graph/gpu

- **NodeGraph**: a node editor on a canvas well with a dot grid. Nodes are the frosted sheet (the material every list and menu floats on), each with an LED before its title in its family's colour and the fold chevron at the end of the title row; fields are wells. Wired ports light like LEDs and wires glow in the signal colour.
  - Editing: drag from a port to wire and click a wire to cut it. On the canvas, drag to select, Alt-drag or middle-drag to pan, and Ctrl/⌘ + wheel to zoom. Double-click or right-click the canvas for the node palette.
  - Shortcuts: ⌘/Ctrl + G groups, D duplicates, Z undoes and Y redoes.
  - A node's fields are the family's own controls at dense density: a bounded number (a field with both `min` and `max`) is a Slider capsule, an open number a NumberField cell, a flag a Switch, a choice a Select, text a TextField. Its ports light like LEDs when wired, and its preview is a Sparkline in a well. The same rule applies to a `LiveGraphView` control.
  - Connections are type-checked and cycles are flagged; an inspector column shows the selected node with the same controls.
  - Props: `value: GraphDefinition` / `onChange` (both required), `readouts` (each node's last output), `frames` (GPU thumbnails), `sources` (what the pickers offer), `runtimeDiagnostics`, `onDiagnostics`.
- **LiveGraphView**: a read-only, column-laid view of a running graph with live controls. Props: `graph: LiveGraph`, `previews`, `onInspect`, `onControl` (required), `insetRight`.
- **Graph model** (`graph/graph.ts`, exported from the index):
  - `NODE_SCHEMAS`, `createNode`, `validateGraph`, `topologicalOrder`, `connectionError`;
  - `evaluate(graph, context)`, which runs against any `GraphHost` (`readSignal`, `writeSignal`, `readParameter`, `writeParameter`, plus optional scene and render hooks);
  - `useGraphEditor` (undo history and editing operations).
  - Domains are `'signal' | 'parameter' | 'scene' | 'render' | 'gpu'`.
- **graph/gpu**: `compileGPU(graph, host)` turns a `gpu` graph into three.js TSL nodes, and `refreshUniforms` updates the uniforms each frame. It needs `three` with `three/tsl` (tested on 0.185), so it is not in the index or in `--components all`. Include it with `--components GraphGPU` and import it by path.

```tsx
const [graph, setGraph] = useState<GraphDefinition>({ domain: 'signal', nodes: [], edges: [] });
<div style={{ height: 420 }}><NodeGraph value={graph} onChange={setGraph} /></div>
```

## ArtinosTheme

Optional scope wrapper — sets `data-ar-theme`, `data-ar-density`, `data-ar-material`, `data-ar-type`, `data-ar-scene` and inline tokens on one element. Props: `theme` (a built-in id **or any custom theme name** you have CSS for; default `studio`), `density`, `material`, `type` (a type collection, see `TYPE_COLLECTIONS`; inherits when omitted), `scene` (`'light' | 'dark'`: what the glass sits over; a wash of the theme's own ground goes under every glass surface so its ink keeps contrast over a scene of the other kind, e.g. frost-deep over a light room; omit over a scene the theme was drawn for), `tokens` (overrides: `{ signal: '#ff4fa3' }` or full `--ar-*` names), `ground` (paint the theme's background and text colour — use for solid themes / full-page scopes), `as` (default `div`), plus any HTML attributes. Scopes nest. Without React: `<div data-ar-theme="frost-deep">`.

`themeStyle(tokens)` returns the same inline style object without the wrapper.

## Motion

Every component moves with the same few durations and curves, all of them tokens (see the theming guide), and nothing loops unless it means something live.
- **Numbers roll** (RollingValue) wherever they change.
- **Overlays arrive and leave.** Menus drop from their trigger, or rise when they open upward. Tooltips slide out of the side they point away from. Dialogs, the command palette and toasts rise in, then fade out faster than they came. A dismissed toast slides away and the stack closes the gap.
- **One highlight glides.** In menus, the Select list and the palette, the hovered or keyboard-active row is a single wash that slides between rows.
- **Lists unroll.** The Select list opens out of its face with its rows cascading, and rolls back up into the face on close.
- **Presses spring.** Buttons dip and spring back, and a toggled IconButton's insert grows in. The Knob cap and the XYPad puck settle with a small overshoot when moved by the wheel, keys, a click or a reset. They follow the hand directly while dragged.
- **Things draw themselves.** Sparklines and graph wires draw in, a dragged wire flows towards the pointer, and a newly wired port pops.
- **The Dock moves calmly.** The active tab's underline draws out from its centre, a panel shown by its tab settles in, and the drag feedback eases into place.
- **Live states breathe.** A `live` Badge's dot and a FileDrop holding a file breathe softly.
- **Changes are marked.** PropertyRow's modified dot springs in and shrinks away on reset. A search reveal pulses the row once.

`prefers-reduced-motion: reduce` sets the durations to 0, skips the WAAPI animations and stops the breathing.

The helpers are exported for your own components:
- `usePresence(value, exitMs)` keeps an element mounted while it plays `data-state="closing"`.
- `useGlide(listRef, glideRef, selector?)` moves one highlight to the active row.
- `useFlip(containerRef)` slides keyed children (`data-flip`) into their new places.

The shared keyframes are `ar-rise-in`, `ar-drop-in`, `ar-fade-out`, `ar-fade-in`, `ar-pop-in`, `ar-settle-in` and `ar-breathe`.

## Shared types and constants

- `OptionInput<V> = V | { value: V; label?: ReactNode; icon?: ReactNode; title?: string; disabled?: boolean }` — plain strings work for simple lists; icons replace text in ToggleGroup/Segmented.
- `THEMES`, `THEME_META[id]` (`label`, `family`, `kind: 'solid' | 'glass'`, `description`, `swatch: [ground, control, signal]`), `GLASS_THEMES`, `TYPE_COLLECTIONS`, `TYPE_META[id]` (`label`, `ui`, `mono`, `display`, `description`), `DENSITIES`, `MATERIALS`, `GRADIENTS`, `MAPPINGS`, `CURVES`, `formatValue`.
- Types: `ThemeName`, `Density`, `MaterialName`, `Format`, `Formatter`, `Mapping`, `Gradient`, `RangeValue`, `SliderVariant`, `SliderStatus`, `PrecisionLevels`, and every `…Props`.

## Recipes

**Theme picker from the kit's own list** (only the themes the kit contains):
```tsx
import { Select, THEMES, THEME_META } from './artinos-ui';
<Select label="Theme" options={THEMES.map((t) => ({ value: t, label: THEME_META[t].label }))} value={theme} onChange={setTheme} appearance="well" />
```

**Parameter object → controls** (typical inspector):
```tsx
<Panel title="Light">
  {params.map((p) => (
    <Slider key={p.key} label={p.label} min={p.min} max={p.max} value={values[p.key]} onChange={(v) => set(p.key, v)} onCommit={() => persist()} />
  ))}
</Panel>
```

## Requirements and performance

- React 18.3+ and `react-dom` (built and tested on React 19). TypeScript source, `strict`-clean; any bundler that handles TSX and CSS `@import` works (Vite, Next, webpack).
- Stateful component files start with `'use client'`; `ArtinosTheme` is hook-free. The precision HUD, the Select list, menus, toasts, tooltips and the command palette portal to `<body>` and carry the theme's tokens with them (`ThemedPortal`, also exported for your own overlays).
- The Dock needs a sized parent, because it fills 100% of it. `graph/gpu` additionally needs `three`.
- Evergreen browsers: the CSS uses `@property`, `color-mix()`, `:has()` and `backdrop-filter`.
- No permanent animation loop. Position is driven by three registered CSS properties (`--ar-lo`, `--ar-hi`, `--ar-p`), so fill, seam and ink clip move together; the ruler zoom is the only `requestAnimationFrame` loop, and it runs for 220ms. Ticks and detents are a handful of nodes.
- Respects `prefers-reduced-motion`.
