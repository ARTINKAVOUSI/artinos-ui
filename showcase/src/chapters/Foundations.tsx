/* 01 · Foundations — the themes, the five materials every part is made of, the tokens and the
   type system, density, and the motion tokens. */
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { TextFace, TextVariant, TypeCollection } from '../../../src';
import { Badge, Button, Callout, Field, Inline, NumberField, Panel, Section, Select, Slider, Stack, Switch, Text, TextField, THEMES, TYPE_COLLECTIONS, TYPE_META } from '../../../src';
import { TokenTable } from '../app/foundations';
import { ThemeTile, galleryThemes } from '../themes/ThemesPage';
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
  const themes = galleryThemes();
  return (
    <div ref={ref} className="sc-window">
      <div className="sc-themes-inline__bar">
        <Button size="sm" variant="primary" onClick={() => (location.hash = '#themes')}>
          Open the theme gallery
        </Button>
      </div>
      <div className="sc-tiles">
        {themes.map((t) => (
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
  ['display', 'display · title face · 36', 'Light, held'],
  ['title', 'title · title face · 24 semibold', 'Material and light'],
  ['title', 'title · face="serif"', 'An editorial title', 'serif'],
  ['heading', 'heading · title face · 18 semibold', 'Surface response'],
  ['subheading', 'subheading · 14 semibold', 'Roughness and gloss'],
  ['overline', 'overline · 12 semibold · accent', 'Material · glass'],
  ['lead', 'lead · 16 · full ink', 'A lead says what the view is for, a size up from the body.'],
  ['body', 'body · 14 on 22 · 88% ink', 'Body text carries the explanation at a comfortable line length.'],
  ['note', 'note · 13 · 66% ink', 'A note is help or an aside, two steps quieter than the body.'],
  ['caption', 'caption · 12 medium · 54% ink', 'Fig. 3, the rim at grazing angles'],
  ['label', 'label · 12 medium · 76% ink', 'Exposure'],
  ['value', 'value · 13 semibold · full ink · tabular', '0.71 · 1,284 · −4.5 dB'],
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

/** What each type system is for, in a few words. */
const TYPE_USE: Record<TypeCollection, string> = {
  sleek: 'Control panels, tools and dashboards',
  product: 'Product apps and inspectors',
  editorial: 'Documentation, onboarding and pages',
  native: 'Desktop-like apps, nothing to load',
  legible: 'Accessibility and long reading',
  instrument: 'Studio tools and creative software',
  salon: 'Premium products and launch pages',
  wide: 'Hardware, devices and confident brands',
  grotesk: 'Technical and developer products',
  fine: 'The default: precision instruments and pro tools',
  mass: 'Hardware and industrial products',
  round: 'Consumer devices and friendly products',
};

/** The lineup's two kinds: one family told apart by weight and ink, or a display face over a text face. */
const TYPE_KINDS: [string, string, TypeCollection[]][] = [
  ['One family', 'One face from the smallest label to the headline, told apart by size, weight and ink.', ['sleek', 'product', 'native', 'legible']],
  ['Pairings', 'A display face for titles over a text face for every control and paragraph: character in the headlines, calm in the controls.', ['instrument', 'salon', 'wide', 'grotesk', 'editorial']],
  ['Hairline and heavy', 'Thin words on every control in a bright ink, under heavy titles: the levels part by weight at a glance.', ['fine', 'mass', 'round']],
];

/** The type systems, each set in itself on the same page excerpt and the same panel, so they
 *  compare line for line: an eyebrow, a title, the opening line, a paragraph, then a control panel. */
function TypeLineup({ type, onPick }: { type: string; onPick: (t: TypeCollection) => void }) {
  return (
    <div className="sc-kinds">
      {TYPE_KINDS.map(([kind, about, list]) => (
        <div key={kind} className="sc-kinds__group">
          <div className="sc-kinds__head">
            <Text variant="heading" as="h4">
              {kind}
            </Text>
            <Text variant="note">{about}</Text>
          </div>
          <div className="sc-lineup">
      {list.map((t) => {
        const i = TYPE_COLLECTIONS.indexOf(t);
        const m = TYPE_META[t];
        const faces = [...new Set([m.display, m.ui, m.mono].filter(Boolean))].join(' · ');
        const current = t === type;
        return (
          <article key={t} data-ar-type={t} className="sc-lineup__card" data-current={current ? '' : undefined}>
            <div className="sc-lineup__text">
              <Text variant="eyebrow">
                {String(i + 1).padStart(2, '0')} · {m.label}
              </Text>
              <Text variant="display" as="h4">
                Light, <em>held</em> in glass
              </Text>
              <Text variant="lead">The shell bends what is behind it and keeps a bright rim.</Text>
              <Text>
                Raise <strong>Transmission</strong> to let more of the scene through, then lower the roughness for a sharper image at 1.52 IOR.
              </Text>
              <Text variant="caption">
                {TYPE_USE[t]} · {faces}
              </Text>
            </div>
            <Panel
              title="Material"
              subtitle="Optical body · thick glass"
              actions={
                <Button size="sm" variant={current ? 'primary' : 'default'} onClick={() => onPick(t)}>
                  {current ? 'In use' : 'Use'}
                </Button>
              }
              labelWidth={84}
            >
              <Section title="Surface" count="3 changed">
                <Slider label="Transmission" defaultValue={0.71} format="percent" decimals={0} />
                <Field label="Finish">
                  <Select label="Finish" appearance="well" options={['Polished', 'Satin', 'Frosted']} defaultValue="Satin" />
                </Field>
              </Section>
            </Panel>
          </article>
        );
      })}
          </div>
        </div>
      ))}
    </div>
  );
}


/* ---------- type styles ---------- */

const RAMP = [12, 13, 14, 16, 18, 20, 24, 28, 36, 48];
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

    </div>
  );
}

/* ---------- space ---------- */

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/** The space scale: every gap and padding in the family is one of these steps. */
function SpaceScale() {
  return (
    <div className="sc-space-scale">
      <span className="sc-subhead">Space · one scale for every gap and padding</span>
      <Inline align="end" gap={5}>
        {STEPS.map((n) => (
          <Stack key={n} gap={2} align="center">
            <span className="sc-space" style={{ width: `var(--ar-space-${n})`, height: `var(--ar-space-${n})` }} />
            <code>{n}</code>
          </Stack>
        ))}
      </Inline>
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
        text={`A theme is the whole look: ground, ink, signal, panel glass and a control finish tuned for it. You pick one — nothing else. Solid themes paint their own ground; glass themes are panes over whatever is behind them (try the backdrops in the bar). There are ${THEMES.length}, side by side, the default first. Click a tile to apply it; each tile is its own data-ar-theme scope, so themes nest. The theme gallery shows every theme on the bare backdrop, with a stage that dresses a small working setup in the one you pick.`}
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
        text="Components read tokens, never literal colours. These are the live values of the current theme. Space is one scale of nine steps (2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32 px); density tunes three roles on it: rows in a group, groups in a panel, the panel's padding. The design guide (docs/design.md) has every rule on one page."
        code={`
/* three layers */
--ar-step-12 … --ar-step-48        the ladder   tokens.css
--ar-bg-well, --ar-text-hi, …      roles        tokens.css + themes.css
--ar-insert, --ar-seam, …          control      materials.css (each theme's finish)

/* a panel's roles: a whole font and an ink each */
--ar-type-panel     16 / 600  title face     --ar-tone-title  100%
--ar-type-section   14 / 600  title face     --ar-tone-title  100%
--ar-type-value     13 / 600  tabular        --ar-tone-value  100%
--ar-type-label     12 / 500  +0.01em        --ar-tone-label   76% solid
--ar-type-note      12 / 400                 --ar-tone-note    66% solid`}
      >
        <TokenTable deps={[theme]} />
        <SpaceScale />
      </Spec>

      <Spec
        wide
        id="type"
        text={`Twelve type systems, each a complete design for one use: four set in one family, five pairing a display face with a text face, three setting hairline control text under heavy titles. Every system uses the same sizes, so a page and a panel keep their proportions; it changes the faces, the weights, the tracking and how an opening line and a small mark are set. Fine is the default. Click Use on a panel to set the whole page in it.`}
        code={`
<ArtinosTheme theme="frost-deep" type="product"> … </ArtinosTheme>

// or on any element, inside any theme:
<div data-ar-type="editorial"> … </div>

// a kit carries the systems it was exported with (sleek always):
node artinos.mjs export --project . --themes onyx --components all --type product,editorial`}
      >
        <TypeLineup type={type} onPick={onPickType} />
      </Spec>

      <Spec
        id="typography"
        wide
        text={
          <>
            <p>Every kind of text has its own role, and neighbouring roles differ in at least two ways at once.</p>
            <ul>
              <li><b>A name is quiet, its answer is loud:</b> a label is 12 medium in a solid grey, its value 13 semibold in the full ink.</li>
              <li><b>One scale for every system:</b> 48 · 36 · 24 · 18 · 16 · 14 · 13 · 12. A system changes the faces and weights, never the sizes.</li>
              <li>Each face has one job: one titles, one reads, the serif opens and quotes; figures are the sans with tabular digits, and the mono is for code.</li>
              <li>Titles balance their lines; paragraphs keep a comfortable measure and no lone last word.</li>
              <li>Inside a paragraph, strong, mark, code, key and link each have their own look.</li>
              <li>A Callout sets apart what must not be missed, after the text it qualifies.</li>
              <li><b>Beyond the roles:</b> six more styles (hero, statement, numeral, eyebrow, tag, dropcap) and seven ways to bring the accent into any of them. The accent is blended toward the ink, so small words stay readable on glass in any accent.</li>
            </ul>
          </>
        }
        code={"<Text variant=\"overline\">Material · 3 changed</Text>\n<Text variant=\"title\">How the shell catches light</Text>\n<Text variant=\"lead\">The shell is thick glass…</Text>\n<Text>Raise <strong>Transmission</strong>… <mark>past 0.8 it glows</mark>… <kbd>Alt</kbd>…</Text>\n<Text variant=\"subheading\">What changes it</Text>\n<Text as=\"ul\"><li>Transmission…</li></Text>\n<Text variant=\"quote\">Glass reads as glass when its edge is brighter than its face.</Text>\n<Callout tone=\"tip\" title=\"Start from a preset\">Pick <strong>Thick glass</strong>…</Callout>\n<Text variant=\"note\">Values are in the scene's units.</Text>\n\n<Text variant=\"hero\">Light, <em>held</em> in glass</Text>\n<Text variant=\"statement\">Every surface is <em>one material</em>.</Text>\n<Text variant=\"title\" accent=\"marker\">Surface response</Text>\n<Text dropcap>Raise transmission…</Text>"}
      >
        <Typography />
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
