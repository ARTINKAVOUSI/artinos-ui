/* 01 · Foundations — the themes, the five materials every part is made of, the tokens and the
   two voices of text, density, and the motion tokens. */
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Badge, Button, ChipGroup, DENSITIES, Field, Inline, NumberField, Panel, Section, Segmented, Slider, Stack, Switch, Text, TextField, THEMES, TYPE_COLLECTIONS } from '../../../src';
import { TokenTable, TypeCard } from '../app/foundations';
import { ThemeTile, themeFamilies } from '../themes/ThemesPage';
import { Chapter, Spec } from '../shared';

/* ---------- the theme gallery, on the bare backdrop ---------- */

/** Cuts a window in the sheet's glass where `ref` sits, kept in step as the page reflows, so
 *  the theme cards there blur the backdrop itself and show each theme's glass as it really is. */
function useOpenWindow(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    const sheet = el?.closest<HTMLElement>('.sc-sheet');
    if (!el || !sheet) return;
    const PAD = 12;
    const place = () => {
      const s = sheet.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      sheet.style.setProperty('--sc-window-x', `${r.left - s.left - PAD}px`);
      sheet.style.setProperty('--sc-window-y', `${r.top - s.top - PAD}px`);
      sheet.style.setProperty('--sc-window-w', `${r.width + PAD * 2}px`);
      sheet.style.setProperty('--sc-window-h', `${r.height + PAD * 2}px`);
    };
    place();
    sheet.setAttribute('data-window', '');
    const ro = new ResizeObserver(place);
    ro.observe(sheet);
    ro.observe(el);
    return () => {
      ro.disconnect();
      sheet.removeAttribute('data-window');
    };
  }, [ref]);
}

