/* ARTINOS browser monitor — a performance source that measures the page it runs in. It wakes when
   something reads it and sleeps two seconds after the last reader leaves, so an app pays nothing while
   no monitor is on screen. A browser does not report everything, so each figure is what it says:

     frames     measured from the frame clock
     CPU        an estimate of how busy the page's main thread is. A page cannot read the machine's
                CPU use; where the browser offers it, `pressure` is the system's own word for its load
     GPU        measured when a WebGL2 renderer is connected and the browser offers timer queries
     memory     the JS heap, in Chromium browsers

   A program that knows more (a desktop host, an engine) reports it with createPerfFeed. No React. */
import { onFrame } from '../core/ticker';
import { createPerfCore } from './source';
import type { PerfPressure, PerfSource, PerfStats } from './source';

export interface GpuTimer {
  /** Before the frame's draw calls. */
  begin(): void;
  /** After them. */
  end(): void;
  dispose(): void;
}

/** What `watchRenderer` needs of a renderer: a three.js WebGLRenderer has all of it. */
export interface WatchedRenderer {
  render: (...args: never[]) => unknown;
  getContext?: () => unknown;
  info?: {
    render?: { calls?: number; triangles?: number };
    memory?: { geometries?: number; textures?: number };
    programs?: readonly unknown[] | null;
  };
}

export interface PerfMonitor extends PerfSource {
  /** Measure GPU time on a WebGL2 context. Null when the browser does not offer it. */
  watchContext(gl: WebGL2RenderingContext): GpuTimer | null;
  /** Follow a renderer: GPU time, draw calls, triangles and resources. Returns the way to stop. */
  watchRenderer(renderer: WatchedRenderer): () => void;
}

const REFRESH_MS = 250;
/** With nothing reading for this long, the monitor goes to sleep. */
const IDLE_MS = 2000;
const MB = 1048576;

/** The graphics adapter's name, asked of a context that is thrown away at once. */
function adapterName() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return null;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const raw = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : null;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    // "ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 (0x...) Direct3D11 vs_5_0 ps_5_0, D3D11)" → the card
    const angle = raw?.match(/^ANGLE \([^,]+,\s*([^,]+?)(?:\s*\(0x[0-9a-f]+\))?(?:\s+Direct3D.*|\s+OpenGL.*)?,/i);
    return angle?.[1] ?? raw;
  } catch {
    return null;
  }
}

