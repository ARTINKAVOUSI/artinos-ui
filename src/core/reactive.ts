'use client';
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { approach, spring, useFrames, type Spring } from './motion';
import { reducedMotion } from './utils';

/* How a live value moves, decided by what the value is. Every instrument in the family (Meter,
   Progress, Spectrum, Stat, RollingValue) reads one of these:
   - auto    measures how often readings arrive and fits the motion to that: a feed at frame rate
             is drawn exactly, a slower one arrives before its next reading, a lone change glides;
   - instant no motion at all: what is drawn is the last reading (spectrum, scrubbing, sync);
   - audio   rises in the frame the sound does and falls away on a release, like a level meter;
   - task    work under way: a steady advance through readings that land in steps, a quick reset;
   - smooth  one long fluid glide, for slow gauges where calm matters more than timing;
   or your own numbers. */
export type MotionProfile = 'auto' | 'instant' | 'audio' | 'task' | 'smooth';

export interface MotionTuning {
  /** Rising: about how long the value takes to arrive (ms). 0 is exact. */
  attack?: number;
  /** Falling, the same. Default: the attack. */
  release?: number;
  /** The fewest ms between changes of a readout's digits. 0 shows every reading. */
  refresh?: number;
  /** How long a digit rolls (ms). 0 cuts straight to the new digit. Default: fitted to the feed. */
  roll?: number;
}

export type ReactiveMotion = MotionProfile | MotionTuning;

/** Readings this close together are a feed at frame rate: nothing to interpolate between. */
export const FRAME_GAP = 34;
/** Past this silence the feed has stopped, and the next change is a lone event again. */
const IDLE_GAP = 1500;
/** The longest a digit rolls; with less time than the cut it changes without rolling. */
const ROLL_MAX = 460;
const ROLL_CUT = 56;
/** A readout faster than this is only flicker: the digits hold the latest reading that long. */
const STREAM_REFRESH = 66;
const AUDIO_REFRESH = 100;
const AUDIO_RELEASE = 150;
const SMOOTH_TIME = 180;
const TASK_RESET = 60;

/** The gap between readings, measured as they arrive: quick to learn a faster feed, slower to
 *  believe it has slowed. Infinity while there is no feed. */
export interface Cadence {
  interval: number;
  at: number;
}

export const newCadence = (): Cadence => ({ interval: Infinity, at: 0 });

export function noteArrival(c: Cadence, now: number) {
  const gap = now - c.at;
  const first = c.at === 0;
  c.at = now;
  if (first || gap > IDLE_GAP) c.interval = Infinity;
  else if (!Number.isFinite(c.interval)) c.interval = gap;
  else c.interval += (gap - c.interval) * (gap < c.interval ? 0.5 : 0.25);
}

/** A glide for readings `interval` ms apart. A spring of smooth time s is 99% there after 3.3s,
 *  so this arrives before the next reading lands rather than chasing it. */
const fitted = (interval: number, cap: number) => (interval <= FRAME_GAP ? 0 : Math.min(cap, (interval - 16) * 0.3));
/** A task paces across the whole gap, so the fill never rests between readings. */
const paced = (interval: number) => (interval <= FRAME_GAP ? 0 : Number.isFinite(interval) ? Math.min(700, interval * 0.55) : 300);

/** The smooth time for a rising or falling move at this pace. 0 is exact. */
export function glideFor(motion: ReactiveMotion, interval: number, rising: boolean): number {
  if (typeof motion === 'object') return (rising ? motion.attack : (motion.release ?? motion.attack)) ?? fitted(interval, 260);
  switch (motion) {
    case 'instant':
      return 0;
    case 'audio':
      return rising ? 0 : AUDIO_RELEASE;
    case 'smooth':
      return SMOOTH_TIME;
    case 'task':
      return rising ? paced(interval) : TASK_RESET;
    default:
      return fitted(interval, 260);
  }
}

/** How long a readout holds a reading before it may show the next one. */
export function refreshFor(motion: ReactiveMotion, interval: number) {
  if (typeof motion === 'object' && motion.refresh !== undefined) return motion.refresh;
  if (motion === 'instant') return 0;
  if (motion === 'audio') return AUDIO_REFRESH;
  return interval < STREAM_REFRESH ? STREAM_REFRESH : 0;
}

