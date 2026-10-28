'use client';
import type { CSSProperties, ReactNode } from 'react';
import { RollingValue } from '../core/RollingValue';
import { cx } from '../core/utils';
import { Sparkline } from './Sparkline';

export interface StatProps {
  /** What the number is, in the sans: "Frame time". */
  label: string;
  /** The figure, already formatted ("16.4") or a number (shown with `decimals`). Its digits roll. */
  value: string | number;
  decimals?: number;
  /** A quieter unit after the figure: "ms", "fps", "GB". */
  unit?: string;
  /** Change against before, as a signed number; drawn with an arrow. */
  delta?: number;
  /** How the change reads, e.g. "+2.4%" or "−3 ms". Default: the signed delta. */
  deltaText?: string;
  /** Which way is good, so the change takes the signal or the fault colour. Default 'up'. */
  better?: 'up' | 'down';
  /** Recent history, oldest first: a sparkline under the figure. */
  trend?: readonly number[];
  /** A dashed reference on the trend, e.g. a frame budget. */
  threshold?: number;
  tone?: 'live' | 'warm' | 'neutral';
  /** A quiet line under everything: "last 60 s", "of 24 GB". */
  caption?: ReactNode;
  /** Draw the tile's well. Default true; false sets the stat bare, inside your own card. */
  framed?: boolean;
  size?: 'md' | 'lg';
  className?: string;
  style?: CSSProperties;
}

/**
 * Stat — one figure that matters: a label, the number large in the mono with its unit, how it
 * moved, and its recent trend. For dashboards, status bars and the head of an inspector.
 */
export function Stat({ label, value, decimals = 0, unit, delta, deltaText, better = 'up', trend, threshold, tone = 'live', caption, framed = true, size = 'md', className, style }: StatProps) {
  const text = typeof value === 'number' ? value.toFixed(decimals) : value;
  const dir = delta === undefined || delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down';
  const good = dir === 'flat' ? undefined : dir === better;
  const shown = deltaText ?? (delta === undefined ? undefined : (delta > 0 ? '+' : delta < 0 ? '−' : '') + Math.abs(delta).toString());
  return (
    <div className={cx('ar-stat', className)} data-framed={framed ? '' : undefined} data-size={size === 'lg' ? 'lg' : undefined} data-tone={tone} style={style}>
      <div className="ar-stat__head">
        <span className="ar-stat__label">{label}</span>
        {shown !== undefined ? (
          <span className="ar-stat__delta" data-dir={dir} data-good={good === undefined ? undefined : good ? 'true' : 'false'}>
            <svg viewBox="0 0 8 8" aria-hidden="true">
              <path d={dir === 'down' ? 'M1 2.5l3 3 3-3' : dir === 'up' ? 'M1 5.5l3-3 3 3' : 'M1 4h6'} />
            </svg>
            {shown}
          </span>
        ) : null}
      </div>
      <span className="ar-value ar-stat__value">
        <RollingValue text={text} unit={unit} base={decimals} />
      </span>
      {trend && trend.length > 1 ? <Sparkline className="ar-stat__trend" label={`${label} trend`} values={trend} threshold={threshold} tone={tone} height={size === 'lg' ? 40 : 28} /> : null}
      {caption != null ? <span className="ar-stat__caption">{caption}</span> : null}
    </div>
  );
}
