'use client';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { revealClipped } from '../core/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  /** Leading icon. */
  icon?: ReactNode;
  /** Right-aligned hint, e.g. a shortcut. */
  trailing?: ReactNode;
  /** Stretch to the container width. */
  block?: boolean;
}

/** Button — a labelled action, in three weights. `primary` is the family's polished insert in its
 *  well with a lit LED: the one main action in a view (`danger` lights it in the fault colour).
 *  `default` is a quiet raised face with a hairline, for every other action. `ghost` is bare text.
 *  A label cut by an ellipsis shows in full as the tooltip. */
export function Button({ variant = 'default', size = 'md', icon, trailing, block = false, className, children, type = 'button', onPointerEnter, ...rest }: ButtonProps) {
  const ghost = variant === 'ghost';
  const raised = variant === 'primary' || variant === 'danger';
  return (
    <button
      type={type}
      className={`${raised ? 'ar-well ' : ''}ar-button${className ? ` ${className}` : ''}`}
      data-variant={variant === 'default' ? undefined : variant}
      data-size={size === 'sm' ? 'sm' : undefined}
      data-block={block || undefined}
      {...rest}
      onPointerEnter={(e) => {
        revealClipped(e.currentTarget, e.currentTarget.querySelector<HTMLElement>('.ar-button__label'));
        onPointerEnter?.(e);
      }}
    >
      <span className={raised ? 'ar-insert ar-button__face' : 'ar-button__face'}>
        {raised && <i className="ar-led" data-on="" />}
        {icon && <span className="ar-button__icon">{icon}</span>}
        {children != null && <span className={raised ? 'ar-text ar-text--over ar-button__label' : 'ar-text ar-button__label'}>{children}</span>}
        {trailing && <span className="ar-button__trailing">{trailing}</span>}
      </span>
    </button>
  );
}
