/* 01 · Foundations — the themes, the five materials every part is made of, the tokens and the
   type system, density, and the motion tokens. */
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { TextFace, TextVariant, TypeCollection } from '../../../src';
import { Badge, Button, Callout, ChipGroup, DENSITIES, Field, Inline, NumberField, Panel, Section, Segmented, Slider, Stack, Switch, Text, TextField, THEMES, TYPE_COLLECTIONS } from '../../../src';
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

/* ---------- typography ---------- */

type Role = [TextVariant, string, string, TextFace?];
/** Every text role with its rule beside it: the ladder a page is set by. */
const ROLES: Role[] = [
  ['display', 'display · title face · 28 light', 'Light, held'],
  ['title', 'title · title face · 20 semibold', 'Material and light'],
  ['title', 'title · face="serif"', 'An editorial title', 'serif'],
  ['heading', 'heading · title face · 16 semibold', 'Surface response'],
  ['subheading', 'subheading · title face · 14 semibold', 'Roughness and gloss'],
  ['overline', 'overline · 12 semibold · accent', 'Material · glass'],
  ['lead', 'lead · 16 regular · full ink', 'A lead says what the view is for, a size up from the body.'],
  ['body', 'body · 14 on 22 · 88% ink', 'Body text carries the explanation at a comfortable line length.'],
  ['note', 'note · 13 · 68% ink', 'A note is help or an aside, two steps quieter than the body.'],
  ['caption', 'caption · 12 medium · 58% ink', 'Fig. 3, the rim at grazing angles'],
  ['label', 'label · 12 regular · 70% ink', 'Exposure'],
  ['value', 'value · 13 firm · full ink · tabular', '0.71 · 1,284 · −4.5 dB'],
  ['figure', 'figure · 28 medium · tight', '1,284'],
];

