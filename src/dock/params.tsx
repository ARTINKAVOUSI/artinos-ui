'use client';
import { useSyncExternalStore } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Button } from '../actions/Button';
import { ColorField } from '../controls/ColorField';
import { TextField } from '../controls/TextField';
import { Vector3Field } from '../rig/Vector3Field';
import type { Vec3 } from '../rig/math';
import { Segmented } from '../controls/Segmented';
import { Select } from '../controls/Select';
import { Switch } from '../controls/Switch';
import { Section } from '../layout/Panel';
import { PropertyRow } from '../layout/PropertyRow';
import { Slider } from '../slider/Slider';
import { PanelBar } from './PanelBar';
import { createDockSections } from './sections';

/* ARTINOS params — settings from a schema, set the way the family sets them. Give a list of
   parameters (what each value is, its range, its group) and a store, and every value gets the
   control its kind calls for, every group its count, reset and on/off, and the groups sit in
   dock panes that trade sections and tear off. An app writes no control code of its own. */

export type ParamValue = number | string | boolean | Vec3;
export type ParamValues = Record<string, ParamValue>;

/** How a number reads: plain, a share shown in %, signed around 0, a count, a rate over decades, an angle. */
export type NumberFace = 'plain' | 'percent' | 'bipolar' | 'count' | 'log' | 'degrees';

interface ParamBase {
  key: string;
  label: string;
  /** The id of the ParamGroup it belongs to. */
  group: string;
  /** What changes, in a sentence: shown as the row's hint. */
  help?: string;
  /** Hidden until the pane's Advanced switch is on. */
  advanced?: boolean;
  /** Shown only while another parameter has a value. */
  when?: { key: string; is?: ParamValue; in?: readonly ParamValue[]; not?: ParamValue };
}
export type NumberParam = ParamBase & { kind: 'number'; default: number; min: number; max: number; step: number; unit?: string; face?: NumberFace };
export type ChoiceParam = ParamBase & { kind: 'choice'; default: string; options: readonly { value: string; label: string }[] };
export type ToggleParam = ParamBase & { kind: 'toggle'; default: boolean };
export type TextParam = ParamBase & { kind: 'text'; default: string; placeholder?: string; multiline?: boolean };
export type ColorParam = ParamBase & { kind: 'color'; default: string; alpha?: boolean };
export type Vector3Param = ParamBase & { kind: 'vector3'; default: Vec3; min?: number; max?: number; step?: number; decimals?: number; unit?: string };
export type Param = NumberParam | ChoiceParam | ToggleParam | TextParam | ColorParam | Vector3Param;

export function paramValueEquals(a: ParamValue | undefined, b: ParamValue | undefined): boolean {
  if (Array.isArray(a) || Array.isArray(b))
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
  return a === b;
}

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

/** Where the values live: the app's own store, read by subscription. */
export interface ParamStore {
  get(): ParamValues;
  subscribe(listener: () => void): () => void;
  set(key: string, value: ParamValue): void;
}

/** Whether a parameter is shown for these values. */
export function paramShown(p: Param, values: ParamValues): boolean {
  const w = p.when;
  if (!w) return true;
  const x = values[w.key];
  if (w.is !== undefined) return x === w.is;
  if (w.in) return w.in.includes(x);
  if (w.not !== undefined) return x !== w.not;
  return true;
}

/** The control a value calls for: a rate on a log slider, a count stepped, a share in percent, a signed value
 *  bipolar, an angle in degrees, two to four choices as a Segmented, more as a Select, a toggle as a Switch. */
export function ParamControl({ param: p, value, onChange }: { param: Param; value: ParamValue; onChange: (value: ParamValue) => void }) {
  if (p.kind === 'toggle') return <Switch label={p.label} value={Boolean(value)} onChange={onChange} />;
  if (p.kind === 'choice') {
    const options = p.options.map((o) => ({ value: o.value, label: o.label }));
    return options.length <= 4 ? (
      <Segmented label={p.label} options={options} value={String(value)} onChange={(v) => onChange(String(v))} />
    ) : (
      <Select label={p.label} options={options} value={String(value)} onChange={(v) => onChange(String(v))} appearance="well" />
    );
  }
  if (p.kind === 'text') return <TextField label={p.label} value={String(value)} placeholder={p.placeholder} multiline={p.multiline} onChange={onChange} />;
  if (p.kind === 'color') return <ColorField label={p.label} value={String(value)} alpha={p.alpha} onChange={onChange} />;
  if (p.kind === 'vector3') return <Vector3Field label={p.label} value={value as Vec3} min={p.min} max={p.max} step={p.step} decimals={p.decimals} unit={p.unit} onChange={onChange} />;
  const face = p.face ?? 'plain';
  const decimals = p.step >= 1 ? 0 : p.step >= 0.1 ? 1 : p.step >= 0.01 ? 2 : 3;
  const span = (p.max - p.min) / p.step;
  return (
    <Slider
      label={p.label}
      value={Number(value)}
      min={p.min}
      max={p.max}
      step={p.step}
      unit={face === 'percent' ? undefined : p.unit}
      decimals={face === 'percent' ? 0 : decimals}
      format={face === 'percent' ? 'percent' : face === 'degrees' ? 'angle' : 'number'}
      mapping={face === 'log' && p.min > 0 ? 'log' : 'linear'}
      bipolar={face === 'bipolar'}
      detents={face === 'bipolar' ? [0] : undefined}
      variant={face === 'count' ? 'stepped' : 'material'}
      steps={face === 'count' && span <= 12 ? Math.round(span) + 1 : undefined}
      onChange={onChange}
    />
  );
}

