import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../core/utils';

/* ARTINOS Callout — a note set apart from the text around it: an icon and a soft fill in its tone,
   a title and a few lines. note is neutral, tip in the signal, warn and fault in theirs. Use it for
   what a reader must not miss, sparingly. */

export type CalloutTone = 'note' | 'tip' | 'warn' | 'fault';

export interface CalloutProps {
  /** note (default, neutral) · tip (the signal) · warn · fault. */
  tone?: CalloutTone;
  /** A short title in the ink, above the text. */
  title?: ReactNode;
  /** Replaces the tone's own icon; `null` leaves it out. */
  icon?: ReactNode | null;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

const path = (d: string) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const ICONS: Record<CalloutTone, ReactNode> = {
  note: path('M8 14.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM8 7.4v3.8M8 5.1v.1'),
  tip: path('M6 12.5h4M6.6 14.5h2.8M8 1.5a4.5 4.5 0 00-2.6 8.2c.4.3.6.7.6 1.2v.6h4v-.6c0-.5.2-.9.6-1.2A4.5 4.5 0 008 1.5z'),
  warn: path('M8 1.8l6.5 11.7h-13zM8 6.4v3.4M8 11.6v.1'),
  fault: path('M8 14.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM5.8 5.8l4.4 4.4M10.2 5.8l-4.4 4.4'),
};

export function Callout({ tone = 'note', title, icon, children, className, style, id }: CalloutProps) {
  const mark = icon === undefined ? ICONS[tone] : icon;
  return (
    <aside id={id} className={cx('ar-callout', className)} data-tone={tone} role={tone === 'fault' || tone === 'warn' ? 'alert' : 'note'} style={style}>
      {mark ? <span className="ar-callout__icon">{mark}</span> : null}
      <div className="ar-callout__body">
        {title != null ? <p className="ar-callout__title">{title}</p> : null}
        {children != null ? <div className="ar-callout__text">{children}</div> : null}
      </div>
    </aside>
  );
}
