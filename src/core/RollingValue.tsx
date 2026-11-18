'use client';
import { memo, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { newCadence, noteArrival, refreshFor, rollFor, type Cadence, type ReactiveMotion } from './reactive';
import type { ReadSignal } from './signal';
import { reducedMotion } from './utils';

/* Rolling readout — only the digits that change move, in the direction of change.
 *
 * Every digit slot is an odometer drum: a vertical strip 0-9 repeated three times
 * in one text node. A change rolls the drum through the intermediate digits
 * (up = increasing), ease-out. Every changed digit starts at the same moment and
 * takes the same time however far it travels, so the columns land together on one
 * baseline. An interrupted roll resumes from the drum's live position; on finish the
 * strip re-normalises to the middle repeat so it never runs out. Digits past `base`
 * decimals grow in and out.
 *
 * The roll is timed to the feed so a digit lands before the next reading comes: a value that
 * changes now and then takes the full roll, a stream rolls shorter and passes fewer digits on
 * the way, and past the point where a roll could land the digit simply changes. In a stream each
 * column keeps its own pace, so the last digit cuts while the slower ones ahead of it still roll.
 */

const CELL = 1.3; // em — the readout line-height
const STRIP = Array.from({ length: 30 }, (_, i) => i % 10).join('\n');
const MASK = 'linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%)';
const ROLL = 'cubic-bezier(.22,1,.36,1)';
const isDigit = (c: string) => c >= '0' && c <= '9';

/** A column slower than the stream it is in may roll this long, however fast the digits after it;
 *  with less time than the cut it changes without rolling, so a stream reads as numbers, not motion. */
const COLUMN_ROLL = 140;
const COLUMN_CUT = 80;
/** A roll passes about one digit in this many ms; further than that it is a blur, not a reading. */
const MS_PER_DIGIT = 60;

interface SlotProps {
  ch: string;
  dir: number;
  dur: number;
  /** The value streams: this column times its roll by its own pace. */
  stream: boolean;
  grow: boolean;
}

const Slot = memo(function Slot({ ch, dir, dur: base, stream, grow }: SlotProps) {
  const host = useRef<HTMLSpanElement>(null);
  const strip = useRef<HTMLSpanElement>(null);
  const prev = useRef(ch);
  const anim = useRef<Animation | null>(null);
  const pos = useRef(isDigit(ch) ? +ch + 10 : 10);
  const pace = useRef<Cadence>(newCadence());
  const span = useRef({ from: 0, to: 0 });

  const place = (i: number) => {
    if (strip.current) strip.current.style.transform = `translateY(${-i * CELL}em)`;
  };
  // only while it moves does the slot show the drum; at rest it shows its digit as plain text in
  // the readout's own line, so every column settles on the same pixel row as the "." and the unit
  // (a drum offset is a fraction of a pixel that differs per digit, and text snaps to it unevenly)
  const rolling = (on: boolean) => {
    const h = host.current;
    if (!h) return;
    h.toggleAttribute('data-rolling', on);
    h.style.maskImage = on ? MASK : '';
    h.style.setProperty('-webkit-mask-image', on ? MASK : '');
  };

  useLayoutEffect(() => {
    if (grow && !reducedMotion() && host.current?.animate) {
      host.current.animate(
        [{ width: '0ch', opacity: 0, filter: 'blur(1px)' }, { width: '1ch', opacity: 1, filter: 'blur(0)' }],
        { duration: 260, easing: ROLL },
      );
    }
    return () => anim.current?.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const p = prev.current;
    prev.current = ch;
    if (p === ch || !isDigit(ch)) return;
    const s = strip.current;
    if (!s || !host.current) return;
    noteArrival(pace.current, performance.now());
    const own = Math.min(COLUMN_ROLL, pace.current.interval * 0.6);
    const dur = stream ? (own < COLUMN_CUT ? 0 : own) : base;
    const target = +ch;
    if (!isDigit(p) || reducedMotion() || !dur || !s.animate) {
      anim.current?.cancel();
      anim.current = null;
      rolling(false);
      pos.current = target + 10;
      place(pos.current);
      return;
    }
    let cur = pos.current;
    if (anim.current) {
      // where the drum is, from the animation's own clock: asking the page would force a layout
      const done = anim.current.effect?.getComputedTiming().progress ?? 1;
      cur = span.current.from + (span.current.to - span.current.from) * done;
      anim.current.cancel();
      anim.current = null;
    }
    const from = ((Math.round(pos.current) % 10) + 10) % 10;
    const delta = dir >= 0 ? (target - from + 10) % 10 : -((from - target + 10) % 10);
    let tgt = pos.current + delta;
    const shift = -10 * Math.floor(Math.min(cur, tgt) / 10);
    cur += shift;
    tgt += shift;
    pos.current = tgt;
    // short of time, start nearer: the new digit slides in instead of a blur of those between
    const reach = Math.max(1, dur / MS_PER_DIGIT);
    if (Math.abs(tgt - cur) > reach) cur = tgt - Math.sign(tgt - cur) * reach;
    const travel = Math.abs(tgt - cur);
    span.current = { from: cur, to: tgt };
    place(tgt);
    rolling(true);
    const a = s.animate(
      [
        { transform: `translateY(${-cur * CELL}em)`, filter: travel > 2.5 ? 'blur(.35px)' : 'blur(0)' },
        { transform: `translateY(${-tgt * CELL}em)`, filter: 'blur(0)' },
      ],
      { duration: dur, easing: ROLL },
    );
    anim.current = a;
    a.onfinish = () => {
      if (anim.current !== a) return;
      anim.current = null;
      rolling(false);
      pos.current = (((tgt % 10) + 10) % 10) + 10;
      place(pos.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ch]);

  return (
    <span ref={host} className="ar-roll__slot" data-char={isDigit(ch) ? undefined : ''} aria-hidden="true">
      <span className="ar-roll__char">{ch}</span>
      {isDigit(ch) ? (
        <span ref={strip} aria-hidden="true" className="ar-roll__strip" style={{ transform: `translateY(${-pos.current * CELL}em)` }}>
          {STRIP}
        </span>
      ) : null}
    </span>
  );
});

export interface RollingValueProps {
  /** Formatted number, e.g. "65.00". */
  text: string;
  /** Quieter unit rendered after the number, e.g. "dB". */
  unit?: string;
  /** Direction of the last change: 1 rolls up, -1 rolls down. Default: read from the numbers. */
  dir?: number;
  /** Hold the roll short while the hand is on the control. */
  fast?: boolean;
  /** Canonical decimal count — digits beyond it grow in and out. */
  base?: number;
  /** How the digits answer the feed. Default 'auto': fitted to how often the text changes. */
  motion?: ReactiveMotion;
  className?: string;
}

const numberIn = (s: string) => parseFloat(s.replace(/−/g, '-').replace(/[^\d.-]/g, ''));

/** Faster than this the value counts as a stream, and its columns keep their own pace. */
const STREAM = 200;
const FAST_ROLL = 160;

export function RollingValue({ text, unit, dir, fast, base = 2, motion = 'auto', className }: RollingValueProps) {
  const st = useRef({ shown: text, shownAt: 0, seen: text, dir: 1, cadence: newCadence() });
  const s = st.current;
  const now = typeof performance !== 'undefined' ? performance.now() : 0;
  if (text !== s.seen) {
    s.seen = text; // once per change, even when a render repeats
    noteArrival(s.cadence, now);
  }
  // a feed faster than the eye shows its latest reading at a pace digits can be read at; the last
  // reading always lands, by the timer below when no newer one comes along
  const refresh = refreshFor(motion, s.cadence.interval);
  if (text !== s.shown && now - s.shownAt >= refresh - 1) {
    const a = numberIn(text);
    const b = numberIn(s.shown);
    if (a !== b && !Number.isNaN(a) && !Number.isNaN(b)) s.dir = a > b ? 1 : -1;
    s.shown = text;
    s.shownAt = now;
  }
  const [, wake] = useState(0);
  useEffect(() => {
    if (s.shown === s.seen) return;
    const id = setTimeout(() => wake((n) => n + 1), Math.max(0, refresh - (performance.now() - s.shownAt)));
    return () => clearTimeout(id);
  });
  const direction = dir ?? s.dir;
  const shownEvery = Math.max(refresh, s.cadence.interval);
  const fitted = rollFor(motion, shownEvery);
  const dur = Math.round(fast ? Math.min(FAST_ROLL, fitted) : fitted);
  const stream = (motion === 'auto' || motion === 'task') && shownEvery < STREAM;
  const chars = Array.from(s.shown);
  const di = chars.indexOf('.') < 0 ? chars.length : chars.indexOf('.');
  return (
    <span className={'ar-roll' + (className ? ' ' + className : '')}>
      <span className="ar-sr">{s.shown + (unit ? ' ' + unit : '')}</span>
      {chars.map((c, i) => {
        const p = i - di;
        return <Slot key={p} ch={c} dir={direction} dur={dur} stream={stream} grow={p > base} />;
      })}
      {unit ? (
        <span className="ar-roll__unit" aria-hidden="true" data-tight={unit === '°' || unit === '%' ? '' : undefined}>
          {unit}
        </span>
      ) : null}
    </span>
  );
}

export interface SignalDigitsProps extends Omit<RollingValueProps, 'text' | 'unit' | 'dir'> {
  signal: ReadSignal<number>;
  /** The value as the readout shows it. */
  format: (value: number) => { text: string; unit?: string };
  /** Direction of the last change, read when the digits change. */
  dir?: () => number;
}

/** A readout on a signal: the only part of a control that renders while the value moves, and only
 *  when the digits it shows have changed. */
export function SignalDigits({ signal, format, dir, ...rest }: SignalDigitsProps) {
  const read = () => {
    const f = format(signal.peek());
    return f.unit ? `${f.text}\u0000${f.unit}` : f.text;
  };
  const shown = useSyncExternalStore(signal.subscribe, read, read);
  const [text, unit] = shown.split('\u0000');
  return <RollingValue text={text} unit={unit} dir={dir?.()} {...rest} />;
}

const NUMBER = /[-+−]?\d[\d.,:]*/g;
const BARE_NUMBER = /^[-+−]?[\d.,:]+\s?[^\s\d]{0,4}$/;

/**
 * Any readout text. A bare number (with at most a short unit) rolls as one readout; in a
 * sentence ("56.1 L · 50 of its seed") only the numbers roll and the words stay plain text,
 * so letters never sit in a digit's drum. No digits: plain text ("—", "true", a name).
 */
export function RollingText({ text, base = 3, motion, className }: { text: string; base?: number; motion?: ReactiveMotion; className?: string }) {
  if (!/\d/.test(text)) return <span className={className}>{text}</span>;
  if (BARE_NUMBER.test(text.trim())) return <RollingValue text={text} base={base} motion={motion} className={className} />;
  const parts = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(NUMBER)) {
    if (m.index! > last) parts.push(<span key={'t' + k}>{text.slice(last, m.index)}</span>);
    parts.push(<RollingValue key={'n' + k} text={m[0]} base={base} motion={motion} />);
    last = m.index! + m[0].length;
    k++;
  }
  if (last < text.length) parts.push(<span key="tail">{text.slice(last)}</span>);
  return (
    <span className={className}>
      <span className="ar-sr">{text}</span>
      <span aria-hidden="true">{parts}</span>
    </span>
  );
}
