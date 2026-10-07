import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArtinosTheme, THEMES, THEME_META, DENSITIES, Slider, Segmented, Select, ColorField, Switch, Field, Section } from '../../../src';
import type { Density, ThemeName } from '../../../src';
import { BACKDROPS, BACKDROP_OPTIONS, GalleryMode, Swatch } from '../shared';
import type { Backdrop } from '../shared';
import { ComponentChapters } from '../chapters';
import { GROUPS, collectTokenNames } from './spec';
import type { Param } from './spec';
import { inspectAt } from './inspect';
import type { Picked } from './inspect';
import {
  toHex8, hexToCss,
  parseFilter, buildFilter, parseGradient, buildGradient, parseInsertShadow, buildInsertShadow, parseWell, buildWell,
  parsePanelShadow, buildPanelShadow, parseSheen, buildSheen, parseHalo, buildHalo, parseFocus, buildFocus,
} from './values';
import { download, fromJson, newId, slugify, toCss, toJson, toTsx } from './store';
import type { CustomTheme } from './store';
import './studio.css';

/* Theme Studio — tune every token of a theme live against the complete component
   gallery, then save it, export it as CSS / JSON / TSX, or use it in the showcase. */

type Tokens = Record<string, string>;
interface Draft {
  /** saved theme being edited, or null for an unsaved draft on a built-in */
  id: string | null;
  name: string;
  base: ThemeName;
  tokens: Tokens;
}

const Gallery = memo(function Gallery() {
  return (
    <GalleryMode.Provider value={{ code: false, compact: true }}>
      <ComponentChapters />
    </GalleryMode.Provider>
  );
});

/**
 * Manual entry for any value. Shows the live value; typing edits a local draft that
 * applies on Enter or blur (Escape cancels). Numeric fields nudge with ↑/↓
 * (Shift ×10, Alt ×0.1).
 */
function ValueInput({ value, onCommit, numeric, step = 1, label, className }: { value: string; onCommit: (v: string) => void; numeric?: boolean; step?: number; label: string; className?: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const d = draft.trim();
    setDraft(null);
    if (d !== value.trim()) onCommit(d);
  };
  return (
    <input
      className={'ed-input ed-input--mono ed-val' + (numeric ? ' ed-val--num' : '') + (className ? ' ' + className : '')}
      value={draft ?? value}
      spellCheck={false}
      aria-label={label}
      title={value}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
          e.currentTarget.blur();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setDraft(null);
          e.currentTarget.blur();
        } else if (numeric && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault();
          const n = parseFloat(draft ?? value);
          if (!Number.isFinite(n)) return;
          const k = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
          const next = +(n + (e.key === 'ArrowUp' ? 1 : -1) * step * k).toFixed(4);
          setDraft(null);
          onCommit(String(next));
        }
      }}
    />
  );
}

/** A bare number typed into a unit field gets the unit. */
const withUnit = (v: string, unit: string) => (unit && /^-?\d*\.?\d+$/.test(v) ? v + unit : v);

const same = (a: Tokens, b: Tokens) => {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
};

export interface ThemeStudioProps {
  customs: CustomTheme[];
  onCustomsChange: (list: CustomTheme[]) => void;
  /** Leave the studio; `use` = theme selection to apply to the showcase. */
  onExit: (use?: string) => void;
  /** Initial selection: a built-in name or `c:<id>`. */
  initial?: string;
  /** the page's type collection, so the editor and its preview are set in the same faces */
  type?: string;
}

