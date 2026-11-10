'use client';
import { Children, useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { Checkbox } from '../controls/Checkbox';
import { useSortable } from '../core/sortable';
import type { SortPlace } from '../core/sortable';
import { cx, revealClipped } from '../core/utils';

/* ARTINOS ItemList · ItemGroup · ItemRow — things in a list: layers, bodies, presets, files,
   people, renders. One row anatomy, four list looks and three sizes:

     [twist] [check] [lead] title · status          value  [trailing tools]
                            meta
                            description
     ─────────── progress ───────────

   The lead is a thumbnail, an icon, a swatch or anything else. In a grid the same row becomes a
   tile: the lead on top, the words under it, the tools over its corner. Selected, a row takes the
   active wash and an accent edge. */

export type ItemListVariant = 'plain' | 'divided' | 'cards' | 'grid';
export type ItemListSize = 'sm' | 'md' | 'lg';
export type ItemStatus = 'live' | 'warn' | 'fault' | 'idle';

export interface ItemRowProps {
  /** The name, in the sans. */
  title: ReactNode;
  /** A quiet second line: what it is, its size, its state. Truncates. */
  meta?: ReactNode;
  /** A third line that may wrap (two lines at most): a note, a prompt, a path. Shown at md and lg. */
  description?: ReactNode;
  /** An image URL, or any element (a canvas, a video, a preview), drawn as the row's thumbnail. */
  thumbnail?: string | ReactNode;
  /** square (default) · round (people, materials as spheres) · wide (16:9: scenes, video, renders). */
  thumbShape?: 'square' | 'round' | 'wide';
  /** A glyph before the name, in the quiet ink. */
  icon?: ReactNode;
  /** A colour drawn as a round swatch before the name. */
  swatch?: string;
  /** Any other leading mark. A thumbnail, icon or swatch is used before it. */
  leading?: ReactNode;
  /** The row's answer at the end, before its tools: a size, a duration, a level. Tabular figures. */
  value?: ReactNode;
  /** A light after the name: live (running), warn, fault, idle. */
  status?: ItemStatus;
  /** 0–1: a thin bar along the row's foot (an upload, a render, a bake). */
  progress?: number;
  /** Tools at the end of the row: a Badge, a Switch, an IconButton or Menu. Clicks here never select the row. */
  trailing?: ReactNode;
  selected?: boolean;
  /** Makes the row a button: it selects on click, Enter or Space. */
  onSelect?: () => void;
  /** A checkbox before the lead, for picking many at once. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Nesting level in a tree (0 at the root): indents the row. */
  depth?: number;
  /** Set for a row with children: a disclosure arrow that folds them. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

export interface ItemListProps {
  /** The list's accessible name, e.g. "Layers". */
  label?: string;
  /** plain: rows on the panel, 2px apart (default) · divided: hairlines between rows · cards: each
   *  row on a soft tonal surface · grid: tiles, the lead on top (presets, materials, images). */
  variant?: ItemListVariant;
  /** sm: one line, the meta beside the name · md (default) · lg: a large lead and the description. */
  size?: ItemListSize;
  /** grid: the narrowest a tile gets, in px. Default 120. */
  tileWidth?: number;
  /** Shown when the list has no rows. */
  empty?: ReactNode;
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

/** The list ItemRows stand in. Rows can be dragged to reorder, or to another list of the same group. */
export function ItemList({ label, variant = 'plain', size = 'md', tileWidth, empty, onReorder, group, id, onMove, children, className, style }: ItemListProps) {
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
  const none = Children.toArray(children).length === 0;
  return (
    <div
      ref={ref}
      id={id}
      role="list"
      aria-label={label}
      className={cx('ar-items', className)}
      data-variant={variant === 'plain' ? undefined : variant}
      data-size={size === 'md' ? undefined : size}
      data-sortable={sortable ? '' : undefined}
      style={tileWidth ? ({ '--ar-tile-w': tileWidth + 'px', ...style } as CSSProperties) : style}
    >
      {none && empty ? <div className="ar-items__empty">{empty}</div> : children}
    </div>
  );
}

export interface ItemGroupProps {
  /** The group's name: an overline over its rows. */
  label: ReactNode;
  /** One small fact after the name, e.g. how many. */
  count?: ReactNode;
  /** Slim tools at the end of the group's header. */
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Rows under a name inside an ItemList: Lights, Meshes, Cameras. Drag works on the list's flat order. */
export function ItemGroup({ label, count, actions, children, className }: ItemGroupProps) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className={cx('ar-items__group', className)}>
      <div className="ar-items__head">
        <span id={id} className="ar-items__label">
          {label}
        </span>
        {count != null ? <span className="ar-items__count">{count}</span> : null}
        {actions ? <span className="ar-items__actions">{actions}</span> : null}
      </div>
      {children}
    </div>
  );
}

const Twist = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 10 10" aria-hidden="true" data-open={open ? '' : undefined}>
    <path d="M3.5 2l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Lead({ thumbnail, thumbShape = 'square', icon, swatch, leading }: Pick<ItemRowProps, 'thumbnail' | 'thumbShape' | 'icon' | 'swatch' | 'leading'>) {
  if (thumbnail != null)
    return (
      <span className="ar-item__lead" data-lead="thumb" data-shape={thumbShape}>
        {typeof thumbnail === 'string' ? <img src={thumbnail} alt="" loading="lazy" draggable={false} /> : thumbnail}
      </span>
    );
  if (icon != null)
    return (
      <span className="ar-item__lead" data-lead="icon">
        {icon}
      </span>
    );
  if (swatch)
    return (
      <span className="ar-item__lead" data-lead="swatch">
        <i className="ar-item__swatch" style={{ background: swatch }} />
      </span>
    );
  return leading != null ? <span className="ar-item__lead">{leading}</span> : null;
}

