# ARTINOS UI — component API

The original controls (Slider through Select) are **controlled** (`value` + `onChange`) or **uncontrolled** (`defaultValue`). They accept `className`, `style`, `id` and two scope props: `density` (`'dense' | 'standard' | 'comfort'`) and `material` (an advanced finish override).

Every value control can be controlled (`value`), uncontrolled (`defaultValue`) or bound to a `signal`. The overlays, the Dock and the graph are controlled, and most components accept `className`.

Everything is a named export of the kit's `index.ts`.

This is the prop reference. For *which kind* to use — the six slider faces, the control shapes, the row states, and a lookup from parameter to control — read `catalogue.md` first.

Contents:
- Controls: Slider · RangeSlider · NumberField · Switch · Checkbox · ToggleGroup · ChipGroup · Segmented · ColorField · Select · Knob · XYPad · TextField · FileDrop
- Layout: Panel / Section / SectionGroup / Field · Text · Stack / Inline · Tabs · PropertyRow · ItemList / ItemGroup / ItemRow
- Actions: Button · IconButton · Toolbar · Kbd · Badge
- Display: RollingValue · RollingText · Stat · Meter · Spectrum · Progress · Sparkline
- Overlays: Menu · ContextMenu · Dialog · Toast · Tooltip · CommandPalette · Loader
- Dock and graph: Dock · PanelBar · AutoHide · MetaBlock · createDockSections · createParamPanes · Inspector · InspectorTimeline · NodeGraph · LiveGraphView · graph/gpu
- Rig: ViewGizmo · Trackball · Vector3Field · TransformGizmo (needs `three`)
- Also: Motion · ArtinosTheme · shared types · recipes · requirements

## Typing a number

`Slider` readouts and `NumberField` take arithmetic in the units they show: `2*3+1`, `pi/2`, `2^8`, `1.5k`, `sin(pi/2)`, `min(3, 8)`. `x` is the value now; `*2` and `/2` work on it directly and `+=10` and `-=10` step it. `evaluateExpression(text, x)` is the same parser. Dragging a number, a slider's readout or an Inspector label locks the pointer once the drag is under way, so the hand can keep going past the edge of the screen.

## Slider

The precision surface. The capsule is the control, the seam is the handle, the readout is the precision zone.

| prop | type | default | notes |
|---|---|---|---|
| `label` | string | | shown inside the capsule (`integrated`) or beside it (`paired`) |
| `value` / `defaultValue` | number | | |
| `signal` | `Signal<number>` | | the value itself, in place of `value`: a drag paints the change and renders nothing above the digits |
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

A recessed numeric cell. Drag to scrub (Alt 0.1×, Shift 0.01×), click/type to edit, arrows and wheel step.

Props: `label`, `signal` (the value itself, in place of `value`), `value` / `defaultValue` / `onChange` / `onCommit`, `min`, `max`, `step`, `decimals`, `format`, `unit`, `formatter`, `pixelsPerStep` (default 4), `align` (`'center' | 'end'`), `disabled`, `aria-label`.

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

Cells are equal while every word fits. In a narrow column where an equal cell would cut a word, each cell takes its own word's width and shares the spare room, so short and long options sit whole side by side. A property row's label column is never more than 42% of the row, so the control keeps the larger share in a narrow pane.

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

Props: `label` (accessible name), `options` (strings, or `{ value, label, icon, title, disabled, count }`; `count` draws after the label, quieter, with tabular digits), `value` / `defaultValue` / `onChange` with **`V[]`**, `multiple` (default true; `false` = one at a time, which can also be emptied).

```tsx
<ChipGroup label="Mood" options={['Joy', 'Curious', 'Shy']} defaultValue={['Curious']} />
<ChipGroup label="Category" multiple={false} options={[{ value: 'image', label: 'Image', count: 48 }, { value: 'video', label: 'Video', count: 22 }]} />
```

## Panel · Section · Field

