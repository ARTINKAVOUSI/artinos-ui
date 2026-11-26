'use client';
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { Button } from '../actions/Button';
import { IconButton } from '../actions/IconButton';
import { TextField } from '../controls/TextField';
import { useCommands, useCommandScope } from '../core/commands';
import { READOUT_MS } from '../core/reactive';
import { windowOf } from '../core/realm';
import { onFrame } from '../core/ticker';
import { isPointerLocked, lockPointer, precisionOf, unlockPointer } from '../core/scrub';
import { signal } from '../core/signal';
import type { Signal } from '../core/signal';
import { useSignalValue } from '../core/useSignal';
import { cx, snapToStep } from '../core/utils';
import { GraphTrace, useLiveFigure } from '../display/Graph';
import { Section } from '../layout/Panel';
import { PropertyRow } from '../layout/PropertyRow';
import { ContextMenu, Menu } from '../overlays/Menu';
import type { MenuEntry } from '../overlays/Menu';
import { BUILT_IN_CONTROLS } from './controls';
import { midiPlayable } from './midi';
import type { MidiMap, MidiState } from './midi';
import { registeredControl } from './registry';
import type { InspectControl } from './registry';
import { isField, keyAt, sameValue } from './store';
import type { InspectFolder, InspectItem, InspectMonitor, InspectValue, InspectValues, InspectorState, InspectorStore } from './store';

/* ARTINOS Inspector — the pro parameter editor. A schema of items and folders, and a store bound
   to the app's own object: every value gets the control its kind calls for in one aligned label
   column, folders nest, a row resets, copies, pastes, links to another and takes a keyframe, a
   number scrubs by its name, a check explains a bad value under its row, monitors trace what the
   app reports, presets recall a whole state and a search finds a row. Dragging a value reaches the
   app at frame rate and renders nothing but that control; the panel catches up when the hand
   settles, as one step of undo (Ctrl/⌘ Z). Several objects selected at once show as one, their
   differences marked. It is content: put it in a Panel or a Dock panel, so it floats, docks, tabs
   and resizes like any other. It is made for the dense family (<ArtinosTheme density="dense">) and
   takes its sizes from whichever family the scope is in. */

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
  /** Optional instrument summary above the folders, with the same store as the rows. */
  summary?: ReactNode;
  /** Optional navigation or context rail. Structural designs arrange it differently. */
  rail?: ReactNode;
  /** Optional output/action strip after the parameters. */
  footer?: ReactNode;
  /** The label column, the same at every depth so the controls stay on one line. Inherits the scope's
   *  (the density family's --ar-field-label-w) so every panel in a tool shares one. */
  labelWidth?: number | string;
  /** Remembers each folder open or closed under this key. */
  storageKey?: string;
  /** Rows learn a hardware controller from their right-click menu: `createMidiMap(store, items)`. */
  midi?: MidiMap;
  /** Show the rows marked `advanced`. */
  advanced?: boolean;
  /** Keys never drawn as rows (an app may keep one in its own toolbar). */
  hide?: readonly string[];
  /** Rows take keyframes. Default true; off for settings that are not animated. */
  keyframes?: boolean;
  className?: string;
  style?: CSSProperties;
}

const NO_MIDI = signal<MidiState>({ supported: false, connected: false, learning: null, bindings: [], error: null });

const controlOf = (item: InspectItem): InspectControl | undefined => registeredControl(item) ?? BUILT_IN_CONTROLS[item.kind];

const UNDO = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 3L2.5 5.5 5 8" />
    <path d="M2.5 5.5H8.5a3 3 0 010 6H6" />
  </svg>
);
const REDO = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 3l2.5 2.5L9 8" />
    <path d="M11.5 5.5H5.5a3 3 0 000 6H8" />
  </svg>
);

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

/** A monitor: what the app reports, sampled while on screen and written straight to the page. Its name
 *  and figure on one line, and with `graph` a trace across the panel beneath them. */
function MonitorRow({ item: m }: { item: InspectMonitor }) {
  const { ref, show, write } = useLiveFigure<number | string>((v) => (typeof v === 'string' ? v || '—' : !Number.isFinite(v) ? '—' : m.format ? m.format(v) : v.toFixed(m.decimals ?? 1)));
  const read = useRef(m.read);
  read.current = m.read;
  useEffect(() => {
    if (m.graph) return;
    let last = -Infinity;
    const every = m.interval ?? READOUT_MS;
    return onFrame(windowOf(ref.current), (now) => {
      if (now - last < every) return;
      last = now;
      write(read.current());
    });
  }, [m.graph, m.interval, ref, write]);
  return (
    <div className="ar-inspector__row ar-inspector__monitor" data-kind="monitor" data-control={m.key} title={m.help}>
      <span className="ar-inspector__name">{m.label}</span>
      <span className="ar-inspector__figure">
        <span ref={ref}>—</span>
        {m.unit ? <em>{m.unit}</em> : null}
      </span>
      {m.graph ? <GraphTrace label={m.label} read={() => Number(read.current())} min={m.min} max={m.max} budget={m.budget} samples={96} interval={m.interval ?? 50} onSample={show} /> : null}
    </div>
  );
}

