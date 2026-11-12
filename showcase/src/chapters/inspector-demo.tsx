import { Inspector, createInspectorStore } from '../../../src';
import type { Param, ParamGroup } from '../../../src';

const groups: ParamGroup[] = [
  { id: 'physics', title: 'Physics', description: 'Shape, weight and response.', open: true },
  { id: 'surface', title: 'Surface', open: true },
  { id: 'pose', title: 'Transform' },
];
const params: Param[] = [
  { key: 'viscosity', label: 'Viscosity', group: 'physics', kind: 'number', default: 0.35, min: 0, max: 1, step: 0.01 },
  { key: 'tension', label: 'Surface tension', group: 'physics', kind: 'number', default: 0.6, min: 0, max: 1, step: 0.01 },
  { key: 'adaptive', label: 'Adaptive', group: 'physics', kind: 'toggle', default: true },
  { key: 'iterations', label: 'Iterations', group: 'physics', kind: 'number', default: 4, min: 1, max: 16, step: 1, face: 'count', advanced: true },
  { key: 'name', label: 'Name', group: 'surface', kind: 'text', default: 'Blobby' },
  { key: 'tint', label: 'Colour', group: 'surface', kind: 'color', default: '#35CDBF' },
  { key: 'position', label: 'Position', group: 'pose', kind: 'vector3', default: [0, 0, 0], step: 0.1 },
];
const store = createInspectorStore(params);
export function InspectorDemo() {
  return <div style={{ maxWidth: 380, width: '100%' }}><Inspector title="Blobby · Properties" groups={groups} params={params} store={store} maxHeight={480} /></div>;
}
