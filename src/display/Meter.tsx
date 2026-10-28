'use client';
import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { approach, useFrames } from '../core/motion';
import { RollingValue } from '../core/RollingValue';
import { reducedMotion } from '../core/utils';

export interface MeterProps {
  /** Current level. */
  value: number;
  min?: number;
  max?: number;
  /** Drawn at the left, in a column so stacked meters line up; also the accessible name. */
  label: string;
  /** Keep the label for screen readers only, when the row already shows it (a Field, a PropertyRow). */
  hideLabel?: boolean;
  /** Text drawn at the right; defaults to the value. Pass null to hide. */
  valueText?: string | null;
  /** Hold the peak for a moment and let it fall. */
  peak?: boolean;
  tone?: 'live' | 'warm' | 'neutral';
  className?: string;
  style?: CSSProperties;
}

/** How long the level takes to close half the gap to a new reading (ms), and the peak's hold and fall. */
const HALF_LIFE = 70;
const PEAK_HOLD = 700;
const PEAK_FALL = 2600; // ms to fall the full scale

/**
 * Meter — a horizontal level bar for live values (audio, CPU, progress). The fill glides toward
 * each new reading every frame, so a value that updates a few times a second still moves as one
 * continuous motion; the peak holds, then falls smoothly. Nothing re-renders between readings.
 */
export function Meter({ value, min = 0, max = 1, label, hideLabel = false, valueText, peak = false, tone = 'live', className, style }: MeterProps) {
  const t = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const fillRef = useRef<HTMLSpanElement>(null);
  const peakRef = useRef<HTMLSpanElement>(null);
  const live = useRef({ target: t, level: 0, peak: 0, hold: 0 });

  const kick = useFrames((dt) => {
    const s = live.current;
    s.level = reducedMotion() ? s.target : approach(s.level, s.target, dt, HALF_LIFE);
    if (Math.abs(s.level - s.target) < 1e-4) s.level = s.target;
    if (fillRef.current) fillRef.current.style.transform = `scaleX(${s.level})`;
    let moving = s.level !== s.target;
    if (peak) {
      if (s.level >= s.peak) {
        s.peak = s.level;
        s.hold = PEAK_HOLD;
      } else if (s.hold > 0) {
        s.hold -= dt;
      } else {
        s.peak = Math.max(s.level, s.peak - dt / PEAK_FALL);
      }
      if (peakRef.current) peakRef.current.style.transform = `translateX(${s.peak * 100}cqw)`;
      moving ||= s.peak > s.level + 1e-4;
    }
    return moving;
  });
  useLayoutEffect(() => {
    live.current.target = t;
    kick();
  }, [t, kick]);

  const text = valueText === undefined ? value.toFixed(2) : valueText;
  return (
    <div
      className={className ? `ar-meter ${className}` : 'ar-meter'}
      data-tone={tone}
      role="meter"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      style={style}
    >
      {hideLabel ? null : <span className="ar-text ar-meter__label">{label}</span>}
      <span className="ar-meter__track">
        <span ref={fillRef} className="ar-meter__fill" />
        {peak && <span ref={peakRef} className="ar-meter__peak" />}
      </span>
      {text !== null && <span className="ar-value ar-meter__value"><RollingValue text={text} /></span>}
    </div>
  );
}
