'use client';
import { Component, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactElement, ReactNode } from 'react';
import { Button } from '../actions/Button';
import { Kbd } from '../actions/Kbd';
import { interfaceVisibility, useAutoHide } from '../core/autohide';
import { CommandScopeContext, CommandsContext } from '../core/commands';
import type { Command } from '../core/commands';
import { cx, readStored, writeStored } from '../core/utils';
import { PaneContext } from '../core/pane';
import { useLabelColumn } from '../core/hooks';
import { CommandPalette } from '../overlays/CommandPalette';
import { DockMenu } from './DockMenu';
import { DockIcons } from './icons';
import { PanelBarSlot, PanelIdContext } from './PanelBar';
import { useWorkspaceRevision } from './metablock/hooks';
import type { MetaBlockCapabilities, MetaBlockGroup, MetaBlockInstance } from './metablock/types';
import { MetaBlockWorkspace } from './metablock/workspace';
import { MetaBlockWorkspaceView } from './metablock/WorkspaceView';
import { PopoutWindows } from './PopoutWindows';
import type { GroupChromeContext, MetaBlockWorkspaceViewProps } from './metablock/WorkspaceView';

/* ARTINOS Dock — a studio workspace in one component. Panels live in docks on the
   left, right and bottom edges, as tabs; any of them can be dragged out to float,
   split, re-docked, merged, maximized or sent back home, and the arrangement can be
   saved. An optional viewport (a 3D canvas, a video) fills the space behind them.
   It is built on the MetaBlock engine (./metablock) and themed by the --ar-* tokens. */

export type DockEdge = 'left' | 'right' | 'bottom';

/** How a group of panels shows its tabs. placement: top (a strip) · side (a rail down its outer
 *  edge). look: line (names over a lit underline) · pill (the current tab on a soft wash) · icon
 *  (icons alone, each named by its tooltip). */
export interface DockTabStyle {
  placement: 'top' | 'side';
  look: 'line' | 'pill' | 'icon';
}

export interface DockPanel {
  /** Unique and stable: the saved layout is keyed by it. */
  id: string;
  title: string;
  /** One line about the panel: the tab tooltip, and searchable in the palette. */
  description?: string;
  /** Extra search words for the command palette. */
  keywords?: string[];
  /** Starting place. Default 'bottom'. 'center' fills what the docks leave: a workspace of panels
   *  with no canvas behind them (over a viewport it would cover it). */
  dock?: DockEdge | 'center' | 'float';
  /** The tab shown first in its dock. */
  active?: boolean;
  content: ReactNode;
  /** Quiet status line along the panel's foot. */
  footer?: ReactNode;
  /** A glyph for the panel's tab: shown beside its name, and alone on a narrow side rail. */
  icon?: ReactNode;
  /** What this panel may do, on top of the MetaBlock defaults (all true): e.g. { closable: false,
   *  floatable: false } keeps a panel docked and open. Drags, menus and window buttons follow it. */
  capabilities?: Partial<MetaBlockCapabilities>;
}

export interface DockApi {
  workspace: MetaBlockWorkspace;
  /** Show a panel: back into its dock (or floating) if it was closed, then active. */
  openPanel: (id: string) => void;
  /** Forget the saved arrangement and start from the panels' defaults. */
  resetLayout: () => void;
  openPalette: () => void;
  /** Interface shown: false while hidden by the hide key, idle, `interfaceVisibility` or the
   *  `artinos:interface` event. It is the one switch every Dock and auto-hiding Panel shares. */
  visible: boolean;
  setVisible: (visible: boolean) => void;
  toggleVisible: () => void;
  /** Add a panel while the workspace runs, floating: at `at` (a point on screen, the panel's
   *  top-left) or at the float bounds. Ids starting with TEAR_PREFIX are not kept in the saved layout. */
  addPanel: (panel: DockPanel, place?: { at?: { x: number; y: number }; width?: number; height?: number }) => void;
  /** Remove a panel added with addPanel. */
  removePanel: (id: string) => void;
}

