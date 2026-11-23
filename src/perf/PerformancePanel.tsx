'use client';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { IconButton } from '../actions/IconButton';
import { useCommands, useCommandScope } from '../core/commands';
import { useControllable } from '../core/hooks';
import { useSignalValue } from '../core/useSignal';
import { cx } from '../core/utils';
import { BarTimeline } from '../display/BarTimeline';
import { Graph } from '../display/Graph';
import { useLiveReading } from '../display/live';
import { MonitorCell, MonitorStrip } from '../display/MonitorCell';
import type { MonitorReading, MonitorStatus, MonitorView } from '../display/MonitorCell';
import { MonitorDeck } from '../display/MonitorDeck';
import type { DeckChannel, DeckFact, MonitorDeckProps } from '../display/MonitorDeck';
import { Inspector } from '../inspector/Inspector';
import { createInspectorStore } from '../inspector/store';
import type { InspectFolder, InspectItem } from '../inspector/store';
import { Menu } from '../overlays/Menu';
import { perfHealth } from './health';
import type { PerfHealthWords } from './health';
import { formatCount, formatMemory, perfRows, reportedKeys } from './items';
import type { PerfRowsOptions } from './items';
import { perfMonitor } from './monitor';
import type { PerfSource, PerfStats } from './source';

/* ARTINOS performance — how a program is running, in the room a control panel can spare. PerfStrip is
   one line for a toolbar or a status bar. PerformancePanel is the same cells stacked under a sentence
   saying what the figures mean, and opens to every frame and every figure. Each cell holds several
   views of its value: click one to change it. Give them a source (the browser page by default, or your
   own figures through createPerfFeed) and they show what that source reports. */

/** Every word the panel says, for another language or another domain. */
export const PERF_LABELS = {
  frameRate: 'FPS',
  cpu: 'CPU',
  gpu: 'GPU',
  memory: 'Memory',
  uneven: 'Uneven',
  slow: 'Slow',
  busy: 'Busy',
  saturated: 'Saturated',
  high: 'High',
  critical: 'Critical',
  live: 'Pause',
  held: 'Resume',
  reset: 'Reset figures',
  copy: 'Copy report',
  more: 'More',
  otherWork: 'Other work',
  free: 'Free',
  overBudget: 'over budget',
  timeline: 'Frame times against the frame budget',
  details: 'Show every figure',
  less: 'Show less',
};
export type PerfLabels = typeof PERF_LABELS;

export interface PerfCell {
  id: string;
  label: ReactNode;
  read: (stats: PerfStats) => MonitorReading;
  /** The views this cell offers. */
  views?: readonly MonitorView[];
  /** Its bars show every frame, not the periodic readings. */
  frames?: boolean;
  /** How a past reading reads under the pointer. */
  format?: (value: number) => string;
}

const whole = (v: number) => (Number.isFinite(v) ? v.toFixed(0) : '—');

