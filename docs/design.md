# The ARTINOS design system

The rules of the ARTINOS look, for anyone (or any agent) building a screen with a kit. Read this before the first panel. `catalogue.md` says which component to pick for a parameter, `components.md` gives every prop, `theming.md` every token. This guide says what a finished screen looks like, and the methods that get it there.

The package already draws all of it. Your job is to pick the right component, the right type role and the right type system, and to add no type, colour or spacing of your own.

## The idea

ARTINOS is a precision instrument on glass: control panels, inspectors, studio tools and the pages around them. Four principles make it read:

1. **A name is quiet, its answer is loud.** In every row the label is small, medium-weight and grey; the value beside it is a size larger, semibold and in the full ink. The eye lands on the number, then finds its name.
2. **Every level is told two ways at once.** Two neighbouring lines always differ in at least two of size, weight, ink and face. If two neighbours look alike, one of them is in the wrong role.
3. **Space and hairlines group things, not boxes.** Rows sit close, sections stand well apart over a line, and a heading sits nearer to what it heads than to what came before.
4. **One scale, one method, twelve systems.** Sizes never change. A type system changes the faces, weights and tracking, so a screen keeps its proportions whichever system it uses.

## The type systems

Pick one per product with `<ArtinosTheme type="…">`. Each is a complete design for one use, not just a font. Four are **one family**, told apart by size, weight and ink; three are **hairline and heavy**, thin control text in a bright ink under heavy titles, so the levels part by weight at a glance; five are **pairings**, a display face for titles over a text face for every control and paragraph, so the headlines carry character while the controls stay calm.

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

How the pairings are built, so a screen keeps them right:
- **The display face is only for titles** (panel names, page and section titles, headlines) and, in serif pairings, the opening line. Labels, values, buttons, menus and paragraphs are always the text face.
- **Contrast in one quality, harmony in the rest.** Each pair differs in one clear way (width, serif, construction) and shares x-height, colour and rhythm, so the two faces read as one voice.
- **Serif titles stay out of small places.** In `salon` and `editorial` a section's name in a panel stays in the sans; the serif takes the panel's name a step larger.

### Each system's look

A system is more than its fonts: it sets how weight, colour, rules and marks separate the levels, and every Panel, Section and StatStrip draws it. The result is nine looks, not nine fonts.

| system | headlines | panel name | section name | groups | figures (StatStrip) |
|---|---|---|---|---|---|
| `sleek` | hairline (300) | firm | bright, with a fine accent tick | accent | hairline, 24 |
| `product` | semibold | semibold, a line under the head | bright, plain | accent | semibold |
| `native` | semibold | semibold | 13, stepped back toward the label grey, like settings groups | accent | semibold |
| `legible` | bold (700) | bold | bright, a firm 2px line under it; stronger labels | accent | bold, 24 |
| `instrument` | narrow, medium | an accent bar above it | in the accent | accent | narrow display face, 24 |
| `salon` | serif | serif, fading from the ink into the accent | medium, a hairline under it | accent | italic serif, 28 |
| `wide` | extra-bold (800), wide | extra-bold, 18 | bold, a heavy accent tick | accent | wide, bold, 24 |
| `grotesk` | Space Grotesk | a line under the head | in the accent | in the mono | display face, 24 |
| `editorial` | serif | serif, 18 | bright, a hairline under it | accent | serif, 28 |
| `fine` | extra-bold (800), tight | extra-bold | extra-bold | accent | hairline (200), 28 |
| `mass` | black (900), expanded | black, a line under the head | extra-bold, expanded | accent | hairline (200), 28 |
| `round` | rounded wide, 600 | rounded wide, 15 | 13, in the accent | accent | rounded, light, 24 |

