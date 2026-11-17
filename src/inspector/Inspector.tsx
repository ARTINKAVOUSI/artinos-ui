'use client';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { Button } from '../actions/Button';
import { ColorField } from '../controls/ColorField';
import { NumberField } from '../controls/NumberField';
import { Segmented } from '../controls/Segmented';
import { Select } from '../controls/Select';
import { Switch } from '../controls/Switch';
import { TextField } from '../controls/TextField';
import { XYPad } from '../controls/XYPad';
import { cx } from '../core/utils';
import { Sparkline } from '../display/Sparkline';
import { Section } from '../layout/Panel';
import { PropertyRow } from '../layout/PropertyRow';
import { ContextMenu, Menu } from '../overlays/Menu';
import type { MenuEntry } from '../overlays/Menu';
import { Vector3Field } from '../rig/Vector3Field';
import type { Vec3 } from '../rig/math';
import { RangeSlider } from '../slider/RangeSlider';
import { Slider } from '../slider/Slider';
import { isField, keyAt, sameValue } from './store';
import type { InspectFolder, InspectItem, InspectMonitor, InspectNumber, InspectValue, InspectValues, InspectorState, InspectorStore } from './store';

/* ARTINOS Inspector — the pro parameter editor. A schema of items and folders, and a store bound
   to the app's own object: every value gets the control its kind calls for in one aligned label
   column, folders nest, a row resets, copies, pastes, links to another and takes a keyframe, a
   number scrubs by its name, a check explains a bad value under its row, monitors trace what the
   app reports, presets recall a whole state and a search finds a row. Several objects selected at
   once show as one, their differences marked. It is content: put it in a Panel or a Dock panel,
   so it floats, docks, tabs and resizes like any other. It is made for the dense family
   (<ArtinosTheme density="dense">) and takes its sizes from whichever family the scope is in. */

export interface InspectorProps {
  items: readonly InspectItem[];
  folders?: readonly InspectFolder[];
  /** One object's store, or `mergeInspectorStores([...])` for a multiple selection. */
  store: InspectorStore;
  /** Only these top folders (and what nests in them): one schema shown across several panels. */
  only?: readonly string[];
  /** Built-in presets by name; the panel adds the ones saved from it. */
  presets?: Record<string, Partial<InspectValues>>;
  /** The bar over the rows: Find, Presets, Reset. Default true; off for a panel of monitors. */
  bar?: boolean;
  /** The search field in the bar. Default true. */
  search?: boolean;
  /** Extra tools at the start of the bar. */
  toolbar?: ReactNode;
  /** The label column, the same at every depth so the controls stay on one line. Inherits the scope's
   *  (the density family's --ar-field-label-w) so every panel in a tool shares one. */
  labelWidth?: number | string;
  /** Remembers each folder open or closed under this key. */
  storageKey?: string;
  className?: string;
  style?: CSSProperties;
}

const decimalsOf = (step: number) => (step >= 1 ? 0 : step >= 0.1 ? 1 : step >= 0.01 ? 2 : 3);
const ANIMATABLE = new Set(['number', 'toggle', 'color', 'vector', 'range', 'point']);

const KEY = (
  <svg viewBox="0 0 12 12" aria-hidden>
    <path d="M6 1.6L10.4 6 6 10.4 1.6 6z" />
  </svg>
);
const SEARCH = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden>
    <circle cx="6" cy="6" r="3.6" />
    <path d="M8.8 8.8L12 12" />
  </svg>
);

function NumberControl({ item: p, value, status, onChange }: { item: InspectNumber; value: number; status?: 'automated' | 'bound' | 'warn' | 'fault'; onChange: (v: number) => void }) {
  const step = p.step ?? 0.01;
  const face = p.face ?? 'plain';
  const decimals = face === 'percent' ? 0 : decimalsOf(step);
  if (p.min === undefined || p.max === undefined)
    return <NumberField aria-label={p.label} value={value} min={p.min} max={p.max} step={step} decimals={decimals} unit={p.unit} align="end" onChange={onChange} />;
  const span = (p.max - p.min) / step;
  return (
    <Slider
      aria-label={p.label}
      value={value}
      min={p.min}
      max={p.max}
      step={step}
      unit={face === 'percent' ? undefined : p.unit}
      decimals={decimals}
      format={face === 'percent' ? 'percent' : face === 'degrees' ? 'angle' : 'number'}
      mapping={face === 'log' && p.min > 0 ? 'log' : 'linear'}
      bipolar={face === 'bipolar'}
      detents={face === 'bipolar' ? [0] : undefined}
      variant={face === 'count' ? 'stepped' : 'material'}
      steps={face === 'count' && span <= 12 ? Math.round(span) + 1 : undefined}
      status={status}
      toggleable={false}
      onChange={onChange}
    />
  );
}