/** Panels torn off at run time (a section become its own panel) carry this id prefix: the saved
 *  layout leaves them out, so a reload starts from the arrangement without them. */
export const TEAR_PREFIX = 'ar-tear:';

export interface DockProps {
  panels: readonly DockPanel[];
  /** Fills the workspace behind the docks: a canvas, video or image. */
  viewport?: ReactNode;
  /** localStorage key to save and restore the arrangement. Omit to start fresh each time. */
  storageKey?: string;
  /** Dock sizes as a fraction of the workspace. Default left .22 · right .24 · bottom .36; side docks keep at least 220px, edge docks 120px. */
  sizes?: Partial<Record<DockEdge, number>>;
  /** Where panels with dock: 'float' (or reopened without a dock) appear. */
  floatBounds?: { x: number; y: number; width: number; height: number };
  /** Extra command palette entries, next to the built-in panel and layout commands. */
  commands?: readonly Command[];
  /** Search entry + Ctrl/⌘ K command palette. Default true. */
  palette?: boolean;
  /** Right end of every dock's tab strip, e.g. a status readout. */
  toolbar?: ReactNode;
  /** A chip in the top-left corner, e.g. the app name. */
  brand?: ReactNode;
  /** How each group shows its tabs, per dock edge (and 'float' for detached windows): 'top' · 'side',
   *  or { placement, look } (look: 'line' · 'pill' · 'icon'). It seeds the group's MetaBlock meta;
   *  the tab's right-click menu changes it at run time, and the layout keeps it. */
  tabs?: Partial<Record<DockEdge | 'center' | 'float', 'top' | 'side' | Partial<DockTabStyle>>>;
  /** Key that hides / shows the interface (the viewport stays): 'h', 'tab', 'mod+.'… Off by default.
   *  It is the shared switch, so auto-hiding Panels and other Docks hide with it. */
  hideKey?: string | null;
  /** Hide the interface after this many ms with no input; any input brings it back. Off by default. */
  idleHide?: number;
  /** What brings an idle-hidden interface back: 'move' (any input, default) · 'near' (a key, or the
   *  pointer near an edge or over a hidden panel's place, so working the canvas keeps the view clean). */
  idleReveal?: 'move' | 'near';
  /** Engine tuning passed to the workspace view: padding, gap, snapping, motion… */
  viewProps?: Omit<
    Partial<MetaBlockWorkspaceViewProps>,
    'workspace' | 'renderBlock' | 'renderPanel' | 'renderGroupChrome' | 'renderGroupFooter' | 'renderContextMenu'
  >;
  /** Called once the workspace exists (and again after a layout reset). */
  onReady?: (api: DockApi) => void;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_SIZES: Record<DockEdge, number> = { left: 0.22, right: 0.24, bottom: 0.36 };
const DEFAULT_FLOAT = { x: 120, y: 120, width: 420, height: 340 };
const VIEWPORT = 'viewport.canvas';
/** Layout changes are saved once they settle, never per drag or resize frame. */
const PERSIST_DELAY_MS = 300;
/** Workspace events that do not change the saved arrangement. */
const TRANSIENT_EVENTS = new Set(['focus', 'selection']);
/** How long the panes take to arrive when the interface comes back, stagger included. */
const REVEAL_MS = 700;

const DockContext = createContext<DockApi | null>(null);

/** The surrounding Dock's API, for use inside a panel. */
export function useDock(): DockApi {
  const api = useContext(DockContext);
  if (!api) throw new Error('useDock() must be used inside a <Dock> panel.');
  return api;
}

/** The surrounding Dock's API, or null outside a Dock: for parts that work in both places. */
export function useDockOptional(): DockApi | null {
  return useContext(DockContext);
}

/**
 * The MetaBlock workspace for a set of panels: a locked fullscreen viewport (when
 * given), one persistent dock group per edge that has panels, floating panels, and
 * — when storageKey is set — the saved arrangement, if every tab in it still exists.
 */
function buildWorkspace(
  panels: readonly DockPanel[],
  o: { viewport: boolean; storageKey?: string; sizes: Record<DockEdge, number>; float: typeof DEFAULT_FLOAT },
) {
  const workspace = new MetaBlockWorkspace({ id: o.storageKey ?? 'ar-dock' });
  if (o.viewport) {
    workspace.createGroup({ id: 'viewport', title: 'Viewport', role: 'viewport', lockedFullscreen: true });
    workspace.createMetaBlock({ id: VIEWPORT, title: 'Viewport', role: 'viewport' }, { groupId: 'viewport' });
  }
  const byDock = new Map<DockEdge | 'center', DockPanel[]>();
  const floating: DockPanel[] = [];
  for (const panel of panels) {
    if (panel.dock === 'float') floating.push(panel);
    else byDock.set(panel.dock ?? 'bottom', [...(byDock.get(panel.dock ?? 'bottom') ?? []), panel]);
  }
  for (const [edge, members] of byDock) {
    const groupId = `dock.${edge}`;
    // the center group takes what the edge docks leave; the engine lets it only when asked (allowRootCenter)
    workspace.createGroup({ id: groupId, title: edge[0].toUpperCase() + edge.slice(1), role: 'dock', meta: { persistentContainer: true, ...(edge === 'center' ? { allowRootCenter: true } : {}) } });
    // meta is structured-cloned for undo and persistence, so it stays JSON-safe
    for (const p of members) workspace.createMetaBlock({ id: p.id, title: p.title, role: 'panel', capabilities: p.capabilities as MetaBlockCapabilities, meta: { description: p.description ?? null } }, { groupId });
    workspace.dockGroup(groupId, edge === 'center' ? { area: 'center' } : { area: edge, size: o.sizes[edge] });
    const first = members.find((p) => p.active) ?? members[0];
    if (first) workspace.activateBlock(first.id);
  }
  for (const p of floating) {
    workspace.createMetaBlock({ id: p.id, title: p.title, role: 'panel', capabilities: p.capabilities as MetaBlockCapabilities });
    workspace.floatBlock(p.id, o.float);
  }

  if (o.storageKey) {
    try {
      const snapshot = readStored<any>(o.storageKey, null);
      const known = new Set(panels.map((p) => p.id).concat(o.viewport ? [VIEWPORT] : []));
      const saved: string[] = (snapshot?.blocks ?? []).map((b: MetaBlockInstance) => b.id).filter((id: string) => !id.startsWith(TEAR_PREFIX));
      // a removed panel must not come back as an empty tab: restore only if every saved tab still exists
      if (saved.length && saved.every((id) => known.has(id))) {
        workspace.restore(snapshot);
        // torn-off panels belonged to the last session
        for (const id of [...workspace.blocks.keys()]) if (id.startsWith(TEAR_PREFIX)) workspace.removeBlock(id);
        // no pop-out windows here: a group saved popped out would stay invisible
        for (const groupId of [...workspace.popouts.keys()])
          workspace.reattachPopout(groupId, { area: 'bottom', targetGroupId: workspace.groups.has('dock.bottom') ? 'dock.bottom' : null });
        // panels added since join their dock
        for (const p of panels) {
          if (workspace.blocks.has(p.id)) continue;
          const groupId = `dock.${p.dock ?? 'bottom'}`;
          const docked = workspace.groups.get(groupId)?.role === 'dock';
          workspace.createMetaBlock(
            { id: p.id, title: p.title, role: 'panel', capabilities: p.capabilities as MetaBlockCapabilities, meta: { description: p.description ?? null } },
            { groupId: docked ? groupId : undefined },
          );
          if (!docked) workspace.floatBlock(p.id, o.float);
        }
      }
    } catch {
      /* a corrupt or foreign layout falls back to the defaults */
    }
  }
  return workspace;
}

export function Dock({
  panels,
  viewport,
  storageKey,
  sizes,
  floatBounds,
  commands = [],
  palette = true,
  toolbar,
  brand,
  tabs: tabPlacement,
  hideKey = null,
  idleHide = 0,
  idleReveal = 'move',
  viewProps,
  onReady,
  className,
  style,
}: DockProps) {
  const [version, setVersion] = useState(0);
  const resetting = useRef(false);
  const shape = panels.map((p) => `${p.id}:${p.dock ?? 'bottom'}`).join('|') + (viewport ? '|viewport' : '');
  const workspace = useMemo(
    () =>
      buildWorkspace(panels, {
        viewport: viewport != null,
        storageKey,
        sizes: { ...DEFAULT_SIZES, ...sizes },
        float: floatBounds ?? DEFAULT_FLOAT,
      }),
    // rebuilt when the set of panels or their docks change, or after a reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shape, storageKey, version],
  );
  useWorkspaceRevision(workspace);
  // panels added while it runs (addPanel): floating, outside the saved arrangement's panel set
  const [extras, setExtras] = useState<DockPanel[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const byId = new Map([...panels, ...extras].map((p) => [p.id, p]));
  const [paletteOpen, setPaletteOpen] = useState(false);
  const ui = useAutoHide({ hotkey: hideKey, idle: idleHide, reveal: idleReveal });
  const visible = ui.visible;
  // for a moment after it comes back the panes arrive (a longer, staggered settle); the rest of the
  // time their fades stay the engine's quick ones, so drags and docking never lag
  const [revealing, setRevealing] = useState(false);
  const wasHidden = useRef(false);
  useEffect(() => {
    if (!visible) {
      wasHidden.current = true;
      setRevealing(false);
      return;
    }
    if (!wasHidden.current) return;
    wasHidden.current = false;
    setRevealing(true);
    const t = setTimeout(() => setRevealing(false), REVEAL_MS);
    return () => clearTimeout(t);
  }, [visible]);
  // the floating rectangle by its numbers: an inline `floatBounds={{ … }}` is a new object every render,
  // and the callbacks below (and the api handed to onReady) must not change with it
  const float = useMemo(
    () => floatBounds ?? DEFAULT_FLOAT,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [floatBounds?.x, floatBounds?.y, floatBounds?.width, floatBounds?.height],
  );

  // persist the arrangement once a change settles; drags, resizes and focus clicks stay off storage
  useEffect(() => {
    resetting.current = false;
    if (!storageKey) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      timer = undefined;
      if (resetting.current) return;
      writeStored(storageKey, workspace.serialize());
    };
    const off = workspace.on('*', (event: { type?: string }) => {
      if (TRANSIENT_EVENTS.has(event?.type ?? '')) return;
      clearTimeout(timer);
      timer = setTimeout(save, PERSIST_DELAY_MS);
    });
    // leaving with a change still pending writes it out
    const flush = () => timer !== undefined && save();
    window.addEventListener('pagehide', flush);
    return () => {
      flush();
      window.removeEventListener('pagehide', flush);
      off();
    };
  }, [workspace, storageKey]);

  const openPanel = useCallback(
    (id: string) => {
      const panel = byId.get(id);
      if (!panel) return;
      if (!workspace.blocks.has(id)) {
        // back into its dock if there is one, else the first dock, else a floating window
        const home = [`dock.${panel.dock ?? 'bottom'}`, 'dock.bottom', ...workspace.groups.keys()].find((g) => workspace.groups.get(g)?.role === 'dock');
        workspace.createMetaBlock({ id, title: panel.title, role: 'panel', capabilities: panel.capabilities as MetaBlockCapabilities }, { groupId: home });
        if (!home) workspace.floatBlock(id, float);
      }
      workspace.activateBlock(id);
    },
    // byId is rebuilt each render from panels; the shape key tracks what matters here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspace, shape, float],
  );

  const resetLayout = useCallback(() => {
    resetting.current = true;
    if (storageKey)
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* storage unavailable */
      }
    setVersion((v) => v + 1);
  }, [storageKey]);