interface LiveProps {
  control: InspectControl;
  item: InspectItem;
  store: InspectorStore;
  live: Signal<InspectValue>;
  status?: 'automated' | 'bound' | 'warn' | 'fault';
}

/** A control's props, on the row's store. */
const controlProps = ({ control, item, store, live, status }: LiveProps, value: InspectValue) => ({
  item,
  value,
  signal: live,
  status,
  set: (v: InspectValue) => (control.continuous === false ? store.set(item.key, v) : store.scrub(item.key, v)),
  commit: store.commit,
  options: item.kind === 'custom' ? (item.options ?? {}) : {},
});

/** A control that follows the signal by itself: this never renders while the value moves. */
function TransientControl(props: LiveProps) {
  const Component = props.control.component;
  return <Component {...controlProps(props, props.live.peek())} />;
}
/** Any other control renders alone when its value moves; the rest of the panel does not. */
function FollowingControl(props: LiveProps) {
  const value = useSignalValue(props.live);
  const Component = props.control.component;
  return <Component {...controlProps(props, value)} />;
}

function Row({ item: p, items, store, st, midi, midiState, keyframes }: { item: InspectItem; items: readonly InspectItem[]; store: InspectorStore; st: InspectorState; midi?: MidiMap; midiState: MidiState; keyframes: boolean }) {
  const scrub = useRef<{ id: number; x: number; v: number; moved: boolean; el: HTMLElement } | null>(null);
  if (p.kind === 'monitor') return <MonitorRow item={p} />;
  const field = isField(p);
  const value: InspectValue = field ? (st.values[p.key] ?? p.default) : 0;
  const modified = field && !sameValue(value, p.default);
  const control = controlOf(p);
  const canKey = keyframes && field && (control?.animatable ?? false);
  const track = st.tracks[p.key];
  const keyed = !!keyAt(track, st.time);
  const link = st.links[p.key];
  const mixed = st.mixed.includes(p.key);
  const diagnosis = field ? p.check?.(value, st.values) : undefined;
  const source = link ? items.find((x) => x.key === link.from) : undefined;
  const status: LiveProps['status'] = diagnosis?.status ?? (track ? 'automated' : link ? 'bound' : undefined);
  const learning = midiState.learning === p.key;
  const cc = midiState.bindings.find((b) => b.key === p.key);

  const menu = (): MenuEntry[] => {
    if (!field) return [];
    // a number may follow another number of its folder, in the proportion they have now
    const peers = p.kind === 'number' ? items.filter((x) => x.kind === 'number' && x.key !== p.key && x.folder === p.folder && st.links[x.key]?.from !== p.key).slice(0, 6) : [];
    return [
      { id: 'reset', label: 'Reset to default', disabled: !modified, onSelect: () => store.reset([p.key]) },
      { id: 'roll', label: 'Randomize', disabled: p.kind === 'text', onSelect: () => void store.randomize({ keys: [p.key] }) },
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
      ...(midi && midiPlayable(p)
        ? ([
            { type: 'separator' },
            learning
              ? { id: 'midi-cancel', label: 'Stop listening', onSelect: midi.cancel }
              : { id: 'midi-learn', label: cc ? `Relearn controller (CC ${cc.cc})` : 'Learn MIDI controller', disabled: !midiState.supported, onSelect: () => void midi.learn(p.key) },
            ...(cc ? [{ id: 'midi-forget', label: 'Forget controller', onSelect: () => midi.forget(p.key) }] : []),
          ] as MenuEntry[])
        : []),
    ];
  };

  /* a number's name is a scrubber too: drag it sideways (Alt fine, Shift coarse), as far as the hand likes */
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (p.kind !== 'number' || e.button !== 0 || !(e.target as HTMLElement).closest('.ar-prop__label')) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    scrub.current = { id: e.pointerId, x: e.clientX, v: Number(store.signal<number>(p.key).peek()), moved: false, el: e.currentTarget };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = scrub.current;
    if (!s || s.id !== e.pointerId || p.kind !== 'number') return;
    const dx = isPointerLocked(s.el) ? e.movementX : e.clientX - s.x;
    s.x = e.clientX;
    if (!dx) return;
    if (!s.moved) {
      s.moved = true;
      lockPointer(s.el, e.pointerType);
    }
    const step = p.step ?? 0.01;
    const range = p.min !== undefined && p.max !== undefined ? p.max - p.min : step * 200;
    s.v = Math.min(p.max ?? Infinity, Math.max(p.min ?? -Infinity, s.v + (dx / 200) * range * precisionOf(e)));
    store.scrub(p.key, Math.min(p.max ?? Infinity, Math.max(p.min ?? -Infinity, snapToStep(s.v, step))));
  };
  const onPointerUp = () => {
    if (!scrub.current) return;
    unlockPointer(scrub.current.el);
    scrub.current = null;
    store.commit();
  };

  const live = field ? store.signal(p.key) : NO_VALUE;
  const liveProps = control ? { control, item: p, store, live, status } : null;

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
          binding={learning ? 'move a control' : mixed ? 'mixed' : (source?.label ?? (cc ? `CC ${cc.cc}` : undefined))}
          status={diagnosis?.status ?? (link ? 'bound' : undefined)}
          message={diagnosis?.message}
          actions={
            canKey ? (
              <button type="button" className="ar-inspector__key" aria-pressed={keyed} aria-label={`${keyed ? 'Remove' : 'Add'} keyframe: ${p.label}`} title={keyed ? 'Remove keyframe' : 'Add keyframe here'} onClick={() => store.toggleKey(p.key)}>
                {KEY}
              </button>
            ) : keyframes ? (
              // every row keeps the diamond's place, so all controls end on one line
              <span className="ar-inspector__key" data-empty aria-hidden />
            ) : undefined
          }
        >
          {liveProps ? control?.transient ? <TransientControl {...liveProps} /> : field ? <FollowingControl {...liveProps} /> : <TransientControl {...liveProps} /> : null}
        </PropertyRow>
      </div>
    </ContextMenu>
  );
}

