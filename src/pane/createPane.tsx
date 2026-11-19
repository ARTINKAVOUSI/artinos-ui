'use client';
import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ArtinosTheme } from '../core/Theme';
import type { ArtinosThemeProps } from '../core/Theme';
import { signal } from '../core/signal';
import type { ReadSignal, Signal } from '../core/signal';
import { useSignalValue } from '../core/useSignal';
import { Dock } from '../dock/Dock';
import { Inspector } from '../inspector/Inspector';
import type { InspectorProps } from '../inspector/Inspector';
import { createInspectorStore } from '../inspector/store';
import type { InspectDocument, InspectFolder, InspectItem, InspectorStore, InspectValue, RandomizeOptions } from '../inspector/store';
import { perfRows } from '../perf/items';
import { perfMonitor } from '../perf/monitor';
import type { PerfSource } from '../perf/source';
import { itemFor, nameOf } from './schema';
import type { ControlOptions, MonitorOptions } from './schema';

/* createPane — the same panel with no React in your code. Bind a property of any object:

     const pane = createPane({ title: 'Scene' });
     pane.addBinding(params, 'speed', { min: 0, max: 10 });
     pane.addBinding(mesh, 'position', { min: -1, max: 1 });   // {x, y, z} objects work, three.js vectors too
     pane.addBinding(material, 'color');                       // a three.js Color too
     const look = pane.addFolder({ title: 'Look' });
     look.addBinding(params, 'tint');
     look.addButton({ title: 'Reset', onClick: () => pane.reset() });
     pane.addMonitor(stats, 'fps', { graph: true, min: 0, max: 120 });

   The panel is a floating MetaBlock: it drags, docks to the edges of its container and tabs. It runs
   on React inside, which the package already needs; the calling code does not touch it. */

export interface PaneOptions extends Pick<ArtinosThemeProps, 'theme' | 'density' | 'type'> {
  title?: string;
  /** Where the panel lives. Default: a layer over the whole page that lets clicks through around the panel. */
  container?: HTMLElement;
  /** Where the panel starts, in px. */
  bounds?: { x?: number; y?: number; width?: number; height?: number };
  /** Keep the values in localStorage under this key. */
  persist?: string;
  /** Carry the changed values in the page's address. */
  url?: boolean | string;
  /** Built-in presets by name. */
  presets?: InspectorProps['presets'];
  /** Keep presets saved from the panel in localStorage under this key. */
  storageKey?: string;
}

export type BindingOptions = Omit<ControlOptions, 'value'>;

export interface PaneBinding<V = unknown> {
  key: string;
  signal: Signal<InspectValue>;
  /** Called with each new value. Returns the way to stop. */
  on(listener: (value: V) => void): () => void;
  /** Read the object again, after your code changed it. */
  refresh(): void;
}

export interface PaneFolder {
  addBinding<T extends object, K extends keyof T & string>(object: T, key: K, options?: BindingOptions): PaneBinding<T[K]>;
  addMonitor<T extends object, K extends keyof T & string>(object: T, key: K, options?: MonitorOptions): void;
  addButton(options: { title: string; onClick: () => void }): void;
  addFolder(options: { title: string; open?: boolean }): PaneFolder;
  /** The figures of a performance source. Default: this page. */
  addPerformance(source?: PerfSource): void;
}

export interface Pane extends PaneFolder {
  readonly store: InspectorStore;
  /** Every change, as `(key, value)`. Returns the way to stop. */
  on(listener: (key: string, value: InspectValue) => void): () => void;
  /** Read every bound object again. */
  refresh(): void;
  /** Follow the objects by itself, for values your frame loop changes. */
  listen(on?: boolean): void;
  reset(): void;
  undo(): void;
  redo(): void;
  randomize(options?: RandomizeOptions): number;
  exportState(): InspectDocument;
  importState(document: unknown): boolean;
  dispose(): void;
}

/** How a bound property reads and writes when it is not a plain value. */
interface Codec {
  read(): InspectValue;
  write(value: InspectValue): void;
}

type Vec = { x: number; y: number; z?: number };
const isVec = (v: unknown): v is Vec => typeof v === 'object' && v !== null && typeof (v as Vec).x === 'number' && typeof (v as Vec).y === 'number';
type ColorObject = { isColor: true; getHexString(): string; set(value: string): unknown };
const isColorObject = (v: unknown): v is ColorObject => typeof v === 'object' && v !== null && (v as ColorObject).isColor === true;

function codecFor(object: Record<string, unknown>, key: string): Codec {
  const held = object[key];
  if (isColorObject(held)) return { read: () => `#${held.getHexString()}`, write: (v) => void held.set(String(v)) };
  if (isVec(held)) {
    const axes = (typeof held.z === 'number' ? ['x', 'y', 'z'] : ['x', 'y']) as (keyof Vec)[];
    return {
      read: () => axes.map((a) => held[a] as number),
      write: (v) => axes.forEach((a, i) => void (held[a] = (v as number[])[i])),
    };
  }
  return { read: () => object[key] as InspectValue, write: (v) => void (object[key] = v) };
}

