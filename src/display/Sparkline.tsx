'use client';
import { useId, useMemo } from 'react';

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

/** Sparkline — a tiny trend line for recent history (frame time, levels). */
export function Sparkline({ values, min, max, width = 120, height = 28, fill = true, threshold, tone = 'live', label, className }: SparklineProps) {
  const gradient = useId();
  const { line, area, thresholdY, head } = useMemo(() => {
    if (values.length < 2) return { line: '', area: '', thresholdY: null as number | null, head: null as [number, number] | null };
    const lo = min ?? Math.min(...values);
    const hi = max ?? Math.max(...values);
    const range = hi - lo || 1;
    const y = (v: number) => height - 1 - ((Math.min(hi, Math.max(lo, v)) - lo) / range) * (height - 2);
    const step = width / (values.length - 1);
    const points = values.map((v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`);
    return {
      line: `M${points.join('L')}`,
      area: `M0,${height}L${points.join('L')}L${width},${height}Z`,
      thresholdY: threshold === undefined ? null : y(threshold),
      head: [width, y(values[values.length - 1])] as [number, number],
    };
  }, [values, min, max, width, height, threshold]);

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
      </defs>
      {thresholdY !== null && <line className="ar-sparkline__threshold" x1="0" x2={width} y1={thresholdY} y2={thresholdY} />}
      {fill && area && <path className="ar-sparkline__area" d={area} fill={`url(#${gradient})`} />}
      {/* pathLength lets the line draw itself in on mount */}
      {line && <path className="ar-sparkline__line" d={line} pathLength={1} />}
      {/* the latest sample: a zero-length round-capped line stays a dot under any stretch */}
      {head && <line className="ar-sparkline__head" x1={head[0]} y1={head[1]} x2={head[0]} y2={head[1]} />}
    </svg>
  );
}

