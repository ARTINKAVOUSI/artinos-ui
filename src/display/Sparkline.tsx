'use client';
import { useId, useLayoutEffect, useRef } from 'react';
import { spring, useFrames } from '../core/motion';
import type { Spring } from '../core/motion';
import { reducedMotion } from '../core/utils';

export interface SparklineProps {
  /** Samples, oldest first. */
  values: readonly number[];
  /** Fixed range; otherwise fitted to the data (and eased, so a new extreme never jolts the line). */
  min?: number;
  max?: number;
  width?: number;
  height?: number;
  /** Area fill under the line. */
  fill?: boolean;
  /** Horizontal reference line, e.g. a 16.7ms budget. */
  threshold?: number;
  tone?: 'live' | 'warm' | 'neutral';
  /** Accessible summary. */
  label: string;
  className?: string;
}

/** How many samples the series scrolled by (1–4): the new one is the old one moved left by that
 *  many. 0 when it is not a scroll. A busy or background tab can land several samples in one render. */
function shiftOf(prev: readonly number[], next: readonly number[]) {
  const n = prev.length;
  if (n !== next.length || n < 6) return 0;
  search: for (let k = 1; k <= 4; k++) {
    for (let i = k; i < n; i++) if (prev[i] !== next[i - k]) continue search;
    return k;
  }
  return 0;
}

interface Geometry {
  line: string;
  area: string;
  headY: number;
  thresholdY: number | null;
}

/** The drawing for `values` in the range lo..hi, slid `offset` samples to the right, with the
 *  samples that already dropped off (`lead`) drawn past the left edge. */
function draw(values: readonly number[], lead: readonly number[], lo: number, hi: number, offset: number, width: number, height: number, threshold?: number): Geometry {
  const n = values.length;
  const range = hi - lo || 1;
  const y = (v: number) => height - 1 - ((Math.min(hi, Math.max(lo, v)) - lo) / range) * (height - 2);
  const step = width / Math.max(1, n - 1);
  const all = [...lead, ...values];
  const first = -lead.length;
  const pts: string[] = [];
  for (let i = 0; i < all.length; i++) pts.push(`${((first + i + offset) * step).toFixed(2)},${y(all[i]).toFixed(2)}`);
  // the head sits on the right edge, on the line between the two samples either side of it
  const e = Math.max(0, n - 1 - offset);
  const i0 = Math.floor(e);
  const f = e - i0;
  const headV = values[i0] + ((values[Math.min(n - 1, i0 + 1)] ?? values[i0]) - values[i0]) * f;
  const x0 = ((first + offset) * step).toFixed(2);
  const x1 = ((n - 1 + offset) * step).toFixed(2);
  return {
    line: `M${pts.join('L')}`,
    area: `M${x0},${height}L${pts.join('L')}L${x1},${height}Z`,
    headY: y(headV),
    thresholdY: threshold === undefined ? null : y(threshold),
  };
}

const fitted = (values: readonly number[], min?: number, max?: number): [number, number] => [min ?? Math.min(...values), max ?? Math.max(...values)];

/**
 * Sparkline — a tiny trend line for recent history (frame time, levels). Live, it scrolls at a
 * steady speed: it plays back a moment behind the newest sample, interpolating between the times
 * the samples actually arrived and easing the speed on a spring, so uneven updates never stall,
 * jump or lurch it; a fitted range eases to
 * new extremes; the head rides the line's right edge. Static data draws once and stays still.
 */
