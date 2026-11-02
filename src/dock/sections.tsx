'use client';
import { Fragment, useEffect, useSyncExternalStore, type ReactElement, type ReactNode } from 'react';
import { moveBetween } from '../core/sortable';
import type { SortPlace } from '../core/sortable';
import { SectionCards, SectionGroup } from '../layout/Panel';
import type { MetaBlockWorkspace } from './metablock/workspace';
import { TEAR_PREFIX, useDock } from './Dock';
import type { DockApi } from './Dock';

/* ARTINOS dock sections — sections that live in a workspace's panes, the way panels live in its
   docks. Drag a section by its heading into another pane; drag it out over open space and it
   tears off into its own floating panel there; drag it back into any pane and the empty panel
   closes. Close a torn-off panel and its section goes home. The arrangement is kept here, so
   every pane and torn-off panel shows the same one. */

export interface DockSectionsOptions {
  /** Which sections start in which pane: `{ inspector: ['material', 'lens'], effects: ['post'] }`. */
  panes: Record<string, string[]>;
  /** Draws a section by its id: a `<Section>`. */
  render: (id: string) => ReactNode;
  /** A torn-off panel's title. Default: the id. */
  title?: (id: string) => string;
  /** The drag group every pane of this set shares. Default: a name of its own. */
  group?: string;
}

export interface DockSections {
  /** One pane's sections: put `<Pane id="inspector" />` in a Dock panel's content. */
  Pane: (props: { id: string; label?: string }) => ReactElement;
  /** Where every section is now (torn-off panels are keyed by their panel id). */
  get: () => Readonly<Record<string, readonly string[]>>;
  subscribe: (listener: () => void) => () => void;
}

let sets = 0;

export function createDockSections(options: DockSectionsOptions): DockSections {
  const group = options.group ?? `ar-dock-sections-${++sets}`;
  const home = new Map<string, string>();
  for (const [pane, ids] of Object.entries(options.panes)) for (const id of ids) home.set(id, pane);
  let lists: Record<string, string[]> = Object.fromEntries(Object.entries(options.panes).map(([k, v]) => [k, [...v]]));
  const listeners = new Set<() => void>();
  const publish = (next: Record<string, string[]>) => {
    lists = next;
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  const get = () => lists;

  /** Torn-off panels left empty close. */
  const closeEmpty = (dock: DockApi) => {
    for (const [pane, ids] of Object.entries(lists)) {
      if (!pane.startsWith(TEAR_PREFIX) || ids.length) continue;
      const next = { ...lists };
      delete next[pane];
      publish(next);
      dock.removePanel(pane);
    }
  };

  const move = (from: SortPlace, to: SortPlace, dock: DockApi) => {
    publish(moveBetween(lists, from, to));
    closeEmpty(dock);
  };

  const tearOff = (from: SortPlace, at: { x: number; y: number }, dock: DockApi) => {
    const id = lists[from.list]?.[from.index];
    if (id === undefined) return;
    const pane = TEAR_PREFIX + id;
    // already alone in its own panel: that panel moves by its strip, not by its section
    if (from.list === pane) return;
    publish(moveBetween({ ...lists, [pane]: [] }, from, { list: pane, index: 0 }));
    closeEmpty(dock);
    dock.addPanel(
      { id: pane, title: options.title?.(id) ?? id, dock: 'float', content: <Pane id={pane} label={options.title?.(id) ?? id} /> },
      { at: { x: at.x - 48, y: at.y - 18 }, width: 300 },
    );
  };

  // a torn-off panel closed by its window button: its sections go back to their home panes
  const watched = new WeakSet<MetaBlockWorkspace>();
  const watch = (dock: DockApi) => {
    const ws = dock.workspace;
    if (watched.has(ws)) return;
    watched.add(ws);
    ws.on('block:remove', (event: { block?: { id?: string } }) => {
      const pane = event?.block?.id;
      if (!pane || !pane.startsWith(TEAR_PREFIX) || !lists[pane]?.length) return;
      const next = { ...lists };
      for (const id of next[pane]) {
        const back = home.get(id) ?? Object.keys(options.panes)[0];
        next[back] = [...(next[back] ?? []), id];
      }
      delete next[pane];
      publish(next);
    });
  };

  function Pane({ id, label }: { id: string; label?: string }) {
    const dock = useDock();
    const now = useSyncExternalStore(subscribe, get, get);
    useEffect(() => watch(dock), [dock]);
    return (
      <SectionCards.Provider value={true}>
      <SectionGroup id={id} group={group} label={label} onMove={(from, to) => move(from, to, dock)} onTearOff={(from, at) => tearOff(from, at, dock)}>
        {(now[id] ?? []).map((sid) => (
          <Fragment key={sid}>{options.render(sid)}</Fragment>
        ))}
      </SectionGroup>
      </SectionCards.Provider>
    );
  }

  return { Pane, get, subscribe };
}