- **Panel** — glass card. Props: `title`, `subtitle`, `icon` (a mark before the title, the glyph alone, on the title's line), `actions` (header right), `tabs` (slot between header and body, e.g. `<Tabs>`), `footer` (foot status line), `variant` (`'glass'` default · `'solid'` opaque, for busy or bright scenes · `'inset'` a quiet hairline frame with no glass, for a panel inside a panel), `collapsible` with `open` / `defaultOpen` / `onOpenChange` (folds to its header; click the title or chevron), `maxHeight` (the body scrolls past it under soft fades), `labelWidth` (one label column for every Field inside; without it the column fits the panel's longest name, up to the density's column, and a Dock pane does the same), `autoHide` (fades with the interface: for a panel floating over a canvas; a panel in a Dock already does), `as` (default `section`), `children`.
- **Text** — one role per kind of text. Props: `variant` (`'hero' | 'display' | 'title' | 'heading' | 'subheading' | 'statement' | 'overline' | 'kicker' | 'eyebrow' | 'lead' | 'body'` (default) `| 'note' | 'caption' | 'label' | 'value' | 'figure' | 'numeral' | 'meta' | 'tag' | 'quote' | 'code'`), `accent` (`'ink' | 'underline' | 'marker' | 'rule' | 'bar' | 'gradient' | 'outline'`: brings the accent into any role; `outline` needs a heading's size or larger), `dropcap` (a paragraph's first letter three lines tall, in the serif and the accent), `face` (`'sans' | 'serif' | 'mono'`: overrides the role's face, e.g. an editorial serif title), `tone` (`'hi' | 'mid' | 'low' | 'faint' | 'signal' | 'warn' | 'fault'`; default the role's own), `align` (`'start' | 'center' | 'end'`), `truncate` (one line with an ellipsis), `lines` (clamp to n lines), `measure` (keep to `--ar-measure`, 64ch; on by default for lead, body, note, caption and quote), `as` (default: h1 display · h2 title · h3 heading · h4 subheading · p lead, body, note and caption · blockquote quote · code code · span the rest; `as="ul"` / `"ol"` gives a list with accent bullets). Inside a body, `strong`, `em`, `mark` (an accent wash), `code` (a mono chip), `kbd` (a key cap) and `a` (an accent underline) are styled for you.
- **StatStrip** — the few figures that say how a thing is right now, side by side at the top of a Panel: each large and thin with a small name under it. `items`: `{ label, value, unit? }[]`, two to four. Its digits roll. For one figure with a change and a trend, use `Stat`.
- **Callout** — a note set apart from the text around it by its ground alone: a soft fill and an icon in its tone, with no frame and no rule down the edge. `note` is neutral. Props: `tone` (`'note'` (default, neutral) `| 'tip'` (the signal) `| 'warn' | 'fault'`; warn and fault are announced as alerts), `title`, `icon` (replaces the tone's icon; `null` leaves it out), `children` (a line or two; `strong` and `code` are styled).

```tsx
<Text variant="eyebrow">Material · glass</Text>
<Text variant="title">How the shell catches <em>light</em></Text>
<Text variant="lead">The shell bends what is behind it and keeps a bright rim.</Text>
<Text>Raise <strong>Transmission</strong>; hold <kbd>Alt</kbd> for fine steps.</Text>
<Callout tone="tip" title="Start from a preset">Pick <strong>Thick glass</strong>, then tune Roughness.</Callout>
<Text variant="note">Values are in the scene's units.</Text>
```
- **Stack** / **Inline** — a column / a row whose gaps come from the space scale. `gap`: a step `1`–`9` (2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 px), `'row'`, `'group'` or `'none'` (Stack default `'row'`, Inline default `4`). Stack `align` (`stretch` default · `start` · `center` · `end`); Inline `align` (`center` default · `baseline` · `start` · `end` · `stretch`), `justify` (`start` · `center` · `end` · `between`), `wrap`. Both take `as`.
- **SectionGroup** — sections that behave together. Props: `accordion` (one open at a time; give each Section an `id`), `defaultOpen` (the id open first), `toolbar` (Expand all · Collapse all above the sections; only this group's sections answer), `label`, `onReorder(from, to)` (drag sections by their heading into a new order; Alt+↑/↓ on a heading), and `group` + `id` + `onMove(from, to)`: groups that share a group name trade sections by drag, across panels and Dock panes — the way a section moves from one pane of a workspace to another. `onTearOff(from, at)` is called when a section is dropped outside every group of its name, with the screen point; without it, such a drop cancels. In a Dock, `createDockSections` wires all of this for you. A drop goes to the group on the surface that is on top under the pointer, so a floating panel over a pane takes the drop, not the pane beneath it. Every Section inside a group can fold.
- **Section** — a titled group: a quiet title over its rows, on hairlines, with no box. `variant="card"` puts it on a soft tonal surface. The title stands alone, with no icon; a hairline runs from it to `count`, a small fact at the end of the title row. Everything about the group lives in its one title row: LED (switchable groups) · title · hairline · count · actions · chevron. Props:
  - `title` (required), `heading` (`'caps'` default: a small sentence-case name in the heading face · `'text'` a larger title), `description` (a quiet line at the top of the body: what the group does);
  - `variant` (`'plain'` default · `'card'`: the group sits on a soft tonal surface, to set one group apart in a long panel), `columns` (2 or 3: the rows become cells of a grid, e.g. X · Y · Z);
  - `modified` with `onReset`: a reset button appears in the title row while something in the group differs from its default;
  - `storageKey`: remembers open or closed across visits (localStorage; read after mount, so server HTML matches), and makes the group foldable;
  - `id`: needed inside an accordion SectionGroup;
  - `labelWidth`: one label column for every Field inside the group;
  - `count`: quiet info right after the title — a number (it rolls when it changes) or a short note such as `"1 changed · 3"` (wrap a word in `<b>` to lift it). It dims with the group when off;
  - `actions`: slim things that belong to the group, such as a status `Badge` or an `IconButton`; they are trimmed to the row's height;
  - `enabled` / `defaultEnabled` / `onEnabledChange`: the group's on/off, shown by an LED before the title (lit when on; dark with a ghosted title when off). **One click** on the title row folds the group; **double-click** (or **Shift+Enter**) switches it on or off. Off folds it closed and makes it inert; values are kept, and on restores the fold it had. A switchable group always shows its chevron. On switchable groups a single click waits ~220ms to tell it from a double-click;
  - `collapsible`, `open` / `defaultOpen` (true) / `onOpenChange`: the title row and chevron open and close the group without switching it off. A switchable group is always foldable and always shows its chevron.
- **Field** — a label and its control. Props: `label` (required), `layout` (`'inline'` default: the label in a column beside the control, for inspectors · `'stacked'`: the label above it, for forms), `variant` (`'row'` default · `'hero'`: the panel's one big statement · `'quote'`: someone's words in the serif's italic), `labelWidth` (inline; default 108px via `--ar-field-label-w`), `hint` (a quiet line under the control), `error` (what is wrong, in words: replaces the hint in the fault colour and rings the control), `required` (marks the label), `children`. The Field hands its id, message and state to the control inside (`useField()`), so a TextField inside is labelled, described by the message and marked invalid without wiring; read `useField()` in your own controls to do the same. Text as the child (`<Field label="Feels">calm</Field>`) is a readout: it is set at 14px in the panel's brightest ink, while the label is the same size and quieter, so in a long panel labels name and values speak. A Section's title is the largest text in the body and carries a hairline through its own title row, so each group reads as its own block.

```tsx
<Panel title="Material" subtitle="Optical body" footer="Ready">
  <Section title="Surface" count={3} collapsible>
    <Slider label="Transmission" defaultValue={0.72} format="percent" decimals={0} />
    <Field label="Preset"><Select options={['Neutral', 'Warm']} defaultValue="Neutral" appearance="well" /></Field>
  </Section>
</Panel>
```

## Tabs

**Orientation and looks.** Tab names are hairline capitals (`--ar-tab-weight`, `--ar-tab-size`, `--ar-tab-case`, `--ar-tab-tracking`), and an item's `icon` shows only in the icon look. `orientation` `horizontal` (default, a strip) or `vertical` (a rail: the strip turned 90°, names reading down it, the bar on the side facing the view); `variant` `line` (default, words over a travelling bar) · `pill` (a soft wash travels under the current tab) · `icon` (icons alone, each named by its tooltip); `fill` shares the width. An item may be `{ value, label, icon, title, disabled, count, dot }`: `count` is how many things are in the tab, `dot` a light when something wants a look. `onClose(value)` gives every tab a close button, and Delete closes the focused one. Arrow keys follow the orientation. `Panel tabsPlacement="side"` puts its tabs down the left of the body and turns a Tabs inside vertical. In a Dock, `tabs={{ right: 'side' }}` makes that dock's panels a rail (each `DockPanel` may carry an `icon`; a narrow dock shows icons alone).

A tab strip with a travelling underline. Props: `items: OptionInput[]`, `value` / `defaultValue` / `onChange`, `label` (list accessible name), `idBase` (ids: `${idBase}-tab-${v}` / `${idBase}-panel-${v}` — use it to wire `aria-controls` to your panels).

```tsx
<Panel title="Metablock" tabs={<Tabs items={['Scene', 'Studio', 'Detail']} value={tab} onChange={setTab} idBase="mb" />}>…</Panel>
```

## RollingValue

The odometer readout used by every number in the family: slider, range and number readouts, the Knob, the XYPad, the Meter, ColorField's opacity, Section counts and the graph's readouts. Only the digits that change roll, in the direction of the change; every changed digit starts at the same moment and takes the same time, so the columns land together on one baseline.

Props:
- `text` (required): the formatted number. Any characters other than digits stay still.
- `unit`: a quieter unit after the number.
- `dir`: 1 rolls up, -1 rolls down. Default: read from the numbers.
- `fast`: hold the roll short while the hand is on the control.
- `base`: the canonical number of decimals (default 2). Digits beyond it grow in and out.
- `motion`: how the digits answer the feed; see [Live motion](#live-motion). By default the roll is timed to how often the text changes: a lone change takes the full roll, a stream rolls shorter, and past about 10 changes a second the digit simply changes. A feed faster than about 15 a second shows its latest reading at that pace, and the last reading always lands. In a stream each column keeps its own pace.

`RollingText` takes any readout string. A bare number with at most a short unit rolls as one readout; in a sentence (`56.1 L · 50 of its seed`) only the numbers roll and the words stay plain text in their own font; with no digits it is plain text (`—`, `true`, a name).

```tsx
<RollingValue text={fps.toFixed(0)} unit="fps" base={0} />
<RollingText text={status} />
```

## Knob · XYPad

- **Knob**: a rotary control. A tick arc and a signal arc circle a round well, the insert is the cap and a lit seam is its pointer. Drag vertically (Alt 0.1×, Shift 0.01×), use the wheel or the arrows, and double-click to reset. Props: `label` (required), `value` / `onChange` / `onCommit`, `min` / `max` (0 / 1), `step` (0.01), `defaultValue` (the double-click target), `size` (px, default 40), `showLabel` (default true).
- **XYPad**: two values in one well, with a hairline quarter grid, a tick crosshair and an insert puck. Props: `label` (required, drawn in the corner), `value` / `onChange` / `onCommit` as `[x, y]`, `xRange` / `yRange` (default `[-1, 1]`), `height` (default 110; width follows the container). Arrow keys nudge the puck.

```tsx
<Knob label="Mix" value={mix} onChange={setMix} defaultValue={0.5} />
<XYPad label="Pan / Tilt" value={pt} onChange={setPt} height={140} />
```

## Checkbox

A choice in a form or a list. Props: `label`, `description` (a quieter line under it), `checked` / `defaultChecked` / `onChange(boolean)`, `indeterminate` (some of a group: a dash), `disabled`, `aria-label` (when there is no label), `id`. Checked, the insert fills the box and the check draws itself in. For a setting that takes effect at once, use a `Switch`.

```tsx
<Checkbox label="All passes" checked={all} indeterminate={some && !all} onChange={setAll} />
<Checkbox label="Include textures" description="Bakes 12 maps, about 48 MB" defaultChecked />
```

## TextField · FileDrop

- **TextField**: text cut into a well. Typed text uses the body font; the icon lights with the signal while the field has focus. Props: `value` / `onChange(string)` (both required), `label` (accessible name when no Field labels it), `icon`, `clearable`, `size` (`'md' | 'sm'`), `invalid` (the fault ring; set for you inside a Field with an `error`), `multiline` with `rows` (default 3: a textarea that starts at that height and grows with its text where the browser supports `field-sizing`), plus every `<input>` attribute. `type="search"` adds a magnifier and a clear button, and Escape clears the text. It forwards a ref to the `<input>`.
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
- **Kbd**: key caps drawn as raised keys, lit along the top and shaded along the bottom edge, in the mono; words read as written ("Ctrl", "Esc"). `keys={['mod', 'K']}`: `mod` shows ⌘ on Apple platforms and Ctrl elsewhere (the same for `shift` and `alt`). The platform is read after hydration, so server-rendered HTML always matches.
- **Tag**: a small fact beside a value, quiet and neutral with no LED: `<Field label="Knows you">Friend <Tag>visit 8</Tag></Field>`. For a state, use `Badge`.
- **Badge**: a small status plate — a recessed well with an LED in the state's colour and calm text; the state is carried by light, as everywhere in the family. `tone`: `'neutral' | 'live' | 'warm' | 'danger'` (every toned badge carries its LED; a neutral one only with `dot`). `dot`: live — the LED breathes.

```tsx
<Toolbar label="Format" floating>
  <IconButton label="Bold" icon={<BoldIcon />} active={bold} onClick={() => setBold(!bold)} />
  <ToolbarSeparator />
  <Button variant="primary" size="sm" trailing={<Kbd keys={['mod', 'Enter']} />}>Render</Button>
</Toolbar>
<Badge tone="live" dot>Live</Badge>
```

## Stat · Meter · Spectrum · Progress · Sparkline

Read-only instruments. `tone` is `'live' | 'warm' | 'neutral' | 'hot'` on all of them.
- **Stat**: one figure that matters. Props: `label` (required), `value` (a formatted string or a number shown with `decimals`; its digits roll), `unit`, `prefix` (a quieter mark before the figure, e.g. `"$"`), `delta` (signed change, drawn with an arrow) with `deltaText` (how it reads, e.g. `"+2.4%"`) and `better` (`'up'` default or `'down'`: the arrow takes the signal colour when the change is good, the fault colour when not), `trend` (recent samples, drawn as a Sparkline under the figure) with `threshold`, `level` (0..1, a slim bar under the figure), `zones` (ranges of the figure, which then takes the zone's tone), `motion`, `tone`, `caption` (a quiet line under it), `framed` (default true: a quiet tile; false sets it bare in your own card), `size` (`'md' | 'lg'`).
- **Progress**: a task under way. Props: `label`, `value` (0..1; leave it out for an indeterminate sweep), `buffer` (0..1, a quieter fill ahead of the value: what is loaded or queued), `valueText` (default the percentage; `null` hides it), `status` (`'running' | 'done' | 'error'`: done fills and settles in the signal colour; error keeps the fill where it stopped, in the fault colour), `caption` ("3 of 12 files", or what went wrong and what to do), `variant` (`'bar'` or `'ring'`, the percentage inside and the label beside it), `segments` (lit cells for countable work), `sheen` (default true), `size` (`'sm' | 'md' | 'lg'`), `tone`, `motion` (default `'task'`).
- **Meter**: a level bar, drawn as a well with a signal fill and a tabular readout. Props: `label` (required; drawn at the left in a label column, width `--ar-meter-label-w`, 92px), `hideLabel` (screen readers only, for a row that already names it), `value`, or `source` (a function read every frame, without React, in the same units), `min` / `max`, `valueText` (default: the value; `null` hides it), `format` (how the value is written; the only text a `source` meter can have), `peak` (holds the true peak, then lets it fall; `{ hold, fall }` in ms), `segments` (lit cells instead of a continuous fill), `zones` (`[{ from, tone }]`, in the meter's units) with `zonePaint` (`'bands'` paints them along the track, `'level'` turns the whole fill), `origin` (fills out from this value: a pan, a difference), `marker` (a reference tick at this value), `ticks` (this many scale divisions), `orientation` (`'horizontal' | 'vertical'`; upright length `--ar-meter-len`, 132px), `size` (`'sm' | 'md' | 'lg' | 'xl'`), `tone`, `motion` (default `'auto'`).
- **Spectrum**: a bank of level bars for a frequency analysis. Props: `label` (required), `source` (a function read every frame, returning an array of bins: hand it your analyser) or `values`, `bars` (32), `min` / `max` (`max={255}` for `getByteFrequencyData`), `scale` (`'log'` default or `'linear'`: how more bins than bars spread over them, each bar showing its loudest bin), `peak` (a small cap on each bar), `segments` (lit cells up each bar), `mirror` (both ways from a centre line), `zones`, `height` (72), `tone`, `motion` (default `'audio'`). The gap is `--ar-spectrum-gap`.
- **Sparkline**: a trend line with an optional fill. Props: `label` (required), `values` (oldest first), `min` / `max` (fixed range; otherwise fitted to the data), `width` / `height` (120 × 28), `fill` (default true), `threshold` (a dashed reference line), `tone`, `motion` (a slow feed scrolls smoothly, a feed at frame rate is drawn exactly; `'instant'` or `'audio'` never interpolate).

### Live motion

Meter, Spectrum, Progress, Stat, Sparkline and RollingValue all take `motion`, which says what the value is, so the movement suits it.

| `motion` | The bar | The digits | Use it for |
|---|---|---|---|
| `'auto'` | Measures how often readings arrive. At about 30 a second or more it draws each exactly; slower, it lands before the next reading; a lone change glides | Timed to the feed; change without rolling when too fast to land | Anything, when you don't know the rate |
| `'instant'` | The last reading, with no motion | Every reading, no roll | Scrubbing, sync, a trace that must be exact |
| `'audio'` | Rises in the frame the sound does, falls on a release | 10 a second, no roll | Sound, levels, frequency bars |
| `'task'` | A steady advance through readings that land in steps; a quick reset | Timed to the feed | Work under way (Progress's default) |
| `'smooth'` | One long fluid glide, about half a second | Timed to the feed | Slow gauges where calm matters more than timing |
| `{ attack, release, refresh, roll }` | Your own times in ms; 0 is exact | `refresh` and `roll` in ms | Tuning one by hand |

For a signal faster than React should render, pass `source` instead of `value`. It is read every frame, drawn in that frame, and rests while the instrument is off screen.

```tsx
const bins = new Uint8Array(analyser.frequencyBinCount);
<Spectrum label="Spectrum" max={255} bars={48} peak source={() => (analyser.getByteFrequencyData(bins), bins)} />
<Meter label="Output" source={() => level.current} motion="audio" peak segments={28}
       zones={[{ from: 0.7, tone: 'warm' }, { from: 0.9, tone: 'hot' }]} />
<Meter label="Scrub" value={time} max={duration} motion="instant" />
<Progress label="Exporting" value={done / total} segments={16} />
<Stat label="Frame" value={ms} decimals={1} unit="ms" zones={[{ from: 16.7, tone: 'hot' }]} />
```

## ItemList · ItemGroup · ItemRow

A list of things: layers, renders, materials, presets, files, people. Rows stand in an `ItemList` (`role="list"`, `label`).

**ItemList** props:
- `variant`: `'plain'` (default; rows on the panel, 2px apart) · `'divided'` (hairlines between rows) · `'cards'` (each row on a soft tonal surface) · `'grid'` (tiles: the lead on top, the words under it, the trailing tools over the tile's corner on hover).
- `size`: `'sm'` (one line, the meta beside the name; outliners) · `'md'` (default) · `'lg'` (a 44px lead and the description; media).
- `tileWidth`: the narrowest a grid tile gets, in px (default 120).
- `empty`: shown when the list has no rows, e.g. `"No favourites yet: star a material to keep it here."`.

**ItemGroup** names a run of rows inside a list: `label` (an overline in the accent), `count`, `actions`. In a grid it spans the full width. Drag works on the list's flat order.

**ItemRow** props:
- The lead, first match wins: `thumbnail` (an image URL, or any element: a canvas, a video, a drawn sphere) with `thumbShape` `'square'` · `'round'` (people, materials) · `'wide'` (16:9: scenes, video, renders); `icon` (a glyph in the quiet ink); `swatch` (a colour); `leading` (anything else).
- The words: `title` (the name, in the sans), `status` (a light after the name: `'live'` · `'warn'` · `'fault'` · `'idle'`), `meta` (a quiet second line; truncates), `description` (a third line that wraps to two; md and lg only).
- `value`: the row's answer at the end, before its tools, in tabular figures (a size, a duration, a percent).
- `progress`: 0–1, a thin bar along the row's foot (an upload, a render, a bake).
- `trailing`: tools at the end (a `Badge`, `Switch variant="compact"`, `IconButton`, `Menu`); clicks there never select the row.
- `selected` (the active wash and an accent edge) and `onSelect` (makes the row a button); `checked` + `onCheckedChange` put a checkbox before the lead, for picking many at once.
- A tree: `depth` indents the row (0 at the root); `expanded` + `onExpandedChange` give a row with children its disclosure arrow. Render the children only while it is expanded.
- `disabled`: the name side goes quiet; the trailing tools stay live, so a hidden layer can be shown again.

**Drag to reorder and to move.** `ItemList onReorder={(from, to) => …}` lets rows be dragged into a new order (Alt+↑/↓ moves the focused row). Lists that share a `group` trade rows: give each an `id` and handle `onMove(from, to)`, where each is `{ list, index }`; `moveBetween(lists, from, to)` does the array work for a record of lists. The dragged row lifts and follows the pointer; a lit line shows where it lands; the click that ends a drag never selects. Tools at the end of a row and form controls never start a drag.

```tsx
<ItemList label="Renders" variant="divided" size="lg">
  <ItemRow thumbnail="/renders/dusk.jpg" thumbShape="wide" title="Garden · dusk" meta="1920 × 1080 · 240 frames"
           description="Orb drifting through the arches." status="live" value="42%" progress={0.42}
           checked={picked.has('dusk')} onCheckedChange={(on) => toggle('dusk', on)}
           trailing={<IconButton size="sm" label="Actions" icon={<More />} />} />
</ItemList>

<ItemList label="Materials" variant="grid" tileWidth={84}>
  <ItemGroup label="Glass" count={3}>
    <ItemRow thumbnail={<Sphere colour="#9fd8d0" />} thumbShape="round" title="Clear" meta="IOR 1.52" selected onSelect={pick} />
  </ItemGroup>
</ItemList>

<ItemList label="Outliner" size="sm">
  <ItemRow depth={0} expanded={open} onExpandedChange={setOpen} icon={<Folder />} title="Scene" />
  {open ? <ItemRow depth={1} icon={<Mesh />} title="Orb" meta="12,480 tris" status="live" /> : null}
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
- `binding`: names the driver, in small marks in the bind colour;
- `status`: `'bound' | 'warn' | 'fault'`, with `message` explaining it in words;
- `modified`: a signal dot in the left gutter, outside the row, so it takes no width;
- `onReset`: with `modified`, the dot becomes the reset under the pointer or keyboard focus, in the same gutter spot, so the control keeps its full width and rows stay aligned;
- `actions`: extra affordances at the right end, shown on hover or focus (these do take width; prefer the Section's `actions` for state that belongs to the group);
- `highlighted`: a search reveal;
- `dataControl`: written as `data-control`;
- `disabled`.

The label column width is the Field's `--ar-field-label-w` (108px).

The gutter mark needs about 14px of space to the left of the row; every Panel, Section and Dock panel provides it.

```tsx
<PropertyRow label="Gain" density="compact" modified={gain !== 0} onReset={() => setGain(0)} binding="LFO 1">
  <Slider label="Gain" value={gain} onChange={setGain} format="db" min={-24} max={24} />
</PropertyRow>
```

## Rig: ViewGizmo · Trackball · Vector3Field · TransformGizmo

Controls for things in 3D space. Orientations are quaternions `[x, y, z, w]` (`Quat`), the order three.js uses, so a value goes straight to and from `object.quaternion.toArray()` / `.fromArray()`; vectors are `[x, y, z]` (`Vec3`). Each axis keeps its colour everywhere: X red, Y green, Z blue.

- **ViewGizmo** — the camera's orientation as a ball with its axis caps: drag to orbit, click a cap to snap to that view, double-click (or Home) to return to `defaultValue`. Props: `value`, `onChange`, `onCommit` (once, when a drag ends or a snap lands), `defaultValue`, `label` (default "View"), `size` (diameter, 84), `speed` (radians of orbit per pixel, 0.012).
- **Trackball** — an object's rotation turned by hand: tumble the ball, drag an axis ring to turn about one axis (Ctrl snaps to `snap` degrees, default 15), drag outside the ball to roll about the line of sight; arrow keys turn it, double-click returns it to rest. Props: `value`, `onChange`, `onCommit`, `defaultValue` (no rotation), `view` (the viewport camera's orientation: the ball shows the object as that camera sees it, and a drag turns it the way it turns on screen), `label` (default "Rotation"), `size` (120), `snap`, `readout` (the Euler angles under the ball, default on).
- **Vector3Field** — X · Y · Z in one row, each a NumberField in its axis colour. Props: `value`, `onChange`, `onCommit`, `label` (required: names the group, e.g. "Position"), `min`, `max`, `step`, `decimals`, `format`, `unit`, `linked` (keep the three in proportion: a uniform scale) with `onLinkedChange` (shows the link button), `disabled`, `density`. It stays one row on its control's width at any width, like every other control in a label column: when the field is 200px or narrower the cells drop their X · Y · Z letters and keep each axis as a short bar of its colour, so the digits keep the room. In the Inspector a vector row never wraps under its name; a narrow Inspector shortens its label column instead (80px under 340px wide, 64px under 260px).
- **TransformGizmo** — move, rotate and scale handles drawn on an object inside the three.js scene. It needs `three`, so it is not in the index and not in `--components all`: import it from the kit's `rig/TransformGizmo` file. It keeps one size on screen, follows its object every frame, and draws the same under WebGL and WebGPU.

```tsx
const [view, setView] = useState<Quat>(VIEWS.z);
<ViewGizmo value={view} onChange={setView} />
<Trackball value={rotation} onChange={setRotation} view={view} />
<Vector3Field label="Position" value={position} onChange={setPosition} unit="m" decimals={2} />

// inside the scene (React Three Fiber: build it once with useMemo from useThree's camera and gl.domElement)
const gizmo = new TransformGizmo(camera, renderer.domElement);
scene.add(gizmo);
gizmo.attach(mesh);
gizmo.setMode('rotate');                                   // 'translate' · 'rotate' · 'scale'
gizmo.addEventListener('dragging-changed', (e) => (orbit.enabled = !e.value));
```

Math helpers (exported): `QUAT_IDENTITY`, `VIEWS` (the six axis views), `qFromEuler` / `eulerFromQuat` (Euler degrees, XYZ order), `qFromOrbit(azimuth, elevation)`, `orbitPosition(view, distance, target?)`, `orbitBy(view, yaw, pitch)`, `qMul`, `qSlerp`, `qRotate`, `qAxisAngle`, `qConjugate`, `qNormalize`.

## Overlays: Menu · ContextMenu · Dialog · Toast · Tooltip · CommandPalette · Loader

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
- **Tooltip** takes `content`, `children` (one focusable element), `side` (`'top' | 'bottom' | 'left' | 'right'`) and `delay` (450ms). It shows on hover and on keyboard focus. `shortcut` (e.g. `['mod', 'D']`) shows the action's key caps after the hint.
- **CommandPalette** is a search sheet that matches fuzzily on label and keywords. Props: `commands: Command[]` (`{ id, label, group?, keywords?, shortcut?, icon?, run }`), `open` / `onOpenChange`, `hotkey` (default Ctrl/⌘ + K; `null` turns it off), `placeholder`.
- **Loader** counts to 100 on three sideways digit reels in the figure face, holds, lets the figures fade and settle back one by one, then lifts its cover. Props: `value` (0..1 real progress; leave it out for a timed count), `duration` (timed count, ms, default 2600), `hold` (ms at 100, default 450), `label` (a quiet caps line under the figures), `cover` (`'page'` portalled over the window, the default · `'box'` over the nearest positioned parent · `'none'` in the flow), `onDone` (after the cover has gone; the Loader then renders nothing), `outline` (hollow figures: a hairline stroke in the ink, no fill). The cover is the theme's panel material (frosted glass over the scene in a glass theme, the solid sheet in a solid one); `--ar-loader-cover` sets another background. The figure size is `--ar-loader-size` (default `--ar-read-hero`).

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
- `panels: DockPanel[]`, each `{ id, title, description?, keywords?, dock?: 'left' | 'right' | 'bottom' | 'center' | 'float', active?, content, footer?, icon?, capabilities? }`. `dock: 'center'` fills what the edge docks leave, for a workspace of panels with no canvas (over a `viewport` it would cover it). `icon` is the glyph on the panel's tab, alone on a narrow side rail. A `Panel` given as `content` becomes the pane: no glass or title of its own (the tab names it), its subtitle, actions, tabs, side rail and footer kept. A panel is a MetaBlock: `capabilities` (`closable`, `movable`, `resizable`, `floatable`, `dockable`, `splittable`, `tabbable`, `maximizable`, `pinable`, `autoHideable`, `popoutable`, `nestable`, `acceptsDrop`, all on by default) says what it may do, and drags, menus and window buttons follow it, e.g. `{ closable: false, floatable: false }` keeps it docked and open;
- `viewport`;
- `storageKey`: saves the arrangement to localStorage, and restores it only while every saved id still exists;
- `tabs`: how each group of panels shows its tabs, per edge (`left`, `right`, `bottom`, `center`) and `float` (detached windows): `'top'` · `'side'`, or `{ placement: 'top' | 'side', look: 'line' | 'pill' | 'icon' | 'hidden' }` (`DockTabStyle`). Top is a strip, side a rail down the group's outer edge (on a floating window, its left; the window controls at the rail's foot); line is names over a lit underline, pill the current tab on a soft wash, icon the marks alone with the name as tooltip, hidden no tabs at all: the content takes their room, and a thin grip along the top edge (seen under the pointer) still drags the group and opens its menu. A rail shows names, and icons alone when the group is 260px or narrower. The style is the group's MetaBlock meta (`meta.tabs`): the prop seeds it, every tab's right-click menu has Tabs (Top · Side) and Look (Line · Pill · Icon · Hidden) rows to change it, `api.workspace.setGroupMeta(groupId, { tabs })` sets it in code, and the saved layout keeps it, so it travels with the group when it floats or docks. The panel's `PanelBar` stays in the panel on a rail;
- `sizes`: fractions per edge; default left .22, right .24, bottom .36. A side dock never drops below 220px (taking at most 40% of the room left), a bottom dock below 120px (at most half), so a small workspace keeps usable columns;
- two panels side by side in one group (drop a tab on a group's edge): each half has its own head, to drag it out, right-click it for its menu, or put it back as a tab (×); the line between them drags to resize (arrow keys move it, a double-click evens it), and the shares are kept with the layout;
- a group split off beside a dock (`api.workspace.splitBlock`) wears a side rail on that dock's edge, so one column keeps its rails on one side;
- `floatBounds`;
- `commands`: extra palette entries;
- `palette`: the search entry plus the ⌘/Ctrl K palette; default true. The tabs give way to it (they scroll) so it never leaves the strip, which always stays one row; in a strip 520px wide or less search folds to a magnifier;
- `toolbar`: the right end of every strip;
- `brand`: a corner chip;
- `tools` (and `toolsLabel`, default 'Tools'): the canvas's tools, `IconButton`s and `ToolbarSeparator`s. The Dock draws them as one rail of panel glass attached to the panels on the side that faces the canvas: against the left side of a right column, standing on its foot line; against the right side of a left column; on top of a bottom deck's first column, laid flat. It is 8px off the panels (the view's `gap`), follows them through every move, resize and float, hides with the interface, and lights the pressed tool's line on the side facing the canvas. Needs a `viewport`. Give each tool its key in its label (`label="Move · W"`) and handle the key in the app;
- `hideKey`: e.g. `'h'`, `'tab'` or `'mod+.'` hides the interface for a clean view of the viewport, and the same key brings it back (a small glass pill at the foot, a mark and the key, shows it on a click). It is the shared auto-hide switch (see *Auto-hide* below), so every Dock and every Panel with `autoHide` hides with it;
- `idleHide`: ms with no input before the interface fades on its own (off by default); any input brings it back. `idleReveal`: `'move'` (default, any pointer move, wheel, touch or key) · `'near'` (a key, or the pointer near an edge or over a hidden panel's place, so orbiting the canvas keeps the view clean). It never hides while a button is held, a field has focus, a menu or dialog is open, or the pointer rests on a panel;
- `viewProps`: engine tuning such as padding, gap and snapping;
- `onReady(api)`;
- `className`, `style`.

Inside a panel:
- `useDock()` returns the `DockApi`: `{ workspace, openPanel(id), resetLayout(), openPalette(), visible, setVisible(visible), toggleVisible(), addPanel(panel, place?), removePanel(id) }` (`visible` and its setters are the shared auto-hide switch). `addPanel` adds a floating panel while the workspace runs, at `place.at` (its top-left on screen) or at the float bounds, `place.width` / `place.height` optional; `removePanel` takes it away again. Panels whose id starts with `TEAR_PREFIX` (`'ar-tear:'`) are left out of the saved layout, so a reload starts without them.
- `<PanelBar>` holds a panel's toolbar. It rises into the dock's tab strip when there is room, and otherwise stays at the top of the panel.
- The panel body exposes `data-layout="portrait | landscape"` and `--ar-dock-panel-h` for responsive content.
- A panel that throws shows a Retry card instead of taking the dock down.

**Settings from a schema.** `createParamPanes({ params, groups, panes, store, storageKey?, hide? })`, called once outside your components, sets an app's settings the family's way. `params`: `{ key, label, group, kind: 'number' | 'choice' | 'toggle', default, options (choice: `{ value, label }[]`), min, max, step, unit?, face?: 'plain' | 'percent' | 'bipolar' | 'count' | 'log' | 'degrees', help?, advanced?, when? }`; `groups`: `{ id, title, description?, switch? (a toggle key that turns the group on or off), open? }`; `panes`: which groups start in which pane; `store` (optional): `{ get, subscribe, set }` over your own state. Put `<settings.Pane id="…" toolbar={…} />` in a Dock panel or a Panel: it draws the pane bar (Advanced, Undo, Redo, Reset n, your toolbar first) and the groups as dockable sections. A parameter is an Inspector item with a group, so settings share the Inspector's controls, rows and store: `settings.store` is that store, with undo, files, presets and signals. Leave `store` out and the panes keep the values themselves.

**Sections across panes.** `createDockSections({ panes, render, title?, group? })`, called once outside your components, keeps where every section is. Put its `<Pane id="…" />` in a Dock panel's content or in a plain `Panel` on a page (`toolbar` adds Expand all · Collapse all); sections drag between every pane of the set, and tear off into their own panel only inside a Dock; `panes` says which section ids start in which pane, and `render(id)` draws a section (a `<Section>`).
- Drag a section by its heading into another pane to move it there.
- Drag it out over open space and it tears off into its own floating panel at that point, titled by `title(id)`.
- Drag sections into and out of a torn-off panel like any pane; once it is empty it closes.
- Close a torn-off panel with its window button and its sections go back to their home panes.
- `get()` and `subscribe(listener)` read the arrangement (torn-off panels are keyed by their panel id).

```tsx
const sections = createDockSections({
  panes: { inspector: ['material', 'lens'], effects: ['post'] },
  render: (id) => <MySection id={id} />,
  title: (id) => TITLES[id],
});
// panels={[{ id: 'inspector', title: 'Inspector', dock: 'left', content: <sections.Pane id="inspector" /> }, …]}
```

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

**A panel in its own window.** Right-click a tab and choose Open in New Window, or use the window button on a floating panel, for a second monitor. It is the same panel on the same values, with the Dock's theme; closing the window brings it home. `capabilities: { popoutable: false }` keeps a panel in the workspace.

### Auto-hide: one switch for a clean view

Every Dock, every `Panel autoHide` and every `<AutoHide>` fades together and the viewport stays. Hidden by hand (a key, a call, an event) it stays hidden until switched back; hidden when idle, any input brings it back. While hidden a part takes no pointer and (Panel, AutoHide) no focus.

- `useAutoHide({ hotkey?, idle?, reveal? })` turns the behaviours on while the calling component is mounted (a Dock does it from `hideKey` / `idleHide` / `idleReveal`); returns `{ visible, hiddenBy: 'manual' | 'idle' | null }`. Several parts may bind the same key: it toggles once. A key is ignored while typing in a field or working a slider.
- `useInterfaceVisibility()` reads it; `interfaceVisibility` (`get`, `subscribe`, `show`, `hide`, `toggle`, `set(visible)`) switches it from anywhere, React or not.
- Outside React (a three.js loop, a gamepad, a socket): `window.dispatchEvent(new CustomEvent('artinos:interface', { detail: 'toggle' }))` (`'show'` · `'hide'`), the name exported as `INTERFACE_EVENT`.
- `<AutoHide as?>` wraps anything else (a toolbar or HUD over the canvas). Your own element can spread `data-ar-autohide={state.hiddenBy ?? 'shown'}`.

```tsx
<Dock panels={panels} viewport={<Canvas />} hideKey="h" idleHide={6000} idleReveal="near" />
<Panel title="Light" autoHide>…</Panel>           // a floating panel over the canvas
<AutoHide><Toolbar floating>…</Toolbar></AutoHide>
```

## Inspector · InspectorTimeline · createInspectorStore

The parameter editor for the dense family: describe each value once, bind the store to your own object, and the panel is built. It is content, so put it in a `Panel` or as a `DockPanel`'s `content`. It is made for the dense family: wrap the tool in `<ArtinosTheme density="dense">` (see theming.md → Density); in Standard or Comfort it is the same panel at that family's sizes.

```tsx
const items: InspectItem[] = [
  { key: 'angle', label: 'Angle', folder: 'transform', kind: 'number', default: 0, min: -180, max: 180, step: 1, face: 'degrees' },
  { key: 'tint', label: 'Tint', folder: 'material', kind: 'color', default: '#4fd1ba' },
  { key: 'fps', label: 'Frame rate', folder: 'monitor', kind: 'monitor', read: () => stats.fps, graph: true, unit: 'fps' },
];
const folders: InspectFolder[] = [{ id: 'transform', title: 'Transform' }, { id: 'material', title: 'Material' }, { id: 'rim', title: 'Rim', parent: 'material', switch: 'rim' }];
const store = createInspectorStore(items, { target: scene });   // called once, outside your components

<Inspector items={items} folders={folders} store={store} presets={PRESETS} />
<InspectorTimeline items={items} store={store} />
```

**Items** (`InspectItem`): every item has `key`, `label`, `folder?`, `help?` (tooltip), `when?(values)` (shown only while true) and `check?(value, values)` returning `{ status: 'warn' | 'fault', message }` to explain a bad value under its row. `locked` keeps a row out of Randomize.

| `kind` | value | control | extra fields |
|---|---|---|---|
| `number` | number | `Slider` with `min` and `max`, else a scrub `NumberField`; its label scrubs it too | `min`, `max`, `step`, `unit`, `face` (`plain` · `percent` · `bipolar` · `count` · `log` · `degrees`) |
| `toggle` | boolean | compact `Switch` | |
| `choice` | string | `Segmented` up to three options, else `Select` | `options: { value, label }[]` |
| `color` | hex string | `ColorField` as a chip and its code | `alpha` |
| `vector` | `[x, y, z]` | `Vector3Field` | `min`, `max`, `step`, `unit` |
| `range` | `[lo, hi]` | `RangeSlider` | `min`, `max`, `step`, `unit`, `minSpan` |
| `point` | `[x, y]` | `XYPad` | `xRange`, `yRange`, `height` |
| `text` | string | `TextField` | `placeholder` |
| `monitor` | none: `read()` returns a number or a word | a figure, and a trace with `graph` | `min`, `max`, `unit`, `decimals`, `format`, `budget` (a line across the trace), `interval` (ms; default 120, 50 with `graph`) |
| `action` | none | a `Button` that calls `run()` | |
| `custom` | any JSON value | the control registered under `control` | `control`, `default`, `options`, `randomize(random, current)` |

**Folders** (`InspectFolder`): `{ id, title, parent?, open?, switch? }`. `parent` nests a folder: its names step in, its controls stay on the panel's one column. `switch` names a toggle item that becomes the folder's on/off LED instead of a row.

**Inspector props:** `items`, `folders`, `store`, `only` (top folder ids: one schema across several panels), `presets` (`{ name: values }`; the panel adds Save current as preset), `bar` (Find · Presets · Reset; default true), `search`, `toolbar`, `labelWidth` (inherits the density family's label column), `storageKey` (folder folds), `midi` (a `createMidiMap`: rows learn a hardware controller). The bar also holds Undo and Redo; Presets holds Randomize, Export values, Import values and Copy link.

**A row:** drag the value, or a number's label, to scrub (Alt 0.1×, Shift 0.01×); click a number to type. The dot in the gutter resets. The diamond adds or removes a keyframe at the playhead. Right-click: Reset, Copy, Paste, keyframe, Randomize, and for a number Follow (another number of its folder, in the proportion they have now) and Unlink. With `midi`, Learn MIDI controller.

**The store:** `createInspectorStore(items, { target?, onChange?, duration?, tracks?, follow?, storageKey? })`.
- `target` is your own object. Every change in the panel is written to it; its own values win at the start.
- `store.pull()` reads the object back after your app changes it (a frame loop, a gizmo, a load). Call it every frame if you like: the panel follows at `follow` ms (default 50). `pull(true)` reads at once.
- `set(key, value)`, `apply(values)`, `reset(keys?)`, `get()`, `state()`, `subscribe(fn)`, `defaults`.
- Timeline: `toggleKey(key)`, `setTime(seconds)`, `play(on)`; `duration` (default 4, loops) and starting `tracks: { key: [{ t, v }] }`. Numbers, vectors, ranges, points and hex colours glide between keyframes; toggles and choices hold. A value set on an animated key lands as a keyframe at the playhead.
- Links: `link(key, from | null)`: target = source × the ratio they had when linked.
- Presets saved from the panel live in localStorage under `storageKey`.
- Live values: `signal(key)` is one value as a signal, `scrub(key, value)` sets it mid-gesture (the object and the signal now, the panel when the hand settles), `commit()` ends the gesture, `live` carries every change.
- History: `undo()`, `redo()`; Ctrl/⌘ Z and Ctrl/⌘ Shift Z inside the panel. Each settled gesture is one step; `history` sets how many are kept (default 100, 0 is off).
- Files: `toJSON()` writes `{ format: 'artinos.values', version, values, tracks?, links?, presets? }`; `fromJSON(doc)` reads that, its text, or a bare map of values, checks each value against its row and is one undo step. `version` and `migrate(values, fromVersion)` bring older files forward.
- Keeping: `persist: 'key'` keeps the values across reloads; `url: true` (or a parameter name) carries the changed values in the address; `toURL()` gives that address.
- `randomize({ keys?, seed?, amount? })` rolls new values and returns the seed. Rows with `locked`, a link or keyframes stay; a toggle rolls only when named in `keys`.
- `define(items)` adds rows to a running store.
- `mergeInspectorStores([a, b])` is one store for a multiple selection: the panel shows the first one's values, marks rows that differ as mixed, and writes each change to all.

**InspectorTimeline props:** `items`, `store`, `labelWidth` (inherits, like the Inspector's). One lane per animated value: drag to move the playhead (it settles on a keyframe it comes near), click a keyframe to go to it, double-click to remove it.

## Signals · useControls · createPane

Everything that holds a parameter runs through one pipeline. Each layer is used by the one above it, and you can enter at any of them.

```
value      signal                 one value, outside React
schema     InspectItem            what a value is; useControls, createPane and createParamPanes all write it
store      createInspectorStore   values, undo, files, links, presets, keyframes, randomize
control    registerControl        how a kind of value is drawn
row        Inspector              name, control, reset, keyframe, menu
panel      Dock · MetaBlock       docks, floats, tabs, opens in its own window
```

**Every value control takes `signal`**: `Slider`, `RangeSlider`, `Knob`, `XYPad`, `NumberField`, `TextField`, `Switch`, `Checkbox`, `ToggleGroup`, `ChipGroup`, `Segmented`, `Select`, `ColorField`, `Vector3Field`, `Trackball` and `ViewGizmo`; `Stat` and `Progress` follow one. A signal is a function, so `Meter` and `Spectrum` read one directly: `<Meter source={level} />`. `SignalDigits` is a rolling readout on a signal. A custom control gets the same behaviour from `useControllable(value, defaultValue, onChange, signal)`.

**One rule for fine control** on everything that drags: Alt is 0.1×, Shift is 0.01×.

**One undo gesture.** Ctrl/⌘ Z undoes what the focus is on: values in an Inspector, nodes in a NodeGraph, and the layout anywhere else in a Dock. All three use `createHistory`.

**One command palette.** An Inspector in a Dock adds its undo, randomize, reset, files and presets to the Dock's palette, under its panel's name. Add your own from inside a panel with `useCommands(() => commands, key)`.

**Signals** hold a value outside React. `signal(v)`, `computed(fn)`, `effect(fn)`, `batch(fn)`, `untrack(fn)`; read with `s()` (subscribes inside `computed` and `effect`) or `s.peek()`, write with `s.set(v)`, listen with `s.subscribe(fn)`. `tweened(v, { duration, ease })` glides to `.target(next)`, through OKLab for `#rrggbb` colours. In a component, `useSignal(initial)` keeps one and `useSignalValue(s)` renders on change. `artinos-ui/signals` is the core alone, with no React.

```tsx
const amount = signal(0.35);
effect(() => { mesh.scale.setScalar(amount()); });
<Slider label="Amount" signal={amount} />
```

`Slider` and `NumberField` take `signal` in place of `value`: a drag paints the fill and seam directly and renders only the digits, and nothing above the control. The ruler, curve and wave faces are drawn from the value, so they render themselves, still nothing above them.

**useControls** declares a panel from a component; `<ControlsPanel only? bar? />` shows what was declared, as content for a Dock panel or a `Panel`.

```tsx
const { size, tint } = useControls('Badge', {
  size: { value: 96, min: 40, max: 160, step: 1, unit: 'px' },   // a slider (no min/max: a scrub field)
  tint: '#4fd1ba',                                               // a colour
  round: true,                                                   // a switch
  label: 'Prism',                                                // a text field
  quality: { value: 'high', options: ['low', 'high'] },          // a choice
  position: [0, 0, 0],                                           // a vector
  light: [0.2, 0.4],                                             // a pad
  band: { value: [20, 80], min: 0, max: 100 },                   // a range
  fps: monitor(() => stats.fps, { graph: true, budget: 60 }),    // a read-out
  restart: () => reset(),                                        // a button
  Motion: folder({ tilt: 12 }, { open: false }),                 // a folder; its keys come back flat
});
```

The component renders when one of its values changes. For a value read every frame pass `{ transient: true }` and get signals back: nothing renders. The third argument also takes the store's `persist`, `url`, `version`, `migrate` and `history`. `controlsStore(name)` is the store behind a named panel.

**createPane** is the same panel with no React in the calling code. It binds a property of any object; `{x, y, z}` objects and three.js `Vector3` and `Color` bind as they are.

```ts
const pane = createPane({ title: 'Scene', theme: 'nimbus' });
pane.addBinding(params, 'speed', { min: 0, max: 10 });
pane.addBinding(mesh, 'position', { min: -1, max: 1 });
const look = pane.addFolder({ title: 'Look' });
look.addBinding(material, 'color');
pane.addMonitor(stats, 'fps', { graph: true, min: 0, max: 120 });
pane.addButton({ title: 'Reset', onClick: () => pane.reset() });
pane.listen();   // follow objects your frame loop changes
```

Options: `title`, `container` (default: a layer over the page that lets clicks through), `bounds`, `theme`, `density`, `type`, `persist`, `url`. A binding returns `{ key, signal, on(fn), refresh() }`. The pane has `on(fn)`, `refresh()`, `listen(on?)`, `reset()`, `undo()`, `redo()`, `randomize(options?)`, `exportState()`, `importState(doc)`, `dispose()` and `store`. It runs on React inside, so `react` and `react-dom` must be installed.

**registerControl** adds a control to every panel, or replaces a built-in kind by its name.

```tsx
registerControl<number>('dial', {
  component: ({ item, value, set, commit }) => <Knob label={item.label} value={value} onChange={set} onCommit={commit} />,
  animatable: true,                       // takes keyframes
  match: (v) => isDial(v),                // optional: claims bare values in useControls and createPane
});
{ key: 'drive', label: 'Drive', kind: 'custom', control: 'dial', default: 0.4, randomize: (random) => random() }
useControls({ drive: { value: 0.4, control: 'dial' } });
```

A control receives `item`, `value`, `signal`, `status`, `set`, `commit` and `options`. `continuous: false` tells the panel at once on each change (a choice, whose value can show or hide other rows). `transient: true` says the control follows `signal` itself.

**Graph · GraphTrace · FrameGraph** are live traces that write straight to the page and rest while off screen. `Graph`: `label`, `unit`, `decimals`, `format`, `read` or `series: { label, read, tone }[]`, `stacked`, `samples` (120), `interval` (ms, 0 = every frame), `min`, `max`, `budget` (a line; the trace turns to the fault colour while over it), `tone`. `GraphTrace` is the trace alone, with `onSample`. `FrameGraph budget={16.7}` is the page's own frame rate.

**createMidiMap(store, items, { storageKey?, access? })** lets rows learn a hardware controller: pass it as the Inspector's `midi` and right-click a number, toggle or choice. `handle([status, cc, value])` feeds a message from anywhere else.

## MonitorCell · MonitorStrip · MonitorDeck · BarTimeline

Live values in the room a control panel can spare. A **MonitorCell** is one control high, in the same well as a slider: the name, a small picture and the number. The picture has several views of the one value.

```tsx
<MonitorStrip>                                              {/* a row, for a toolbar or status bar */}
  <MonitorCell label="Latency" views={['bars', 'trace', 'spread']} subscribe={onRequest}
    read={() => ({ value: ms, unit: 'ms', limit: 120, status: 'ok' })} />
  <MonitorCell label="Queue" read={() => ({ value: queue.size, unit: 'jobs', share: queue.size / 40 })} />
</MonitorStrip>

<MonitorStrip orientation="stack">                          {/* a stack, for a panel: shared columns */}
  <MonitorCell label="Disk" views={['parts', 'level']}
    reading={{ value: 656, unit: 'GB', share: 0.66, parts: [{ label: 'Models', value: 412 }, { label: 'Free', value: 344, rest: true }] }} />
</MonitorStrip>
```

| view | shows | needs |
|---|---|---|
| `bars` | every event against the limit | `subscribe` for single events, or the periodic readings; `limit` |
| `trace` | the recent history | `plot`, or a numeric `value` |
| `level` | how full it is, with the recent peak | `share` (0–1) |
| `spread` | how the recent readings are distributed | |
| `parts` | what the value is made of | `parts` |

**In use:** a click moves to the next view, a right-click lists them, and hovering the picture reads the past in the cell's own readout. A value that needs attention shows its `state` word beside its name. In a narrow row the pictures give way and the names and numbers stay.

**MonitorCell props:** `label`, `read` (with `clock`, a signal; every 250 ms without one) or `reading`, `subscribe`, `valueAt` (earlier events), `views`, `view` / `defaultView` / `onViewChange`, `storageKey` (remembers the view), `format` (a past reading), `viewLabels`, `samples`. A reading is `{ value, unit?, status?, state?, share?, plot?, limit?, parts? }`. **MonitorStrip:** `orientation` (`row` · `stack`).

**MonitorDeck** is a few values in the least room they can take, as one picture: every channel's history drawn over the whole deck, one over another, each as its `share` (0–1) of its own full scale; the first channel's figure at its head, bold; and one thin line laid over its foot, a key and a number for each further trace, then every other fact (what does not fit the width is left off). It fills its parent (three control heights at least, 63px in Dense); alone in a Dock pane it is the pane, edge to edge, with no well drawn inside. It never grows: there is nothing to open.

```tsx
<PerfDeck />                                   // FPS bold, CPU and GPU over it; memory and the renderer's figures on the line
<PerfDeck monitor={feed} facts={(s) => [{ label: 'Bodies', value: world.count }]} />
<MonitorDeck channels={[
  { id: 'latency', label: 'Latency', read: () => ({ value: ms.toFixed(0), unit: 'ms', plot: ms, share: ms / 200, status: ms > 120 ? 'warn' : 'ok', state: 'slow' }) },
  { id: 'queue', label: 'Queue', read: () => ({ value: jobs, plot: jobs, share: jobs / 40 }) },
]} facts={() => [{ label: 'Disk', value: '656 GB' }]} />
```

**In use:** move over the well to read a moment across every trace (the figure, the keys and a time tag follow the hairline); click to hold it, arrow keys step through it (Shift by ten), Escape lets go. Click a key to take its trace out of the picture.

**MonitorDeck props:** `channels` (`{ id, label, read(): MonitorReading, tone?, format? }`; the first is the figure), `facts` (`() => { label, value }[]`), `clock` (a signal; every 250 ms without one), `samples` (120), `label`, `heldWord`. **PerfDeck props:** `monitor`, `words`, `facts(stats)`, and the deck's `samples`, `label`. A figure the source does not report (draw calls with no renderer connected) is left off the line.

**BarTimeline** is the large form of the `bars` view: `label`, `subscribe(push)`, `limit`, `span`, `format`, `formatLimit`, `overLabel`, `valueAt`, `paused`, `onToggle`.

## PerfStrip · PerformancePanel · sources

How a program is running, built from monitor cells. **PerfStrip** is one line for a toolbar or status bar. **PerformancePanel** stacks the same cells under a sentence saying what the figures mean, and opens to every frame and every figure.

```tsx
<Dock toolbar={<PerfStrip />} … />                          // this browser page, in a bar
<PerformancePanel />                                        // in a panel

// your renderer, and the named parts of your frame
perfMonitor().watchRenderer(renderer);                      // three.js, or anything with render() and info
const physics = perfMonitor().timer('Physics');
physics.measure(() => world.step());

// figures your program already has: a desktop host, an engine, a server
const feed = createPerfFeed({ budget: 33.3 });
feed.frame(frameMs);
feed.update({ mainLoad: cpu, gpuLoad: gpu, heapUsed: ramMb, heapLimit: ramTotalMb });
<PerfStrip monitor={feed} words={{ memory: 'RAM' }} />
```

**PerfStrip props:** `monitor` (a `PerfSource`; default `perfMonitor()`), `cells` (default `perfCells(monitor)`; your own are `{ id, label, read(stats), views?, frames?, format? }`), `orientation`, `words`, `storageKey`.

**PerformancePanel props:** `monitor`, `view` / `defaultView` (`compact` · `extended`) / `onViewChange`, `cells`, `only` (which figures get rows), `names` (other names for figures and folders), `extraItems` and `extraFolders` (your own Inspector rows), `words`, `healthWords` (the diagnosis's sentences), `storageKey`.

**What it says.** `perfHealth(stats)` turns the figures into a sentence and names what is holding the program back: the GPU, the CPU, memory, or nothing. `PerfHealthLine` shows it on one line.

**What a browser can report.** Frames are measured. A page cannot read the machine's CPU use, so CPU is an estimate of how busy the main thread is, with the system's own pressure word where the browser offers one. GPU time needs a connected WebGL2 renderer and a browser with timer queries. Memory is the JS heap, in Chromium browsers. A desktop host that knows the real figures reports them through `createPerfFeed`.

**The monitor sleeps** two seconds after the last reader leaves, so it costs nothing while no panel is open. `perfRows(source)` gives the figures as Inspector rows, `perfControls(source)` as a `useControls` schema, and `pane.addPerformance(source?)` adds them to a `createPane`. `FrameTimeline` and `FrameGraph` are the frame parts alone.

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

Optional scope wrapper — sets `data-ar-theme`, `data-ar-density`, `data-ar-material`, `data-ar-type`, `data-ar-accent`, `data-ar-scene` and inline tokens on one element. Props: `theme` (a built-in id **or any custom theme name** you have CSS for; default `nimbus`, `DEFAULT_THEME`; the old id `haze-carve-custom` still works), `density`, `material`, `type` (a type system, see `TYPE_COLLECTIONS`; inherits when omitted; `fine` at the root), `accent` (one of `ACCENTS`: teal · azure · violet · rose · coral · amber · lime · mono; replaces the theme's signal, so live edges, LEDs, focus and selection take it; each accent has a dark and a light value, picked by the theme), `scene` (`'light' | 'dark'`: what the glass sits over; a wash of the theme's own ground goes under every glass surface so its ink keeps contrast over a scene of the other kind, e.g. frost-deep over a light room; omit over a scene the theme was drawn for), `tokens` (overrides: `{ signal: '#ff4fa3' }` or full `--ar-*` names), `ground` (paint the theme's background and text colour — use for solid themes / full-page scopes), `as` (default `div`), plus any HTML attributes. Scopes nest. Without React: `<div data-ar-theme="frost-deep">`.

`densityTokens` (`{ dense?, standard?, comfort? }`, each a token map like `tokens`) changes the theme in one family only, on top of `tokens`; it follows whichever family is in force on the scope, and `densityTokensCss(id, tokens, layers)` gives the same rule for your own markup.

`density` (one of `DENSITIES`: `dense` · `standard` · `comfort`) is the density family for the whole scope: every size and corner of the theme scaled to it, and Dense's own row rules. See theming.md → Density.

`themeStyle(tokens)` returns the same inline style object without the wrapper.

## Motion

Every component moves with the same few durations and curves, all of them tokens (see the theming guide), and nothing loops unless it means something live.
- **Numbers roll** (RollingValue) wherever they change.
- **One fixed scale.** A role is one size everywhere, in any panel, at any width, open or folded, at any density: 16px semibold in the title face for a panel's name, 14px semibold in the title face, sentence case, for a section's name (the brightest line of its group), 12px semibold in the accent for a group inside it, 13px in the full ink for values, in the figure face (`--ar-figure-font`: Inter Tight 300 in Fine, the control face one weight above the name elsewhere), units in the name's weight, in the accent, 12px medium in a solid 76% grey for labels, 12px for notes, captions and meta lines (quieter still, told by ink, not by shrinking), 28px for the one big statement. A name is quiet and its answer is loud: a label differs from its value by size, weight and ink at once. One voice: words and figures are the same sans, figures with tabular digits; a mono is for code only, and there are no tracked capitals. A label above its control (`layout="stacked"`) is medium weight and brighter than the hint under it. Each role is a whole font in `--ar-type-*` and an ink in `--ar-tone-*`, drawn from the collection's faces and the theme's ink, so they hold on any theme with any type. For your own text, write `font: var(--ar-type-note); color: var(--ar-tone-note)` rather than a size and a colour. Small text on a pane is never light: inside a Panel, Dock or Dialog `--ar-weight-light` is regular.
- **The serif speaks once.** Wrap one word of a title in `<em>` (`Talk with <em>it</em>`) and it takes Instrument Serif italic; in a `Text` title, `hero` or `statement` it also takes the accent. Give a panel one focal point with `<Field variant="hero">`, where an `<em>` word also takes the accent, and set someone's words with `<Field variant="quote">`. Use them sparingly.
- **Hairlines do the structure, not boxes.** A section stands apart by air and carries its own hairline through its title row (no line is drawn between sections), and rows sit on the row gap alone, in every density: the label column and the controls' two edges keep the columns aligned (see design.md, *The lines of a panel*). A Field holding only text sits on its baseline at text height. In a Section with `columns`, each Field is a tile with its label above its value; give a long one `style={{ gridColumn: '1 / -1' }}`.
- **Focus is lift, never a line.** A recessed surface takes light: a field's well, a slider's track, an off chip, a row. A polished part rises off its ground: a segmented thumb, a slider's fill, an on chip, a primary button. Light rises from the foot of a tab. Nothing is drawn around a control, so a scrolling strip or a panel never clips it. For your own parts, use `background: var(--ar-focus-lift)` on a recessed one and `filter: var(--ar-focus-raise)` on a polished one. `box-shadow: var(--ar-focus-ring)` is the same light where only a shadow will do, and it must stand alone: `--ar-well` and `--ar-insert-shadow` can be `none`, which makes a shadow list that includes them invalid.
- **Live levels glide.** A Meter and a Progress fill ride a critically damped spring toward each new reading every frame (no re-renders): their speed never jumps, so a value updated a few times a second reads as one fluid motion; a Meter's peak holds, then falls smoothly. A live Sparkline scrolls at a steady speed: it plays back a moment behind the newest sample, interpolating between arrival times on a spring, so uneven or bunched updates never stall or jump it; a fitted range eases to new extremes and the head rides the line. A running Progress carries a soft travelling sheen.
- **Overlays arrive and leave.** Menus drop from their trigger, or rise when they open upward. Tooltips slide out of the side they point away from. Dialogs, the command palette and toasts rise in, then fade out faster than they came. A dismissed toast slides away and the stack closes the gap.
- **One highlight glides.** In menus, the Select list and the palette, the hovered or keyboard-active row is a single wash that slides between rows.
- **Lists unroll.** The Select list opens out of its face with its rows cascading, and rolls back up into the face on close.
- **Presses spring.** Buttons dip and spring back, and a toggled IconButton's insert grows in. The Knob cap and the XYPad puck settle with a small overshoot when moved by the wheel, keys, a click or a reset. They follow the hand directly while dragged.
- **Things draw themselves.** Sparklines and graph wires draw in, a dragged wire flows towards the pointer, and a newly wired port pops.
- **Clean view leaves and arrives.** Hidden, each pane slides a few pixels toward the edge it lives on and fades (quickly by hand, slowly when idle); shown, they settle back one after another on a soft curve. A Panel with `autoHide` or an `<AutoHide>` sinks and fades the same way (`--ar-autohide-shift` sets its direction). Reduced motion keeps only the fade.
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
- `THEMES`, `THEME_META[id]` (`label`, `family`, `kind: 'solid' | 'glass'`, `description`, `swatch: [ground, control, signal]`), `GLASS_THEMES`, `DEFAULT_THEME`, `THEME_ALIASES`, `TYPE_COLLECTIONS`, `TYPE_ALIASES`, `TYPE_META[id]` (`label`, `ui`, `mono`, `display`, `serif`, `description`, `fonts`), `ACCENTS`, `ACCENT_META`, `DENSITIES`, `MATERIALS`, `GRADIENTS`, `MAPPINGS`, `CURVES`, `formatValue`.
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
- Every live graph shares one frame clock per window (`onFrame`) and scrolls on the compositor, so a frame draws only its newest reading. Graphs rest off screen, and the performance monitor sleeps when nothing reads it.
- No permanent animation loop in the controls. Position is driven by three registered CSS properties (`--ar-lo`, `--ar-hi`, `--ar-p`), so fill, seam and ink clip move together; the ruler zoom is the only `requestAnimationFrame` loop, and it runs for 220ms. Ticks and detents are a handful of nodes.
- Respects `prefers-reduced-motion`.

## Inspector structural slots (experimental)

`Inspector` accepts `summary?: ReactNode` (instrument or context above folders), `rail?: ReactNode` (application navigation), and `footer?: ReactNode` (output and actions). All are optional; existing calls render the original content. Use the same `InspectorStore` for controls inside the slots. The scope's `ArtinosTheme design` selects the structural language. The built-in search, presets, undo, rows, context menus and keyframe behavior are unchanged. `DESIGNS` and `DESIGN_META` are exported from the root.

```tsx
<ArtinosTheme theme="tactile-porcelain" design="monolith">
  <Inspector items={items} folders={folders} store={store} />
</ArtinosTheme>
```
