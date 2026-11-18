/* ARTINOS inspector — the schema and the store behind the pro Inspector.
   An item says what a value is (its kind, range and face); a folder groups items and nests under
   another folder. The store holds the values, their keyframes on a timeline, the links between
   them and the presets, and binds both ways to a plain object: a change in the panel is written to
   the object, and `pull()` reads back whatever the app changed in it, so the panel always shows
   the truth. Several stores merge into one for a multiple selection.

   Every value is also a signal (`store.signal(key)`): a control on it writes with `scrub`, which
   reaches the object and the signal at once and tells the panel only when the hand settles. That
   settling (`commit`) is one undo step, one save to storage and one update of the address. */
import { batch, signal } from '../core/signal';
import type { ReadSignal, Signal } from '../core/signal';
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
  /** Randomize leaves it alone. */
  locked?: boolean;
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
export type InspectMonitor = ItemBase & { kind: 'monitor'; read: () => number; min?: number; max?: number; unit?: string; decimals?: number; graph?: boolean; interval?: number; budget?: number };
export type InspectAction = ItemBase & { kind: 'action'; run: () => void };
/** A value drawn by a control added with `registerControl`. `randomize` gives Randomize a value for it. */
export type InspectCustom = ItemBase & { kind: 'custom'; control: string; default: InspectValue; options?: Record<string, unknown>; randomize?: (random: () => number, current: InspectValue) => InspectValue };
export type InspectItem = InspectNumber | InspectToggle | InspectChoice | InspectColor | InspectVector | InspectRange | InspectPoint | InspectText | InspectMonitor | InspectAction | InspectCustom;
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
  /** How many steps can be undone and redone. */
  undoable: number;
  redoable: number;
}

export const INSPECT_FORMAT = 'artinos.values';

/** The values of a store as a file: what `toJSON` writes and `fromJSON` reads. */
export interface InspectDocument {
  format: typeof INSPECT_FORMAT;
  /** The app's schema version (the store's `version` option). */
  version: number;
  values: InspectValues;
  tracks?: Record<string, readonly InspectKey[]>;
  links?: Record<string, InspectLink>;
  presets?: Record<string, InspectValues>;
}

export interface RandomizeOptions {
  /** Only these keys. Default: every number with a range, choice, colour, vector, range and point. A toggle only when named here. */
  keys?: readonly string[];
  /** The same seed rolls the same values. Default: a new one, returned by `randomize`. */
  seed?: number;
  /** 0..1, how far to move toward the rolled value. Default 1. */
  amount?: number;
}

export interface InspectorStore {
  /** The current values (stable until one changes). */
  get(): InspectValues;
  state(): InspectorState;
  subscribe(listener: () => void): () => void;
  /** Set one value. On an animated key it lands as a keyframe at the playhead. */
  set(key: string, value: InspectValue): void;
  /** One value as a signal: read it, subscribe to it; writing it is a `scrub`. */
  signal<V extends InspectValue = InspectValue>(key: string): Signal<V>;
  /** Set one value mid-gesture: the object and the signal now, the panel when the hand settles. */
  scrub(key: string, value: InspectValue): void;
  /** The gesture is over: one undo step, saved, and the panel told. Happens by itself soon after the last scrub. */
  commit(): void;
  /** All the values, on every change, scrubs included. */
  readonly live: ReadSignal<InspectValues>;
  undo(): void;
  redo(): void;
  /** Roll new values. Returns the seed. */
  randomize(options?: RandomizeOptions): number;
  /** Values, keyframes, links and saved presets, ready for JSON.stringify. */
  toJSON(): InspectDocument;
  /** Load a document: the object, its JSON text, or a bare map of values. One undo step. False if it is none of these. */
  fromJSON(input: unknown): boolean;
  /** This page's address carrying the values that differ from their defaults. */
  toURL(base?: string): string;
  /** Add rows to a running store. Keys it already has stay as they are. */
  define(items: readonly InspectItem[]): void;
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
  /** Keep the values themselves in localStorage under this key, and start from them. */
  persist?: string;
  /** Carry the changed values in the page's address (true: the `p` parameter, or name your own), and start from them. */
  url?: boolean | string;
  /** The schema's version, written into every document. Default 1. */
  version?: number;
  /** Bring values saved under an older version up to this one. Keys no row has left are dropped afterwards. */
  migrate?: (values: Record<string, unknown>, fromVersion: number) => Record<string, unknown>;
  /** How many undo steps are kept. Default 100; 0 turns undo off. */
  history?: number;
}

