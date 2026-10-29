'use client';
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { reducedMotion } from './utils';

/* Rolling readout — only the characters that change move, in the direction of change.
 *
 * Each changed character slides: the old one leaves upward (or downward for a falling
 * value) and fades, the new one rises in from the other side with a breath of motion blur.
 * Every changed character moves at the same moment over the same distance, so the columns
 * travel as one line and land on one baseline. A value that streams (a meter, a live
 * readout) slides short; an interrupted slide starts again from where the value now is.
 * Digits past `base` decimals grow in and out.
 */

const ROLL = 'cubic-bezier(.22,1,.36,1)';
const RISE = 0.62; // em — how far a character travels
const MASK = 'linear-gradient(180deg, transparent 0%, #000 24%, #000 76%, transparent 100%)';
const isDigit = (c: string) => c >= '0' && c <= '9';

interface SlotProps {
  ch: string;
  dir: number;
  dur: number;
  grow: boolean;
}

const Slot = memo(function Slot({ ch, dir, dur, grow }: SlotProps) {
  const host = useRef<HTMLSpanElement>(null);
  const incoming = useRef<HTMLSpanElement>(null);
  const outgoing = useRef<HTMLSpanElement>(null);
  const prev = useRef(ch);
  const turn = useRef(0);
  const anims = useRef<Animation[]>([]);
  // the character leaving, keyed by turn so a second change mid-slide starts a fresh one
  const [leaving, setLeaving] = useState<{ ch: string; turn: number } | null>(null);

  const mask = (on: boolean) => {
    const h = host.current;
    if (!h) return;
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
    return () => anims.current.forEach((a) => a.cancel());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const p = prev.current;
    prev.current = ch;
    if (p === ch) return;
    anims.current.forEach((a) => a.cancel());
    anims.current = [];
    if (reducedMotion() || !dur || !host.current?.animate) {
      mask(false);
      setLeaving(null);
      return;
    }
    setLeaving({ ch: p, turn: ++turn.current });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ch]);

  useLayoutEffect(() => {
    const a = incoming.current;
    const b = outgoing.current;
    if (!leaving || !a || !b) return;
    const d = dir >= 0 ? 1 : -1; // a rising value enters from below
    const timing = { duration: dur, easing: ROLL };
    mask(true);
    const enter = a.animate(
      [
        { transform: `translateY(${RISE * d}em)`, opacity: 0, filter: 'blur(0.8px)' },
        { transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' },
      ],
      timing,
    );
    const exit = b.animate(
      [
        { transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' },
        { transform: `translateY(${-RISE * d}em)`, opacity: 0, filter: 'blur(0.8px)' },
      ],
      { ...timing, fill: 'forwards' },
    );
    anims.current = [enter, exit];
    exit.onfinish = () => {
      if (turn.current !== leaving.turn) return;
      mask(false);
      setLeaving(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  return (
    <span ref={host} className="ar-roll__slot" data-char={isDigit(ch) ? undefined : ''} aria-hidden="true">
      <span ref={incoming} className="ar-roll__char">
        {ch}
      </span>
      {leaving ? (
        <span ref={outgoing} className="ar-roll__char ar-roll__char--out">
          {leaving.ch}
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
  /** Short motion while the hand is on the control. Default: on while the value changes rapidly. */
  fast?: boolean;
  /** Canonical decimal count — digits beyond it grow in and out. */
  base?: number;
  className?: string;
}

const numberIn = (s: string) => parseFloat(s.replace(/−/g, '-').replace(/[^\d.-]/g, ''));

export function RollingValue({ text, unit, dir, fast, base = 2, className }: RollingValueProps) {
  const prev = useRef(text);
  // auto direction and pace: a value that rises rolls up; a value that streams (a meter,
  // a live readout) rolls short so the digits stay legible
  const auto = useRef({ dir: 1, at: 0, fast: false, seen: text });
  if (text !== prev.current && text !== auto.current.seen) {
    auto.current.seen = text; // once per change, even when a render repeats
    const now = typeof performance !== 'undefined' ? performance.now() : 0;
    const a = numberIn(text);
    const b = numberIn(prev.current);
    if (a !== b && !Number.isNaN(a) && !Number.isNaN(b)) auto.current.dir = a > b ? 1 : -1;
    auto.current.fast = now - auto.current.at < 450; // sooner than a full roll would settle
    auto.current.at = now;
  }
  const direction = dir ?? auto.current.dir;
  const quick = fast ?? auto.current.fast;
  const chars = Array.from(text);
  const di = chars.indexOf('.') < 0 ? chars.length : chars.indexOf('.');
  useEffect(() => {
    prev.current = text;
  });
  const dur = quick ? 140 : 300;
  return (
    <span className={'ar-roll' + (className ? ' ' + className : '')}>
      <span className="ar-sr">{text + (unit ? ' ' + unit : '')}</span>
      {chars.map((c, i) => {
        const p = i - di;
        return <Slot key={p} ch={c} dir={direction} dur={dur} grow={p > base} />;
      })}
      {unit ? (
        <span className="ar-roll__unit" aria-hidden="true" data-tight={unit === '°' || unit === '%' ? '' : undefined}>
          {unit}
        </span>
      ) : null}
    </span>
  );
}

const NUMBER = /[-+−]?\d[\d.,:]*/g;
const BARE_NUMBER = /^[-+−]?[\d.,:]+\s?[^\s\d]{0,4}$/;

/**
 * Any readout text. A bare number (with at most a short unit) rolls as one readout; in a
 * sentence ("56.1 L · 50 of its seed") only the numbers roll and the words stay plain text,
 * so letters never sit in a digit's slot. No digits: plain text ("—", "true", a name).
 */
export function RollingText({ text, base = 3, className }: { text: string; base?: number; className?: string }) {
  if (!/\d/.test(text)) return <span className={className}>{text}</span>;
  if (BARE_NUMBER.test(text.trim())) return <RollingValue text={text} base={base} className={className} />;
  const parts = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(NUMBER)) {
    if (m.index! > last) parts.push(<span key={'t' + k}>{text.slice(last, m.index)}</span>);
    parts.push(<RollingValue key={'n' + k} text={m[0]} base={base} />);
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
