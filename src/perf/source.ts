/* ARTINOS performance sources — what a performance panel reads. A source is anything that can report
   how a program is running, and the panel does not care where the figures come from:

     perfMonitor()      this browser page, measured (perf/monitor.ts)
     createPerfFeed()   figures you already have: an Electron or Tauri host, a game engine, a render
                        farm, a server over a socket. Push what you know; the panel shows just that.

   A figure nobody reported is NaN, and panels leave it out. No React. */
import { signal } from '../core/signal';
import type { ReadSignal } from '../core/signal';

export type PerfPressure = 'nominal' | 'fair' | 'serious' | 'critical';

export interface PerfStats {
  /** Frames per second. */
  fps: number;
  /** The mean frame, ms. */
  frameMs: number;
  /** The frame rate of the slowest 1% of frames. */
  low1: number;
  p95: number;
  p99: number;
  worst: number;
  /** The display's refresh rate. */
  refresh: number;
  /** One frame's budget, ms. */
  budget: number;
  /** Recent frames over 1.5× the budget. */
  janks: number;
  /** Frames missed so far. */
  dropped: number;
  /** How busy the CPU (or, in a browser, the main thread) is, 0–1. */
  mainLoad: number;
  /** The CPU's work on a frame, ms. */
  frameWork: number;
  /** Tasks over 50 ms in the last minute. */
  longTasks: number;
  longestTask: number;
  /** The slowest recent response to input, ms. */
  inputDelay: number;
  pressure: PerfPressure | null;
  cores: number;
  gpuName: string | null;
  gpuMs: number;
  /** How busy the GPU is, 0–1. */
  gpuLoad: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  geometries: number;
  programs: number;
  /** Memory in use, MB. */
  heapUsed: number;
  heapTotal: number;
  /** The most it may use, MB. */
  heapLimit: number;
  /** MB a minute. */
  heapGrowth: number;
  collections: number;
  deviceMemory: number;
  domNodes: number;
  pixelRatio: number;
  viewport: string;
  connection: string | null;
  /** What measuring costs, µs a frame. */
  cost: number;
}

export interface PerfTimer {
  name: string;
  begin(): void;
  end(): void;
  measure<T>(fn: () => T): T;
  /** Time spent per frame, ms. */
  ms(): number;
}

export interface PerfReport {
  at: string;
  stats: PerfStats;
  timers: Record<string, number>;
  /** The recent frames, oldest first, ms. */
  frames: number[];
}

/** What every panel, tile and readout reads. */
export interface PerfSource {
  /** The figures, kept current. */
  get(): PerfStats;
  /** Counts up each time the figures are refreshed. */
  readonly updated: ReadSignal<number>;
  readonly paused: ReadSignal<boolean>;
  /** A renderer is connected, so its figures are worth showing. */
  readonly connected: ReadSignal<boolean>;
  /** The names of the timers so far. */
  readonly timers: ReadSignal<readonly string[]>;
  pause(on: boolean): void;
  reset(): void;
  /** Called with each frame's ms. Returns the way to stop. */
  onFrame(listener: (ms: number) => void): () => void;
  /** A recent frame's ms: 0 is the newest. */
  frameAt(back: number): number;
  /** Time a part of your frame. The same name gives the same timer. */
  timer(name: string): PerfTimer;
  /** The figures and recent frames as a plain object. */
  report(): PerfReport;
}

export interface PerfCore extends PerfSource {
  readonly stats: PerfStats;
  /** Record one frame. */
  addFrame(ms: number): void;
  /** Work out the frame figures from the recent frames. */
  summarize(detectRefresh: boolean): void;
  /** Tell readers the figures changed. */
  publish(): void;
  listening(): boolean;
  setConnected(on: boolean): void;
}

const HISTORY = 480;
const RATES = [30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 180, 240, 360];

export const blankStats = (): PerfStats => ({
  fps: NaN, frameMs: NaN, low1: NaN, p95: NaN, p99: NaN, worst: NaN, refresh: NaN, budget: 1000 / 60, janks: NaN, dropped: NaN,
  mainLoad: NaN, frameWork: NaN, longTasks: NaN, longestTask: NaN, inputDelay: NaN, pressure: null, cores: NaN,
  gpuName: null, gpuMs: NaN, gpuLoad: NaN, drawCalls: NaN, triangles: NaN, textures: NaN, geometries: NaN, programs: NaN,
  heapUsed: NaN, heapTotal: NaN, heapLimit: NaN, heapGrowth: NaN, collections: NaN, deviceMemory: NaN,
  domNodes: NaN, pixelRatio: NaN, viewport: '', connection: null, cost: NaN,
});

