# ARTINOS UI — the catalogue

What every component can be. The API guide (`components.md`) lists props; this guide lists **kinds**: the faces a slider can wear, the shapes a switch comes in, the states a row can show, and which to reach for. Read it before building a panel, so a project uses the whole range instead of counting everything as "a slider".

Contents:
- [Choosing by parameter](#choosing-by-parameter): the lookup table
- [Sliders](#sliders): one capsule, six faces · RangeSlider · Knob · XYPad · the shared capabilities
- [Controls](#controls): NumberField · TextField · Switch · Checkbox · ToggleGroup · ChipGroup · Segmented · Select · ColorField · FileDrop
- [Actions](#actions): Button · IconButton · Toolbar · Kbd · Badge · Tag
- [Display](#display): RollingValue · Stat · Meter · Spectrum · Progress · Sparkline
- [Layout](#layout): Panel · Section · Field · Tabs · PropertyRow · ItemList / ItemRow
- [Overlays](#overlays): Menu · ContextMenu · Dialog · Toast · Tooltip · CommandPalette
- [Workspace](#workspace): Dock · MetaBlock · NodeGraph · LiveGraphView · GraphGPU
- [Scopes](#scopes): theme · density · material
- [Layout and text](#layout-and-text): spacing · type roles · alignment · grouping
- [Checklist](#checklist-for-a-finished-panel)

## Choosing by parameter

Start from what the value *is*, not from the widget you remember. Every row below is a different face with its own drawing and its own gestures.

| the value is… | use | with | why |
|---|---|---|---|
| a continuous amount (roughness, mix, opacity) | `Slider` | `format="percent"` when it reads as a percentage | the material capsule: fill, seam, readout |
| a signed amount around a neutral point (pan, bias, offset, EV) | `Slider` | `bipolar` or `origin`, `detents={[0]}` | the fill grows from the neutral point, so the sign is visible |
| a count or a level with a few allowed values (samples, taps, quality 1–5) | `Slider variant="stepped"` | `steps`, `decimals={0}` | cells show every allowed value; the value is quantised, not just drawn |
| a loudness | `Slider` | `format="db"`, `detents={[0]}` | reads −∞ at the floor, 0 dB magnetic |
| a frequency, a duration, an exposure, anything spanning decades | `Slider` | `mapping="log"` (or `"exp"`), `format="hz"` / `"time"` | geometry follows perception; the value stays exact |
| an angle | `Slider` | `format="angle"`; `variant="ruler"` for yaw / rotation | ° readout; the ruler scrolls like a compass |
| a colour-scale parameter (white balance, hue, saturation, exposure) | `Slider variant="gradient"` | `gradient="temperature" \| "hue" \| "saturate" \| "exposure"` or your own stops | the track *is* the scale; a swatch names the colour while dragging |
| a camera-style setting (focal length, focus distance, tempo, rotation) | `Slider variant="ruler"` | `span`, `marks`, `snapStep`, `unit` | an engraved scale moves under a fixed index: a focus ring, not a progress bar |
| a response or easing you want to see | `Slider variant="curve"` | `curve="sigmoid" \| "smooth" \| "gamma" \| fn` | the drawing shows what the value samples |
| a position in a signal (scrub, playhead) | `Slider variant="wave"` | `samples`, `format="time"` | the waveform sits under the playhead |
| an interval (band, clip range, frame range) | `RangeSlider` | `minSpan` | two seams in one capsule; the whole span can be dragged |
| a dial-like amount in a tight spot (mix, send, angle on a pad) | `Knob` | `defaultValue` for double-click reset | vertical drag, no horizontal room needed |
| two values that belong together (pan/tilt, x/y offset) | `XYPad` | `xRange`, `yRange` | one puck sets both |
| an exact number you type as often as you drag (width, seed, count) | `NumberField` | `unit`, `decimals`, `format` | a scrubbable cell that opens for typing |
| text (a name, a filter) | `TextField` | `type="search"` for filtering | a line cut into the well |
| on / off | `Switch` | `variant="compact"` inside a `Field` | shutter or knob |
| several independent flags (passes, layers, A/B/C) | `ToggleGroup` | `led`, icon options | LED chips in one well |
| tags, moods, categories, filters — more than fit one well | `ChipGroup` | `multiple={false}`, `count` | outlined pills that wrap; on is the insert |
| a list of things to pick from or manage (layers, bodies, presets, files) | `ItemList` + `ItemRow` | `swatch`, `meta`, `trailing`, `selected` | a name with a line of detail and tools at the end; never a stack of buttons |
| one of a few (2–4 choices, all visible) | `Segmented` | | the insert travels to the choice |
| one of many (5+), or choices with icons and descriptions | `Select` | `appearance="well"` in forms | a frosted list that never clips |
| a colour | `ColorField` | `alpha` | the colour is the insert; hex and opacity are scrubbable |
| a file | `FileDrop` | `accept` | drop or browse |
| a value someone else drives (LFO, expression, remote) | any control inside `PropertyRow` | `binding`, `status="bound"`; or `status` on the Slider | names the driver instead of hiding the control |
| a group that can be turned off as a whole (an effect, a pass) | `Section` | `enabled` / `defaultEnabled` | the title row carries the on/off; the body folds |
| a parameter that can be turned off alone (a post effect, a modifier) | `Slider` / `RangeSlider` | `toggleable` (default) | double-click the body; the value is kept |

Read-only values go to [Display](#display): a figure that matters (with its change and trend) to `Stat`, a level to `Meter`, many levels at once (a frequency analysis) to `Spectrum`, a task under way to `Progress`, a trend to `Sparkline`, a bare number to `RollingValue`.

## Sliders

Text inside the capsule never splits: if the insert would end inside a label or readout, that text stays in one ink, the insert steps back behind it, and a small index above and below the text marks the value. This is automatic, on Slider and RangeSlider alike. A stepped slider's cells likewise step back behind its text.

One capsule, six faces. The capsule is the control, the seam is the handle, the readout is the precision zone. Every face keeps the same gestures (press, grab, scrub, type, double-click off), so a panel can mix faces without teaching a second interaction.

### The six faces (`variant`)

| face | it draws | the value behaves | use for | defining props |
|---|---|---|---|---|
| `material` (default) | the insert fills from the origin to the seam | continuous; `steps` adds hairline ticks up to 16 | most amounts | `format`, `mapping`, `detents`, `bipolar`/`origin` |
| `stepped` | cells, one per allowed value | quantised to `steps` | small counts, quality levels, LOD, taps | `steps` (default 6), `min`/`max`, `decimals={0}` |
| `gradient` | the parameter's colour scale across the track; label and value ink follow the luminance under them | continuous; a swatch below the seam names the colour while dragging | temperature, hue, saturation, exposure, any scale with colour meaning | `gradient` (preset or `{ stops, describe }`), `describe` |
| `ruler` | an engraved scale that moves beneath a fixed index | continuous; `marks` hold lightly, `snapStep` settles on release, scrubbing from the readout zooms the engraving | focal length, focus distance, tempo, yaw, anything a camera or an instrument dial would show | `span` (visible range), `marks`, `snapStep`, `unit` |
| `curve` | the response curve the value samples, with the sample point lit | continuous | easing, gamma, response, any mapping you want to see | `curve` (`'sigmoid' \| 'smooth' \| 'gamma'` or `(x) => y`) |
| `wave` | 0..1 amplitudes under a playhead | continuous | scrubbing a clip, a buffer, a timeline | `samples` (number[] 0..1), usually `format="time"` |

```tsx
<Slider label="Roughness" value={r} onChange={setR} />
<Slider variant="stepped" steps={5} label="Quality" min={1} max={5} decimals={0} defaultValue={3} />
<Slider variant="gradient" gradient="temperature" label="White Bal" min={2000} max={10000} unit="K" decimals={0} />
<Slider variant="ruler" label="Focal" min={12} max={200} span={40} unit="mm" decimals={0} marks={[24, 35, 50, 85, 135]} snapStep={1} />
<Slider variant="curve" curve="gamma" label="Gamma" />
<Slider variant="wave" samples={amplitudes} label="Scrub" format="time" min={0} max={12} />
```

**Gradient presets** (`GRADIENTS`): `temperature` (deep blue → white → red; captions COOL · NEUTRAL · WARM · HOT), `hue` (the colour wheel; caption is the hex under the seam), `saturate` (grey → vivid), `exposure` (black → white). A custom gradient is `{ stops: [[0, '#1B1F3B'], [1, '#FFB000']], describe: (t, color, value) => string }`; stops are `[position 0..1, hex]`.

**Curve presets** (`CURVES`): `sigmoid` (an S, steep in the middle), `smooth` (smoothstep), `gamma` (x^0.45). A function `(x: 0..1) => 0..1` draws anything.

### RangeSlider

The same capsule holding an interval. Props are the Slider's (format, mapping, steps, detents, layout, enable, precision) plus `minSpan`, with `value` as `[lo, hi]`.
- Press a seam to move that end; press inside the span to move the whole interval; press outside to move the nearest end.
- Each end is its own focusable slider; the readout scrubs the active end.
- Typing accepts `0.2 – 0.7`, or one number for the active end.

```tsx
<RangeSlider label="Band" value={band} onChange={setBand} minSpan={0.05} />
<RangeSlider label="Freq" format="hz" mapping="log" min={20} max={20000} defaultValue={[200, 4000]} />
<RangeSlider label="Frames" min={0} max={240} steps={241} decimals={0} defaultValue={[24, 180]} />
```

### Knob

A rotary control for when a capsule is the wrong shape: a tick arc and a signal arc circle a round well, the cap is the insert, the lit seam is the pointer. Drag vertically (Shift for fine), wheel or arrows when focused, double-click to return to `defaultValue`. `size` (default 40) and `showLabel` (label and value under it). Controlled only: `value`, `onChange`, `label` are required.

```tsx
<Knob label="Mix" value={mix} onChange={setMix} defaultValue={0.5} />
<Knob label="Angle" value={a} onChange={setA} min={0} max={360} step={1} size={56} />
```

### XYPad

Two values in one well: a quarter grid, a tick crosshair and an insert puck. Drag the puck or nudge with the arrows. `xRange` / `yRange` default `[-1, 1]`; `height` (default 110), width follows the container. Controlled only: `value: [x, y]`, `onChange`, `label`.

```tsx
<XYPad label="Pan / tilt" value={pt} onChange={setPt} xRange={[-90, 90]} yRange={[-45, 45]} height={140} />
```

### Capabilities every face shares

These apply to `Slider` and `RangeSlider` whatever the `variant`, and most to `NumberField`, `Knob` and `XYPad` too (see the matrix).

- **Formats** (`format`): `number` (default), `percent` (shows value × 100 with %), `db` (−∞ at −96 and below), `angle` (°), `hz` (compacts to kHz from 1000), `time` (default unit s; `unit` overrides). `decimals` (default 2) and `unit` (a quieter unit after the number). `formatter={(v, decimals) => string | { text, unit }}` replaces all of it.
- **Mappings** (`mapping`): `linear` (default), `log` (needs min > 0: frequencies, exposures), `exp` (durations, decays), `power`, or `{ to, from }`. Geometry only: the value stays exact and the readout shows the real number.
- **Detents** (`detents={[0]}`): semantic magnets at meaningful values (0 dB, 50 %, 1 kHz). 6 px of pull, 22 px with Ctrl; the seam lights on capture; Ctrl + arrow jumps between them.
- **Steps** (`steps`): quantise to n values on any face. The material face adds hairline ticks up to 16 steps; the stepped face draws cells.
- **Origin** (`origin`, `bipolar`): the fill grows from a chosen value instead of from `min`. `bipolar` puts the origin at 0, or at the midpoint when 0 is out of range.
- **Precision scrub**: press the readout and drag; vertical distance picks 1× (0–26 px), 0.1× (26–78 px) and 0.01× (beyond), with a local HUD. `precision={2}` keeps two levels. Alt / Shift / Ctrl are fine / ultra-fine / snap while dragging anywhere.
- **Typed entry**: double-click the value, or Enter / F2 while focused, and type in the readout's units: `0.73`, `47%`, `2.5k`, `-inf`, `90°`. Enter applies, Escape cancels.
- **Enable / off** (`toggleable`, default on): double-click the body switches the parameter off; the material drains, the value is kept and shown, and the control ignores drag, wheel and keys until switched back. `enabled` / `defaultEnabled` / `onEnabledChange` make it controlled; passing `toggleable` explicitly, or a `status`, shows the enable dot (`indicator` forces it). `toggleable={false}` opts out where an accidental double-click must never switch anything off.
- **Status** (`status`): `bound` (driven by something else), `automated`, `warn`, `fault`. A quiet tint on the seam and the dot, never a different widget.
- **Layout** (`layout="paired"`, `labelWidth` default 106): the label outside the capsule, for inspector columns that align labels. Material and gestures are unchanged.
- **Events**: `onChange` fires live on every change; `onCommit` once on release (and per key press). Do expensive work in `onCommit`. Escape during a drag cancels back to the start value.
- **Keyboard**: arrows step (`step`, default 1 % of the range), Home / End, wheel only while focused so the page keeps scrolling.

| capability | Slider | RangeSlider | NumberField | Knob | XYPad |
|---|---|---|---|---|---|
| `format` / `unit` / `formatter` | ● | ● | ● | | |
| `mapping` | ● | ● | | | |
| `detents` | ● | ● | | | |
| `steps` | ● | ● | `step` | `step` | |
| `origin` / `bipolar` | ● | | | | |
| precision scrub from the readout | ● | ● | drag the cell (Alt 0.1×, Shift 10×) | | |
| typed entry | ● | ● | ● | | |
| enable / off, `status` | ● | enable | | | |
| `layout="paired"` | ● | ● | | | |
| `onCommit` | ● | ● | ● | ● | ● |
| uncontrolled (`defaultValue`) | ● | ● | ● | reset target only | |
| `density` / `material` scope props | ● | ● | ● | | |

## Controls

The same well, insert and LED seam in every shape a parameter takes.

### NumberField

A recessed numeric cell that is also a scrubber: drag sideways to scrub (`pixelsPerStep`, default 4 px; Alt 0.1×, Shift 10×), click to type (Enter commits, Escape cancels, typing a digit starts fresh), arrows and wheel step while focused. `format`, `decimals`, `unit`, `formatter` as on the Slider; `align` `'center' | 'end'`; `disabled`. Use it where typing is as common as dragging, or in a `Field` beside a `Select` (`Width [268] [Fixed ˅]`).

### Checkbox

A choice in a form or a list: a small box in the well; checked, the insert fills it and the check draws itself in; `indeterminate` shows a dash for some-of-a-group. `label` in the sans, `description` a quieter line under it. Use a Switch for a setting that applies at once, a Checkbox for one you confirm.

### Forms

A form is Fields stacked: `<Field layout="stacked" label hint error required>` around each control. `hint` is a quiet line under the control; `error` replaces it with what is wrong, in words, in the fault colour, and rings the control. The Field labels and describes the control inside for you. Validate when the person leaves a field or submits, never while they type; end with one `primary` Button and a `ghost` Cancel.

### TextField

Text cut into the well: one line, or `multiline` (a textarea from `rows` that grows with its text). `value` / `onChange(string)` required. `invalid` rings it in the fault colour (inside a Field with an `error` it is set for you). `type="search"` adds the magnifier, a clear button and Escape-to-clear; `icon` leads; `clearable` shows the clear button for any type; `size` `'md' | 'sm'`. Every `<input>` attribute passes through and the ref reaches the input.

### Switch

| variant | it is | use when |
|---|---|---|
| `shutter` (default) | the slider insert as a two-position shutter: it travels to the active half, its LED seam lights, and the `label` (or `labelOn` / `labelOff`) sits on it | the switch stands alone in a panel and names itself |
| `compact` | a small knob with no visible text | inside a `Field` or `PropertyRow density="compact"` that already shows the label |

Click, Space or Enter. Off, the insert drains to grey.

### ToggleGroup

Independent flags sharing one well; each chip is a small insert with its own LED seam.
- `multiple` (default true): any number on. `multiple={false}` is a solo group that can also be emptied, for an optional single choice.
- `led` (default true): the LED seam on text chips. Icon options (`{ value, icon, title }`) replace text and recede into the well when off.
- `value` / `onChange` take an array.

### ChipGroup

A wrapping set of pills for choices that outgrow one well: moods, tags, categories, filters.
- Off: an outlined pill in the line ink. On: the polished insert, the same part as a pressed Segmented option.
- `multiple` (default true); `multiple={false}` picks one at a time and can be emptied, for a filter with an "any" state.
- `count` on an option draws a number in the mono after its label.

### Segmented

One of a few, all visible: the insert travels between positions and the text it arrives under switches ink. Arrow keys move it. Options can carry icons or be `disabled`. Prefer it up to four short choices; beyond that, `Select`.

### Select

One of many.
- `appearance="insert"` (default): a full-width insert with a chevron, for a prominent choice.
- `appearance="well"`: a quiet well, for forms and inspector rows beside other wells.
- Open, the frosted list unrolls out of the face and portals to `<body>`, so docks and panels never clip it. Arrows, Home / End, Enter, Escape and type-ahead. Options take `label`, `icon`, `disabled`.

### ColorField

The colour itself is the insert; hex ink follows its luminance. Click the colour for the system picker, click the code to type one.
- With `label`: label in the well, swatch and hex beside it.
- Without `label`: a full-width swatch.
- `alpha`: the value becomes `#RRGGBBAA` and a scrubbable opacity readout (drag it or use the arrows) sits over a checkerboard.

### FileDrop

A wide well with an etched, dashed rim. Hold a file over it and the rim breathes in the signal colour and the arrow lifts; drop, or click to browse. `onFiles(files)` required; `accept` (input syntax, `"image/*,.glb"`), `multiple` (default true), `title`, `hint` (mono caps), `disabled`.

### Which choice control?

| choices | all visible? | control |
|---|---|---|
| on / off, takes effect at once | yes | `Switch` |
| a choice you confirm with a button (export options, consent) | yes | `Checkbox` |
| some of a list, with select-all | yes | `Checkbox` per item, one with `indeterminate` above them |
| several flags, any number on | yes | `ToggleGroup` (up to ~5) or `ChipGroup` (more, or tags that wrap) |
| one of 2–4 | yes | `Segmented` |
| one of 2–4, or none | yes | `ToggleGroup multiple={false}` |
| one of 5+ | no (a list) | `Select` |
| one of n with icons only | yes | `ToggleGroup` or `Segmented` with icon options |

## Actions

### Button

Three weights, so a view has one clear main action.

| variant | look | use for |
|---|---|---|
| `primary` | the polished insert in its well, LED lit | the one main action in a view |
| `danger` | the insert, LED in the fault colour | destructive actions |
| `default` | a quiet raised face with a hairline | every other action |
| `ghost` | bare label ink | the quietest actions, dialog cancels, resets |

A label cut by an ellipsis shows in full as the tooltip.

`size` `'md' | 'sm'` (sm fits tight rows), `icon` leads, `trailing` is a right-aligned hint (usually `<Kbd>`), `block` stretches to the container. Every `<button>` attribute passes through.

### IconButton

Square and icon-only; bare ink that becomes an insert when pressed. `label` is required (tooltip and accessible name). `active` makes it a toggle drawn as an insert while on; `filled` draws a well behind it at rest, for use over bright scenes; `size` `'md' | 'sm'`; `labelled` puts the label beside the icon (`'active'`: only on the pressed one).

### Toolbar

Groups actions under `role="toolbar"`. `label` required; `orientation` `'horizontal' | 'vertical'`; `floating` gives it a pane of the theme's glass for use over a canvas. `<ToolbarGroup label>` sets related buttons in one shared well; `<ToolbarSeparator />` draws a hairline; `<ToolbarSpacer />` pushes the rest to the far end.

| toolbar | build it from |
|---|---|
| a tool strip (select, move, brush…) | one `ToolbarGroup` of `IconButton size="sm" labelled="active"`, one `active` |
| view toggles (grid, snap, guides) | a second `ToolbarGroup` of `IconButton active` |
| actions at the end | `ToolbarSpacer`, then `ghost` · `default` · one `primary` Button |

Never a row of equal labelled pills: group them, name only the current tool, and let one action be primary.

### Kbd

Key caps as raised keys: `keys={['mod', 'K']}`. `mod` is ⌘ on Apple platforms and Ctrl elsewhere (same for `shift` and `alt`), read after hydration so server HTML never mismatches.

### Badge

A status tag drawn as a wash and a hairline in its colour, never a solid fill. `tone` `'neutral' | 'live' | 'warm' | 'danger'`; `dot` adds a leading dot, and a `live` dot breathes.

## Display

Read-only instruments. All of them take `motion`, which says what the value is so the movement suits it: `'auto'` (default: measures the feed, exact at frame rate), `'instant'` (scrubbing, sync), `'audio'` (sound: instant rise, released fall), `'task'` (work under way), `'smooth'` (slow gauges), or `{ attack, release, refresh, roll }`.

- **RollingValue**: the odometer readout every number in the family uses. Only the digits that change roll, in the direction of the change, all starting together and landing together on one baseline; the roll is timed to the feed, and a stream too fast to land changes its digits without rolling. `text` (formatted), `unit`, `dir`, `fast`, `base` (canonical decimals; extra digits grow in and out), `motion`. **RollingText** takes any readout string: only its numbers roll, the words stay still.
- **Stat**: one figure that matters, for dashboards and status heads: label, the number large in the mono with its unit and `prefix`, `delta` with an arrow (`better` says which way is good, so it takes the signal or fault colour), a `trend` sparkline with an optional `threshold`, a `level` bar, `zones` that turn the figure as it crosses them, a `caption`. `framed` (default) is a quiet tile; `size="lg"` for the one hero number.
- **Progress**: a task under way — label, percentage, a well whose fill paces itself to how often the work reports, with a soft sheen (`sheen`) travelling along it while it runs. `variant="ring"` for a compact ring with the percentage inside; `segments` for countable work; `buffer` for what is ready ahead of it; `size`, `tone`. No `value`: indeterminate. `status="done"` settles in the signal colour; `status="error"` stops in the fault colour with the reason as `caption`. Use it for work with an end (bakes, uploads, exports); use `Meter` for a level that goes up and down.
- **Meter**: a level in a well with a signal fill and a rolling readout. `value`, or `source` read every frame for fast signals; `label` required and drawn in a label column (`hideLabel` keeps it for screen readers only); `min` / `max`; `valueText` (null hides it) or `format`; `peak` holds the true peak for a moment and lets it fall; `segments` lights cells; `zones` paint ranges along the track, or with `zonePaint="level"` turn the whole fill; `origin` fills out from a centre (pan, difference); `marker` and `ticks` give it a scale; `orientation="vertical"`; `size` `'sm' | 'md' | 'lg' | 'xl'`; `tone` `'live' | 'warm' | 'neutral' | 'hot'` cross-fades the fill.
- **Spectrum**: a bank of level bars for a frequency analysis or any many-channel signal. Hand `source` your analyser; it reads every frame without React, and gathers more bins than bars on a log `scale`, each bar showing its loudest bin. `bars`, `max` (255 for byte data), `peak` caps, `segments` for LED cells, `mirror` from a centre line, `zones`, `height`, `tone`. `motion` defaults to `'audio'`.
- **Sparkline**: a trend that draws itself in, with a soft `fill` (default on), a glowing dot on the latest sample and an optional dashed `threshold` (a frame budget). `values` oldest first; `min` / `max` fix the range, otherwise it fits the data; `width` / `height` (120 × 28), it stretches to any width; `tone`; `motion`.

```tsx
<Meter label="CPU" value={cpu} valueText={`${Math.round(cpu * 100)}%`} peak />
<Meter label="Output" source={() => level.current} motion="audio" segments={28} peak zones={[{ from: 0.7, tone: 'warm' }, { from: 0.9, tone: 'hot' }]} />
<Spectrum label="Spectrum" max={255} bars={48} peak source={() => (analyser.getByteFrequencyData(bins), bins)} />
<Sparkline label="Frame time" values={frames} threshold={16.7} min={0} max={33} width={220} height={34} />
<RollingValue text={fps.toFixed(0)} unit="fps" base={0} />
```

## Layout

### Panel

The glass card that holds controls. Slots: `title`, `subtitle`, `icon`, `actions` (header right: icon buttons, a status dot), `tabs` (between header and body, usually `<Tabs>`), `footer` (a foot status line), `children`. `as` changes the element (default `section`).

| need | use |
|---|---|
| a panel over a calm scene | `variant="glass"` (default) |
| a panel over a busy or bright scene | `variant="solid"` |
| a panel inside a panel | `variant="inset"` |
| a panel the user can tuck away | `collapsible` |
| a long panel in a fixed space | `maxHeight` (the body scrolls under soft fades) |

### SectionGroup

Sections that behave together. `accordion` keeps one open at a time (each Section needs an `id`); `toolbar` adds Expand all · Collapse all. Use an accordion for alternatives the user visits one by one (camera · light · atmosphere), a toolbar for a long panel of groups. Groups that share a `group` name trade sections by dragging their headings, across panels and Dock panes; in a Dock, `createDockSections` also lets a section tear off into its own floating panel and drop back into any pane.

### Section

A titled group: a light 22px title, the same size in any panel, over a firm hairline from the section before it. A section inside a section is a group, its name in the accent's mono capitals on a hairline of its own. Everything about the group lives in its one title row: LED · icon · title · count · reset · actions · chevron. `description` adds a quiet line of purpose under it; `variant="card"` sets the group on a soft tonal surface; `columns={3}` lays its rows side by side (X · Y · Z); `modified` + `onReset` show a reset while it differs from its defaults; `storageKey` remembers its fold.

| kind | props | behaviour |
|---|---|---|
| plain | `title` | a small heading |
| collapsible | `collapsible`, `open` / `defaultOpen` / `onOpenChange` | click the title row or chevron to fold |
| switchable | `enabled` / `defaultEnabled` / `onEnabledChange` | an LED before the title carries the on/off; one click folds, double-click or Shift+Enter switches; off folds closed and makes the body inert, values kept |

- `heading`: `'caps'` (a small sans heading in capitals, default) or `'text'` (a larger sans title; inspectors).
- `count`: quiet info right after the title: a number (it rolls) or a note such as `"1 changed · 3"` (wrap a word in `<b>` to lift it).
- `actions`: slim things that belong to the group, a `Badge` or an `IconButton`.

### Field

A label column beside one or more controls: `Width [268] [Fixed ˅]`. `label` required; `labelWidth` (default 72px, the `--ar-field-label-w` token). Put a `NumberField`, `Select appearance="well"`, `Switch variant="compact"`, `Segmented`, `ToggleGroup` or `ColorField` in it.

### Tabs

A tab strip with a travelling underline. `items`, `value` / `defaultValue` / `onChange`, `label`, `idBase` (wires `aria-controls` to your panels). Usually in a Panel's `tabs` slot.

### ItemList · ItemRow

One thing in a list: a layer, a body, a preset, a file. Use it wherever a panel lists things, instead of a column of full-width buttons.
- A `swatch` colour or a `leading` icon, the `title` in the sans, a `meta` line of detail (kind, size, state).
- `trailing` tools at the end — a `Badge`, a compact `Switch`, an `IconButton` or `Menu` — that never select the row.
- `selected`: the active wash; `onSelect` makes the row a button.
- `disabled`: the name side goes quiet and the trailing tools stay live, so a hidden layer can be shown again.
- Rows stand in an `ItemList`, 2px apart, no dividers.

### PropertyRow

The inspector row around any control. It never owns the value; it arranges the label, the control and the row's states.

| `density` | the label | use for |
|---|---|---|
| `default` | hidden; the control names itself | a Slider or RangeSlider capsule, which carries its own label |
| `compact` | in a column beside the control | NumberField, Select, Switch compact, ColorField, ToggleGroup |
| `multiline` | above the control | wide controls: XYPad, FileDrop, a curve |

States, all optional and all drawn without taking width from the control:
- `modified`: a signal dot in the left gutter; with `onReset` it becomes the reset under the pointer or keyboard focus, in the same spot.
- `binding`: names the driver (`"LFO 1"`) in small marks in the bind colour.
- `status` `'bound' | 'warn' | 'fault'` with `message` explaining it in words.
- `actions`: extra affordances at the right end on hover or focus (these do take width; prefer the Section's `actions` for group state).
- `highlighted` (a search reveal), `dataControl` (written as `data-control` for search), `disabled`.

```tsx
<Section title="Material" count={changed ? `${changed} changed · 3` : 3} enabled={on} onEnabledChange={setOn}>
  <PropertyRow label="Exposure" modified={v !== 0.62} onReset={reset}><Slider label="Exposure" value={v} onChange={setV} /></PropertyRow>
  <PropertyRow label="Gain" binding="LFO 1" status="bound"><Slider label="Gain" format="db" min={-60} max={12} status="bound" … /></PropertyRow>
  <PropertyRow label="Mode" density="compact"><Select options={['Neutral', 'Warm', 'Cool']} appearance="well" … /></PropertyRow>
</Section>
```

## Overlays

Everything that floats sits on one frosted sheet and portals to `<body>` with the theme it was opened in, so nothing clips it.

- **Menu** opens from its `trigger` (one button, wired for you) and drops from it, or rises when it opens upward. `items: MenuEntry[]`, `align` `'start' | 'end'`. An entry is an item `{ id, label, icon?, shortcut?, disabled?, danger?, checked?, onSelect }`, a `{ type: 'separator' }` or a `{ type: 'label', label }` heading. Checkable items carry the LED. Arrows, Home, End, Enter, Escape.
- **ContextMenu** wraps any content (no box of its own) and opens at the pointer on right-click. `items` is a function built when it opens, so it always reflects the current value; `disabled` lets the browser's menu through.
- **Dialog**: the native `<dialog>` shown modal, so focus trapping, Escape and the inert page come from the browser. `open`, `onClose`, `title`, `description`, `footer` (right-aligned buttons above a hairline), `width` (380), `children`.
- **Toast**: wrap the app once in `<ToastProvider placement="bottom-right">` (`'bottom-center' | 'top-right'` too), then `const notify = useToast()` and `notify({ title, description?, tone?, duration?, action? })`. `tone` `'neutral' | 'success' | 'warning' | 'error'` is one small LED; a hairline drains to show the time left and holds while hovered; `duration: 0` keeps it until dismissed; the call returns a dismiss function.
- **Tooltip**: `content`, one focusable child, `side` `'top' | 'bottom' | 'left' | 'right'`, `delay` (450 ms). Shows on hover and on keyboard focus, sliding out of the side it points away from.
- **CommandPalette**: Ctrl/⌘ K search across `commands` (`{ id, label, group?, keywords?, shortcut?, icon?, run }`), grouped and fuzzy-matched on label and keywords. `open` / `onOpenChange`, `hotkey` (default mod + K; `null` turns it off; `{ key, mod?, shift? }` changes it), `placeholder`. The Dock has one built in.

| you need | use |
|---|---|
| actions on one thing, from a button | `Menu` |
| actions on the thing under the pointer | `ContextMenu` |
| a question that must be answered, or a form | `Dialog` |
| a notice that doesn't block | `Toast` |
| the name or shortcut of a control | `Tooltip` |
| any command by name, from the keyboard | `CommandPalette` |

## Workspace

### Dock

A studio workspace in one component. Panels sit as tabs in docks on the left, right and bottom, or float; an optional `viewport` (a canvas, a video, an image) fills the space behind them.

Each panel: `{ id, title, description?, keywords?, dock?: 'left' | 'right' | 'bottom' | 'float', active?, content, footer? }`. `id` must be stable: the saved layout is keyed by it.

What a user can do without any wiring:
- drag a tab out to float it, onto an edge to dock it, onto another dock to merge, into a pane to split;
- right-click a tab for every placement (snap, dock, pin, auto-hide, attach), maximize, send home or close;
- search panels and commands with Ctrl/⌘ K (`palette`, default on; it folds to a magnifier in a narrow dock);
- hide the docks with `hideKey` (e.g. `'h'`) while the viewport stays.

Dock props: `storageKey` (saves the arrangement; restored only while every saved id still exists), `sizes` (fractions per edge; default left .22, right .24, bottom .36), `floatBounds`, `commands` (extra palette entries), `toolbar` (the right end of every strip), `brand` (a corner chip), `viewProps` (padding, gap, snapping), `onReady(api)`.

Inside a panel: `useDock()` gives `{ workspace, openPanel(id), resetLayout(), openPalette(), visible, setVisible }`; `<PanelBar>` holds the panel's toolbar and rises into the tab strip when there is room; the body exposes `data-layout="portrait | landscape"` and `--ar-dock-panel-h` for responsive content. A panel that throws shows a Retry card instead of taking the dock down. The Dock fills its parent, so give the parent a height.

### MetaBlock

The framework-free docking engine under the Dock, for when you need your own chrome: `new MetaBlockWorkspace(…)`, `<MetaBlockWorkspaceView workspace renderBlock renderGroupChrome …>`, `useWorkspaceRevision`, `defaultCapabilities`. Its `--mb-*` / `--au-*` variables bind to the theme only under `.ar-dock`, so set them on a custom host.

### NodeGraph

A node editor on a dot-grid well. A node is a small frosted sheet (the material of every list and menu) with an LED in its family's colour before the title: its fields are the family's own controls at dense density (a bounded number is a Slider capsule, an open one a NumberField cell), its ports light like LEDs when wired, wires glow in the signal colour, and its preview is a Sparkline.

- **Editing**: drag from a port to wire, click a wire to cut it; drag the canvas to select, Alt-drag or middle-drag to pan, Ctrl/⌘ + wheel to zoom; double-click or right-click the canvas for the node palette. ⌘/Ctrl + G groups, D duplicates, Z / Y undo and redo. Connections are type-checked and cycles flagged; an inspector column shows the selected node.
- **Domains** (`GraphDefinition.domain`): `signal` (values over time), `parameter` (drive parameters), `scene` (objects, transforms, materials), `render` (post effects), `gpu` (compiles to TSL).
- **Node categories and types**:
  - Source: `constant`, `signal`, `parameter`, `time`
  - Math: `add`, `subtract`, `multiply`, `divide`, `min`, `max`, `modulo`, `pow`
  - Shape: `remap`, `clamp`, `smoothstep`, `mix`, `noise`, `oscillator`, `smooth`
  - Logic: `condition`
  - Output: `write-parameter`, `write-signal`
  - Scene (scene domain): `scene-object`, `transform`, `visible`, `material-parameter`
  - Render (render domain): `effect-enabled`, `effect-order`, `effect-parameter`
  - GPU (gpu domain): `uv`, `uniform`, `output`
- **Props**: `value` / `onChange` (required), `readouts` (each node's last output, for the header readout and plots), `frames` (GPU thumbnails), `sources` (what the pickers offer), `runtimeDiagnostics`, `onDiagnostics`.
- **Model helpers** (exported): `NODE_SCHEMAS`, `createNode(type, x, y, data)`, `validateGraph`, `topologicalOrder`, `connectionError`, `evaluate(graph, context)` against any `GraphHost`, `useGraphEditor` (undo history and editing operations).

### LiveGraphView

A read-only, column-laid view of a running graph with live controls, for a monitor or a debugger. `graph: LiveGraph` (nodes with `kind` `'signal' | 'binding' | 'graph' | 'parameter' | 'object' | 'pass' | 'effect' | 'output'`, a column and a position, `controls` of kind `number`, `boolean` or `readout`, and a `preview` of `'value' | 'render' | 'none'`), `previews`, `onInspect`, `onControl` (required), `insetRight`.

### GraphGPU

`compileGPU(graph, host)` turns a `gpu` graph into three.js TSL nodes; `refreshUniforms` updates the uniforms each frame. It needs `three` with `three/tsl`, so it is not in the index or in `--components all`: include it with `--components GraphGPU` and import it by path.

## Scopes

Four axes, set on `<ArtinosTheme>` or as `data-ar-*` attributes, and nestable:
- **theme**: the whole look (108; see `theming.md`). Glass and frost themes need something behind them; `studio` / `studio-light` paint their own ground.
- **type**: the type collection, a font pairing with its own tuning (`sleek` by default, `sleek-air`, `sleek-serif`, `sleek-sharp`, `sleek-compact`, `instrument`, `editorial`, `book`, `couture`, `contrast`, `newsroom`, `soft`, `round`, `wide`, `swiss`, `bold`, `character`, `industrial`, `terminal`, `quiet`, `clean`, `legible`). It inherits through nested themes and follows portalled overlays.
- **density**: `dense` (24px controls; docks and strips), `standard` (26px; default), `comfort` (30px; touch and presentation). Also a prop on the original controls.
- **material** (advanced): force one control finish (`optical`, `frost`, `milk`, `clear`, `tint`, `smoked`, `metal`, `soft`, `reference`) on a scope or a control.

## Layout and text

A panel looks designed when every gap comes from one scale, every piece of text plays one role, and things that belong together line up. These are the rules the family is built on; follow them in your own composition too.

### Spacing: one scale, three roles

Every gap and padding comes from the space scale: `--ar-space-1` … `--ar-space-9` (2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 px). The components use three roles, which density tunes together:

| role | token | standard · dense · comfort | between |
|---|---|---|---|
| row | `--ar-row-gap` | 8 · 6 · 10 px | rows inside a group |
| group | `--ar-group-gap` | 16 · 12 · 20 px | groups inside a panel |
| panel | `--ar-panel-pad-x` / `-y` | 20/16 · 12/12 · 24/20 px | the panel's edge and its content |

- Compose with `Stack` (a column) and `Inline` (a row): `gap="row"`, `gap="group"` or a step `gap={4}`. Never hand-set margins or pixel gaps.
- Sections placed one after another in a Panel are already a group gap apart; rows inside them a row gap. Don't add spacers.
- Set density once, on the theme scope or the panel (`density="dense"`), never per control.

### Text: one role per kind of text

Use `Text` with a `variant`; never set a font size, weight or colour by hand.

| variant | for | looks |
|---|---|---|
| `hero` | the page's one big line | the title face, 48 px (24 in a panel), very tight |
| `display` | one headline per page | the title face, 28 px (20 in a panel), tight |
| `title` | a page title (a Panel's `title` is its own, 17 px) | the title face, 16 px, bright (14 in a panel) |
| `heading` | a group's name inside prose | the title face, 18 px, bright (16 in a panel) |
| `subheading` | a step under a heading | the title face, 13 px, bright |
| `statement` | a sentence that carries a page | the opening-sentence face, 20 px (16 in a panel), bright |
| `overline` | a category above a title, or the name of a set of controls | small tracked capitals in the accent |
| `kicker` | a small label above a title | small and quiet; capitals only where a collection asks |
| `eyebrow` | a live or current label above a title | the mono, 11 px, in the accent, after a lit dot |
| `lead` | the sentence that says what a view is for | the opening-sentence face, 14 px, bright |
| `body` | a paragraph | the reading face, 13 px (12 in a panel), 1.55 leading, at most `--ar-measure` (64ch) wide |
| `note` | help or an aside | 12 px, a step quieter than the body |
| `caption` | a line under the thing it describes | 11 px medium, the quietest ink |
| `label` | a name beside a value outside a Field | 12 px medium, quiet |
| `value` | a figure in a row | the mono, tabular |
| `figure` | the one number that matters | 28 px medium (24 in a panel); a `<small>` inside is its unit |
| `numeral` | a big number that marks a step or a chapter | large, in the accent, 28 px (20 in a panel) |
| `meta` | a small fact: a date, a path, a count | the mono, 11 px, quiet |
| `tag` | a status or a kind | the mono, 11 px, in a pill washed in the accent |
| `quote` | a principle or a quoted line | the opening-sentence face, italic, 16 px (14 in a panel), between two hairlines; a `<cite>` inside is its source |
| `code` | a token, key or file name | the mono, in a chip |

Any role takes an `accent`, one at a time and on the one thing that should be noticed:

| accent | what it does | use it for |
|---|---|---|
| `ink` | sets the words in the accent | a current or active title |
| `underline` | a firm accent line under the words | a term being defined |
| `marker` | a highlighter stroke behind the words | the one phrase that matters |
| `rule` | an accent line at the start | a pulled-out note or section |
| `bar` | a short accent bar above | opening a block or a stat |
| `gradient` | a fade from the ink into the accent | one large headline |
| `outline` | hollow letters drawn in the accent | a large word or number, a heading's size and up |

`dropcap` sets a paragraph's first letter three lines tall. An `<em>` in a `hero`, `display`, `title`, `heading` or `statement` turns to the serif's italic in the accent.

Neighbouring roles differ in at least two ways at once — size and weight, or size and ink, or face — so the step reads at a glance.

- **One job per face.** The title face names things (titles, panel and section names); the reading face explains (prose, labels, menus); the reading serif opens and quotes (`lead`, `statement`, `quote`); the display serif sets large accent words and `numeral`; the mono measures (figures, code). Don't give a face a second job.
- **Inline emphasis inside a body:** `strong` is bold in the bright ink, `em` turns to the serif's italic, `mark` is washed in the accent for the one phrase that matters, `code` is a mono chip, `kbd` a key cap, `a` carries an accent underline. Use one or two per paragraph.
- **Lists** are `Text as="ul"` (or `"ol"`): accent bullets, a row gap between items. Use one for three or more parallel things.
- **Callout** sets apart what must not be missed: `tip` (the signal) for a shortcut or a better way, `note` for context, `warn` for a cost or a risk, `fault` for what will break. At most one or two in a view, after the text they qualify.
- At most three sizes in one panel: its title, its labels and rows, its captions. Figures are the mono at the control size.
- `tone` changes ink only for meaning: `low` / `faint` for quieter, `signal` / `warn` / `fault` for state. Never colour text for decoration.
- Paragraphs stay narrow (`measure`, on by default), wrap evenly (`text-wrap: pretty`), and are start-aligned. Centre text only in an empty state.
- A caption goes under what it describes, never above. A kicker goes above a title, never alone.
- Long text is cut by the kit, never by hand: `truncate` for one line, `lines={2}` to clamp, and controls show the full text as a tooltip when cut. Give full names.
- Sentence case everywhere ("Env intensity", "Export kit"); capitals only for small headings (section headings, kickers). No full stop after a label or a button.
- Numbers carry their unit through `format` / `unit`, never typed into the label ("Gain −4.5 dB", not "Gain (dB)").

### Alignment

- One label column per group: put `labelWidth` on the Panel or Section (e.g. `labelWidth={96}`), not on each Field, so every label starts and every control starts on the same line.
- A Field's label sits level with its control's first line, even beside a multiline field or a pad.
- Figures are right-aligned and tabular, so digits line up down a column; readouts already are.
- In a row, the name leads and the tools trail: title · details · then badge, switch, menu at the end (`ItemRow`, `Section actions`).
- In a form or dialog, actions sit at the end of the last line: `ghost` Cancel, then the one `primary`.
- Use `Inline align="baseline"` when text of different sizes shares a row, so the letters stand on one line.

### Grouping

- A Section holds one idea and about seven rows at most; split a longer one.
- Related numbers sit side by side: `Section columns={3}` for X · Y · Z, a `RangeSlider` for an interval, an `XYPad` for a pair.
- Every part of a panel reads as a part. Sections directly in a Panel or dock pane sit on their own cards, so give each an `icon` and let `count` carry a small fact. `variant="plain"` is for a section that flows on from the one above.
- Open with what matters: `icon`, a bold `title` and a live `Badge` in `actions` say what this is; a `StatStrip` gives the two to four figures someone looks for first.
- In a row, the label is quiet and the value firm. A small fact beside a value is a `Tag`, not more words: `Friend` `visit 8`, not "friend, visit 8".
- Name a set of controls inside a section with `Text variant="overline"`. Help that must be remembered goes in a `Callout`, with `<kbd>` for gestures and keys, not in a caption.
- Alternatives the user visits one at a time go in a `SectionGroup accordion`; a long panel of groups gets `SectionGroup toolbar`.
- A list of things is an `ItemList` of `ItemRow`s, never a column of full-width buttons. Let people reorder what has an order (`onReorder`), and let lists or panes that hold the same kind of thing trade it (`group` + `onMove`): layers between scenes, sections between dock panes.
- One `primary` action per view.

## Checklist for a finished panel

- Every number has a `format` or a `unit`; nothing is formatted by hand.
- Frequencies, durations and exposures use `mapping="log"` or `"exp"`.
- Signed values are `bipolar` (or have an `origin`) and a `detents={[0]}`.
- Meaningful values (0 dB, 50 %, 1 kHz, the default) are `detents`.
- Small counts and levels are `variant="stepped"` with `decimals={0}`.
- Colour-scale parameters are `variant="gradient"`; camera-style settings are `variant="ruler"`.
- Intervals are a `RangeSlider`, not two sliders.
- Exact numbers people type live in a `NumberField`; two coupled values in an `XYPad`.
- Choices use the right one of `Switch`, `ToggleGroup`, `Segmented`, `Select`.
- Expensive work runs in `onCommit`, not `onChange`.
- Groups that can be switched off are a `Section` with `enabled`; parameters that can be switched off alone keep `toggleable`.
- Rows that can change show `modified` + `onReset`; driven values show `binding` / `status`.
- The panel is a `Panel` (or a Dock panel) so the gutter marks and the glass are there.
- Every gap comes from the space scale (`Stack` / `Inline`, the roles); no hand-set margins.
- Every piece of text is a `Text` role or a component's own; at most three sizes in the panel's rows.
- Each section has an icon; the figures that matter most are in a `StatStrip`; small facts are `Tag`s.
- Labels in a group share one column (`labelWidth` on the Panel or Section).
- Sentence case; capitals only for small headings; no full stops on labels.
- Look at it: take a screenshot and check the rules above before calling it done.
