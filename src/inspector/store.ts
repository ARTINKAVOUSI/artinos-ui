/* ARTINOS inspector — the schema and the store behind the pro Inspector.
   An item says what a value is (its kind, range and face); a folder groups items and nests under
   another folder. The store holds the values, their keyframes on a timeline, the links between
   them and the presets, and binds both ways to a plain object: a change in the panel is written to
   the object, and `pull()` reads back whatever the app changed in it, so the panel always shows
   the truth. Several stores merge into one for a multiple selection. */
import type { NumberFace } from '../dock/params';

export type InspectValue = number | string | boolean | readonly number[];
export type InspectValues = Record<string, InspectValue>;

/** What a check says about a value: shown under the row, in words. */
export interface InspectDiagnosis {
  status: 'warn' | 'fault';
  message: string;
}

interface ItemBase {
  key: string;
  label: string;
  /** The id of the InspectFolder it sits in. None: the top of the inspector. */
  folder?: string;
  /** What changes, in a sentence: the row's tooltip. */
  help?: string;
  /** Shown only while this holds. */
  when?: (values: InspectValues) => boolean;
  /** A diagnosis of the value in its context: a warning or a fault under the row. */
  check?: (value: InspectValue, values: InspectValues) => InspectDiagnosis | null | undefined;
}
/** A number: with min and max a slider, without them a scrub field. Its label scrubs it too. */
export type InspectNumber = ItemBase & { kind: 'number'; default: number; min?: number; max?: number; step?: number; unit?: string; face?: NumberFace };
export type InspectToggle = ItemBase & { kind: 'toggle'; default: boolean };
export type InspectChoice = ItemBase & { kind: 'choice'; default: string; options: readonly { value: string; label: string }[] };
export type InspectColor = ItemBase & { kind: 'color'; default: string; alpha?: boolean };
export type InspectVector = ItemBase & { kind: 'vector'; default: readonly [number, number, number]; min?: number; max?: number; step?: number; unit?: string };
/** An interval: two numbers on one track. */
export type InspectRange = ItemBase & { kind: 'range'; default: readonly [number, number]; min: number; max: number; step?: number; unit?: string; minSpan?: number };
/** Two coupled numbers set on a pad. */
export type InspectPoint = ItemBase & { kind: 'point'; default: readonly [number, number]; xRange?: [number, number]; yRange?: [number, number]; height?: number };
export type InspectText = ItemBase & { kind: 'text'; default: string; placeholder?: string };
/** A read-only value the app reports: sampled while on screen, drawn as a figure and, with `graph`, a trace. */
export type InspectMonitor = ItemBase & { kind: 'monitor'; read: () => number; min?: number; max?: number; unit?: string; decimals?: number; graph?: boolean; interval?: number };
export type InspectAction = ItemBase & { kind: 'action'; run: () => void };
export type InspectItem = InspectNumber | InspectToggle | InspectChoice | InspectColor | InspectVector | InspectRange | InspectPoint | InspectText | InspectMonitor | InspectAction;
/** The items that hold a value. */
export type InspectField = Exclude<InspectItem, InspectMonitor | InspectAction>;

export interface InspectFolder {
  id: string;
  title: string;
  /** The folder this one nests under. */
  parent?: string;
  /** Open at first. Default true for a top folder, false for a nested one. */
  open?: boolean;
  /** A toggle item that turns the whole folder on or off: it becomes the folder's LED, not a row. */
  switch?: string;
}

export const isField = (item: InspectItem): item is InspectField => item.kind !== 'monitor' && item.kind !== 'action';

/** Whether two values are the same reading (vectors by their numbers). */
export function sameValue(a: InspectValue | undefined, b: InspectValue | undefined): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => x === b[i]);
  return false;
}

/** One keyframe: a value at a time, in seconds. */
export interface InspectKey {
  t: number;
  v: InspectValue;
}
/** A value that follows another: target = source × ratio. */
export interface InspectLink {
  from: string;
  ratio: number;
}