/** A monitor: what the app reports, sampled while mounted. Its name and figure on one line, and with
 *  `graph` a trace across the panel beneath them. */
function MonitorRow({ item: m }: { item: InspectMonitor }) {
  const [series, setSeries] = useState<number[]>(() => [m.read()]);
  const read = useRef(m.read);
  read.current = m.read;
  useEffect(() => {
    const id = setInterval(() => setSeries((s) => [...s.slice(-47), read.current()]), m.interval ?? 120);
    return () => clearInterval(id);
  }, [m.interval]);
  const last = series[series.length - 1];
  return (
    <div className="ar-inspector__row ar-inspector__monitor" data-kind="monitor" data-control={m.key} title={m.help}>
      <span className="ar-inspector__name">{m.label}</span>
      <span className="ar-inspector__figure">
        {Number.isFinite(last) ? last.toFixed(m.decimals ?? 1) : '—'}
        {m.unit ? <em>{m.unit}</em> : null}
      </span>
      {m.graph ? <Sparkline label={m.label} values={series} min={m.min} max={m.max} width={240} height={22} /> : null}
    </div>
  );
}

function Control({ item: p, value, status, set }: { item: InspectItem; value: InspectValue; status?: 'automated' | 'bound' | 'warn' | 'fault'; set: (v: InspectValue) => void }) {
  switch (p.kind) {
    case 'number':
      return <NumberControl item={p} value={Number(value)} status={status} onChange={set} />;
    case 'toggle':
      return <Switch variant="compact" aria-label={p.label} value={Boolean(value)} onChange={set} />;
    case 'choice':
      return p.options.length <= 3 ? (
        <Segmented label={p.label} options={p.options.map((o) => ({ ...o }))} value={String(value)} onChange={set} />
      ) : (
        <Select label={p.label} options={p.options.map((o) => ({ ...o }))} value={String(value)} onChange={set} appearance="well" />
      );
    case 'color':
      return <ColorField value={String(value)} alpha={p.alpha} onChange={set} />;
    case 'vector':
      return <Vector3Field label={p.label} value={value as unknown as Vec3} min={p.min} max={p.max} step={p.step ?? 0.01} decimals={decimalsOf(p.step ?? 0.01)} unit={p.unit} onChange={set} />;
    case 'range':
      return <RangeSlider aria-label={p.label} value={value as unknown as [number, number]} min={p.min} max={p.max} step={p.step ?? 0.01} decimals={decimalsOf(p.step ?? 0.01)} unit={p.unit} minSpan={p.minSpan} toggleable={false} onChange={set} />;
    case 'point':
      return <XYPad label={p.label} value={value as unknown as [number, number]} xRange={p.xRange} yRange={p.yRange} height={p.height ?? 64} onChange={set} />;
    case 'text':
      return <TextField size="sm" aria-label={p.label} value={String(value)} placeholder={p.placeholder} onChange={set} />;
    case 'monitor':
      return null;
    case 'action':
      return (
        <Button size="sm" block onClick={p.run}>
          {p.label}
        </Button>
      );
  }
}

