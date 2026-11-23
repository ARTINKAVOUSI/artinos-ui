'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { windowOf } from '../core/realm';
import type { ReadSignal } from '../core/signal';
import { clamp, clamp01, cx } from '../core/utils';
import { useLiveReading } from './live';
import type { MonitorReading, MonitorStatus } from './MonitorCell';
import { createStrip } from './strip';
import type { InstrumentTone } from './zones';

/* ARTINOS MonitorDeck — a few watched values in the least room they can take. It is one picture:
   every value's history drawn over the whole deck, one over another, each as a share of its own full
   scale; the first value's figure at its head, bold; and one thin line laid over its foot, a key and
   a number for each trace, then whatever else is worth a number. Alone in a pane it is the pane. Move over the well to read
   a moment across every trace; click to hold it (arrow keys step through it, Escape lets go); click
   a key to take its trace out of the picture. It knows nothing of frames: a channel is any `read()`
   that returns a MonitorReading with a `share`. */

export interface DeckChannel {
  id: string;
  label: ReactNode;
  /** `share` (0–1) is what the trace plots; `plot` (default `value`) is what a past reading says. */
  read: () => MonitorReading;
  /** The trace's ink. Default: live, then warm, then neutral. */
  tone?: InstrumentTone;
  /** How a past reading reads under the pointer. */
  format?: (value: number) => string;
}

export interface DeckFact {
  label: string;
  value: string | number;
}

export interface MonitorDeckProps {
  /** The traces, drawn over one another. The first is the bold figure. */
  channels: readonly DeckChannel[];
  /** Whatever else is worth a number, after the traces' keys: read on every reading. */
  facts?: () => readonly DeckFact[];
  /** Read on each change of this signal, or every 250 ms without one. */
  clock?: ReadSignal<unknown>;
  /** How many readings the well holds. Default 120. */
  samples?: number;
  /** Names the deck for assistive technology. */
  label?: string;
  /** "Held", for another language. */
  heldWord?: string;
  className?: string;
}

const TONES: InstrumentTone[] = ['live', 'warm', 'neutral'];
const plain = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1));