export interface InspectorState {
  values: InspectValues;
  /** Where the playhead is, in seconds, and how long the timeline runs. */
  time: number;
  duration: number;
  playing: boolean;
  /** Keyframes by key, in time order. A key with a track is animated. */
  tracks: Record<string, readonly InspectKey[]>;
  links: Record<string, InspectLink>;
  /** Keys whose value differs across a multiple selection. */
  mixed: readonly string[];
  /** Presets saved from the panel, by name. */
  saved: Record<string, InspectValues>;
}

export interface InspectorStore {
  /** The current values (stable until one changes). */
  get(): InspectValues;
  state(): InspectorState;
  subscribe(listener: () => void): () => void;
  /** Set one value. On an animated key it lands as a keyframe at the playhead. */
  set(key: string, value: InspectValue): void;
  /** Several values in one notification: a preset, a paste, a randomize. */
  apply(values: Partial<InspectValues>): void;
  reset(keys?: readonly string[]): void;
  readonly defaults: InspectValues;
  /** Read the bound object back: call it after the app changes the object itself (a frame loop, a gizmo, a load).
   *  Free to call every frame: the panel follows at the store's `follow` rate. `pull(true)` reads at once. */
  pull(now?: boolean): void;
  /** Add a keyframe at the playhead, or remove the one that is there. */
  toggleKey(key: string): void;
  /** Move the playhead: every animated value takes its value at that time. */
  setTime(time: number): void;
  play(on: boolean): void;
  /** Make `key` follow `from` in the proportion they have now; null unlinks. Numbers only. */
  link(key: string, from: string | null): void;
  savePreset(name: string): void;
  removePreset(name: string): void;
}

export interface InspectorStoreOptions {
  /** The object the values live in. The store writes every change to it and `pull()` reads it back. */
  target?: Record<string, unknown>;
  onChange?: (key: string, value: InspectValue, values: InspectValues) => void;
  /** The timeline's length in seconds. Default 4. Playback loops. */
  duration?: number;
  /** Keyframes to start with. */
  tracks?: Record<string, readonly InspectKey[]>;
  /** The fewest ms between two reads of the object when `pull()` is called in a loop. Default 50 (20 a second). */
  follow?: number;
  /** Saved presets are kept in localStorage under this key. */
  storageKey?: string;
}

const copy = (v: InspectValue): InspectValue => (Array.isArray(v) ? [...v] : v);
/** Two keyframes this close in time are the same keyframe. */
export const KEY_SNAP = 0.02;

/** The keyframe of a track at a time, if there is one. */
export const keyAt = (track: readonly InspectKey[] | undefined, time: number) => track?.find((k) => Math.abs(k.t - time) <= KEY_SNAP);

const hex = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
const mix = (a: InspectValue, b: InspectValue, u: number): InspectValue => {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * u;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((x, i) => x + ((b[i] ?? x) - x) * u);
  if (typeof a === 'string' && typeof b === 'string' && /^#[0-9a-f]{6}$/i.test(a) && /^#[0-9a-f]{6}$/i.test(b)) {
    const ch = (s: string, i: number) => parseInt(s.slice(1 + i * 2, 3 + i * 2), 16);
    return '#' + [0, 1, 2].map((i) => hex(ch(a, i) + (ch(b, i) - ch(a, i)) * u)).join('');
  }
  return a; // a toggle, a choice, a text: held until the next keyframe
};

/** A track's value at a time: numbers, vectors and colours glide between keyframes, the rest hold. */
export function valueAt(track: readonly InspectKey[], time: number): InspectValue {
  if (time <= track[0].t) return track[0].v;
  const last = track[track.length - 1];
  if (time >= last.t) return last.v;
  const i = track.findIndex((k) => k.t > time);
  const a = track[i - 1];
  const b = track[i];
  const u = (time - a.t) / (b.t - a.t);
  return mix(a.v, b.v, u * u * (3 - 2 * u)); // eased in and out of each keyframe
}

