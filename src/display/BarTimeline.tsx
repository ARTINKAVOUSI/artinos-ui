'use client';
import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { windowOf } from '../core/realm';
import { clamp, cx } from '../core/utils';
import { createStrip } from './strip';

/* ARTINOS BarTimeline — every event as a bar against a limit: frame times, request latencies, job
   durations, packet sizes. Bars within the limit are the signal, over it warn, over twice it fault.
   New bars join a scrolling strip, so a stream of thousands costs what the newest bar costs. Hover a
   bar to read it. */

export interface BarTimelineProps {
  /** Accessible name. */
  label: string;
  /** Start the stream: call `push` with each value. Returns the way to stop. */
  subscribe: (push: (value: number) => void) => () => void;
  /** The limit each value is measured against. A function is read again as it runs. */
  limit: number | (() => number);
  /** How many limits the height shows. Default 3. */
  span?: number;
  /** How a value reads on hover. */
  format?: (value: number) => string;
  /** How a limit reads on its line. */
  formatLimit?: (limit: number) => string;
  /** Said on hover for a value over the limit. */
  overLabel?: string;
  /** Older values to start with: 0 is the newest. */
  valueAt?: (back: number) => number;
  /** The picture is held. */
  paused?: boolean;
  /** A click holds or resumes. */
  onToggle?: () => void;
  className?: string;
}

const BAR = 3;
const GAP = 1;
const HISTORY = 1024;

export function BarTimeline({ label, subscribe, limit, span = 3, format = (v) => v.toFixed(1), formatLimit = (v) => v.toFixed(1), overLabel = 'over the limit', valueAt, paused, onToggle, className }: BarTimelineProps) {
  const root = useRef<HTMLDivElement>(null);
  const picture = useRef<HTMLDivElement>(null);
  const pitch = useRef(BAR + GAP);
  const one = useRef<HTMLElement>(null);
  const two = useRef<HTMLElement>(null);
  const cross = useRef<HTMLElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const ring = useRef({ values: new Float32Array(HISTORY), head: 0, count: 0 });
  const held = useRef(paused);
  held.current = paused;
  const limitOf = useRef(() => (typeof limit === 'function' ? limit() : limit));
  limitOf.current = () => (typeof limit === 'function' ? limit() : limit);
  const shown = useRef({ format, overLabel, formatLimit });
  shown.current = { format, overLabel, formatLimit };

  const at = (back: number) => {
    const r = ring.current;
    return back < Math.min(r.count, HISTORY) ? r.values[(r.head - 1 - back + HISTORY * 2) % HISTORY] : NaN;
  };

  useEffect(() => {
    const el = root.current;
    const host = picture.current;
    if (!el || !host) return;
    const strip = createStrip(host);
    const view = windowOf(el);
    const r = ring.current;
    if (valueAt && !r.count)
      for (let back = HISTORY - 1; back >= 0; back--) {
        const v = valueAt(back);
        if (!Number.isFinite(v)) continue;
        r.values[r.head] = v;
        r.head = (r.head + 1) % HISTORY;
        r.count++;
      }
    let drawnLimit = limitOf.current();
    const inks = { ok: '', warn: '', fault: '' };
    // the theme's colours, resolved by the page: canvas cannot read a token
    const readInks = () =>
      el.querySelectorAll<HTMLElement>('[data-ink]').forEach((p) => {
        inks[p.dataset.ink as keyof typeof inks] = view.getComputedStyle(p).color;
      });
    const widths = () => ({ bar: Math.max(1, Math.round(BAR * strip.pixelRatio)), step: Math.max(2, Math.round((BAR + GAP) * strip.pixelRatio)) });
    const mark = (ctx: CanvasRenderingContext2D, x: number, v: number) => {
      const height = Math.max(strip.pixelRatio, Math.min(1, v / (drawnLimit * span)) * strip.height);
      ctx.fillStyle = v > drawnLimit * 2 ? inks.fault : v > drawnLimit * 1.05 ? inks.warn : inks.ok;
      ctx.fillRect(x, strip.height - height, widths().bar, height);
    };
    const full = () =>
      strip.repaint((ctx) => {
        const { bar, step } = widths();
        for (let back = 0; back * step < strip.width; back++) {
          const v = at(back);
          if (!Number.isFinite(v)) break;
          mark(ctx, strip.width - bar - back * step, v);
        }
      });
    const place = () => {
      [one.current, two.current].forEach((line, i) => {
        if (!line) return;
        line.style.bottom = `${((i + 1) / span) * 100}%`;
        line.dataset.label = shown.current.formatLimit(drawnLimit * (i + 1));
      });
    };
    const size = () => {
      if (!strip.measure()) return;
      pitch.current = widths().step / strip.pixelRatio;
      readInks();
      full();
    };
    const sized = new view.ResizeObserver(size);
    sized.observe(host);
    place();
    let beats = 0;
    const stop = subscribe((v) => {
      if (held.current) return;
      r.values[r.head] = v;
      r.head = (r.head + 1) % HISTORY;
      r.count++;
      if (!strip.width) return;
      if (strip.stale) return full();
      if (++beats % 240 === 0) {
        readInks();
        const next = limitOf.current();
        if (next !== drawnLimit) {
          drawnLimit = next;
          place();
          return full();
        }
      }
      const { bar, step } = widths();
      strip.advance(step, (ctx, _x0, x1) => mark(ctx, x1 - bar, v));
    });
    return () => {
      stop();
      sized.disconnect();
      host.replaceChildren();
    };
    // a new stream is a new effect; the rest is read through refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, span]);

  const hover = (e: ReactPointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const v = at(Math.floor((box.right - e.clientX) / pitch.current));
    const el = tip.current;
    if (!el || !cross.current) return;
    const has = Number.isFinite(v);
    el.hidden = !has;
    cross.current.hidden = !has;
    if (!has) return;
    const x = e.clientX - box.left;
    const over = v > limitOf.current() * 1.05;
    el.textContent = shown.current.format(v) + (over ? ` · ${shown.current.overLabel}` : '');
    cross.current.style.left = `${x}px`;
    el.style.left = `${clamp(x - el.offsetWidth / 2, 0, box.width - el.offsetWidth)}px`;
  };
  const leave = () => {
    if (tip.current) tip.current.hidden = true;
    if (cross.current) cross.current.hidden = true;
  };

  return (
    <div ref={root} className={cx('ar-bars', className)} role="img" aria-label={label} data-paused={paused || undefined} data-toggles={onToggle ? '' : undefined} onPointerMove={hover} onPointerLeave={leave} onClick={onToggle}>
      <div ref={picture} className="ar-bars__picture" aria-hidden />
      <i data-ink="ok" hidden />
      <i data-ink="warn" hidden />
      <i data-ink="fault" hidden />
      <i ref={one} className="ar-bars__limit" />
      <i ref={two} className="ar-bars__limit" />
      <i ref={cross} className="ar-bars__cross" hidden />
      <div ref={tip} className="ar-bars__tip" hidden />
    </div>
  );
}