/** The four headline cells. Use them, reorder them, or mix them with your own. */
export function perfCells(source: PerfSource, words: Partial<PerfLabels> = {}): PerfCell[] {
  const w = { ...PERF_LABELS, ...words };
  const byShare = (share: number, busy: string, full: string): Pick<MonitorReading, 'status' | 'state'> =>
    !Number.isFinite(share) ? { status: 'idle' } : share < 0.7 ? { status: 'ok' } : share < 0.9 ? { status: 'warn', state: busy } : { status: 'fault', state: full };
  /** Where a frame's budget goes: your timers, the rest of the work, and what is left. */
  const budgetParts = (s: PerfStats) => {
    const timed = source.timers.peek().map((name) => ({ label: name, value: source.timer(name).ms() }));
    const used = timed.reduce((a, t) => a + t.value, 0);
    const other = Math.max(0, (Number.isFinite(s.frameWork) ? s.frameWork : 0) - used);
    return [...timed, { label: w.otherWork, value: other }, { label: w.free, value: Math.max(0, s.budget - used - other), rest: true }];
  };
  return [
    {
      id: 'fps',
      label: w.frameRate,
      views: ['bars', 'trace', 'spread'],
      frames: true,
      format: (ms) => `${ms.toFixed(1)} ms`,
      read(s) {
        const share = s.fps / (s.refresh || 60);
        const state: [MonitorStatus, string?] = !Number.isFinite(share) ? ['idle'] : share >= 0.9 ? ['ok'] : share >= 0.6 ? ['warn', w.uneven] : ['fault', w.slow];
        return { value: whole(s.fps), share, plot: s.frameMs, limit: s.budget, status: state[0], state: state[1] };
      },
    },
    {
      id: 'cpu',
      label: w.cpu,
      views: ['trace', 'level', 'parts', 'spread'],
      format: (v) => v.toFixed(0),
      read(s) {
        const state = s.pressure === 'critical' ? { status: 'fault' as const, state: w.saturated } : s.pressure === 'serious' ? { status: 'warn' as const, state: w.busy } : byShare(s.mainLoad, w.busy, w.saturated);
        return { value: whole(s.mainLoad * 100), unit: Number.isFinite(s.mainLoad) ? '%' : '', plot: s.mainLoad * 100, share: s.mainLoad, limit: 70, parts: budgetParts(s), ...state };
      },
    },
    {
      id: 'gpu',
      label: w.gpu,
      views: ['trace', 'level', 'spread'],
      format: (v) => v.toFixed(0),
      read(s) {
        return { value: whole(s.gpuLoad * 100), unit: Number.isFinite(s.gpuLoad) ? '%' : '', plot: s.gpuLoad * 100, share: s.gpuLoad, limit: 70, ...byShare(s.gpuLoad, w.busy, w.saturated) };
      },
    },
    {
      id: 'memory',
      label: w.memory,
      views: ['level', 'trace'],
      format: (mb) => formatMemory(mb),
      read(s) {
        if (!Number.isFinite(s.heapUsed)) return { value: '—', status: 'idle' };
        const large = s.heapUsed >= 1024;
        const share = s.heapUsed / s.heapLimit;
        return { value: large ? (s.heapUsed / 1024).toFixed(1) : s.heapUsed.toFixed(0), unit: large ? 'GB' : 'MB', plot: s.heapUsed, share, ...byShare(share, w.high, w.critical) };
      },
    },
  ];
}

export interface PerfStripProps {
  /** Where the figures come from. Default: this browser page. */
  monitor?: PerfSource;
  /** The cells. Default `perfCells(monitor)`. */
  cells?: readonly PerfCell[];
  /** A row for a toolbar, a stack for a panel. Default row. */
  orientation?: 'row' | 'stack';
  words?: Partial<PerfLabels>;
  /** Remembers each cell's view under this key. */
  storageKey?: string;
  className?: string;
}

/** The headline figures as one strip of cells, for a toolbar, a status bar or a panel. */
export function PerfStrip({ monitor = perfMonitor(), cells, orientation = 'row', words, storageKey, className }: PerfStripProps) {
  const shown = useMemo(() => cells ?? perfCells(monitor, words), [cells, monitor, words]);
  const frames = useCallback((push: (ms: number) => void) => monitor.onFrame(push), [monitor]);
  return (
    <MonitorStrip orientation={orientation} className={className}>
      {shown.map((cell) => (
        <MonitorCell
          key={cell.id}
          label={cell.label}
          read={() => cell.read(monitor.get())}
          clock={monitor.updated}
          subscribe={cell.frames ? frames : undefined}
          valueAt={cell.frames ? monitor.frameAt : undefined}
          views={cell.views}
          format={cell.format}
          storageKey={storageKey ? `${storageKey}.${cell.id}` : undefined}
        />
      ))}
    </MonitorStrip>
  );
}

export interface PerfDeckProps extends Omit<MonitorDeckProps, 'channels' | 'clock' | 'facts'> {
  /** Where the figures come from. Default: this browser page. */
  monitor?: PerfSource;
  words?: Partial<PerfLabels>;
  /** More facts for the line, after the source's own. */
  facts?: (stats: PerfStats) => readonly DeckFact[];
}

/** How a program is running in the least room: the frame rate bold, the CPU and GPU traces over it,
 *  then memory and whatever the renderer reports, on one dense line. */
