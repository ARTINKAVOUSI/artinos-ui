/* ARTINOS trace — the drawing engine behind every live graph. A new reading adds one short piece at
   the leading edge of a scrolling strip (display/strip.ts), so the cost of a frame does not grow with
   the history on screen. The whole trace is drawn again only when its range or its size changes. */
import { createStrip } from './strip';

export interface TraceInks {
  /** One colour per series. */
  series: readonly string[];
  /** A reading over the budget. */
  over: string;
}

export interface TraceOptions {
  samples: number;
  series: number;
  /** Pile the series on each other. */
  stacked?: boolean;
  min?: number;
  max?: number;
  budget?: number;
  /** How strongly the area under the line is filled, 0–1. Default 0.14. */
  area?: number;
  /** The range changed: where anything laid over the trace belongs now. */
  onRange?: (lo: number, hi: number) => void;
}

export interface Trace {
  push(values: ArrayLike<number>): void;
  /** Match the picture to its box and draw everything again. */
  resize(): void;
  inks(inks: TraceInks): void;
}

/** How often a fitted range checks whether it can tighten, in readings. */
const REFIT_EVERY = 30;

export function createTrace(host: HTMLElement, { samples, series, stacked = false, min, max, budget, area = 0.14, onRange }: TraceOptions): Trace {
  const strip = createStrip(host);
  const rings = Array.from({ length: series }, () => new Float32Array(samples));
  const fitted = min === undefined || max === undefined;
  let head = 0;
  let filled = 0;
  let pushes = 0;
  let carry = 0;
  let lo = min ?? 0;
  let hi = max ?? 1;
  let ink: TraceInks = { series: [], over: '' };

  strip.prepare((ctx) => {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  });

  const at = (s: number, i: number) => rings[s][(head - filled + i + samples * 2) % samples];
  const height = (s: number, i: number) => {
    if (!stacked) return at(s, i);
    let sum = 0;
    for (let k = 0; k <= s; k++) sum += at(k, i);
    return sum;
  };
  const y = (v: number) => {
    const H = strip.height;
    const pad = strip.pixelRatio;
    return H - pad - ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (H - 2 * pad);
  };
  const step = () => strip.width / (samples - 1);

  /** The range the readings on screen call for. */
  const wanted = (): [number, number] => {
    let a = min ?? Infinity;
    let b = max ?? -Infinity;
    for (let i = 0; i < filled; i++)
      for (let s = 0; s < series; s++) {
        const v = height(s, i);
        if (min === undefined && v < a) a = v;
        if (max === undefined && v > b) b = v;
      }
    if (stacked && min === undefined) a = 0;
    if (budget !== undefined && max === undefined) b = Math.max(b, budget * 1.15);
    if (!Number.isFinite(a)) a = 0;
    if (!(b > a)) b = a + 1;
    const air = b - a;
    if (max === undefined) b += air * 0.08;
    // a fitted floor leaves room under the line, so a steady reading does not lie on the edge
    if (min === undefined && !stacked) a -= air * 0.35;
    return [a, b];
  };

  const segment = (ctx: CanvasRenderingContext2D, s: number, i: number, x0: number, x1: number) => {
    const v = height(s, i);
    const y0 = y(height(s, i - 1));
    const y1 = y(v);
    const colour = budget !== undefined && v > budget ? ink.over : (ink.series[s] ?? ink.over);
    ctx.fillStyle = colour;
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1.25 * strip.pixelRatio;
    ctx.globalAlpha = area;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1, stacked && s > 0 ? y(height(s - 1, i)) : strip.height);
    ctx.lineTo(x0, stacked && s > 0 ? y(height(s - 1, i - 1)) : strip.height);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };

  const redraw = () =>
    strip.repaint((ctx) => {
      const W = strip.width;
      const d = step();
      for (let s = 0; s < series; s++) for (let i = 1; i < filled; i++) segment(ctx, s, i, W - (filled - i) * d, W - (filled - 1 - i) * d);
    });

  const applyRange = ([a, b]: [number, number]) => {
    lo = a;
    hi = b;
    onRange?.(lo, hi);
    redraw();
  };

  return {
    inks(next) {
      if (next.over === ink.over && next.series.join() === ink.series.join()) return;
      ink = next;
      redraw();
    },
    resize() {
      if (strip.measure()) applyRange(fitted ? wanted() : [lo, hi]);
    },
    push(values) {
      for (let s = 0; s < series; s++) rings[s][head] = Number.isFinite(values[s]) ? values[s] : 0;
      head = (head + 1) % samples;
      filled = Math.min(samples, filled + 1);
      pushes++;
      if (!strip.width || filled < 2) return;
      if (strip.stale) return redraw();
      if (fitted) {
        const top = height(series - 1, filled - 1);
        const outside = top > hi || top < lo;
        if (outside || pushes % REFIT_EVERY === 0) {
          const [a, b] = wanted();
          // it widens at once and tightens only for a real change, so the picture does not breathe
          if (outside || b - a < (hi - lo) * 0.7) return applyRange([a, b]);
        }
      }
      carry += step();
      const shift = Math.floor(carry);
      if (!shift) return;
      carry -= shift;
      strip.advance(shift, (ctx, x0, x1) => {
        for (let s = 0; s < series; s++) segment(ctx, s, filled - 1, x0, x1);
      });
    },
  };
}