/** The parts every source shares: the frame history, its figures, timers and the report. */
export function createPerfCore(wake: () => void = () => {}): PerfCore {
  const stats = blankStats();
  const frames = new Float32Array(HISTORY);
  const sorted = new Float32Array(HISTORY);
  let head = 0;
  let count = 0;
  const updated = signal(0);
  const paused = signal(false);
  const connected = signal(false);
  const timerNames = signal<readonly string[]>([]);
  const listeners = new Set<(ms: number) => void>();
  const timers = new Map<string, PerfTimer & { sample(): void }>();

  const makeTimer = (name: string) => {
    let start = 0;
    let spent = 0;
    let seen = 0;
    let smooth = 0;
    const timer = {
      name,
      begin() {
        start = performance.now();
      },
      end() {
        spent += performance.now() - start;
      },
      measure<T>(fn: () => T) {
        timer.begin();
        try {
          return fn();
        } finally {
          timer.end();
        }
      },
      ms: () => smooth,
      sample() {
        const n = count - seen;
        seen = count;
        if (n > 0) smooth += (spent / n - smooth) * 0.5;
        spent = 0;
      },
    };
    return timer;
  };

  return {
    stats,
    updated,
    paused,
    connected,
    timers: timerNames,
    get() {
      wake();
      return stats;
    },
    pause: (on) => paused.set(on),
    reset() {
      head = 0;
      count = 0;
      frames.fill(0);
      if (Number.isFinite(stats.dropped)) stats.dropped = 0;
      if (Number.isFinite(stats.collections)) stats.collections = 0;
      stats.inputDelay = NaN;
      updated.set((n) => n + 1);
    },
    onFrame(listener) {
      wake();
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    frameAt: (back) => (back < Math.min(count, HISTORY) ? frames[(head - 1 - back + HISTORY * 2) % HISTORY] : NaN),
    timer(name) {
      let t = timers.get(name);
      if (!t) {
        t = makeTimer(name);
        timers.set(name, t);
        timerNames.set([...timers.keys()]);
      }
      return t;
    },
    report() {
      const n = Math.min(count, HISTORY);
      return {
        at: new Date().toISOString(),
        stats: { ...stats },
        timers: Object.fromEntries([...timers].map(([name, t]) => [name, t.ms()])),
        frames: Array.from({ length: n }, (_, i) => Number(frames[(head - n + i + HISTORY * 2) % HISTORY].toFixed(2))),
      };
    },
    addFrame(ms) {
      if (paused.peek()) return;
      frames[head] = ms;
      head = (head + 1) % HISTORY;
      count++;
      stats.dropped = (stats.dropped || 0) + (ms > stats.budget * 1.5 ? Math.round(ms / stats.budget) - 1 : 0);
      listeners.forEach((l) => l(ms));
    },
    summarize(detectRefresh) {
      timers.forEach((t) => t.sample());
      const n = Math.min(count, HISTORY);
      if (!n) return;
      for (let i = 0; i < n; i++) sorted[i] = frames[(head - 1 - i + HISTORY * 2) % HISTORY];
      let span = 0;
      let inSecond = 0;
      while (inSecond < n && span < 1000) span += sorted[inSecond++];
      let sum = 0;
      let janks = 0;
      const view = sorted.subarray(0, n);
      for (let i = 0; i < n; i++) {
        sum += view[i];
        if (view[i] > stats.budget * 1.5) janks++;
      }
      view.sort();
      const pct = (p: number) => view[Math.min(n - 1, Math.floor(n * p))];
      if (detectRefresh) {
        // the display's rate is the nearest real rate to the typical frame
        const typical = 1000 / pct(0.5);
        const rate = RATES.reduce((a, b) => (Math.abs(b - typical) < Math.abs(a - typical) ? b : a));
        if (!(rate < stats.refresh) || n >= 120) {
          stats.refresh = rate;
          stats.budget = 1000 / rate;
        }
      }
      stats.fps = span ? (inSecond * 1000) / span : NaN;
      stats.frameMs = sum / n;
      stats.p95 = pct(0.95);
      stats.p99 = pct(0.99);
      stats.low1 = 1000 / stats.p99;
      stats.worst = view[n - 1];
      stats.janks = janks;
    },
    publish: () => updated.set((n) => n + 1),
    listening: () => listeners.size > 0,
    setConnected: (on) => connected.set(on),
  };
}

export interface PerfFeed extends PerfSource {
  /** Report what you know. Leave out what you do not: the panel leaves it out too. */
  update(figures: Partial<PerfStats>): void;
  /** Report one frame's ms: frame rate, percentiles and the timeline follow from it. */
  frame(ms: number): void;
}

export interface PerfFeedOptions {
  /** One frame's budget, ms. Default 16.7. */
  budget?: number;
  /** Figures to start from. */
  initial?: Partial<PerfStats>;
}

/** A source for figures your program already has. */
export function createPerfFeed({ budget, initial }: PerfFeedOptions = {}): PerfFeed {
  const core = createPerfCore();
  if (budget) core.stats.budget = budget;
  if (initial) Object.assign(core.stats, initial);
  let summarized = 0;
  const { stats: _stats, addFrame: _add, summarize: _sum, publish: _pub, listening: _lis, setConnected: _con, ...source } = core;
  return {
    ...source,
    update(figures) {
      if (core.paused.peek()) return;
      Object.assign(core.stats, figures);
      core.publish();
    },
    frame(ms) {
      core.addFrame(ms);
      const now = performance.now();
      if (now - summarized < 250 || core.paused.peek()) return;
      summarized = now;
      core.summarize(false);
      core.publish();
    },
  };
}
