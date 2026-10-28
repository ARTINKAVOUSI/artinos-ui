'use client';
import type { CSSProperties, ReactNode } from 'react';
import { useControllable } from '../core/hooks';
import { cx, normalizeOptions, revealClipped, scopeAttrs } from '../core/utils';
import type { OptionInput, ScopeProps } from '../core/utils';

/* ARTINOS ChipGroup — a wrapping set of choices: moods, tags, categories, filters. Off, a chip
   is a pill recessed in the well with a dark LED; on, it is the family's polished insert with
   its LED lit — the same language as a ToggleGroup's chips. Many can be on at once,
   or one with `multiple={false}` (which can also be emptied). A count rolls in the mono after
   the label. */

export type ChipOption<V extends string = string> = OptionInput<V> | { value: V; label?: ReactNode; icon?: ReactNode; title?: string; disabled?: boolean; count?: number };

export interface ChipGroupProps<V extends string = string> extends ScopeProps {
  /** The group's accessible name, e.g. "Mood". */
  label?: string;
  options: readonly ChipOption<V>[];
  value?: V[];
  defaultValue?: V[];
  onChange?: (value: V[]) => void;
  /** Default true: chips switch independently. False: picking one clears the others. */
  multiple?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

export function ChipGroup<V extends string = string>({ label, options, value, defaultValue = [], onChange, multiple = true, material, density, className, style, id }: ChipGroupProps<V>) {
  const [sel, setSel] = useControllable<V[]>(value, defaultValue, onChange);
  const counts = new Map(options.flatMap((o) => (typeof o === 'object' && 'count' in o && o.count != null ? [[o.value, o.count] as const] : [])));
  const opts = normalizeOptions(options as readonly OptionInput<V>[]);
  const flip = (v: V) => {
    const has = sel.includes(v);
    setSel(multiple ? (has ? sel.filter((x) => x !== v) : [...sel, v]) : has ? [] : [v]);
  };
  return (
    <div id={id} role="group" aria-label={label} {...scopeAttrs({ material, density })} className={cx('ar-chips', className)} style={style}>
      {opts.map((o) => {
        const on = sel.includes(o.value);
        const count = counts.get(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            title={o.title}
            disabled={o.disabled}
            onClick={() => flip(o.value)}
            onPointerEnter={(e) => revealClipped(e.currentTarget, e.currentTarget.querySelector<HTMLElement>('.ar-text'))}
            className={cx('ar-chip', on && 'ar-insert')}
            data-on={on ? '' : undefined}
          >
            {o.icon ? <span className="ar-icon">{o.icon}</span> : <i className="ar-led ar-chip__led" data-on={on ? '' : undefined} />}
            {o.label != null ? <span className={cx('ar-text', on && 'ar-text--over')}>{o.label}</span> : null}
            {count != null ? <span className="ar-value ar-chip__count">{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
