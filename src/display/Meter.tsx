'use client';
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useFollower, type ReactiveMotion } from '../core/reactive';
import { RollingValue } from '../core/RollingValue';
import { cx, reducedMotion } from '../core/utils';
import { toneAt, zoneGradient, type InstrumentTone, type Zone } from './zones';

export interface MeterProps {
  /** Current level. */
  value?: number;
  /** Reads the level every frame, without React: the exact path for audio and other fast signals.
   *  Returns the same units as `value`. */
  source?: () => number;
  min?: number;
  max?: number;
  /** Drawn at the left, in a column so stacked meters line up; also the accessible name. */
  label: string;
  /** Keep the label for screen readers only, when the row already shows it (a Field, a PropertyRow). */
  hideLabel?: boolean;
  /** Text drawn at the right; defaults to the value. Pass null to hide. */
  valueText?: string | null;
  /** How the value is written when there is no valueText; the only text a `source` meter can have. */
  format?: (value: number) => string;
  /** Hold the peak for a moment and let it fall. Times in ms; fall is the whole scale. */
  peak?: boolean | { hold?: number; fall?: number };
  /** How the bar answers the value. Default 'auto'; use 'audio' for sound, 'instant' for an exact trace. */
  motion?: ReactiveMotion;
  /** Light this many separate cells instead of a continuous fill. */
  segments?: number;
  /** Ranges that read differently, e.g. warm from 0.7 and hot from 0.9. */
  zones?: readonly Zone[];
  /** 'bands' paints the zones along the track; 'level' turns the whole fill the zone's colour. */
  zonePaint?: 'bands' | 'level';
  /** Fill from this value out to the level, for a pan or a difference. */
  origin?: number;
  /** A fine reference tick at this value: a budget, a target. */
  marker?: number;
  /** Scale marks: this many divisions under the track. */
  ticks?: number;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: InstrumentTone;
  className?: string;
  style?: CSSProperties;
}

const PEAK_HOLD = 700;
const PEAK_FALL = 2600;
const READOUT_MS = 100;

/**
 * Meter — a level bar for live values. It fits its motion to what it is fed: readings at frame
 * rate are drawn exactly, slower ones arrive before the next lands, sound rises in the frame it
 * happens and falls on a release. The peak and the zones follow the true reading, never the glide.
 * Nothing re-renders between readings.
 */
export function Meter({ value, source, min = 0, max = 1, label, hideLabel = false, valueText, format, peak = false, motion = 'auto', segments, zones, zonePaint = 'bands', origin, marker, ticks, orientation = 'horizontal', size = 'md', tone = 'live', className, style }: MeterProps) {
  const span = max - min || 1;
  const norm = (v: number) => Math.min(1, Math.max(0, (v - min) / span));
  const vertical = orientation === 'vertical';
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const peakRef = useRef<HTMLSpanElement>(null);
  const held = useRef({ at: 0, hold: 0, fall: 0 });
  const zone = useRef<InstrumentTone>(tone);
  const seenAt = useRef(0);
  const [reading, setReading] = useState(() => (source ? source() : (value ?? min)));
  const holdMs = (typeof peak === 'object' && peak.hold) || PEAK_HOLD;
  const fallMs = (typeof peak === 'object' && peak.fall) || PEAK_FALL;
  const paintsLevel = Boolean(zones) && zonePaint === 'level';

  const { kick } = useFollower(
    norm(value ?? min),
    motion,
    (x, target, dt) => {
      const cells = (v: number) => (segments ? Math.ceil(v * segments - 1e-6) / segments : v);
      const track = trackRef.current;
      const level = cells(x);
      track?.style.setProperty('--_p', String(level));
      if (origin !== undefined) {
        const o = norm(origin);
        track?.style.setProperty('--_lo', String(Math.min(o, level)));
        track?.style.setProperty('--_hi', String(Math.max(o, level)));
      }
      if (paintsLevel) {
        const next = toneAt(zones, min + target * span, tone);
        if (next !== zone.current) {
          zone.current = next;
          rootRef.current?.setAttribute('data-zone', next);
        }
      }
      if (source) {
        const now = performance.now();
        if (now - seenAt.current >= READOUT_MS) {
          seenAt.current = now;
          const v = min + target * span;
          rootRef.current?.setAttribute('aria-valuenow', v.toFixed(3));
          if (valueText !== null) setReading(v);
        }
      }
      if (!peak) return false;
      // the peak follows the reading itself: a hit between two glide frames still registers
      const p = held.current;
      if (target >= p.at) {
        p.at = target;
        p.hold = holdMs;
        p.fall = 0;
      } else if (p.hold > 0) {
        p.hold -= dt;
      } else {
        // falls from rest, reaching its full speed over a moment
        p.fall = Math.min(1.5 / fallMs, p.fall + (dt * 1.5) / fallMs / 360);
        p.at = reducedMotion() ? target : Math.max(target, p.at - p.fall * dt);
      }
      if (peakRef.current) {
        const at = segments ? Math.max(0, cells(p.at) - 1 / segments) : p.at;
        peakRef.current.style.transform = vertical ? `translateY(${-at * 100}cqh)` : `translateX(${at * 100}cqw)`;
      }
      return p.at > target + 1e-4 || p.hold > 0;
    },
    source ? () => norm(source()) : undefined,
    rootRef,
  );
  // a change of shape redraws at once, whatever the level is doing
  useLayoutEffect(() => {
    kick();
  }, [segments, origin, orientation, min, max, kick]);

  const shown = source ? reading : (value ?? min);
  const text = valueText === undefined ? (format ? format(shown) : shown.toFixed(2)) : valueText;
  const bands = zones && zonePaint === 'bands' ? zoneGradient(zones, tone, min, max, vertical ? 'to top' : '90deg', segments ? 0 : 1.5) : undefined;
  const vars = {
    ...style,
    ...(segments ? { '--_n': segments } : null),
    ...(bands ? { '--_bands': bands } : null),
  } as CSSProperties;
  return (
    <div
      ref={rootRef}
      className={cx('ar-meter', className)}
      data-tone={tone}
      data-size={size === 'md' ? undefined : size}
      data-orientation={vertical ? 'vertical' : undefined}
      data-segmented={segments ? '' : undefined}
      data-bands={bands ? '' : undefined}
      data-origin={origin !== undefined ? '' : undefined}
      role="meter"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={source ? undefined : value}
      style={vars}
    >
      {hideLabel ? null : <span className="ar-text ar-meter__label">{label}</span>}
      <span ref={trackRef} className="ar-meter__track">
        <span className="ar-meter__fill" />
        {segments ? null : <span className="ar-meter__tip" />}
        {origin !== undefined ? <span className="ar-meter__mark" data-origin="" style={{ '--_at': norm(origin) } as CSSProperties} /> : null}
        {marker !== undefined ? <span className="ar-meter__mark" style={{ '--_at': norm(marker) } as CSSProperties} /> : null}
        {peak ? <span ref={peakRef} className="ar-meter__peak" /> : null}
        {ticks ? <span className="ar-meter__ticks" style={{ '--_ticks': ticks } as CSSProperties} /> : null}
      </span>
      {text !== null && <span className="ar-value ar-meter__value"><RollingValue text={text} motion={motion} /></span>}
    </div>
  );
}
