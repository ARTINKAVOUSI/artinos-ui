'use client';
import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { useControllable } from '../core/hooks';
import { RollingValue } from '../core/RollingValue';
import type { Signal } from '../core/signal';
import { cx } from '../core/utils';
import { useQuatGlide } from './glide';
import { AXES, AXIS_VEC, DEG, QUAT_IDENTITY, eulerFromQuat, qAxisAngle, qConjugate, qMul, qNormalize, qRotate, vCross, vNormalize, type Axis, type Quat, type Vec3 } from './math';

export interface TrackballProps {
  /** The value itself: read and written here. Takes the place of `value`. */
  signal?: Signal<Quat>;
  /** The object's orientation, [x, y, z, w]: goes straight into `object.quaternion.fromArray()`. */
  value?: Quat;
  onChange?: (value: Quat) => void;
  /** Once, when a drag ends. */
  onCommit?: (value: Quat) => void;
  /** Where it starts when nothing else holds the value; double-click, or Home, returns here. Default: no rotation. */
  defaultValue?: Quat;
  /** The viewport camera's orientation. Given, the ball shows the object as that camera sees it, and a drag turns it the way it turns on screen. */
  view?: Quat;
  label?: string;
  /** Diameter in px. */
  size?: number;
  /** Degrees an axis ring snaps to while Ctrl is held. */
  snap?: number;
  /** The Euler angles under the ball. */
  readout?: boolean;
  className?: string;
  style?: CSSProperties;
}

type Grip = Axis | 'roll' | 'free';
const SEGMENTS = 64;
const RING: Record<Axis, Vec3[]> = {
  x: Array.from({ length: SEGMENTS + 1 }, (_, i) => [0, Math.cos((i / SEGMENTS) * 2 * Math.PI), Math.sin((i / SEGMENTS) * 2 * Math.PI)]),
  y: Array.from({ length: SEGMENTS + 1 }, (_, i) => [Math.sin((i / SEGMENTS) * 2 * Math.PI), 0, Math.cos((i / SEGMENTS) * 2 * Math.PI)]),
  z: Array.from({ length: SEGMENTS + 1 }, (_, i) => [Math.cos((i / SEGMENTS) * 2 * Math.PI), Math.sin((i / SEGMENTS) * 2 * Math.PI), 0]),
};
const n = (v: number) => v.toFixed(2);

/**
 * Trackball — an object's rotation as a ball you turn with the hand. Drag the body to tumble it
 * freely; drag one of the three axis rings to turn about that axis alone; drag outside the ball
 * to roll it about the line of sight. Shift is fine, Ctrl snaps a ring to steps. Arrow keys
 * turn it, double-click returns it to rest. The value is a quaternion, so it never gimbal-locks;
 * the Euler angles are shown underneath.
 */