export function createInspectorStore(items: readonly InspectItem[], { target, onChange, duration = 4, tracks = {}, storageKey, follow = 50 }: InspectorStoreOptions = {}): InspectorStore {
  const fields = items.filter(isField);
  const defaults: InspectValues = Object.fromEntries(fields.map((f) => [f.key, f.default]));
  const readSaved = (): Record<string, InspectValues> => {
    if (!storageKey || typeof localStorage === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    } catch {
      return {};
    }
  };
  let st: InspectorState = { values: { ...defaults }, time: 0, duration, playing: false, tracks, links: {}, mixed: [], saved: readSaved() };
  const listeners = new Set<() => void>();
  let waiting: ReturnType<typeof setTimeout> | undefined;
  let raf = 0;
  const emit = () => listeners.forEach((l) => l());
  // the object's own values win at the start: the panel shows what is there
  if (target)
    for (const f of fields) {
      if (target[f.key] !== undefined) st.values[f.key] = copy(target[f.key] as InspectValue);
      else target[f.key] = copy(f.default);
    }

  /** Values land: on the object, and on whatever is linked to them. Returns the new values, or null. */
  const land = (patch: Partial<InspectValues>): InspectValues | null => {
    let next: InspectValues | null = null;
    const put = (key: string, value: InspectValue) => {
      if (!(key in defaults) || sameValue((next ?? st.values)[key], value)) return;
      next ??= { ...st.values };
      next[key] = value;
      if (target) target[key] = copy(value);
      if (typeof value === 'number') for (const [to, l] of Object.entries(st.links)) if (l.from === key && !(to in patch)) put(to, Number((value * l.ratio).toFixed(6)));
    };
    for (const [key, value] of Object.entries(patch)) if (value !== undefined) put(key, value);
    return next;
  };
  const write = (patch: Partial<InspectValues>) => {
    const next = land(patch);
    if (!next) return;
    let tracksNext = st.tracks;
    let links = st.links;
    for (const key of Object.keys(patch)) {
      if (!(key in defaults)) continue;
      // a change to an animated value is a keyframe at the playhead
      const track = st.tracks[key];
      if (track) tracksNext = { ...tracksNext, [key]: [...track.filter((k) => Math.abs(k.t - st.time) > KEY_SNAP), { t: st.time, v: copy(next[key]) }].sort((a, b) => a.t - b.t) };
      // a linked value set by hand keeps its link, in the new proportion
      const l = links[key];
      const from = l ? next[l.from] : undefined;
      if (l && typeof from === 'number' && from !== 0 && typeof next[key] === 'number') links = { ...links, [key]: { from: l.from, ratio: (next[key] as number) / from } };
    }
    st = { ...st, values: next, tracks: tracksNext, links };
    if (onChange) for (const key of Object.keys(patch)) if (key in defaults) onChange(key, next[key], next);
    emit();
  };
  const read = () => {
    if (!target) return;
    let next: InspectValues | null = null;
    for (const f of fields) {
      const v = target[f.key] as InspectValue | undefined;
      if (v === undefined || sameValue(st.values[f.key], v)) continue;
      next ??= { ...st.values };
      next[f.key] = copy(v);
    }
    if (!next) return;
    st = { ...st, values: next };
    emit();
  };
  const seek = (time: number, playing = st.playing) => {
    const t = Math.min(st.duration, Math.max(0, time));
    const patch: InspectValues = {};
    for (const [key, track] of Object.entries(st.tracks)) if (track.length) patch[key] = valueAt(track, t);
    st = { ...st, time: t, playing, values: land(patch) ?? st.values };
    emit();
  };
  const persist = () => {
    if (!storageKey || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(st.saved));
    } catch {
      /* storage is best-effort */
    }
  };

  return {
    defaults,
    get: () => st.values,
    state: () => st,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set: (key, value) => write({ [key]: value }),
    apply: write,
    reset: (keys) => write(Object.fromEntries((keys ?? Object.keys(defaults)).map((k) => [k, defaults[k]]))),
    pull(now = false) {
      if (!target) return;
      if (now) return read();
      // a loop may call this every frame: one read per `follow` ms, taken when it is due, so it is never stale
      waiting ??= setTimeout(() => {
        waiting = undefined;
        read();
      }, follow);
    },
    toggleKey(key) {
      if (!(key in defaults)) return;
      const track = st.tracks[key] ?? [];
      const here = keyAt(track, st.time);
      const next = here ? track.filter((k) => k !== here) : [...track, { t: st.time, v: copy(st.values[key]) }].sort((a, b) => a.t - b.t);
      const { [key]: _old, ...rest } = st.tracks;
      st = { ...st, tracks: next.length ? { ...rest, [key]: next } : rest };
      emit();
    },
    setTime: (time) => seek(time),
    play(on) {
      if (on === st.playing) return;
      if (typeof requestAnimationFrame === 'undefined') return;
      cancelAnimationFrame(raf);
      if (!on) return seek(st.time, false);
      let last = performance.now();
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        const t = st.time + Math.min(0.1, (now - last) / 1000);
        last = now;
        seek(t >= st.duration ? 0 : t, true);
      };
      raf = requestAnimationFrame(frame);
      seek(st.time, true);
    },
    link(key, from) {
      const { [key]: _old, ...rest } = st.links;
      const a = st.values[key];
      const b = from ? st.values[from] : undefined;
      st = { ...st, links: from && typeof a === 'number' && typeof b === 'number' ? { ...rest, [key]: { from, ratio: b === 0 ? 1 : a / b } } : rest };
      emit();
    },
    savePreset(name) {
      st = { ...st, saved: { ...st.saved, [name]: { ...st.values } } };
      persist();
      emit();
    },
    removePreset(name) {
      const { [name]: _gone, ...saved } = st.saved;
      st = { ...st, saved };
      persist();
      emit();
    },
  };
}

