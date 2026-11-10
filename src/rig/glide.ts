'use client';
import { useEffect, useRef } from 'react';
import { qAngle, qSlerp, type Quat } from './math';

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Turn from one orientation to another over a moment: `frame` gets every step, `done` the last.
 * A new glide, or `stop()`, ends the one in flight. With reduced motion it lands at once.
 */
export function useQuatGlide() {
  const raf = useRef(0);
  const stop = () => cancelAnimationFrame(raf.current);
  useEffect(() => stop, []);
  const glide = (from: Quat, to: Quat, frame: (q: Quat) => void, done?: (q: Quat) => void) => {
    stop();
    const angle = qAngle(from, to);
    if (reduced() || angle < 0.002) {
      frame(to);
      done?.(to);
      return;
    }
    const duration = 180 + Math.min(1, angle / Math.PI) * 240;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const q = t === 1 ? to : qSlerp(from, to, ease(t));
      frame(q);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else done?.(to);
    };
    raf.current = requestAnimationFrame(tick);
  };
  return { glide, stop };
}
