/* Showcase — the Foundations sections: live token table, theme cards and the
   quick-token builder. */
import { useEffect, useRef, useState } from 'react';
import {
  ArtinosTheme, GLASS_THEMES, THEME_META, TYPE_META,
  Slider, RangeSlider, NumberField, Switch, Segmented, ColorField, Select, Field,
} from '../../../src';
import type { ThemeName, TypeCollection } from '../../../src';
import { Swatch, THEME_OPTIONS, Code } from '../shared';

/* ---------- foundations ---------- */
export function TokenTable({ deps }: { deps: unknown[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vals, setVals] = useState<Record<string, string>>({});
  const names = ['bg-app', 'bg-surface', 'bg-well', 'text-hi', 'text-mid', 'text-low', 'text-faint', 'line', 'signal', 'signal-hi', 'bind', 'warn', 'fault', 'tick', 'insert-ink', 'seam', 'seam-active', 'led-off'];
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (!ref.current) return;
      const cs = getComputedStyle(ref.current);
      setVals(Object.fromEntries(names.map((n) => [n, cs.getPropertyValue('--ar-' + n).trim()])));
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return (
    <div ref={ref} className="sc-tokens">
      {names.map((n) => (
        <div key={n} className="sc-token">
          <i style={{ background: `var(--ar-${n})` }} />
          <b>--ar-{n}</b>
          <span title={vals[n]}>{vals[n]}</span>
        </div>
      ))}
    </div>
  );
}

/** Theme gallery rows: four looks each. */
export const FAMILIES: Array<[string, string[]]> = [
  ['Untinted glass — air, polish, optical depth and layered reflections', ['untinted-glass']],
  ['Untinted frost — etched, silk, mist and deep diffusion', ['untinted-frost']],
  ['Atelier glass — smoke, sea glass, silver and garnet crystal', ['atelier-glass']],
  ['Atelier frost — vellum, polar ice, lilac silk and smoked sand', ['atelier-frost']],
  ['Studio & signature — solid grounds and the original ARTINOS looks', ['studio', 'signature']],
  ['Glass — clean panes over imagery or a live canvas', ['glass']],
  ['Frost — diffuse panes', ['frost']],
  ['Optical glass — clear transmission, no tint: the colour is what is behind', ['clear']],
  ['Optical frost — continuous frost, bright rims, translucent or pearl fills', ['clear-frost']],
  ['Luxe glass — coloured premium panes: metallic hairlines, wider tracking', ['luxe']],
  ['Luxe frost — coloured premium frost: satin and glazed controls, precious-metal accents', ['luxe-frost']],
];

const isGlass = (t: ThemeName) => (GLASS_THEMES as readonly string[]).includes(t);

/** A type collection as a specimen: the display face, the sans title, the mono caps and a live
 *  control, each card its own data-ar-type scope inside the page's theme. */
export function TypeCard({ t, active, onPick }: { t: TypeCollection; active: boolean; onPick: () => void }) {
  const m = TYPE_META[t];
  const faces = [m.ui, m.mono, m.display].filter(Boolean).join(' · ');
  return (
    <figure
      data-ar-type={t}
      className="sc-card sc-type"
      data-active={active ? '' : undefined}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onPick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPick())}
    >
      <div className="sc-type__display">
        Aa<span>Rr 0123 kHz</span>
      </div>
      <div className="sc-card__head">
        <span className="sc-card__name">{m.label}</span>
        <span className="sc-card__meta sc-type__faces">{faces}</span>
      </div>
      <p className="sc-card__text">{m.description}</p>
      <div className="sc-type__specimen" onClick={(e) => e.stopPropagation()}>
        <b className="sc-type__title">Material · Optical body</b>
        <span className="sc-type__caps">Frequency · 440 Hz · 3 changed</span>
        <Slider label="Exposure" defaultValue={0.62} format="percent" decimals={0} density="dense" />
      </div>
    </figure>
  );
}

