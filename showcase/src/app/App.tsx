/* ARTINOS UI — full showcase. Every control on this page is live and comes from
   ../src (the package) exactly as a consuming app would import it.
   The app shell: theme / density / backdrop state, view routing (page · #studio · #themes),
   the top bar, the page (hero, index, chapters) and the Export kit dialog (#export). */
import { useEffect, useState } from 'react';
import { ACCENTS, ACCENT_META, ArtinosTheme, Button, DENSITIES, GLASS_THEMES, RollingValue, Segmented, Select, THEMES, THEME_META, TYPE_COLLECTIONS } from '../../../src';
import type { Density, ThemeName } from '../../../src';
import { ComponentChapters } from '../chapters';
import { FoundationsChapter } from '../chapters/Foundations';
import { MakeItYoursChapter } from '../chapters/MakeItYours';
import { CHAPTERS, SECTIONS, chapterAnchor, chapterNumber, sectionAnchor } from '../chapters/registry';
import { ExportKit } from '../export/ExportKit';
import { KIT_COMPONENTS } from '../export/kit';
import { BACKDROPS, BACKDROP_OPTIONS, LIGHT_BACKDROPS, Swatch, THEME_OPTIONS, TYPE_OPTIONS } from '../shared';
import type { Backdrop } from '../shared';
import { ThemeStudio } from '../studio/ThemeStudio';
import { ThemesPage } from '../themes/ThemesPage';
import { loadThemes, saveThemes } from '../studio/store';
import type { CustomTheme } from '../studio/store';

export function App() {
  // ?theme=frost&density=dense&backdrop=monstera — links straight to a look
  const q = new URLSearchParams(location.search);
  const pick = <T extends string>(k: string, list: readonly T[], d: T) => (list.includes(q.get(k) as T) ? (q.get(k) as T) : d);
  const [theme, setTheme] = useState<string>(pick('theme', THEMES, 'frost-deep'));
  const [customs, setCustoms] = useState<CustomTheme[]>(() => loadThemes());
  type View = 'showcase' | 'studio' | 'themes';
  const viewOf = (): View => (location.hash === '#studio' ? 'studio' : location.hash === '#themes' ? 'themes' : 'showcase');
  const [view, setView] = useState<View>(viewOf);
  useEffect(() => {
    const h = () => setView(viewOf());
    window.addEventListener('hashchange', h);
    window.addEventListener('popstate', h);
    return () => {
      window.removeEventListener('hashchange', h);
      window.removeEventListener('popstate', h);
    };
  }, []);
  const go = (v: View) => {
    history.pushState(null, '', v === 'showcase' ? location.pathname + location.search : '#' + v);
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

  // A link straight to a chapter or section (#c-sliders, #s-meters): the browser tries to scroll
  // before the page has rendered, so scroll once the anchor exists.
  useEffect(() => {
    const id = location.hash.slice(1);
    if (view !== 'showcase' || !/^[cs]-/.test(id)) return;
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'instant' as ScrollBehavior }));
    return () => cancelAnimationFrame(frame);
  }, [view]);

  const [density, setDensity] = useState<Density>(pick('density', DENSITIES, 'standard'));
  const [type, setType] = useState<string>(pick('type', TYPE_COLLECTIONS, 'instrument'));
  const [accent, setAccent] = useState<string>(pick('accent', ['theme', ...ACCENTS] as const, 'theme'));
  const [bg, setBg] = useState<Backdrop>(pick('backdrop', ['none', 'garden', 'monstera', 'studio'] as const, 'garden'));
  const [exporting, setExporting] = useState(() => location.hash === '#export');

  if (view === 'studio')
    return (
      <ThemeStudio
        customs={customs}
        onCustomsChange={updateCustoms}
        initial={theme}
        type={type}
        onExit={(use) => {
          if (use) setTheme(use);
          go('showcase');
        }}
      />
    );

  if (view === 'themes')
    return (
      <ThemesPage
        initial={baseTheme}
        accent={accent}
        onAccent={setAccent}
        bg={bg}
        onBg={setBg}
        type={type}
        density={density}
        onUse={(t) => {
          setTheme(t);
          go('showcase');
        }}
        onExit={() => go('showcase')}
      />
    );

  return (
    <ArtinosTheme theme={baseTheme} tokens={custom?.tokens} density={density} type={type} accent={accent === 'theme' ? undefined : (accent as (typeof ACCENTS)[number])} scene={LIGHT_BACKDROPS.has(bg) ? 'light' : undefined} ground className="sc-root">
      {bg !== 'none' ? <div className="sc-backdrop" style={{ backgroundImage: `url(${BACKDROPS[bg]})` }} /> : null}

      <header className="sc-bar">
        <a className="sc-brand" href="#top" aria-label="ARTINOS UI, back to the top">
          <span className="sc-mark">#</span>
          <span className="sc-word">ARTINOS</span>
          <i className="sc-rule" />
          <span className="sc-sub">UI · Showcase</span>
        </a>
        <label className="sc-pick sc-pick--theme">
          <span>Theme</span>
          <Select options={themeOptions} value={theme} onChange={setTheme} appearance="well" label="Theme" />
        </label>
        <label className="sc-pick">
          <span>Type</span>
          <Select options={TYPE_OPTIONS} value={type} onChange={setType} appearance="well" label="Type collection" />
        </label>
        <label className="sc-pick">
          <span>Accent</span>
          <Select options={[{ value: 'theme', label: 'Theme' }, ...ACCENTS.map((a) => ({ value: a, label: ACCENT_META[a].label }))]} value={accent} onChange={setAccent} appearance="well" label="Accent" />
        </label>
        <label className="sc-pick">
          <span>Density</span>
          <Segmented options={DENSITIES} value={density} onChange={setDensity} label="Density" />
        </label>
        <label className="sc-pick">
          <span>Backdrop</span>
          <Select options={BACKDROP_OPTIONS} value={bg} onChange={(v) => setBg(v as Backdrop)} appearance="well" label="Backdrop" />
        </label>
        <span className="sc-bar__actions">
          <Button size="sm" onClick={() => go('themes')}>
            Themes
          </Button>
          <Button size="sm" onClick={() => setExporting(true)}>
            Export kit
          </Button>
          <Button variant="primary" size="sm" onClick={() => go('studio')}>
            Theme Studio
          </Button>
        </span>
      </header>

      <main className="sc-sheet" id="top">
        <Hero onStudio={() => go('studio')} onExport={() => setExporting(true)} />

        <div className="sc-layout">
          <PageIndex />
          <div className="sc-content">
            <FoundationsChapter theme={theme} onPickTheme={setTheme} type={type} onPickType={setType} />
            <ComponentChapters />
            <MakeItYoursChapter customs={customs.length} onStudio={() => go('studio')} onExport={() => setExporting(true)} />
          </div>
        </div>

        <footer className="sc-foot">
          <span>
            ARTINOS UI · {custom ? custom.name : THEME_META[baseTheme].label} · {THEME_META[baseTheme].kind} · {density}
          </span>
          <span>copy → paste → import → use</span>
        </footer>
      </main>

      {exporting ? <ExportKit customs={customs} current={theme} onClose={() => setExporting(false)} /> : null}
    </ArtinosTheme>
  );
}