  const addPanel = useCallback<DockApi['addPanel']>(
    (panel, place) => {
      setExtras((e) => [...e.filter((p) => p.id !== panel.id), panel]);
      if (!workspace.blocks.has(panel.id)) {
        workspace.createMetaBlock({ id: panel.id, title: panel.title, role: 'panel', capabilities: panel.capabilities as MetaBlockCapabilities, meta: { description: panel.description ?? null } });
        const base = float;
        const box = rootRef.current?.getBoundingClientRect();
        const at = place?.at && box ? { x: Math.max(8, place.at.x - box.left), y: Math.max(8, place.at.y - box.top) } : { x: base.x, y: base.y };
        workspace.floatBlock(panel.id, { ...at, width: place?.width ?? 300, height: place?.height ?? 260 });
      }
      workspace.activateBlock(panel.id);
    },
    [workspace, float],
  );
  const removePanel = useCallback<DockApi['removePanel']>(
    (id) => {
      if (workspace.blocks.has(id)) workspace.removeBlock(id);
      setExtras((e) => e.filter((p) => p.id !== id));
    },
    [workspace],
  );

  const api = useMemo<DockApi>(
    () => ({ workspace, openPanel, resetLayout, openPalette: () => setPaletteOpen(true), visible, setVisible: interfaceVisibility.set, toggleVisible: interfaceVisibility.toggle, addPanel, removePanel }),
    [workspace, openPanel, resetLayout, visible, addPanel, removePanel],
  );
  const ready = useRef(onReady);
  ready.current = onReady;
  useEffect(() => void ready.current?.(api), [api]);

