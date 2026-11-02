'use client';
import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useFollower, type ReactiveMotion } from '../core/reactive';
import { RollingValue } from '../core/RollingValue';
import { cx } from '../core/utils';
import type { InstrumentTone } from './zones';

export interface ProgressProps {
  /** What is running, in the sans: "Baking lightmaps". */
  label?: string;
  /** 0..1. Leave it out while the length is unknown: the bar runs indeterminate. */
  value?: number;
  /** A second, quieter fill ahead of the first: what is buffered or queued. 0..1. */
  buffer?: number;
  /** Text at the right; defaults to the percentage. null hides it. */
  valueText?: string | null;
  /** done: the fill settles in the signal colour · error: in the fault colour. */
  status?: 'running' | 'done' | 'error';
  /** A quiet line under the bar: "3 of 12 files", "about 40 s left", or what went wrong. */
  caption?: ReactNode;
  /** A bar, or a ring with the percentage inside it. */
  variant?: 'bar' | 'ring';
  /** The work in this many steps: lights separate cells on the bar. */
  segments?: number;
  /** The travelling sheen while it runs. Default true. */
  sheen?: boolean;
  /** Default 'task': a steady advance through readings that land in steps, a quick reset. */
  motion?: ReactiveMotion;
  size?: 'sm' | 'md' | 'lg';
  tone?: InstrumentTone;
  className?: string;
  style?: CSSProperties;
}

/**
 * Progress — a task under way. A label and its percentage over a slim well, or a ring; the fill
 * paces itself to how often the work reports, so steps read as one steady advance, while a fast
 * feed is drawn exactly. Without a value it runs indeterminate; when it ends it settles in the
 * signal colour, or the fault colour with the reason as its caption.
 */
export function Progress({ label, value, buffer, valueText, status = 'running', caption, variant = 'bar', segments, sheen = true, motion = 'task', size = 'md', tone = 'live', className, style }: ProgressProps) {
  const known = value !== undefined && Number.isFinite(value);
  const t = known ? Math.min(1, Math.max(0, value!)) : 0;
  const text = valueText === undefined ? (known ? String(Math.round(t * 100)) : null) : valueText;
  const sweeping = !known && status === 'running';
  // done fills the track; an error keeps the fill where the work stopped
  const target = status === 'done' || (!known && status === 'error') ? 1 : t;
  const trackRef = useRef<HTMLSpanElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);
  useFollower(target, motion, (x) => {
    const track = trackRef.current;
    if (sweeping) {
      track?.style.removeProperty('--_p');
      arcRef.current?.style.removeProperty('stroke-dashoffset');
      return;
    }
    const level = segments ? Math.ceil(x * segments - 1e-6) / segments : x;
    // the fill is clipped, not scaled, so the sheen inside keeps its shape at any value
    track?.style.setProperty('--_p', String(level));
    if (arcRef.current) arcRef.current.style.strokeDashoffset = String(1 - level);
  });
  const readout = text !== null ? <RollingValue text={text} unit={valueText === undefined && known ? '%' : undefined} base={0} motion={motion} /> : null;
  const vars = { ...style, ...(segments ? { '--_n': segments } : null), ...(buffer !== undefined ? { '--_b': Math.min(1, Math.max(0, buffer)) } : null) } as CSSProperties;
  return (
    <div
      className={cx('ar-progress', className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={known ? Math.round(t * 100) : undefined}
      aria-valuetext={valueText ?? undefined}
      data-status={status === 'running' ? undefined : status}
      data-indeterminate={sweeping ? '' : undefined}
      data-variant={variant === 'ring' ? 'ring' : undefined}
      data-size={size === 'md' ? undefined : size}
      data-tone={tone === 'live' ? undefined : tone}
      data-segmented={segments ? '' : undefined}
      data-sheen={sheen && !segments ? '' : undefined}
      style={vars}
    >
      {variant === 'ring' ? (
        <>
          <span className="ar-progress__ring">
            <svg viewBox="0 0 36 36" aria-hidden="true">
              <circle className="ar-progress__ring-well" cx="18" cy="18" r="16" />
              <circle ref={arcRef} className="ar-progress__ring-arc" cx="18" cy="18" r="16" pathLength={1} />
            </svg>
            {readout ? <span className="ar-value ar-progress__ring-value">{readout}</span> : null}
          </span>
          {label || caption != null ? (
            <span className="ar-progress__side">
              {label ? <span className="ar-progress__label">{label}</span> : null}
              {caption != null ? <span className="ar-progress__caption">{caption}</span> : null}
            </span>
          ) : null}
        </>
      ) : (
        <>
          {label || readout ? (
            <div className="ar-progress__head">
              {label ? <span className="ar-progress__label">{label}</span> : null}
              {readout ? <span className="ar-value ar-progress__value">{readout}</span> : null}
            </div>
          ) : null}
          <span ref={trackRef} className="ar-progress__track">
            {buffer !== undefined ? <span className="ar-progress__buffer" /> : null}
            <span className="ar-progress__fill" />
            {segments ? null : <span className="ar-progress__tip" />}
          </span>
          {caption != null ? <span className="ar-progress__caption">{caption}</span> : null}
        </>
      )}
    </div>
  );
}
