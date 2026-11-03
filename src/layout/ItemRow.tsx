'use client';
import { useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { useSortable } from '../core/sortable';
import type { SortPlace } from '../core/sortable';
import { cx, revealClipped } from '../core/utils';

/* ARTINOS ItemRow — one thing in a list: a layer, a body, a preset, a file. A leading mark
   (a colour swatch or an icon), a name, a quiet line of detail under it, and trailing tools
   (a badge, a switch, a menu) that stay outside the row's own button. Selected, it takes the
   active wash. */

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
  /** Drag rows to reorder (Alt+↑/↓ for the keyboard): onReorder(from, to) with indices. */
  onReorder?: (from: number, to: number) => void;
  /** Lists that share a group trade rows by drag: onMove({ list, index }, { list, index }). Give each an id. */
  group?: string;
  id?: string;
  onMove?: (from: SortPlace, to: SortPlace) => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** The list ItemRows stand in: a column with no dividers and a 2px gap; rows can be dragged to
 *  reorder, or to another list of the same group. */
export function ItemList({ label, onReorder, group, id, onMove, children, className, style }: ItemListProps) {
  const ref = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const listId = id ?? autoId;
  const sortable = !!(onReorder || onMove);
  useSortable(ref, {
    id: listId,
    group,
    itemSelector: '.ar-item',
    enabled: sortable,
    onMove: (from, to) => (onMove ? onMove(from, to) : from.list === to.list && onReorder?.(from.index, to.index)),
  });
  return (
    <div ref={ref} id={id} role="list" aria-label={label} className={cx('ar-items', className)} data-sortable={sortable ? '' : undefined} style={style}>
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
      onPointerEnter={(e) => {
        const host = e.currentTarget;
        const title = host.querySelector<HTMLElement>('.ar-item__title');
        const meta = host.querySelector<HTMLElement>('.ar-item__meta');
        // either line cut short: the row's tooltip carries both in full
        const cut = [title, meta].some((t) => t && t.scrollWidth > t.clientWidth + 1);
        if (cut && (!host.title || host.dataset.arAutoTitle !== undefined)) {
          host.title = [title?.textContent, meta?.textContent].filter(Boolean).join(' — ');
          host.dataset.arAutoTitle = '';
        } else if (!cut) revealClipped(host, title);
      }}
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