  // what the panels on screen offer: an Inspector's undo, presets and files
  const [offered, setOffered] = useState<readonly (readonly Command[])[]>([]);
  const addCommands = useCallback((list: readonly Command[]) => {
    setOffered((now) => [...now, list]);
    return () => setOffered((now) => now.filter((l) => l !== list));
  }, []);

  const allCommands = useMemo<Command[]>(
    () => [
      ...panels.map((p) => ({
        id: `panel.${p.id}`,
        label: p.title,
        group: 'Panels',
        keywords: `panel ${p.description ?? ''} ${(p.keywords ?? []).join(' ')}`,
        run: () => openPanel(p.id),
      })),
      { id: 'layout.undo', label: 'Undo layout change', group: 'Layout', run: () => workspace.undo() },
      { id: 'layout.redo', label: 'Redo layout change', group: 'Layout', run: () => workspace.redo() },
      { id: 'layout.reset', label: 'Reset dock layout', group: 'Layout', run: resetLayout },
      { id: 'ui.toggle', label: 'Hide interface (clean view)', group: 'View', shortcut: hideKey ? hideKey.toUpperCase() : undefined, run: interfaceVisibility.hide },
      ...offered.flat(),
      ...commands,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shape, openPanel, workspace, resetLayout, hideKey, commands, offered],
  );