/**
 * Several stores as one, for a multiple selection: the panel shows the first one's values, marks the
 * keys that differ across them as mixed, and writes every change to all of them.
 */
export function mergeInspectorStores(stores: readonly InspectorStore[]): InspectorStore {
  const [first] = stores;
  if (stores.length === 1) return first;
  let seen: readonly InspectorState[] = [];
  let merged = first.state();
  const state = () => {
    const now = stores.map((s) => s.state());
    if (now.length !== seen.length || now.some((s, i) => s !== seen[i])) {
      seen = now;
      const mixed = Object.keys(first.defaults).filter((k) => now.some((s) => !sameValue(s.values[k], now[0].values[k])));
      merged = { ...now[0], mixed };
    }
    return merged;
  };
  const all = <A extends unknown[]>(call: (s: InspectorStore, ...args: A) => void) => (...args: A) => stores.forEach((s) => call(s, ...args));
  return {
    defaults: first.defaults,
    get: () => state().values,
    state,
    subscribe(listener) {
      const offs = stores.map((s) => s.subscribe(listener));
      return () => offs.forEach((off) => off());
    },
    set: all((s, key: string, value: InspectValue) => s.set(key, value)),
    apply: all((s, values: Partial<InspectValues>) => s.apply(values)),
    reset: all((s, keys?: readonly string[]) => s.reset(keys)),
    pull: all((s, now?: boolean) => s.pull(now)),
    toggleKey: all((s, key: string) => s.toggleKey(key)),
    setTime: all((s, time: number) => s.setTime(time)),
    play: all((s, on: boolean) => s.play(on)),
    link: all((s, key: string, from: string | null) => s.link(key, from)),
    savePreset: (name) => first.savePreset(name),
    removePreset: (name) => first.removePreset(name),
  };
}