export function MonitorDeck({ channels, facts, clock, samples = 120, label, heldWord = 'Held', className }: MonitorDeckProps) {
  const [off, setOff] = useState<readonly string[]>([]);
  const [held, setHeld] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLSpanElement>(null);
  const ids = channels.map((c) => c.id).join('|');
  // every channel's history on one clock, so a moment is read across all of them
  const rings = useMemo(
    () => ({ shares: channels.map(() => new Float32Array(samples)), plots: channels.map(() => new Float32Array(samples)), times: new Float64Array(samples), head: 0, count: 0 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids, samples],
  );
  const last = useRef<MonitorReading[]>([]);
  const scrub = useRef<number | null>(null);
  const paint = useRef<() => void>(() => {});
  const live = useRef({ channels, facts, off, held, heldWord });
  live.current = { channels, facts, off, held, heldWord };

  const slot = (back: number) => (rings.head - 1 - back + samples * 2) % samples;
  const has = (back: number) => back < Math.min(rings.count, samples);

  /** Write the figure, the keys and the facts. No render. */
  const write = () => {
    const el = root.current;
    if (!el) return;
    const s = live.current;
    const back = scrub.current;
    const set = (node: Element | null, text: string) => {
      if (node && node.textContent !== text) node.textContent = text;
    };
    let worst: MonitorStatus = 'idle';
    let word = '';
    s.channels.forEach((channel, c) => {
      const r = last.current[c] ?? { value: '—' };
      const status = r.status ?? 'idle';
      if (status === 'fault' || (status === 'warn' && worst !== 'fault') || (status === 'ok' && worst === 'idle')) worst = status;
      if ((status === 'warn' || status === 'fault') && r.state && (!word || status === 'fault')) word = `${typeof channel.label === 'string' ? channel.label + ' ' : ''}${r.state}`.trim();
      const then = back !== null && has(back) ? rings.plots[c][slot(back)] : NaN;
      const value = Number.isFinite(then) ? (channel.format ?? plain)(then) : String(r.value);
      // a format that already says its unit ("16.7 ms") is left alone
      const unit = Number.isFinite(then) && !/[\d.]$/.test(value) ? '' : (r.unit ?? '');
      el.querySelectorAll(`[data-value="${c}"]`).forEach((node) => set(node, value));
      el.querySelectorAll(`[data-unit="${c}"]`).forEach((node) => set(node, unit));
      el.querySelectorAll<HTMLElement>(`[data-key="${c}"]`).forEach((node) => (node.dataset.status = status));
    });
    el.dataset.status = worst;
    // the word beside the figure: the moment under the pointer, else what needs attention
    set(el.querySelector('[data-part="word"]'), back !== null && has(back) ? `${s.held ? s.heldWord + ' ' : ''}−${((rings.times[slot(0)] - rings.times[slot(back)]) / 1000).toFixed(1)} s` : word);
    const list = s.facts?.() ?? [];
    const host = el.querySelector('[data-part="facts"]');
    if (host) {
      const text = list.map((f) => `${f.label} ${f.value}`).join('|');
      if (host.getAttribute('data-text') !== text) {
        host.setAttribute('data-text', text);
        host.replaceChildren(
          ...list.map((f) => {
            const item = el.ownerDocument.createElement('span');
            const figure = el.ownerDocument.createElement('b');
            figure.textContent = String(f.value);
            item.append(f.label + ' ', figure);
            return item;
          }),
        );
      }
    }
  };

  const apply = (readings: MonitorReading[]) => {
    if (live.current.held) return;
    last.current = readings;
    readings.forEach((r, c) => {
      const point = r.plot ?? (typeof r.value === 'number' ? r.value : NaN);
      rings.plots[c][rings.head] = Number.isFinite(point) ? point : NaN;
      rings.shares[c][rings.head] = Number.isFinite(r.share) ? clamp01(r.share as number) : NaN;
    });
    rings.times[rings.head] = performance.now();
    rings.head = (rings.head + 1) % samples;
    rings.count++;
    write();
    paint.current();
  };
  useLiveReading(() => live.current.channels.map((c) => c.read()), clock, apply, root);

  /* the well: every trace on one surface, drawn whole on a reading (a few hundred points at most) */
  useEffect(() => {
    const host = canvas.current;
    const el = root.current;
    if (!host || !el) return;
    const view = windowOf(el);
    const strip = createStrip(host);
    let inks: string[] = [];
    let hi = '';
    const readInks = () => {
      inks = [...el.querySelectorAll<HTMLElement>('[data-ink]')].map((p) => view.getComputedStyle(p).color);
      hi = view.getComputedStyle(el).color;
    };
    readInks();
    let beats = 0;
    paint.current = () => {
      if (++beats % 24 === 0) readInks();
      const s = live.current;
      const n = Math.min(rings.count, samples);
      strip.repaint((ctx) => {
        const W = strip.width;
        const H = strip.height;
        const px = strip.pixelRatio;
        if (n < 2 || !W) return;
        const x = (back: number) => W - (back * W) / (samples - 1);
        const foot = Math.min(H * 0.34, 20 * px);
        const y = (share: number) => H - foot - share * (H - foot - 2 * px);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        // back to front, so the first value's trace lies on top
        for (let c = s.channels.length - 1; c >= 0; c--) {
          if (s.off.includes(s.channels[c].id)) continue;
          const ring = rings.shares[c];
          let started = false;
          let from = 0;
          ctx.beginPath();
          for (let back = n - 1; back >= 0; back--) {
            const v = ring[slot(back)];
            if (!Number.isFinite(v)) continue;
            if (!started) {
              started = true;
              from = back;
              ctx.moveTo(x(back), y(v));
            } else ctx.lineTo(x(back), y(v));
          }
          if (!started) continue;
          ctx.strokeStyle = inks[c] ?? hi;
          ctx.lineWidth = (c === 0 ? 1.5 : 1.1) * px;
          ctx.stroke();
          // each trace carries a soft area of its own ink, fading down, so three still read as three
          ctx.lineTo(x(0), H);
          ctx.lineTo(x(from), H);
          ctx.closePath();
          const fill = ctx.createLinearGradient(0, 0, 0, H);
          fill.addColorStop(0, inks[c] ?? hi);
          fill.addColorStop(1, 'transparent');
          ctx.fillStyle = fill;
          ctx.globalAlpha = c === 0 ? 0.26 : 0.14;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        // the moment being read: a hairline, and a point on every trace
        const back = scrub.current;
        if (back !== null && back < n) {
          ctx.fillStyle = hi;
          ctx.globalAlpha = 0.7;
          ctx.fillRect(Math.round(x(back)), 0, Math.max(1, Math.round(px)), H);
          ctx.globalAlpha = 1;
          s.channels.forEach((channel, c) => {
            const v = rings.shares[c][slot(back)];
            if (s.off.includes(channel.id) || !Number.isFinite(v)) return;
            ctx.fillStyle = inks[c] ?? hi;
            ctx.beginPath();
            ctx.arc(x(back), y(v), 2.2 * px, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      });
    };
    const sized = new view.ResizeObserver(() => {
      strip.measure();
      paint.current();
    });
    sized.observe(host);
    return () => {
      sized.disconnect();
      paint.current = () => {};
      host.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rings]);

  useEffect(() => {
    write();
    paint.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [off, held]);

  const read = (back: number | null) => {
    scrub.current = back === null ? null : clamp(back, 0, Math.max(0, Math.min(rings.count, samples) - 1));
    write();
    paint.current();
  };
  const hover = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (held) return;
    const box = e.currentTarget.getBoundingClientRect();
    read(Math.round((clamp(box.right - e.clientX, 0, box.width) / box.width) * (samples - 1)));
  };
  const hold = () => {
    if (held) scrub.current = null;
    else if (scrub.current === null) scrub.current = 0;
    setHeld(!held);
  };
  const keys = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Escape' && held) {
      e.preventDefault();
      scrub.current = null;
      return setHeld(false);
    }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    read((scrub.current ?? 0) + (e.key === 'ArrowLeft' ? 1 : -1) * (e.shiftKey ? 10 : 1));
  };

  const hero = channels[0];
  return (
    <div ref={root} className={cx('ar-deck', className)} data-status="idle" data-held={held || undefined} role="group" aria-label={label}>
      <button type="button" className="ar-deck__well" aria-pressed={held} aria-label={typeof hero?.label === 'string' ? hero.label : label} onPointerMove={hover} onPointerLeave={() => !held && read(null)} onClick={hold} onKeyDown={keys}>
        <span ref={canvas} className="ar-deck__canvas" aria-hidden />
        <span className="ar-deck__hero">
          <b data-value={0}>—</b>
          <small>
            <span data-unit={0} />
            <span className="ar-deck__hero-name">{hero?.label}</span>
          </small>
        </span>
        <span className="ar-deck__word" data-part="word" role="status" />
      </button>
      <div className="ar-deck__line">
        {channels.slice(1).map((c, i) => (
          <button key={c.id} type="button" className="ar-deck__key" data-key={i + 1} data-status="idle" aria-pressed={!off.includes(c.id)} onClick={() => setOff(off.includes(c.id) ? off.filter((id) => id !== c.id) : [...off, c.id])}>
            <i className="ar-graph__ink" data-tone={c.tone ?? TONES[(i + 1) % TONES.length]} aria-hidden />
            {c.label}
            <b>
              <span data-value={i + 1}>—</span>
              <span data-unit={i + 1} />
            </b>
          </button>
        ))}
        <span className="ar-deck__facts" data-part="facts" />
      </div>
      {channels.map((c, i) => (
        <i key={c.id} data-ink className="ar-graph__ink" data-tone={c.tone ?? TONES[i % TONES.length]} hidden />
      ))}
    </div>
  );
}
