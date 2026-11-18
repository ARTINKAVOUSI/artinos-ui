'use client';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useControllable } from '../core/hooks';
import { RollingValue } from '../core/RollingValue';
import { precisionOf } from '../core/scrub';
import type { Signal } from '../core/signal';
import { clamp, decimalsOfStep, snapToStep } from '../core/utils';

export interface KnobProps {
  /** The value itself: read and written here. Takes the place of `value`. */
  signal?: Signal<number>;
  value?: number;
  onChange?: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  /** Where it starts when nothing else holds the value, and where a double-click returns. Default: `min`. */
  defaultValue?: number;
  size?: number;
  /** Show the label and value under the knob. */
  showLabel?: boolean;
  onCommit?: (value: number) => void;
  className?: string;
}

const SWEEP = 270;

/**
 * Knob — a rotary control: a tick arc and a signal arc around a round well, with the
 * family's insert as the cap and a lit seam as its pointer. Drag up/down (Alt 0.1×, Shift 0.01×), scroll, or use the
 * arrow keys. Double-click resets.
 */
export function Knob({ signal, value: valueProp, onChange, label, min = 0, max = 1, step = 0.01, defaultValue, size = 40, showLabel = true, onCommit, className }: KnobProps) {
  const [value, setValue] = useControllable(valueProp, defaultValue ?? min, onChange, signal);
  const span = max - min || 1;
  const t = clamp((value - min) / span, 0, 1);
  const drag = useRef<{ y: number; at: number; start: number; last: number } | null>(null);
  // under the hand the dial follows directly; wheel, keys and resets ease into place
  const [dragging, setDragging] = useState(false);
  const decimals = decimalsOfStep(step);

  const set = (next: number) => {
    const snapped = clamp(snapToStep(next, step, min), min, max);
    if (snapped !== value) setValue(snapped);
    return snapped;
  };

  // Apply first, then report. Never write onCommit?.(set(x)): optional chaining
  // skips evaluating the argument when onCommit is absent, so set() would not run.
  const commit = (next: number) => {
    const applied = set(next);
    onCommit?.(applied);
    return applied;
  };

  const r = 15;
  const arc = (from: number, to: number) => {
    const a0 = ((from - 90 - SWEEP / 2) * Math.PI) / 180;
    const a1 = ((to - 90 - SWEEP / 2) * Math.PI) / 180;
    const large = to - from > 180 ? 1 : 0;
    return `M${20 + r * Math.cos(a0)} ${20 + r * Math.sin(a0)} A${r} ${r} 0 ${large} 1 ${20 + r * Math.cos(a1)} ${20 + r * Math.sin(a1)}`;
  };
  const angle = t * SWEEP - SWEEP / 2;

  return (
    <div className={className ? `ar-knob ${className}` : 'ar-knob'} style={{ width: size }}>
      <div
        className="ar-knob__dial"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        data-dragging={dragging || undefined}
        style={{ width: size, height: size }}
        onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
          if (event.button !== 0) return;
          drag.current = { y: event.clientY, at: value, start: value, last: value };
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={(event) => {
          const d = drag.current;
          if (!d) return;
          // added up move by move, so taking a fine key mid-drag does not jump the dial
          d.at += ((d.y - event.clientY) / 150) * span * precisionOf(event);
          d.y = event.clientY;
          d.last = set(d.at);
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          setDragging(false);
          if (d && d.last !== d.start) onCommit?.(d.last);
        }}
        onWheel={(event) => commit(value - Math.sign(event.deltaY) * Math.max(step, span / 100))}
        onDoubleClick={() => commit(defaultValue ?? min)}
        onKeyDown={(event: KeyboardEvent) => {
          const d = event.key === 'ArrowUp' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowDown' || event.key === 'ArrowLeft' ? -1 : 0;
          if (!d) return;
          event.preventDefault();
          commit(value + d * (event.shiftKey ? step : Math.max(step, span / 100)));
        }}
      >
        <svg viewBox="0 0 40 40" aria-hidden>
          <path className="ar-knob__track" d={arc(0, SWEEP)} />
          {/* one fixed arc, revealed by its dash: the length can animate, a path's shape cannot */}
          <path className="ar-knob__value" d={arc(0, SWEEP)} pathLength={1} style={{ strokeDasharray: `${t} 1`, opacity: t > 0.002 ? 1 : 0 }} />
        </svg>
        <span className="ar-insert ar-knob__cap" style={{ transform: `rotate(${angle}deg)` }}>
          <i className="ar-knob__pointer" />
        </span>
      </div>
      {showLabel && (
        <div className="ar-knob__text">
          <span className="ar-text">{label}</span>
          <span className="ar-value">
            <RollingValue text={value.toFixed(decimals)} base={decimals} />
          </span>
        </div>
      )}
    </div>
  );
}