export interface ParamSectionProps {
  group: ParamGroup;
  params: readonly Param[];
  values: ParamValues;
  onChange: (key: string, value: ParamValue) => void;
  /** Show the parameters marked advanced. */
  advanced?: boolean;
  /** Keys never drawn as rows (an app may put one in its own toolbar, such as a pause). */
  hide?: readonly string[];
  /** Remembers the group open or closed across visits under this key + the group's id. */
  storageKey?: string;
}

/** One group of parameters as a Section: count, reset while anything differs from its default, and the
 *  group's own on/off when a toggle owns it. */
export function ParamSection({ group: g, params, values, onChange, advanced = false, hide = [], storageKey }: ParamSectionProps) {
  const mine = params.filter((p) => p.group === g.id && !hide.includes(p.key));
  const rows = mine.filter((p) => p.key !== g.switch && (advanced || !p.advanced) && paramShown(p, values));
  const changed = mine.filter((p) => values[p.key] !== undefined && !paramValueEquals(values[p.key], p.default));
  const owner = g.switch ? params.find((p) => p.key === g.switch) : undefined;
  const switchable = owner ? { enabled: Boolean(values[owner.key]), onEnabledChange: (on: boolean) => onChange(owner.key, on) } : {};
  return (
    <Section
      id={g.id}
      title={g.title}
      description={g.description}
      count={rows.length}
      modified={changed.length > 0}
      onReset={() => changed.forEach((p) => onChange(p.key, p.default))}
      storageKey={storageKey ? `${storageKey}.${g.id}` : undefined}
      defaultOpen={g.open ?? false}
      {...switchable}
    >
      {rows.map((p) => {
        const value = values[p.key] ?? p.default;
        return (
          <PropertyRow key={p.key} label={p.label} density={p.kind === 'text' || p.kind === 'vector3' ? 'compact' : 'default'} modified={!paramValueEquals(value, p.default)} onReset={() => onChange(p.key, p.default)}>
            <ParamControl param={p} value={value} onChange={(v) => onChange(p.key, v)} />
          </PropertyRow>
        );
      })}
    </Section>
  );
}

export interface ParamPanesOptions {
  params: readonly Param[];
  groups: readonly ParamGroup[];
  /** Which groups start in which pane: { physics: ['solver', 'matter'], look: ['optics'] }. */
  panes: Record<string, readonly string[]>;
  store: ParamStore;
  /** Remembers each group open or closed. */
  storageKey?: string;
  hide?: readonly string[];
}

export interface ParamPanes {
  /** A pane of groups with its bar (Advanced, Reset): put it in a Dock panel's content, or in a Panel. */
  Pane: (props: { id: string; label?: string; toolbar?: ReactNode }) => ReactElement;
}

const RESET = (
  <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 7a4 4 0 104-4H4.5M4.5 1.5V3H6" />
  </svg>
);

/**
 * Settings panes from a schema. Call once, outside your components. Each pane holds its groups as dockable sections:
 * drag a group into another pane, or out over open space to tear it off into its own panel. One Advanced switch serves
 * every pane; each pane's Reset puts back what it holds.
 */
export function createParamPanes({ params, groups, panes, store, storageKey, hide = [] }: ParamPanesOptions): ParamPanes {
  const byId = new Map(groups.map((g) => [g.id, g]));
  let advanced = false;
  const listeners = new Set<() => void>();
  const setAdvanced = (on: boolean) => {
    advanced = on;
    for (const l of listeners) l();
  };
  const subscribeAdvanced = (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  };
  const useValues = () => useSyncExternalStore(store.subscribe, store.get, store.get);
  const useAdvanced = () => useSyncExternalStore(subscribeAdvanced, () => advanced, () => false);

  function GroupBody({ id }: { id: string }) {
    const values = useValues();
    const on = useAdvanced();
    const g = byId.get(id);
    if (!g) return null;
    return <ParamSection group={g} params={params} values={values} onChange={store.set} advanced={on} hide={hide} storageKey={storageKey} />;
  }

  const sections = createDockSections({
    panes: Object.fromEntries(Object.entries(panes).map(([k, v]) => [k, [...v]])),
    render: (id) => <GroupBody id={id} />,
    title: (id) => byId.get(id)?.title ?? id,
  });

  function Pane({ id, label, toolbar }: { id: string; label?: string; toolbar?: ReactNode }) {
    const values = useValues();
    const on = useAdvanced();
    const held = new Set(panes[id] ?? []);
    const changed = params.filter((p) => held.has(p.group) && !hide.includes(p.key) && values[p.key] !== undefined && !paramValueEquals(values[p.key], p.default));
    return (
      <>
        <PanelBar>
          {toolbar}
          <Button size="sm" variant="ghost" aria-pressed={on} icon={<i className="ar-led" data-on={on ? '' : undefined} />} onClick={() => setAdvanced(!on)}>
            Advanced
          </Button>
          <span className="ar-panel-bar__spacer" />
          {changed.length ? (
            <Button size="sm" variant="ghost" icon={RESET} onClick={() => changed.forEach((p) => store.set(p.key, p.default))}>
              {`Reset ${changed.length}`}
            </Button>
          ) : null}
        </PanelBar>
        <sections.Pane id={id} label={label} />
      </>
    );
  }

  return { Pane };
}