/** Changes to one number this close together are one undo step, however the hand paused. */
const SAME_GESTURE_MS = 600;
/** The hand has settled when no scrub has come for this long. */
const SETTLE_MS = 160;

const copy =(v: InspectValue): InspectValue => (Array.isArray(v) ? [...v] : v);
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

/** A small seeded generator (mulberry32): the same seed, the same sequence. */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const snapTo = (v: number, step?: number) => (step ? Number((Math.round(v / step) * step).toFixed(6)) : Number(v.toFixed(6)));

/** A random value for a row, or undefined when it takes none. */
function roll(f: InspectField, random: () => number, current: InspectValue, named: boolean): InspectValue | undefined {
  const within = (lo: number, hi: number, step?: number) => Math.min(hi, Math.max(lo, snapTo(lo + (hi - lo) * random(), step)));
  switch (f.kind) {
    case 'number':
      if (f.min === undefined || f.max === undefined) return undefined;
      if (f.face === 'log' && f.min > 0) return Math.min(f.max, Math.max(f.min, snapTo(f.min * Math.pow(f.max / f.min, random()), f.step)));
      return within(f.min, f.max, f.step);
    case 'toggle':
      return named ? random() < 0.5 : undefined;
    case 'choice':
      return f.options[Math.floor(random() * f.options.length)]?.value;
    case 'color':
      return '#' + Math.floor(random() * 0x1000000).toString(16).padStart(6, '0');
    case 'vector':
      return f.min === undefined || f.max === undefined ? undefined : f.default.map(() => within(f.min!, f.max!, f.step));
    case 'range': {
      const a = within(f.min, f.max, f.step);
      const b = within(f.min, f.max, f.step);
      return [Math.min(a, b), Math.max(a, b)];
    }
    case 'point':
      return [within(...(f.xRange ?? ([0, 1] as const))), within(...(f.yRange ?? ([0, 1] as const)))];
    case 'custom':
      return f.randomize?.(random, current);
    default:
      return undefined;
  }
}

/** A value as a row can hold it, or undefined when it cannot: a loaded file never reaches the app unchecked. */
function accept(f: InspectField, v: unknown): InspectValue | undefined {
  if (Array.isArray(f.default)) return Array.isArray(v) && v.length === f.default.length && v.every((x) => typeof x === 'number' && Number.isFinite(x)) ? (v as number[]) : undefined;
  if (typeof v !== typeof f.default || (typeof v === 'number' && !Number.isFinite(v))) return undefined;
  if (f.kind === 'number') return Math.min(f.max ?? Infinity, Math.max(f.min ?? -Infinity, v as number));
  if (f.kind === 'choice') return f.options.some((o) => o.value === v) ? (v as string) : undefined;
  return v as InspectValue;
}