  // One element per panel, reused while its content is unchanged: the workspace re-renders on
  // every focus click, drag frame and resize, and handing it the same element skips the body.
  const bodies = useRef(new Map<string, { src: ReactNode; el: ReactElement | null }>());
  const renderBlock = (block: MetaBlockInstance): ReactElement | null => {
    if (block.id === VIEWPORT) {
      const cached = bodies.current.get(VIEWPORT);
      if (cached && cached.src === viewport) return cached.el;
      // a stable full-bleed box: canvases size themselves from their parent
      const el = <div className="ar-dock__viewport">{viewport}</div>;
      bodies.current.set(VIEWPORT, { src: viewport, el });
      return el;
    }
    const panel = byId.get(block.id);
    if (!panel) return null;
    const cached = bodies.current.get(panel.id);
    if (cached && cached.src === panel.content) return cached.el;
    // keyed by panel, so a tab switch never hands one panel's error state to another
    const el = (
      <PanelIdContext.Provider key={panel.id} value={panel.id}>
        <DockContext.Provider value={api}>
          <CommandsContext.Provider value={addCommands}>
            <CommandScopeContext.Provider value={panel.title}>
              <PanelBody title={panel.title}>{panel.content}</PanelBody>
            </CommandScopeContext.Provider>
          </CommandsContext.Provider>
        </DockContext.Provider>
      </PanelIdContext.Provider>
    );
    bodies.current.set(panel.id, { src: panel.content, el });
    return el;
  };
  // the API changes with visibility: rebuild bodies so useDock() reads the current one
  useEffect(() => bodies.current.clear(), [api]);