export function Sparkline({ values, min, max, width = 120, height = 28, fill = true, threshold, tone = 'live', label, className }: SparklineProps) {
  const uid = useId().replace(/:/g, '');
  const gradient = uid + 'g';
  const clip = uid + 'c';
  const live = values.length >= 2;

  const lineRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGLineElement>(null);
  const thRef = useRef<SVGLineElement>(null);
  const st = useRef<{
    values: readonly number[];
    lead: number[];
    seq: number;
    arrivals: { seq: number; t: number }[];
    interval: number;
    /** where playback is, in samples: rides a spring after the interpolated arrival clock */
    play: Spring;
    lo: Spring;
    hi: Spring;
  } | null>(null);
  if (!st.current && live) {
    const [lo, hi] = fitted(values, min, max);
    st.current = { values, lead: [], seq: 0, arrivals: [{ seq: 0, t: 0 }], interval: 220, play: { x: 0, v: 0 }, lo: { x: lo, v: 0 }, hi: { x: hi, v: 0 } };
  }
  // the first paint is drawn by React; after that the frame loop owns the attributes
  const firstGeo = useRef<Geometry | null>(null);
  if (!firstGeo.current && live) {
    const [lo, hi] = fitted(values, min, max);
    firstGeo.current = draw(values, [], lo, hi, 0, width, height, threshold);
  }

  const paint = (dt: number) => {
    const s = st.current;
    if (!s || s.values.length < 2) return false;
    const now = performance.now();
    const reduced = reducedMotion();
    const [lo, hi] = fitted(s.values, min, max);
    if (reduced) {
      s.lo = { x: lo, v: 0 };
      s.hi = { x: hi, v: 0 };
    } else {
      spring(s.lo, lo, dt, 380);
      spring(s.hi, hi, dt, 380);
    }
    // playback clock: a moment behind the newest arrival, interpolated between arrival times
    const arr = s.arrivals;
    const last = arr[arr.length - 1];
    const delay = s.interval * 1.15 + 16;
    const at = now - delay;
    let shown = last.seq;
    if (!reduced && at < last.t) {
      shown = arr[0].seq;
      for (let k = arr.length - 1; k > 0; k--) {
        if (at >= arr[k - 1].t) {
          const a = arr[k - 1];
          const b = arr[k];
          shown = a.seq + ((at - a.t) / Math.max(1, b.t - a.t)) * (b.seq - a.seq);
          break;
        }
      }
    }
    // the spring evens out uneven arrivals: the speed changes gently instead of per segment
    if (reduced || dt === 0 && s.play.x === 0) s.play = { x: shown, v: 0 };
    else spring(s.play, shown, dt, 400);
    const offset = Math.min(s.lead.length, Math.max(0, last.seq - s.play.x));
    const g = draw(s.values, s.lead, s.lo.x, s.hi.x, offset, width, height, threshold);
    lineRef.current?.setAttribute('d', g.line);
    areaRef.current?.setAttribute('d', g.area);
    headRef.current?.setAttribute('y1', g.headY.toFixed(2));
    headRef.current?.setAttribute('y2', g.headY.toFixed(2));
    if (g.thresholdY !== null) {
      thRef.current?.setAttribute('y1', g.thresholdY.toFixed(2));
      thRef.current?.setAttribute('y2', g.thresholdY.toFixed(2));
    }
    const ranging = Math.abs(s.lo.x - lo) + Math.abs(s.hi.x - hi) > 1e-6 || s.lo.v !== 0 || s.hi.v !== 0;
    return offset > 1e-3 || ranging || s.play.v !== 0 || now < last.t + delay + 50;
  };
  const kick = useFrames(paint);

  useLayoutEffect(() => {
    const s = st.current;
    if (!s || values.length < 2) return;
    if (values !== s.values) {
      const now = performance.now();
      const k = shiftOf(s.values, values);
      if (k) {
        const prev = s.arrivals[s.arrivals.length - 1];
        // after a pause, pace the first new sample as if it came on time instead of leaping
        if (prev.t && now - prev.t < s.interval * 4) s.interval = Math.min(2000, Math.max(40, s.interval * 0.75 + (now - prev.t) * 0.25));
        else s.arrivals.push({ seq: prev.seq, t: now - s.interval });
        s.seq += k;
        s.arrivals.push({ seq: s.seq, t: now });
        if (s.arrivals.length > 10) s.arrivals.splice(0, s.arrivals.length - 10);
        s.lead = [...s.lead, ...s.values.slice(0, k)].slice(-6);
      } else {
        // new data, not a scroll: start over from here
        s.seq = 0;
        s.arrivals = [{ seq: 0, t: now }];
        s.lead = [];
        s.play = { x: 0, v: 0 };
      }
      s.values = values;
    }
    paint(0);
    kick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, min, max, width, height, threshold]);

  const g0 = firstGeo.current;
  return (
    <svg
      className={className ? `ar-sparkline ${className}` : 'ar-sparkline'}
      data-tone={tone}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
        {/* samples slide in from behind the right edge and out past the left */}
        <clipPath id={clip}>
          <rect x="0" y="-4" width={width} height={height + 8} />
        </clipPath>
      </defs>
      {g0 && threshold !== undefined && (
        <line ref={thRef} className="ar-sparkline__threshold" x1="0" x2={width} y1={g0.thresholdY ?? 0} y2={g0.thresholdY ?? 0} />
      )}
      {g0 && (
        <g clipPath={`url(#${clip})`}>
          {fill && <path ref={areaRef} className="ar-sparkline__area" d={g0.area} fill={`url(#${gradient})`} />}
          {/* pathLength lets the line draw itself in on mount */}
          <path ref={lineRef} className="ar-sparkline__line" d={g0.line} pathLength={1} />
        </g>
      )}
      {/* the latest sample: a zero-length round-capped line stays a dot under any stretch */}
      {g0 && <line ref={headRef} className="ar-sparkline__head" x1={width} y1={g0.headY} x2={width} y2={g0.headY} />}
    </svg>
  );
}
