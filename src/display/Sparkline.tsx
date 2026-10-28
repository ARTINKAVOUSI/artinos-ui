'use client';
import { useId, useLayoutEffect, useMemo, useRef } from 'react';
import { reducedMotion } from '../core/utils';

export interface SparklineProps {
  /** Samples, oldest first. */
  values: readonly number[];
  /** Fixed range; otherwise fitted to the data. */
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

/** Two series are a scroll when the new one is the old one moved left by one sample. */
function shifted(prev: readonly number[], next: readonly number[]) {
  if (prev.length !== next.length || prev.length < 3) return false;
  for (let i = 1; i < prev.length; i++) if (prev[i] !== next[i - 1]) return false;
  return true;
}

/**
 * Sparkline — a tiny trend line for recent history (frame time, levels). When a sample arrives
 * at the end and the oldest drops off, the line scrolls left continuously over the time until the
 * next one instead of jumping a step, and the head glides to the new reading.
 */
export function Sparkline({ values, min, max, width = 120, height = 28, fill = true, threshold, tone = 'live', label, className }: SparklineProps) {
  const uid = useId().replace(/:/g, '');
  const gradient = uid + 'g';
  const clip = uid + 'c';
  // the scroll: when the series moved by one sample, start the drawing one step right and slide
  // it home over the time since the last sample (linear, so consecutive slides join seamlessly)
  const scroll = useRef<SVGGElement>(null);
  const headRef = useRef<SVGLineElement>(null);
  const prev = useRef<{ values: readonly number[]; at: number; y: number | null }>({ values, at: 0, y: null });
  // the sample that just dropped off stays drawn one step past the left edge, so the line still
  // reaches the edge while it slides
  const lead = shifted(prev.current.values, values) ? prev.current.values[0] : null;
  const { line, area, thresholdY, head, step } = useMemo(() => {
    if (values.length < 2) return { line: '', area: '', thresholdY: null as number | null, head: null as [number, number] | null, step: 0 };
    const lo = min ?? Math.min(...values);
    const hi = max ?? Math.max(...values);
    const range = hi - lo || 1;
    const y = (v: number) => height - 1 - ((Math.min(hi, Math.max(lo, v)) - lo) / range) * (height - 2);
    const step = width / (values.length - 1);
    const points = values.map((v, i) => `${(i * step).toFixed(2)},${y(v).toFixed(2)}`);
    if (lead !== null) points.unshift(`${(-step).toFixed(2)},${y(lead).toFixed(2)}`);
    const x0 = lead !== null ? -step : 0;
    return {
      line: `M${points.join('L')}`,
      area: `M${x0.toFixed(2)},${height}L${points.join('L')}L${width},${height}Z`,
      thresholdY: threshold === undefined ? null : y(threshold),
      head: [width, y(values[values.length - 1])] as [number, number],
      step,
    };
  }, [values, lead, min, max, width, height, threshold]);

  useLayoutEffect(() => {
    const p = prev.current;
    const now = performance.now();
    const g = scroll.current;
    if (g && head && shifted(p.values, values) && !reducedMotion() && g.animate) {
      const duration = Math.min(1000, Math.max(60, p.at ? now - p.at : 200));
      g.getAnimations().forEach((a) => a.cancel());
      g.animate([{ transform: `translateX(${step}px)` }, { transform: 'translateX(0)' }], { duration, easing: 'linear' });
      // the head rides the line's right edge: from the last reading to the new one
      const h = headRef.current;
      if (h && p.y !== null) {
        h.getAnimations().forEach((a) => a.cancel());
        h.animate([{ transform: `translateY(${p.y - head[1]}px)` }, { transform: 'translateY(0)' }], { duration, easing: 'linear' });
      }
    }
    prev.current = { values, at: now, y: head ? head[1] : null };
  }, [values, step, head]);

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
        {/* the newest sample enters from behind the right edge */}
        <clipPath id={clip}>
          <rect x="0" y="-4" width={width} height={height + 8} />
        </clipPath>
      </defs>
      {thresholdY !== null && <line className="ar-sparkline__threshold" x1="0" x2={width} y1={thresholdY} y2={thresholdY} />}
      <g clipPath={`url(#${clip})`}>
        <g ref={scroll} className="ar-sparkline__scroll">
          {fill && area && <path className="ar-sparkline__area" d={area} fill={`url(#${gradient})`} />}
          {/* pathLength lets the line draw itself in on mount */}
          {line && <path className="ar-sparkline__line" d={line} pathLength={1} />}
        </g>
      </g>
      {/* the latest sample: a zero-length round-capped line stays a dot under any stretch */}
      {head && <line ref={headRef} className="ar-sparkline__head" x1={head[0]} y1={head[1]} x2={head[0]} y2={head[1]} />}
    </svg>
  );
}
