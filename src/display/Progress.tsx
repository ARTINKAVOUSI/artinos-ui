'use client';
import type { CSSProperties, ReactNode } from 'react';
import { RollingValue } from '../core/RollingValue';
import { cx } from '../core/utils';

export interface ProgressProps {
  /** What is running, in the sans: "Baking lightmaps". */
  label?: string;
  /** 0..1. Leave it out while the length is unknown: the bar runs indeterminate. */
  value?: number;
  /** Text at the right; defaults to the percentage. null hides it. */
  valueText?: string | null;
  /** done: the fill settles in the signal colour · error: in the fault colour. */
  status?: 'running' | 'done' | 'error';
  /** A quiet line under the bar: "3 of 12 files", "about 40 s left", or what went wrong. */
  caption?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Progress — a task under way. A label and its percentage over a slim well; the fill is the
 * family's insert and glides as work lands. Without a value it runs indeterminate; when it ends
 * it settles in the signal colour, or the fault colour with the reason as its caption.
 */
export function Progress({ label, value, valueText, status = 'running', caption, className, style }: ProgressProps) {
  const known = value !== undefined && Number.isFinite(value);
  const t = known ? Math.min(1, Math.max(0, value!)) : 0;
  const text = valueText === undefined ? (known ? String(Math.round(t * 100)) : null) : valueText;
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
      data-indeterminate={known || status !== 'running' ? undefined : ''}
      style={style}
    >
      {label || text !== null ? (
        <div className="ar-progress__head">
          {label ? <span className="ar-progress__label">{label}</span> : null}
          {text !== null ? (
            <span className="ar-value ar-progress__value">
              <RollingValue text={text} unit={valueText === undefined && known ? '%' : undefined} base={0} />
            </span>
          ) : null}
        </div>
      ) : null}
      <span className="ar-progress__track">
        {/* done fills the track; an error keeps the fill where the work stopped */}
        <span className="ar-progress__fill" style={known || status !== 'running' ? { transform: `scaleX(${status === 'done' || !known ? 1 : t})` } : undefined} />
      </span>
      {caption != null ? <span className="ar-progress__caption">{caption}</span> : null}
    </div>
  );
}