  // in a narrow dock the tabs scroll; a newly active tab is brought into view once
  const shownTab = useRef(new Map<string, string>());
  const bringTab = (strip: HTMLElement, element: HTMLElement) => {
    if (!strip.clientWidth) return; // not laid out yet: the strip's observer calls again when it is
    const left = element.offsetLeft - strip.offsetLeft;
    if (left < strip.scrollLeft) strip.scrollLeft = left - 8;
    else if (left + element.offsetWidth > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = left + element.offsetWidth - strip.clientWidth + 8;
  };
  // a strip that changes width (a pane being laid out, narrowed or split) keeps its current tab whole
  const stripWatch = useRef<ResizeObserver | null>(null);
  useEffect(() => () => stripWatch.current?.disconnect(), []);
  const revealTab = (groupId: string, blockId: string, element: HTMLElement | null) => {
    const strip = element?.parentElement;
    if (!element || !strip) return;
    if (typeof ResizeObserver !== 'undefined') {
      stripWatch.current ??= new ResizeObserver((entries) => {
        for (const e of entries) {
          const s = e.target as HTMLElement;
          const on = s.querySelector<HTMLElement>(':scope > .is-active');
          if (on) bringTab(s, on);
        }
      });
      stripWatch.current.observe(strip); // observing a strip twice is a no-op
    }
    if (shownTab.current.get(groupId) === blockId) return;
    shownTab.current.set(groupId, blockId);
    bringTab(strip, element);
  };

  /** The edge a docked group belongs to, from its id (dock.left · dock.right · dock.bottom · dock.center). */
  const edgeOf = (groupId: string) => (groupId.startsWith('dock.') ? (groupId.slice(5) as DockEdge | 'center') : null);
  /** A group's tab style: its MetaBlock meta first (set from the tab menu and kept with the layout),
   *  then the Dock's `tabs` for its edge (or 'float'), then a strip of lines. */
  const styleOf = (group: MetaBlockGroup): DockTabStyle => {
    const own = (group.meta?.tabs ?? {}) as Partial<DockTabStyle>;
    // a dock takes its edge's style; a detached window the 'float' style while it floats; a group split
    // off and docked beside another takes the plain default until someone sets its own
    const key = group.role === 'dock' ? edgeOf(group.id) ?? 'center' : group.posture === 'floating' ? 'float' : null;
    const given = key ? tabPlacement?.[key] : undefined;
    const seed: Partial<DockTabStyle> = typeof given === 'string' ? { placement: given } : given ?? {};
    return { placement: own.placement ?? seed.placement ?? 'top', look: own.look ?? seed.look ?? 'line' };
  };

  const tabStrip = (c: GroupChromeContext, style: DockTabStyle) => {
    const side = style.placement === 'side';
    return (
      <div className="ar-dock__tabs" data-mb-tabs="true" data-look={style.look} role="tablist" aria-orientation={side ? 'vertical' : undefined} aria-label={`${c.group.title} panels`}>
        {c.blocks.map((block) => {
          const active = block.id === c.activeBlock?.id;
          const icon = byId.get(block.id)?.icon;
          // names only, on a strip or a rail; the icon look shows the panel's icon (else its initial) instead
          const mark = style.look !== 'icon' ? null : icon ? (
            <span className="ar-dock__tab-icon">{icon}</span>
          ) : (
            <span className="ar-dock__tab-icon ar-dock__tab-initial">{block.title.slice(0, 1)}</span>
          );
          return (
            <button
              key={block.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={style.look === 'icon' ? block.title : undefined}
              className={active ? 'is-active' : undefined}
              title={byId.get(block.id)?.description ?? block.title}
              ref={active ? (el) => revealTab(c.group.id, block.id, el) : undefined}
              {...c.blockProps(block.id)}
            >
              {mark}
              <span className="ar-dock__tab-label">{block.title}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const search = (rail: boolean) =>
    palette ? (
      rail ? (
        <button type="button" className="ar-dock__search ar-dock__search--rail" data-no-drag onClick={() => setPaletteOpen(true)} title="Search panels and commands" aria-label="Search panels and commands">
          {DockIcons.search}
        </button>
      ) : (
        <button type="button" className="ar-dock__search" data-no-drag onClick={() => setPaletteOpen(true)} title="Search panels and commands">
          {DockIcons.search}
          <span>Search…</span>
          <Kbd keys={['mod', 'K']} />
        </button>
      )
    ) : null;

  // a detached panel's window controls, honouring its capabilities
  const windowActions = (c: GroupChromeContext) =>
    c.activeBlock ? (
      <>
        {c.activeBlock.capabilities.popoutable === false ? null : (
          <button type="button" className="ar-tool" title="Open in a new window" onClick={() => c.blockActions.popout(c.activeBlock!.id)}>
            {DockIcons.popout}
          </button>
        )}
        {c.activeBlock.capabilities.maximizable === false ? null : (
          <button
            type="button"
            className="ar-tool"
            title={c.group.posture === 'maximized' ? 'Restore' : 'Maximize'}
            onClick={() => (c.group.posture === 'maximized' ? c.restore() : c.maximize())}
          >
            {c.group.posture === 'maximized' ? DockIcons.minimize : DockIcons.maximize}
          </button>
        )}
        <button type="button" className="ar-tool" title="Return to its dock" onClick={() => c.blockActions.returnHome(c.activeBlock!.id)}>
          {DockIcons.returnHome}
        </button>
        {c.activeBlock.capabilities.closable === false ? null : (
          <button type="button" className="ar-tool" title="Close panel" onClick={() => c.blockActions.close(c.activeBlock!.id)}>
            {DockIcons.close}
          </button>
        )}
      </>
    ) : null;

  // a dock carries the furniture (tabs, the panel's bar, search, toolbar); a detached panel gets tabs
  // and window controls. Either can wear its tabs as a strip or a rail, in any look.
  const renderGroupChrome = (c: GroupChromeContext) => {
    const style = styleOf(c.group);
    const docked = c.group.role === 'dock';
    if (style.placement === 'side')
      // a rail: the tabs down the side, search or the window controls at its foot; the panel's bar stays in the panel
      return (
        <header className="ar-dock__strip ar-dock__strip--side" data-edge={docked ? edgeOf(c.group.id) ?? 'center' : 'float'} data-look={style.look} {...c.dragHandleProps}>
          {tabStrip(c, style)}
          <div className="ar-dock__rail-foot" data-no-drag>
            {docked ? search(true) : windowActions(c)}
          </div>
        </header>
      );
    return docked ? (
      <header className="ar-dock__strip" data-look={style.look} {...c.dragHandleProps}>
        {tabStrip(c, style)}
        <PanelBarSlot panelId={c.activeBlock?.id ?? null} />
        {search(false)}
        {toolbar ? (
          <div className="ar-dock__toolbar" data-no-drag>
            {toolbar}
          </div>
        ) : null}
      </header>
    ) : (
      <header className="ar-dock__strip ar-dock__strip--window" data-look={style.look} {...c.dragHandleProps}>
        {tabStrip(c, style)}
        <div className="ar-dock__window-actions" data-no-drag>
          {windowActions(c)}
        </div>
      </header>
    );
  };

  const renderGroupFooter = (group: MetaBlockGroup) => {
    const footer = byId.get(group.activeChild ?? '')?.footer;
    return footer ? <div className="ar-dock__footer">{footer}</div> : null;
  };

  // Ctrl/⌘ Z undoes what the focus is on: a panel that handles it (values, a node graph) keeps it,
  // anywhere else it is the layout
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.defaultPrevented || !(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z' || (e.target as HTMLElement).matches('input, textarea, [contenteditable]')) return;
    e.preventDefault();
    if (e.shiftKey) workspace.redo();
    else workspace.undo();
  };

  return (
    <div ref={rootRef} className={cx('ar-dock', className)} style={style} onKeyDown={onKeyDown} data-ui-hidden={ui.hiddenBy ?? undefined} data-ui-revealing={revealing || undefined}>
      <MetaBlockWorkspaceView
        padding={10}
        gap={8}
        {...viewProps}
        canPopout
        workspace={workspace}
        renderBlock={renderBlock}
        renderGroupChrome={renderGroupChrome}
        renderGroupFooter={renderGroupFooter}
        renderContextMenu={(context) => {
          // the menu also sets how this group shows its tabs: written to its MetaBlock meta, so it is saved and travels with it
          const group = context.groupId ? workspace.groups.get(context.groupId) : undefined;
          return (
            <DockMenu
              {...context}
              tabs={group ? { value: styleOf(group), onChange: (next) => workspace.setGroupMeta(group.id, { tabs: next }) } : undefined}
            />
          );
        }}
      />
      <PopoutWindows workspace={workspace} renderBlock={renderBlock} renderFooter={renderGroupFooter} anchor={rootRef} />
      {brand ? <div className="ar-dock__brand">{brand}</div> : null}
      {/* the way back: a small mark at the foot (a frame, its panes waiting at the sides) and the key.
          Always mounted so it can arrive and leave. */}
      <div className="ar-dock__reveal" data-shown={ui.hiddenBy === 'manual' || undefined} inert={ui.hiddenBy !== 'manual' || undefined}>
        <button
          type="button"
          className="ar-dock__reveal-pill"
          onClick={interfaceVisibility.show}
          aria-label={hideKey ? `Show the interface (${hideKey.toUpperCase()})` : 'Show the interface'}
          title={hideKey ? `Show the interface · ${hideKey.toUpperCase()}` : 'Show the interface'}
        >
          <svg className="ar-dock__reveal-mark" viewBox="0 0 22 16" aria-hidden="true">
            <rect className="ar-dock__reveal-frame" x="0.75" y="0.75" width="20.5" height="14.5" rx="3.25" />
            <rect className="ar-dock__reveal-side" data-side="l" x="3.25" y="3.25" width="3.5" height="9.5" rx="1.25" />
            <rect className="ar-dock__reveal-side" data-side="r" x="15.25" y="3.25" width="3.5" height="9.5" rx="1.25" />
          </svg>
          {hideKey ? <Kbd keys={hideKey.split('+')} /> : null}
        </button>
      </div>
      {palette ? <CommandPalette commands={allCommands} open={paletteOpen} onOpenChange={setPaletteOpen} /> : null}
    </div>
  );
}

/**
 * The body every dock panel shares: a container-query scope that reports
 * `portrait` / `landscape` and the panel height, plus an error boundary so one
 * broken panel never takes the dock down.
 */
function PanelBody({ title, children }: { title: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [layout, setLayout] = useState('portrait');
  useLabelColumn(ref);
  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setLayout(width > 600 && width > height * 1.8 ? 'landscape' : 'portrait');
      ref.current?.style.setProperty('--ar-dock-panel-h', `${height}px`);
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  return (
    <section ref={ref} className="ar-dock__panel" data-ar-label-fit="" data-layout={layout} aria-label={title}>
      <PanelErrorBoundary title={title}>
        <PaneContext.Provider value={true}>{children}</PaneContext.Provider>
      </PanelErrorBoundary>
    </section>
  );
}

class PanelErrorBoundary extends Component<{ title: string; children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error(`[dock] ${this.props.title} crashed`, error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="ar-dock__error" role="alert">
        <h3>{this.props.title} could not open</h3>
        <p>{this.state.error.message}</p>
        <Button size="sm" onClick={() => this.setState({ error: null })}>
          Retry panel
        </Button>
      </div>
    );
  }
}
