'use client';
import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { useControllable } from '../core/hooks';
import type { Signal } from '../core/signal';
import { cx } from '../core/utils';
import { useQuatGlide } from './glide';
import { AXES, AXIS_VEC, DEG, QUAT_IDENTITY, VIEWS, orbitBy, qAngle, qConjugate, qRotate, type Axis, type Quat } from './math';

export interface ViewGizmoProps {
  /** The value itself: read and written here. Takes the place of `value`. */
  signal?: Signal<Quat>;
  /** The camera's orientation, [x, y, z, w]: what `camera.quaternion.toArray()` gives. */
  value?: Quat;
  onChange?: (value: Quat) => void;
  /** Once, when a drag ends or a snap lands. */
  onCommit?: (value: Quat) => void;
  /** Where it starts when nothing else holds the value; double-click the ball, or press Home, to return here. */
  defaultValue?: Quat;
  label?: string;
  /** Diameter in px. */
  size?: number;
  /** Radians of orbit per pixel dragged. */
  speed?: number;
  className?: string;
  style?: CSSProperties;
}

type ViewKey = keyof typeof VIEWS;
const OPPOSITE = (k: ViewKey): ViewKey => (k.startsWith('-') ? k.slice(1) : '-' + k) as ViewKey;

/**
 * ViewGizmo — the camera's orientation as a ball of six axis ends, the kind that sits in the
 * corner of a viewport. Drag it to orbit (a turntable: Y stays up). Click an axis end to look
 * down that axis; click the one already facing you to flip to the other side. Arrow keys orbit,
 * X / Y / Z snap (Shift for the far side), Home returns to the default view.
 */
export function ViewGizmo({ signal, value: valueProp, onChange, onCommit, defaultValue, label = 'View', size = 84, speed = 0.012, className, style }: ViewGizmoProps) {
  const [value, setValue] = useControllable<Quat>(valueProp, defaultValue ?? QUAT_IDENTITY, onChange, signal);
  const live = useRef(value);
  const drag = useRef<{ x: number; y: number; moved: boolean; hit: ViewKey | null } | null>(null);
  const [dragging, setDragging] = useState(false);
  const { glide, stop } = useQuatGlide();
  if (!drag.current) live.current = value;

  const emit = (q: Quat) => {
    live.current = q;
    setValue(q);
  };
  const snapTo = (q: Quat) => glide(live.current, q, emit, onCommit);

  const orbit = (yaw: number, pitch: number) => orbitBy(live.current, yaw, pitch);

  const pick = (key: ViewKey) => snapTo(VIEWS[qAngle(live.current, VIEWS[key]) < 0.02 ? OPPOSITE(key) : key]);

  const reach = size / 2 - 11;
  const inverse = qConjugate(value);
  const ends = AXES.flatMap((axis: Axis) => {
    const v = qRotate(inverse, AXIS_VEC[axis]);
    return [
      { key: axis as ViewKey, axis, positive: true, x: v[0] * reach, y: -v[1] * reach, depth: v[2] },
      { key: ('-' + axis) as ViewKey, axis, positive: false, x: -v[0] * reach, y: v[1] * reach, depth: -v[2] },
    ];
  }).sort((a, b) => a.depth - b.depth);

  const back = qRotate(value, [0, 0, 1]);
  const azimuth = Math.round(Math.atan2(back[0], back[2]) / DEG);
  const elevation = Math.round(Math.asin(Math.max(-1, Math.min(1, back[1]))) / DEG);

  return (
    <div
      className={cx('ar-viewgizmo', className)}
      style={{ width: size, height: size, ...style }}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuetext={`azimuth ${azimuth}°, elevation ${elevation}°`}
      data-dragging={dragging || undefined}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        stop();
        const hit = (event.target as Element).closest?.('[data-view]')?.getAttribute('data-view') as ViewKey | null;
        drag.current = { x: event.clientX, y: event.clientY, moved: false, hit: hit ?? null };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const d = drag.current;
        if (!d) return;
        const [dx, dy] = [event.clientX - d.x, event.clientY - d.y];
        if (!d.moved && Math.hypot(dx, dy) < 3) return;
        if (!d.moved) setDragging(true);
        d.moved = true;
        d.x = event.clientX;
        d.y = event.clientY;
        const k = speed * (event.shiftKey ? 0.25 : 1);
        emit(orbit(-dx * k, -dy * k));
      }}
      onPointerUp={() => {
        const d = drag.current;
        drag.current = null;
        setDragging(false);
        if (!d) return;
        if (d.moved) onCommit?.(live.current);
        else if (d.hit) pick(d.hit);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
      }}
      onDoubleClick={(event) => {
        if (defaultValue && !(event.target as Element).closest?.('[data-view]')) snapTo(defaultValue);
      }}
      onKeyDown={(event: KeyboardEvent) => {
        const turn = (event.shiftKey ? 5 : 15) * DEG;
        const key = event.key.toLowerCase();
        if (event.key === 'ArrowLeft') emit(orbit(-turn, 0));
        else if (event.key === 'ArrowRight') emit(orbit(turn, 0));
        else if (event.key === 'ArrowUp') emit(orbit(0, -turn));
        else if (event.key === 'ArrowDown') emit(orbit(0, turn));
        else if (key === 'x' || key === 'y' || key === 'z') return void (event.preventDefault(), snapTo(VIEWS[(event.shiftKey ? '-' + key : key) as ViewKey]));
        else if (event.key === 'Home' && defaultValue) return void (event.preventDefault(), snapTo(defaultValue));
        else return;
        event.preventDefault();
        onCommit?.(live.current);
      }}
    >
      <svg viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} aria-hidden>
        {ends.map((end) => {
          const facing = 0.62 + 0.38 * ((end.depth + 1) / 2);
          return (
            <g key={end.key} data-axis={end.axis} style={{ opacity: facing }}>
              {end.positive ? <line className="ar-viewgizmo__arm" x1={0} y1={0} x2={end.x} y2={end.y} /> : null}
              <g className="ar-viewgizmo__end" data-view={end.key} data-positive={end.positive || undefined} transform={`translate(${end.x} ${end.y})`}>
                <circle r={end.positive ? 9 : 6.5} />
                {end.positive ? (
                  <text dy="0.36em" textAnchor="middle">
                    {end.axis.toUpperCase()}
                  </text>
                ) : null}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
