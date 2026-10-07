/* ARTINOS UI — full showcase. Every control on this page is live and comes from
   ../src (the package) exactly as a consuming app would import it.
   The app shell: theme / density / backdrop state, view routing (page · #studio),
   the top bar, the page itself and the Export kit dialog (#export). */
import { useEffect, useState } from 'react';
import { ArtinosTheme, Button, THEMES, GLASS_THEMES, THEME_META, DENSITIES, RollingValue, Slider, Segmented, Select } from '../../../src';
import type { Density, ThemeName } from '../../../src';
import { Swatch, THEME_OPTIONS, BACKDROPS, BACKDROP_OPTIONS, Code, Spec, Part, partId } from '../shared';
import type { Backdrop } from '../shared';
import { ComponentGallery } from '../gallery/ComponentGallery';
import { ThemeStudio } from '../studio/ThemeStudio';
import { loadThemes, saveThemes } from '../studio/store';
import type { CustomTheme } from '../studio/store';
import { ExportKit } from '../export/ExportKit';
import { KIT_COMPONENTS } from '../export/kit';
import { FAMILIES, ThemeBuilder, ThemeCard, TokenTable } from './foundations';

export function App() {
  // ?theme=frost&density=dense&backdrop=monstera — links straight to a look
  const q = new URLSearchParams(location.search);
  const pick = <T extends string>(k: string, list: readonly T[], d: T) => (list.includes(q.get(k) as T) ? (q.get(k) as T) : d);
  const [theme, setTheme] = useState<string>(pick('theme', THEMES, 'frost-deep'));
  const [customs, setCustoms] = useState<CustomTheme[]>(() => loadThemes());
  const [view, setView] = useState<'showcase' | 'studio'>(() => (location.hash === '#studio' ? 'studio' : 'showcase'));
  useEffect(() => {
    const h = () => setView(location.hash === '#studio' ? 'studio' : 'showcase');
    window.addEventListener('hashchange', h);
    window.addEventListener('popstate', h);
    return () => {
      window.removeEventListener('hashchange', h);
      window.removeEventListener('popstate', h);
    };
  }, []);
  const go = (v: 'showcase' | 'studio') => {
    history.pushState(null, '', v === 'studio' ? '#studio' : location.pathname + location.search);
    setView(v);
    window.scrollTo(0, 0);
  };
  const updateCustoms = (list: CustomTheme[]) => {
    setCustoms(list);
    saveThemes(list);
  };
  const custom = theme.startsWith('c:') ? customs.find((c) => c.id === theme.slice(2)) : undefined;
  const baseTheme: ThemeName = custom ? custom.base : (THEMES as readonly string[]).includes(theme) ? (theme as ThemeName) : 'frost-deep';
  const themeOptions = [...customs.map((c) => ({ value: 'c:' + c.id, label: c.name, icon: <Swatch t={c.base} /> })), ...THEME_OPTIONS];


  const [density, setDensity] = useState<Density>(pick('density', DENSITIES, 'standard'));
  const [bg, setBg] = useState<Backdrop>(pick('backdrop', ['none', 'garden', 'monstera'] as const, 'garden'));
  const [exporting, setExporting] = useState(() => location.hash === '#export');

  if (view === 'studio')
    return (
      <ThemeStudio
        customs={customs}
        onCustomsChange={updateCustoms}
        initial={theme}
        onExit={(use) => {
          if (use) setTheme(use);
          go('showcase');
        }}
      />
    );

  return (
    <ArtinosTheme theme={baseTheme} tokens={custom?.tokens} density={density} ground className="sc-root">
      {bg !== 'none' ? <div className="sc-backdrop" style={{ backgroundImage: `url(${BACKDROPS[bg]})` }} /> : null}

      <header className="sc-bar">
        <div className="sc-brand">
          <span className="sc-mark">#</span>
          <span className="sc-word">ARTINOS</span>
          <i className="sc-rule" />
          <span className="sc-sub">UI · Showcase</span>
        </div>
        <label className="sc-pick sc-pick--theme"><span>THEME</span><Select options={themeOptions} value={theme} onChange={setTheme} appearance="well" label="Theme" /></label>
        <label className="sc-pick"><span>DENSITY</span><Segmented options={DENSITIES} value={density} onChange={setDensity} label="Density" /></label>
        <Button variant="primary" size="sm" onClick={() => go('studio')}>
          Theme Studio
        </Button>
        <Button size="sm" onClick={() => setExporting(true)}>
          Export kit
        </Button>
        <label className="sc-pick"><span>BACKDROP</span><Select options={BACKDROP_OPTIONS} value={bg} onChange={(v) => setBg(v as Backdrop)} appearance="well" label="Backdrop" /></label>
        <Contents />
      </header>

      <main className="sc-sheet">
        <div className="sc-hero">
          <div>
            <h1>ARTINOS UI</h1>
            <p>
              A precision-instrument control system. One compact surface per parameter: the capsule is the control, the seam is the
              handle, the readout is the precision zone. Pick one of {THEMES.length} complete themes — studio, signature, glass, frost, untinted, atelier, optical or luxe — and every control follows:{' '}
              ground, ink, signal, panel glass and the finish of each control. Switch in the bar above, or build your own in the Theme Studio; everything on this page is live.
            </p>
          </div>
          <div className="sc-stats">
            <div className="sc-stat"><b><CountUp to={THEMES.length} /></b><span>THEMES</span></div>
            <div className="sc-stat"><b><CountUp to={GLASS_THEMES.length} delay={120} /></b><span>GLASS &amp; FROST</span></div>
            <div className="sc-stat"><b><CountUp to={KIT_COMPONENTS.length} delay={240} /></b><span>COMPONENTS</span></div>
          </div>
        </div>

        {/* ============ FOUNDATIONS ============ */}
        <Part title="Foundations" note="one theme · tokens · density" />

        <Spec n="F1" title="Themes" text="A theme is the whole look: ground, ink, signal, panel glass and a control finish tuned for it. You pick one — nothing else. Solid themes paint their own ground; glass themes are panes over whatever is behind them (try the backdrops in the bar). Click a card to apply it; each card is its own data-ar-theme scope, so themes nest." code={`
import { ArtinosTheme } from './artinos-ui';

<ArtinosTheme theme="frost">   {/* studio · studio-light · glass · glass-dark · frost · frost-light */}
  <Slider label="Roughness" defaultValue={0.52} />
</ArtinosTheme>

// or with no React at all:
<div data-ar-theme="studio-light"> … </div>`}>
          {FAMILIES.map(([title, fams]) => (
            <div key={title} className="sc-family">
              <div className="sc-subhead">{title}</div>
              <div className="sc-grid sc-grid--cards">
                {THEMES.filter((t) => fams.includes(THEME_META[t].family)).map((t) => (
                  <ThemeCard key={t} t={t} active={t === theme} onPick={() => setTheme(t)} />
                ))}
              </div>
            </div>
          ))}
        </Spec>

        <Spec n="F2" title="Tokens" text="Components read tokens, never literal colours. These are the live values of the current theme. Override any of them on a scope to restyle without touching a component — see Make it yours below." code={`
/* three layers */
--ar-ink-*, --ar-teal-*            primitives   tokens.css
--ar-bg-well, --ar-text-hi, …      roles        tokens.css + themes.css
--ar-insert, --ar-seam, …          control      materials.css (each theme's finish)

/* density */
--ar-h: 24 · 26 · 30px   --ar-label-size   --ar-value-size   --ar-pad-x`}>
          <TokenTable deps={[theme]} />
          <div className="sc-subhead">Type</div>
          <div className="sc-type">
            <span style={{ font: '200 34px var(--ar-font-ui)' }}>Display 200</span>
            <span style={{ font: '300 14px var(--ar-font-ui)' }}>Body 300 — Chivo</span>
            <span style={{ font: '500 10px var(--ar-font-num)', letterSpacing: '.2em' }}>MONO CAPS 500</span>
            <span style={{ font: '300 14px var(--ar-font-num)' }}>0123456789.−</span>
          </div>
        </Spec>

        <Spec n="F3" title="Density" text="Three control heights: dense 24 · standard 26 · comfort 30. Type size, padding and radius follow. Set it per control or on any scope." code={`<Slider density="dense" />   <div data-ar-density="comfort"> … </div>`}>
          <div className="sc-grid">
            {DENSITIES.map((d) => <Slider key={d} density={d} label={d} defaultValue={0.34 + DENSITIES.indexOf(d) * 0.16} />)}
          </div>
          <div className="sc-grid">
            {DENSITIES.map((d) => <Segmented key={d} density={d} options={['LOW', 'MED', 'HIGH']} defaultValue="MED" label={d} />)}
          </div>
        </Spec>

        <ComponentGallery />

        {/* ============ THEMING ============ */}
        <Part title="Make it yours" note="custom tokens on top of any theme" />

        <Spec n="30" title="Theme Studio" text="The full theme editor: every token of a theme — ground, ink, signal, panel glass, well, insert, seam, type, size, motion — tuned live against the complete component gallery. Save as new themes, edit them later, export as CSS, JSON or TSX. Saved themes appear in the theme picker above.">
          <div className="sc-row" style={{ alignItems: 'center' }}>
            <Button variant="primary" onClick={() => go('studio')}>Open Theme Studio →</Button>
            <span className="sc-note">{customs.length ? <>You have <b>{customs.length}</b> saved theme{customs.length > 1 ? 's' : ''}.</> : 'Start from any built-in theme.'}</span>
          </div>
        </Spec>

        <Spec n="31" title="Quick tokens" text="Any role or control token can also be overridden on a scope in code — inline via ArtinosTheme tokens, or as plain CSS. Everything derived from it (seam, LED, focus ring) follows.">
          <ThemeBuilder />
        </Spec>

        <Spec n="32" title="Install" text="Copy the artinos-ui folder into your project, import the stylesheet once, import components. Requires React 18+ and react-dom (for portals). No provider, no build plugin, no Tailwind.">
          <pre className="sc-tree">{`artinos-ui/
  artinos.css            ← import once at the app root
  index.ts               ← every component + types
  tokens/   tokens.css · themes.css · materials.css · fonts.css
  core/     RollingValue · ArtinosTheme · utils · hooks · core.css
  slider/   Slider · RangeSlider · engine · HUD · slider.css
  controls/ NumberField · Switch · ToggleGroup · Segmented · ColorField · Select · controls.css
  layout/   Panel · Section · Field · Tabs · layout.css`}</pre>
          <Code>{`// main.tsx
import './artinos-ui/artinos.css';
import { ArtinosTheme, Slider, Switch } from './artinos-ui';

export function Inspector() {
  const [rough, setRough] = useState(0.52);
  return (
    <ArtinosTheme theme="studio">
      <Slider label="Roughness" value={rough} onChange={setRough} toggleable />
      <Switch label="Shadows" defaultValue />
    </ArtinosTheme>
  );
}`}</Code>
        </Spec>

        <div className="sc-foot">
          <span>ARTINOS UI · {custom ? custom.name : THEME_META[baseTheme].label} · {THEME_META[baseTheme].kind} · {density}</span>
          <span>copy → paste → import → use</span>
        </div>
      </main>

      {exporting ? <ExportKit customs={customs} current={theme} onClose={() => setExporting(false)} /> : null}
    </ArtinosTheme>
  );
}

