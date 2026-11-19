'use client';
import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { useControllable } from '../core/hooks';
import { windowOf } from '../core/realm';
import type { ReadSignal } from '../core/signal';
import { clamp, clamp01, cx, readStored, writeStored } from '../core/utils';
import { ContextMenu } from '../overlays/Menu';
import { useLiveReading } from './live';
import { createStrip } from './strip';
import { createTrace } from './trace';

/* ARTINOS MonitorCell — one watched value in one control's height: its name, a small picture and the
   number, in the same well as a slider. The picture has several views of the same value, and a click
   moves to the next (a right-click lists them): every event against a limit, the recent history, the
   level with its peak, how the readings spread, and what the value is made of. Hover the picture to
   read the past in the cell's own readout. Cells line up in a MonitorStrip: a row for a toolbar, a
   stack for a panel. */

export type MonitorView = 'bars' | 'trace' | 'level' | 'spread' | 'parts';
export type MonitorStatus = 'ok' | 'warn' | 'fault' | 'idle';

export interface MonitorReading {
  /** The figure, as it should read. */
  value: string | number;
  unit?: string;
  status?: MonitorStatus;
  /** How it is doing, in a word: shown beside the name when it needs attention. */
  state?: string;
  /** How full it is, 0–1: the level view. */
  share?: number;
  /** What the history plots. Default: `value`, when it is a number. */
  plot?: number;
  /** The line readings are measured against. */
  limit?: number;
  /** What it is made of: the parts view. The last part may be `rest`, what is left over. */
  parts?: readonly { label: string; value: number; rest?: boolean }[];
}

export interface MonitorCellProps {
  label: ReactNode;
  /** Follow a live value: called on each `clock` change, or every 250 ms without one. */
  read?: () => MonitorReading;
  clock?: ReadSignal<unknown>;
  /** A fixed reading, in place of `read`. */
  reading?: MonitorReading;
  /** A stream of single events for the bars and spread views: call `push` with each. Keep it stable. */
  subscribe?: (push: (value: number) => void) => () => void;
  /** Earlier events to open with: 0 is the newest. */
  valueAt?: (back: number) => number;
  /** The views a click moves through. Default history, level, spread. */
  views?: readonly MonitorView[];
  view?: MonitorView;
  defaultView?: MonitorView;
  onViewChange?: (view: MonitorView) => void;
  /** Remembers the chosen view under this key. */
  storageKey?: string;
  /** How a past reading reads under the pointer. */
  format?: (value: number) => string;
  /** The names of the views in the menu, for another language. */
  viewLabels?: Partial<Record<MonitorView, string>>;
  /** How many readings the picture holds. Default 96. */
  samples?: number;
  className?: string;
}

const VIEW_LABELS: Record<MonitorView, string> = { bars: 'Every event', trace: 'History', level: 'Level', spread: 'Spread', parts: 'Parts' };
const BINS = 14;

