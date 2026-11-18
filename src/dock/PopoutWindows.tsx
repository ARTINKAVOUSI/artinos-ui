'use client';
import { useEffect, useRef, useState } from 'react';
import type { ReactElement, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { PortalTargetContext, themeScopeOf } from '../core/portal';
import { DockIcons } from './icons';
import type { MetaBlockInstance, PopoutRecord } from './metablock/types';
import type { MetaBlockWorkspace } from './metablock/workspace';

/* A popped-out panel in a real browser window: on a second monitor it is still the same panel, in
   the same React tree, on the same values. The window gets a copy of the page's stylesheets and the
   Dock's theme. Closing it, or the Return button, brings the panel home; so does a browser that
   refuses to open the window. */

interface OpenWindow {
  groupId: string;
  win: Window;
  host: HTMLElement;
  attrs: Record<string, string>;
  style: Record<string, string>;
}

export function PopoutWindows({ workspace, renderBlock, anchor }: { workspace: MetaBlockWorkspace; renderBlock: (block: MetaBlockInstance) => ReactElement | null; anchor: RefObject<HTMLElement | null> }) {
  const [windows, setWindows] = useState<readonly OpenWindow[]>([]);
  const open = useRef(new Map<string, OpenWindow>());

  useEffect(() => {
    const publish = () => setWindows([...open.current.values()]);
    /** Bring a group's panels back from a window that has gone. */
    const home = (groupId: string, bounds: PopoutRecord['bounds']) => {
      const group = workspace.groups.get(groupId);
      if (!group || !workspace.popouts.has(groupId)) return;
      for (const id of [...group.children]) if (workspace.getBlockReturnState(id)) workspace.returnBlock(id);
      if (workspace.popouts.has(groupId)) workspace.floatGroup(groupId, bounds);
    };
    const launch = ({ groupId, bounds, windowId }: PopoutRecord) => {
      if (open.current.has(groupId)) return;
      const left = window.screenX + bounds.x;
      const top = window.screenY + bounds.y;
      // called from the click itself: anything later and the browser takes it for an unwanted popup
      const win = window.open('', `artinos-${windowId}`, `popup,width=${bounds.width},height=${bounds.height},left=${left},top=${top}`);
      // the engine is still inside the pop-out step: the way home starts after it
      if (!win) return queueMicrotask(() => home(groupId, bounds));
      const doc = win.document;
      doc.title = workspace.groups.get(groupId)?.title ?? document.title;
      doc.head.replaceChildren(...[...document.head.querySelectorAll('style, link[rel="stylesheet"]')].map((node) => doc.importNode(node, true)));
      doc.body.className = 'ar-popout-body';
      const host = doc.createElement('div');
      doc.body.replaceChildren(host);
      const scope = themeScopeOf(anchor.current);
      Object.entries(scope.attrs).forEach(([a, v]) => doc.body.setAttribute(a, v));
      win.addEventListener('pagehide', () => {
        if (!open.current.delete(groupId)) return;
        publish();
        home(groupId, bounds);
      });
      open.current.set(groupId, { groupId, win, host, attrs: scope.attrs, style: scope.style });
      publish();
    };
    for (const record of workspace.popouts.values()) launch(record);
    const offOpen = workspace.on('group:popout', launch);
    // undo, a reset or a re-dock takes a group out of its window: the window closes with it
    const offAny = workspace.on('*', () => {
      for (const [groupId, w] of open.current)
        if (!workspace.popouts.has(groupId)) {
          open.current.delete(groupId);
          w.win.close();
          publish();
        }
    });
    const windowsNow = open.current;
    const closeAll = () => windowsNow.forEach((w) => w.win.close());
    window.addEventListener('pagehide', closeAll);
    return () => {
      offOpen();
      offAny();
      window.removeEventListener('pagehide', closeAll);
      windowsNow.forEach((w) => {
        windowsNow.delete(w.groupId);
        w.win.close();
      });
      setWindows([]);
    };
  }, [workspace, anchor]);

  return (
    <>
      {windows.map((w) => {
        const group = workspace.groups.get(w.groupId);
        if (!group) return null;
        const blocks = group.children.flatMap((id) => workspace.blocks.get(id) ?? []);
        const active = blocks.find((b) => b.id === group.activeChild) ?? blocks[0];
        return createPortal(
          <PortalTargetContext.Provider value={w.win.document.body}>
            <div className="ar-dock ar-popout" {...w.attrs} style={w.style}>
              <header className="ar-dock__strip ar-dock__strip--window">
                <div className="ar-dock__tabs" data-look="line" role="tablist" aria-label="Panels in this window">
                  {blocks.map((b) => (
                    <button key={b.id} type="button" role="tab" aria-selected={b === active} className={b === active ? 'is-active' : undefined} onClick={() => workspace.activateBlock(b.id)}>
                      <span className="ar-dock__tab-label">{b.title}</span>
                    </button>
                  ))}
                </div>
                <div className="ar-dock__window-actions">
                  <button type="button" className="ar-tool" title="Return to the workspace" onClick={() => w.win.close()}>
                    {DockIcons.returnHome}
                  </button>
                </div>
              </header>
              <div className="ar-popout__body">{active ? renderBlock(active) : null}</div>
            </div>
          </PortalTargetContext.Provider>,
          w.host,
          w.groupId,
        );
      })}
    </>
  );
}
