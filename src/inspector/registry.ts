/* The control registry. A control says how one kind of value is drawn; every row of an Inspector,
   every useControls entry and every createPane binding finds its control here. The built-in kinds
   go through the same door, so a registered control can replace one of them. */
import type { ComponentType } from 'react';
import type { Signal } from '../core/signal';
import type { InspectItem, InspectValue } from './store';

export interface InspectControlProps<V extends InspectValue = InspectValue> {
  item: InspectItem;
  /** The value when the row drew. A `transient` control reads `signal` instead. */
  value: V;
  /** The value itself. */
  signal: Signal<V>;
  status?: 'automated' | 'bound' | 'warn' | 'fault';
  /** Change the value. */
  set: (value: V) => void;
  /** The gesture is over: one undo step. Optional; it also happens by itself. */
  commit: () => void;
  /** What the item carries in `options` (a custom item). */
  options: Record<string, unknown>;
}

export interface InspectControl<V extends InspectValue = InspectValue> {
  component: ComponentType<InspectControlProps<V>>;
  /** A value changed by dragging: writes reach the app at once and the panel when the hand settles. Default true. */
  continuous?: boolean;
  /** The control follows `signal` by itself, so the row need not render when the value moves. */
  transient?: boolean;
  /** Takes keyframes. Default false. */
  animatable?: boolean;
  /** useControls and createPane pick this control for a bare value that passes. */
  match?: (value: unknown) => boolean;
}

const registered = new Map<string, InspectControl>();

/** Add a control, or replace a built-in kind ('number', 'color', …). Returns the way to remove it. */
export function registerControl<V extends InspectValue = InspectValue>(name: string, control: InspectControl<V>) {
  const entry = control as unknown as InspectControl;
  registered.set(name, entry);
  return () => {
    if (registered.get(name) === entry) registered.delete(name);
  };
}

/** The registered control for an item's kind, if there is one. */
export const registeredControl = (item: InspectItem) => registered.get(item.kind === 'custom' ? item.control : item.kind);

/** The name of the registered control that claims a bare value. */
export function controlMatching(value: unknown) {
  for (const [name, control] of registered) if (control.match?.(value)) return name;
  return null;
}
