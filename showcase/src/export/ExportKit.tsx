/* Export kit dialog — pick themes and components, get a ready-to-paste folder. */
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Field, Switch, THEMES, THEME_META } from '../../../artinos-ui';
import type { ThemeName } from '../../../artinos-ui';
import { Swatch } from '../shared';
import { collectTokenNames } from '../studio/spec';
import { download, slugify, toCss } from '../studio/store';
import type { CustomTheme } from '../studio/store';
import { BASE_THEME, buildKit, KIT_COMPONENTS } from './kit';
import type { CustomThemeCss } from './kit';
import { zip } from './zip';
import './export.css';

const FAMILY_LABEL: Record<string, string> = {
  studio: 'Studio',
  signature: 'Signature',
  glass: 'Glass',
  frost: 'Frost',
  clear: 'Optical glass',
  'clear-frost': 'Optical frost',
  'untinted-glass': 'Untinted glass',
  'untinted-frost': 'Untinted frost',
  'atelier-glass': 'Atelier glass',
  'atelier-frost': 'Atelier frost',
  luxe: 'Luxe glass',
  'luxe-frost': 'Luxe frost',
};

/* File System Access API — Chromium only, so typed locally. */
interface DirHandle {
  getDirectoryHandle(name: string, o?: { create?: boolean }): Promise<DirHandle>;
  getFileHandle(name: string, o?: { create?: boolean }): Promise<{ createWritable(): Promise<{ write(d: string): Promise<void>; close(): Promise<void> }> }>;
}
type DirPicker = (o?: { mode?: 'readwrite' }) => Promise<DirHandle>;
const dirPicker = (window as unknown as { showDirectoryPicker?: DirPicker }).showDirectoryPicker;

/** A saved theme as standalone CSS: every token resolved from its base plus the overrides. */
function customCss(c: CustomTheme, names: string[]): CustomThemeCss {
  const probe = document.createElement('div');
  probe.setAttribute('data-ar-theme', c.base);
  for (const [k, v] of Object.entries(c.tokens)) probe.style.setProperty(k, v);
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const resolved: Record<string, string> = {};
  for (const n of names) resolved[n] = cs.getPropertyValue(n).trim();
  const scheme = cs.colorScheme.includes('light') ? 'light' : 'dark';
  probe.remove();
  return { slug: slugify(c.name), name: c.name, css: toCss(c.name, c.base, resolved, c.tokens, scheme) };
}

