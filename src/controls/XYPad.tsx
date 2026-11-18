'use client';
import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { useControllable } from '../core/hooks';
import { RollingValue } from '../core/RollingValue';
import type { Signal } from '../core/signal';
import { clamp01 } from '../core/utils';

export interface XYPadProps {
  /** The value itself: read and written here. Takes the place of `value`. */
  signal?: Signal<[number, number]>;
  /** [x, y], each within its range. */
  value?: [number, number];
  /** Where it starts when nothing else holds the value. Default: the middle of both ranges. */
  defaultValue?: [number, number];
  onChange?: (value: [number, number]) => void;
  label: string;
  xRange?: [number, number];
  yRange?: [number, number];
  /** Height in px; width follows the container. */
  height?: number;
  onCommit?: (value: [number, number]) => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * XYPad — drag a point across a 2D field (pan, direction, two linked
 * parameters). Arrow keys move it; Shift for fine steps. Y grows upward.
 */
export function XYPad({ signal, value: valueProp, defaultValue, onChange, label, xRange = [-1, 1], yRange = [-1, 1], height = 110, onCommit, className, style }: XYPadProps) {
  const [value, setValue] = useControllable<[number, number]>(valueProp, defaultValue ?? [(xRange[0] + xRange[1]) / 2, (yRange[0] + yRange[1]) / 2], onChange, signal);
  const pad = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const tx = clamp01((value[0] - xRange[0]) / (xRange[1] - xRange[0] || 1));
  const ty = clamp01((value[1] - yRange[0]) / (yRange[1] - yRange[0] || 1));
  const from = (u: number, v: number): [number, number] => [xRange[0] + clamp01(u) * (xRange[1] - xRange[0]), yRange[0] + clamp01(v) * (yRange[1] - yRange[0])];

  const place = (event: PointerEvent) => {
    const rect = pad.current!.getBoundingClientRect();
    const next = from((event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height);
    setValue(next);
    return next;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const step = event.shiftKey ? 0.005 : 0.02;
    let [u, v] = [tx, ty];
    if (event.key === 'ArrowLeft') u -= step;
    else if (event.key === 'ArrowRight') u += step;
    else if (event.key === 'ArrowUp') v += step;
    else if (event.key === 'ArrowDown') v -= step;
    else return;
    event.preventDefault();
    const next = from(u, v);
    setValue(next);
    onCommit?.(next);
  };

  return (
    <div
      ref={pad}
      className={className ? `ar-well ar-xypad ${className}` : 'ar-well ar-xypad'}
      style={{ height, ['--x' as string]: tx, ['--y' as string]: ty, ...style }}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuetext={`x ${value[0].toFixed(2)}, y ${value[1].toFixed(2)}`}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        // the press glides the puck to the pointer; once the hand moves, it follows directly
        event.currentTarget.dataset.held = '';
        place(event);
      }}
      onPointerMove={(event) => {
        if (!dragging.current) return;
        event.currentTarget.dataset.tracking = '';
        place(event);
      }}
      onPointerUp={(event) => {
        if (!dragging.current) return;
        dragging.current = false;
        delete event.currentTarget.dataset.held;
        delete event.currentTarget.dataset.tracking;
        const placed = place(event);
        onCommit?.(placed);
      }}
      onKeyDown={onKeyDown}
    >
      <span className="ar-xypad__field">
        <span className="ar-xypad__cross" data-axis="x" />
        <span className="ar-xypad__cross" data-axis="y" />
        <span className="ar-insert ar-xypad__point" />
      </span>
      <span className="ar-text ar-xypad__label" aria-hidden>
        {label}
      </span>
      <span className="ar-value ar-xypad__readout">
        <RollingValue text={value[0].toFixed(2)} /> · <RollingValue text={value[1].toFixed(2)} />
      </span>
    </div>
  );
}

