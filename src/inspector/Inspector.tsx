'use client';
import { useMemo, useState, useSyncExternalStore } from 'react';
// Ensure the kit builder includes the store when Inspector is selected.
export { createInspectorStore } from './store';
import type { ReactNode } from 'react';
import { Button } from '../actions/Button';
import { TextField } from '../controls/TextField';
import { ParamSection, paramShown, paramValueEquals } from '../dock/params';
import type { Param, ParamGroup, ParamStore } from '../dock/params';
import { Panel } from '../layout/Panel';
import type { PanelProps } from '../layout/Panel';
import { PanelBar } from '../dock/PanelBar';

/** Optional, Leva/Tweakpane-style inspector assembled from ARTINOS's existing controls. */
export interface InspectorProps {
  params: readonly Param[];
  groups: readonly ParamGroup[];
  store: ParamStore;
  title?: string;
  subtitle?: string;
  toolbar?: ReactNode;
  searchable?: boolean;
  advancedToggle?: boolean;
  defaultAdvanced?: boolean;
  storageKey?: string;
  hide?: readonly string[];
  maxHeight?: number | string;
  variant?: PanelProps['variant'];
  className?: string;
  emptyMessage?: string;
}

export function Inspector({
  params, groups, store, title = 'Inspector', subtitle, toolbar, searchable = true,
  advancedToggle = true, defaultAdvanced = false, storageKey, hide = [],
  maxHeight, variant = 'glass', className, emptyMessage = 'No matching properties',
}: InspectorProps) {
  const values = useSyncExternalStore(store.subscribe, store.get, store.get);
  const [query, setQuery] = useState('');
  const [advanced, setAdvanced] = useState(defaultAdvanced);
  const search = query.trim().toLocaleLowerCase();
  const hidden = useMemo(() => new Set(hide), [hide]);
  const dirty = params.filter((p) => !hidden.has(p.key) && values[p.key] !== undefined && !paramValueEquals(values[p.key], p.default));
  const shown = groups.map((group) => {
    const groupMatch = !search || [group.id, group.title].some((t) => t.toLocaleLowerCase().includes(search));
    const selected = params.filter((p) => p.group === group.id && !hidden.has(p.key) &&
      (advanced || !p.advanced) && paramShown(p, values) &&
      (groupMatch || [p.label, p.key, p.help ?? ''].some((t) => t.toLocaleLowerCase().includes(search))));
    const owner = group.switch ? params.find((p) => p.key === group.switch && !hidden.has(p.key)) : undefined;
    if (owner && selected.length && !selected.includes(owner)) selected.push(owner);
    return { group, selected };
  }).filter(({ selected }) => selected.length > 0);

  return (
    <Panel title={title} subtitle={subtitle} variant={variant} maxHeight={maxHeight} className={className ? `ar-inspector ${className}` : 'ar-inspector'}>
      {(searchable || advancedToggle || toolbar || dirty.length > 0) && (
        <PanelBar className="ar-inspector__bar">
          {searchable && <TextField type="search" label="Search properties" size="sm" placeholder="Find property…" value={query} onChange={setQuery} className="ar-inspector__search" />}
          {toolbar}
          {advancedToggle && (
            <Button size="sm" variant="ghost" aria-pressed={advanced} onClick={() => setAdvanced(!advanced)}>Advanced</Button>
          )}
          {dirty.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => dirty.forEach((p) => store.set(p.key, p.default))}>Reset {dirty.length}</Button>
          )}
        </PanelBar>
      )}
      <div className="ar-inspector__sections">
        {shown.length ? shown.map(({ group, selected }) => (
          <ParamSection
            key={group.id + (search ? ':search' : ':normal')}
            group={search ? { ...group, open: true } : group}
            params={selected}
            values={values}
            onChange={store.set}
            advanced={advanced}
            storageKey={search ? undefined : storageKey}
          />
        )) : <p className="ar-inspector__empty" role="status">{emptyMessage}</p>}
      </div>
    </Panel>
  );
}