/** An action row holds no value: its control is handed this. */
const NO_VALUE = signal<InspectValue>(0);

/** Hand the visitor a file. */
function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Undo and redo for a store's values, for any bar. */
export function ValueHistory({ store }: { store: InspectorStore }) {
  const st = useSyncExternalStore(store.subscribe, store.state, store.state);
  return (
    <>
      <IconButton size="sm" label="Undo" icon={UNDO} disabled={!st.undoable} onClick={() => store.undo()} />
      <IconButton size="sm" label="Redo" icon={REDO} disabled={!st.redoable} onClick={() => store.redo()} />
    </>
  );
}

interface FolderViewProps {
  items: readonly InspectItem[];
  folders?: readonly InspectFolder[];
  store: InspectorStore;
  midi?: MidiMap;
  storageKey?: string;
  advanced?: boolean;
  hide?: readonly string[];
  keyframes?: boolean;
  /** Only rows matching this search. */
  query?: string;
}

/** Rows and folders from a schema: what an Inspector draws, and what a dockable section draws. */
function useFolderView({ items, folders = [], store, midi, storageKey, advanced = false, hide = [], keyframes = true, query = '' }: FolderViewProps) {
  const st = useSyncExternalStore(store.subscribe, store.state, store.state);
  const midiState = useSignalValue(midi?.state ?? NO_MIDI);
  const q = query.trim().toLowerCase();

  const tree = useMemo(() => {
    const kids = new Map<string | undefined, InspectFolder[]>();
    for (const f of folders) kids.set(f.parent, [...(kids.get(f.parent) ?? []), f]);
    return kids;
  }, [folders]);
  const title = useMemo(() => new Map(folders.map((f) => [f.id, f.title.toLowerCase()])), [folders]);
  const owners = useMemo(() => new Set(folders.map((f) => f.switch).filter(Boolean)), [folders]);

  const shown = (p: InspectItem) =>
    !owners.has(p.key) && !hide.includes(p.key) && (advanced || !p.advanced) && (!p.when || p.when(st.values)) && (!q || p.label.toLowerCase().includes(q) || (p.folder ? (title.get(p.folder) ?? '').includes(q) : false));
  const rowsOf = (folder: string | undefined) => items.filter((p) => p.folder === folder && shown(p));
  const fieldsUnder = (folder: InspectFolder): InspectItem[] => [...items.filter((p) => p.folder === folder.id && !hide.includes(p.key)), ...(tree.get(folder.id) ?? []).flatMap(fieldsUnder)];
  const emptyUnder = (folder: InspectFolder): boolean => rowsOf(folder.id).length === 0 && (tree.get(folder.id) ?? []).every(emptyUnder);

  const row = (p: InspectItem) => <Row key={p.key} item={p} items={items} store={store} st={st} midi={midi} midiState={midiState} keyframes={keyframes} />;

  /** One folder as a Section. `alone`: it stands outside an Inspector, as a dockable section. */
  const folder = (f: InspectFolder, alone = false): ReactNode => {
    if (!alone && emptyUnder(f)) return null;
    const rows = rowsOf(f.id);
    const changed = fieldsUnder(f).filter((p) => isField(p) && !sameValue(st.values[p.key], p.default));
    const owner = f.switch ? items.find((p) => p.key === f.switch) : undefined;
    const switchable = owner ? { enabled: Boolean(st.values[owner.key]), onEnabledChange: (on: boolean) => store.set(owner.key, on) } : {};
    const body = (
      <>
        {rows.map(row)}
        {(tree.get(f.id) ?? []).map((kid) => folder(kid))}
      </>
    );
    return (
      <Section
        key={f.id}
        id={f.id}
        title={f.title}
        description={f.description}
        count={f.count ? rows.length : undefined}
        modified={changed.length > 0}
        onReset={() => store.reset(changed.map((p) => p.key))}
        storageKey={storageKey ? `${storageKey}.${f.id}` : undefined}
        defaultOpen={f.open ?? !f.parent}
        open={q ? true : undefined}
        {...switchable}
      >
        {alone ? (
          <div className="ar-inspector">
            <div className="ar-inspector__body">{body}</div>
          </div>
        ) : (
          body
        )}
      </Section>
    );
  };
  return { st, tree, rowsOf, row, folder };
}

