import type { ReactNode } from 'react';

export interface TagProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

/** Tag — a small fact beside a value: `visit 8`, `poke 2`, one word of a list. Quiet and neutral, it
 *  says nothing about state; for a status with an LED, use Badge. */
export function Tag({ children, className, title }: TagProps) {
  return (
    <span className={className ? `ar-tag ${className}` : 'ar-tag'} title={title}>
      {children}
    </span>
  );
}