function PaneView({ items, folders, store, title, bounds, overlay, presets }: { items: ReadSignal<readonly InspectItem[]>; folders: ReadSignal<readonly InspectFolder[]>; store: InspectorStore; title: string; bounds?: PaneOptions['bounds']; overlay: boolean; presets?: InspectorProps['presets'] }) {
  const rows = useSignalValue(items);
  const groups = useSignalValue(folders);
  // the content changes as rows are added; the panel, and where the user put it, stays
  const content = useMemo(() => <Inspector items={rows} folders={groups} store={store} presets={presets} />, [rows, groups, store, presets]);
  return (
    <Dock
      className={overlay ? 'ar-pane-layer' : undefined}
      palette={false}
      panels={[{ id: 'pane', title, dock: 'float', content, capabilities: { closable: false } }]}
      floatBounds={{ x: bounds?.x ?? (overlay ? Math.max(16, innerWidth - (bounds?.width ?? 320) - 16) : 16), y: bounds?.y ?? 16, width: bounds?.width ?? 320, height: bounds?.height ?? 420 }}
    />
  );
}

export function createPane({ title = 'Controls', container, bounds, theme, density = 'dense', type, persist, url, presets, storageKey }: PaneOptions = {}): Pane {
  const virtual: Record<string, unknown> = {};
  const items = signal<readonly InspectItem[]>([]);
  const folders = signal<readonly InspectFolder[]>([]);
  const listeners = new Set<(key: string, value: InspectValue) => void>();
  const store = createInspectorStore([], { target: virtual, persist, url, storageKey, onChange: (key, value) => listeners.forEach((l) => l(key, value)) });

  // a root of its own inside the container: a pane can be replaced while the last one is still leaving
  const host = (container ?? document.body).appendChild(document.createElement('div'));
  host.className = container ? 'ar-pane-inner' : 'ar-pane-host';
  const root = createRoot(host);
  root.render(
    <ArtinosTheme theme={theme} density={density} type={type} style={{ display: 'contents' }}>
      <PaneView items={items} folders={folders} store={store} title={title} bounds={bounds} overlay={!container} presets={presets} />
    </ArtinosTheme>,
  );

  /** A key of its own, however many objects share a property name. */
  const uniqueKey = (key: string) => {
    let name = key;
    for (let n = 2; items.peek().some((i) => i.key === name); n++) name = `${key}${n}`;
    return name;
  };
  const add = (item: InspectItem) => {
    store.define([item]);
    items.set([...items.peek(), item]);
  };

  const folderApi = (folderId?: string): PaneFolder => ({
    addBinding(object, key, options = {}) {
      const codec = codecFor(object as unknown as Record<string, unknown>, key);
      const name = uniqueKey(key);
      Object.defineProperty(virtual, name, { get: codec.read, set: codec.write, enumerable: true });
      add({ ...itemFor(name, { ...options, value: codec.read() } as ControlOptions, folderId), label: options.label ?? nameOf(key) });
      const live = store.signal(name);
      return { key: name, signal: live, on: (listener) => live.subscribe((v) => listener(v as never)), refresh: () => store.pull(true) };
    },
    addMonitor(object, key, options = {}) {
      const name = uniqueKey(key);
      add({ key: name, label: options.label ?? nameOf(key), folder: folderId, kind: 'monitor', read: () => Number(object[key]), ...options });
    },
    addButton({ title: label, onClick }) {
      add({ key: uniqueKey(`button:${label}`), label, folder: folderId, kind: 'action', run: onClick });
    },
    addFolder({ title: name, open = true }) {
      const id = `${folderId ?? ''}/${name}/${folders.peek().length}`;
      folders.set([...folders.peek(), { id, title: name, parent: folderId, open }]);
      return folderApi(id);
    },
    addPerformance(source = perfMonitor()) {
      const rows = perfRows(source, { parent: folderId });
      folders.set([...folders.peek(), ...rows.folders]);
      rows.items.forEach(add);
    },
  });

  let raf = 0;
  const follow = () => {
    raf = requestAnimationFrame(follow);
    store.pull();
  };
  return {
    ...folderApi(),
    store,
    on(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    refresh: () => store.pull(true),
    listen(on = true) {
      cancelAnimationFrame(raf);
      if (on) raf = requestAnimationFrame(follow);
    },
    reset: () => store.reset(),
    undo: store.undo,
    redo: store.redo,
    randomize: store.randomize,
    exportState: store.toJSON,
    importState: store.fromJSON,
    dispose() {
      cancelAnimationFrame(raf);
      listeners.clear();
      // not while React may still be rendering the caller
      queueMicrotask(() => {
        root.unmount();
        host.remove();
      });
    },
  };
}
