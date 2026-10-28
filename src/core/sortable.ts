'use client';
import { useEffect, useRef, type RefObject } from 'react';
import { reducedMotion } from './utils';

/* Drag to reorder, and to move between containers. One engine for ItemList rows and
   SectionGroup sections: press an item (or its handle), move a few pixels and it lifts and
   follows the pointer; a lit line shows where it will land, in its own container or in any
   other container of the same `group` (another list, another dock pane). Drop calls onMove.
   The state stays the app's: the engine only reports from → to.
   Alt + ArrowUp / ArrowDown moves the focused item by one, for the keyboard. */

export interface SortPlace {
  /** The container's id. */
  list: string;
  /** The index in the container's items, counted after the move for `to`. */
  index: number;
}

export interface SortableOptions {
  /** This container's id, reported in SortPlace.list. */
  id: string;
  /** Containers with the same group trade items. Default: the container keeps its own. */
  group?: string;
  /** The items, found inside the container. */
  itemSelector: string;
  /** Press only here to drag (e.g. a section's heading). Default: anywhere on the item. */
  handleSelector?: string;
  enabled: boolean;
  onMove: (from: SortPlace, to: SortPlace) => void;
  /** Dropped outside every container of its group: the item asks to be torn off at that point
   *  (a section becoming its own floating panel). Without it, such a drop cancels. */
  onTearOff?: (from: SortPlace, at: { x: number; y: number }) => void;
}

interface Registered {
  el: HTMLElement;
  opts: { current: SortableOptions };
}
const containers = new Set<Registered>();

/** Things inside an item that keep their own pointer behaviour. */
const INTERACTIVE = 'input, textarea, select, [contenteditable], [data-no-drag], .ar-item__trail, .ar-slider, .ar-section__actions, .ar-section__reset, .ar-section__chevron';

const itemsOf = (c: Registered) => Array.from(c.el.querySelectorAll<HTMLElement>(c.opts.current.itemSelector)).filter((el) => ownerOf(el) === c);
function ownerOf(el: HTMLElement): Registered | undefined {
  let best: Registered | undefined;
  for (const c of containers) if (c.el.contains(el) && (!best || best.el.contains(c.el))) best = c;
  return best;
}

