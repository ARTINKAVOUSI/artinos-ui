'use client';
import { Component, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { Button } from '../actions/Button';
import { Kbd } from '../actions/Kbd';
import { cx } from '../core/utils';
import { CommandPalette } from '../overlays/CommandPalette';
import type { Command } from '../overlays/CommandPalette';
import { DockMenu } from './DockMenu';
import { DockIcons } from './icons';
import { PanelBarSlot, PanelIdContext } from './PanelBar';
import { useWorkspaceRevision } from './metablock/hooks';
import type { MetaBlockGroup, MetaBlockInstance } from './metablock/types';
import { MetaBlockWorkspace } from './metablock/workspace';
import { MetaBlockWorkspaceView } from './metablock/WorkspaceView';
import type { GroupChromeContext, MetaBlockWorkspaceViewProps } from './metablock/WorkspaceView';

/* ARTINOS Dock — a studio workspace in one component. Panels live in docks on the
   left, right and bottom edges, as tabs; any of them can be dragged out to float,
   split, re-docked, merged, maximized or sent back home, and the arrangement can be
   saved. An optional viewport (a 3D canvas, a video) fills the space behind them.
   It is built on the MetaBlock engine (./metablock) and themed by the --ar-* tokens. */

export type DockEdge = 'left' | 'right' | 'bottom';

export interface DockPanel {
  /** Unique and stable: the saved layout is keyed by it. */
  id: string;
  title: string;
  /** One line about the panel: the tab tooltip, and searchable in the palette. */
  description?: string;
  /** Extra search words for the command palette. */
  keywords?: string[];
  /** Starting place. Default 'bottom'. */
  dock?: DockEdge | 'float';
  /** The tab shown first in its dock. */
  active?: boolean;
  content: ReactNode;
  /** Quiet status line along the panel's foot. */
  footer?: ReactNode;
}

export interface DockApi {
  workspace: MetaBlockWorkspace;
  /** Show a panel: back into its dock (or floating) if it was closed, then active. */
  openPanel: (id: string) => void;
  /** Forget the saved arrangement and start from the panels' defaults. */
  resetLayout: () => void;
  openPalette: () => void;
  /** Interface shown (false when hidden with the hide key). */
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export interface DockProps {
  panels: readonly DockPanel[];
  /** Fills the workspace behind the docks: a canvas, video or image. */
  viewport?: ReactNode;
  /** localStorage key to save and restore the arrangement. Omit to start fresh each time. */
  storageKey?: string;
  /** Dock sizes as a fraction of the workspace. Default left .22 · right .24 · bottom .36. */
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
  /** Key that hides / shows the docks (the viewport stays). Off by default; e.g. 'h'. */
  hideKey?: string | null;
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

const DockContext = createContext<DockApi | null>(null);

/** The surrounding Dock's API, for use inside a panel. */
export function useDock(): DockApi {
  const api = useContext(DockContext);
  if (!api) throw new Error('useDock() must be used inside a <Dock> panel.');
  return api;
}

/** Keys typed into a field, list or slider are for that control, not the dock. */
const typingTarget = (target: EventTarget | null) =>
  target instanceof Element &&
  !!target.closest(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="combobox"], [role="listbox"], [role="menu"], [role="slider"], [role="spinbutton"], [role="textbox"]',
  );

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
  const byDock = new Map<DockEdge, DockPanel[]>();
  const floating: DockPanel[] = [];
  for (const panel of panels) {
    if (panel.dock === 'float') floating.push(panel);
    else byDock.set(panel.dock ?? 'bottom', [...(byDock.get(panel.dock ?? 'bottom') ?? []), panel]);
  }
  for (const [edge, members] of byDock) {
    const groupId = `dock.${edge}`;
    workspace.createGroup({ id: groupId, title: edge[0].toUpperCase() + edge.slice(1), role: 'dock', meta: { persistentContainer: true } });
    // meta is structured-cloned for undo and persistence, so it stays JSON-safe
    for (const p of members) workspace.createMetaBlock({ id: p.id, title: p.title, role: 'panel', meta: { description: p.description ?? null } }, { groupId });
    workspace.dockGroup(groupId, { area: edge, size: o.sizes[edge] });
    const first = members.find((p) => p.active) ?? members[0];
    if (first) workspace.activateBlock(first.id);
  }
  for (const p of floating) {
    workspace.createMetaBlock({ id: p.id, title: p.title, role: 'panel' });
    workspace.floatBlock(p.id, o.float);
  }

  if (o.storageKey) {
    try {
      const raw = localStorage.getItem(o.storageKey);
      const snapshot = raw ? JSON.parse(raw) : null;
      const known = new Set(panels.map((p) => p.id).concat(o.viewport ? [VIEWPORT] : []));
      const saved: string[] = (snapshot?.blocks ?? []).map((b: MetaBlockInstance) => b.id);
      // a removed panel must not come back as an empty tab: restore only if every saved tab still exists
      if (saved.length && saved.every((id) => known.has(id))) {
        workspace.restore(snapshot);
        // no pop-out windows here: a group saved popped out would stay invisible
        for (const groupId of [...workspace.popouts.keys()])
          workspace.reattachPopout(groupId, { area: 'bottom', targetGroupId: workspace.groups.has('dock.bottom') ? 'dock.bottom' : null });
        // panels added since join their dock
        for (const p of panels) {
          if (workspace.blocks.has(p.id)) continue;
          const groupId = `dock.${p.dock ?? 'bottom'}`;
          const docked = workspace.groups.get(groupId)?.role === 'dock';
          workspace.createMetaBlock(
            { id: p.id, title: p.title, role: 'panel', meta: { description: p.description ?? null } },
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
  hideKey = null,
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
  const byId = new Map(panels.map((p) => [p.id, p]));
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [visible, setVisible] = useState(true);

  // persist the arrangement once a change settles; drags, resizes and focus clicks stay off storage
  useEffect(() => {
    resetting.current = false;
    if (!storageKey) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      timer = undefined;
      if (resetting.current) return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(workspace.serialize()));
      } catch {
        /* quota or private mode */
      }
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
        workspace.createMetaBlock({ id, title: panel.title, role: 'panel' }, { groupId: home });
        if (!home) workspace.floatBlock(id, floatBounds ?? DEFAULT_FLOAT);
      }
      workspace.activateBlock(id);
    },
    // byId is rebuilt each render from panels; the shape key tracks what matters here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspace, shape, floatBounds],
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

  const api = useMemo<DockApi>(
    () => ({ workspace, openPanel, resetLayout, openPalette: () => setPaletteOpen(true), visible, setVisible }),
    [workspace, openPanel, resetLayout, visible],
  );
  const ready = useRef(onReady);
  ready.current = onReady;
  useEffect(() => ready.current?.(api), [api]);

  // the hide key toggles the docks; the viewport stays
  useEffect(() => {
    if (!hideKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.isComposing || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typingTarget(e.target)) return;
      if (e.key.toLowerCase() === hideKey.toLowerCase()) setVisible((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hideKey]);

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
      ...(hideKey
        ? [{ id: 'ui.toggle', label: 'Hide / show interface', group: 'View', shortcut: hideKey.toUpperCase(), run: () => setVisible((v) => !v) }]
        : []),
      ...commands,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shape, openPanel, workspace, resetLayout, hideKey, commands],
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
          <PanelBody title={panel.title}>{panel.content}</PanelBody>
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
  const revealTab = (groupId: string, blockId: string, element: HTMLElement | null) => {
    const strip = element?.parentElement;
    if (!element || !strip || shownTab.current.get(groupId) === blockId) return;
    shownTab.current.set(groupId, blockId);
    const left = element.offsetLeft - strip.offsetLeft;
    if (left < strip.scrollLeft) strip.scrollLeft = left - 8;
    else if (left + element.offsetWidth > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = left + element.offsetWidth - strip.clientWidth + 8;
  };

  const tabStrip = (c: GroupChromeContext) => (
    <div className="ar-dock__tabs" data-mb-tabs="true" role="tablist" aria-label={`${c.group.title} panels`}>
      {c.blocks.map((block) => {
        const active = block.id === c.activeBlock?.id;
        return (
          <button
            key={block.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={active ? 'is-active' : undefined}
            title={byId.get(block.id)?.description ?? block.title}
            ref={active ? (el) => revealTab(c.group.id, block.id, el) : undefined}
            {...c.blockProps(block.id)}
          >
            <span className="ar-dock__tab-label">{block.title}</span>
          </button>
        );
      })}
    </div>
  );

  // a dock carries the furniture (tabs, the panel's bar, search, toolbar); a detached panel gets tabs and window controls
  const renderGroupChrome = (c: GroupChromeContext) =>
    c.group.role === 'dock' ? (
      <header className="ar-dock__strip" {...c.dragHandleProps}>
        {tabStrip(c)}
        <PanelBarSlot panelId={c.activeBlock?.id ?? null} />
        {palette ? (
          <button type="button" className="ar-dock__search" data-no-drag onClick={() => setPaletteOpen(true)} title="Search panels and commands">
            {DockIcons.search}
            <span>Search…</span>
            <Kbd keys={['mod', 'K']} />
          </button>
        ) : null}
        {toolbar ? (
          <div className="ar-dock__toolbar" data-no-drag>
            {toolbar}
          </div>
        ) : null}
      </header>
    ) : (
      <header className="ar-dock__strip ar-dock__strip--window" {...c.dragHandleProps}>
        {tabStrip(c)}
        <div className="ar-dock__window-actions" data-no-drag>
          {c.activeBlock ? (
            <>
              <button
                type="button"
                title={c.group.posture === 'maximized' ? 'Restore' : 'Maximize'}
                onClick={() => (c.group.posture === 'maximized' ? c.restore() : c.maximize())}
              >
                {c.group.posture === 'maximized' ? DockIcons.minimize : DockIcons.maximize}
              </button>
              <button type="button" title="Return to its dock" onClick={() => c.blockActions.returnHome(c.activeBlock!.id)}>
                {DockIcons.returnHome}
              </button>
              <button type="button" title="Close panel" onClick={() => c.blockActions.close(c.activeBlock!.id)}>
                {DockIcons.close}
              </button>
            </>
          ) : null}
        </div>
      </header>
    );

  const renderGroupFooter = (group: MetaBlockGroup) => {
    const footer = byId.get(group.activeChild ?? '')?.footer;
    return footer ? <div className="ar-dock__footer">{footer}</div> : null;
  };

  return (
    <div className={cx('ar-dock', className)} style={style} data-ui-hidden={!visible || undefined}>
      <MetaBlockWorkspaceView
        padding={10}
        gap={8}
        {...viewProps}
        workspace={workspace}
        renderBlock={renderBlock}
        renderGroupChrome={renderGroupChrome}
        renderGroupFooter={renderGroupFooter}
        renderContextMenu={(context) => <DockMenu {...context} />}
      />
      {brand ? <div className="ar-dock__brand">{brand}</div> : null}
      {!visible && hideKey ? <div className="ar-dock__hint">Press {hideKey.toUpperCase()} to show the interface</div> : null}
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
    <section ref={ref} className="ar-dock__panel" data-layout={layout} aria-label={title}>
      <PanelErrorBoundary title={title}>{children}</PanelErrorBoundary>
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
