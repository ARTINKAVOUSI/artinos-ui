'use client';
import type { ReactElement, ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { Button } from '../actions/Button';
import { signal } from '../core/signal';
import { useSignalValue } from '../core/useSignal';
import { InspectorFolder, ValueHistory } from '../inspector/Inspector';
import { createInspectorStore, isField, sameValue } from '../inspector/store';
import type { InspectFolder, InspectItem, InspectorStore, NumberFace } from '../inspector/store';
import { PanelBar } from './PanelBar';
import { createDockSections } from './sections';

/* ARTINOS params — settings from a schema, in panes that trade sections. A parameter is an Inspector
   item with a group, its values live in an Inspector store and each group is an Inspector folder, so
   settings get the same controls, rows, undo and files as every other panel. What this adds is the
   arrangement: groups sit in dock panes, drag between them and tear off, under one Advanced switch. */

export type ParamValue = number | string | boolean;
export type ParamValues = Record<string, ParamValue>;
export type { NumberFace };

interface ParamBase {
  key: string;
  label: string;
  /** The id of the ParamGroup it belongs to. */
  group: string;
  /** What changes, in a sentence: the row's tooltip. */
  help?: string;
  /** Hidden until the pane's Advanced switch is on. */
  advanced?: boolean;
  /** Shown only while another parameter has a value. */
  when?: { key: string; is?: ParamValue; in?: readonly ParamValue[]; not?: ParamValue };
}
export type NumberParam = ParamBase & { kind: 'number'; default: number; min: number; max: number; step: number; unit?: string; face?: NumberFace };
export type ChoiceParam = ParamBase & { kind: 'choice'; default: string; options: readonly { value: string; label: string }[] };
export type ToggleParam = ParamBase & { kind: 'toggle'; default: boolean };
export type Param = NumberParam | ChoiceParam | ToggleParam;

export interface ParamGroup {
  id: string;
  title: string;
  /** A quiet line at the top of the group: what it does. */
  description?: ReactNode;
  /** A toggle parameter that turns the whole group on or off: it becomes the group's LED, not a row. */
  switch?: string;
  /** Open at first (each group remembers its own state after that). Default false. */
  open?: boolean;
}

/** Where the values live when the app keeps them itself. Leave it out and the panes keep them. */
export interface ParamStore {
  get(): ParamValues;
  subscribe(listener: () => void): () => void;
  set(key: string, value: ParamValue): void;
}

export interface ParamPanesOptions {
  params: readonly Param[];
  groups: readonly ParamGroup[];
  /** Which groups start in which pane: { physics: ['solver', 'matter'], look: ['optics'] }. */
  panes: Record<string, readonly string[]>;
  store?: ParamStore;
  /** Remembers each group open or closed. */
  storageKey?: string;
  hide?: readonly string[];
}

export interface ParamPanes {
  /** A pane of groups with its bar (Advanced, Undo, Reset): put it in a Dock panel's content, or in a Panel. */
  Pane: (props: { id: string; label?: string; toolbar?: ReactNode }) => ReactElement;
  /** The values, with everything a store does: undo, files, presets, signals. */
  store: InspectorStore;
}

const RESET = (
  <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 7a4 4 0 104-4H4.5M4.5 1.5V3H6" />
  </svg>
);

/** A parameter as the Inspector item it is. */
function itemOf({ group, when, ...param }: Param): InspectItem {
  const shown = when
    ? (values: Record<string, unknown>) => {
        const x = values[when.key] as ParamValue;
        if (when.is !== undefined) return x === when.is;
        if (when.in) return when.in.includes(x);
        return when.not === undefined || x !== when.not;
      }
    : undefined;
  return { ...param, folder: group, when: shown } as InspectItem;
}

/**
 * Settings panes from a schema. Call once, outside your components. Each pane holds its groups as dockable sections:
 * drag a group into another pane, or out over open space to tear it off into its own panel. One Advanced switch serves
 * every pane; each pane's Reset puts back what it holds.
 */
export function createParamPanes({ params, groups, panes, store, storageKey, hide = [] }: ParamPanesOptions): ParamPanes {
  const items = params.map(itemOf);
  const folders: InspectFolder[] = groups.map((g) => ({ id: g.id, title: g.title, description: g.description, switch: g.switch, open: g.open ?? false, count: true }));
  const titles = new Map(groups.map((g) => [g.id, g.title]));
  const advanced = signal(false);

  // the app's own store is the object the values are bound to
  let writing = false;
  const target = store
    ? (new Proxy(
        {},
        {
          get: (_, key) => store.get()[key as string],
          set(_, key, value) {
            writing = true;
            store.set(key as string, value);
            writing = false;
            return true;
          },
        },
      ) as Record<string, unknown>)
    : undefined;
  const values = createInspectorStore(items, { target });
  store?.subscribe(() => {
    if (!writing) values.pull(true);
  });

  function GroupBody({ id }: { id: string }) {
    const on = useSignalValue(advanced);
    return <InspectorFolder id={id} items={items} folders={folders} store={values} advanced={on} hide={hide} keyframes={false} storageKey={storageKey} />;
  }

  const sections = createDockSections({
    panes: Object.fromEntries(Object.entries(panes).map(([k, v]) => [k, [...v]])),
    render: (id) => <GroupBody id={id} />,
    title: (id) => titles.get(id) ?? id,
  });

  function Pane({ id, label, toolbar }: { id: string; label?: string; toolbar?: ReactNode }) {
    const st = useSyncExternalStore(values.subscribe, values.state, values.state);
    const on = useSignalValue(advanced);
    const held = new Set(panes[id] ?? []);
    const changed = items.filter((p) => isField(p) && held.has(p.folder ?? '') && !hide.includes(p.key) && !sameValue(st.values[p.key], p.default));
    return (
      <>
        <PanelBar>
          {toolbar}
          <Button size="sm" variant="ghost" aria-pressed={on} icon={<i className="ar-led" data-on={on ? '' : undefined} />} onClick={() => advanced.set(!on)}>
            Advanced
          </Button>
          <span className="ar-panel-bar__spacer" />
          <ValueHistory store={values} />
          {changed.length ? (
            <Button size="sm" variant="ghost" icon={RESET} onClick={() => values.reset(changed.map((p) => p.key))}>
              {`Reset ${changed.length}`}
            </Button>
          ) : null}
        </PanelBar>
        <sections.Pane id={id} label={label} />
      </>
    );
  }

  return { Pane, store: values };
}
