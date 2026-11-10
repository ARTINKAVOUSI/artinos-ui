/* Settings from a schema: a fluid engine's settings as data, and the panes the kit builds from them.
   The app writes no control code. */
import { createParamPanes } from '../../../src';
import type { Param, ParamGroup, ParamStore, ParamValues } from '../../../src';

const GROUPS: ParamGroup[] = [
  { id: 'solver', title: 'Solver', open: true },
  { id: 'matter', title: 'Matter', open: true },
  { id: 'heat', title: 'Heat', switch: 'thermal', description: 'Temperature, melting and boiling.' },
  { id: 'optics', title: 'Optics', open: true },
  { id: 'camera', title: 'Camera' },
];

const PARAMS: Param[] = [
  { key: 'solver', label: 'Solver', group: 'solver', kind: 'choice', default: 'dfsph', options: [{ value: 'dfsph', label: 'DFSPH' }, { value: 'flip', label: 'FLIP' }, { value: 'mpm', label: 'MLS-MPM' }] },
  { key: 'substeps', label: 'Substeps', group: 'solver', kind: 'number', default: 3, min: 1, max: 8, step: 1, face: 'count' },
  { key: 'timeScale', label: 'Time scale', group: 'solver', kind: 'number', default: 1, min: 0.1, max: 4, step: 0.01, unit: '×', face: 'log' },
  { key: 'quality', label: 'Quality', group: 'solver', kind: 'choice', default: 'high', options: [{ value: 'interactive', label: 'Interactive' }, { value: 'high', label: 'High' }, { value: 'ultra', label: 'Ultra' }] },
  { key: 'tension', label: 'Surface tension', group: 'matter', kind: 'number', default: 0.2, min: 0, max: 1, step: 0.001 },
  { key: 'cohesion', label: 'Cohesion', group: 'matter', kind: 'number', default: 0.4, min: 0, max: 1, step: 0.01, face: 'percent' },
  { key: 'viscosity', label: 'Viscosity', group: 'matter', kind: 'number', default: 2, min: 0.01, max: 100, step: 0.01, unit: '×', face: 'log' },
  { key: 'buoyancy', label: 'Buoyancy', group: 'matter', kind: 'number', default: 0, min: -1, max: 1, step: 0.01, face: 'bipolar' },
  { key: 'thermal', label: 'Thermal', group: 'heat', kind: 'toggle', default: false },
  { key: 'cooling', label: 'Cooling', group: 'heat', kind: 'number', default: 0.04, min: 0, max: 1, step: 0.001, unit: '1/s' },
  { key: 'ior', label: 'Refraction', group: 'optics', kind: 'number', default: 1.33, min: 1, max: 2.4, step: 0.01 },
  { key: 'absorption', label: 'Absorption', group: 'optics', kind: 'number', default: 0.3, min: 0, max: 1, step: 0.01, face: 'percent' },
  { key: 'caustics', label: 'Caustics', group: 'optics', kind: 'toggle', default: true },
  { key: 'fov', label: 'Field of view', group: 'camera', kind: 'number', default: 35, min: 10, max: 90, step: 1, face: 'degrees' },
];

let values: ParamValues = Object.fromEntries(PARAMS.map((p) => [p.key, p.default]));
const listeners = new Set<() => void>();
const store: ParamStore = {
  get: () => values,
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  set(key, v) {
    values = { ...values, [key]: v };
    listeners.forEach((l) => l());
  },
};

/** The fluid engine's settings as panes of sections; the workspace docks them as Physics and Look. */
export const settings = createParamPanes({ params: PARAMS, groups: GROUPS, panes: { physics: ['solver', 'matter', 'heat'], look: ['optics', 'camera'] }, store, storageKey: 'artinos-showcase.params' });