export function ThemeCard({ t, active, onPick }: { t: ThemeName; active: boolean; onPick: () => void }) {
  const glass = isGlass(t);
  return (
    <ArtinosTheme
      theme={t}
      ground={!glass}
      className={glass ? 'sc-card sc-card--glass' : 'sc-card'}
      data-active={active ? '' : undefined}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onPick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPick())}
    >
      <div className="sc-card__head">
        <Swatch t={t} />
        <span className="sc-card__name">{THEME_META[t].label}</span>
        <span className="sc-card__meta">{THEME_META[t].kind}</span>
      </div>
      <p className="sc-card__text">{THEME_META[t].description}</p>
      <div className="sc-card__swatches">
        {['bg-app', 'bg-raised', 'text-mid', 'text-hi', 'signal', 'bind', 'warn', 'fault'].map((k) => (
          <i key={k} style={{ background: `var(--ar-${k})` }} />
        ))}
      </div>
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Slider label="Roughness" defaultValue={0.52} toggleable />
        <Slider variant="stepped" steps={5} label="Samples" min={1} max={5} decimals={0} defaultValue={3} />
        <Segmented options={['Low', 'Med', 'High']} defaultValue="MED" label="Quality" />
      </div>
    </ArtinosTheme>
  );
}

/* ---------- custom theme builder ---------- */
export function ThemeBuilder() {
  const [signal, setSignal] = useState('#FF4FA3');
  const [ground, setGround] = useState('#120E14');
  const [radius, setRadius] = useState(9);
  const [well, setWell] = useState(0.42);
  // the mono face is the page's type collection unless a face is picked here
  const [font, setFont] = useState('Inherit');
  const [base, setBase] = useState<ThemeName>('studio');
  const tokens = {
    signal,
    'signal-hi': signal,
    'signal-line': signal + '88',
    'signal-wash': signal + '26',
    'bg-app': ground,
    trough: `rgba(0, 0, 0, ${well.toFixed(2)})`,
    radius: radius + 'px',
    ...(font === 'Inherit' ? {} : { 'font-num': `'${font}', ui-monospace, monospace` }),
  };
  const code = `<ArtinosTheme
  theme="${base}"
  tokens={{
${Object.entries(tokens).map(([k, v]) => `    '${k}': '${v}',`).join('\n')}
  }}
>
  …controls
</ArtinosTheme>

/* or plain CSS, no React: */
[data-ar-theme='${base}'].my-brand {
${Object.entries(tokens).map(([k, v]) => `  --ar-${k}: ${v};`).join('\n')}
}`;
  return (
    <>
      <div className="sc-row">
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <Field label="Signal"><ColorField value={signal} onChange={setSignal} /></Field>
          <Field label="Ground"><ColorField value={ground} onChange={setGround} /></Field>
          <Field label="Radius"><NumberField value={radius} onChange={setRadius} min={0} max={14} unit="px" aria-label="Radius" /></Field>
          <Field label="Well"><Slider label="Depth" value={well} onChange={setWell} max={0.8} toggleable={false} /></Field>
          <Field label="Numerals"><Select options={['Inherit', 'Chivo Mono', 'IBM Plex Mono', 'Geist Mono', 'JetBrains Mono', 'DM Mono', 'Red Hat Mono', 'Roboto Mono']} value={font} onChange={setFont} appearance="well" label="Numerals" /></Field>
          <Field label="Base theme"><Select options={THEME_OPTIONS} value={base} onChange={setBase} appearance="well" label="Base theme" /></Field>
        </div>
        <ArtinosTheme theme={base} tokens={tokens} ground style={{ flex: '1 1 320px', minWidth: 0, padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Slider label="Exposure" defaultValue={0.62} toggleable />
          <Slider label="Gain" format="db" min={-60} max={12} decimals={1} defaultValue={-4.5} detents={[0]} status="automated" />
          <RangeSlider label="Band" defaultValue={[0.25, 0.7]} />
          <Slider variant="ruler" label="Focal" min={12} max={200} span={40} unit="mm" decimals={0} defaultValue={50} marks={[35, 50, 85]} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <Switch label="Armed" defaultValue />
            <Segmented options={['A', 'B', 'C']} defaultValue="B" label="Bank" />
          </div>
        </ArtinosTheme>
      </div>
      <Code>{code}</Code>
    </>
  );
}
