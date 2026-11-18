'use client';
import { useEffect, useRef } from 'react';
import { cx } from '../core/utils';
import type { InstrumentTone } from './zones';

/* ARTINOS Graph — a live trace that never asks React for anything. It samples on the frame clock,
   writes its paths and its figure straight onto the page, and rests while it is off screen, so a
   monitor costs the same however many panels are open. Several series can stack; a budget draws a
   line across the trace and turns it to the fault colour while the latest reading is over. */

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
  className?: string;
}

const W = 100;
const H = 100;

export function GraphTrace({ read, series, stacked, samples = 120, interval = 0, min, max, budget, tone = 'live', label, onSample, className }: GraphTraceProps) {
  const root = useRef<SVGSVGElement>(null);
  const budgetLine = useRef<SVGLineElement>(null);
  const lines = useRef<(SVGPathElement | null)[]>([]);
  const areas = useRef<(SVGPathElement | null)[]>([]);
  const feeds = useRef<(() => number)[]>([]);
  feeds.current = series ? series.map((s) => s.read) : read ? [read] : [];
  const told = useRef(onSample);
  told.current = onSample;
  const count = series?.length ?? 1;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const rings = Array.from({ length: count }, () => new Float32Array(samples));
    let filled = 0;
    let head = 0;
    let raf = 0;
    let last = 0;
    let seen = true;
    const watch = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([e]) => void (seen = e.isIntersecting));
    watch?.observe(el);

    const at = (s: number, i: number) => rings[s][(head - filled + i + samples) % samples];
    const paint = () => {
      const totals = (i: number, upTo: number) => {
        let sum = 0;
        for (let s = 0; s <= upTo; s++) sum += at(s, i);
        return sum;
      };
      let lo = min ?? Infinity;
      let hi = max ?? -Infinity;
      if (min === undefined || max === undefined)
        for (let i = 0; i < filled; i++)
          for (let s = 0; s < count; s++) {
            const v = stacked ? totals(i, s) : at(s, i);
            if (min === undefined) lo = Math.min(lo, v);
            if (max === undefined) hi = Math.max(hi, v);
          }
      if (stacked && min === undefined) lo = 0;
      if (budget !== undefined && max === undefined) hi = Math.max(hi, budget * 1.15);
      if (!(hi > lo)) hi = lo + 1;
      const y = (v: number) => H - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo) * H;
      const x = (i: number) => (W * (samples - filled + i)) / (samples - 1);
      for (let s = 0; s < count; s++) {
        let top = '';
        for (let i = 0; i < filled; i++) top += `${i ? 'L' : 'M'}${x(i).toFixed(2)} ${y(stacked ? totals(i, s) : at(s, i)).toFixed(2)}`;
        lines.current[s]?.setAttribute('d', top);
        let floor = `L${x(filled - 1).toFixed(2)} ${H}L${x(0).toFixed(2)} ${H}Z`;
        if (stacked && s > 0) {
          floor = '';
          for (let i = filled - 1; i >= 0; i--) floor += `L${x(i).toFixed(2)} ${y(totals(i, s - 1)).toFixed(2)}`;
          floor += 'Z';
        }
        areas.current[s]?.setAttribute('d', filled > 1 ? top + floor : '');
      }
      if (budget !== undefined) {
        const by = y(budget).toFixed(2);
        budgetLine.current?.setAttribute('y1', by);
        budgetLine.current?.setAttribute('y2', by);
      }
    };
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!seen || now - last < interval) return;
      last = now;
      let total = 0;
      feeds.current.forEach((feed, s) => {
        const v = feed();
        rings[s][head] = Number.isFinite(v) ? v : 0;
        total = stacked ? total + rings[s][head] : rings[s][head];
      });
      head = (head + 1) % samples;
      filled = Math.min(samples, filled + 1);
      paint();
      el.toggleAttribute('data-over', budget !== undefined && total > budget);
      told.current?.(total);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      watch?.disconnect();
    };
  }, [count, samples, interval, min, max, budget, stacked]);

  return (
    <svg ref={root} className={cx('ar-graph__trace', className)} data-tone={tone} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
      {Array.from({ length: count }, (_, s) => (
        <g key={s} className="ar-graph__series" data-tone={series?.[s]?.tone ?? tone}>
          <path ref={(p) => void (areas.current[s] = p)} className="ar-graph__area" />
          <path ref={(p) => void (lines.current[s] = p)} className="ar-graph__line" />
        </g>
      ))}
      {budget !== undefined ? <line ref={budgetLine} className="ar-graph__budget" x1="0" x2={W} y1="0" y2="0" /> : null}
    </svg>
  );
}

export interface GraphProps extends Omit<GraphTraceProps, 'onSample'> {
  unit?: string;
  decimals?: number;
  /** How the figure reads a value. Default: fixed to `decimals`. */
  format?: (value: number) => string;
}

/** How often a figure changes: fast enough to feel live, slow enough to read. */
const FIGURE_MS = 120;

/** A name, a figure and a live trace beneath them. */
export function Graph({ label, unit, decimals = 1, format, series, className, ...trace }: GraphProps) {
  const figure = useRef<HTMLSpanElement>(null);
  const shownAt = useRef(0);
  const show = (v: number) => {
    const now = performance.now();
    if (now - shownAt.current < FIGURE_MS || !figure.current) return;
    shownAt.current = now;
    figure.current.textContent = format ? format(v) : v.toFixed(decimals);
  };
  return (
    <div className={cx('ar-graph', className)}>
      <div className="ar-graph__head">
        <span className="ar-graph__name">{label}</span>
        <span className="ar-graph__figure">
          <span ref={figure}>—</span>
          {unit ? <em>{unit}</em> : null}
        </span>
      </div>
      <GraphTrace label={label} series={series} onSample={show} {...trace} />
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

export interface FrameGraphProps {
  /** The frame budget in ms. Default 16.7 (60 fps). */
  budget?: number;
  label?: string;
  className?: string;
}

/** The page's own frame rate: the figure in fps, the trace in ms against the budget. */
export function FrameGraph({ budget = 16.7, label = 'Frame rate', className }: FrameGraphProps) {
  const clock = useRef({ last: 0, smooth: budget });
  const read = () => {
    const now = performance.now();
    const c = clock.current;
    const ms = c.last ? now - c.last : budget;
    c.last = now;
    c.smooth += (ms - c.smooth) * 0.12;
    return ms;
  };
  return <Graph label={label} unit="fps" read={read} budget={budget} min={0} format={() => (1000 / clock.current.smooth).toFixed(0)} className={className} />;
}
