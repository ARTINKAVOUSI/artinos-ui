'use client';
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { reducedMotion } from './utils';

/* Motion helpers shared by the family. Durations and curves live in the tokens
   (--ar-dur-*, --ar-ease-*); these only decide *when* something moves:
   - usePresence keeps an overlay mounted while it plays its exit;
   - useGlide moves one highlight between rows instead of flashing each row;
   - useFlip slides siblings into place when a stack reflows (toasts). */

/** The family's roll / settle curve, for Web Animations (CSS uses --ar-ease-roll). */
export const EASE_ROLL = 'cubic-bezier(.22,1,.36,1)';

/**
 * Keeps the last truthy `value` for `exitMs` after it turns falsy, so the element can
 * animate out. `leaving` is true during that window; render `data-state="closing"`.
 */
export function usePresence<T>(value: T | null | undefined | false, exitMs: number) {
  const [kept, setKept] = useState<T | null>(value || null);
  if (value && value !== kept) setKept(value);
  const leaving = !value && kept !== null;
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setKept(null), reducedMotion() ? 0 : exitMs);
    return () => clearTimeout(timer);
  }, [leaving, exitMs]);
  return { shown: (value || kept) as T | null, leaving };
}

/**
 * One highlight that travels to the active row (`[data-active]` by default) inside `list`.
 * The glide element must share the rows' offset parent. It fades in where it first
 * appears, then slides.
 */
export function useGlide(list: RefObject<HTMLElement | null>, glide: RefObject<HTMLElement | null>, selector = '[data-active]') {
  const visible = useRef(false);
  // every commit: the active row, or the rows under it, may have moved
  useLayoutEffect(() => {
    const g = glide.current;
    const row = list.current?.querySelector<HTMLElement>(selector);
    if (!g) return;
    if (!row) {
      g.style.opacity = '0';
      visible.current = false;
      return;
    }
    const first = !visible.current;
    if (first) g.style.transitionProperty = 'opacity';
    g.style.transform = `translate(${row.offsetLeft}px, ${row.offsetTop}px)`;
    g.style.width = `${row.offsetWidth}px`;
    g.style.height = `${row.offsetHeight}px`;
    g.style.opacity = '1';
    if (first) {
      void g.offsetWidth; // commit the jump before motion is allowed again
      g.style.transitionProperty = '';
      visible.current = true;
    }
  });
}

/**
 * Slides the children of `container` from where they were to where they are now, after
 * an item is added or removed. Children are keyed by `data-flip`.
 */
export function useFlip(container: RefObject<HTMLElement | null>) {
  const last = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const host = container.current;
    if (!host) return;
    const next = new Map<string, number>();
    for (const el of Array.from(host.children) as HTMLElement[]) {
      const key = el.dataset.flip;
      if (!key) continue;
      const top = el.offsetTop;
      next.set(key, top);
      const was = last.current.get(key);
      if (was !== undefined && was !== top && !reducedMotion() && el.animate) {
        el.animate([{ translate: `0 ${was - top}px` }, { translate: '0 0' }], { duration: 280, easing: EASE_ROLL });
      }
    }
    last.current = next;
  });
}
