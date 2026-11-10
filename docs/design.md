# The ARTINOS design system

The rules of the ARTINOS look, for anyone (or any agent) building a screen with a kit. Read this before the first panel. `catalogue.md` says which component to pick for a parameter, `components.md` gives every prop, `theming.md` every token. This guide says what a finished screen looks like, and the methods that get it there.

The package already draws all of it. Your job is to pick the right component, the right type role and the right type system, and to add no type, colour or spacing of your own.

## The idea

ARTINOS is a precision instrument on glass: control panels, inspectors, studio tools and the pages around them. Four principles make it read:

1. **A name is quiet, its answer is loud.** In every row the label is small, medium-weight and grey; the value beside it is a size larger, semibold and in the full ink. The eye lands on the number, then finds its name.
2. **Every level is told two ways at once.** Two neighbouring lines always differ in at least two of size, weight, ink and face. If two neighbours look alike, one of them is in the wrong role.
3. **Space and hairlines group things, not boxes.** Rows sit close, sections stand well apart over a line, and a heading sits nearer to what it heads than to what came before.
4. **One scale, one method, five systems.** Sizes never change. A type system changes the faces, weights and tracking, so a screen keeps its proportions whichever system it uses.

## The five type systems

Pick one per product with `<ArtinosTheme type="…">`. Each is a complete design for one use, not just a font.

| system | faces | for | how it reads |
|---|---|---|---|
| `sleek` (default) | Geist · Geist Mono | control panels, tools, dashboards | one family from label to headline; section numbers, meta lines and eyebrows in the mono. Precise and quiet. |
| `product` | Inter Display · Inter · JetBrains Mono | product apps, inspectors | Inter's display cut for titles, its text cut for every control. Neutral and refined. |
| `editorial` | Newsreader · Inter · JetBrains Mono | docs, onboarding, pages around panels | serif titles and opening lines over Inter paragraphs and controls. Section names in panels stay in the sans. |
| `native` | the system face · the system mono | desktop-like apps | SF Pro on Apple, Segoe UI Variable on Windows. Nothing to load. |
| `legible` | Atkinson Hyperlegible Next · Mono | accessibility, kiosks, long reading | letters drawn so similar shapes are hard to confuse, bolder titles, open line spacing. |

Choose by use, not by taste: a tool is `sleek` or `product`; anything with long text around the controls is `editorial`; a desktop app that must feel native is `native`; public or assistive use is `legible`. Do not mix systems on one screen. Earlier type ids still work and map to the nearest system.

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
| `note` | 13 / 20 | 400 | 58% | help and asides |
| `caption` | 12 / 16 | 500 | 44% | a line under the thing it describes |
| `meta` · `eyebrow` | 12 / 16 | 500 | accent or 58% | numbers, dates, paths, the label above a title; the mono in `sleek` |

### A panel

One fixed ladder in every Panel, Dock pane and Dialog, at any width and density.

| level | set as | ink | drawn by |
|---|---|---|---|
| panel name | 16 / 600, title face | full | `Panel title` |
| what the panel is | 12 / 400 | 58% | `Panel subtitle` |
| section name | 14 / 600 | full | `Section title` |
| group inside a section | 12 / 600 | the accent | a nested `Section`, or `Text variant="overline"` |
| the answer | 13 / 600, tabular digits | full | every readout, `NumberField`, `Select`, a `Field`'s plain value |
| the name | 12 / 500, +0.01em | 62% | every `label` prop |
| help and facts | 12 / 400 | 58%, hints 44% | `description`, `hint`, `count`, `Text variant="note"` |

Twelve is the floor for every word in a panel. Quieter text is told by ink and weight, never by shrinking. Dense means tighter rows, not smaller words.

## The methods

These are what make the type read as designed rather than default. The package applies all of them; keep them when you compose.

- **Solid inks.** Every quiet step is the theme's ink mixed toward a neutral mid grey with a breath of its accent (`--ar-ink-mid`), never made see-through. A see-through letter takes the colour of whatever is behind it and goes muddy; a solid one is one clean grey. The percentages above are strengths of that mix.
- **Tracking by size.** Small words open a hair (+0.01em at 12px), body is set as drawn, titles close in as they grow (−0.022em at 14–24, −0.04em at 36–48). Large type set loose looks amateur; small type set tight looks cramped.
- **Leading falls as size rises.** Body 1.6, lead 1.6, titles 1.25, headlines 1.08–1.1. Long lines of small text need air; big lines need to hold together.
- **Weight carries the hierarchy, not size alone.** Names 500, answers and titles 600, prose 400. Two sizes apart is not enough on glass; a weight step with it is.
- **Figures.** Tabular in values, stats and tables, so columns line up; proportional in prose. Right-align a column of numbers. A unit is smaller and quieter than its figure, never typed into the label.
- **Colour has two jobs in type:** a group's name inside a section, and the meta line or eyebrow that labels a block. Everything else is the ink. Panel and section names, key terms and values stay bright; the accent never decorates.
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

- Every gap comes from the space scale (2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32). Use `Stack` and `Inline` with `gap="row"`, `"group"` or a step. No hand-set margins or pixel gaps.
- Rows in a group are 8 apart; sections in a panel 18 above and below a hairline. A section gap is always more than twice a row gap.
- A page section is two columns: the words on the left (about 340px), the thing they describe on the right. The words stay in view beside a tall demo.
- One label column per group: `labelWidth` on the `Panel` or `Section`, never per `Field`.
- A `Section` holds one idea and about seven rows. Give it an `icon`; let `count` carry one small fact; add `enabled` when the whole group can be off.
- Open a panel with what matters: `title`, `subtitle`, a live `Badge`, then a `StatStrip` of the two to four figures people look for first.
- Related numbers sit side by side (`Section columns={3}`, `RangeSlider`, `XYPad`). A list of things is `ItemList` / `ItemRow`, never a column of buttons.
- One `primary` action per view, last in its row, after a `ghost` Cancel.
- A tool around a canvas is a `Dock` with the canvas as `viewport`. Never position floating panels by hand.

## Colour and glass

- Pick the theme; do not build one from colours in the app. Over a canvas, photo or video use a glass or frost theme and say what is behind it: `scene="light"` or `"dark"`.
- Never add a tint, wash or darker floor to a panel to help its text. Legibility is solved in the text: role, weight and ink.
- One accent (`accent=` or `tokens={{ signal }}`). It marks live edges, focus, selection and state. Amber warns, rose faults, azure means bound.

## Never

- `font-size`, `font-weight`, `font-family`, `letter-spacing`, `line-height` or a text `color` in app CSS for anything inside a theme scope. For a part of your own, take a whole role: `font: var(--ar-type-label); color: var(--ar-tone-label);` (also `-value`, `-section`, `-group`, `-panel`, `-note`).
- A second type system on the same screen, or a font that is not in the chosen system.
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
    <Section title="Lens" icon={<LensIcon />} count="2">
      <Slider label="Focal length" variant="ruler" min={12} max={200} unit="mm" value={focal} onChange={setFocal} />
      <Slider label="Aperture" mapping="log" min={1.4} max={22} decimals={1} value={ap} onChange={setAp} />
    </Section>
    <Section title="Exposure" icon={<SunIcon />} enabled={exposureOn} onEnabledChange={setExposureOn}>
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