function Row({ item: p, items, store, st }: { item: InspectItem; items: readonly InspectItem[]; store: InspectorStore; st: InspectorState }) {
  const scrub = useRef<{ id: number; x: number; v: number } | null>(null);
  if (p.kind === 'monitor') return <MonitorRow item={p} />;
  const field = isField(p);
  const value: InspectValue = field ? (st.values[p.key] ?? p.default) : 0;
  const modified = field && !sameValue(value, p.default);
  const canKey = ANIMATABLE.has(p.kind);
  const track = st.tracks[p.key];
  const keyed = !!keyAt(track, st.time);
  const link = st.links[p.key];
  const mixed = st.mixed.includes(p.key);
  const diagnosis = field ? p.check?.(value, st.values) : undefined;
  const source = link ? items.find((x) => x.key === link.from) : undefined;
  const status = diagnosis?.status ?? (track ? 'automated' : link ? 'bound' : undefined);

  const menu = (): MenuEntry[] => {
    if (!field) return [];
    // a number may follow another number of its folder, in the proportion they have now
    const peers = p.kind === 'number' ? items.filter((x) => x.kind === 'number' && x.key !== p.key && x.folder === p.folder && st.links[x.key]?.from !== p.key).slice(0, 6) : [];
    return [
      { id: 'reset', label: 'Reset to default', disabled: !modified, onSelect: () => store.reset([p.key]) },
      { type: 'separator' },
      { id: 'copy', label: 'Copy value', onSelect: () => void navigator.clipboard?.writeText(JSON.stringify(value)) },
      {
        id: 'paste',
        label: 'Paste value',
        onSelect: () =>
          void navigator.clipboard?.readText().then((text) => {
            try {
              const v = JSON.parse(text) as InspectValue;
              // only a value of the row's own kind lands
              if (typeof v === typeof p.default && Array.isArray(v) === Array.isArray(p.default)) store.set(p.key, v);
            } catch {
              /* not a value */
            }
          }),
      },
      ...(canKey ? ([{ type: 'separator' }, { id: 'key', label: keyed ? 'Remove keyframe' : 'Add keyframe', checked: keyed, onSelect: () => store.toggleKey(p.key) }] as MenuEntry[]) : []),
      ...(peers.length || link ? ([{ type: 'separator' }, { type: 'label', label: 'Follow' }] as MenuEntry[]) : []),
      ...peers.map((x): MenuEntry => ({ id: 'link-' + x.key, label: x.label, checked: link?.from === x.key, onSelect: () => store.link(p.key, link?.from === x.key ? null : x.key) })),
      ...(link ? ([{ id: 'unlink', label: 'Unlink', onSelect: () => store.link(p.key, null) }] as MenuEntry[]) : []),
    ];
  };

  /* a number's name is a scrubber too: drag it sideways (Alt fine, Shift coarse) */
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (p.kind !== 'number' || e.button !== 0 || !(e.target as HTMLElement).closest('.ar-prop__label')) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    scrub.current = { id: e.pointerId, x: e.clientX, v: Number(value) };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = scrub.current;
    if (!s || s.id !== e.pointerId || p.kind !== 'number') return;
    const step = p.step ?? 0.01;
    const range = p.min !== undefined && p.max !== undefined ? p.max - p.min : step * 200;
    s.v += ((e.clientX - s.x) / 200) * range * (e.altKey ? 0.1 : e.shiftKey ? 4 : 1);
    s.x = e.clientX;
    const snapped = Number((Math.round(s.v / step) * step).toFixed(6));
    store.set(p.key, Math.min(p.max ?? Infinity, Math.max(p.min ?? -Infinity, snapped)));
  };
  const onPointerUp = () => {
    scrub.current = null;
  };

  return (
    <ContextMenu items={menu} disabled={!field}>
      <div
        className="ar-inspector__row"
        data-kind={p.kind}
        data-keyed={keyed || undefined}
        data-animated={track ? '' : undefined}
        data-mixed={mixed || undefined}
        title={p.help}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <PropertyRow
          label={p.kind === 'action' ? '' : p.label}
          density="compact"
          dataControl={p.key}
          modified={modified}
          onReset={field ? () => store.reset([p.key]) : undefined}
          binding={mixed ? 'mixed' : source?.label}
          status={diagnosis?.status ?? (link ? 'bound' : undefined)}
          message={diagnosis?.message}
          actions={
            canKey ? (
              <button type="button" className="ar-inspector__key" aria-pressed={keyed} aria-label={`${keyed ? 'Remove' : 'Add'} keyframe: ${p.label}`} title={keyed ? 'Remove keyframe' : 'Add keyframe here'} onClick={() => store.toggleKey(p.key)}>
                {KEY}
              </button>
            ) : (
              // every row keeps the diamond's place, so all controls end on one line
              <span className="ar-inspector__key" data-empty aria-hidden />
            )
          }
        >
          <Control item={p} value={value} status={status} set={(v) => store.set(p.key, v)} />
        </PropertyRow>
      </div>
    </ContextMenu>
  );
}

