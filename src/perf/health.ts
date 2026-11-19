/* What the figures mean, in a sentence. A panel of numbers leaves the reader to work out what is
   wrong; this says it: what is holding the program back, and how much room is left. No React. */
import type { PerfStats } from './source';

export type PerfLimiter = 'none' | 'gpu' | 'cpu' | 'memory' | 'unknown';

export interface PerfHealth {
  status: 'ok' | 'warn' | 'fault' | 'idle';
  /** What is holding it back. */
  limiter: PerfLimiter;
  headline: string;
  detail: string;
}

/** Every sentence the diagnosis can say, for another language or domain. */
export const PERF_HEALTH_WORDS = {
  waiting: 'Measuring',
  waitingDetail: 'The first readings are on their way.',
  smooth: 'Running smoothly',
  smoothDetail: (fps: number, spare: number) => `Holding ${fps} fps with ${spare} ms to spare each frame.`,
  stutter: 'Smooth, with some stutter',
  stutterDetail: (worst: number) => `Most frames are on time; the slowest took ${worst} ms.`,
  gpu: 'Limited by the GPU',
  gpuDetail: (ms: number) => `Drawing takes ${ms} ms a frame. Lower the resolution or the shader cost.`,
  cpu: 'Limited by the CPU',
  cpuDetail: (load: number) => `It is ${load}% busy. Move work off the main thread or spread it over frames.`,
  memory: 'Running out of memory',
  memoryDetail: (share: number) => `${share}% of the limit is in use. Release what is no longer needed.`,
  leak: 'Memory keeps climbing',
  leakDetail: (rate: number) => `Growing ${rate} MB a minute without being collected.`,
  slow: 'Running below the display',
  slowDetail: (fps: number, refresh: number) => `${fps} fps on a ${refresh} Hz display.`,
};
export type PerfHealthWords = typeof PERF_HEALTH_WORDS;

const round = (v: number, digits = 0) => Number(v.toFixed(digits));

/** Read the figures and say what they mean. */
export function perfHealth(s: PerfStats, words: Partial<PerfHealthWords> = {}): PerfHealth {
  const w = { ...PERF_HEALTH_WORDS, ...words };
  const memoryShare = s.heapUsed / s.heapLimit;
  if (memoryShare >= 0.9) return { status: 'fault', limiter: 'memory', headline: w.memory, detail: w.memoryDetail(round(memoryShare * 100)) };
  if (!Number.isFinite(s.fps)) return { status: 'idle', limiter: 'none', headline: w.waiting, detail: w.waitingDetail };

  const target = Number.isFinite(s.refresh) ? s.refresh : 1000 / s.budget;
  const share = s.fps / target;
  if (share < 0.9) {
    const status = share >= 0.6 ? 'warn' : 'fault';
    // the busiest side is what is holding the frame back
    if (s.gpuLoad >= 0.8 && !(s.mainLoad > s.gpuLoad)) return { status, limiter: 'gpu', headline: w.gpu, detail: w.gpuDetail(round(s.gpuMs, 1)) };
    if (s.mainLoad >= 0.7) return { status, limiter: 'cpu', headline: w.cpu, detail: w.cpuDetail(round(s.mainLoad * 100)) };
    return { status, limiter: 'unknown', headline: w.slow, detail: w.slowDetail(round(s.fps), round(target)) };
  }
  if (s.heapGrowth > 30) return { status: 'warn', limiter: 'memory', headline: w.leak, detail: w.leakDetail(round(s.heapGrowth)) };
  if (s.p99 > s.budget * 2) return { status: 'warn', limiter: 'none', headline: w.stutter, detail: w.stutterDetail(round(s.worst)) };
  const spare = Math.max(0, s.budget - Math.max(Number.isFinite(s.frameWork) ? s.frameWork : 0, Number.isFinite(s.gpuMs) ? s.gpuMs : 0));
  return { status: 'ok', limiter: 'none', headline: w.smooth, detail: w.smoothDetail(round(s.fps), round(spare, 1)) };
}