function ThemeGallery({ theme, onPickTheme }: { theme: string; onPickTheme: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useOpenWindow(ref);
  const families = themeFamilies();
  const [family, setFamily] = useState(families[0].name);
  const shown = families.find((f) => f.name === family) ?? families[0];
  return (
    <div ref={ref} className="sc-window">
      <div className="sc-themes-inline__bar">
        <ChipGroup label="Family" multiple={false} options={families.map((f) => ({ value: f.name, label: f.name }))} value={[family]} onChange={(v) => v[0] && setFamily(v[0])} />
        <Button size="sm" variant="primary" onClick={() => (location.hash = '#themes')}>
          Open the theme gallery
        </Button>
      </div>
      <p className="sc-themes-inline__about">{shown.about}</p>
      <div className="sc-tiles">
        {shown.themes.map((t) => (
          <ThemeTile key={t} t={t} active={t === theme} onPick={() => onPickTheme(t)} />
        ))}
      </div>
    </div>
  );
}

/* ---------- layout & text ---------- */

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function LayoutAndText() {
  const [format, setFormat] = useState('glTF');
  return (
    <div className="sc-grid" style={{ alignItems: 'start' }}>
      <Stack gap="group">
        <Stack gap={2}>
          <Text variant="kicker">Type roles</Text>
          <Text variant="title">One role per kind of text</Text>
          <Text variant="caption">Seven roles, three sizes in any one panel.</Text>
        </Stack>
        <Stack gap={3}>
          <Text variant="display">60.0</Text>
          <Text variant="heading">Heading inside prose</Text>
          <Text>
            Body text is the sans at 13 px with an open leading. A paragraph keeps to about sixty characters a line and wraps evenly, so it reads as a block rather than a ragged edge.
          </Text>
          <Inline align="baseline" gap={3}>
            <Text variant="value">16.4 ms</Text>
            <Text variant="caption">frame time, a caption under or beside the figure it explains</Text>
          </Inline>
          <Inline gap={3} wrap>
            <Text variant="caption" tone="signal">signal</Text>
            <Text variant="caption" tone="warn">warn</Text>
            <Text variant="caption" tone="fault">fault</Text>
            <Text variant="caption" tone="faint">faint</Text>
          </Inline>
        </Stack>
        <Stack gap={3}>
          <Text variant="kicker">Space scale</Text>
          <Inline align="end" gap={3}>
            {STEPS.map((n) => (
              <Stack key={n} gap={2} align="center">
                <span className="sc-space" style={{ width: `var(--ar-space-${n})`, height: `var(--ar-space-${n})` }} />
                <Text variant="caption" tone="faint">
                  {n}
                </Text>
              </Stack>
            ))}
          </Inline>
        </Stack>
      </Stack>

      <Panel title="Export" subtitle="Built from the primitives only" labelWidth={84}>
        <Text>Every gap here comes from the scale and every label shares one column, so the panel lines up without a single hand-set margin.</Text>
        <Section title="Output" count={3}>
          <Field label="Name">
            <TextField value="orb-studio" onChange={() => {}} />
          </Field>
          <Field label="Format">
            <Segmented options={['glTF', 'USDZ', 'OBJ']} value={format} onChange={setFormat} />
          </Field>
          <Field label="Scale">
            <NumberField defaultValue={1} decimals={2} unit="×" aria-label="Scale" />
          </Field>
        </Section>
        <Section title="Size" count={2} columns={2}>
          <NumberField label="W" defaultValue={2048} decimals={0} unit="px" />
          <NumberField label="H" defaultValue={1365} decimals={0} unit="px" />
        </Section>
        <Inline justify="end" gap={3} style={{ marginTop: 'var(--ar-space-4)' }}>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Export</Button>
        </Inline>
      </Panel>
    </div>
  );
}

/* ---------- materials ---------- */

const MATERIALS: Array<{ id: string; name: string; role: string }> = [
  { id: 'panel', name: 'Panel glass', role: 'Holds things: panels, dock panes, a floating toolbar.' },
  { id: 'sheet', name: 'Frosted sheet', role: 'Floats: lists, menus, dialogs, toasts, tooltips, nodes.' },
  { id: 'well', name: 'Well', role: 'Where a value is edited: fields, troughs, key caps, canvases.' },
  { id: 'insert', name: 'Insert', role: 'The polished part you press or drag: buttons, fills, caps.' },
  { id: 'led', name: 'Seam & LED', role: 'Marks what is live: the handle, a lit state, a wired port.' },
];

function MaterialSpecimen({ id }: { id: string }) {
  const [text, setText] = useState('Orb');
  if (id === 'panel')
    return (
      <div className="sc-mat sc-mat--panel">
        <b>Inspector</b>
        <span>Panel glass over the scene</span>
      </div>
    );
  if (id === 'sheet')
    return (
      <div className="sc-mat sc-mat--sheet" aria-hidden>
        <span>Duplicate</span>
        <span data-active="">Hide</span>
        <span>Delete</span>
      </div>
    );
  if (id === 'well')
    return (
      <div className="sc-stack">
        <TextField size="sm" label="Name" value={text} onChange={setText} />
        <NumberField label="X" defaultValue={1.25} decimals={2} step={0.01} />
      </div>
    );
  if (id === 'insert')
    return (
      <div className="sc-stack">
        <Button size="sm" variant="primary">
          Render
        </Button>
        <Switch label="On" defaultValue />
      </div>
    );
  return (
    <div className="sc-stack">
      <Slider label="Gain" defaultValue={0.62} />
      <div className="sc-row" style={{ gap: 10, alignItems: 'center' }}>
        <i className="ar-led" data-on="" />
        <i className="ar-led" />
        <i className="ar-dot" data-on="" />
        <Badge tone="live" dot>
          Live
        </Badge>
      </div>
    </div>
  );
}

function Materials() {
  return (
    <div className="sc-materials">
      {MATERIALS.map((m, i) => (
        <figure key={m.id} className="sc-material">
          <figcaption>
            <span className="sc-num">{String(i + 1).padStart(2, '0')}</span>
            <b className="sc-title">{m.name}</b>
            <span className="sc-material__role">{m.role}</span>
          </figcaption>
          <MaterialSpecimen id={m.id} />
        </figure>
      ))}
    </div>
  );
}

/* ---------- type ---------- */

function TypeScale() {
  const steps: Array<[string, string]> = [
    ['xl', 'Panel titles'],
    ['lg', 'Sheet titles, the palette query'],
    ['md', 'Body: field labels, messages'],
    ['sm', 'Secondary lines, tabs'],
    ['xs', 'Hints, captions, port names'],
  ];
  return (
    <div className="sc-voices">
      <div className="sc-voice">
        <span className="sc-subhead">Body text · UI 300</span>
        {steps.map(([k, use]) => (
          <div key={k} className="sc-voice__row">
            <span style={{ font: `var(--ar-weight-light) var(--ar-text-${k}) var(--ar-font-ui)`, color: 'var(--ar-text-hi)' }}>{use}</span>
            <code>--ar-text-{k}</code>
          </div>
        ))}
      </div>
      <div className="sc-voice">
        <span className="sc-subhead">Control text · mono</span>
        <div className="sc-voice__row">
          <span className="ar-text" style={{ color: 'var(--ar-text-hi)' }}>
            Label caps
          </span>
          <code>--ar-label-*</code>
        </div>
        <div className="sc-voice__row">
          <span className="ar-value" style={{ color: 'var(--ar-text-hi)' }}>
            0.5200
          </span>
          <code>--ar-value-*</code>
        </div>
        <div className="sc-voice__row">
          <span style={{ font: 'var(--ar-weight-thin) var(--ar-text-3xl) / var(--ar-leading-none) var(--ar-font-ui)', letterSpacing: 'var(--ar-track-display)', color: 'var(--ar-text-hi)' }}>Display</span>
          <code>200 · page titles</code>
        </div>
      </div>
    </div>
  );
}

/* ---------- motion ---------- */

const DURATIONS: Array<[string, string]> = [
  ['value', 'a value following the hand'],
  ['state', 'hover and press'],
  ['exit', 'leaving, always quicker'],
  ['enter', 'an overlay arriving'],
  ['surface', 'a material changing'],
  ['layout', 'things moving apart'],
];
const CURVES: Array<[string, string]> = [
  ['ease', 'general'],
  ['ease-roll', 'settling: rolls, glides, sheets'],
  ['ease-spring', 'a small overshoot: pops, knobs, pucks'],
  ['ease-exit', 'departures'],
];

const bezier = (css: string) => {
  const m = css.match(/cubic-bezier\(([^)]+)\)/);
  if (!m) return null;
  const [x1, y1, x2, y2] = m[1].split(',').map(Number);
  // a 64 × 40 box; y grows upward, so an overshoot rises above the frame
  return `M0,40 C${x1 * 64},${40 - y1 * 40} ${x2 * 64},${40 - y2 * 40} 64,0`;
};