export function Inspector({ items, folders = [], store, only, presets = {}, bar = true, search = true, toolbar, labelWidth, storageKey, className, style }: InspectorProps) {
  const st = useSyncExternalStore(store.subscribe, store.state, store.state);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const tree = useMemo(() => {
    const kids = new Map<string | undefined, InspectFolder[]>();
    for (const f of folders) kids.set(f.parent, [...(kids.get(f.parent) ?? []), f]);
    return kids;
  }, [folders]);
  const title = useMemo(() => new Map(folders.map((f) => [f.id, f.title.toLowerCase()])), [folders]);
  const owners = useMemo(() => new Set(folders.map((f) => f.switch).filter(Boolean)), [folders]);

  const shown = (p: InspectItem) =>
    !owners.has(p.key) && (!p.when || p.when(st.values)) && (!q || p.label.toLowerCase().includes(q) || (p.folder ? (title.get(p.folder) ?? '').includes(q) : false));
  const rowsOf = (folder: string | undefined) => items.filter((p) => p.folder === folder && shown(p));
  const fieldsUnder = (folder: InspectFolder): InspectItem[] => [...items.filter((p) => p.folder === folder.id), ...(tree.get(folder.id) ?? []).flatMap(fieldsUnder)];
  const emptyUnder = (folder: InspectFolder): boolean => rowsOf(folder.id).length === 0 && (tree.get(folder.id) ?? []).every(emptyUnder);

  const row = (p: InspectItem) => <Row key={p.key} item={p} items={items} store={store} st={st} />;

  const folder = (f: InspectFolder): ReactNode => {
    if (emptyUnder(f)) return null;
    const rows = rowsOf(f.id);
    const changed = fieldsUnder(f).filter((p) => isField(p) && !sameValue(st.values[p.key], p.default));
    const owner = f.switch ? items.find((p) => p.key === f.switch) : undefined;
    const switchable = owner ? { enabled: Boolean(st.values[owner.key]), onEnabledChange: (on: boolean) => store.set(owner.key, on) } : {};
    return (
      <Section
        key={f.id}
        id={f.id}
        title={f.title}
        modified={changed.length > 0}
        onReset={() => store.reset(changed.map((p) => p.key))}
        storageKey={storageKey ? `${storageKey}.${f.id}` : undefined}
        defaultOpen={f.open ?? !f.parent}
        open={q ? true : undefined}
        {...switchable}
      >
        {rows.map(row)}
        {(tree.get(f.id) ?? []).map(folder)}
      </Section>
    );
  };

  const top = (tree.get(undefined) ?? []).filter((f) => !only || only.includes(f.id));
  const loose = only ? [] : rowsOf(undefined);
  const changedAll = items.filter((p) => isField(p) && !sameValue(st.values[p.key], p.default));
  const names = [...Object.keys(presets), ...Object.keys(st.saved).filter((n) => !(n in presets))];
  const presetItems: MenuEntry[] = [
    ...names.map((name): MenuEntry => {
      const values = st.saved[name] ?? presets[name];
      const active = Object.entries(values).every(([k, v]) => sameValue(st.values[k], v));
      return { id: name, label: name, checked: active, onSelect: () => store.apply(values) };
    }),
    ...(names.length ? ([{ type: 'separator' }] as MenuEntry[]) : []),
    { id: '+save', label: 'Save current as preset', onSelect: () => store.savePreset(`Preset ${Object.keys(st.saved).length + 1}`) },
    ...Object.keys(st.saved).map((name): MenuEntry => ({ id: '-' + name, label: `Delete ${name}`, danger: true, onSelect: () => store.removePreset(name) })),
  ];
  const body = [...loose.map(row), ...top.map(folder)].filter(Boolean);

  return (
    <div className={cx('ar-inspector', className)} style={{ ...(labelWidth === undefined ? null : { '--ar-field-label-w': typeof labelWidth === 'number' ? `${labelWidth}px` : labelWidth }), ...style } as CSSProperties}>
      {bar ? (
        <div className="ar-inspector__bar">
          {toolbar}
          {search ? <TextField size="sm" className="ar-inspector__search" icon={SEARCH} clearable aria-label="Find a parameter" placeholder="Find" value={query} onChange={setQuery} /> : <span className="ar-inspector__spacer" />}
          <Menu
            align="end"
            items={presetItems}
            trigger={
              <Button size="sm" variant="ghost">
                Presets
              </Button>
            }
          />
          <Button size="sm" variant="ghost" disabled={!changedAll.length} onClick={() => store.reset()}>
            {changedAll.length ? `Reset ${changedAll.length}` : 'Reset'}
          </Button>
        </div>
      ) : null}
      <div className="ar-inspector__body">{body.length ? body : <p className="ar-inspector__empty">No parameter matches “{query}”.</p>}</div>
    </div>
  );
}
