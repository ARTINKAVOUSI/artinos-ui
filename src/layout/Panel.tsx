'use client';
import { useEffect, useId, useRef } from 'react';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useControllable } from '../core/hooks';
import { RollingText } from '../core/RollingValue';
import { cx } from '../core/utils';

/* ARTINOS layout — the frames controls live in.
 *   Panel    frosted card: header (title · subtitle · actions), body, foot status line
 *   Section  titled group with a hairline and an optional count; collapsible
 *   Field    property row: label column + control(s) — the "Width [268] [Fixed ˅]" form
 */

export interface PanelProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Right side of the header: icon buttons, status dot… */
  actions?: ReactNode;
  /** Slot between header and body, e.g. <Tabs>. */
  tabs?: ReactNode;
  /** Foot status line. */
  footer?: ReactNode;
  children?: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

export function Panel({ title, subtitle, actions, tabs, footer, children, as = 'section', className, style, id }: PanelProps) {
  // Narrowed for JSX: hosts that augment JSX.IntrinsicElements (React Three Fiber) make
  // the full ElementType union too large for TypeScript to call. Any tag renders the same.
  const Tag = as as 'section';
  return (
    <Tag id={id} className={cx('ar-panel', className)} style={style}>
      {title || subtitle || actions ? (
        <header className="ar-panel__head">
          <div className="ar-panel__titles">
            {title ? <div className="ar-panel__title">{title}</div> : null}
            {subtitle ? <div className="ar-panel__subtitle">{subtitle}</div> : null}
          </div>
          {actions ? <div className="ar-panel__actions">{actions}</div> : null}
        </header>
      ) : null}
      {tabs ? <div className="ar-panel__tabs">{tabs}</div> : null}
      <div className="ar-panel__body">{children}</div>
      {footer ? <footer className="ar-panel__foot">{footer}</footer> : null}
    </Tag>
  );
}

export interface SectionProps {
  title: ReactNode;
  /** Quiet info at the end of the rule, before any actions and the chevron: a count (numbers roll)
   *  or a short note such as "1 changed · 3". Clicking it folds the group like the title. */
  count?: ReactNode;
  /** Slim things that belong to the group, in the title row after the count: a status Badge, a tool. */
  actions?: ReactNode;
  /** The group's on/off, carried by the title row's rule (a plain 1px hairline): the line ink when
   *  on, the subtle line ink when off. One click on the title or rule folds the group open or
   *  closed; a double-click (or Shift+Enter) switches it on or off. Off folds it closed and makes it
   *  inert; values are kept, and on restores the fold it had. The chevron always shows. */
  enabled?: boolean;
  defaultEnabled?: boolean;
  onEnabledChange?: (on: boolean) => void;
  collapsible?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** caps: mono uppercase (dock panels) · text: UI font (inspector) */
  heading?: 'caps' | 'text';
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Section({
  title,
  count,
  actions,
  enabled,
  defaultEnabled,
  onEnabledChange,
  collapsible = false,
  open,
  defaultOpen = true,
  onOpenChange,
  heading = 'caps',
  children,
  className,
  style,
}: SectionProps) {
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const toggleable = enabled !== undefined || defaultEnabled !== undefined;
  const [isOn, setOn] = useControllable(enabled, defaultEnabled ?? true, onEnabledChange);
  // a switchable group always shows its chevron, so it can always be folded too
  const foldable = collapsible || toggleable;
  const bodyId = useId();
  const off = toggleable && !isOn;
  // switching the group off folds it closed, like collapsing it; on, it unfolds to where it was
  const shown = (!foldable || isOpen) && !off;
  const titleId = useId();
  const hintId = useId();
  // On a switchable group a click waits a moment for a possible second click: a double-click
  // switches the group, a single click folds it. Plain collapsible groups fold at once.
  const pending = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(pending.current), []);
  const onTriggerClick = (event: { detail: number; shiftKey: boolean }) => {
    if (!toggleable) return setOpen(!isOpen);
    clearTimeout(pending.current);
    if (event.detail === 0) {
      // the keyboard: Enter / Space fold, Shift+Enter switches
      if (event.shiftKey) setOn(!isOn);
      else if (!off) setOpen(!isOpen);
      return;
    }
    if (event.detail >= 2) return setOn(!isOn);
    if (off) return;
    pending.current = setTimeout(() => setOpen(!isOpen), 220);
  };
  const titleText = (
    <span className="ar-section__title" id={titleId}>
      {title}
    </span>
  );
  const rest = (
    <>
      {/* the rule carries the on/off: the line ink when on, the subtle line ink when off */}
      <i className="ar-section__rule" />
      {count != null ? (
        <span className="ar-section__count">{typeof count === 'number' || typeof count === 'string' ? <RollingText text={String(count)} base={0} /> : count}</span>
      ) : null}
    </>
  );
  return (
    <div
      className={cx('ar-section', className)}
      data-heading={heading}
      data-open={shown ? '' : undefined}
      data-off={off ? '' : undefined}
      data-switchable={toggleable ? '' : undefined}
      style={style}
    >
      <div className="ar-section__head">
        {foldable ? (
          <button
            type="button"
            className="ar-section__trigger"
            aria-expanded={shown}
            aria-controls={bodyId}
            aria-describedby={toggleable ? hintId : undefined}
            onClick={onTriggerClick}
          >
            {titleText}
            {rest}
            {toggleable ? (
              <span className="ar-sr" id={hintId}>
                {isOn ? 'On' : 'Off'}. Double-click or Shift+Enter to switch {isOn ? 'off' : 'on'}.
              </span>
            ) : null}
          </button>
        ) : (
          <span className="ar-section__trigger">
            {titleText}
            {rest}
          </span>
        )}
        {actions ? <span className="ar-section__actions">{actions}</span> : null}
        {foldable ? (
          // the chevron mirrors the title; switched off, it stays and points closed
          <button type="button" className="ar-section__chevron" tabIndex={-1} aria-hidden="true" disabled={off} onClick={() => setOpen(!isOpen)}>
            <svg className="ar-chevron" data-up={shown ? '' : undefined} viewBox="0 0 10 6" aria-hidden="true">
              <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </div>
      <div className="ar-section__fold" id={bodyId} inert={!shown || undefined}>
        <div className="ar-section__body">{children}</div>
      </div>
    </div>
  );
}

export interface FieldProps {
  label: ReactNode;
  children?: ReactNode;
  /** Label column width. Default 72px (token --ar-field-label-w). */
  labelWidth?: number | string;
  className?: string;
  style?: CSSProperties;
}

export function Field({ label, children, labelWidth, className, style }: FieldProps) {
  const lw = labelWidth === undefined ? undefined : typeof labelWidth === 'number' ? labelWidth + 'px' : labelWidth;
  return (
    <div className={cx('ar-field', className)} style={{ ...(lw ? ({ '--ar-field-label-w': lw } as CSSProperties) : null), ...style }}>
      <span className="ar-field__label">{label}</span>
      <div className="ar-field__control">{children}</div>
    </div>
  );
}
