import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Required: the accessible name, also shown as the tooltip. */
  label: string;
  icon: ReactNode;
  /** Pressed/selected look, for toggles in a toolbar. */
  active?: boolean;
  size?: 'md' | 'sm';
  /** Draw a body behind the icon at rest. */
  filled?: boolean;
  /** Show the label beside the icon: always, or only while `active` — a tool strip names the
   *  current tool and keeps the others as icons. */
  labelled?: boolean | 'active';
}

/** IconButton — a square, icon-only action with an accessible name; `labelled` adds its name. */
export function IconButton({ label, icon, active, size = 'md', filled = false, labelled = false, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={className ? `ar-icon-button ${className}` : 'ar-icon-button'}
      data-size={size === 'sm' ? 'sm' : undefined}
      data-filled={filled || undefined}
      data-labelled={labelled === 'active' ? 'active' : labelled ? 'always' : undefined}
      {...rest}
    >
      {icon}
      {labelled ? (
        <span className="ar-text ar-icon-button__label" aria-hidden="true">
          {label}
        </span>
      ) : null}
    </button>
  );
}
