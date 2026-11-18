/* The short way to say what a panel holds. A bare value picks its own control, an object says more:

     speed: 1                                       a number field
     gain: { value: 0.5, min: 0, max: 1 }           a slider
     live: true                                     a switch
     tint: '#4fd1ba'                                a colour
     name: 'Prism'                                  a text field
     quality: { value: 'high', options: ['low', 'high'] }
     position: [0, 0, 0]                            a vector
     light: [0.2, 0.4]                              a pad
     band: { value: [20, 80], min: 0, max: 100 }    a range
     dial: { value: 0.5, control: 'dial' }          a registered control
     fps: monitor(() => stats.fps, { graph: true }) a read-out
     reset: () => restart()                         a button
     Look: folder({ glow: 2 })                      a folder
*/
import type { NumberFace } from '../dock/params';
import { controlMatching } from '../inspector/registry';
import type { InspectFolder, InspectItem, InspectMonitor, InspectValue } from '../inspector/store';

type Common = Partial<Pick<InspectItem, 'label' | 'help' | 'when' | 'locked'>>;

export interface ControlOptions<V = unknown> extends Common {
  value: V;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  face?: NumberFace;
  options?: readonly (string | { value: string; label: string })[];
  /** A control added with registerControl. */
  control?: string;
  /** Handed to a registered control. */
  props?: Record<string, unknown>;
  check?: InspectItem['check'];
  xRange?: [number, number];
  yRange?: [number, number];
}

const MONITOR = Symbol('artinos.monitor');
const FOLDER = Symbol('artinos.folder');

export interface MonitorEntry {
  [MONITOR]: true;
  read: () => number;
  options: MonitorOptions;
}
export type MonitorOptions = Partial<Pick<InspectMonitor, 'label' | 'help' | 'min' | 'max' | 'unit' | 'decimals' | 'graph' | 'interval' | 'budget'>>;

export interface FolderEntry<S extends ControlSchema = ControlSchema> {
  [FOLDER]: true;
  schema: S;
  open: boolean;
}

export type ControlEntry = number | boolean | string | readonly number[] | (() => void) | ControlOptions | MonitorEntry | FolderEntry;
export type ControlSchema = { readonly [key: string]: ControlEntry };

/** A read-out of something the app reports. */
export const monitor = (read: () => number, options: MonitorOptions = {}): MonitorEntry => ({ [MONITOR]: true, read, options });
/** A folder of rows. Its keys share the panel's values, flat. */
export const folder = <S extends ControlSchema>(schema: S, { open = true }: { open?: boolean } = {}): FolderEntry<S> => ({ [FOLDER]: true, schema, open });

type Widen<V> = V extends number ? number : V extends boolean ? boolean : V extends string ? string : V extends readonly number[] ? number[] : V;
type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
type Flat<T> = { [K in keyof T]: T[K] };
type Holding<S> = { [K in keyof S as S[K] extends (() => void) | MonitorEntry | FolderEntry ? never : K]: S[K] extends { value: infer V } ? Widen<V> : Widen<S[K]> };
type FoldersOf<S> = { [K in keyof S]: S[K] extends FolderEntry<infer F> ? ValuesOf<F> : never }[keyof S];
/** The values a schema holds, folders flattened. */
export type ValuesOf<S> = Flat<Holding<S> & ([FoldersOf<S>] extends [never] ? unknown : UnionToIntersection<FoldersOf<S>>)>;

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
export const nameOf = (key: string) => key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** One entry as the row it describes. Bare values that nothing claims throw: a typo should say so. */
export function itemFor(key: string, entry: Exclude<ControlEntry, MonitorEntry | FolderEntry>, folderId?: string): InspectItem {
  const base = { key, label: nameOf(key), folder: folderId };
  if (typeof entry === 'function') return { ...base, kind: 'action', run: entry };
  const given = (typeof entry === 'object' && !Array.isArray(entry) ? entry : { value: entry }) as unknown as ControlOptions;
  const { value, min, max, step, unit, face, options, control, props, check, xRange, yRange, label, help, when, locked } = given;
  const row = { ...base, ...(label ? { label } : null), help, when, locked, check };
  const claimed = control ?? controlMatching(value);
  if (claimed) return { ...row, kind: 'custom', control: claimed, default: value as InspectValue, options: props };
  if (options) {
    const list = options.map((o) => (typeof o === 'string' ? { value: o, label: nameOf(o) } : o));
    return { ...row, kind: 'choice', default: String(value), options: list };
  }
  if (typeof value === 'number') return { ...row, kind: 'number', default: value, min, max, step, unit, face };
  if (typeof value === 'boolean') return { ...row, kind: 'toggle', default: value };
  if (typeof value === 'string') return HEX.test(value) ? { ...row, kind: 'color', default: value } : { ...row, kind: 'text', default: value };
  if (Array.isArray(value) && value.every((v) => typeof v === 'number')) {
    if (value.length === 3) return { ...row, kind: 'vector', default: value as [number, number, number], min, max, step, unit };
    if (value.length === 2 && min !== undefined && max !== undefined) return { ...row, kind: 'range', default: value as [number, number], min, max, step, unit };
    if (value.length === 2) return { ...row, kind: 'point', default: value as [number, number], xRange, yRange };
  }
  throw new Error(`ARTINOS controls: no control for "${key}". Give it a value of a known shape, or name a registered control.`);
}

/** A schema as the rows and folders of an Inspector. */
export function readSchema(schema: ControlSchema, parent?: string, path = '') {
  const items: InspectItem[] = [];
  const folders: InspectFolder[] = [];
  for (const [key, entry] of Object.entries(schema)) {
    if (typeof entry === 'object' && entry !== null && FOLDER in entry) {
      const id = `${path}${key}`;
      folders.push({ id, title: nameOf(key), parent, open: entry.open });
      const inner = readSchema(entry.schema, id, `${id}/`);
      items.push(...inner.items);
      folders.push(...inner.folders);
    } else if (typeof entry === 'object' && entry !== null && MONITOR in entry) {
      items.push({ key, label: nameOf(key), folder: parent, kind: 'monitor', read: entry.read, ...entry.options });
    } else {
      items.push(itemFor(key, entry as Exclude<ControlEntry, MonitorEntry | FolderEntry>, parent));
    }
  }
  return { items, folders };
}