export function createPerfMonitor(): PerfMonitor {
  let stopClock: (() => void) | null = null;
  let lastUse = 0;
  let lastFrame = 0;
  let lastRefresh = 0;
  let lastSlow = 0;
  let spent = 0;
  let sampled = 0;

  const wake = () => {
    lastUse = performance.now();
    if (stopClock || typeof window === 'undefined') return;
    lastFrame = lastUse;
    busySince = lastUse;
    stats.gpuName ??= adapterName();
    stats.longTasks = 0;
    stats.longestTask = 0;
    stats.collections ||= 0;
    startObservers();
    refreshSlow(lastUse);
    stopClock = onFrame(window, sample);
  };
  const core = createPerfCore(wake);
  const { stats } = core;

  /* the main thread: how long each frame's work runs, and the long tasks between frames */
  let workStart = 0;
  let frameLength = 1000;
  let workSum = 0;
  let workMs = 0;
  let longSum = 0;
  let busySince = 0;
  const longLog: { at: number; ms: number }[] = [];
  const channel = typeof MessageChannel === 'undefined' ? null : new MessageChannel();
  if (channel)
    channel.port1.onmessage = () => {
      const work = Math.min(performance.now() - workStart, frameLength);
      workSum += work;
      workMs += (work - workMs) * 0.1;
    };

  /* GPU */
  const gpuTimers = new Set<{ poll(): number }>();
  const watched = new Set<WatchedRenderer>();
  let gpuValue = NaN;
  let calls = 0;
  let triangles = 0;

  const heapLog: { at: number; used: number }[] = [];
  let countedAt = 0;

  /* browser observers, for as long as the monitor is awake */
  let observers: { disconnect(): void }[] = [];
  const observe = (type: string, handle: (entry: PerformanceEntry) => void, options: Record<string, unknown> = {}) => {
    if (typeof PerformanceObserver === 'undefined' || !PerformanceObserver.supportedEntryTypes?.includes(type)) return;
    try {
      const o = new PerformanceObserver((list) => list.getEntries().forEach(handle));
      o.observe({ type, buffered: false, ...options } as PerformanceObserverInit);
      observers.push(o);
    } catch {
      /* a browser may list a type and still refuse the options */
    }
  };
  const startObservers = () => {
    observe('longtask', (e) => {
      longSum += e.duration;
      longLog.push({ at: e.startTime, ms: e.duration });
    });
    observe('event', (e) => {
      stats.inputDelay = Number.isFinite(stats.inputDelay) ? Math.max(e.duration, stats.inputDelay * 0.9) : e.duration;
    }, { durationThreshold: 16 });
    const Pressure = (globalThis as unknown as { PressureObserver?: new (cb: (records: { state: PerfPressure }[]) => void) => { observe(source: string, o?: object): Promise<void>; disconnect(): void } }).PressureObserver;
    if (Pressure)
      try {
        const o = new Pressure((records) => {
          stats.pressure = records[records.length - 1]?.state ?? stats.pressure;
        });
        o.observe('cpu', { sampleInterval: 1000 }).catch(() => {});
        observers.push(o);
      } catch {
        /* blocked by the page's permissions policy */
      }
  };

  const refreshBusy = (now: number) => {
    const elapsed = now - busySince;
    if (elapsed >= 1000) {
      // the larger of the two, because a long task inside a frame is counted by both
      const load = Math.min(1, Math.max(workSum, longSum) / elapsed);
      stats.mainLoad = Number.isFinite(stats.mainLoad) ? stats.mainLoad + (load - stats.mainLoad) * 0.5 : load;
      workSum = 0;
      longSum = 0;
      busySince = now;
    }
    stats.frameWork = workMs;
    while (longLog.length && longLog[0].at < now - 60000) longLog.shift();
    stats.longTasks = longLog.length;
    stats.longestTask = longLog.reduce((a, t) => Math.max(a, t.ms), 0);
    stats.gpuMs = gpuValue;
    stats.gpuLoad = gpuValue / stats.budget;
  };

  /** What changes slowly, once a second. */
  const refreshSlow = (now: number) => {
    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (memory) {
      const used = memory.usedJSHeapSize / MB;
      const prev = heapLog[heapLog.length - 1];
      if (prev && used < prev.used - 1) {
        stats.collections++;
        heapLog.length = 0;
      }
      heapLog.push({ at: now, used });
      if (heapLog.length > 60) heapLog.shift();
      stats.heapUsed = used;
      stats.heapTotal = memory.totalJSHeapSize / MB;
      stats.heapLimit = memory.jsHeapSizeLimit / MB;
      if (heapLog.length >= 5) stats.heapGrowth = ((used - heapLog[0].used) / (now - heapLog[0].at)) * 60000;
    }
    if (now - countedAt >= 5000 || !countedAt) {
      countedAt = now;
      stats.domNodes = document.getElementsByTagName('*').length;
    }
    stats.pixelRatio = window.devicePixelRatio;
    stats.viewport = `${window.innerWidth} × ${window.innerHeight}`;
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string } };
    stats.cores = nav.hardwareConcurrency ?? NaN;
    stats.deviceMemory = nav.deviceMemory ?? NaN;
    stats.connection = nav.connection?.effectiveType ?? null;
  };

  const sample = (now: number) => {
    const began = performance.now();
    if (began - lastUse > IDLE_MS && !core.listening()) {
      stopClock?.();
      stopClock = null;
      observers.forEach((o) => o.disconnect());
      observers = [];
      return;
    }
    const ms = now - lastFrame;
    lastFrame = now;
    if (core.paused.peek() || document.hidden || ms <= 0 || ms > 1000) return;

    workStart = began;
    frameLength = ms;
    channel?.port2.postMessage(0);
    gpuTimers.forEach((t) => {
      const v = t.poll();
      if (Number.isFinite(v)) gpuValue = Number.isFinite(gpuValue) ? gpuValue + (v - gpuValue) * 0.2 : v;
    });
    if (watched.size) {
      stats.drawCalls = calls;
      stats.triangles = triangles;
      calls = 0;
      triangles = 0;
    }
    const drawing = performance.now();
    core.addFrame(ms);
    let others = performance.now() - drawing;

    if (began - lastSlow >= 1000) {
      lastSlow = began;
      refreshSlow(began);
    }
    if (began - lastRefresh >= REFRESH_MS) {
      lastRefresh = began;
      core.summarize(true);
      refreshBusy(began);
      stats.cost = sampled ? (spent / sampled) * 1000 : NaN;
      spent = 0;
      sampled = 0;
      const telling = performance.now();
      core.publish();
      others += performance.now() - telling;
    }
    spent += performance.now() - began - others;
    sampled++;
  };

  const anyConnected = () => core.setConnected(watched.size > 0 || gpuTimers.size > 0);

  const watchContext = (gl: WebGL2RenderingContext): GpuTimer | null => {
    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2') as { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
    if (!ext) return null;
    const free: WebGLQuery[] = [];
    const pending: WebGLQuery[] = [];
    let open: WebGLQuery | null = null;
    const probe = {
      poll() {
        let value = NaN;
        const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
        while (pending.length && gl.getQueryParameter(pending[0], gl.QUERY_RESULT_AVAILABLE)) {
          const q = pending.shift() as WebGLQuery;
          if (!disjoint) value = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6;
          free.push(q);
        }
        return value;
      },
    };
    gpuTimers.add(probe);
    anyConnected();
    return {
      begin() {
        // a slow GPU falls behind: skip a frame rather than pile up queries
        if (open || pending.length > 4) return;
        open = free.pop() ?? gl.createQuery();
        if (open) gl.beginQuery(ext.TIME_ELAPSED_EXT, open);
      },
      end() {
        if (!open) return;
        gl.endQuery(ext.TIME_ELAPSED_EXT);
        pending.push(open);
        open = null;
      },
      dispose() {
        gpuTimers.delete(probe);
        [...free, ...pending].forEach((q) => gl.deleteQuery(q));
        gpuValue = NaN;
        anyConnected();
      },
    };
  };

  const { stats: _stats, addFrame: _add, summarize: _sum, publish: _pub, listening: _lis, setConnected: _con, ...source } = core;
  return {
    ...source,
    onFrame(listener) {
      const off = core.onFrame(listener);
      return () => {
        off();
        lastUse = performance.now();
      };
    },
    watchContext,
    watchRenderer(renderer) {
      const base = renderer.render;
      const gl = renderer.getContext?.();
      const gpu = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext ? watchContext(gl) : null;
      let depth = 0;
      watched.add(renderer);
      anyConnected();
      renderer.render = function watchedRender(this: unknown, ...args: never[]) {
        if (!depth++) gpu?.begin();
        try {
          return base.apply(this, args);
        } finally {
          if (!--depth) gpu?.end();
          const info = renderer.info;
          calls += info?.render?.calls ?? 0;
          triangles += info?.render?.triangles ?? 0;
          stats.geometries = info?.memory?.geometries ?? NaN;
          stats.textures = info?.memory?.textures ?? NaN;
          stats.programs = info?.programs?.length ?? NaN;
        }
      };
      return () => {
        renderer.render = base;
        watched.delete(renderer);
        gpu?.dispose();
        anyConnected();
      };
    },
  };
}

let shared: PerfMonitor | null = null;

/** The page's monitor: every panel and readout that is not given a source reads this one. */
export function perfMonitor() {
  shared ??= createPerfMonitor();
  return shared;
}

export type { PerfStats };