export function PerfDeck({ monitor = perfMonitor(), words, facts, ...deck }: PerfDeckProps) {
  const channels = useMemo<DeckChannel[]>(() => {
    const w = { ...PERF_LABELS, ...words };
    const load = (id: string, name: string, pick: (s: PerfStats) => number): DeckChannel => ({
      id,
      label: name,
      format: (v) => `${v.toFixed(0)}%`,
      read() {
        const share = pick(monitor.get());
        const known = Number.isFinite(share);
        return { value: known ? (share * 100).toFixed(0) : '—', unit: known ? '%' : '', plot: share * 100, share, status: !known ? 'idle' : share < 0.7 ? 'ok' : share < 0.9 ? 'warn' : 'fault', state: share < 0.9 ? w.busy : w.saturated };
      },
    });
    return [
      {
        id: 'fps',
        label: w.frameRate,
        format: (v) => v.toFixed(0),
        read() {
          const s = monitor.get();
          const share = s.fps / (s.refresh || 60);
          return { value: Number.isFinite(s.fps) ? s.fps.toFixed(0) : '—', plot: s.fps, share, status: !Number.isFinite(share) ? 'idle' : share >= 0.9 ? 'ok' : share >= 0.6 ? 'warn' : 'fault', state: share >= 0.6 ? w.uneven : w.slow };
        },
      },
      load('cpu', w.cpu, (s) => s.mainLoad),
      load('gpu', w.gpu, (s) => s.gpuLoad),
    ];
  }, [monitor, words]);
  const line = useCallback(() => {
    const s = monitor.get();
    const own: DeckFact[] = [];
    const add = (label: string, value: number, say: (v: number) => string) => Number.isFinite(value) && own.push({ label, value: say(value) });
    add('Mem', s.heapUsed, formatMemory);
    add('Calls', s.drawCalls, formatCount);
    add('Tris', s.triangles, formatCount);
    add('Tex', s.textures, formatCount);
    return facts ? [...own, ...facts(s)] : own;
  }, [monitor, words, facts]);
  return <MonitorDeck channels={channels} clock={monitor.updated} facts={line} {...deck} />;
}

/** Every frame of a source against its budget. */
export function FrameTimeline({ monitor = perfMonitor(), words, className }: { monitor?: PerfSource; words?: Partial<PerfLabels>; className?: string }) {
  const w = { ...PERF_LABELS, ...words };
  const paused = useSignalValue(monitor.paused);
  const subscribe = useCallback((push: (ms: number) => void) => monitor.onFrame(push), [monitor]);
  return (
    <BarTimeline
      label={w.timeline}
      subscribe={subscribe}
      limit={() => monitor.get().budget}
      valueAt={monitor.frameAt}
      format={(ms) => `${ms.toFixed(1)} ms · ${(1000 / ms).toFixed(0)} fps`}
      formatLimit={(ms) => `${ms.toFixed(1)} ms`}
      overLabel={w.overBudget}
      paused={paused}
      onToggle={() => monitor.pause(!monitor.paused.peek())}
      className={className}
    />
  );
}

/** What the figures mean, in one line. */
export function PerfHealthLine({ monitor = perfMonitor(), words, children, className }: { monitor?: PerfSource; words?: Partial<PerfHealthWords>; children?: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const apply = (h: ReturnType<typeof perfHealth>) => {
    const el = root.current;
    if (!el) return;
    el.dataset.status = h.status;
    el.dataset.limiter = h.limiter;
    el.title = h.detail;
    const head = el.querySelector('[data-part="headline"]');
    const line = el.querySelector('[data-part="detail"]');
    if (head && head.textContent !== h.headline) head.textContent = h.headline;
    if (line && line.textContent !== h.detail) line.textContent = h.detail;
  };
  useLiveReading(() => perfHealth(monitor.get(), words), monitor.updated, apply, root);
  return (
    <div ref={root} className={cx('ar-perf-health', className)} data-status="idle" role="status">
      <i className="ar-perf-health__light" aria-hidden />
      <strong data-part="headline" />
      <span data-part="detail" />
      {children}
    </div>
  );
}

const MORE = (
  <svg viewBox="0 0 14 14" fill="currentColor" aria-hidden>
    <circle cx="3" cy="7" r="1.1" />
    <circle cx="7" cy="7" r="1.1" />
    <circle cx="11" cy="7" r="1.1" />
  </svg>
);
const OPEN = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3.5 5.5L7 9l3.5-3.5" />
  </svg>
);
const CLOSE = (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3.5 8.5L7 5l3.5 3.5" />
  </svg>
);

export type PerfView = 'compact' | 'extended';