const toBase64Url = (text: string) => btoa(String.fromCharCode(...new TextEncoder().encode(text))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64Url = (text: string) => new TextDecoder().decode(Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

interface Moment {
  values: InspectValues;
  tracks: InspectorState['tracks'];
  links: InspectorState['links'];
}
interface Step {
  before: Moment;
  after: Moment;
  key: string;
  at: number;
}

export function createInspectorStore(items: readonly InspectItem[], { target, onChange, duration = 4, tracks = {}, storageKey, follow = 50, persist: persistKey, url, version = 1, migrate, history = 100 }: InspectorStoreOptions = {}): InspectorStore {
  const fields = items.filter(isField);
  const defaults: InspectValues = Object.fromEntries(fields.map((f) => [f.key, f.default]));
  const urlParam = url === true ? 'p' : url || null;
  const readSaved = (): Record<string, InspectValues> => {
    if (!storageKey || typeof localStorage === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    } catch {
      return {};
    }
  };
  let st: InspectorState = { values: { ...defaults }, time: 0, duration, playing: false, tracks, links: {}, mixed: [], saved: readSaved(), undoable: 0, redoable: 0 };
  const listeners = new Set<() => void>();
  let waiting: ReturnType<typeof setTimeout> | undefined;
  let settling: ReturnType<typeof setTimeout> | undefined;
  let raf = 0;
  const emit = () => listeners.forEach((l) => l());
  // the object's own values win at the start: the panel shows what is there
  if (target)
    for (const f of fields) {
      if (target[f.key] !== undefined) st.values[f.key] = copy(target[f.key] as InspectValue);
      else target[f.key] = copy(f.default);
    }

  /** What was saved for rows that do not exist yet: a row added later with `define` picks it up. */
  const savedEarly: Record<string, unknown> = {};
  /** The usable values of a saved map, brought up to this version. */
  const incoming = (raw: Record<string, unknown>, from: number, early = false) => {
    const values = from !== version && migrate ? migrate(raw, from) : raw;
    if (early) Object.assign(savedEarly, values);
    const out: InspectValues = {};
    for (const f of fields) {
      const v = accept(f, values[f.key]);
      if (v !== undefined) out[f.key] = v;
    }
    return out;
  };
  // what was saved comes next, the address last: a shared link shows what was shared
  const boot: InspectValues[] = [];
  if (persistKey && typeof localStorage !== 'undefined')
    try {
      const doc = JSON.parse(localStorage.getItem(persistKey) ?? 'null');
      if (doc?.values) boot.push(incoming(doc.values, doc.version ?? version, true));
    } catch {
      /* a corrupt save falls back to the defaults */
    }
  if (urlParam && typeof location !== 'undefined')
    try {
      const text = new URL(location.href).searchParams.get(urlParam);
      if (text) {
        const [from, values] = JSON.parse(fromBase64Url(text));
        boot.push(incoming(values, from, true));
      }
    } catch {
      /* someone else's parameter, or a damaged link */
    }
  for (const values of boot) {
    Object.assign(st.values, values);
    if (target) for (const [k, v] of Object.entries(values)) target[k] = copy(v);
  }

  /* one signal per value, made when first asked for; `live` carries them all */
  const live = signal<InspectValues>(st.values);
  const inner = new Map<string, Signal<InspectValue>>();
  const outer = new Map<string, Signal<InspectValue>>();
  const sync = () =>
    batch(() => {
      for (const [key, s] of inner) s.set(st.values[key]);
      live.set(st.values);
    });

  /* history: what the store looked like at each settled moment */
  const moment = (): Moment => ({ values: st.values, tracks: st.tracks, links: st.links });
  let base = moment();
  let past: Step[] = [];
  let future: Step[] = [];
  let unsettled = false;
  const counted = () => {
    st = { ...st, undoable: past.length, redoable: future.length };
  };
  const record = () => {
    const now = moment();
    const keys = Object.keys(defaults).filter((k) => !sameValue(base.values[k], now.values[k]));
    if (!keys.length && now.tracks === base.tracks && now.links === base.links) return;
    const key = keys.join();
    const at = Date.now();
    const last = past[past.length - 1];
    const glides = keys.length === 1 && (typeof now.values[key] === 'number' || Array.isArray(now.values[key]));
    if (glides && last && last.key === key && last.after === base && at - last.at < SAME_GESTURE_MS) {
      last.after = now;
      last.at = at;
    } else if (history > 0) {
      past = [...past.slice(Math.max(0, past.length - history + 1)), { before: base, after: now, key, at }];
    }
    future = [];
    base = now;
    counted();
  };
  const toDocument = (): InspectDocument => ({
    format: INSPECT_FORMAT,
    version,
    values: st.values,
    ...(Object.keys(st.tracks).length ? { tracks: st.tracks } : null),
    ...(Object.keys(st.links).length ? { links: st.links } : null),
    ...(Object.keys(st.saved).length ? { presets: st.saved } : null),
  });
  const toURL = (href: string) => {
    const u = new URL(href);
    const changed = Object.fromEntries(Object.entries(st.values).filter(([k, v]) => !sameValue(v, defaults[k])));
    if (Object.keys(changed).length) u.searchParams.set(urlParam ?? 'p', toBase64Url(JSON.stringify([version, changed])));
    else u.searchParams.delete(urlParam ?? 'p');
    return u.href;
  };
  const save = () => {
    if (persistKey && typeof localStorage !== 'undefined')
      try {
        localStorage.setItem(persistKey, JSON.stringify(toDocument()));
      } catch {
        /* storage is best-effort */
      }
    if (urlParam && typeof location !== 'undefined') replaceAddress(toURL(location.href));
  };
  const replaceAddress = (href: string) => {
    try {
      window.history.replaceState(window.history.state, '', href);
    } catch {
      /* a sandboxed frame keeps its address */
    }
  };
  const commit = () => {
    clearTimeout(settling);
    settling = undefined;
    if (!unsettled) return;
    unsettled = false;
    record();
    save();
    emit();
  };
  /** Go to a moment in the history. */
  const restore = (to: Moment) => {
    const moved = Object.keys(defaults).filter((k) => !sameValue(st.values[k], to.values[k]));
    if (target) for (const k of moved) target[k] = copy(to.values[k]);
    st = { ...st, values: to.values, tracks: to.tracks, links: to.links };
    base = to;
    counted();
    sync();
    if (onChange) for (const k of moved) onChange(k, to.values[k], to.values);
    save();
    emit();
  };

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
  const write = (raw: Partial<InspectValues>, quiet = false) => {
    // a number with a step only ever holds whole steps, however the hand moved
    const patch = { ...raw };
    for (const f of fields) if (f.kind === 'number' && f.step && typeof patch[f.key] === 'number') patch[f.key] = snapTo(patch[f.key] as number, f.step);
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
    sync();
    if (onChange) for (const key of Object.keys(patch)) if (key in defaults) onChange(key, next[key], next);
    unsettled = true;
    if (!quiet) return commit();
    clearTimeout(settling);
    settling = setTimeout(commit, SETTLE_MS);
  };
  /** The app or the timeline moved a value: shown, but not a step of the user's to undo. */
  const followed = () => {
    if (!unsettled) base = moment();
    sync();
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
    followed();
  };
  const seek = (time: number, playing = st.playing) => {
    const t = Math.min(st.duration, Math.max(0, time));
    const patch: InspectValues = {};
    for (const [key, track] of Object.entries(st.tracks)) if (track.length) patch[key] = valueAt(track, t);
    st = { ...st, time: t, playing, values: land(patch) ?? st.values };
    followed();
  };
  /** A change of keyframes or links, as one step. */
  const edited = () => {
    unsettled = true;
    commit();
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
    scrub: (key, value) => write({ [key]: value }, true),
    commit,
    live,
    signal<V extends InspectValue = InspectValue>(key: string) {
      let s = outer.get(key);
      if (!s) {
        const own = signal<InspectValue>(st.values[key], { equals: sameValue });
        const read = (() => own()) as Signal<InspectValue>;
        read.peek = own.peek;
        read.subscribe = own.subscribe;
        read.set = (next) => write({ [key]: typeof next === 'function' ? next(own.peek()) : next }, true);
        inner.set(key, own);
        outer.set(key, read);
        s = read;
      }
      return s as unknown as Signal<V>;
    },
    undo() {
      commit();
      const step = past[past.length - 1];
      if (!step) return;
      past = past.slice(0, -1);
      future = [...future, step];
      restore(step.before);
    },
    redo() {
      commit();
      const step = future[future.length - 1];
      if (!step) return;
      future = future.slice(0, -1);
      past = [...past, step];
      restore(step.after);
    },
    randomize({ keys, seed = Math.floor(Math.random() * 0x100000000), amount = 1 } = {}) {
      const random = seededRandom(seed);
      const patch: InspectValues = {};
      for (const f of fields) {
        // every row draws from the sequence, so a locked row never changes what the others roll
        const rolled = roll(f, random, st.values[f.key], !!keys?.includes(f.key));
        if (rolled === undefined || f.locked || st.links[f.key] || st.tracks[f.key] || (keys && !keys.includes(f.key))) continue;
        patch[f.key] = amount >= 1 ? rolled : f.kind === 'number' ? snapTo(mix(st.values[f.key], rolled, amount) as number, f.step) : mix(st.values[f.key], rolled, amount);
      }
      write(patch);
      return seed;
    },
    toJSON: toDocument,
    fromJSON(input) {
      let doc = input;
      if (typeof doc === 'string')
        try {
          doc = JSON.parse(doc);
        } catch {
          return false;
        }
      if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return false;
      const d = doc as Partial<InspectDocument>;
      const framed = d.format === INSPECT_FORMAT;
      if (d.format !== undefined && !framed) return false;
      const values = incoming((framed ? d.values ?? {} : doc) as Record<string, unknown>, framed ? d.version ?? version : version);
      if (!framed && !Object.keys(values).length) return false;
      commit();
      const known = <T,>(map: Record<string, T> | undefined) => Object.fromEntries(Object.entries(map ?? {}).filter(([k]) => k in defaults));
      const next = land(values) ?? st.values;
      st = { ...st, values: next, ...(framed ? { tracks: known(d.tracks), links: known(d.links), saved: { ...st.saved, ...d.presets } } : null) };
      sync();
      if (onChange) for (const k of Object.keys(values)) onChange(k, next[k], next);
      if (framed && d.presets) persist();
      edited();
      return true;
    },
    toURL: (href = typeof location === 'undefined' ? 'http://localhost/' : location.href) => toURL(href),
    define(more) {
      const added = more.filter(isField).filter((f) => !(f.key in defaults));
      if (!added.length) return;
      const values = { ...st.values };
      for (const f of added) {
        fields.push(f);
        defaults[f.key] = f.default;
        const saved = accept(f, savedEarly[f.key]);
        const held = target?.[f.key] as InspectValue | undefined;
        values[f.key] = saved ?? (held !== undefined ? copy(held) : f.default);
        if (target && (saved !== undefined || held === undefined)) target[f.key] = copy(values[f.key]);
      }
      st = { ...st, values };
      followed();
    },
    apply: (values) => write(values),
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
      edited();
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
      edited();
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
  /* a value of the selection: read from the first, written to all */
  const bridges = new Map<string, Signal<InspectValue>>();
  return {
    defaults: first.defaults,
    get: () => state().values,
    state,
    live: first.live,
    signal<V extends InspectValue = InspectValue>(key: string) {
      let s = bridges.get(key);
      if (!s) {
        const source = first.signal(key);
        const read = (() => source()) as Signal<InspectValue>;
        read.peek = source.peek;
        read.subscribe = source.subscribe;
        read.set = (next) => {
          const v = typeof next === 'function' ? next(source.peek()) : next;
          stores.forEach((store) => store.scrub(key, v));
        };
        bridges.set(key, read);
        s = read;
      }
      return s as unknown as Signal<V>;
    },
    scrub: all((s, key: string, value: InspectValue) => s.scrub(key, value)),
    commit: all((s) => s.commit()),
    undo: all((s) => s.undo()),
    redo: all((s) => s.redo()),
    randomize({ seed = Math.floor(Math.random() * 0x100000000), ...rest } = {}) {
      stores.forEach((s) => s.randomize({ ...rest, seed }));
      return seed;
    },
    toJSON: () => first.toJSON(),
    fromJSON: (input) => stores.map((s) => s.fromJSON(input)).every(Boolean),
    toURL: (base) => first.toURL(base),
    define: all((s, items: readonly InspectItem[]) => s.define(items)),
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
