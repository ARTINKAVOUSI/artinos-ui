'use client';
import type { ReactNode } from 'react';

export type PropertyDensity = 'default' | 'compact' | 'multiline';

export interface PropertyRowProps {
  label: string;
  /** The control. In `default` density it names itself (a slider capsule), so the row label is hidden. */
  children: ReactNode;
  /** Names the driver when the value is externally controlled. */
  binding?: string;
  status?: 'bound' | 'warn' | 'fault';
  /** Explains a fault in words, never colour alone. */
  message?: string;
  /** The value differs from its default: a quiet dot in the left gutter, no width taken. */
  modified?: boolean;
  /** Reset to the default. The modified dot becomes the reset under the pointer or keyboard focus,
   *  in the same gutter spot, so the control keeps its full width and rows stay aligned. */
  onReset?: () => void;
  /** Right-hand affordances, shown on hover or focus. */
  actions?: ReactNode;
  /** `compact` shows the label in a column beside the control. */
  density?: PropertyDensity;
  /** Marks the row as the target of a search reveal. */
  highlighted?: boolean;
  /** Written as `data-control`, so a search result can find and scroll to this row. */
  dataControl?: string;
  disabled?: boolean;
}

/**
 * PropertyRow — the Inspector's structural row: label, control, reset and
 * actions in one consistent arrangement. The row never owns the value.
 */
export function PropertyRow({
  label,
  children,
  binding,
  status,
  message,
  modified = false,
  onReset,
  actions,
  density = 'default',
  highlighted = false,
  dataControl,
  disabled = false,
}: PropertyRowProps) {
  return (
    <div
      className="ar-prop"
      data-density={density}
      data-state={status}
      data-control={dataControl}
      data-highlighted={highlighted || undefined}
      data-modified={modified || undefined}
      data-disabled={disabled || undefined}
    >
      <div className="ar-prop__main">
        {modified ? (
          onReset ? (
            <button type="button" className="ar-prop__mark" onClick={onReset} aria-label={`Reset ${label}`} title="Reset to default">
              <i className="ar-prop__dot" />
              <svg viewBox="0 0 12 12" aria-hidden>
                <path d="M2.6 4.4A3.8 3.8 0 1 1 2.2 7" />
                <path d="M2.4 1.8v2.7h2.7" />
              </svg>
            </button>
          ) : (
            <span className="ar-prop__mark" aria-hidden>
              <i className="ar-prop__dot" />
            </span>
          )
        ) : null}
        <span className="ar-prop__label" title={label}>
          {label}
          {binding && <em className="ar-prop__binding">{binding}</em>}
        </span>
        <div className="ar-prop__control">{children}</div>
        {actions ? <div className="ar-prop__actions">{actions}</div> : null}
      </div>
      {message && <p className="ar-prop__message">{message}</p>}
    </div>
  );
}

