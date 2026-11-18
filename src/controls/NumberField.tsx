'use client';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { RollingValue, SignalDigits } from '../core/RollingValue';
import { evaluate } from '../core/expression';
import { useControllable } from '../core/hooks';
import { isPointerLocked, lockPointer, precisionOf, unlockPointer } from '../core/scrub';
import type { Signal } from '../core/signal';
import { clamp, cx, joinFormatted, runFormat, scopeAttrs } from '../core/utils';
import type { Format, Formatter, ScopeProps } from '../core/utils';

/* ARTINOS NumberField — a recessed numeric cell. The cell is the scrubber:
 *   drag sideways   → scrub (Alt 0.1× · Shift 0.01×), readout rolls; the hand may run past the screen's edge
 *   click           → type a value or a sum (2*3 · pi/2 · *2 · +=10); Enter commits, Escape cancels
 *   arrows / wheel  → ±step while focused (Alt 0.1× · Shift 0.01×)
 * The label, when given, sits inside the well at the left. */

export interface NumberFieldProps extends ScopeProps {
  label?: string;
  /** The value itself: read and written here, so a scrub renders nothing above the digits. Takes the place of `value`. */
  signal?: Signal<number>;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  onCommit?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  format?: Format;
  unit?: string;
  formatter?: Formatter;
  /** Pointer travel per step while scrubbing. Default 4 px. */
  pixelsPerStep?: number;
  align?: 'center' | 'end';
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
  'aria-label'?: string;
}

const DRAG_START = 3;

