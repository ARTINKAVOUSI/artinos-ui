import type { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  tone?: 'neutral' | 'live' | 'warm' | 'danger';
  /** Live: the LED breathes. (Every toned badge carries its LED; a neutral one only with dot.) */
  dot?: boolean;
  className?: string;
  title?: string;
}

/** Badge — a small status plate: a recessed well with an LED in the state's colour and calm text. */
export function Badge({ children, tone = 'neutral', dot = false, className, title }: BadgeProps) {
  return (
    <span className={className ? `ar-badge ${className}` : 'ar-badge'} data-tone={tone} data-live={dot ? '' : undefined} title={title}>
      {dot || tone !== 'neutral' ? <span className="ar-badge__dot" aria-hidden /> : null}
      {children}
    </span>
  );
}