/** A hero figure that rolls up from zero shortly after the page opens. */
function CountUp({ to, delay = 0 }: { to: number; delay?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setN(to), 350 + delay);
    return () => clearTimeout(timer);
  }, [to, delay]);
  return <RollingValue text={String(n).padStart(String(to).length, '0')} base={0} />;
}

/** The page's parts, in order. */
const PARTS = ['Foundations', 'Slider', 'Controls', 'Layout', 'Actions', 'Inputs & display', 'Overlays', 'Workspace', 'Make it yours'];

/** The contents nav in the bar: one mono-caps link per part; the part on screen is lit. */
function Contents() {
  const [active, setActive] = useState(PARTS[0]);
  useEffect(() => {
    const heads = PARTS.map((title) => document.getElementById(partId(title))).filter((el): el is HTMLElement => !!el);
    if (!heads.length) return;
    // the active part is the last heading above the top third of the viewport
    const update = () => {
      const line = window.innerHeight / 3;
      let current = PARTS[0];
      for (const head of heads) if (head.getBoundingClientRect().top <= line) current = head.dataset.part ?? current;
      setActive(current);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return (
    <nav className="sc-contents" aria-label="Contents">
      {PARTS.map((title) => (
        <a key={title} href={'#' + partId(title)} data-active={title === active || undefined}>
          {title}
        </a>
      ))}
    </nav>
  );
}