export function ItemRow({
  title,
  meta,
  description,
  thumbnail,
  thumbShape,
  icon,
  swatch,
  leading,
  value,
  status,
  progress,
  trailing,
  selected = false,
  onSelect,
  checked,
  onCheckedChange,
  depth,
  expanded,
  onExpandedChange,
  disabled,
  className,
  style,
  id,
}: ItemRowProps) {
  const body = (
    <>
      <Lead thumbnail={thumbnail} thumbShape={thumbShape} icon={icon} swatch={swatch} leading={leading} />
      <span className="ar-item__text">
        <span className="ar-item__name">
          <span className="ar-item__title">{title}</span>
          {status ? <i className="ar-item__status" data-status={status} role="img" aria-label={status} /> : null}
        </span>
        {meta != null ? <span className="ar-item__meta">{meta}</span> : null}
        {description != null ? <span className="ar-item__desc">{description}</span> : null}
      </span>
      {value != null ? <span className="ar-item__value">{value}</span> : null}
    </>
  );
  const tree = depth !== undefined || expanded !== undefined;
  const p = progress === undefined ? undefined : Math.min(1, Math.max(0, progress));
  return (
    <div
      id={id}
      role="listitem"
      aria-expanded={expanded}
      className={cx('ar-item', className)}
      data-selected={selected ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      data-checked={checked ? '' : undefined}
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
      style={depth ? ({ '--ar-item-depth': depth, ...style } as CSSProperties) : style}
    >
      {tree ? (
        expanded !== undefined ? (
          <button type="button" className="ar-item__twist" aria-label={expanded ? 'Collapse' : 'Expand'} onClick={() => onExpandedChange?.(!expanded)}>
            <Twist open={expanded} />
          </button>
        ) : (
          <span className="ar-item__twist" aria-hidden="true" />
        )
      ) : null}
      {checked !== undefined || onCheckedChange ? (
        <span className="ar-item__check">
          <Checkbox checked={!!checked} onChange={onCheckedChange} disabled={disabled} aria-label={typeof title === 'string' ? `Pick ${title}` : 'Pick'} />
        </span>
      ) : null}
      {onSelect ? (
        <button type="button" className="ar-item__main" aria-pressed={selected} disabled={disabled} onClick={onSelect}>
          {body}
        </button>
      ) : (
        <span className="ar-item__main">{body}</span>
      )}
      {trailing ? <span className="ar-item__trail">{trailing}</span> : null}
      {p !== undefined ? (
        <span className="ar-item__progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p * 100)} style={{ '--p': p } as CSSProperties} />
      ) : null}
    </div>
  );
}