export function NumberField(props: NumberFieldProps) {
  const {
    label, signal: bound, value, defaultValue = 0, onChange, onCommit, min = -Infinity, max = Infinity, step = 1, decimals = 0,
    format = 'number', unit, formatter, pixelsPerStep = 4, align = 'center', disabled, material, density, className, style, id,
  } = props;
  const [v, report] = useControllable(bound ? bound.peek() : value, defaultValue, onChange);
  const setV = (x: number) => {
    bound?.set(x);
    report(x);
  };
  const [editing, setEditing] = useState<string | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<string | null>(null);
  editRef.current = editing;
  const selectAll = useRef(true);
  const live = useRef(v);
  const dirRef = useRef({ v, d: 1 });
  const drag = useRef<{ x: number; v0: number; acc: number; travel: number; id: number; moved: boolean } | null>(null);
  if (!drag.current) live.current = v;
  if (v !== dirRef.current.v) dirRef.current = { v, d: v > dirRef.current.v ? 1 : -1 };

  /* on a signal the cell tells assistive tech itself; its digits are their own small part */
  const paint = useRef((_: number) => {});
  paint.current = (x) => {
    if (!drag.current) live.current = x;
    if (x !== dirRef.current.v) dirRef.current = { v: x, d: x > dirRef.current.v ? 1 : -1 };
    rootRef.current?.setAttribute('aria-valuenow', String(x));
    rootRef.current?.setAttribute('aria-valuetext', joinFormatted(runFormat(x, { format, decimals, unit, formatter })));
  };
  useEffect(() => bound?.subscribe((x) => paint.current(x)), [bound]);

  // enough digits to hold the grain, however fine the step and the keys make it
  const q = (x: number, grain: number) => Number((Math.round(x / grain) * grain).toFixed(Math.max(decimals, 6, Math.min(12, Math.ceil(-Math.log10(grain)) + 1))));
  const emit = (x: number) => {
    x = clamp(x, min, max);
    if (x === live.current || !Number.isFinite(x)) return;
    live.current = x;
    setV(x);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || editing !== null || e.button !== 0) return;
    e.preventDefault();
    rootRef.current?.focus({ preventScroll: true });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture is best-effort */
    }
    drag.current = { x: e.clientX, v0: live.current, acc: 0, travel: 0, id: e.pointerId, moved: false };
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = isPointerLocked(rootRef.current) ? e.movementX : e.clientX - d.x;
    d.x = e.clientX;
    d.acc += dx * precisionOf(e);
    d.travel += dx;
    // a drag begins with the hand's own travel: a fine key must not turn it back into a click
    if (!d.moved && Math.abs(d.travel) < DRAG_START) return;
    if (!d.moved) {
      d.moved = true;
      setScrubbing(true);
      lockPointer(rootRef.current, e.pointerType);
    }
    emit(q(d.v0 + (d.acc / pixelsPerStep) * step, step * precisionOf(e)));
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setScrubbing(false);
    unlockPointer(rootRef.current);
    if (d.moved) onCommit?.(live.current);
    else startEdit();
  };
  const startEdit = () => {
    if (disabled) return;
    selectAll.current = true;
    setEditing(String(Number(live.current.toFixed(Math.max(decimals, 0)))));
  };
  useEffect(() => {
    const el = inputRef.current;
    if (editing === null || !el) return;
    el.focus({ preventScroll: true });
    if (selectAll.current) el.select();
    else el.setSelectionRange(el.value.length, el.value.length);
  }, [editing !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitEdit = (refocus: boolean) => {
    const text = editRef.current;
    if (text === null) return; // already committed or cancelled
    editRef.current = null;
    setEditing(null);
    // a sum is worked in the units the cell shows, with `x` the value now
    const scale = format === 'percent' ? 100 : 1;
    const n = evaluate(text.replace(/(\d),(\d)/g, '$1.$2'), live.current * scale);
    if (n !== null) {
      emit(n / scale);
      onCommit?.(live.current);
    }
    if (refocus) rootRef.current?.focus({ preventScroll: true });
  };
  const nudge = (dir: number, e: { altKey: boolean; shiftKey: boolean }) => {
    const fine = precisionOf(e);
    emit(q(live.current + dir * step * fine, step * fine));
  };
  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (disabled || editing !== null) return;
    const dir = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1 : 0;
    if (dir) {
      e.preventDefault();
      nudge(dir, e);
      onCommit?.(live.current);
    } else if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault();
      startEdit();
    } else if (/^[0-9.\-+*/(]$/.test(e.key)) {
      e.preventDefault();
      selectAll.current = false; // typing straight into the cell starts a fresh value
      setEditing(e.key);
    }
  };

  // onCommit is "once, on release": a run of wheel steps commits once, 250 ms after the last.
  const commitWheel = () => onCommit?.(live.current);
  const wheelRef = useRef({ nudge, disabled, editing, commitWheel });
  wheelRef.current = { nudge, disabled, editing, commitWheel };
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let commit: ReturnType<typeof setTimeout> | undefined;
    const h = (e: WheelEvent) => {
      const w = wheelRef.current;
      // browsers turn a wheel held with Shift sideways
      const turn = e.deltaY || (e.shiftKey ? e.deltaX : 0);
      if (el.ownerDocument.activeElement !== el || w.disabled || w.editing !== null || !turn) return;
      e.preventDefault();
      w.nudge(turn < 0 ? 1 : -1, e);
      clearTimeout(commit);
      commit = setTimeout(() => wheelRef.current.commitWheel(), 250);
    };
    el.addEventListener('wheel', h, { passive: false });
    return () => {
      el.removeEventListener('wheel', h);
      clearTimeout(commit);
    };
  }, []);

  const f = runFormat(v, { format, decimals, unit, formatter });
  return (
    <div
      ref={rootRef}
      id={id}
      role="spinbutton"
      tabIndex={disabled ? -1 : 0}
      aria-label={props['aria-label'] ?? label}
      aria-valuenow={v}
      aria-valuemin={Number.isFinite(min) ? min : undefined}
      aria-valuemax={Number.isFinite(max) ? max : undefined}
      aria-valuetext={joinFormatted(f)}
      aria-disabled={disabled || undefined}
      {...scopeAttrs({ material, density })}
      data-scrubbing={scrubbing ? '' : undefined}
      data-editing={editing !== null ? '' : undefined}
      data-align={align}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        drag.current = null;
        setScrubbing(false);
        unlockPointer(rootRef.current);
      }}
      onKeyDown={onKeyDown}
      className={cx('ar-well ar-number', disabled && 'is-disabled', className)}
      style={style}
    >
      {label ? <span className="ar-text ar-number__label">{label}</span> : null}
      {editing !== null ? (
        <input
          ref={inputRef}
          className="ar-value ar-number__input"
          inputMode="decimal"
          aria-label={props['aria-label'] ?? label}
          value={editing}
          onChange={(e) => setEditing(e.target.value)}
          onBlur={() => commitEdit(false)}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitEdit(true);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              editRef.current = null;
              setEditing(null);
              rootRef.current?.focus({ preventScroll: true });
            }
          }}
        />
      ) : (
        <span className="ar-value ar-number__value">
          {bound ? (
            <SignalDigits signal={bound} format={(x) => runFormat(x, { format, decimals, unit, formatter })} dir={() => dirRef.current.d} fast={scrubbing} base={decimals} />
          ) : (
            <RollingValue text={f.text} unit={f.unit} dir={dirRef.current.d} fast={scrubbing} base={decimals} />
          )}
        </span>
      )}
    </div>
  );
}
