'use client';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { signal } from '../core/signal';
import type { Signal } from '../core/signal';
import { useSignalValue } from '../core/useSignal';
import { Inspector } from '../inspector/Inspector';
import type { InspectorProps } from '../inspector/Inspector';
import { createInspectorStore, isField } from '../inspector/store';
import type { InspectFolder, InspectItem, InspectorStore, InspectorStoreOptions, InspectValue, InspectValues } from '../inspector/store';
import { Section } from '../layout/Panel';
import { readSchema } from './schema';
import type { ControlSchema, ValuesOf } from './schema';

/* useControls — a panel from one line in a component.

     const { speed, tint } = useControls('Scene', { speed: { value: 1, min: 0, max: 10 }, tint: '#4fd1ba' });

   Show every panel the app has declared with <ControlsPanel /> (content for a Dock panel or a
   Panel). The component renders again when a value changes. For a value read every frame, ask for
   signals instead, and nothing renders:

     const { speed } = useControls('Scene', schema, { transient: true });
     useFrame(() => mesh.rotation.y += speed.peek());
*/

interface ControlsEntry {
  name: string;
  store: InspectorStore;
  items: readonly InspectItem[];
  folders: readonly InspectFolder[];
  /** How many components have declared each key. */
  users: Map<string, number>;
}

const entries = signal<readonly ControlsEntry[]>([]);
const stores = new Map<string, InspectorStore>();

/** The store behind a named panel, for undo, presets, export and the rest of its API. */
export const controlsStore = (name = 'Controls') => stores.get(name);

function declare(name: string, items: readonly InspectItem[], folders: readonly InspectFolder[], options?: StoreOptions) {
  let store = stores.get(name);
  if (store) store.define(items);
  else stores.set(name, (store = createInspectorStore(items, options)));
  const list = entries.peek();
  const held = list.find((e) => e.name === name);
  const users = new Map(held?.users);
  for (const item of items) users.set(item.key, (users.get(item.key) ?? 0) + 1);
  const entry: ControlsEntry = {
    name,
    store,
    users,
    items: [...(held?.items.filter((i) => !items.some((x) => x.key === i.key)) ?? []), ...items],
    folders: [...(held?.folders.filter((f) => !folders.some((x) => x.id === f.id)) ?? []), ...folders],
  };
  entries.set(held ? list.map((e) => (e === held ? entry : e)) : [...list, entry]);
}

/** A component leaves: its rows go with it, and their values wait in the store for its return. */
function withdraw(name: string, items: readonly InspectItem[]) {
  const list = entries.peek();
  const held = list.find((e) => e.name === name);
  if (!held) return;
  const users = new Map(held.users);
  for (const item of items) users.set(item.key, (users.get(item.key) ?? 1) - 1);
  const left = held.items.filter((i) => (users.get(i.key) ?? 0) > 0);
  entries.set(left.length ? list.map((e) => (e === held ? { ...held, users, items: left } : e)) : list.filter((e) => e !== held));
}

type StoreOptions = Pick<InspectorStoreOptions, 'persist' | 'url' | 'version' | 'migrate' | 'history' | 'storageKey' | 'onChange'>;

export interface UseControlsOptions extends StoreOptions {
  /** Hand back signals instead of values: the component does not render when they change. */
  transient?: boolean;
}

export type SignalsOf<S> = { [K in keyof ValuesOf<S>]: Signal<ValuesOf<S>[K]> };

export function useControls<const S extends ControlSchema>(schema: S): ValuesOf<S>;
export function useControls<const S extends ControlSchema>(name: string, schema: S, options?: UseControlsOptions & { transient?: false }): ValuesOf<S>;
export function useControls<const S extends ControlSchema>(name: string, schema: S, options: UseControlsOptions & { transient: true }): SignalsOf<S>;
export function useControls(first: string | ControlSchema, second?: ControlSchema, options: UseControlsOptions = {}) {
  const name = typeof first === 'string' ? first : 'Controls';
  const schema = (typeof first === 'string' ? second : first) as ControlSchema;
  // the shape is read once; a button or read-out always calls this render's function
  const latest = useRef(schema);
  latest.current = schema;
  const { items, folders } = useMemo(() => {
    const read = readSchema(schema);
    return {
      folders: read.folders,
      items: read.items.map((item): InspectItem => {
        if (item.kind === 'action') return { ...item, run: () => (findEntry(latest.current, item.key) as () => void)() };
        if (item.kind === 'monitor') return { ...item, read: () => (findEntry(latest.current, item.key) as { read: () => number }).read() };
        return item;
      }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, Object.keys(schema).join()]);

  // declared in render, so the first paint already has the values
  const declared = useRef<string | null>(null);
  const shape = `${name}|${items.map((i) => i.key).join()}`;
  if (declared.current !== shape || !stores.has(name)) {
    declared.current = shape;
    declare(name, items, folders, options);
  }
  const store = stores.get(name)!;
  useEffect(() => {
    // a strict-mode remount, or a return after leaving, puts the rows back
    if (!entries.peek().some((e) => e.name === name && items.every((i) => e.items.includes(i)))) declare(name, items, folders);
    return () => withdraw(name, items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape]);

  const keys = useMemo(() => items.filter(isField).map((i) => i.key), [items]);
  // the same object until one of this component's own values changes
  const picked = useMemo(() => {
    let last: Record<string, InspectValue> = {};
    return () => {
      const all: InspectValues = store.live.peek();
      if (keys.length !== Object.keys(last).length || keys.some((k) => last[k] !== all[k])) last = Object.fromEntries(keys.map((k) => [k, all[k]]));
      return last;
    };
  }, [store, keys]);
  const values = useSyncExternalStore(options.transient ? noSubscription : store.live.subscribe, picked, picked);
  return useMemo(() => (options.transient ? Object.fromEntries(keys.map((k) => [k, store.signal(k)])) : values), [options.transient, keys, store, values]);
}

const noSubscription = () => () => {};

/** An entry by key, inside folders too. */
function findEntry(schema: ControlSchema, key: string): unknown {
  if (key in schema) return schema[key];
  for (const entry of Object.values(schema))
    if (typeof entry === 'object' && entry !== null && 'schema' in entry) {
      const found = findEntry(entry.schema as ControlSchema, key);
      if (found) return found;
    }
  return undefined;
}

export interface ControlsPanelProps {
  /** Only these named panels. Default: all of them. */
  only?: readonly string[];
  /** The Find, Presets and Reset bar. Default true. */
  bar?: boolean;
  /** Built-in presets by name, for every panel shown. */
  presets?: InspectorProps['presets'];
  /** Remembers each folder open or closed under this key. */
  storageKey?: string;
  className?: string;
}

/** Everything the app declared with useControls. It is content: put it in a Dock panel or a Panel. */
export function ControlsPanel({ only, bar = true, presets, storageKey, className }: ControlsPanelProps) {
  const list = useSignalValue(entries).filter((e) => !only || only.includes(e.name));
  const shared = { bar, presets };
  if (list.length === 1) return <Inspector items={list[0].items} folders={list[0].folders} store={list[0].store} storageKey={storageKey && `${storageKey}.${list[0].name}`} className={className} {...shared} />;
  return (
    <div className={className}>
      {list.map((e) => (
        <Section key={e.name} id={`controls-${e.name}`} title={e.name}>
          <Inspector items={e.items} folders={e.folders} store={e.store} storageKey={storageKey && `${storageKey}.${e.name}`} {...shared} />
        </Section>
      ))}
    </div>
  );
}