export interface PerformancePanelProps extends Pick<PerfRowsOptions, 'only' | 'names'> {
  /** Where the figures come from. Default: this browser page. */
  monitor?: PerfSource;
  /** compact: the cells. extended: every frame and every figure under them. Default compact. */
  view?: PerfView;
  defaultView?: PerfView;
  onViewChange?: (view: PerfView) => void;
  /** The cells. Default `perfCells(monitor)`. */
  cells?: readonly PerfCell[];
  /** Rows of your own, under the panel's. */
  extraItems?: readonly InspectItem[];
  extraFolders?: readonly InspectFolder[];
  /** Replace any of the panel's words. */
  words?: Partial<PerfLabels>;
  /** Replace any of the diagnosis's sentences. */
  healthWords?: Partial<PerfHealthWords>;
  /** Remembers the cells' views and each folder open or closed under this key. */
  storageKey?: string;
  className?: string;
}

export function PerformancePanel({ monitor = perfMonitor(), view, defaultView = 'compact', onViewChange, cells, only, names, extraItems, extraFolders, words, healthWords, storageKey, className }: PerformancePanelProps) {
  const w = useMemo(() => ({ ...PERF_LABELS, ...words }), [words]);
  const paused = useSignalValue(monitor.paused);
  const timers = useSignalValue(monitor.timers);
  const [size, setSize] = useControllable<PerfView>(view, defaultView, onViewChange);
  const extended = size === 'extended';

  // rows exist for what this source reports, and appear as it starts to report more
  const [reported, setReported] = useState(() => reportedKeys(monitor.get()));
  useEffect(() => {
    if (!extended) return;
    const check = () => {
      const now = reportedKeys(monitor.get());
      setReported((was) => (was.join() === now.join() ? was : now));
    };
    check();
    return monitor.updated.subscribe(check);
  }, [monitor, extended]);
  const rows = useMemo(() => {
    const own = perfRows(monitor, { only: only ? only.filter((k) => reported.includes(k)) : reported, names });
    return { items: [...own.items, ...(extraItems ?? [])], folders: [...own.folders, ...(extraFolders ?? [])] };
  }, [monitor, only, names, reported, timers, extraItems, extraFolders]); // eslint-disable-line react-hooks/exhaustive-deps
  const store = useMemo(() => createInspectorStore(rows.items), [rows]);

  const commandId = useId();
  const scope = useCommandScope();
  const copy = () => void navigator.clipboard?.writeText(JSON.stringify(monitor.report(), null, 2));
  useCommands(() => {
    const group = scope ?? w.frameRate;
    return [
      { id: `${commandId}.hold`, label: `${paused ? w.held : w.live}: ${group}`, group, run: () => monitor.pause(!paused) },
      { id: `${commandId}.reset`, label: `${w.reset}: ${group}`, group, run: () => monitor.reset() },
      { id: `${commandId}.copy`, label: w.copy, group, run: copy },
    ];
  }, `${paused}|${scope}|${w.live}`);

  return (
    <div className={cx('ar-perf', className)} data-view={size}>
      <PerfHealthLine monitor={monitor} words={healthWords}>
        <Menu
          align="end"
          trigger={<IconButton size="sm" label={w.more} icon={MORE} />}
          items={[
            { id: 'hold', label: paused ? w.held : w.live, onSelect: () => monitor.pause(!paused) },
            { id: 'reset', label: w.reset, onSelect: () => monitor.reset() },
            { id: 'copy', label: w.copy, onSelect: copy },
          ]}
        />
        <IconButton size="sm" label={extended ? w.less : w.details} icon={extended ? CLOSE : OPEN} aria-expanded={extended} onClick={() => setSize(extended ? 'compact' : 'extended')} />
      </PerfHealthLine>
      <PerfStrip monitor={monitor} cells={cells} orientation="stack" words={words} storageKey={storageKey} />
      {extended ? (
        <>
          <FrameTimeline monitor={monitor} words={words} />
          <Inspector items={rows.items} folders={rows.folders} store={store} bar={false} keyframes={false} storageKey={storageKey} />
        </>
      ) : null}
    </div>
  );
}

export interface FrameGraphProps {
  monitor?: PerfSource;
  label?: string;
  className?: string;
}

/** A source's frame rate as one graph: the figure in fps, the trace in ms against the budget. */
export function FrameGraph({ monitor = perfMonitor(), label = PERF_LABELS.frameRate, className }: FrameGraphProps) {
  return <Graph label={label} unit="fps" read={() => monitor.frameAt(0)} budget={monitor.get().budget} min={0} format={() => whole(monitor.get().fps)} className={className} />;
}