export function useSortable(ref: RefObject<HTMLElement | null>, options: SortableOptions) {
  const opts = useRef(options);
  opts.current = options;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const me: Registered = { el, opts };
    containers.add(me);

    let drag: {
      item: HTMLElement;
      from: number;
      x0: number;
      y0: number;
      live: boolean;
      line: HTMLElement | null;
      target: { c: Registered; index: number } | null;
      pointer: number;
      x: number;
      y: number;
    } | null = null;

    /** The item of this container that holds `t`, if any (works for ':scope > …' selectors too). */
    const findItem = (t: HTMLElement) => {
      const items = itemsOf(me);
      for (let n: HTMLElement | null = t; n && n !== el; n = n.parentElement) if (items.includes(n)) return n;
      return null;
    };
    const peers = () => [...containers].filter((c) => c === me || (opts.current.group && c.opts.current.group === opts.current.group && c.opts.current.enabled));

    const place = (x: number, y: number) => {
      // the container under the pointer (the innermost one), then the gap nearest it
      let hit: Registered | null = null;
      for (const c of peers()) {
        const r = c.el.getBoundingClientRect();
        if (x >= r.left - 12 && x <= r.right + 12 && y >= r.top - 16 && y <= r.bottom + 16 && (!hit || hit.el.contains(c.el))) hit = c;
      }
      if (!hit) return null;
      const items = itemsOf(hit).filter((it) => it !== drag!.item);
      let index = items.length;
      for (let i = 0; i < items.length; i++) {
        const r = items[i].getBoundingClientRect();
        if (y < r.top + r.height / 2) {
          index = i;
          break;
        }
      }
      return { c: hit, index, items };
    };

    const showLine = (t: NonNullable<ReturnType<typeof place>>) => {
      if (!drag) return;
      if (!drag.line) {
        drag.line = document.createElement('div');
        drag.line.className = 'ar-sort-line';
        document.body.appendChild(drag.line);
      }
      const box = t.c.el.getBoundingClientRect();
      let y: number;
      if (t.items.length === 0) y = box.top + 6;
      else if (t.index >= t.items.length) y = t.items[t.items.length - 1].getBoundingClientRect().bottom + 2;
      else y = t.items[t.index].getBoundingClientRect().top - 2;
      Object.assign(drag.line.style, { left: box.left + 4 + 'px', width: Math.max(0, box.width - 8) + 'px', top: y - 1 + 'px' });
    };

    const end = (commit: boolean) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      d.line?.remove();
      document.documentElement.removeAttribute('data-ar-sorting');
      if (!d.live) return;
      d.item.removeAttribute('data-dragging');
      d.item.style.transform = '';
      // the click that ends a drag must not also fold a section or select a row
      const swallow = (e: Event) => {
        e.stopPropagation();
        e.preventDefault();
      };
      window.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
      d.item.removeAttribute('data-tearing');
      if (commit && !d.target && opts.current.onTearOff) {
        opts.current.onTearOff({ list: opts.current.id, index: d.from }, { x: d.x, y: d.y });
        return;
      }
      if (!commit || !d.target) return;
      const same = d.target.c === me;
      const to = d.target.index;
      if (same && to === d.from) return;
      opts.current.onMove({ list: opts.current.id, index: d.from }, { list: d.target.c.opts.current.id, index: to });
    };

    const onDown = (e: PointerEvent) => {
      const o = opts.current;
      if (!o.enabled || e.button !== 0) return;
      const target = e.target as HTMLElement;
      const item = findItem(target);
      if (!item) return;
      if (o.handleSelector && !target.closest(o.handleSelector)) return;
      if (target.closest(INTERACTIVE) && !(o.handleSelector && target.closest(o.handleSelector) && !target.closest('input, textarea, select, .ar-section__actions, .ar-section__reset, .ar-section__chevron'))) return;
      const from = itemsOf(me).indexOf(item);
      if (from < 0) return;
      drag = { item, from, x0: e.clientX, y0: e.clientY, live: false, line: null, target: null, pointer: e.pointerId, x: e.clientX, y: e.clientY };
    };
    const onMovePtr = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.pointer) return;
      const dx = e.clientX - drag.x0;
      const dy = e.clientY - drag.y0;
      if (!drag.live) {
        if (Math.hypot(dx, dy) < 5) return;
        drag.live = true;
        drag.item.setAttribute('data-dragging', '');
        document.documentElement.setAttribute('data-ar-sorting', '');
      }
      e.preventDefault();
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.item.style.transform = `translate(${dx}px, ${dy}px)${reducedMotion() ? '' : ' scale(0.985)'}`;
      const t = place(e.clientX, e.clientY);
      drag.target = t ? { c: t.c, index: t.index } : null;
      if (t) showLine(t);
      else if (drag.line) drag.line.style.width = '0px';
      // out over open space: a section that can tear off says it will become its own panel
      drag.item.toggleAttribute('data-tearing', !t && !!opts.current.onTearOff);
    };
    const onUp = (e: PointerEvent) => drag && e.pointerId === drag.pointer && end(true);
    const onCancel = () => end(false);
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drag) end(false);
    };
    const onKey = (e: KeyboardEvent) => {
      const o = opts.current;
      if (!o.enabled || !e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      const item = findItem(e.target as HTMLElement);
      if (!item) return;
      // on a section, only its heading moves it, so arrow keys inside its controls keep their meaning
      if (o.handleSelector && !(e.target as HTMLElement).closest(o.handleSelector)) return;
      const items = itemsOf(me);
      const from = items.indexOf(item);
      const to = from + (e.key === 'ArrowUp' ? -1 : 1);
      if (from < 0 || to < 0 || to >= items.length) return;
      e.preventDefault();
      o.onMove({ list: o.id, index: from }, { list: o.id, index: to });
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('keydown', onKey);
    window.addEventListener('pointermove', onMovePtr, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onEsc);
    return () => {
      end(false);
      containers.delete(me);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('keydown', onKey);
      window.removeEventListener('pointermove', onMovePtr);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onEsc);
    };
  }, [ref]);
}

/** Moves an item in plain arrays, for the common case: `setLists(moveBetween(lists, from, to))`. */
export function moveBetween<T>(lists: Record<string, T[]>, from: SortPlace, to: SortPlace): Record<string, T[]> {
  const next: Record<string, T[]> = { ...lists, [from.list]: [...lists[from.list]] };
  const [item] = next[from.list].splice(from.index, 1);
  next[to.list] = from.list === to.list ? next[from.list] : [...lists[to.list]];
  next[to.list].splice(to.index, 0, item);
  return next;
}