function MotionTokens() {
  const ref = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const cs = getComputedStyle(ref.current);
    const read = (name: string) => cs.getPropertyValue(name).trim();
    setValues(Object.fromEntries([...DURATIONS.map(([k]) => [k, read(`--ar-dur-${k}`)]), ...CURVES.map(([k]) => [k, read(`--ar-${k}`)])]));
  }, []);
  const longest = Math.max(1, ...DURATIONS.map(([k]) => parseFloat(values[k] ?? '0')));
  return (
    <div ref={ref} className="sc-motion">
      <div className="sc-motion__durations">
        <div className="sc-row" style={{ alignItems: 'center', gap: 12 }}>
          <span className="sc-subhead">Durations</span>
          <Button size="sm" variant="ghost" onClick={() => setRun((n) => n + 1)}>
            Play
          </Button>
        </div>
        {DURATIONS.map(([k, use]) => {
          const ms = parseFloat(values[k] ?? '0');
          return (
            <div key={k} className="sc-motion__row">
              <code>--ar-dur-{k}</code>
              <span className="sc-motion__track">
                <i key={run} style={{ width: `${(ms / longest) * 100}%`, animationDuration: `${ms}ms`, animationTimingFunction: 'var(--ar-ease-roll)' }} />
              </span>
              <span className="sc-motion__ms">{values[k] || '—'}</span>
              <span className="sc-motion__use">{use}</span>
            </div>
          );
        })}
      </div>
      <div className="sc-motion__curves">
        <span className="sc-subhead">Curves</span>
        <div className="sc-motion__grid">
          {CURVES.map(([k, use]) => {
            const d = values[k] ? bezier(values[k]) : null;
            return (
              <figure key={k} className="sc-curve">
                <svg viewBox="-4 -14 72 58" aria-hidden>
                  <path className="sc-curve__frame" d="M0,40 H64 M0,0 H64" />
                  {d ? <path key={run} className="sc-curve__line" d={d} pathLength={1} /> : null}
                </svg>
                <figcaption>
                  <code>--ar-{k}</code>
                  <span>{use}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function FoundationsChapter({ theme, onPickTheme, type, onPickType }: { theme: string; onPickTheme: (t: string) => void; type: string; onPickType: (t: string) => void }) {
  return (
    <Chapter id="foundations">
      <Spec
        id="themes"
        text={`A theme is the whole look: ground, ink, signal, panel glass and a control finish tuned for it. You pick one — nothing else. Solid themes paint their own ground; glass themes are panes over whatever is behind them (try the backdrops in the bar). There are ${THEMES.length}, in families. Pick a family and click a tile to apply it; each tile is its own data-ar-theme scope, so themes nest. The theme gallery shows every theme on the bare backdrop, with a stage that dresses a small working setup in the one you pick.`}
        code={`
import { ArtinosTheme } from './artinos-ui';

<ArtinosTheme theme="frost-deep">
  <Slider label="Roughness" defaultValue={0.52} />
</ArtinosTheme>

// or with no React at all:
<div data-ar-theme="studio-light"> … </div>`}
      >
        <ThemeGallery theme={theme} onPickTheme={onPickTheme} />
      </Spec>

      <Spec
        id="materials"
        text="Every part of every component is made of five materials, and each one has a single job. Learn these and the whole package reads at a glance: what holds, what floats, where you edit, what you press, and what is live."
      >
        <Materials />
      </Spec>

      <Spec
        id="tokens"
        text="Components read tokens, never literal colours. These are the live values of the current theme. Text comes in two voices: light body text on a five-step scale, and mono control text for labels, rows, buttons and values."
        code={`
/* three layers */
--ar-ink-*, --ar-teal-*            primitives   tokens.css
--ar-bg-well, --ar-text-hi, …      roles        tokens.css + themes.css
--ar-insert, --ar-seam, …          control      materials.css (each theme's finish)

/* body text scale */
--ar-text-xs · sm · md · lg · xl   10.5 · 11.5 · 12 · 14 · 17px`}
      >
        <TokenTable deps={[theme]} />
        <TypeScale />
      </Spec>

      <Spec
        id="type"
        text={`Type is one superfamily in two voices, a sans that speaks and a mono that measures, tuned so a title, a label and a readout sit on one line without a seam. A collection swaps the faces and re-tunes the tracking; the sizes, weights and leading stay, so every component keeps its proportions. Some add a display face for the biggest titles. There are ${TYPE_COLLECTIONS.length}; Instrument is the default. Click one to set it for the page. Each card is its own data-ar-type scope, so collections nest like themes and carry through portalled overlays.`}
        code={`
<ArtinosTheme theme="frost-deep" type="editorial"> … </ArtinosTheme>

// or on any element, inside any theme:
<div data-ar-type="luxe"> … </div>

// a kit carries the collections it was exported with:
node artinos.mjs export --project . --themes onyx --components all --type luxe,editorial`}
      >
        <div className="sc-grid sc-grid--cards sc-grid--type">
          {TYPE_COLLECTIONS.map((t) => (
            <TypeCard key={t} t={t} active={t === type} onPick={() => onPickType(t)} />
          ))}
        </div>
      </Spec>

      <Spec id="density" text="Three control heights: dense 24 · standard 26 · comfort 30. Type size, padding and radius follow. Set it per control or on any scope." code={`<Slider density="dense" />   <div data-ar-density="comfort"> … </div>`}>
        <div className="sc-grid">
          {DENSITIES.map((d) => (
            <Slider key={d} density={d} label={d} defaultValue={0.34 + DENSITIES.indexOf(d) * 0.16} />
          ))}
        </div>
        <div className="sc-grid">
          {DENSITIES.map((d) => (
            <Segmented key={d} density={d} options={['Low', 'Med', 'High']} defaultValue="MED" label={d} />
          ))}
        </div>
      </Spec>

      <Spec
        id="layout"
        text="The rules a panel is composed by. One space scale (2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 px) and three roles density tunes: rows in a group, groups in a panel, the panel's padding. Text plays one of seven roles, at most three sizes in a panel, paragraphs kept to a comfortable measure. Stack and Inline space things only by the scale; labelWidth on a Panel or Section gives every Field one label column. The catalogue's Layout and text chapter has every rule."
        code={`<Panel title="Export" labelWidth={84}>
  <Text>Every gap comes from the scale…</Text>
  <Section title="Output">
    <Field label="Name"><TextField … /></Field>
    <Field label="Format"><Segmented … /></Field>
  </Section>
  <Section title="Size" columns={2}> <NumberField label="W" … /> <NumberField label="H" … /> </Section>
  <Inline justify="end" gap={3}> <Button variant="ghost">Cancel</Button> <Button variant="primary">Export</Button> </Inline>
</Panel>

<Stack gap={2}>
  <Text variant="kicker">Type roles</Text>
  <Text variant="title">One role per kind of text</Text>
  <Text variant="caption">Seven roles, three sizes in any one panel.</Text>
</Stack>`}
      >
        <LayoutAndText />
      </Spec>

      <Spec
        id="motion"
        text="Every motion in the package uses these durations and curves, and nothing else. Arrivals ease out; departures are quicker and ease in. Numbers roll, highlights glide, presses spring. prefers-reduced-motion sets every duration to zero. Press Play to see the durations side by side."
        code={`transition: transform var(--ar-dur-surface) var(--ar-ease-spring);
animation: ar-rise-in var(--ar-dur-enter) var(--ar-ease-roll);`}
      >
        <MotionTokens />
      </Spec>
    </Chapter>
  );
}
