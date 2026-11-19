'use client';
import { useCallback, useEffect, useRef } from 'react';
import { READOUT_MS } from '../core/reactive';
import { windowOf } from '../core/realm';
import { onFrame } from '../core/ticker';
import { cx } from '../core/utils';
import { createTrace } from './trace';
import type { InstrumentTone } from './zones';

/* ARTINOS Graph — a live trace that never asks React for anything. It samples on the shared frame
   clock, draws on a scrolling strip (display/trace.ts) where only the newest reading costs anything, and rests
   while it is off screen, so a monitor costs almost nothing however many panels are open. Several
   series can stack; a budget draws a line across the trace, and readings over it take the fault colour. */

export interface GraphSeries {
  label: string;
  read: () => number;
  tone?: InstrumentTone;
}

export interface GraphTraceProps {
  /** One reading. Use `series` for several. */
  read?: () => number;
  series?: readonly GraphSeries[];
  /** Pile the series on each other: what a frame's time is made of. */
  stacked?: boolean;
  /** How many readings the trace holds. Default 120. */
  samples?: number;
  /** ms between readings. Default 0: every frame. */
  interval?: number;
  /** Fixed range; otherwise fitted to what is on screen. */
  min?: number;
  max?: number;
  /** A line across the trace, e.g. a 16.7 ms frame. */
  budget?: number;
  tone?: InstrumentTone;
  /** Accessible name. */
  label: string;
  /** Each reading (the total, when stacked), as it comes. */
  onSample?: (value: number) => void;
  /** Earlier readings to open with: 0 is the newest. */
  seed?: (back: number) => number;
  className?: string;
}

export function GraphTrace({ read, series, stacked, samples = 120, interval = 0, min, max, budget, tone = 'live', label, onSample, seed, className }: GraphTraceProps) {
  const root = useRef<HTMLDivElement>(null);
  const picture = useRef<HTMLDivElement>(null);
  const budgetLine = useRef<HTMLElement>(null);
  const feeds = useRef<(() => number)[]>([]);
  feeds.current = series ? series.map((s) => s.read) : read ? [read] : [];
  const told = useRef(onSample);
  told.current = onSample;
  const count = series?.length ?? 1;

  useEffect(() => {
    const el = root.current;
    const host = picture.current;
    if (!el || !host) return;
    // the trace's own window: its frames keep coming, and its observers can see it, when the panel is popped out
    const view = windowOf(el);
    const trace = createTrace(host, {
      samples,
      series: count,
      stacked,
      min,
      max,
      budget,
      onRange(lo, hi) {
        if (budgetLine.current && budget !== undefined) budgetLine.current.style.top = `${(1 - (budget - lo) / (hi - lo)) * 100}%`;
      },
    });
    // the theme's colours, resolved by the page: canvas cannot read a token
    const readInks = () => {
      const inks = [...el.querySelectorAll<HTMLElement>('[data-ink]')].map((p) => view.getComputedStyle(p).color);
      trace.inks({ series: inks.slice(0, count), over: inks[count] });
    };
    readInks();
    if (seed)
      for (let back = samples - 1; back >= 0; back--) {
        const v = seed(back);
        if (Number.isFinite(v)) trace.push([v]);
      }
    const sized = new view.ResizeObserver(() => trace.resize());
    sized.observe(el);
    let seen = true;
    const watch = typeof view.IntersectionObserver === 'undefined' ? null : new view.IntersectionObserver(([e]) => void (seen = e.isIntersecting));
    watch?.observe(el);
    const values = new Float64Array(count);
    let last = 0;
    let inked = 0;
    const stop = onFrame(view, (now) => {
      if (!seen || now - last < interval) return;
      last = now;
      if (now - inked > 4000) {
        inked = now;
        readInks();
      }
      let total = 0;
      for (let s = 0; s < count; s++) {
        values[s] = feeds.current[s]?.() ?? 0;
        total = stacked ? total + values[s] : values[s];
      }
      trace.push(values);
      told.current?.(total);
    });
    return () => {
      stop();
      sized.disconnect();
      watch?.disconnect();
      host.replaceChildren();
    };
  }, [count, samples, interval, min, max, budget, stacked]);

  return (
    <div ref={root} className={cx('ar-graph__trace', className)} role="img" aria-label={label}>
      <div ref={picture} className="ar-graph__picture" aria-hidden />
      {Array.from({ length: count }, (_, s) => (
        <i key={s} data-ink className="ar-graph__ink" data-tone={series?.[s]?.tone ?? tone} hidden />
      ))}
      <i data-ink className="ar-graph__ink" data-tone="hot" hidden />
      {budget !== undefined ? <i ref={budgetLine} className="ar-graph__budget" /> : null}
    </div>
  );
}

export interface GraphProps extends Omit<GraphTraceProps, 'onSample'> {
  unit?: string;
  decimals?: number;
  /** How the figure reads a value. Default: fixed to `decimals`. */
  format?: (value: number) => string;
}

/** A figure that changes without React: `ref` goes on its span, and `show(value)` writes the text
 *  straight to the page, at most every READOUT_MS however often it is called. */
export function useLiveFigure<T = number>(format: (value: T) => string) {
  const ref = useRef<HTMLSpanElement>(null);
  const shownAt = useRef(0);
  const written = useRef(format);
  written.current = format;
  /** Write it now, whatever the pace. */
  const write = useCallback((value: T) => {
    if (ref.current) ref.current.textContent = written.current(value);
  }, []);
  const show = useCallback(
    (value: T) => {
      const now = performance.now();
      if (now - shownAt.current < READOUT_MS) return;
      shownAt.current = now;
      write(value);
    },
    [write],
  );
  return { ref, show, write };
}

/** A name, a figure and a live trace beneath them. */
export function Graph({ label, unit, decimals = 1, format, series, className, ...trace }: GraphProps) {
  const figure = useLiveFigure(format ?? ((v) => v.toFixed(decimals)));
  return (
    <div className={cx('ar-graph', className)}>
      <div className="ar-graph__head">
        <span className="ar-graph__name">{label}</span>
        <span className="ar-graph__figure">
          <span ref={figure.ref}>—</span>
          {unit ? <em>{unit}</em> : null}
        </span>
      </div>
      <GraphTrace label={label} series={series} onSample={figure.show} {...trace} />
      {series && series.length > 1 ? (
        <div className="ar-graph__legend">
          {series.map((s) => (
            <span key={s.label} data-tone={s.tone ?? 'live'}>
              {s.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
