/* ARTINOS signals — the value core. A signal is the value: a control bound to one holds no copy of
   it, so a drag can reach the app at frame rate without a React render anywhere. No React, no DOM.

     const speed = signal(1);
     const double = computed(() => speed() * 2);
     const stop = effect(() => draw(double()));
     speed.set(2);          // draw runs once, synchronously
     batch(() => { … });    // several writes, one run of each effect

   Reading a signal inside `computed` or `effect` subscribes to it; `peek()` reads without
   subscribing. Effects see a consistent world: a computed is recomputed before an effect that
   depends on it runs, and an effect whose inputs came out unchanged does not run at all. */

export interface ReadSignal<T> {
  /** The value. Inside `computed` or `effect` this subscribes. */
  (): T;
  /** The value, without subscribing. */
  peek(): T;
  /** Called with each new value. Returns the way to stop. */
  subscribe(listener: (value: T) => void): () => void;
}

export interface Signal<T> extends ReadSignal<T> {
  set(next: T | ((previous: T) => T)): void;
}

export interface SignalOptions<T> {
  /** When two values count as the same, and nothing is told. Default Object.is. */
  equals?: (a: T, b: T) => boolean;
}

interface Source {
  version: number;
  observers: Set<Observer>;
  /** Bring the value up to date (a computed recomputes here). */
  refresh(): void;
}
interface Observer {
  sources: Map<Source, number>;
  stale(): void;
}

let tracking: Observer | null = null;
let depth = 0;
const pending = new Set<() => void>();

/** Effects chasing each other's writes stop here instead of hanging the page. */
const MAX_PASSES = 100;

function flush() {
  if (depth) return;
  depth++;
  try {
    for (let pass = 0; pending.size; pass++) {
      if (pass >= MAX_PASSES) {
        pending.clear();
        throw new Error('ARTINOS signals: effects keep changing what they depend on.');
      }
      const jobs = [...pending];
      pending.clear();
      for (const job of jobs) job();
    }
  } finally {
    depth--;
  }
}

function trigger(source: Source) {
  depth++;
  for (const observer of [...source.observers]) observer.stale();
  depth--;
  flush();
}

const track = (source: Source) => {
  if (!tracking) return;
  source.observers.add(tracking);
  tracking.sources.set(source, source.version);
};

const release = (observer: Observer) => {
  for (const source of observer.sources.keys()) source.observers.delete(observer);
  observer.sources.clear();
};

/** Did anything this observer read really change? */
const changed = (observer: Observer) => {
  for (const [source, seen] of observer.sources) {
    source.refresh();
    if (source.version !== seen) return true;
  }
  return false;
};

function observe<T>(observer: Observer, fn: () => T): T {
  const outer = tracking;
  tracking = observer;
  try {
    return fn();
  } finally {
    tracking = outer;
  }
}

function listen<T>(source: Source, peek: () => T, listener: (value: T) => void) {
  let seen = source.version;
  const job = () => {
    source.refresh();
    if (source.version === seen) return;
    seen = source.version;
    listener(peek());
  };
  const observer: Observer = { sources: new Map(), stale: () => void pending.add(job) };
  source.observers.add(observer);
  return () => {
    source.observers.delete(observer);
    pending.delete(job);
  };
}

export function signal<T>(initial: T, { equals = Object.is }: SignalOptions<T> = {}): Signal<T> {
  let value = initial;
  const source: Source = { version: 0, observers: new Set(), refresh() {} };
  const read = (() => {
    track(source);
    return value;
  }) as Signal<T>;
  read.peek = () => value;
  read.subscribe = (listener) => listen(source, () => value, listener);
  read.set = (next) => {
    const v = typeof next === 'function' ? (next as (previous: T) => T)(value) : next;
    if (equals(value, v)) return;
    value = v;
    source.version++;
    trigger(source);
  };
  return read;
}

export function computed<T>(fn: () => T, { equals = Object.is }: SignalOptions<T> = {}): ReadSignal<T> {
  let value: T;
  let ready = false;
  let dirty = true;
  const source: Source = {
    version: 0,
    observers: new Set(),
    refresh() {
      if (!dirty) return;
      dirty = false;
      if (ready && !changed(observer)) return;
      release(observer);
      const next = observe(observer, fn);
      if (ready && equals(value, next)) return;
      value = next;
      ready = true;
      source.version++;
    },
  };
  const observer: Observer = {
    sources: new Map(),
    stale() {
      if (dirty) return;
      dirty = true;
      for (const o of [...source.observers]) o.stale();
    },
  };
  const peek = () => {
    source.refresh();
    return value;
  };
  const read = (() => {
    source.refresh();
    track(source);
    return value;
  }) as ReadSignal<T>;
  read.peek = peek;
  read.subscribe = (listener) => {
    source.refresh();
    return listen(source, peek, listener);
  };
  return read;
}

/** Runs now and again whenever what it read changes. It may return a cleanup. Returns the way to stop. */
export function effect(fn: () => void | (() => void)): () => void {
  let cleanup: void | (() => void);
  let stopped = false;
  const run = () => {
    if (typeof cleanup === 'function') cleanup();
    cleanup = undefined;
    release(observer);
    cleanup = observe(observer, fn);
  };
  const job = () => {
    if (!stopped && changed(observer)) run();
  };
  const observer: Observer = { sources: new Map(), stale: () => void pending.add(job) };
  depth++;
  try {
    run();
  } finally {
    depth--;
  }
  flush();
  return () => {
    stopped = true;
    pending.delete(job);
    release(observer);
    if (typeof cleanup === 'function') cleanup();
  };
}

/** Several writes as one: every effect and listener runs once, after the last. */
export function batch<T>(fn: () => T): T {
  depth++;
  try {
    return fn();
  } finally {
    depth--;
    flush();
  }
}

/** Read signals inside an effect without subscribing to them. */
export function untrack<T>(fn: () => T): T {
  const outer = tracking;
  tracking = null;
  try {
    return fn();
  } finally {
    tracking = outer;
  }
}