/* ---------- hero ---------- */

function Hero({ onStudio, onExport }: { onStudio: () => void; onExport: () => void }) {
  const componentChapters = CHAPTERS.filter((c) => !c.meta);
  return (
    <section className="sc-hero">
      <div className="sc-hero__lede">
        <span className="sc-hero__kicker">A precision-instrument control system for React</span>
        <h1>ARTINOS UI</h1>
        <p>
          One compact surface per parameter: the capsule is the control, the seam is the handle, the readout is the precision zone. Every component is made of the same five materials and
          follows any of {THEMES.length} themes. Everything on this page is live — switch the theme in the bar, or build your own.
        </p>
        <div className="sc-hero__actions">
          <Button variant="primary" onClick={onStudio}>
            Open Theme Studio
          </Button>
          <Button onClick={onExport}>Export a kit</Button>
          <a className="sc-hero__link" href={'#' + chapterAnchor('foundations')}>
            Start with the foundations
          </a>
        </div>
      </div>
      <div className="sc-hero__side">
        <div className="sc-stats">
          <div className="sc-stat">
            <b>
              <CountUp to={THEMES.length} />
            </b>
            <span>Themes</span>
          </div>
          <div className="sc-stat">
            <b>
              <CountUp to={GLASS_THEMES.length} delay={120} />
            </b>
            <span>GLASS &amp; FROST</span>
          </div>
          <div className="sc-stat">
            <b>
              <CountUp to={KIT_COMPONENTS.length} delay={240} />
            </b>
            <span>Components</span>
          </div>
        </div>
        <nav className="sc-hero__map" aria-label="Component chapters">
          {componentChapters.map((c) => (
            <a key={c.id} href={'#' + chapterAnchor(c.id)}>
              <span className="sc-num">{chapterNumber(c.id)}</span>
              <b>{c.title}</b>
              <span className="sc-hero__count">{c.components?.length ?? 0}</span>
            </a>
          ))}
        </nav>
      </div>
    </section>
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

/* ---------- index ---------- */

/**
 * The page index: every chapter, and the sections of the one you are reading. The section on
 * screen is lit with the signal LED; the index scrolls itself to keep it in view.
 */
function PageIndex() {
  const [active, setActive] = useState<string>(CHAPTERS[0].sections[0].id);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = Math.min(220, window.innerHeight * 0.3);
      // in document order a chapter comes before its sections; a chapter heading that has
      // reached the line already counts as its first section
      const marks = document.querySelectorAll<HTMLElement>('.sc-content [data-chapter], .sc-content [data-section]');
      let current: string | undefined;
      for (const el of marks) {
        if (el.getBoundingClientRect().top > line) break;
        current = el.dataset.section ?? CHAPTERS.find((c) => c.id === el.dataset.chapter)?.sections[0].id;
      }
      setActive(current ?? CHAPTERS[0].sections[0].id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  // keep the lit row visible inside the index's own scroll
  useEffect(() => {
    document.querySelector('.sc-index [data-active-section]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);
  const activeChapter = SECTIONS.get(active)?.chapter.id;
  return (
    <nav className="sc-index" aria-label="Contents">
      {CHAPTERS.map((chapter) => {
        const open = chapter.id === activeChapter;
        return (
          <div key={chapter.id} className="sc-index__chapter" data-open={open || undefined}>
            <a href={'#' + chapterAnchor(chapter.id)} className="sc-index__head">
              <span className="sc-num">{chapterNumber(chapter.id)}</span>
              <b>{chapter.title}</b>
            </a>
            <div className="sc-index__fold">
              <div className="sc-index__sections">
                {chapter.sections.map((section) => (
                  <a
                    key={section.id}
                    href={'#' + sectionAnchor(section.id)}
                    data-active-section={section.id === active || undefined}
                    tabIndex={open ? undefined : -1}
                  >
                    {section.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
