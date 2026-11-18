'use client';
import type { CSSProperties } from 'react';
import { NumberField } from '../controls/NumberField';
import { useControllable } from '../core/hooks';
import type { Signal } from '../core/signal';
import { cx } from '../core/utils';
import type { Format, ScopeProps } from '../core/utils';
import { AXES, type Vec3 } from './math';

export interface Vector3FieldProps extends ScopeProps {
  /** The value itself: read and written here. Takes the place of `value`. */
  signal?: Signal<Vec3>;
  /** [x, y, z] */
  value?: Vec3;
  /** Where it starts when nothing else holds the value. Default: [0, 0, 0]. */
  defaultValue?: Vec3;
  onChange?: (value: Vec3) => void;
  onCommit?: (value: Vec3) => void;
  /** Names the group for assistive tech: "Position", "Scale"… */
  label: string;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  format?: Format;
  unit?: string;
  /** Keep the three in proportion: changing one scales the others with it (a uniform scale). */
  linked?: boolean;
  /** Given, a link button is shown at the end of the row. */
  onLinkedChange?: (linked: boolean) => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Vector3Field — X · Y · Z in one row, each a NumberField in its axis colour: scrub sideways,
 * click to type, arrows or the wheel to step. `linked` keeps the three in proportion.
 */
export function Vector3Field({ signal, value: valueProp, defaultValue, onChange, onCommit, label, min, max, step = 0.1, decimals = 2, format, unit, linked, onLinkedChange, disabled, material, density, className, style }: Vector3FieldProps) {
  const [value, setValue] = useControllable<Vec3>(valueProp, defaultValue ?? [0, 0, 0], onChange, signal);
  const next = (i: number, n: number): Vec3 => {
    const out: Vec3 = [...value];
    if (linked) {
      const from = value[i];
      for (let k = 0; k < 3; k++) out[k] = from ? Number(((value[k] * n) / from).toFixed(6)) : n;
    }
    out[i] = n;
    return out;
  };
  return (
    <div className={cx('ar-vec3', className)} style={style} role="group" aria-label={label} data-linked={linked || undefined}>
      {AXES.map((axis, i) => (
        <NumberField
          key={axis}
          className={`ar-vec3__cell ar-vec3__cell--${axis}`}
          label={axis.toUpperCase()}
          aria-label={`${label} ${axis.toUpperCase()}`}
          value={value[i]}
          onChange={(n) => setValue(next(i, n))}
          onCommit={onCommit ? (n) => onCommit(next(i, n)) : undefined}
          {...{ min, max, step, decimals, format, unit, disabled, material, density }}
          align="end"
        />
      ))}
      {onLinkedChange ? (
        <button type="button" className="ar-tool ar-vec3__link" aria-pressed={!!linked} aria-label={`Link ${label} axes`} title="Keep in proportion" disabled={disabled} onClick={() => onLinkedChange(!linked)}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
            {linked ? <path d="M6.5 9.5l3-3M7 4.6l1-1a2.6 2.6 0 0 1 3.7 3.7l-1 1M9 11.4l-1 1a2.6 2.6 0 0 1-3.7-3.7l1-1" /> : <path d="M7 4.6l1-1a2.6 2.6 0 0 1 3.7 3.7l-1 1M9 11.4l-1 1a2.6 2.6 0 0 1-3.7-3.7l1-1M3 3l10 10" />}
          </svg>
        </button>
      ) : null}
    </div>
  );
}
