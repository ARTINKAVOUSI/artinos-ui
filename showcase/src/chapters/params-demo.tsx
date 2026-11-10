/* The Workspace chapter's settings-from-a-schema demo: a fluid engine's settings as data, and the panes the kit
   builds from them. The app below writes no control code. */
import { createParamPanes, Dock } from '../../../src';
import type { DockPanel, Param, ParamGroup, ParamStore, ParamValues } from '../../../src';
import { BACKDROPS } from '../shared';

const mark = (d: string) => (
  <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const GROUPS: ParamGroup[] = [
  { id: 'solver', title: 'Solver', icon: mark('M3.5 3.5h7v7h-7zM5.5 1.5v2M8.5 1.5v2M5.5 10.5v2M8.5 10.5v2'), open: true },
  { id: 'matter', title: 'Matter', icon: mark('M7 1.8c2.2 2.6 3.4 4.4 3.4 6a3.4 3.4 0 01-6.8 0c0-1.6 1.2-3.4 3.4-6z'), open: true },
  { id: 'heat', title: 'Heat', icon: mark('M7 1.8c.6 2-2.4 3.2-2.4 5.6a2.4 2.4 0 004.8 0c0-1-.5-1.7-1-2.3'), switch: 'thermal', description: 'Temperature, melting and boiling.' },
  { id: 'optics', title: 'Optics', icon: mark('M7 1.8a5.2 5.2 0 100 10.4A5.2 5.2 0 007 1.8zM2 6h10'), open: true },
  { id: 'camera', title: 'Camera', icon: mark('M1.8 4.5h2.4l1-1.5h3.6l1 1.5h2.4v6.5H1.8z') },
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

const settings = createParamPanes({ params: PARAMS, groups: GROUPS, panes: { physics: ['solver', 'matter', 'heat'], look: ['optics', 'camera'] }, store, storageKey: 'artinos-showcase.params' });

const PANELS: DockPanel[] = [
  { id: 'physics', title: 'Physics', description: 'Solver, matter, heat', dock: 'right', active: true, content: <settings.Pane id="physics" label="Physics groups" /> },
  { id: 'look', title: 'Look', description: 'Optics and camera', dock: 'right', content: <settings.Pane id="look" label="Look groups" /> },
];

export function ParamsDemo() {
  return (
    <div className="sc-workspace">
      <Dock panels={PANELS} viewport={<img className="sc-workspace__view" src={BACKDROPS.monstera} alt="" />} storageKey="artinos-showcase.params-dock.v1" sizes={{ right: 0.42 }} viewProps={{ padding: 8, gap: 6 }} />
    </div>
  );
}

export const PARAMS_CODE = `const settings = createParamPanes({
  params,            // [{ key, label, group, kind: 'number' | 'choice' | 'toggle', default, min, max, step, face, when, advanced }]
  groups,            // [{ id, title, icon, description, switch: 'thermal', open }]
  panes: { physics: ['solver', 'matter', 'heat'], look: ['optics', 'camera'] },
  store,             // { get, subscribe, set }: your own state
  storageKey: 'my-app.settings',
});

<Dock panels={[
  { id: 'physics', title: 'Physics', dock: 'right', content: <settings.Pane id="physics" /> },
  { id: 'look', title: 'Look', dock: 'right', content: <settings.Pane id="look" /> },
]} viewport={<Canvas>…</Canvas>} />`;
