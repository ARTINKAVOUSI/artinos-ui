'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react';
import { approach, useFrames } from '../core/motion';
import { glideFor, newCadence, noteArrival, useOnScreen, type ReactiveMotion } from '../core/reactive';
import { cx, reducedMotion } from '../core/utils';
import { zoneGradient, type InstrumentTone, type Zone } from './zones';

export interface SpectrumProps {
  /** Accessible summary. */
  label: string;
  /** Readings as props: one per band or bin. */
  values?: ArrayLike<number>;
  /** Reads the bins every frame, without React: hand it an analyser's buffer. */
  source?: () => ArrayLike<number> | null | undefined;
  /** How many bars to draw. Bins are gathered into them, each bar showing its loudest. */
  bars?: number;
  min?: number;
  /** The top of the scale: 1 for a float, 255 for getByteFrequencyData. */
  max?: number;
  /** How bins spread over the bars when there are more of them: 'log' gives the low end room. */
  scale?: 'log' | 'linear';
  /** Default 'audio': bars rise in the frame the sound does and fall on a release. */
  motion?: ReactiveMotion;
  /** Hold each bar's peak as a small cap, then let it fall. */
  peak?: boolean;
  /** Light this many cells up each bar instead of a continuous fill. */
  segments?: number;
  /** Bars grow both ways from a centre line. */
  mirror?: boolean;
  zones?: readonly Zone[];
  tone?: InstrumentTone;
  height?: number;
  className?: string;
  style?: CSSProperties;
}

const PEAK_HOLD = 480;
const PEAK_FALL = 1400;

/** The bin range each bar gathers, once for each bin count. */
function binRanges(bins: number, bars: number, scale: 'log' | 'linear') {
  const edges = new Int32Array(bars + 1);
  for (let i = 0; i <= bars; i++) {
    const f = i / bars;
    edges[i] = Math.round(scale === 'log' && bins > bars ? Math.pow(bins, f) - 1 + f : f * bins);
    // a bar of its own bin at the low end, not several bars repeating one
    if (i > 0 && bins >= bars) edges[i] = Math.max(edges[i], edges[i - 1] + 1);
  }
  edges[bars] = bins;
  return edges;
}

/**
 * Spectrum — a bank of level bars for a frequency analysis or any many-channel signal. One frame
 * loop writes them all directly; nothing renders per frame, and no bar interpolates what it has
 * not been told: it shows the latest analysis, in the frame it was read.
 */
export function Spectrum({ label, values, source, bars = 32, min = 0, max = 1, scale = 'log', motion = 'audio', peak = false, segments, mirror = false, zones, tone = 'live', height = 72, className, style }: SpectrumProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const caps = useRef<(HTMLSpanElement | null)[]>([]);
  const state = useMemo(
    () => ({
      x: new Float32Array(bars),
      target: new Float32Array(bars),
      drawn: new Float32Array(bars).fill(-1),
      top: new Float32Array(bars),
      hold: new Float32Array(bars),
      edges: null as Int32Array | null,
      bins: -1,
      cadence: newCadence(),
    }),
    [bars],
  );
  const span = max - min || 1;

  const gather = (from: ArrayLike<number>) => {
    if (from.length !== state.bins) {
      state.bins = from.length;
      state.edges = binRanges(from.length, bars, scale);
    }
    const edges = state.edges!;
    for (let i = 0; i < bars; i++) {
      let hi = from[Math.min(edges[i], from.length - 1)] ?? min;
      for (let k = edges[i] + 1; k < edges[i + 1]; k++) if (from[k] > hi) hi = from[k];
      state.target[i] = Math.min(1, Math.max(0, (hi - min) / span));
    }
  };

  const kick = useFrames((dt) => {
    const live = source?.();
    if (live) gather(live);
    const interval = source ? 0 : state.cadence.interval;
    const still = reducedMotion();
    let moving = false;
    for (let i = 0; i < bars; i++) {
      const t = state.target[i];
      const glide = still ? 0 : glideFor(motion, interval, t >= state.x[i]);
      let x = glide <= 0 ? t : approach(state.x[i], t, dt, glide);
      if (Math.abs(x - t) < 1e-3) x = t;
      else moving = true;
      state.x[i] = x;
      const q = segments ? Math.ceil(x * segments - 1e-6) / segments : x;
      if (Math.abs(q - state.drawn[i]) > 1e-3) {
        state.drawn[i] = q;
        const el = fills.current[i];
        if (el) el.style.clipPath = mirror ? `inset(${(1 - q) * 50}% 0)` : `inset(${(1 - q) * 100}% 0 0)`;
      }
      if (peak) {
        if (t >= state.top[i]) {
          state.top[i] = t;
          state.hold[i] = PEAK_HOLD;
        } else if (state.hold[i] > 0) {
          state.hold[i] -= dt;
          moving = true;
        } else if (state.top[i] > t) {
          state.top[i] = Math.max(t, state.top[i] - dt / PEAK_FALL);
          moving = true;
        }
        const cap = caps.current[i];
        if (cap) {
          const top = segments ? Math.ceil(state.top[i] * segments - 1e-6) / segments : state.top[i];
          cap.style.transform = `translateY(${(1 - top) * 100}%)`;
          cap.style.opacity = top > 0.004 ? '1' : '0';
        }
      }
    }
    return (Boolean(source) && seen.current) || moving;
  }, rootRef);
  const seen = useOnScreen(rootRef, kick);

  useLayoutEffect(() => {
    if (values && !source) {
      gather(values);
      noteArrival(state.cadence, performance.now());
    }
    kick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, source, state, min, max, segments, mirror, scale, peak, kick]);
  useEffect(() => {
    state.bins = -1; // the spread changed: gather afresh
  }, [scale, state]);

  const bands = zones ? zoneGradient(zones, tone, min, max, 'to top', segments ? 0 : 2) : undefined;
  const vars = {
    ...style,
    '--_h': `${height}px`,
    ...(segments ? { '--_n': segments } : null),
    ...(bands ? { '--_bands': bands } : null),
  } as CSSProperties;
  return (
    <div ref={rootRef} className={cx('ar-spectrum', className)} role="img" aria-label={label} data-tone={tone} data-mirror={mirror ? '' : undefined} data-segmented={segments ? '' : undefined} data-bands={bands ? '' : undefined} style={vars}>
      {Array.from({ length: bars }, (_, i) => (
        <span key={i} className="ar-spectrum__bar">
          <span ref={(el) => void (fills.current[i] = el)} className="ar-spectrum__fill" style={{ clipPath: mirror ? 'inset(50% 0)' : 'inset(100% 0 0)' }} />
          {peak && !mirror ? <span ref={(el) => void (caps.current[i] = el)} className="ar-spectrum__cap" style={{ opacity: 0 }} /> : null}
        </span>
      ))}
    </div>
  );
}