Every treatment is a token, so a system (or your own `tokens={{ … }}`) can switch it: `--ar-panel-mark` (`block` for the bar above a panel's name), `--ar-panel-rule` (a line under the head), `--ar-panel-title-accent` (0–100%), `--ar-title-gradient` with `--ar-title-fill` (the fade into the accent, on panel names and page titles), `--ar-section-tick` and `--ar-section-tick-w`, `--ar-section-rule`, `--ar-section-accent` and `--ar-section-quiet` (0–100%), `--ar-group-accent`, and `--ar-stat-font`, `--ar-stat-weight`, `--ar-stat-size`, `--ar-stat-style`, `--ar-stat-accent`. They hold only keywords, lengths and percentages, so a nested theme keeps its own inks.

Choose by use, not by taste. `fine` is the default: a control panel, instrument or pro tool needs nothing else. Otherwise a tool is `sleek`, `product` or `instrument`; hardware `mass` or, friendlier, `round`; a technical product `grotesk`; hardware or a strong brand `wide`; a premium product page `salon`; long text around the controls `editorial`; a native desktop feel `native`; public or assistive use `legible`. One system per screen. Earlier type ids still work and map to the nearest system.

## The scale

One ladder for every size on every screen: **12 · 13 · 14 · 16 · 18 · 20 · 24 · 28 · 36 · 48**. Nothing lands between steps.

### A page

| role | size / line | weight | ink | use |
|---|---|---|---|---|
| `hero` | 48 / 52 | display | full | the page's one big line |
| `display` | 36 / 40 | display | full | a chapter or page headline |
| `title` | 24 / 30 | 600 | full | a section of a page |
| `heading` | 18 / 24 | 600 | full | a group inside a section |
| `subheading` | 14 / 20 | 600 | full | a step under a heading: told by weight, not size |
| `lead` | 16 / 26 | 400 | full | the one sentence that says what a section is for |
| `body` | 14 / 22 | 400 | 88% | paragraphs, at most 64 characters wide |
| `note` | 13 / 20 | 400 | 66% | help and asides |
| `caption` | 12 / 16 | 500 | 54% | a line under the thing it describes |
| `meta` · `eyebrow` | 12 / 16 | 500 | accent or 66% | numbers, dates, paths, the label above a title; the mono in `sleek` |

### A panel

One fixed ladder in every Panel, Dock pane and Dialog, at any width and density.

| level | set as | ink | drawn by |
|---|---|---|---|
| panel name | 16 / 600, title face | full | `Panel title` |
| what the panel is | 12 / 400 | 66% | `Panel subtitle` |
| section name | 14 / 600 | full | `Section title` |
| group inside a section | 12 / 600 | the accent | a nested `Section`, or `Text variant="overline"` |
| the answer | 13 / 600, tabular digits | full | every readout, `NumberField`, `Select`, a `Field`'s plain value |
| the name | 12 / 500, +0.01em | 76% | every `label` prop |
| help and facts | 12 / 400 | 66%, hints 54% | `description`, `hint`, `count`, `Text variant="note"` |

Twelve is the floor for every word in a panel. Quieter text is told by ink and weight, never by shrinking. Dense means tighter rows, not smaller words.

## The methods

These are what make the type read as designed rather than default. The package applies all of them; keep them when you compose.

- **Solid inks.** Every quiet step is the theme's ink mixed toward a neutral mid grey with a breath of its accent (`--ar-ink-mid`), never made see-through. A see-through letter takes the colour of whatever is behind it and goes muddy; a solid one is one clean grey. The percentages above are strengths of that mix.
- **Tracking by size.** Small words open a hair (+0.01em at 12px), body is set as drawn, titles close in as they grow (−0.022em at 14–24, −0.04em at 36–48). Large type set loose looks amateur; small type set tight looks cramped.
- **Leading falls as size rises.** Body 1.6, lead 1.6, titles 1.25, headlines 1.08–1.1. Long lines of small text need air; big lines need to hold together.
- **Thin is never faint.** A hairline system sets its control text at 300 but in a brighter ink (labels 90%) and opens it a little more (+0.025em), so a fine stroke stays readable on glass; contrast then comes from the heavy titles above it.
- **Weight carries the hierarchy, not size alone.** Names 500, answers and titles 600, prose 400. Two sizes apart is not enough on glass; a weight step with it is.
- **Figures.** Tabular in values, stats and tables, so columns line up; proportional in prose. Right-align a column of numbers. A unit is smaller and quieter than its figure, never typed into the label.
- **Colour separates, it does not decorate.** The accent marks a group's name, a unit beside its figure, the eyebrow that labels a block, and whatever the system's look gives it (a tick, a bar, a section name, a fading title). Everything else is the ink. One accent per screen.
- **Separation has five tools, used together:** size, weight (hairline to extra-bold), ink (full to 54%), colour (the accent) and rules (ticks, bars, hairlines). A system picks its combination; neighbouring levels always differ in at least two.
- **One mark face.** Section numbers, eyebrows, meta lines, keys in a key table and code take `--ar-font-mark` (the mono in `sleek`). It tells a reader "this is a label or a fact" before they read it.

## Paragraphs and sections

The pattern every section of a page follows, in this order:

1. **Eyebrow** (`Text variant="eyebrow"` or `meta`): the section's number or kind, 12 in the mark face and the accent.
2. **Title** (`title`, 24 / 600): the section's name.
3. **Lead** (`lead`, 16 full ink): one sentence that says what the section is for. Never two leads; never a lead without a title.
4. **Body** (`body`, 14 on 22 at 88%): the explanation. When a block explains several parts, open each paragraph with the part's name in `strong`: bright and semibold, so the eye finds each part by name.
5. **Facts** as a key table (`dl`, key in the mark face, meaning in `note`) or a list (`Text as="ul"`), never as a sentence of commas.
6. **Help** that must not be missed in a `Callout`, after the text it qualifies.

Spacing does the grouping: about 48px and a hairline between sections, 16px between the parts of a section's head, 12px between paragraphs. `Text` roles placed one after another already do this; do not add margins.

- Lines stay short: `body` and `lead` stop at 64 characters on their own; never stretch a paragraph across a wide card.
- Emphasis is rare: one `strong` per paragraph, one `mark` or `accent` per view.
- Sentence case everywhere. No full stop after a label, a title or a button.

## Layout

Every interface is three levels, built from the inside out: **parts** in a **section**, sections in a **panel**. Nothing else frames anything.

| level | is | drawn by | owns |
|---|---|---|---|
| **Panel** | a named frame that holds sections | `Panel` on a page; a `DockPanel` in a `Dock` | icon, title, subtitle, actions or a `PanelBar`, tabs, a footer, one label column; in a workspace, its **capabilities** |
| **Section** | one group: a set of settings, a category, a fold | `Section`, `SectionGroup`, `createDockSections`, `createParamPanes` | heading, count, reset, on/off, fold, columns |
| **Part** | everything inside a section | `Field`, `PropertyRow`, every control, `StatStrip`, `Meter`, `ItemList` / `ItemRow`, `Text`, `Callout` | one value, one readout, one list or one note |

### Panel

- **A panel is one thing wherever it sits.** On a page it is a `Panel`; in a workspace it is a `DockPanel`, a MetaBlock the engine places. Same header, same footer, same sections inside.
- **The workspace is not a level.** A `Dock` is only the place where panels are arranged around a canvas, and it remembers the arrangement (`storageKey`). It draws nothing of its own.
- **Capabilities say how a panel may move:** `closable`, `movable`, `resizable`, `floatable`, `dockable`, `splittable`, `tabbable`, `maximizable`, `pinable`, `autoHideable`, all on by default. Set one `false` on the `DockPanel` and every drag, menu and window button follows it: `capabilities: { closable: false, floatable: false }` keeps a panel docked and open.
- **Every move is a MetaBlock call.** `api.workspace` (from `onReady` or `useDock()`) is the engine: `floatBlock`, `dockBlock`, `maximizeBlock`, `returnBlock`, `undo`, `redo`, `serialize`. A drag calls the same methods.
- Open a panel with what matters: `title`, `subtitle`, a live `Badge`, then a `StatStrip` of the two to four figures people look for first.
- One label column per panel: `labelWidth` on the `Panel` (or a `Section`), never per `Field`.
- A tool around a canvas is a `Dock` with the canvas as `viewport`. Never position floating panels by hand.

### Section

- **A section is the one way to group.** A group of settings, a category and a fold are all a `Section`. Categories where one is open at a time are a `SectionGroup accordion`, not tabs of their own making.
- A section holds one idea and about seven parts. Its title stands alone, with no icon; let `count` carry one small fact; add `enabled` when the whole group can be off, `modified` and `onReset` when it can be put back.
- **Sections move between panels.** `createDockSections` keeps one set of sections; put `<sections.Pane id="…" />` in any `Panel` or `DockPanel` and a section drags between all of them by its heading. In a workspace it also tears off into its own panel. `createParamPanes` builds the same panes from a schema of parameters.
- Never skip a level: a control straight in a panel has no group to fold, reset or move.

### Parts

- **Rows** name a value: `Field` puts a label beside one or more controls (with none, its value is the answer); `PropertyRow` adds the changed dot that becomes its reset, and a binding.
- **Controls** set one value each, in the kind the parameter takes (see `catalogue.md`).
- **Readouts** show what is: `StatStrip` first, then `Meter`, `Sparkline`, `Stat`.
- **Lists** are `ItemList` / `ItemRow`, never a column of buttons.
- **Text** explains: `Text variant="overline"` names a sub-group, `note` helps, a `Callout` must not be missed.
- Related numbers sit side by side (`Section columns={3}`, `RangeSlider`, `XYPad`). One `primary` action per view, last in its row, after a `ghost` Cancel.

### Spacing

- Every gap comes from the space scale (2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32). Use `Stack` and `Inline` with `gap="row"`, `"group"` or a step. No hand-set margins or pixel gaps.
- Parts in a section are 8 apart; sections in a panel 26 apart. A section gap is always more than twice a part gap.
- **A section carries its own hairline, through its title row:** the name, a line to the count, the chevron. No line is drawn between sections, and none under a card or a group inside a section. (The salon, editorial and legible type systems set the name on a line of its own instead.)
- A page section is two columns: the words on the left (about 340px), the thing they describe on the right. The words stay in view beside a tall demo.

## Colour and glass

- Pick the theme; do not build one from colours in the app. Over a canvas, photo or video use a glass or frost theme and say what is behind it: `scene="light"` or `"dark"`.
- Never add a tint, wash or darker floor to a panel to help its text. Legibility is solved in the text: role, weight and ink.
- One accent (`accent=` or `tokens={{ signal }}`). It marks live edges, focus, selection and state. Amber warns, rose faults, azure means bound.

## Never

- `font-size`, `font-weight`, `font-family`, `letter-spacing`, `line-height` or a text `color` in app CSS for anything inside a theme scope. For a part of your own, take a whole role: `font: var(--ar-type-label); color: var(--ar-tone-label);` (also `-value`, `-section`, `-group`, `-panel`, `-note`).
- A second type system on the same screen, a font that is not in the chosen system, or a display face on labels, values or paragraphs.
- `text-transform: uppercase`, tracked capitals, or a monospace font on labels and numbers.
- A label typed with its unit ("Gain (dB)"). Use `format` / `unit`.
- A title made from a bold `body`, or a hint made from a faded `label`. Use the role that exists.
- Every number as a plain slider. Pick the kind from `catalogue.md`.
- Edits inside the kit folder. Change tokens (`tokens={{ … }}` or `--ar-*` in your CSS); a re-export overwrites kit files.

## A page section built to the rules

```tsx
<ArtinosTheme theme="frost-deep" type="sleek">
  <Stack gap="group">
    <Text variant="eyebrow">02 · Camera</Text>
    <Text variant="title" as="h2">Lens and exposure</Text>
    <Text variant="lead">Set how the camera frames the scene and how bright the frame is.</Text>
    <Text>
      <strong>Focal length</strong> narrows or widens the view; long lenses flatten depth.
    </Text>
    <Text>
      <strong>Exposure</strong> is in stops: each step doubles or halves the light.
    </Text>
  </Stack>
</ArtinosTheme>
```

## A panel built to the rules

```tsx
<ArtinosTheme theme="frost-deep" scene="dark">
  <Panel
    icon={<CameraIcon />}
    title="Camera"
    subtitle="Orbit · 35 mm"
    actions={<Badge tone="live" dot>Live</Badge>}
    labelWidth={96}
  >
    <StatStrip items={[{ label: 'Focal', value: 35, unit: 'mm' }, { label: 'Aperture', value: 'f/2.8' }]} />
    <Section title="Lens" count="2">
      <Slider label="Focal length" variant="ruler" min={12} max={200} unit="mm" value={focal} onChange={setFocal} />
      <Slider label="Aperture" mapping="log" min={1.4} max={22} decimals={1} value={ap} onChange={setAp} />
    </Section>
    <Section title="Exposure" enabled={exposureOn} onEnabledChange={setExposureOn}>
      <Slider label="Compensation" bipolar detents={[0]} min={-3} max={3} unit="EV" value={ev} onChange={setEv} />
      <Field label="White balance">
        <Slider aria-label="White balance" variant="gradient" gradient="temperature" min={2000} max={10000} unit="K" value={wb} onChange={setWb} />
      </Field>
    </Section>
  </Panel>
</ArtinosTheme>
```

Nothing in either sets a size, a weight, a colour or a margin, and both have clear levels.

## Before you call it done

Take a screenshot and look at it from arm's length.

- Can you tell a section's eyebrow, title, lead and body apart without reading them? A panel name, a section name, a value and a label?
- Does every value stand out from its label, and every section from the one above?
- Is there one type system, one accent, one primary action, one label column per group?
- Is any text set by hand, in capitals, in a mono outside marks and code, or under 12px? Remove it.
- Is any paragraph wider than a comfortable line, or any number missing its unit?