/** How long a digit rolls at this pace: done before the next reading, a cut once there is no time. */
export function rollFor(motion: ReactiveMotion, interval: number) {
  if (typeof motion === 'object' && motion.roll !== undefined) return motion.roll;
  if (motion === 'instant' || motion === 'audio') return 0;
  // part of the gap, so the digit rests and can be read before the next one moves it
  const dur = Math.min(ROLL_MAX, interval * 0.6);
  return dur < ROLL_CUT ? 0 : dur;
}

/** A value following its readings under a motion. */
export interface Follower extends Spring {
  target: number;
  cadence: Cadence;
  /** How long frames actually take here. */
  frame: number;
}

export const newFollower = (x: number, target = x): Follower => ({ x, v: 0, target, cadence: newCadence(), frame: 16.7 });

/** A new reading: from here the follower heads for it. */
export function push(f: Follower, target: number, now = performance.now()) {
  if (target === f.target) return;
  f.target = target;
  noteArrival(f.cadence, now);
}

/** One frame of `f` under `motion`. Returns whether it is still on its way. */
export function step(f: Follower, motion: ReactiveMotion, dt: number): boolean {
  if (dt > 0) f.frame += (dt - f.frame) * 0.1;
  // on a busy page or a slow screen, readings within two frames have nothing to glide across either
  const interval = f.cadence.interval <= f.frame * 2 ? 0 : f.cadence.interval;
  const glide = reducedMotion() ? 0 : glideFor(motion, interval, f.target >= f.x);
  if (glide <= 0) {
    f.x = f.target;
    f.v = 0;
    return false;
  }
  // a decay has no momentum to keep: audio falls on a plain half-life from wherever it was hit to
  if (motion === 'audio' && f.target < f.x) {
    f.v = 0;
    f.x = approach(f.x, f.target, dt, glide);
  } else spring(f, f.target, dt, glide);
  if (Math.abs(f.x - f.target) < 1e-4 && Math.abs(f.v) < 1e-6) {
    f.x = f.target;
    f.v = 0;
  }
  return f.x !== f.target || f.v !== 0;
}

/** Whether `host` is on screen, kept in a ref; `resume` runs when it comes back. A loop that reads
 *  a live source every frame stops while nobody can see it. */
export function useOnScreen(host: RefObject<Element | null> | undefined, resume: () => void) {
  const seen = useRef(true);
  useEffect(() => {
    const el = host?.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => {
      seen.current = e.isIntersecting;
      if (e.isIntersecting) resume();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [host, resume]);
  return seen;
}

/**
 * Drives `draw(x)` from a value under a motion. With `value` it follows React props; with `source`
 * it reads the live value itself every frame, which is the exact path for audio and anything else
 * that changes faster than React should render, and rests while `host` is off screen. An exact
 * reading is drawn in the commit that brought it, so it reaches the screen in that frame, not the next.
 */
export function useFollower(value: number, motion: ReactiveMotion, draw: (x: number, target: number, dt: number) => boolean | void, source?: () => number, host?: RefObject<Element | null>) {
  const f = useRef<Follower>(null as unknown as Follower);
  if (!f.current) f.current = newFollower(0, value);
  const m = useRef(motion);
  m.current = motion;
  const src = useRef(source);
  src.current = source;
  const kick = useFrames((dt) => {
    const s = f.current;
    const read = src.current;
    if (read) {
      const next = read();
      if (Number.isFinite(next)) s.target = next;
      s.cadence.interval = 0; // read every frame: nothing between readings to invent
    }
    const moving = step(s, m.current, dt);
    const more = draw(s.x, s.target, dt);
    return (Boolean(read) && seen.current) || moving || Boolean(more);
  });
  const seen = useOnScreen(host, kick);
  useLayoutEffect(() => {
    const s = f.current;
    if (!source) {
      push(s, value);
      if (step(s, motion, 0) || draw(s.x, s.target, 0)) kick();
    } else kick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, Boolean(source), kick]);
  return { follower: f, kick };
}
