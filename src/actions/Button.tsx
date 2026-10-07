import type { ButtonHTMLAttributes, ReactNode } from 'react';

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

/** Button — a labelled action: the family's insert in its well. `primary` lights the LED and is
 *  the one main action in a view; `danger` lights it in the fault colour; `ghost` is bare text. */
export function Button({ variant = 'default', size = 'md', icon, trailing, block = false, className, children, type = 'button', ...rest }: ButtonProps) {
  const ghost = variant === 'ghost';
  const led = variant === 'primary' || variant === 'danger';
  return (
    <button
      type={type}
      className={`${ghost ? '' : 'ar-well '}ar-button${className ? ` ${className}` : ''}`}
      data-variant={variant === 'default' ? undefined : variant}
      data-size={size === 'sm' ? 'sm' : undefined}
      data-block={block || undefined}
      {...rest}
    >
      <span className={ghost ? 'ar-button__face' : 'ar-insert ar-button__face'}>
        {led && <i className="ar-led" data-on="" />}
        {icon && <span className="ar-button__icon">{icon}</span>}
        {children != null && <span className={ghost ? 'ar-text ar-button__label' : 'ar-text ar-text--over ar-button__label'}>{children}</span>}
        {trailing && <span className="ar-button__trailing">{trailing}</span>}
      </span>
    </button>
  );
}