export function ThemeStudio({ customs, onCustomsChange, onExit, initial, type }: ThemeStudioProps) {
  const open = (sel: string | undefined): Draft => {
    const c = sel?.startsWith('c:') ? customs.find((t) => t.id === sel.slice(2)) : undefined;
    if (c) return { id: c.id, name: c.name, base: c.base, tokens: { ...c.tokens } };
    const base = (THEMES as readonly string[]).includes(sel ?? '') ? (sel as ThemeName) : 'frost-deep';
    return { id: null, name: THEME_META[base].label + ' custom', base, tokens: {} };
  };

  const [draft, setDraft] = useState<Draft>(() => open(initial));
  const [saved, setSaved] = useState<Tokens>(() => ({ ...draft.tokens }));
  const past = useRef<Tokens[]>([]);
  const future = useRef<Tokens[]>([]);
  const lastEdit = useRef({ token: '', t: 0 });
  const [, bump] = useState(0);

  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ signal: true, panel: true, insert: true });
  const [compare, setCompare] = useState(false);
  const [backdrop, setBackdrop] = useState<Backdrop>('garden');
  const [density, setDensity] = useState<Density>('standard');
  const [modal, setModal] = useState<null | 'export' | 'import' | 'delete'>(null);
  const [exportTab, setExportTab] = useState<'css' | 'json' | 'tsx'>('css');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [toast, setToast] = useState('');

  /* inspect: pick an element in the preview, edit only what it reads */
  const [picking, setPicking] = useState(false);
  const [hover, setHover] = useState<{ rect: DOMRect; title: string } | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [pickRect, setPickRect] = useState<DOMRect | null>(null);
  const groupsRef = useRef<HTMLDivElement>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const tokenNames = useMemo(() => collectTokenNames(), []);
  const [live, setLive] = useState<Tokens>({});
  const [scheme, setScheme] = useState('dark');

  /* read every resolved token from the preview after each change */
  useLayoutEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const next: Tokens = {};
    for (const n of tokenNames) next[n] = cs.getPropertyValue(n).trim();
    setLive(next);
    setScheme(cs.colorScheme.includes('light') ? 'light' : 'dark');
  }, [draft.tokens, draft.base, compare, tokenNames]);

  useLayoutEffect(() => {
    if (!picked) {
      setPickRect(null);
      return;
    }
    const update = () => setPickRect(picked.el.isConnected ? picked.el.getBoundingClientRect() : null);
    update();
    window.addEventListener('resize', update);
    const id = window.setInterval(update, 400); // controls move as you edit them
    return () => {
      window.removeEventListener('resize', update);
      window.clearInterval(id);
    };
  }, [picked, live, density]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((m) => (m === msg ? '' : m)), 1800);
  };

  /* ---------- edits + history ---------- */
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const commit = useCallback((next: Tokens, token = '') => {
    const now = performance.now();
    // a drag on one control coalesces into one undo step
    if (!(token && token === lastEdit.current.token && now - lastEdit.current.t < 600)) {
      past.current.push(draftRef.current.tokens);
      if (past.current.length > 200) past.current.shift();
    }
    lastEdit.current = { token, t: now };
    future.current = [];
    setDraft((d) => ({ ...d, tokens: next }));
  }, []);
  const setToken = (token: string, value: string) => commit({ ...draftRef.current.tokens, [token]: value }, token);
  const resetToken = (token: string) => {
    const t = { ...draftRef.current.tokens };
    delete t[token];
    commit(t);
  };
  const resetGroup = (g: (typeof GROUPS)[number]) => {
    const t = { ...draft.tokens };
    for (const p of g.params) delete t[p.token];
    commit(t);
  };
  const undo = () => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(draft.tokens);
    lastEdit.current = { token: '', t: 0 };
    setDraft((d) => ({ ...d, tokens: prev }));
    bump((n) => n + 1);
  };
  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(draft.tokens);
    lastEdit.current = { token: '', t: 0 };
    setDraft((d) => ({ ...d, tokens: next }));
    bump((n) => n + 1);
  };
  const undoRef = useRef({ undo, redo });
  undoRef.current = { undo, redo };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return;
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return;
      e.preventDefault();
      if (e.shiftKey) undoRef.current.redo();
      else undoRef.current.undo();
    };
    window.addEventListener('keydown', h);
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setPicking((v) => !v);
        setHover(null);
      } else if (e.key === 'Escape') {
        setPicking((v) => {
          if (!v) setPicked(null);
          return false;
        });
        setHover(null);
      }
    };
    window.addEventListener('keydown', k);
    return () => {
      window.removeEventListener('keydown', h);
      window.removeEventListener('keydown', k);
    };
  }, []);

  /* ---------- library ---------- */
  const dirty = !same(draft.tokens, saved) || (draft.id !== null && customs.find((c) => c.id === draft.id)?.name !== draft.name);
  const selection = draft.id ? 'c:' + draft.id : draft.base;
  const switchTo = (sel: string) => {
    const d = open(sel);
    setDraft(d);
    setSaved({ ...d.tokens });
    past.current = [];
    future.current = [];
    bump((n) => n + 1);
  };
  const persist = (list: CustomTheme[]) => onCustomsChange(list);
  const save = () => {
    if (!draft.id) return saveAsNew();
    persist(customs.map((c) => (c.id === draft.id ? { ...c, name: draft.name, base: draft.base, tokens: { ...draft.tokens }, updated: Date.now() } : c)));
    setSaved({ ...draft.tokens });
    flash('Saved');
  };
  const saveAsNew = () => {
    const id = newId();
    const taken = new Set(customs.map((c) => c.name));
    let name = draft.name || 'My theme';
    for (let i = 2; taken.has(name); i++) name = `${draft.name} ${i}`;
    persist([...customs, { id, name, base: draft.base, tokens: { ...draft.tokens }, updated: Date.now() }]);
    setDraft((d) => ({ ...d, id, name }));
    setSaved({ ...draft.tokens });
    flash('Saved as “' + name + '”');
  };
  const duplicate = () => {
    const id = newId();
    const name = draft.name + ' copy';
    persist([...customs, { id, name, base: draft.base, tokens: { ...draft.tokens }, updated: Date.now() }]);
    setDraft((d) => ({ ...d, id, name }));
    setSaved({ ...draft.tokens });
    flash('Duplicated');
  };
  const remove = () => {
    if (!draft.id) return;
    persist(customs.filter((c) => c.id !== draft.id));
    switchTo(draft.base);
    setModal(null);
    flash('Deleted');
  };
  const revert = () => {
    commit({ ...saved });
    flash('Reverted to last save');
  };
  const changeBase = (b: ThemeName) => setDraft((d) => ({ ...d, base: b }));

  const doImport = () => {
    try {
      const t = fromJson(importText);
      const id = newId();
      persist([...customs, { id, name: t.name, base: t.base, tokens: t.tokens, updated: Date.now() }]);
      setDraft({ id, name: t.name, base: t.base, tokens: { ...t.tokens } });
      setSaved({ ...t.tokens });
      past.current = [];
      future.current = [];
      setModal(null);
      setImportText('');
      setImportError('');
      flash('Imported “' + t.name + '”');
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Could not read that file.');
    }
  };

  /* ---------- export ---------- */
  const overridesCount = Object.keys(draft.tokens).length;
  const exportText = useMemo(() => {
    if (modal !== 'export') return '';
    if (exportTab === 'json') return toJson(draft);
    if (exportTab === 'tsx') return toTsx(draft.name, draft.base, draft.tokens);
    return toCss(draft.name, draft.base, live, draft.tokens, scheme);
  }, [modal, exportTab, draft, live, scheme]);
  const exportFile = () => {
    const slug = slugify(draft.name);
    if (exportTab === 'json') download(slug + '.theme.json', exportText, 'application/json');
    else if (exportTab === 'tsx') download(slug + '.tsx', exportText, 'text/plain');
    else download(slug + '.css', exportText, 'text/css');
  };

  /* ---------- parameter controls ---------- */
  const v = (token: string) => live[token] ?? '';
  const changed = (token: string) => token in draft.tokens;
  const q = search.trim().toLowerCase();
  const matches = (p: Param) => !q || p.label.toLowerCase().includes(q) || p.token.includes(q);

  /* every row: the visual control, the raw value typed by hand, and a reset */
  const pickedTokens = new Set(picked ? picked.parts.flatMap((pt) => pt.tokens) : []);
  const allParams = GROUPS.flatMap((g) => g.params);
  const paramFor = (token: string): Param => allParams.find((x) => x.token === token) ?? { kind: 'text', token, label: token.replace('--ar-', '') };

  const row = (p: Param, control: ReactNode) => {
    const unit = p.kind === 'length' ? p.unit : '';
    return (
      <div key={p.token} className="ed-row" data-changed={changed(p.token) ? '' : undefined} data-picked={pickedTokens.has(p.token) ? '' : undefined}>
        <div className="ed-row__control">{control}</div>
        <ValueInput
          label={p.label + ' value'}
          value={v(p.token)}
          numeric={p.kind === 'length'}
          step={p.kind === 'length' ? p.step ?? 1 : 1}
          onCommit={(x) => (x === '' ? resetToken(p.token) : setToken(p.token, withUnit(x, unit)))}
        />
        <button type="button" className="ed-reset" title={'Reset ' + p.token} aria-label={'Reset ' + p.label} disabled={!changed(p.token)} onClick={() => resetToken(p.token)}>
          ↺
        </button>
      </div>
    );
  };
  /* composite values: their parts as controls, plus the whole CSS value typed by hand */
  const sub = (p: Param, children: ReactNode | null) => (
    <div key={p.token} className="ed-sub" data-changed={changed(p.token) ? '' : undefined} data-picked={pickedTokens.has(p.token) ? '' : undefined}>
      <div className="ed-sub__head">
        <span>{p.label}</span>
        <code>{p.token.replace('--ar-', '')}</code>
        <button type="button" className="ed-reset" aria-label={'Reset ' + p.label} disabled={!changed(p.token)} onClick={() => resetToken(p.token)}>
          ↺
        </button>
      </div>
      <ValueInput label={p.label + ' CSS'} value={v(p.token)} className="ed-val--wide" onCommit={(x) => (x === '' ? resetToken(p.token) : setToken(p.token, x))} />
      {children}
    </div>
  );
  const S = (label: string, value: number, min: number, max: number, set: (n: number) => void, decimals = 2, unit?: string, step?: number) => (
    <div className="ed-slide">
      <Slider label={label} value={Math.min(max, Math.max(min, value))} min={min} max={max} decimals={decimals} unit={unit} step={step} onChange={set} density="dense" toggleable={false} />
      <ValueInput
        label={label + ' value'}
        numeric
        step={step ?? (decimals >= 2 ? 0.01 : decimals === 1 ? 0.1 : 1)}
        value={String(+value.toFixed(Math.max(decimals, 2)))}
        onCommit={(x) => {
          const n = parseFloat(x);
          if (Number.isFinite(n)) set(n);
        }}
      />
    </div>
  );
  const C = (label: string, hex: string, set: (h: string) => void) => <ColorField label={label} alpha value={hex} onChange={set} density="dense" />;

  const control = (p: Param): ReactNode => {
    const cur = v(p.token);
    switch (p.kind) {
      case 'color':
        return row(p, C(p.label, toHex8(cur, '#00000000'), (h) => setToken(p.token, hexToCss(h))));
      case 'length': {
        const n = parseFloat(cur);
        // the row's own value field is the manual entry here
        return row(
          p,
          <Slider label={p.label} value={Math.min(p.max, Math.max(p.min, Number.isFinite(n) ? n : p.min))} min={p.min} max={p.max} decimals={p.decimals ?? 0} unit={p.unit || undefined} step={p.step} onChange={(x) => setToken(p.token, +x.toFixed(4) + p.unit)} density="dense" toggleable={false} />,
        );
      }
      case 'select': {
        const opt = p.options.find((o) => o.value === cur) ?? p.options.find((o) => cur.includes(o.label)) ?? p.options.find((o) => cur.startsWith(o.value.split(',')[0]));
        return row(p, <Field label={p.label}><Select options={p.options} value={opt?.value} label={p.label} appearance="well" onChange={(x) => setToken(p.token, x)} density="dense" /></Field>);
      }
      case 'filter': {
        const f = parseFilter(cur);
        const set = (k: keyof typeof f) => (x: number) => setToken(p.token, buildFilter({ ...f, [k]: x }));
        return sub(p, <>{S('Blur', f.blur, 0, 120, set('blur'), 0, 'px')}{S('Saturate', f.saturate, 0, 2.5, set('saturate'))}{S('Brightness', f.brightness, 0.4, 1.6, set('brightness'))}{S('Contrast', f.contrast, 0.5, 1.6, set('contrast'))}</>);
      }
      case 'gradient': {
        const g = parseGradient(cur);
        return sub(p, <>{C('Top', g.top, (h) => setToken(p.token, buildGradient({ ...g, top: h })))}{C('Bottom', g.bottom, (h) => setToken(p.token, buildGradient({ ...g, bottom: h })))}</>);
      }
      case 'insertShadow': {
        const s = parseInsertShadow(cur);
        const set = (k: 'gloss' | 'outline' | 'drop') => (x: number) => setToken(p.token, buildInsertShadow({ ...s, [k]: x }));
        return sub(p, <>{S('Gloss', s.gloss, 0, 1, set('gloss'))}{C('Rim', s.rim, (h) => setToken(p.token, buildInsertShadow({ ...s, rim: h })))}{S('Outline', s.outline, 0, 1, set('outline'))}{S('Drop', s.drop, 0, 1, set('drop'))}</>);
      }
      case 'well': {
        const w = parseWell(cur);
        const set = (k: 'depth' | 'soft' | 'lip') => (x: number) => setToken(p.token, buildWell({ ...w, [k]: x }));
        return sub(p, <>{S('Depth', w.depth, 0, 1, set('depth'))}{S('Softness', w.soft, 0, 6, set('soft'), 1, 'px')}{C('Edge', w.edge, (h) => setToken(p.token, buildWell({ ...w, edge: h })))}{S('Lip', w.lip, 0, 1, set('lip'))}</>);
      }
      case 'panelShadow': {
        const s = parsePanelShadow(cur);
        const set = (k: 'highlight' | 'drop') => (x: number) => setToken(p.token, buildPanelShadow({ ...s, [k]: x }));
        return sub(p, <>{C('Edge', s.edge, (h) => setToken(p.token, buildPanelShadow({ ...s, edge: h })))}{S('Top highlight', s.highlight, 0, 1, set('highlight'))}{S('Drop shadow', s.drop, 0, 1, set('drop'))}</>);
      }
      case 'sheen': {
        const s = parseSheen(cur);
        return sub(p, <>{S('Strength', s.strength, 0, 0.6, (x) => setToken(p.token, buildSheen({ ...s, strength: x })))}{S('Reach', s.reach, 10, 100, (x) => setToken(p.token, buildSheen({ ...s, reach: x })), 0, '%')}</>);
      }
      case 'halo': {
        const h = parseHalo(cur);
        return sub(p, <>{C('Colour', h.color, (x) => setToken(p.token, buildHalo({ ...h, color: x })))}{S('Blur', h.blur, 0, 8, (x) => setToken(p.token, buildHalo({ ...h, blur: x })), 1, 'px')}</>);
      }
      case 'focus': {
        const f = parseFocus(cur);
        return sub(p, <>{C('Line', f.line, (x) => setToken(p.token, buildFocus({ ...f, line: x })))}{C('Glow', f.glow, (x) => setToken(p.token, buildFocus({ ...f, glow: x })))}</>);
      }
      default:
        return sub(p, null); // plain CSS value: the typed field is the control
    }
  };

  const groupCount = (g: (typeof GROUPS)[number]) => g.params.filter((p) => changed(p.token)).length;
  const rawNames = tokenNames.filter((n) => !q || n.includes(q));

  const libraryOptions = [
    ...customs.map((c) => ({ value: 'c:' + c.id, label: c.name, icon: <Swatch t={c.base} /> })),
    ...THEMES.map((t) => ({ value: t, label: THEME_META[t].label + ' · built-in', icon: <Swatch t={t} /> })),
  ];
  const tokensForPreview = compare ? undefined : draft.tokens;

  const previewRoot = () => previewRef.current?.parentElement ?? null;
  const onPickMove = (e: React.PointerEvent) => {
    const root = previewRoot();
    if (!root) return;
    const pk = inspectAt(e.clientX, e.clientY, root);
    setHover({ rect: pk.el.getBoundingClientRect(), title: pk.title });
  };
  const stopForPick = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onPick = (e: React.MouseEvent) => {
    stopForPick(e);
    const root = previewRoot();
    if (!root) return;
    const pk = inspectAt(e.clientX, e.clientY, root);
    setPicked(pk);
    setPicking(false);
    setHover(null);
    groupsRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ArtinosTheme theme="studio" density="dense" type={type} ground className="ed">
      {/* ---------- header ---------- */}
      <header className="ed-head">
        <button type="button" className="ed-btn ed-btn--ghost" onClick={() => onExit()}>
          ← Showcase
        </button>
        <span className="ed-brand">
          <span className="sc-mark">#</span> THEME STUDIO
        </span>
        <div className="ed-lib">
          <Select options={libraryOptions} value={selection} onChange={switchTo} label="Theme" appearance="well" />
        </div>
        <input className="ed-input ed-name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} aria-label="Theme name" />
        <span className="ed-state" data-dirty={dirty ? '' : undefined}>
          {draft.id ? (dirty ? 'unsaved changes' : 'saved') : overridesCount ? 'new — not saved' : 'built-in'}
        </span>
        <div className="ed-actions">
          <button type="button" className="ed-btn" onClick={undo} disabled={!past.current.length} title="Undo (Ctrl+Z)">Undo</button>
          <button type="button" className="ed-btn" onClick={redo} disabled={!future.current.length} title="Redo (Ctrl+Shift+Z)">Redo</button>
          <button type="button" className="ed-btn" onClick={revert} disabled={!dirty}>Revert</button>
          <button type="button" className="ed-btn ed-btn--primary" onClick={save} disabled={!!draft.id && !dirty}>
            {draft.id ? 'Save' : 'Save theme'}
          </button>
          <button type="button" className="ed-btn" onClick={saveAsNew}>Save as new</button>
          {draft.id ? (
            <>
              <button type="button" className="ed-btn" onClick={duplicate}>Duplicate</button>
              <button type="button" className="ed-btn ed-btn--danger" onClick={() => setModal('delete')}>Delete</button>
            </>
          ) : null}
          <button type="button" className="ed-btn" onClick={() => setModal('import')}>Import</button>
          <button type="button" className="ed-btn" onClick={() => setModal('export')}>Export</button>
          <button type="button" className="ed-btn ed-btn--ghost" onClick={() => (draft.id && !dirty ? onExit('c:' + draft.id) : flash('Save the theme first to use it in the showcase'))}>
            Use in showcase →
          </button>
        </div>
      </header>

      <div className="ed-body">
        {/* ---------- inspector ---------- */}
        <aside className="ed-side">
          <div className="ed-side__top">
            <Field label="Start from" labelWidth={78}>
              <Select options={THEMES.map((t) => ({ value: t, label: THEME_META[t].label, icon: <Swatch t={t} /> }))} value={draft.base} onChange={changeBase} label="Base theme" appearance="well" />
            </Field>
            <input className="ed-input" placeholder="Search parameters or tokens…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search parameters" />
            <div className="ed-meta">
              <span>{overridesCount} overrides</span>
              <button type="button" className="ed-link" onClick={() => setOpenGroups(Object.fromEntries(GROUPS.map((g) => [g.id, true])))}>expand all</button>
              <button type="button" className="ed-link" onClick={() => setOpenGroups({})}>collapse all</button>
              <button type="button" className="ed-link" disabled={!overridesCount} onClick={() => commit({})}>reset all</button>
            </div>
          </div>
          <div className="ed-groups" ref={groupsRef}>
            {picked ? (
              <div className="ed-picked">
                <div className="ed-picked__head">
                  <span className="ed-picked__kicker">SELECTED</span>
                  <b>{picked.title}</b>
                  <button type="button" className="ed-link" onClick={() => setPicking(true)}>pick another</button>
                  <button type="button" className="ed-reset ed-picked__close" aria-label="Clear selection" onClick={() => setPicked(null)}>
                    ✕
                  </button>
                </div>
                {picked.parts.map((pt, i) => (
                  <div key={pt.id} className="ed-picked__part">
                    <div className="ed-picked__label">
                      {i === 0 ? pt.label : 'in ' + pt.label}
                      <span>{pt.tokens.length} parameters</span>
                    </div>
                    {pt.tokens.map((t) => control(paramFor(t)))}
                  </div>
                ))}
              </div>
            ) : null}
            {GROUPS.map((g) => {
              const ps = g.params.filter(matches);
              if (!ps.length) return null;
              const isOpen = !!q || !!openGroups[g.id];
              const n = groupCount(g);
              return (
                <Section
                  key={g.id}
                  title={g.title}
                  count={n ? `${n} changed` : undefined}
                  collapsible
                  open={isOpen}
                  onOpenChange={(o) => setOpenGroups((s) => ({ ...s, [g.id]: o }))}
                >
                  {isOpen ? (
                    <>
                      <p className="ed-note">
                        {g.note}
                        {n ? (
                          <button type="button" className="ed-link" onClick={() => resetGroup(g)}>
                            reset group
                          </button>
                        ) : null}
                      </p>
                      {ps.map(control)}
                    </>
                  ) : null}
                </Section>
              );
            })}
            <Section title="All tokens" count={`${rawNames.length}`} collapsible open={!!openGroups.raw} onOpenChange={(o) => setOpenGroups((s) => ({ ...s, raw: o }))}>
              {openGroups.raw ? (
                <div className="ed-raw">
                  <p className="ed-note">Every token the theme resolves, as raw CSS. Type a value and press Enter to override it; clear it to reset.</p>
                  {rawNames.map((n) => (
                    <label key={n} className="ed-raw__row" data-changed={changed(n) ? '' : undefined}>
                      <span>{n.replace('--ar-', '')}</span>
                      <ValueInput label={n} value={v(n)} onCommit={(x) => (x === '' ? resetToken(n) : setToken(n, x))} />
                      <button type="button" className="ed-reset" disabled={!changed(n)} onClick={(e) => (e.preventDefault(), resetToken(n))} aria-label={'Reset ' + n}>
                        ↺
                      </button>
                    </label>
                  ))}
                </div>
              ) : null}
            </Section>
          </div>
        </aside>

        {/* ---------- live preview ---------- */}
        <section className="ed-stage">
          <div className="ed-stage__bar">
            <span className="ed-stage__title">
              LIVE PREVIEW <b>{draft.name}</b>
            </span>
            <button
              type="button"
              className="ed-btn ed-inspect"
              data-on={picking ? '' : undefined}
              aria-pressed={picking}
              title="Pick an element in the preview to edit just its parameters (I)"
              onClick={() => {
                setPicking((v) => !v);
                setHover(null);
              }}
            >
              ⌖ {picking ? 'Click an element…' : 'Inspect'}
            </button>
            <Field label="Backdrop" labelWidth={64}>
              <Select options={BACKDROP_OPTIONS} value={backdrop} onChange={(x) => setBackdrop(x as Backdrop)} label="Backdrop" appearance="well" />
            </Field>
            <Segmented options={DENSITIES} value={density} onChange={setDensity} label="Density" />
            <div className="ed-compare">
              <Switch variant="compact" label="Compare with base" value={compare} onChange={setCompare} />
              <span>{compare ? 'showing ' + THEME_META[draft.base].label : 'compare with base'}</span>
            </div>
          </div>
          <ArtinosTheme
            theme={draft.base}
            tokens={tokensForPreview}
            density={density}
            ground
            className="ed-preview"
            style={backdrop !== 'none' ? { backgroundImage: `url(${BACKDROPS[backdrop]})` } : undefined}
            data-picking={picking ? '' : undefined}
            onScroll={() => picked && setPickRect(picked.el.getBoundingClientRect())}
            onPointerMoveCapture={picking ? onPickMove : undefined}
            onPointerLeave={() => setHover(null)}
            onPointerDownCapture={picking ? stopForPick : undefined}
            onDoubleClickCapture={picking ? stopForPick : undefined}
            onClickCapture={picking ? onPick : undefined}
          >
            <div ref={previewRef} className="ed-probe" />
            <div className="sc-sheet ed-sheet">
              <div className="ed-sheet__head">
                <h2>{draft.name}</h2>
                <span>
                  from {THEME_META[draft.base].label} · {overridesCount} overrides · every component below is live
                </span>
              </div>
              <Gallery />
            </div>
          </ArtinosTheme>
        </section>
      </div>

      {picked && pickRect ? (
        <div className="ed-pickbox ed-pickbox--selected" style={{ left: pickRect.left, top: pickRect.top, width: pickRect.width, height: pickRect.height }}>
          <span>{picked.title}</span>
        </div>
      ) : null}
      {picking && hover ? (
        <div className="ed-pickbox" style={{ left: hover.rect.left, top: hover.rect.top, width: hover.rect.width, height: hover.rect.height }}>
          <span>{hover.title}</span>
        </div>
      ) : null}
      {toast ? <div className="ed-toast">{toast}</div> : null}

      {/* ---------- modals ---------- */}
      {modal ? (
        <div className="ed-modal" role="dialog" aria-modal="true" onPointerDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="ed-modal__card">
            {modal === 'export' ? (
              <>
                <div className="ed-modal__head">
                  <b>Export “{draft.name}”</b>
                  <Segmented
                    options={[{ value: 'css', label: 'CSS theme' }, { value: 'json', label: 'JSON' }, { value: 'tsx', label: 'TSX' }]}
                    value={exportTab}
                    onChange={(x) => setExportTab(x as 'css' | 'json' | 'tsx')}
                    label="Format"
                  />
                </div>
                <p className="ed-note">
                  {exportTab === 'css'
                    ? `A standalone theme: every resolved token under [data-ar-theme='${slugify(draft.name)}']. Load it after artinos.css.`
                    : exportTab === 'json'
                      ? 'The theme file — base + overrides. Import it back here any time.'
                      : `The ${overridesCount} overrides as ArtinosTheme tokens on top of “${draft.base}”.`}
                </p>
                <pre className="ed-code">{exportText}</pre>
                <div className="ed-modal__foot">
                  <button type="button" className="ed-btn" onClick={() => navigator.clipboard?.writeText(exportText).then(() => flash('Copied'))}>Copy</button>
                  <button type="button" className="ed-btn ed-btn--primary" onClick={exportFile}>Download</button>
                  <button type="button" className="ed-btn ed-btn--ghost" onClick={() => setModal(null)}>Close</button>
                </div>
              </>
            ) : modal === 'import' ? (
              <>
                <div className="ed-modal__head">
                  <b>Import a theme</b>
                </div>
                <p className="ed-note">Paste a theme JSON exported from the studio, or choose the file.</p>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="ed-file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) f.text().then(setImportText);
                  }}
                />
                <textarea className="ed-code ed-textarea" value={importText} onChange={(e) => setImportText(e.target.value)} spellCheck={false} placeholder='{ "format": "artinos-ui-theme", "name": "…", "base": "glass", "tokens": { … } }' />
                {importError ? <p className="ed-error">{importError}</p> : null}
                <div className="ed-modal__foot">
                  <button type="button" className="ed-btn ed-btn--primary" onClick={doImport} disabled={!importText.trim()}>Import</button>
                  <button type="button" className="ed-btn ed-btn--ghost" onClick={() => setModal(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className="ed-modal__head">
                  <b>Delete “{draft.name}”?</b>
                </div>
                <p className="ed-note">It is removed from this browser. Export it first if you want to keep a copy.</p>
                <div className="ed-modal__foot">
                  <button type="button" className="ed-btn ed-btn--danger" onClick={remove}>Delete theme</button>
                  <button type="button" className="ed-btn ed-btn--ghost" onClick={() => setModal(null)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </ArtinosTheme>
  );
}
