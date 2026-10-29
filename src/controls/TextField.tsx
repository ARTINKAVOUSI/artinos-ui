'use client';
import { forwardRef, type InputHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { useField } from '../core/field';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement & HTMLTextAreaElement>, 'onChange' | 'onKeyDown' | 'size' | 'value'> {
  value: string;
  /** A key on the field: the event is the input's, or the textarea's when `multiline`. */
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onChange: (value: string) => void;
  /** Accessible name when no visible label is associated (a Field's label is associated for you). */
  label?: string;
  /** Leading icon. `type="search"` gets a magnifier by default. */
  icon?: ReactNode;
  /** Shows a clear button while there is text. On by default for search. */
  clearable?: boolean;
  size?: 'md' | 'sm';
  /** The fault ring. Inside a Field with an `error`, it is set for you. */
  invalid?: boolean;
  /** Several lines: a textarea that starts at `rows` lines and grows with what is typed. */
  multiline?: boolean;
  rows?: number;
}

const SearchIcon = (
  <svg viewBox="0 0 16 16" aria-hidden>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" />
  </svg>
);

/** TextField — text cut into the well; `type="search"` makes it a search box (Escape clears it),
 *  `multiline` a growing textarea. Inside a Field it takes the label, message and invalid state. */
export const TextField = forwardRef<HTMLInputElement & HTMLTextAreaElement, TextFieldProps>(function TextField(
  { value, onChange, label, icon, clearable, size = 'md', type = 'text', invalid, multiline = false, rows = 3, className, onKeyDown, id, required, ...rest },
  ref,
) {
  const field = useField();
  const search = type === 'search' && !multiline;
  const leading = icon ?? (search ? SearchIcon : null);
  const showClear = (clearable ?? search) && value.length > 0;
  const bad = invalid ?? field.invalid ?? false;
  const shared = {
    id: id ?? field.controlId,
    'aria-label': label,
    'aria-invalid': bad || undefined,
    'aria-describedby': field.describedBy,
    required: required ?? field.required,
    value,
  };
  return (
    <span
      className={className ? `ar-well ar-textfield ${className}` : 'ar-well ar-textfield'}
      data-size={size === 'sm' ? 'sm' : undefined}
      data-invalid={bad ? '' : undefined}
      data-multiline={multiline ? '' : undefined}
    >
      {leading && <span className="ar-textfield__icon">{leading}</span>}
      {multiline ? (
        <textarea
          ref={ref}
          rows={rows}
          {...shared}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          {...rest}
        />
      ) : (
        <input
          ref={ref}
          type={search ? 'text' : type}
          role={search ? 'searchbox' : undefined}
          {...shared}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (search && event.key === 'Escape' && value) {
              event.stopPropagation();
              onChange('');
            }
            onKeyDown?.(event);
          }}
          {...rest}
        />
      )}
      {showClear && (
        <button type="button" className="ar-tool ar-textfield__clear" aria-label="Clear" onClick={() => onChange('')}>
          <svg viewBox="0 0 10 10" aria-hidden>
            <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
          </svg>
        </button>
      )}
    </span>
  );
});
