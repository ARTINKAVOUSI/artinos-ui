# ARTINOS UI — component API

The original controls (Slider through Select) are **controlled** (`value` + `onChange`) or **uncontrolled** (`defaultValue`). They accept `className`, `style`, `id` and two scope props: `density` (`'dense' | 'standard' | 'comfort'`) and `material` (an advanced finish override).

The newer components (Knob, XYPad, TextField, the overlays, the Dock and the graph) are controlled only, and most accept `className`.

Everything is a named export of the kit's `index.ts`.

This is the prop reference. For *which kind* to use — the six slider faces, the control shapes, the row states, and a lookup from parameter to control — read `catalogue.md` first.

Contents:
- Controls: Slider · RangeSlider · NumberField · Switch · Checkbox · ToggleGroup · ChipGroup · Segmented · ColorField · Select · Knob · XYPad · TextField · FileDrop
- Layout: Panel / Section / SectionGroup / Field · Text · Stack / Inline · Tabs · PropertyRow · ItemList / ItemRow
- Actions: Button · IconButton · Toolbar · Kbd · Badge
- Display: RollingValue · RollingText · Stat · Meter · Spectrum · Progress · Sparkline
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

- **Panel** — glass card. Props: `title`, `subtitle`, `icon` (a mark before the title, the glyph alone, on the title's line), `actions` (header right), `tabs` (slot between header and body, e.g. `<Tabs>`), `footer` (foot status line), `variant` (`'glass'` default · `'solid'` opaque, for busy or bright scenes · `'inset'` a quiet hairline frame with no glass, for a panel inside a panel), `collapsible` with `open` / `defaultOpen` / `onOpenChange` (folds to its header; click the title or chevron), `maxHeight` (the body scrolls past it under soft fades), `labelWidth` (one label column for every Field inside), `as` (default `section`), `children`.
- **Text** — one role per kind of text. Props: `variant` (`'hero' | 'display' | 'title' | 'heading' | 'subheading' | 'statement' | 'overline' | 'kicker' | 'eyebrow' | 'lead' | 'body'` (default) `| 'note' | 'caption' | 'label' | 'value' | 'figure' | 'numeral' | 'meta' | 'tag' | 'quote' | 'code'`), `accent` (`'ink' | 'underline' | 'marker' | 'rule' | 'bar' | 'gradient' | 'outline'`: brings the accent into any role; `outline` needs a heading's size or larger), `dropcap` (a paragraph's first letter three lines tall, in the serif and the accent), `face` (`'sans' | 'serif' | 'mono'`: overrides the role's face, e.g. an editorial serif title), `tone` (`'hi' | 'mid' | 'low' | 'faint' | 'signal' | 'warn' | 'fault'`; default the role's own), `align` (`'start' | 'center' | 'end'`), `truncate` (one line with an ellipsis), `lines` (clamp to n lines), `measure` (keep to `--ar-measure`, 62ch; on by default for lead, body, note, caption and quote), `as` (default: h1 display · h2 title · h3 heading · h4 subheading · p lead, body, note and caption · blockquote quote · code code · span the rest; `as="ul"` / `"ol"` gives a list with accent bullets). Inside a body, `strong`, `em`, `mark` (an accent wash), `code` (a mono chip), `kbd` (a key cap) and `a` (an accent underline) are styled for you.
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
- **Section** — a titled group: a large, light title over its rows, on hairlines, with no box. `variant="card"` puts it on a soft tonal surface. `icon` draws as the glyph alone and `count` as a small fact at the end of the title row. Everything about the group lives in its one title row: LED (switchable groups) · title · count · actions · chevron. Props:
  - `title` (required), `heading` (`'caps'` a small sans heading in capitals, default · `'text'` a larger sans title), `icon` (a small mark before the title), `description` (a quiet line at the top of the body: what the group does);
  - `variant` (`'plain'` default · `'card'`: the group sits on a soft tonal surface, to set one group apart in a long panel), `columns` (2 or 3: the rows become cells of a grid, e.g. X · Y · Z);
  - `modified` with `onReset`: a reset button appears in the title row while something in the group differs from its default;
  - `storageKey`: remembers open or closed across visits (localStorage; read after mount, so server HTML matches), and makes the group foldable;
  - `id`: needed inside an accordion SectionGroup;
  - `labelWidth`: one label column for every Field inside the group;
  - `count`: quiet info right after the title — a number (it rolls when it changes) or a short note such as `"1 changed · 3"` (wrap a word in `<b>` to lift it). It dims with the group when off;
  - `actions`: slim things that belong to the group, such as a status `Badge` or an `IconButton`; they are trimmed to the row's height;
  - `enabled` / `defaultEnabled` / `onEnabledChange`: the group's on/off, shown by an LED before the title (lit when on; dark with a ghosted title when off). **One click** on the title row folds the group; **double-click** (or **Shift+Enter**) switches it on or off. Off folds it closed and makes it inert; values are kept, and on restores the fold it had. A switchable group always shows its chevron. On switchable groups a single click waits ~220ms to tell it from a double-click;
  - `collapsible`, `open` / `defaultOpen` (true) / `onOpenChange`: the title row and chevron open and close the group without switching it off. A switchable group is always foldable and always shows its chevron.
- **Field** — a label and its control. Props: `label` (required), `layout` (`'inline'` default: the label in a column beside the control, for inspectors · `'stacked'`: the label above it, for forms), `variant` (`'row'` default · `'hero'`: the panel's one big statement · `'quote'`: someone's words in the serif's italic), `labelWidth` (inline; default 108px via `--ar-field-label-w`), `hint` (a quiet line under the control), `error` (what is wrong, in words: replaces the hint in the fault colour and rings the control), `required` (marks the label), `children`. The Field hands its id, message and state to the control inside (`useField()`), so a TextField inside is labelled, described by the message and marked invalid without wiring; read `useField()` in your own controls to do the same. Text as the child (`<Field label="Feels">calm</Field>`) is a readout: it is set at 14px in the panel's brightest ink, while the label is the same size and quieter, so in a long panel labels name and values speak. A Section's title is the largest text in the body and stands apart over a hairline, so each group reads as its own block.

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

- **Knob**: a rotary control. A tick arc and a signal arc circle a round well, the insert is the cap and a lit seam is its pointer. Drag vertically (Shift is fine), use the wheel or the arrows, and double-click to reset. Props: `label` (required), `value` / `onChange` / `onCommit`, `min` / `max` (0 / 1), `step` (0.01), `defaultValue` (the double-click target), `size` (px, default 40), `showLabel` (default true).
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

## ItemList · ItemRow

A list of things: layers, bodies, presets, files. Rows stand in an `ItemList` (`role="list"`, `label`) 2px apart with no dividers.

**Drag to reorder and to move.** `ItemList onReorder={(from, to) => …}` lets rows be dragged into a new order (Alt+↑/↓ moves the focused row). Lists that share a `group` trade rows: give each an `id` and handle `onMove(from, to)`, where each is `{ list, index }`; `moveBetween(lists, from, to)` does the array work for a record of lists. The dragged row lifts and follows the pointer; a lit line shows where it lands; the click that ends a drag never selects. Tools at the end of a row and form controls never start a drag.

**ItemRow** props: `title` (the name, in the sans), `meta` (a quiet second line; truncates), `swatch` (a colour drawn as a round swatch) or `leading` (any icon or thumbnail), `trailing` (tools at the end: a `Badge`, `Switch variant="compact"`, `IconButton`, `Menu`; clicks there never select the row), `selected` (the active wash), `onSelect` (makes the row a button), `disabled` (the name side goes quiet; the trailing tools stay live).

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
- `binding`: names the driver, in small marks in the bind colour;
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
- **Tooltip** takes `content`, `children` (one focusable element), `side` (`'top' | 'bottom' | 'left' | 'right'`) and `delay` (450ms). It shows on hover and on keyboard focus. `shortcut` (e.g. `['mod', 'D']`) shows the action's key caps after the hint.
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
- `palette`: the search entry plus the ⌘/Ctrl K palette; default true. The tabs give way to it (they scroll) so it never leaves the strip, which always stays one row; in a strip 520px wide or less search folds to a magnifier;
- `toolbar`: the right end of every strip;
- `brand`: a corner chip;
- `hideKey`: e.g. `'h'` hides the docks;
- `viewProps`: engine tuning such as padding, gap and snapping;
- `onReady(api)`;
- `className`, `style`.

Inside a panel:
- `useDock()` returns the `DockApi`: `{ workspace, openPanel(id), resetLayout(), openPalette(), visible, setVisible, addPanel(panel, place?), removePanel(id) }`. `addPanel` adds a floating panel while the workspace runs, at `place.at` (its top-left on screen) or at the float bounds, `place.width` / `place.height` optional; `removePanel` takes it away again. Panels whose id starts with `TEAR_PREFIX` (`'ar-tear:'`) are left out of the saved layout, so a reload starts without them.
- `<PanelBar>` holds a panel's toolbar. It rises into the dock's tab strip when there is room, and otherwise stays at the top of the panel.
- The panel body exposes `data-layout="portrait | landscape"` and `--ar-dock-panel-h` for responsive content.
- A panel that throws shows a Retry card instead of taking the dock down.

**Sections across panes.** `createDockSections({ panes, render, title?, group? })`, called once outside your components, keeps where every section is. Put its `<Pane id="…" />` in a panel's content; `panes` says which section ids start in which pane, and `render(id)` draws a section (a `<Section>`).
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

Optional scope wrapper — sets `data-ar-theme`, `data-ar-density`, `data-ar-material`, `data-ar-type`, `data-ar-accent`, `data-ar-scene` and inline tokens on one element. Props: `theme` (a built-in id **or any custom theme name** you have CSS for; default `studio`), `density`, `material`, `type` (a type collection, see `TYPE_COLLECTIONS`; inherits when omitted), `accent` (one of `ACCENTS`: teal · azure · violet · rose · coral · amber · lime · mono; replaces the theme's signal, so live edges, LEDs, focus and selection take it; each accent has a dark and a light value, picked by the theme), `scene` (`'light' | 'dark'`: what the glass sits over; a wash of the theme's own ground goes under every glass surface so its ink keeps contrast over a scene of the other kind, e.g. frost-deep over a light room; omit over a scene the theme was drawn for), `tokens` (overrides: `{ signal: '#ff4fa3' }` or full `--ar-*` names), `ground` (paint the theme's background and text colour — use for solid themes / full-page scopes), `as` (default `div`), plus any HTML attributes. Scopes nest. Without React: `<div data-ar-theme="frost-deep">`.

`themeStyle(tokens)` returns the same inline style object without the wrapper.

## Motion

Every component moves with the same few durations and curves, all of them tokens (see the theming guide), and nothing loops unless it means something live.
- **Numbers roll** (RollingValue) wherever they change.
- **One fixed scale.** A role is one size everywhere, in any panel, at any width, open or folded: 11px for a group's name, 12px for labels, values and notes, 13px for a section title, 14px for a panel title, 28px for the one big statement. Titles use the title face at the type set's title weight; a group's name is small capitals in the accent; a label differs from its value by weight and ink. Each role is a whole font in `--ar-type-*` and an ink in `--ar-tone-*`, drawn from the collection's faces and the theme's ink, so they hold on any theme with any type. For your own text, write `font: var(--ar-type-note); color: var(--ar-tone-note)` rather than a size and a colour. Small text on a pane is never light: inside a Panel, Dock or Dialog `--ar-weight-light` is regular.
- **The serif speaks once.** Wrap one word of a title in `<em>` (`Talk with <em>it</em>`) and it takes Instrument Serif italic; in a `Text` title, `hero` or `statement` it also takes the accent. Give a panel one focal point with `<Field variant="hero">`, where an `<em>` word also takes the accent, and set someone's words with `<Field variant="quote">`. Use them sparingly.
- **Hairlines do the structure, not boxes.** A section stands apart over a firm hairline, and the rows of a list sit on fine ones so the columns stay aligned. A Field holding only text sits on its baseline at text height. In a Section with `columns`, each Field is a tile with its label above its value; give a long one `style={{ gridColumn: '1 / -1' }}`.
- **Focus is lift, never a line.** A recessed surface takes light: a field's well, a slider's track, an off chip, a row. A polished part rises off its ground: a segmented thumb, a slider's fill, an on chip, a primary button. Light rises from the foot of a tab. Nothing is drawn around a control, so a scrolling strip or a panel never clips it. For your own parts, use `background: var(--ar-focus-lift)` on a recessed one and `filter: var(--ar-focus-raise)` on a polished one. `box-shadow: var(--ar-focus-ring)` is the same light where only a shadow will do, and it must stand alone: `--ar-well` and `--ar-insert-shadow` can be `none`, which makes a shadow list that includes them invalid.
- **Live levels glide.** A Meter and a Progress fill ride a critically damped spring toward each new reading every frame (no re-renders): their speed never jumps, so a value updated a few times a second reads as one fluid motion; a Meter's peak holds, then falls smoothly. A live Sparkline scrolls at a steady speed: it plays back a moment behind the newest sample, interpolating between arrival times on a spring, so uneven or bunched updates never stall or jump it; a fitted range eases to new extremes and the head rides the line. A running Progress carries a soft travelling sheen.
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