export function Trackball({ signal, value: valueProp, onChange, onCommit, defaultValue = QUAT_IDENTITY, view, label = 'Rotation', size = 120, snap = 15, readout = true, className, style }: TrackballProps) {
  const [value, setValue] = useControllable<Quat>(valueProp, defaultValue, onChange, signal);
  const ball = useRef<HTMLDivElement>(null);
  const live = useRef(value);
  const drag = useRef<{ grip: Grip; q0: Quat; axis: Vec3; linear: [number, number] | null; total: number; x: number; y: number; angle: number; moved: boolean } | null>(null);
  const [hot, setHot] = useState<Grip | null>(null);
  const [held, setHeld] = useState<Grip | null>(null);
  const { glide, stop } = useQuatGlide();
  if (!drag.current) live.current = value;

  const toView = view ? qConjugate(view) : null;
  /** the object as the camera sees it */
  const seen = (q: Quat) => (toView ? qMul(toView, q) : q);
  const unseen = (q: Quat) => (view ? qMul(view, q) : q);
  const emit = (q: Quat) => {
    const next = qNormalize(q);
    live.current = next;
    setValue(next);
  };

  const radius = size / 2 - 10;
  const qv = seen(value);

  const local = (event: { clientX: number; clientY: number }): [number, number] => {
    const rect = ball.current!.getBoundingClientRect();
    return [event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2];
  };
  /** What is under the pointer: a ring (and the point of it that was caught), the rim, or the body. */
  const gripAt = (x: number, y: number): { grip: Grip; point: Vec3 } => {
    const q = seen(live.current);
    let grip: Grip = Math.hypot(x, y) > radius + 4 ? 'roll' : 'free';
    let point: Vec3 = [0, 0, 1];
    let nearest = 6;
    for (const axis of AXES)
      for (const p of RING[axis]) {
        const v = qRotate(q, p);
        if (v[2] < -0.05) continue;
        const d = Math.hypot(v[0] * radius - x, -v[1] * radius - y);
        if (d < nearest) [nearest, grip, point] = [d, axis, v];
      }
    return { grip, point };
  };

  const paths = AXES.map((axis) => {
    let front = '';
    let back = '';
    let wasFront: boolean | null = null;
    let prev = '';
    for (const p of RING[axis]) {
      const v = qRotate(qv, p);
      const at = `${n(v[0] * radius)} ${n(-v[1] * radius)}`;
      const isFront = v[2] >= 0;
      if (prev) {
        if (isFront) front += (wasFront ? '' : `M${prev}`) + `L${at}`;
        else back += (wasFront === false ? '' : `M${prev}`) + `L${at}`;
      }
      wasFront = prev ? isFront : null;
      prev = at;
    }
    const tip = qRotate(qv, AXIS_VEC[axis]);
    return { axis, front, back, tip };
  });

  const euler = eulerFromQuat(value);
  const active = held ?? hot;

  return (
    <div className={cx('ar-trackball', className)} style={{ width: size, ...style }}>
      <div
        ref={ball}
        className="ar-trackball__ball"
        style={{ width: size, height: size, ['--_r' as string]: `${radius}px` }}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuetext={`x ${euler[0].toFixed(0)}°, y ${euler[1].toFixed(0)}°, z ${euler[2].toFixed(0)}°`}
        data-grip={active ?? undefined}
        data-held={held ? '' : undefined}
        onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
          if (event.button !== 0) return;
          stop();
          const [x, y] = local(event);
          const { grip, point } = gripAt(x, y);
          const q0 = seen(live.current);
          const ring = grip !== 'roll' && grip !== 'free';
          const axis: Vec3 = ring ? vNormalize(qRotate(q0, AXIS_VEC[grip])) : [0, 0, 1];
          // a ring is pulled along itself: the way the caught point travels on screen as the ring
          // turns. Foreshortened travel is scaled back up, so the ring keeps pace with the hand.
          let linear: [number, number] | null = null;
          if (ring) {
            const travel = vCross(axis, point);
            const seenLength = Math.hypot(travel[0], travel[1]) || 1;
            const gain = 1 / Math.max(0.35, seenLength);
            linear = [(travel[0] / seenLength) * gain, (-travel[1] / seenLength) * gain];
          }
          drag.current = { grip, q0, axis, linear, total: 0, x, y, angle: Math.atan2(-y, x), moved: false };
          event.currentTarget.setPointerCapture(event.pointerId);
          setHeld(grip);
        }}
        onPointerMove={(event) => {
          const [x, y] = local(event);
          const d = drag.current;
          if (!d) {
            const { grip } = gripAt(x, y);
            if (grip !== hot) setHot(grip);
            return;
          }
          const [dx, dy] = [x - d.x, y - d.y];
          if (!dx && !dy) return;
          d.x = x;
          d.y = y;
          d.moved = true;
          const fine = event.shiftKey ? 0.25 : 1;
          if (d.grip === 'free') {
            const turn = (Math.hypot(dx, dy) / radius) * fine;
            d.q0 = qMul(qAxisAngle(vNormalize([dy, dx, 0]), turn), d.q0);
            emit(unseen(d.q0));
            return;
          }
          if (d.linear) d.total += ((dx * d.linear[0] + dy * d.linear[1]) / radius) * fine;
          else {
            const angle = Math.atan2(-y, x);
            let step = angle - d.angle;
            if (step > Math.PI) step -= 2 * Math.PI;
            else if (step < -Math.PI) step += 2 * Math.PI;
            d.angle = angle;
            d.total += step * fine;
          }
          const grain = snap * DEG;
          const total = event.ctrlKey || event.metaKey ? Math.round(d.total / grain) * grain : d.total;
          emit(unseen(qMul(qAxisAngle(d.axis, total), d.q0)));
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          setHeld(null);
          if (d?.moved) onCommit?.(live.current);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setHeld(null);
        }}
        onPointerLeave={() => !drag.current && setHot(null)}
        onDoubleClick={() => glide(live.current, defaultValue, emit, onCommit)}
        onKeyDown={(event: KeyboardEvent) => {
          const turn = (event.shiftKey ? 1 : 5) * DEG;
          const about: Vec3 | null =
            event.key === 'ArrowLeft' ? [0, -1, 0] : event.key === 'ArrowRight' ? [0, 1, 0] : event.key === 'ArrowUp' ? [-1, 0, 0] : event.key === 'ArrowDown' ? [1, 0, 0] : null;
          if (event.key === 'Home') {
            event.preventDefault();
            glide(live.current, defaultValue, emit, onCommit);
          }
          if (!about) return;
          event.preventDefault();
          emit(unseen(qMul(qAxisAngle(about, turn), seen(live.current))));
          onCommit?.(live.current);
        }}
      >
        <svg viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} aria-hidden>
          <circle className="ar-trackball__roll" r={radius + 6} />
          {paths.map((p) => (
            <path key={p.axis + 'b'} className="ar-trackball__ring" data-axis={p.axis} data-back d={p.back} />
          ))}
          {paths.map((p) => (
            <path key={p.axis} className="ar-trackball__ring" data-axis={p.axis} d={p.front} />
          ))}
          {paths.map((p) => (
            <circle key={p.axis + 't'} className="ar-trackball__tip" data-axis={p.axis} data-back={p.tip[2] < 0 || undefined} cx={p.tip[0] * radius} cy={-p.tip[1] * radius} r={3} />
          ))}
        </svg>
      </div>
      {readout ? (
        <div className="ar-trackball__readout">
          {AXES.map((axis, i) => (
            <span key={axis} data-axis={axis}>
              <i className="ar-text">{axis.toUpperCase()}</i>
              <span className="ar-value">
                <RollingValue text={euler[i].toFixed(0)} unit="°" />
              </span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