export function MonitorCell({ label, read, clock, reading, subscribe, valueAt, views = ['trace', 'level', 'spread'], view, defaultView, onViewChange, storageKey, format = (v) => v.toFixed(1), viewLabels, samples = 96, className }: MonitorCellProps) {
  const saved = storageKey ? readStored<MonitorView | null>(storageKey, null) : null;
  const [current, setCurrent] = useControllable<MonitorView>(view, saved && views.includes(saved) ? saved : (defaultView ?? views[0]));
  const shown: MonitorView = views.includes(current) ? current : views[0];

  const root = useRef<HTMLButtonElement>(null);
  const picture = useRef<HTMLSpanElement>(null);
  const cross = useRef<HTMLElement>(null);
  const history = useRef({ values: new Float32Array(samples), head: 0, count: 0 });
  const events = useRef({ values: new Float32Array(samples), head: 0, count: 0 });
  const last = useRef<MonitorReading>({ value: '—' });
  const peak = useRef(0);
  const scrubbing = useRef(false);
  const draw = useRef<(pushed?: number) => void>(() => {});
  const refreshInk = useRef<() => void>(() => {});
  const beats = useRef(0);
  const words = useRef({ format });
  words.current = { format };

  const put = (ring: { values: Float32Array; head: number; count: number }, v: number) => {
    ring.values[ring.head] = v;
    ring.head = (ring.head + 1) % samples;
    ring.count++;
  };
  const at = (ring: { values: Float32Array; head: number; count: number }, back: number) => (back < Math.min(ring.count, samples) ? ring.values[(ring.head - 1 - back + samples * 2) % samples] : NaN);

  const writeFigure = (value: string | number, unit?: string) => {
    const el = root.current;
    if (!el) return;
    const figure = el.querySelector('[data-part="value"]');
    const small = el.querySelector('[data-part="unit"]');
    if (figure && figure.textContent !== String(value)) figure.textContent = String(value);
    if (small && small.textContent !== (unit ?? '')) small.textContent = unit ?? '';
  };

  const apply = (r: MonitorReading) => {
    const el = root.current;
    if (!el) return;
    last.current = r;
    el.dataset.status = r.status ?? 'idle';
    const word = el.querySelector('[data-part="state"]');
    const says = r.status === 'warn' || r.status === 'fault' ? (r.state ?? '') : '';
    if (word && word.textContent !== says) word.textContent = says;
    el.title = r.state ?? '';
    if (!scrubbing.current) writeFigure(r.value, r.unit);
    const point = r.plot ?? (typeof r.value === 'number' ? r.value : NaN);
    if (Number.isFinite(point)) put(history.current, point);
    const share = Number.isFinite(r.share) ? clamp01(r.share as number) : 0;
    peak.current = Math.max(share, peak.current - 0.006);
    // a theme can change under a running picture; asking the page for colours is kept rare
    if (++beats.current % 16 === 0) refreshInk.current();
    draw.current(point);
  };
  useLiveReading(read, clock, apply, root);
  useEffect(() => {
    if (reading) apply(reading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reading]);

  /* the picture: one drawing surface, rebuilt when the view changes */
  useEffect(() => {
    const host = picture.current;
    const el = root.current;
    if (!host || !el) return;
    const view_ = windowOf(el);
    const ink = { ok: '', warn: '', fault: '', mute: '' };
    const readInks = () => el.querySelectorAll<HTMLElement>('[data-ink]').forEach((p) => (ink[p.dataset.ink as keyof typeof ink] = view_.getComputedStyle(p).color));
    readInks();
    const statusInk = () => (last.current.status === 'fault' ? ink.fault : last.current.status === 'warn' ? ink.warn : last.current.status === 'idle' ? ink.mute : ink.ok);
    const stream = subscribe ? events.current : history.current;
    if (subscribe && valueAt && !events.current.count)
      for (let back = samples - 1; back >= 0; back--) {
        const v = valueAt(back);
        if (Number.isFinite(v)) put(events.current, v);
      }

    let measure: () => void;
    let stop: (() => void) | undefined;

    if (shown === 'trace') {
      const t = createTrace(host, { samples, series: 1, budget: last.current.limit, area: 0.1 });
      t.inks({ series: [ink.ok], over: ink.fault });
      refreshInk.current = () => {
        readInks();
        t.inks({ series: [ink.ok], over: ink.fault });
      };
      for (let back = samples - 1; back >= 0; back--) {
        const v = at(history.current, back);
        if (Number.isFinite(v)) t.push([v]);
      }
      measure = () => t.resize();
      draw.current = (pushed) => {
        if (pushed !== undefined && Number.isFinite(pushed)) t.push([pushed]);
      };
    } else {
      const s = createStrip(host);
      refreshInk.current = readInks;
      const limitOf = () => last.current.limit ?? NaN;
      const barInk = (v: number, limit: number) => (v > limit * 2 ? ink.fault : v > limit * 1.05 ? ink.warn : ink.ok);

      const bars = () => {
        const limit = limitOf();
        const top = Number.isFinite(limit) ? limit * 2.5 : Math.max(1e-6, ...Array.from({ length: Math.min(stream.count, samples) }, (_, i) => at(stream, i)));
        const barW = Math.max(1, Math.round(2 * s.pixelRatio));
        const step = barW + Math.max(1, Math.round(s.pixelRatio));
        const mark = (ctx: CanvasRenderingContext2D, x: number, v: number) => {
          const h = Math.max(s.pixelRatio, Math.min(1, v / top) * s.height);
          ctx.fillStyle = Number.isFinite(limit) ? barInk(v, limit) : ink.ok;
          ctx.fillRect(x, s.height - h, barW, h);
        };
        return { step, barW, mark };
      };
      const repaintBars = () =>
        s.repaint((ctx) => {
          const { step, barW, mark } = bars();
          for (let back = 0; back * step < s.width; back++) {
            const v = at(stream, back);
            if (!Number.isFinite(v)) break;
            mark(ctx, s.width - barW - back * step, v);
          }
        });

      const repaint = () =>
        s.repaint((ctx) => {
          const W = s.width;
          const H = s.height;
          const px = s.pixelRatio;
          if (shown === 'level') {
            const share = Number.isFinite(last.current.share) ? clamp01(last.current.share as number) : 0;
            const h = Math.round(3 * px);
            const y = Math.round((H - h) / 2);
            ctx.fillStyle = ink.mute;
            ctx.globalAlpha = 0.35;
            ctx.fillRect(0, y, W, h);
            ctx.globalAlpha = 1;
            ctx.fillStyle = statusInk();
            ctx.fillRect(0, y, Math.round(share * W), h);
            ctx.fillStyle = ink.mute;
            ctx.fillRect(Math.min(W - px, Math.round(peak.current * W)), y - 2 * px, Math.max(1, Math.round(px)), h + 4 * px);
          } else if (shown === 'spread') {
            const limit = limitOf();
            const n = Math.min(stream.count, samples);
            // the scale fits the readings, so a steady value still shows its shape
            let lo = Infinity;
            let hi = -Infinity;
            for (let i = 0; i < n; i++) {
              const v = at(stream, i);
              if (v < lo) lo = v;
              if (v > hi) hi = v;
            }
            const air = Math.max(hi - lo, Math.abs(hi) * 0.04, 1e-6) * 0.12;
            lo -= air;
            hi += air;
            const counts = new Uint16Array(BINS);
            for (let i = 0; i < n; i++) counts[Math.min(BINS - 1, Math.max(0, Math.floor(((at(stream, i) - lo) / (hi - lo)) * BINS)))]++;
            const most = Math.max(1, ...counts);
            const gap = Math.max(1, Math.round(px));
            const barW = (W - gap * (BINS - 1)) / BINS;
            counts.forEach((c, i) => {
              if (!c) return;
              const h = Math.max(px, (c / most) * H);
              ctx.fillStyle = Number.isFinite(limit) && lo + (i / BINS) * (hi - lo) >= limit * 1.05 ? ink.warn : ink.ok;
              ctx.fillRect(i * (barW + gap), H - h, barW, h);
            });
          } else {
            const parts = last.current.parts ?? [];
            const total = parts.reduce((a, p) => a + Math.max(0, p.value), 0) || 1;
            const h = Math.round(5 * px);
            const y = Math.round((H - h) / 2);
            const gap = Math.max(1, Math.round(2 * px));
            let x = 0;
            parts.forEach((p, i) => {
              const w = Math.max(0, (Math.max(0, p.value) / total) * (W - gap * (parts.length - 1)));
              ctx.fillStyle = p.rest ? ink.mute : ink.ok;
              ctx.globalAlpha = p.rest ? 0.3 : Math.max(0.35, 1 - i * 0.25);
              ctx.fillRect(x, y, w, h);
              x += w + gap;
            });
            ctx.globalAlpha = 1;
          }
        });

      measure = () => {
        if (s.measure()) (shown === 'bars' ? repaintBars : repaint)();
      };
      if (shown === 'bars') {
        const advance = (v: number) => {
          if (!s.width) return;
          if (s.stale) return repaintBars();
          const { step, barW, mark } = bars();
          s.advance(step, (ctx, _x0, x1) => mark(ctx, x1 - barW, v));
        };
        draw.current = (pushed) => {
          if (!subscribe && pushed !== undefined && Number.isFinite(pushed)) advance(pushed);
        };
        if (subscribe)
          stop = subscribe((v) => {
            put(events.current, v);
            advance(v);
          });
      } else {
        draw.current = repaint;
        if (subscribe) stop = subscribe((v) => put(events.current, v));
      }
    }
    if (shown === 'trace' && subscribe) stop = subscribe((v) => put(events.current, v));

    const sized = new view_.ResizeObserver(() => measure());
    sized.observe(host);
    return () => {
      stop?.();
      sized.disconnect();
      draw.current = () => {};
      host.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, subscribe, samples]);

  const pick = (next: MonitorView) => {
    setCurrent(next);
    if (storageKey) writeStored(storageKey, next);
    onViewChange?.(next);
  };
  const cycle = () => {
    if (views.length > 1) pick(views[(views.indexOf(shown) + 1) % views.length]);
  };

  /* hover: the past, in the cell's own readout */
  const hover = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (shown !== 'trace' && shown !== 'bars') return;
    const box = e.currentTarget.getBoundingClientRect();
    const ring = shown === 'bars' && subscribe ? events.current : history.current;
    const pitch = shown === 'bars' ? 3 : box.width / (samples - 1);
    const v = at(ring, Math.floor(clamp(box.right - e.clientX, 0, box.width) / pitch));
    if (!Number.isFinite(v)) return;
    scrubbing.current = true;
    writeFigure(words.current.format(v), last.current.unit);
    if (cross.current) {
      cross.current.hidden = false;
      cross.current.style.left = `${e.clientX - box.left}px`;
    }
  };
  const leave = () => {
    scrubbing.current = false;
    writeFigure(last.current.value, last.current.unit);
    if (cross.current) cross.current.hidden = true;
  };

  const names = { ...VIEW_LABELS, ...viewLabels };
  return (
    <ContextMenu disabled={views.length < 2} items={() => views.map((v) => ({ id: v, label: names[v], checked: v === shown, onSelect: () => pick(v) }))}>
      <button ref={root} type="button" className={cx('ar-well ar-monitor', className)} data-status="idle" data-view={shown} aria-label={typeof label === 'string' ? `${label}: ${names[shown]}` : names[shown]} onClick={cycle}>
        <span className="ar-text ar-monitor__name">{label}</span>
        <span className="ar-monitor__state" data-part="state" />
        <span className="ar-monitor__picture" onPointerMove={hover} onPointerLeave={leave}>
          <span ref={picture} className="ar-monitor__canvas" aria-hidden />
          <i ref={cross} className="ar-monitor__cross" hidden />
        </span>
        <span className="ar-value ar-monitor__figure">
          <b data-part="value">—</b>
          <small data-part="unit" />
        </span>
        <i data-ink="ok" hidden />
        <i data-ink="warn" hidden />
        <i data-ink="fault" hidden />
        <i data-ink="mute" hidden />
      </button>
    </ContextMenu>
  );
}

export interface MonitorStripProps {
  children: ReactNode;
  /** A row for a toolbar or status bar, a stack for a panel. Default row. */
  orientation?: 'row' | 'stack';
  className?: string;
}

/** Cells in one line, or stacked with their names, pictures and numbers in shared columns. In a narrow row the pictures give way before the numbers do. */
export function MonitorStrip({ children, orientation = 'row', className }: MonitorStripProps) {
  return (
    <div className={cx('ar-monitors', className)} data-orientation={orientation}>
      <div className="ar-monitors__cells">{children}</div>
    </div>
  );
}