const kb = (n: number) => (n < 1024 ? n + ' B' : (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB');

export function ExportKit({ customs, current, onClose }: { customs: CustomTheme[]; current: string; onClose: () => void }) {
  const [themes, setThemes] = useState<string[]>(() => (current.startsWith('c:') ? [] : [current]));
  const [customIds, setCustomIds] = useState<string[]>(() => (current.startsWith('c:') ? [current.slice(2)] : []));
  const [comps, setComps] = useState<string[]>(() => KIT_COMPONENTS.map((c) => c.id));
  const [folder, setFolder] = useState('artinos-ui');
  const [googleFonts, setGoogleFonts] = useState(true);
  const [materials, setMaterials] = useState(true);
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const tokenNames = useMemo(() => collectTokenNames(), []);
  const customCssList = useMemo(() => customs.filter((c) => customIds.includes(c.id)).map((c) => customCss(c, tokenNames)), [customs, customIds, tokenNames]);
  const safeFolder = folder.trim().replace(/[^\w.-]+/g, '-') || 'artinos-ui';
  const files = useMemo(
    () => buildKit({ folder: safeFolder, themes, components: comps, customs: customCssList, googleFonts, materials }),
    [safeFolder, themes, comps, customCssList, googleFonts, materials],
  );
  const total = Object.values(files).reduce((n, s) => n + new Blob([s]).size, 0);
  const nThemes = new Set([BASE_THEME, ...themes]).size + customCssList.length;

  const families = useMemo(() => {
    const m = new Map<string, ThemeName[]>();
    for (const t of THEMES) m.set(THEME_META[t].family, [...(m.get(THEME_META[t].family) ?? []), t]);
    return [...m.entries()];
  }, []);

  type SetList = (f: (l: string[]) => string[]) => void;
  const flip = (set: SetList, v: string) => set((list) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]));
  const setFamily = (ts: string[], on: boolean) => setThemes((list) => (on ? [...new Set([...list, ...ts])] : list.filter((t) => !ts.includes(t))));

  const saveZip = () => {
    const blob = zip(Object.fromEntries(Object.entries(files).map(([p, s]) => [safeFolder + '/' + p, s])));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFolder + '.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(`Downloaded ${safeFolder}.zip — ${Object.keys(files).length} files.`);
  };

  const saveFolder = async () => {
    if (!dirPicker) return;
    try {
      const parent = await dirPicker({ mode: 'readwrite' });
      const root = await parent.getDirectoryHandle(safeFolder, { create: true });
      for (const [path, text] of Object.entries(files)) {
        const segs = path.split('/');
        let dir = root;
        for (const s of segs.slice(0, -1)) dir = await dir.getDirectoryHandle(s, { create: true });
        const w = await (await dir.getFileHandle(segs[segs.length - 1], { create: true })).createWritable();
        await w.write(text);
        await w.close();
      }
      setStatus(`Wrote ${Object.keys(files).length} files into …/${safeFolder}/`);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setStatus('Could not write the folder: ' + (e as Error).message);
    }
  };

  return (
    <div className="xk" role="dialog" aria-modal="true" aria-label="Export kit" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="xk__card">
        <header className="xk__head">
          <div>
            <b>Export kit</b>
            <span>Pick themes and components. You get a trimmed, copy-paste folder with every file they need — nothing else.</span>
          </div>
          <button type="button" className="xk__x" aria-label="Close" onClick={onClose}>✕</button>
        </header>

        <div className="xk__body">
          <section className="xk__col xk__col--themes">
            <div className="xk__sub">
              Themes <em>{nThemes}</em>
              <span className="xk__links">
                <button type="button" onClick={() => setThemes([...THEMES])}>all</button>
                <button type="button" onClick={() => { setThemes([]); setCustomIds([]); }}>none</button>
              </span>
            </div>
            <p className="xk__note">
              <b>Studio</b> is always included: it is the base every theme builds on.
            </p>
            {customs.length ? (
              <div className="xk__fam">
                <div className="xk__famhead">
                  Your saved themes
                  <span className="xk__links">
                    <button type="button" onClick={() => setCustomIds(customs.map((c) => c.id))}>all</button>
                    <button type="button" onClick={() => setCustomIds([])}>none</button>
                  </span>
                </div>
                <div className="xk__chips">
                  {customs.map((c) => (
                    <button key={c.id} type="button" className="xk__chip" aria-pressed={customIds.includes(c.id)} onClick={() => flip(setCustomIds, c.id)}>
                      <Swatch t={c.base} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {families.map(([fam, ts]) => {
              const allOn = ts.every((t) => t === BASE_THEME || themes.includes(t));
              return (
                <div key={fam} className="xk__fam">
                  <div className="xk__famhead">
                    {FAMILY_LABEL[fam] ?? fam}
                    <span className="xk__links">
                      <button type="button" onClick={() => setFamily(ts, !allOn)}>{allOn ? 'none' : 'all'}</button>
                    </span>
                  </div>
                  <div className="xk__chips">
                    {ts.map((t) => {
                      const base = t === BASE_THEME;
                      return (
                        <button
                          key={t}
                          type="button"
                          className="xk__chip"
                          aria-pressed={base || themes.includes(t)}
                          disabled={base}
                          title={THEME_META[t].description}
                          onClick={() => flip(setThemes, t)}
                        >
                          <Swatch t={t} />
                          {THEME_META[t].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>

          <section className="xk__col">
            <div className="xk__sub">
              Components <em>{comps.length}</em>
              <span className="xk__links">
                <button type="button" onClick={() => setComps(KIT_COMPONENTS.map((c) => c.id))}>all</button>
                <button type="button" onClick={() => setComps([])}>none</button>
              </span>
            </div>
            <div className="xk__comps">
              {KIT_COMPONENTS.map((c) => (
                <button key={c.id} type="button" className="xk__comp" aria-pressed={comps.includes(c.id)} onClick={() => flip(setComps, c.id)}>
                  <i className="xk__tick" />
                  <b>{c.label}</b>
                  <span>{c.note}</span>
                </button>
              ))}
            </div>
            <p className="xk__note">Shared helpers (hooks, formatting, the theme scope) come along automatically when a component needs them.</p>

            <div className="xk__sub">Options</div>
            <label className="xk__field">
              <span>Folder name</span>
              <input value={folder} onChange={(e) => setFolder(e.target.value)} spellCheck={false} />
            </label>
            <div className="xk__opts">
              <Field label="Google Fonts" labelWidth={120}><Switch variant="compact" label="Google Fonts" value={googleFonts} onChange={setGoogleFonts} /></Field>
              <Field label="Finish overrides" labelWidth={120}><Switch variant="compact" label="Finish overrides" value={materials} onChange={setMaterials} /></Field>
            </div>
            <p className="xk__note">
              Google Fonts loads Chivo and Chivo Mono; off, the kit uses system fonts. Finish overrides keep the optional <code>material</code> prop.
            </p>
          </section>

          <section className="xk__col xk__col--files">
            <div className="xk__sub">
              Files <em>{Object.keys(files).length}</em> <span className="xk__size">{kb(total)}</span>
            </div>
            <ul className="xk__files">
              {Object.entries(files).map(([p, s]) => (
                <li key={p}>
                  <button type="button" aria-expanded={open === p} onClick={() => setOpen(open === p ? null : p)}>
                    <span className="xk__path">
                      {p.includes('/') ? <i>{p.slice(0, p.lastIndexOf('/') + 1)}</i> : null}
                      {p.slice(p.lastIndexOf('/') + 1)}
                    </span>
                    <span className="xk__kb">{kb(new Blob([s]).size)}</span>
                  </button>
                  {open === p ? <pre className="xk__pre">{s.length > 12000 ? s.slice(0, 12000) + '\n…' : s}</pre> : null}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="xk__foot">
          <span className="xk__status" style={{ '--on': status ? 1 : 0 } as CSSProperties}>
            {status || `${safeFolder}/ — ${nThemes} theme${nThemes === 1 ? '' : 's'}, ${comps.length} component${comps.length === 1 ? '' : 's'}. Needs only react and react-dom.`}
          </span>
          <button type="button" className="xk__btn" onClick={() => download('README.md', files['README.md'], 'text/markdown')}>README only</button>
          {dirPicker ? (
            <button type="button" className="xk__btn" onClick={saveFolder}>Write to folder…</button>
          ) : null}
          <button type="button" className="xk__btn xk__btn--primary" onClick={saveZip}>Download .zip</button>
        </footer>
      </div>
    </div>
  );
}
