import type { Param, ParamStore, ParamValue, ParamValues } from '../dock/params';
import { paramValueEquals } from '../dock/params';

/** An immutable-snapshot, framework-agnostic parameter store for ARTINOS Inspector.
 * Create once, outside the React render path. Engines may also supply their own ParamStore. */
export interface InspectorStore extends ParamStore {
  get(): ParamValues;
  patch(values: Partial<ParamValues>): void;
  reset(keys?: readonly string[]): void;
}

export function createInspectorStore(params: readonly Param[], initial: Partial<ParamValues> = {}): InspectorStore {
  const defaults: ParamValues = Object.fromEntries(params.map((p) => [p.key, p.default]));
  let values: ParamValues = { ...defaults, ...initial };
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  const patch = (next: Partial<ParamValues>) => {
    const changed = Object.entries(next).filter(([key, value]) => !paramValueEquals(values[key], value));
    if (!changed.length) return;
    values = { ...values, ...Object.fromEntries(changed) };
    emit();
  };
  return {
    get: () => values,
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    set(key: string, value: ParamValue) { patch({ [key]: value }); },
    patch,
    reset(keys) {
      const selected = keys ? new Set(keys) : null;
      patch(Object.fromEntries(Object.entries(defaults).filter(([key]) => !selected || selected.has(key))));
    },
  };
}
