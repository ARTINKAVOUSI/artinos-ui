'use client';
import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/* Overlays (menus, tooltips, toasts, the command palette) portal to <body> to escape
   clipped or blurred containers — which also takes them out of their theme scope.
   ThemedPortal carries the scope across: it reads the nearest theme, density and
   material attributes and any inline --ar-* tokens from where it is mounted, and puts
   them on a display: contents wrapper around the portalled content. */

const SCOPE_ATTRS = ['data-ar-theme', 'data-ar-density', 'data-ar-material', 'data-ar-type'] as const;

export interface ThemeScope {
  attrs: Record<string, string>;
  style: Record<string, string>;
  key: string;
}

/** The theme scope an element sits in. Closest values win. */
export function themeScopeOf(el: Element | null): ThemeScope {
  const attrs: Record<string, string> = {};
  const style: Record<string, string> = {};
  for (let node = el; node; node = node.parentElement) {
    for (const a of SCOPE_ATTRS) {
      const v = node.getAttribute(a);
      if (v && !(a in attrs)) attrs[a] = v;
    }
    const inline = (node as HTMLElement).style;
    if (inline)
      for (let i = 0; i < inline.length; i++) {
        const p = inline[i];
        if (p.startsWith('--ar-') && !(p in style)) style[p] = inline.getPropertyValue(p);
      }
  }
  return { attrs, style, key: JSON.stringify([attrs, style]) };
}

// false while hydrating a server render, true otherwise: a portal never mismatches the HTML
const noop = () => () => {};
const onClient = () => true;
const onServer = () => false;

/** createPortal(children, document.body), keeping the theme of where it is rendered. */
export function ThemedPortal({ children }: { children: ReactNode }) {
  const client = useSyncExternalStore(noop, onClient, onServer);
  const anchor = useRef<HTMLSpanElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const applied = useRef('');
  // Every commit, and before the content's owner measures it (a parent's layout effect runs
  // after this one): the scope is written straight onto the wrapper, so the first layout
  // already has the right theme and density, and a theme switch reaches an open overlay.
  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const next = themeScopeOf(anchor.current);
    if (next.key === applied.current) return;
    applied.current = next.key;
    for (const a of SCOPE_ATTRS) {
      if (next.attrs[a]) el.setAttribute(a, next.attrs[a]);
      else el.removeAttribute(a);
    }
    el.removeAttribute('style');
    for (const [p, v] of Object.entries(next.style)) el.style.setProperty(p, v);
  });
  return (
    <>
      <span ref={anchor} hidden />
      {client
        ? createPortal(
            <div ref={host} className="ar-portal">
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
