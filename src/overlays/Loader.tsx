'use client';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ThemedPortal } from '../core/portal';
import { onFrame } from '../core/ticker';
import { cx, reducedMotion } from '../core/utils';

export interface LoaderProps {
  /** Real progress, 0..1: the reels follow it, and the exit plays once it reaches 1.
   *  Leave it out for a timed count to 100 over `duration`. */
  value?: number;
  /** The timed count, in ms. Default 2600. */
  duration?: number;
  /** How long 100 stands before the figures leave, in ms. Default 450. */
  hold?: number;
  /** A quiet line under the figures: "Loading scene". */
  label?: ReactNode;
  /** page: a cover over the whole window · box: over the nearest positioned parent (a canvas, a
   *  panel) · none: the figures alone, in the flow. Default 'page'. */
  cover?: 'page' | 'box' | 'none';
  /** Called once the figures and the cover have gone. */
  onDone?: () => void;
  /** Hollow figures: drawn as a hairline outline in the ink, with no fill. */
  outline?: boolean;
  className?: string;
  style?: CSSProperties;
}

/* Three windows, each over a sideways reel 0 1 2 … 9 0. A reel's position is a number of digits;
 * it is drawn modulo ten, so a reel that runs past 9 keeps turning the same way and lands on 0.
 * Hundreds, tens and units each ease to their own target, the units a beat behind, so the count
 * reads as one figure arriving rather than a meter ticking. */

const CELLS = '01234567890';
/** hundreds · tens · units: start delay and share of the duration */
const DELAY = [0, 0, 0.05];
const SHARE = [0.72, 1, 1];
/** A live feed moves each step in this long. */
const STEP_MS = 900;
const LEAVE_MS = 520;
const LEAVE_STAGGER = 90;
const COVER_MS = 420;

const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out = (t: number) => 1 - Math.pow(1 - t, 3);

interface Reel {
  pos: number;
  from: number;
  to: number;
  start: number;
  dur: number;
  ease: (t: number) => number;
}

const targetsOf = (pct: number) => (pct >= 100 ? [1, 10, 100] : [0, Math.floor(pct / 10), pct]);

/**
 * Loader — a count to 100 on three sideways digit reels, in the figure face. It runs on a timer or
 * on real progress (`value`); at 100 it holds, the figures fade and settle back one after another,
 * and the cover lifts.
 */
export function Loader({ value, duration = 2600, hold = 450, label, cover = 'page', onDone, outline, className, style }: LoaderProps) {
  const timed = value === undefined;
  const pct = timed ? 100 : Math.round(Math.min(1, Math.max(0, value)) * 100);
  const [phase, setPhase] = useState<'count' | 'leave' | 'gone'>('count');
  const root = useRef<HTMLDivElement>(null);
  const wraps = useRef<(HTMLSpanElement | null)[]>([]);
  const strips = useRef<(HTMLSpanElement | null)[]>([]);
  const reels = useRef<Reel[]>([0, 1, 2].map(() => ({ pos: 0, from: 0, to: 0, start: 0, dur: 0, ease: inOut })));
  const stop = useRef<(() => void) | null>(null);
  const done = useRef(onDone);
  done.current = onDone;

  const draw = () => {
    reels.current.forEach((r, i) => {
      const s = strips.current[i];
      if (s) s.style.transform = `translateX(calc(var(--_cell) * ${-(((r.pos % 10) + 10) % 10)}))`;
    });
  };

  // a new target: every reel sets off from where it is, never back through the digits it showed
  useLayoutEffect(() => {
    if (phase !== 'count') return;
    const el = root.current;
    const view = el?.ownerDocument.defaultView;
    if (!el || !view) return;
    const now = view.performance.now();
    const still = reducedMotion();
    const targets = targetsOf(pct);
    const base = timed ? duration : STEP_MS;
    reels.current.forEach((r, i) => {
      let from = r.pos;
      const to = targets[i];
      if (to === r.to && r.start) return;
      const travel = to - from;
      // more than a turn: drop whole turns, the reel shows the same digit and spins once
      if (Math.abs(travel) > 10) from = to - Math.sign(travel) * (Math.abs(travel) % 10 || 10);
      const moving = r.pos !== r.to;
      Object.assign(r, { pos: from, from, to, start: now + DELAY[i] * base, dur: still ? 0 : base * SHARE[i], ease: moving ? out : inOut });
    });
    draw();
    let wait = 0;
    stop.current = onFrame(view, (t) => {
      let settled = true;
      for (const r of reels.current) {
        const k = r.dur ? Math.min(1, Math.max(0, (t - r.start) / r.dur)) : 1;
        r.pos = r.from + (r.to - r.from) * r.ease(k);
        if (k < 1) settled = false;
      }
      draw();
      if (settled) {
        stop.current?.();
        stop.current = null;
        if (pct >= 100) wait = view.setTimeout(() => setPhase((p) => (p === 'count' ? 'leave' : p)), still ? 0 : hold);
      }
    });
    return () => {
      stop.current?.();
      stop.current = null;
      view.clearTimeout(wait);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct, phase]);

  // the figures fade and settle back one after another, then the cover lifts
  useEffect(() => {
    if (phase !== 'leave') return;
    const el = root.current;
    const view = el?.ownerDocument.defaultView;
    if (!el || !view) return;
    const still = reducedMotion() || !el.animate;
    const parts = [...wraps.current, el.querySelector<HTMLElement>('.ar-loader__label')].filter(Boolean) as HTMLElement[];
    let last = 0;
    if (!still) {
      parts.forEach((p, i) => {
        p.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.9)' }], {
          duration: LEAVE_MS,
          delay: i * LEAVE_STAGGER,
          easing: 'cubic-bezier(.65,0,.35,1)',
          fill: 'forwards',
        });
      });
      last = (parts.length - 1) * LEAVE_STAGGER + LEAVE_MS;
      if (cover !== 'none') el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: COVER_MS, delay: last - 120, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    }
    const end = still ? 0 : last + (cover !== 'none' ? COVER_MS - 120 : 0);
    const id = view.setTimeout(() => {
      setPhase('gone');
      done.current?.();
    }, end);
    return () => view.clearTimeout(id);
  }, [phase, cover]);

  if (phase === 'gone') return null;

  const shown = timed ? undefined : pct;
  const body = (
    <div
      ref={root}
      className={cx('ar-loader', className)}
      data-cover={cover === 'none' ? undefined : cover}
      data-outline={outline ? '' : undefined}
      role="progressbar"
      aria-label={typeof label === 'string' ? label : 'Loading'}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={shown}
      aria-busy={phase === 'count' || undefined}
      style={style}
    >
      <span className="ar-loader__figure" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} ref={(n) => void (wraps.current[i] = n)} className="ar-loader__window">
            <span ref={(n) => void (strips.current[i] = n)} className="ar-loader__reel">
              {Array.from(CELLS, (c, k) => (
                <span key={k}>{c}</span>
              ))}
            </span>
          </span>
        ))}
      </span>
      {label != null ? <span className="ar-loader__label">{label}</span> : null}
    </div>
  );
  return cover === 'page' ? <ThemedPortal>{body}</ThemedPortal> : body;
}
