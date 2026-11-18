'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useControllable } from '../core/hooks';
import type { Signal } from '../core/signal';
import { cx, normalizeOptions, revealClipped, scopeAttrs } from '../core/utils';
import type { OptionInput, ScopeProps } from '../core/utils';

/* ARTINOS Segmented — one of n. The insert travels between positions and the text
   it arrives under switches ink. Arrow keys move it. */

export interface SegmentedProps<V extends string = string> extends ScopeProps {
  /** Accessible name. */
  label?: string;
  options: readonly OptionInput<V>[];
  /** The value itself: read and written here. Takes the place of `value`. */
  signal?: Signal<V>;
  value?: V;
  defaultValue?: V;
  onChange?: (value: V) => void;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

export function Segmented<V extends string = string>({ label, options, signal, value, defaultValue, onChange, material, density, className, style, id }: SegmentedProps<V>) {
  const opts = normalizeOptions(options);
  const [cur, pick] = useControllable<V>(value, defaultValue ?? opts[0]?.value, onChange, signal);
  const n = Math.max(1, opts.length);
  const idx = Math.max(0, opts.findIndex((o) => o.value === cur));
  const onKeyDown = (e: ReactKeyboardEvent) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    for (let k = 1; k < n; k++) {
      const o = opts[(((idx + d * k) % n) + n) % n];
      if (!o.disabled) {
        pick(o.value);
        return;
      }
    }
  };
  /* Cells are equal while every word fits. When one would be cut, the cells take their words'
     widths (data-fit) and the insert is placed on the chosen cell by measurement. */
  const rootRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const padRef = useRef(0);
  const measureRef = useRef(() => {});
  measureRef.current = () => {
    const el = rootRef.current;
    const row = rowRef.current;
    if (!el || !row) return;
    const cells = Array.from(row.children) as HTMLElement[];
    if (!cells.length || !row.clientWidth) return; // not laid out yet: the observer calls again
    const was = el.getAttribute('data-fit');
    const cell = row.clientWidth / cells.length;
    let widest = 0;
    let all = 0;
    for (const c of cells) {
      const cs = getComputedStyle(c);
      if (was === null) padRef.current = parseFloat(cs.paddingLeft) || 0; // the equal layout's padding
      const kids = Array.from(c.children) as HTMLElement[];
      const gap = parseFloat(cs.columnGap) || 0;
      const content = kids.reduce((w, k) => w + k.scrollWidth, 0) + gap * Math.max(0, kids.length - 1);
      widest = Math.max(widest, content);
      all += content;
    }
    const pad = padRef.current;
    const tight = widest + 2 * pad > cell + 0.5;
    // fitted cells keep two thirds of the padding; where even that cuts a word, a third
    const now = !tight ? null : all + cells.length * 2 * (pad * 2) / 3 > row.clientWidth + 0.5 ? 'tight' : '';
    if (now !== was) {
      // changing layout is not a move: the insert takes its new place without sliding
      el.setAttribute('data-settling', '');
      requestAnimationFrame(() => el.removeAttribute('data-settling'));
      if (now === null) el.removeAttribute('data-fit');
      else el.setAttribute('data-fit', now);
    }
    const on = cells[idx];
    if (tight && on) {
      // the row's own inset is a fraction of a pixel in some families: read it unrounded
      const inset = parseFloat(getComputedStyle(row).left);
      // measured in fractions of a pixel, and in the row's own units if a parent is scaled
      const rr = row.getBoundingClientRect();
      const cr = on.getBoundingClientRect();
      const s = row.offsetWidth ? rr.width / row.offsetWidth || 1 : 1;
      el.style.setProperty('--_x', `${(Number.isFinite(inset) ? inset : row.offsetLeft) + (cr.left - rr.left) / s}px`);
      el.style.setProperty('--_w', `${cr.width / s}px`);
    }
  };
  useLayoutEffect(() => measureRef.current());
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    // the control's width, and each word's: a theme, a type system or a density changes the words
    // without changing the control
    const ro = new ResizeObserver(() => measureRef.current());
    ro.observe(el);
    for (const c of Array.from(rowRef.current?.children ?? [])) {
      ro.observe(c);
      for (const k of Array.from(c.children)) ro.observe(k);
    }
    let live = true;
    document.fonts?.ready.then(() => live && measureRef.current());
    return () => {
      live = false;
      ro.disconnect();
    };
  }, [n]);
  return (
    <div
      ref={rootRef}
      id={id}
      role="radiogroup"
      aria-label={label}
      tabIndex={0}
      {...scopeAttrs({ material, density })}
      onKeyDown={onKeyDown}
      className={cx('ar-well ar-segmented', className)}
      style={{ '--_i': idx, '--_n': n, ...style } as CSSProperties}
    >
      <span className="ar-insert ar-segmented__insert" />
      <div ref={rowRef} className="ar-segmented__row">
        {opts.map((o, i) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={i === idx}
            aria-label={o.title}
            tabIndex={-1}
            title={o.title}
            disabled={o.disabled}
            onClick={() => pick(o.value)}
            onPointerEnter={(e) => revealClipped(e.currentTarget, e.currentTarget.querySelector<HTMLElement>('.ar-text'))}
            className="ar-segmented__opt"
            data-on={i === idx ? '' : undefined}
          >
            {o.icon ? <span className="ar-icon">{o.icon}</span> : null}
            {o.label != null ? <span className={cx('ar-text', i === idx && 'ar-text--over')}>{o.label}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
