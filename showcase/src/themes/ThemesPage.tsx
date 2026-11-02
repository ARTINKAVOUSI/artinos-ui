/* The theme gallery (#themes): every theme on the bare backdrop, as it would sit over an app's
   own scene. A stage dresses a small working setup in the chosen theme; below, the whole
   collection by family. The page wears the chosen theme, so the bar and the stage switch with
   each pick, and the bar and stage stay pinned while the collection scrolls under them.
   ThemeTile and themeFamilies also serve the inline gallery on the main page. */
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ACCENTS, ACCENT_META, ArtinosTheme, Badge, Button, IconButton, ItemRow, Meter, Panel, Section, Segmented, Select, Slider, Sparkline, Stat, Switch, HERO_THEMES, THEMES, THEME_META } from '../../../src';
import type { Accent, Density, ThemeName } from '../../../src';
import { FAMILIES } from '../app/foundations';
import { IC, useLiveSeries } from '../chapters/demos';
import { BACKDROPS, BACKDROP_OPTIONS, Swatch } from '../shared';
import type { Backdrop } from '../shared';
import './themes.css';

const START = 'Start here';

/** The gallery's families: a short name, what they share, and their themes. The heroes come first. */
export function themeFamilies() {
  const hero = { name: START, about: `The ${HERO_THEMES.length} hero themes, one per kind of look. Every other theme is a variation of one of them.`, themes: [...HERO_THEMES] };
  const families = FAMILIES.map(([title, fams]) => {
    const [name, about = ''] = title.split(' — ');
    return { name, about: about.charAt(0).toUpperCase() + about.slice(1) + '.', themes: THEMES.filter((t) => fams.includes(THEME_META[t].family)) };
  }).filter((f) => f.themes.length);
  return [hero, ...families];
}

/** One theme as a small live panel: click it to pick the theme. */
export function ThemeTile({ t, active, accent, onPick }: { t: ThemeName; active: boolean; accent?: Accent; onPick: () => void }) {
  const m = THEME_META[t];
  return (
    <ArtinosTheme
      theme={t}
      accent={accent}
      ground={m.kind === 'solid'}
      className="sc-tile"
      data-active={active ? '' : undefined}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onPick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPick())}
    >
      <div className="sc-tile__head">
        <Swatch t={t} />
        <b>{m.label}</b>
        <span>{m.kind}</span>
      </div>
      <div className="sc-tile__body" onClick={(e) => e.stopPropagation()}>
        <Slider label="Exposure" defaultValue={0.62} />
        <Slider label="Gain" format="db" min={-24} max={12} decimals={1} defaultValue={-4.5} detents={[0]} />
        <Segmented options={['Low', 'Med', 'High']} defaultValue="Med" label="Quality" />
      </div>
      <p className="sc-tile__text">{m.description}</p>
    </ArtinosTheme>
  );
}

