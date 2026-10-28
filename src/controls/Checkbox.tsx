'use client';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useControllable } from '../core/hooks';
import { cx, scopeAttrs } from '../core/utils';
import type { ScopeProps } from '../core/utils';

/* ARTINOS Checkbox — a choice in a form or a list: "Include textures", "I have read…". A small
   box cut into the well; checked, it fills with the insert and the check draws itself in; mixed
   (some of a group) shows a dash. The label sits beside it in the sans, with an optional quieter
   line under it. For a setting that applies at once, prefer a Switch. */

export interface CheckboxProps extends ScopeProps {
  label?: ReactNode;
  /** A quieter second line under the label. */
  description?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  /** Some, not all, of a group: a dash instead of the check. */
  indeterminate?: boolean;
  disabled?: boolean;
  /** Accessible name when there is no visible label. */
  'aria-label'?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

export function Checkbox({ label, description, checked, defaultChecked = false, onChange, indeterminate = false, disabled, material, density, id, className, style, ...rest }: CheckboxProps) {
  const [on, setOn] = useControllable(checked, defaultChecked, onChange);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (input.current) input.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const state = indeterminate ? 'mixed' : on ? 'on' : 'off';
  return (
    <label className={cx('ar-checkbox', className)} {...scopeAttrs({ material, density })} data-disabled={disabled ? '' : undefined} style={style}>
      <input ref={input} id={id} type="checkbox" className="ar-checkbox__input" checked={on} disabled={disabled} aria-label={rest['aria-label']} onChange={(e) => setOn(e.target.checked)} />
      <span className={cx('ar-checkbox__box', state !== 'off' && 'ar-insert')} data-state={state} aria-hidden="true">
        <svg viewBox="0 0 12 12">
          {state === 'mixed' ? <path className="ar-checkbox__mark" d="M3 6h6" pathLength={1} /> : <path className="ar-checkbox__mark" d="M2.6 6.3l2.2 2.2 4.6-4.9" pathLength={1} />}
        </svg>
      </span>
      {label != null || description != null ? (
        <span className="ar-checkbox__text">
          {label != null ? <span className="ar-checkbox__label">{label}</span> : null}
          {description != null ? <span className="ar-checkbox__description">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}