/** One folder of a schema on its own, as a `Section`: for sections that move between panes (`createDockSections`). */
export function InspectorFolder({ id, ...view }: FolderViewProps & { id: string }) {
  const { folder } = useFolderView(view);
  const f = view.folders?.find((x) => x.id === id);
  return f ? <>{folder(f, true)}</> : null;
}

export function Inspector({ items, folders = [], store, only, presets = {}, bar = true, search = true, toolbar, summary, rail, footer, labelWidth, storageKey, midi, advanced, hide, keyframes, className, style }: InspectorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const { st, tree, rowsOf, row, folder } = useFolderView({ items, folders, store, midi, storageKey, advanced, hide, keyframes, query });
  const commandId = useId();
  const scope = useCommandScope();

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
    { type: 'separator' },
    { id: '+roll', label: 'Randomize', onSelect: () => void store.randomize() },
    { id: '+export', label: 'Export values', onSelect: () => download('values.json', JSON.stringify(store.toJSON(), null, 2)) },
    { id: '+import', label: 'Import values', onSelect: () => fileRef.current?.click() },
    { id: '+link', label: 'Copy link to these values', onSelect: () => void navigator.clipboard?.writeText(store.toURL()) },
  ];
  const body = [...loose.map(row), ...top.map((f) => folder(f))].filter(Boolean);

  // what the bar can do, the workspace's command palette can do too
  useCommands(() => {
    if (!bar) return [];
    const group = scope ?? 'Values';
    const entry = (id: string, label: string, run: () => void) => ({ id: `${commandId}.${id}`, label, group, keywords: 'values parameters', run });
    return [
      entry('undo', 'Undo value change', () => store.undo()),
      entry('redo', 'Redo value change', () => store.redo()),
      entry('roll', 'Randomize values', () => void store.randomize()),
      entry('reset', 'Reset all values', () => store.reset()),
      entry('export', 'Export values', () => download('values.json', JSON.stringify(store.toJSON(), null, 2))),
      entry('link', 'Copy link to these values', () => void navigator.clipboard?.writeText(store.toURL())),
      ...names.map((name) => entry(`preset.${name}`, `Preset: ${name}`, () => store.apply(st.saved[name] ?? presets[name]))),
    ];
  }, `${bar}|${scope}|${names.join()}`);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z' || (e.target as HTMLElement).matches('input, textarea')) return;
    e.preventDefault(); // values, not the layout around them: the Dock leaves a handled key alone
    if (e.shiftKey) store.redo();
    else store.undo();
  };

  return (
    <div className={cx('ar-inspector', className)} data-rail={rail != null ? '' : undefined} data-summary={summary != null ? '' : undefined} onKeyDown={onKeyDown} style={{ ...(labelWidth === undefined ? null : { '--ar-field-label-w': typeof labelWidth === 'number' ? `${labelWidth}px` : labelWidth }), ...style } as CSSProperties}>
      {bar ? (
        <div className="ar-inspector__bar">
          {toolbar}
          {search ? <TextField size="sm" className="ar-inspector__search" icon={SEARCH} clearable aria-label="Find a parameter" placeholder="Find" value={query} onChange={setQuery} /> : <span className="ar-inspector__spacer" />}
          <ValueHistory store={store} />
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              void file?.text().then(store.fromJSON);
            }}
          />
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
      {rail != null ? <aside className="ar-inspector__rail">{rail}</aside> : null}
      {summary != null ? <div className="ar-inspector__summary">{summary}</div> : null}
      <div className="ar-inspector__body">{body.length ? body : <p className="ar-inspector__empty">No parameter matches “{query}”.</p>}</div>
      {footer != null ? <div className="ar-inspector__footer">{footer}</div> : null}
    </div>
  );
}