/** A small working setup dressed in one theme: what the theme is like to use, not just to see. */
function Stage({ t, onUse }: { t: ThemeName; onUse: () => void }) {
  const m = THEME_META[t];
  const series = useLiveSeries(40);
  const [layer, setLayer] = useState('Orb');
  const last = series[series.length - 1];
  return (
    <div className="sc-stage">
      <section className="sc-stage__intro">
        <span className="sc-stage__kicker">
          <Swatch t={t} /> {themeFamilies().find((f) => f.name !== START && f.themes.includes(t))?.name ?? m.family} · {m.kind}
          {m.parent ? ` · a variation of ${THEME_META[m.parent].label}` : ' · hero'}
        </span>
        <h1>{m.label}</h1>
        <p>{m.description}</p>
        <div className="sc-stage__tokens" aria-label="Palette">
          {['bg-app', 'bg-raised', 'text-mid', 'text-hi', 'signal', 'bind', 'warn', 'fault'].map((k) => (
            <i key={k} title={'--ar-' + k} style={{ background: `var(--ar-${k})` }} />
          ))}
        </div>
        <div className="sc-stage__actions">
          <Button variant="primary" onClick={onUse}>
            Use this theme
          </Button>
          <code>{`<ArtinosTheme theme="${t}">`}</code>
        </div>
      </section>

      <Panel title="Inspector" subtitle="Orb · glass shell">
        <Section title="Material" count={4}>
          <Slider label="Exposure" defaultValue={0.71} />
          <Slider label="Roughness" defaultValue={0.38} />
          <Select options={['Neutral', 'Warm', 'Cool']} defaultValue="Neutral" label="Mode" />
          <Switch label="Cast shadows" defaultValue />
        </Section>
        <Section title="Lens" count={2}>
          <Slider variant="ruler" label="Focal" min={12} max={200} span={40} unit="mm" decimals={0} defaultValue={50} />
          <Segmented options={['Low', 'Med', 'High']} defaultValue="Med" label="Quality" />
        </Section>
      </Panel>

      <Panel title="Scene" subtitle="Live">
        <div className="sc-stage__stats">
          <Stat label="Frame" value={16.4} decimals={1} unit="ms" delta={-0.8} better="down" />
          <Stat label="Draw calls" value={182} decimals={0} />
        </div>
        <Meter label="GPU" value={last} valueText={`${Math.round(last * 100)}%`} peak />
        <Sparkline label="Frame time" values={series} fill width={260} height={32} />
        <div className="sc-stage__layers">
          {[
            ['Orb', '#4fd1ba', 'Mesh · 12,480 tris'],
            ['Glass shell', '#9eeede', 'Material · thick glass'],
            ['Rim light', '#f2e8d5', 'Area light · 4.2 lm'],
          ].map(([name, sw, meta]) => (
            <ItemRow key={name} title={name} meta={meta} swatch={sw} selected={layer === name} onSelect={() => setLayer(name)} trailing={<IconButton size="sm" label={`Hide ${name}`} icon={IC.eye} active />} />
          ))}
        </div>
        <div className="sc-stage__row">
          <Badge tone="live" dot>
            60 fps
          </Badge>
          <span className="sc-stage__spacer" />
          <IconButton size="sm" label="Add" icon={IC.plus} />
          <IconButton size="sm" label="Duplicate" icon={IC.copy} />
          <IconButton size="sm" label="Delete" icon={IC.trash} />
          <Button size="sm">Reset</Button>
          <Button size="sm" variant="primary">
            Render
          </Button>
        </div>
      </Panel>
    </div>
  );
}

export function ThemesPage({
  initial,
  accent,
  onAccent,
  bg,
  onBg,
  type,
  density,
  onUse,
  onExit,
}: {
  initial: ThemeName;
  accent: string;
  onAccent: (a: string) => void;
  bg: Backdrop;
  onBg: (b: Backdrop) => void;
  type: string;
  density: Density;
  onUse: (t: ThemeName) => void;
  onExit: () => void;
}) {
  const [sel, setSel] = useState<ThemeName>(initial);
  const [family, setFamily] = useState('all');
  const families = useMemo(themeFamilies, []);
  const acc = accent === 'theme' ? undefined : (accent as Accent);
  const shown = families.filter((f) => family === 'all' || f.name === family);
  return (
    <ArtinosTheme theme={sel} accent={acc} type={type} density={density} className="sc-themes" style={{ '--sc-scene': bg !== 'none' ? `url(${BACKDROPS[bg]})` : 'none' } as CSSProperties}>
      {/* the bar and the stage stay pinned; the collection scrolls under them */}
      <div className="sc-themes__top">
        <header className="sc-themes__bar">
          <Button size="sm" variant="ghost" onClick={onExit}>
            ← Showcase
          </Button>
          <b className="sc-themes__title">Themes · {THEMES.length}</b>
          <Select options={[{ value: 'all', label: 'Every family' }, ...families.map((f) => ({ value: f.name, label: f.name }))]} value={family} onChange={setFamily} appearance="well" label="Family" />
          <Select options={[{ value: 'theme', label: 'Theme accent' }, ...ACCENTS.map((a) => ({ value: a, label: ACCENT_META[a].label }))]} value={accent} onChange={onAccent} appearance="well" label="Accent" />
          <Select options={BACKDROP_OPTIONS} value={bg} onChange={(v) => onBg(v as Backdrop)} appearance="well" label="Backdrop" />
          <span className="sc-stage__spacer" />
          <Button size="sm" variant="primary" onClick={() => onUse(sel)}>
            Use {THEME_META[sel].label}
          </Button>
        </header>
        <Stage t={sel} onUse={() => onUse(sel)} />
      </div>

      <main className="sc-themes__main">
        {shown.map((f) => (
          <section key={f.name} className="sc-themes__family">
            <header className="sc-themes__family-head">
              <h2>{f.name}</h2>
              <span>{f.themes.length}</span>
              <p>{f.about}</p>
            </header>
            <div className="sc-tiles">
              {f.themes.map((t) => (
                <ThemeTile key={t} t={t} accent={acc} active={t === sel} onPick={() => setSel(t)} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </ArtinosTheme>
  );
}
