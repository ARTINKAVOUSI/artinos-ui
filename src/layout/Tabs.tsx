'use client';
import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { useControllable } from '../core/hooks';
import { cx, normalizeOptions } from '../core/utils';
import type { OptionInput } from '../core/utils';

/* ARTINOS Tabs — switch between the views of one place. Renders the tablist only; render the
   active view yourself from `value`.

     orientation  horizontal (a strip) · vertical (a rail down the side)
     variant      line: quiet words over a travelling bar (default)
                  pill: the current tab on a soft wash that travels
                  icon: icons alone, each named by its tooltip (a tool rail)

   A tab can carry a `count` (how many things are in it) or a `dot` (something needs a look), and
   with `onClose` every tab gets a close button (open documents, views). Arrow keys follow the
   orientation; Home and End jump to the ends; Delete closes the focused tab when it can close. */

export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsVariant = 'line' | 'pill' | 'icon';

/** A tab: a plain value, or `{ value, label?, icon?, title?, disabled?, count?, dot? }`. */
export type TabItem<V extends string = string> = OptionInput<V> | (Exclude<OptionInput<V>, string> & { count?: ReactNode; dot?: boolean });

export interface TabsProps<V extends string = string> {
  items: readonly TabItem<V>[];
  value?: V;
  defaultValue?: V;
  onChange?: (value: V) => void;
  /** horizontal (default) or vertical. A Panel with `tabsPlacement="side"` makes its tabs vertical. */
  orientation?: TabsOrientation;
  /** line (default) · pill · icon. */
  variant?: TabsVariant;
  /** Horizontal: the tabs share the width equally. */
  fill?: boolean;
  /** Each tab gets a close button; Delete closes the focused tab. */
  onClose?: (value: V) => void;
  /** Accessible name of the tab list. */
  label?: string;
  /** Prefix for tab / panel ids: tab `${idBase}-tab-${value}`, panel `${idBase}-panel-${value}`. */
  idBase?: string;
  className?: string;
  style?: CSSProperties;
}

/** What a surrounding part asks of the tabs inside it, e.g. a Panel with its tabs down the side. */
export const TabsDefaults = createContext<{ orientation?: TabsOrientation; variant?: TabsVariant }>({});

const Close = () => (
  <svg viewBox="0 0 10 10" aria-hidden="true">
    <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

export function Tabs<V extends string = string>({ items, value, defaultValue, onChange, orientation, variant, fill = false, onClose, label, idBase, className, style }: TabsProps<V>) {
  const defaults = useContext(TabsDefaults);
  const dir: TabsOrientation = orientation ?? defaults.orientation ?? 'horizontal';
  const look: TabsVariant = variant ?? defaults.variant ?? 'line';
  const vertical = dir === 'vertical';
  const opts = normalizeOptions(items as readonly OptionInput<V>[]);
  const extra = items.map((it) => (typeof it === 'string' ? {} : (it as { count?: ReactNode; dot?: boolean })));
  const [cur, pick] = useControllable<V>(value, defaultValue ?? opts[0]?.value, onChange);
  const refs = useRef<Array<HTMLElement | null>>([]);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const [bar, setBar] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const idx = Math.max(0, opts.findIndex((o) => o.value === cur));

  // the marker (the line's bar, the pill's wash) travels to the current tab
  useLayoutEffect(() => {
    const el = refs.current[idx];
    if (!el) return;
    const place = () => setBar({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
    place();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(place);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [idx, opts.length, dir, look]);

  const onKeyDown = (e: ReactKeyboardEvent) => {
    const n = opts.length;
    if (onClose && (e.key === 'Delete' || e.key === 'Backspace') && (e.target as HTMLElement).getAttribute('role') === 'tab') {
      const i = buttons.current.indexOf(e.target as HTMLButtonElement);
      if (i >= 0 && !opts[i].disabled) {
        e.preventDefault();
        onClose(opts[i].value);
      }
      return;
    }
    const next = vertical ? 'ArrowDown' : 'ArrowRight';
    const prev = vertical ? 'ArrowUp' : 'ArrowLeft';
    const step = e.key === next || e.key === 'Home' ? 1 : e.key === prev || e.key === 'End' ? -1 : 0;
    if (!step || !n) return;
    e.preventDefault();
    // Disabled tabs are skipped, wrapping round: Home lands on the first enabled tab, End on the last.
    const wrap = (i: number) => ((i % n) + n) % n;
    let j = wrap(e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : idx + step);
    for (let k = 1; k < n && opts[j].disabled; k++) j = wrap(j + step);
    if (opts[j].disabled) return;
    pick(opts[j].value);
    buttons.current[j]?.focus();
  };

  const marker = bar
    ? look === 'line'
      ? vertical
        ? { transform: `translateY(${bar.y}px)`, height: bar.h }
        : { transform: `translateX(${bar.x}px)`, width: bar.w }
      : { transform: `translate(${bar.x}px, ${bar.y}px)`, width: bar.w, height: bar.h }
    : null;

  return (
    <div
      role="tablist"
      aria-label={label}
      aria-orientation={dir}
      className={cx('ar-tabs', className)}
      data-orientation={dir}
      data-variant={look}
      data-fill={fill && !vertical ? '' : undefined}
      style={style}
      onKeyDown={onKeyDown}
    >
      {marker ? <i className="ar-tabs__bar" style={marker} aria-hidden="true" /> : null}
      {opts.map((o, i) => {
        const { count, dot } = extra[i];
        const selected = i === idx;
        const name = typeof o.label === 'string' ? o.label : o.title ?? o.value;
        const tab = (
          <button
            ref={(el) => {
              buttons.current[i] = el;
              if (!onClose) refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={idBase ? `${idBase}-tab-${o.value}` : undefined}
            aria-controls={idBase ? `${idBase}-panel-${o.value}` : undefined}
            aria-selected={selected}
            aria-label={look === 'icon' ? name : undefined}
            tabIndex={selected ? 0 : -1}
            disabled={o.disabled}
            title={o.title ?? (look === 'icon' ? name : undefined)}
            onClick={() => pick(o.value)}
            className="ar-tabs__tab"
            key={onClose ? undefined : o.value}
          >
            {o.icon ? <span className="ar-tabs__icon">{o.icon}</span> : null}
            {look === 'icon' && o.icon ? null : <span className="ar-tabs__label">{o.label}</span>}
            {count != null && look !== 'icon' ? <span className="ar-tabs__count">{count}</span> : null}
            {dot ? <i className="ar-tabs__dot" aria-label="needs attention" role="img" /> : null}
          </button>
        );
        return onClose ? (
          <span
            key={o.value}
            className="ar-tabs__item"
            data-selected={selected ? '' : undefined}
            ref={(el) => {
              refs.current[i] = el;
            }}
          >
            {tab}
            <button type="button" className="ar-tabs__close" tabIndex={-1} aria-label={`Close ${name}`} disabled={o.disabled} onClick={() => onClose(o.value)}>
              <Close />
            </button>
          </span>
        ) : (
          tab
        );
      })}
    </div>
  );
}
