/* A source's figures as ordinary rows: an Inspector, useControls or createPane shows them the way it
   shows any other read-out. Only what the source reports becomes a row. */
import type { InspectFolder, InspectItem, InspectMonitor } from '../inspector/store';
import { folder, monitor as monitorEntry } from '../pane/schema';
import type { ControlSchema } from '../pane/schema';
import type { PerfSource, PerfStats } from './source';

/** Megabytes, as gigabytes once they are large. */
export const formatMemory = (mb: number) => (Number.isFinite(mb) ? (mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(0)} MB`) : '—');
/** A count in the fewest characters that still reads: 950 · 12.4k · 3.1M. */
export const formatCount = (n: number) => (!Number.isFinite(n) ? '—' : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${(n / 1e3).toFixed(1)}k` : n.toFixed(0));

const percent = (v: number) => (v * 100).toFixed(0);

type Key = keyof PerfStats;
type Group = 'frames' | 'cpu' | 'gpu' | 'memory' | 'page';
type Row = [key: Key, group: Group, label: string, options?: Partial<InspectMonitor>];

const ROWS: readonly Row[] = [
  ['fps', 'frames', 'Frame rate', { unit: 'fps', decimals: 0 }],
  ['low1', 'frames', '1% low', { unit: 'fps', decimals: 0, help: 'The frame rate of the slowest 1% of frames' }],
  ['frameMs', 'frames', 'Mean frame', { unit: 'ms' }],
  ['p95', 'frames', '95th percentile', { unit: 'ms' }],
  ['p99', 'frames', '99th percentile', { unit: 'ms' }],
  ['worst', 'frames', 'Worst frame', { unit: 'ms' }],
  ['janks', 'frames', 'Janks', { decimals: 0, help: 'Recent frames over 1.5× the budget' }],
  ['dropped', 'frames', 'Dropped', { decimals: 0, help: 'Frames missed so far' }],
  ['refresh', 'frames', 'Display', { unit: 'Hz', decimals: 0 }],
  ['mainLoad', 'cpu', 'Load', { unit: '%', format: percent }],
  ['frameWork', 'cpu', 'Frame work', { unit: 'ms' }],
  ['longTasks', 'cpu', 'Long tasks', { unit: '/min', decimals: 0, help: 'Tasks over 50 ms in the last minute' }],
  ['longestTask', 'cpu', 'Longest task', { unit: 'ms', decimals: 0 }],
  ['inputDelay', 'cpu', 'Input delay', { unit: 'ms', decimals: 0, help: 'The slowest recent response to input' }],
  ['pressure', 'cpu', 'System pressure'],
  ['cores', 'cpu', 'Cores', { decimals: 0 }],
  ['gpuName', 'gpu', 'Adapter'],
  ['gpuMs', 'gpu', 'GPU time', { unit: 'ms' }],
  ['gpuLoad', 'gpu', 'Load', { unit: '%', format: percent }],
  ['drawCalls', 'gpu', 'Draw calls', { format: formatCount }],
  ['triangles', 'gpu', 'Triangles', { format: formatCount }],
  ['textures', 'gpu', 'Textures', { decimals: 0 }],
  ['geometries', 'gpu', 'Geometries', { decimals: 0 }],
  ['programs', 'gpu', 'Programs', { decimals: 0 }],
  ['heapUsed', 'memory', 'In use', { format: formatMemory }],
  ['heapTotal', 'memory', 'Allocated', { format: formatMemory }],
  ['heapLimit', 'memory', 'Limit', { format: formatMemory }],
  ['heapGrowth', 'memory', 'Growth', { unit: 'MB/min' }],
  ['collections', 'memory', 'Collections', { decimals: 0 }],
  ['deviceMemory', 'memory', 'Device', { unit: 'GB', decimals: 0 }],
  ['domNodes', 'page', 'DOM nodes', { format: formatCount }],
  ['viewport', 'page', 'Viewport'],
  ['pixelRatio', 'page', 'Pixel ratio', { unit: '×', decimals: 2 }],
  ['connection', 'page', 'Connection'],
  ['cost', 'page', 'Monitor cost', { unit: 'µs', decimals: 0, help: 'What measuring itself spends on a frame' }],
];

const GROUPS: readonly [Group, string, boolean][] = [
  ['frames', 'Frames', true],
  ['cpu', 'CPU', true],
  ['gpu', 'GPU', true],
  ['memory', 'Memory', true],
  ['page', 'Page', false],
];

/** The figures this reading actually holds. */
export const reportedKeys = (stats: PerfStats): Key[] =>
  ROWS.map(([key]) => key).filter((key) => {
    const v = stats[key];
    return typeof v === 'number' ? Number.isFinite(v) : !!v;
  });

export interface PerfRowsOptions {
  /** Only these figures. Default: all of them. */
  only?: readonly Key[];
  /** Other names for any figure: `{ mainLoad: 'Render threads' }`. */
  names?: Partial<Record<Key | Group, string>>;
  /** The folder these sit under. */
  parent?: string;
}

/** The figures as Inspector rows and folders. */
export function perfRows(source: PerfSource, { only, names, parent }: PerfRowsOptions = {}) {
  const id = (name: string) => `perf.${name}`;
  const items: InspectItem[] = ROWS.filter(([key]) => !only || only.includes(key)).map(([key, group, label, options]) => ({
    key: id(key),
    label: names?.[key] ?? label,
    folder: id(group),
    kind: 'monitor',
    read: () => {
      const v = source.get()[key];
      return v === null ? '' : v;
    },
    decimals: 1,
    ...options,
  }));
  const timers = source.timers.peek();
  for (const name of timers) items.push({ key: id(`timer.${name}`), label: name, folder: id('timers'), kind: 'monitor', read: () => source.timer(name).ms(), unit: 'ms', decimals: 2 });
  const used = new Set(items.map((i) => i.folder));
  const folders: InspectFolder[] = GROUPS.filter(([group]) => used.has(id(group))).map(([group, title, open]) => ({ id: id(group), title: names?.[group] ?? title, parent, open }));
  if (timers.length) folders.splice(Math.max(0, folders.length - 1), 0, { id: id('timers'), title: 'Timers', parent, open: true });
  return { items, folders };
}

/** The headline figures for `useControls`: `useControls('App', { ...perfControls(source) })`. */
export function perfControls(source: PerfSource): ControlSchema {
  const entry = (key: Key, options: Parameters<typeof monitorEntry>[1]) => monitorEntry(() => source.get()[key] as number, options);
  return {
    Performance: folder({
      fps: entry('fps', { label: 'Frame rate', unit: 'fps', decimals: 0 }),
      frameMs: entry('frameMs', { label: 'Mean frame', unit: 'ms' }),
      mainLoad: entry('mainLoad', { label: 'CPU', unit: '%', format: percent }),
      gpuLoad: entry('gpuLoad', { label: 'GPU', unit: '%', format: percent }),
      heapUsed: entry('heapUsed', { label: 'Memory', format: formatMemory }),
    }),
  };
}
