'use client';
import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../core/utils';

/* ARTINOS ItemRow — one thing in a list: a layer, a body, a preset, a file. A leading mark
   (a colour swatch or an icon), a name, a quiet line of detail under it, and trailing tools
   (a badge, a switch, a menu) that stay outside the row's own button. Selected, it takes the
   active wash and the signal edge on its left. */

export interface ItemRowProps {
  /** The name, in the sans. */
  title: ReactNode;
  /** A quiet second line: what it is, its size, its state. Truncates. */
  meta?: ReactNode;
  /** A colour drawn as a round swatch before the name. */
  swatch?: string;
  /** Any leading mark instead of a swatch: an icon, a thumbnail. */
  leading?: ReactNode;
  /** Tools at the end of the row: a Badge, a Switch, an IconButton or Menu. Clicks here never select the row. */
  trailing?: ReactNode;
  selected?: boolean;
  /** Makes the row a button: it selects on click, Enter or Space. */
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

export interface ItemListProps {
  /** The list's accessible name, e.g. "Layers". */
  label?: string;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** The list ItemRows stand in: a column with no dividers and a 2px gap. */
export function ItemList({ label, children, className, style }: ItemListProps) {
  return (
    <div role="list" aria-label={label} className={cx('ar-items', className)} style={style}>
      {children}
    </div>
  );
}

export function ItemRow({ title, meta, swatch, leading, trailing, selected = false, onSelect, disabled, className, style, id }: ItemRowProps) {
  const lead = leading ?? (swatch ? <i className="ar-item__swatch" style={{ background: swatch }} /> : null);
  const body = (
    <>
      {lead ? <span className="ar-item__lead">{lead}</span> : null}
      <span className="ar-item__text">
        <span className="ar-item__title">{title}</span>
        {meta != null ? <span className="ar-item__meta">{meta}</span> : null}
      </span>
    </>
  );
  return (
    <div
      id={id}
      role="listitem"
      className={cx('ar-item', className)}
      data-selected={selected ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      style={style}
    >
      {onSelect ? (
        <button type="button" className="ar-item__main" aria-pressed={selected} disabled={disabled} onClick={onSelect}>
          {body}
        </button>
      ) : (
        <span className="ar-item__main">{body}</span>
      )}
      {trailing ? <span className="ar-item__trail">{trailing}</span> : null}
    </div>
  );
}
