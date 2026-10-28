'use client';
import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../core/utils';

/** Gap between bar items in the strip (Dock.css), and room kept free so the strip never feels jammed. */
const ITEM_GAP = 2;
const BREATHING = 8;

/** The panel currently being rendered, so its bar can find its own slot in the dock strip. */
export const PanelIdContext = createContext<string | null>(null);

/** Rendered by the dock chrome: where the active panel's toolbar goes. */
export function PanelBarSlot({ panelId }: { panelId: string | null }) {
  return <div className="ar-dock__slot" data-panel-slot={panelId ?? undefined} data-no-drag />;
}

/** Width the bar's controls need on one line: its items, less spacers and summaries (neither rides in the strip). */
function neededWidth(bar: HTMLElement) {
  const items = [...bar.children].filter(
    (c) => !c.classList.contains('ar-panel-bar__spacer') && !c.classList.contains('ar-panel-bar__summary'),
  ) as HTMLElement[];
  return items.reduce((sum, item) => sum + item.getBoundingClientRect().width, 0) + Math.max(0, items.length - 1) * ITEM_GAP;
}

/** Room left in the strip once its other contents (tabs, search, toolbar) are laid out. */
function freeWidth(strip: HTMLElement, slot: HTMLElement) {
  const style = getComputedStyle(strip);
  const gap = parseFloat(style.columnGap) || 0;
  const others = [...strip.children].filter((c) => c !== slot) as HTMLElement[];
  const used = others.reduce((sum, c) => sum + c.getBoundingClientRect().width, 0) + others.length * gap;
  return strip.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - used;
}

/**
 * A panel's toolbar. Inside a `Dock`, it moves up into the dock's tab strip whenever
 * the strip has room, so a few small controls never cost the panel a whole row;
 * otherwise (a narrow dock, a floating window) it stays at the top of the panel.
 * Outside a dock it is a plain toolbar row.
 *
 *   <PanelBar><TextField size="sm" placeholder="Filter…" /><span className="ar-panel-bar__spacer" /><Button size="sm">Add</Button></PanelBar>
 */
export function PanelBar({ className, children }: { className?: string; children: ReactNode }) {
  const panelId = useContext(PanelIdContext);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const need = useRef(0);

  useLayoutEffect(() => {
    const slot = panelId ? document.querySelector<HTMLElement>(`[data-panel-slot="${CSS.escape(panelId)}"]`) : null;
    const strip = slot?.parentElement;
    if (!slot || !strip) {
      setHost(null);
      return;
    }
    const measure = () => {
      // the bar's own width is read wherever it currently is; its items keep their size in both places
      if (bar.current) need.current = neededWidth(bar.current) || need.current;
      // free room leaves the slot out, so it reads the same whether or not the bar is in it
      const room = freeWidth(strip, slot);
      setHost(need.current > 0 && room >= need.current + BREATHING ? slot : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(strip);
    if (bar.current) observer.observe(bar.current);
    return () => observer.disconnect();
    // re-run when the bar moves: it is a new element there, to observe and measure
  }, [panelId, host]);

  const content = (
    <div ref={bar} className={cx('ar-panel-bar', className)} data-head>
      {children}
    </div>
  );
  return host ? createPortal(content, host) : content;
}