function Typography() {
  return (
    <div className="sc-typo">
      <article className="sc-typo__page">
        <Text variant="overline">Material · thick glass</Text>
        <Text variant="display" as="p">How the shell catches light</Text>
        <Text variant="lead">It bends what is behind it and keeps a bright rim where light grazes its edge.</Text>
        <Text>
          Raise <strong>Transmission</strong> to let more of the scene through; lower <em>roughness</em> for a sharper image. The rim follows <code>rimPower</code>, and{' '}
          <mark>a value past 0.8 starts to glow</mark>. Hold <kbd>Alt</kbd> while dragging for fine steps, or read <a href="#s-typography">the material guide</a>.
        </Text>
        <Text variant="heading">What changes it</Text>
        <Text as="ol">
          <li>Transmission, how much of the scene shows through</li>
          <li>Roughness, how soft the refraction is</li>
          <li>Rim, how bright the edge glows</li>
        </Text>
        <Text variant="quote">
          Glass reads as glass when its edge is brighter than its face.
          <cite>Shading notes, chapter 4</cite>
        </Text>
      </article>
      <Panel className="sc-typo__panel">
        <Stack gap={0}>
          <Text variant="overline">Inside a panel</Text>
          <Text variant="title">The same roles, a size down</Text>
          <Text variant="note">In a Panel, Dock pane or Dialog the scale steps down, so nothing outgrows its frame.</Text>
        </Stack>
        <div className="sc-typo__figures">
          <div>
            <Text variant="figure">
              1.52<small>IOR</small>
            </Text>
            <Text variant="caption">Index</Text>
          </div>
          <div>
            <Text variant="figure">
              4.0<small>mm</small>
            </Text>
            <Text variant="caption">Thickness</Text>
          </div>
        </div>
        <Stack gap={0}>
          <Callout tone="tip" title="Start from a preset">
            Pick <strong>Thick glass</strong> in Templates, then tune only Roughness.
          </Callout>
          <Callout tone="warn">High transmission with heavy blur costs frame time on integrated GPUs.</Callout>
        </Stack>
        <Section title="Readout">
          <Field label="Dispersion">0.014</Field>
          <Field label="Rim">0.71</Field>
        </Section>
      </Panel>
      <div className="sc-typo__ladder">
        {ROLES.map(([variant, rule, sample, face], i) => (
          <div key={i} className="sc-typo__row">
            <span className="sc-typo__rule">{rule}</span>
            <Text variant={variant} face={face} measure={false} as="div">
              {sample}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- type collections, by feel ---------- */

const TYPE_GROUPS: [string, TypeCollection[]][] = [
  ['Sleek, the default and its variants', ['sleek', 'sleek-air', 'sleek-serif', 'sleek-sharp', 'sleek-compact']],
  ['Elegant, with serif titles', ['editorial', 'book', 'couture', 'contrast', 'newsroom', 'soft']],
  ['Modern sans', ['instrument', 'round', 'wide', 'swiss', 'bold', 'character']],
  ['Technical and quiet', ['industrial', 'terminal', 'quiet', 'clean']],
  ['Reading first', ['legible']],
];

/* ---------- type styles ---------- */

const RAMP = [11, 12, 13, 14, 16, 18, 20, 24, 28, 48];
const METHODS = ['ink', 'underline', 'marker', 'rule', 'bar', 'gradient', 'outline'] as const;

function TypeStyles() {
  return (
    <div className="sc-styles">
      <div>
        <span className="sc-styles__label">One size ladder: every text size on the page is one of these</span>
        <div className="sc-ramp" aria-hidden="true">
          {RAMP.map((size) => (
            <div key={size} className="sc-ramp__step">
              <b style={{ fontSize: size }}>Aa</b>
              <small>{size}</small>
            </div>
          ))}
        </div>
      </div>

      <div>
        <span className="sc-styles__label">hero · one word in the accent with em</span>
        <Text variant="hero" as="p">
          Light, <em>held</em> in glass
        </Text>
      </div>

      <div className="sc-styles__grid">
        <div className="sc-styles__cell sc-styles__cell--8">
          <span className="sc-styles__label">statement</span>
          <Text variant="statement" as="p">
            Every surface is <em>one material</em>, tuned until the edge is brighter than the face.
          </Text>
        </div>
        <div className="sc-styles__cell">
          <span className="sc-styles__label">numeral · figure · caption</span>
          <Inline gap={7} align="end">
            <Text variant="numeral" as="span">
              07
            </Text>
            <div>
              <Text variant="figure">
                1.52<small>IOR</small>
              </Text>
              <Text variant="caption">Index of refraction</Text>
            </div>
          </Inline>
        </div>
        <div className="sc-styles__cell">
          <span className="sc-styles__label">eyebrow · meta</span>
          <Stack gap={3}>
            <Text variant="eyebrow">Live preview</Text>
            <Text variant="heading" as="p">
              Surface response
            </Text>
            <Text variant="meta">materials/thick-glass · updated 4 Nov</Text>
          </Stack>
        </div>
        <div className="sc-styles__cell">
          <span className="sc-styles__label">tag</span>
          <div className="sc-styles__tags">
            <Text variant="tag">Glass</Text>
            <Text variant="tag">3 changed</Text>
            <Text variant="tag">GPU · 2 ms</Text>
          </div>
        </div>
        <div className="sc-styles__cell">
          <span className="sc-styles__label">dropcap</span>
          <Text dropcap measure={false}>
            Raise transmission to let more of the scene through, then lower the roughness for a sharper image. The rim follows the angle of the light, and it brightens as the surface turns away.
          </Text>
        </div>
      </div>

      <div>
        <span className="sc-styles__label">accent · seven methods on any role</span>
        <div className="sc-styles__methods">
          {METHODS.map((accent) => (
            <div key={accent}>
              <Text variant={accent === 'outline' ? 'hero' : 'title'} as="p" accent={accent}>
                Surface response
              </Text>
              <Text variant="meta" style={{ marginTop: 8 }}>
                accent="{accent}"
              </Text>
            </div>
          ))}
        </div>
      </div>

      <div>
        <span className="sc-styles__label">put together</span>
        <div className="sc-styles__recipes">
          <div>
            <Text variant="eyebrow">Release 2.4</Text>
            <Text variant="display" as="p">
              A sharper <em>edge</em>
            </Text>
            <Text variant="lead">The rim now follows the light, so glass reads as glass from any angle.</Text>
          </div>
          <div>
            <div className="sc-step">
              <Text variant="numeral" as="span">
                1
              </Text>
              <Text variant="subheading" as="p">
                Pick a preset
              </Text>
              <Text variant="note">Start from thick glass in Templates.</Text>
            </div>
            <div className="sc-step">
              <Text variant="numeral" as="span">
                2
              </Text>
              <Text variant="subheading" as="p">
                Tune the roughness
              </Text>
              <Text variant="note">Lower it for a sharper image.</Text>
            </div>
            <div className="sc-step">
              <Text variant="numeral" as="span">
                3
              </Text>
              <Text variant="subheading" as="p">
                Check the rim
              </Text>
              <Text variant="note">A value past 0.8 starts to glow.</Text>
            </div>
          </div>
          <Panel>
            <Stack gap={3}>
              <Inline justify="between">
                <Text variant="eyebrow">Inside a panel</Text>
                <Text variant="tag">Live</Text>
              </Inline>
              <Text variant="statement" as="p">
                The same styles, <em>a size down</em>.
              </Text>
              <Inline gap={5} align="baseline">
                <Text variant="numeral" as="span">
                  42
                </Text>
                <Text variant="meta">frames in the last second</Text>
              </Inline>
            </Stack>
          </Panel>
        </div>
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
          <Text as="h3" variant="title">One role per kind of text</Text>
          <Text variant="caption">One role per kind of text; a name is quiet, its answer is loud.</Text>
        </Stack>
        <Stack gap={3}>
          <Text variant="figure">60.0</Text>
          <Text as="h4" variant="heading">Heading inside prose</Text>
          <Text>
            Body text is 14 px on a page and 13 px in a panel, on an open line. A paragraph keeps to about sixty characters a line and wraps evenly, so it reads as a block rather than a ragged edge.
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
        <span className="sc-subhead">Words · the reading face</span>
        {steps.map(([k, use]) => (
          <div key={k} className="sc-voice__row">
            <span style={{ font: `var(--ar-weight-light) var(--ar-text-${k}) var(--ar-font-ui)`, color: 'var(--ar-text-hi)' }}>{use}</span>
            <code>--ar-text-{k}</code>
          </div>
        ))}
      </div>
      <div className="sc-voice">
        <span className="sc-subhead">Controls · the control face</span>
        <div className="sc-voice__row">
          <span className="ar-text" style={{ color: 'var(--ar-text-hi)' }}>
            Control label
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
          <span style={{ font: 'var(--ar-weight-title) var(--ar-text-3xl) / var(--ar-leading-none) var(--ar-font-display)', letterSpacing: 'var(--ar-track-display)', color: 'var(--ar-text-hi)' }}>Display</span>
          <code>550 · page titles</code>
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
        wide
        id="materials"
        text="Every part of every component is made of five materials, and each one has a single job. Learn these and the whole package reads at a glance: what holds, what floats, where you edit, what you press, and what is live."
      >
        <Materials />
      </Spec>

      <Spec
        id="tokens"
        text="Components read tokens, never literal colours. These are the live values of the current theme. Words use the reading face on a five-step scale; labels, rows, buttons and values use the control face."
        code={`
/* three layers */
--ar-ink-*, --ar-teal-*            primitives   tokens.css
--ar-bg-well, --ar-text-hi, …      roles        tokens.css + themes.css
--ar-insert, --ar-seam, …          control      materials.css (each theme's finish)

/* a panel's roles: a whole font and an ink each */
--ar-type-panel     16 / 600  title face     --ar-tone-title  100%
--ar-type-section   14 / 600  title face     --ar-tone-title  100%
--ar-type-value     13 / 550  tabular        --ar-tone-value  100%
--ar-type-label     12 / 400                 --ar-tone-label   70%
--ar-type-note      12 / 400                 --ar-tone-note    68%`}
      >
        <TokenTable deps={[theme]} />
        <TypeScale />
      </Spec>

      <Spec
        wide
        id="type"
        text={`Type sets change the whole voice of a page, not just the font. Each has its own title size, weight, case and width, its own paragraph face and line spacing, and its own way of setting accent words and small labels. Control sizes stay the same, so every component keeps its proportions. There are ${TYPE_COLLECTIONS.length}; Sleek is the default. Click one to set it for the page. Each card is its own data-ar-type scope, so collections nest like themes and carry through portalled overlays.`}
        code={`
<ArtinosTheme theme="frost-deep" type="editorial"> … </ArtinosTheme>

// or on any element, inside any theme:
<div data-ar-type="couture"> … </div>

// a kit carries the collections it was exported with:
node artinos.mjs export --project . --themes onyx --components all --type luxe,editorial`}
      >
        {TYPE_GROUPS.map(([name, sets]) => (
          <div key={name} className="sc-family">
            <span className="sc-subhead">{name}</span>
            <div className="sc-grid sc-grid--cards sc-grid--type">
              {sets.map((t) => (
                <TypeCard key={t} t={t} active={t === type} onPick={() => onPickType(t)} />
              ))}
            </div>
          </div>
        ))}
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
        text="The rules a panel is composed by. One space scale (2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 px) and three roles density tunes: rows in a group, groups in a panel, the panel's padding. Text plays one role per kind on a fixed ladder (16 panel name, 14 section, 13 value, 12 label), paragraphs kept to a comfortable measure. Stack and Inline space things only by the scale; labelWidth on a Panel or Section gives every Field one label column. The design guide (docs/design.md) has every rule on one page."
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
  <Text variant="caption">One role per kind of text; a name is quiet, its answer is loud.</Text>
</Stack>`}
      >
        <LayoutAndText />
      </Spec>

      <Spec
        id="typography"
        wide
        text={
          <>
            <p>Every kind of text has its own role, and neighbouring roles differ in at least two ways at once.</p>
            <ul>
              <li><b>A name is quiet, its answer is loud:</b> a label is 12 regular in a soft ink, its value 13 and firm in the full ink.</li>
              <li><b>Weight runs against size:</b> display sizes are light, titles of 20 and under are semibold.</li>
              <li>Each face has one job: one titles, one reads, the serif opens and quotes; figures are the sans with tabular digits, and the mono is for code.</li>
              <li>Titles balance their lines; paragraphs keep a comfortable measure and no lone last word.</li>
              <li>Inside a paragraph, strong, mark, code, key and link each have their own look.</li>
              <li>A Callout sets apart what must not be missed, after the text it qualifies.</li>
            </ul>
          </>
        }
        code={"<Text variant=\"overline\">Material · 3 changed</Text>\n<Text variant=\"title\">How the shell catches light</Text>\n<Text variant=\"lead\">The shell is thick glass…</Text>\n<Text>Raise <strong>Transmission</strong>… <mark>past 0.8 it glows</mark>… <kbd>Alt</kbd>…</Text>\n<Text variant=\"subheading\">What changes it</Text>\n<Text as=\"ul\"><li>Transmission…</li></Text>\n<Text variant=\"quote\">Glass reads as glass when its edge is brighter than its face.</Text>\n<Callout tone=\"tip\" title=\"Start from a preset\">Pick <strong>Thick glass</strong>…</Callout>\n<Text variant=\"note\">Values are in the scene's units.</Text>"}
      >
        <Typography />
      </Spec>

      <Spec
        id="type-styles"
        wide
        text="Beyond the roles: one fine ladder of sizes from 11 to 48, six more styles, and seven ways to bring the accent into any of them. The accent is blended toward the ink, so small words stay readable on glass whichever accent you pick; change it in the bar and all of this follows."
        code={`<Text variant="eyebrow">Live preview</Text>
<Text variant="hero">Light, <em>held</em> in glass</Text>
<Text variant="statement">Every surface is <em>one material</em>.</Text>
<Text variant="numeral">07</Text>
<Text variant="tag">3 changed</Text>
<Text variant="title" accent="marker">Surface response</Text>
<Text dropcap>Raise transmission…</Text>`}
      >
        <TypeStyles />
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
