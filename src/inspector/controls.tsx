'use client';
import { Button } from '../actions/Button';
import { ColorField } from '../controls/ColorField';
import { NumberField } from '../controls/NumberField';
import { Segmented } from '../controls/Segmented';
import { Select } from '../controls/Select';
import { Switch } from '../controls/Switch';
import { TextField } from '../controls/TextField';
import { XYPad } from '../controls/XYPad';
import { Vector3Field } from '../rig/Vector3Field';
import type { Vec3 } from '../rig/math';
import { RangeSlider } from '../slider/RangeSlider';
import { Slider } from '../slider/Slider';
import { decimalsOfStep } from '../core/utils';
import type { InspectControl, InspectControlProps } from './registry';
import type { InspectChoice, InspectColor, InspectItem, InspectNumber, InspectPoint, InspectRange, InspectText, InspectValue, InspectVector } from './store';

/* The controls of the built-in kinds: the Inspector's first customers of the control registry. */

/** A number: with min and max a slider, without them a scrub field. Both follow the signal alone. */
function NumberControl({ item, signal, status, commit }: InspectControlProps<number>) {
  const p = item as InspectNumber;
  const step = p.step ?? 0.01;
  const face = p.face ?? 'plain';
  const decimals = face === 'percent' ? 0 : decimalsOfStep(step);
  if (p.min === undefined || p.max === undefined)
    return <NumberField aria-label={p.label} signal={signal} min={p.min} max={p.max} step={step} decimals={decimals} unit={p.unit} align="end" onCommit={commit} />;
  const span = (p.max - p.min) / step;
  return (
    <Slider
      aria-label={p.label}
      signal={signal}
      min={p.min}
      max={p.max}
      step={step}
      unit={face === 'percent' ? undefined : p.unit}
      decimals={decimals}
      format={face === 'percent' ? 'percent' : face === 'degrees' ? 'angle' : 'number'}
      mapping={face === 'log' && p.min > 0 ? 'log' : 'linear'}
      bipolar={face === 'bipolar'}
      detents={face === 'bipolar' ? [0] : undefined}
      variant={face === 'count' ? 'stepped' : 'material'}
      steps={face === 'count' && span <= 12 ? Math.round(span) + 1 : undefined}
      status={status}
      toggleable={false}
      onCommit={commit}
    />
  );
}

const asControl = <V extends InspectValue>(control: InspectControl<V>) => control as unknown as InspectControl;

export const BUILT_IN_CONTROLS: Partial<Record<InspectItem['kind'], InspectControl>> = {
  number: asControl<number>({ component: NumberControl, transient: true, animatable: true }),
  toggle: asControl<boolean>({
    continuous: false,
    animatable: true,
    component: ({ item, value, set }) => <Switch variant="compact" aria-label={item.label} value={value} onChange={set} />,
  }),
  choice: asControl<string>({
    continuous: false,
    component: ({ item, value, set }) => {
      const options = (item as InspectChoice).options.map((o) => ({ ...o }));
      return options.length <= 3 ? <Segmented label={item.label} options={options} value={value} onChange={set} /> : <Select label={item.label} options={options} value={value} onChange={set} appearance="well" />;
    },
  }),
  color: asControl<string>({
    animatable: true,
    component: ({ item, value, set }) => <ColorField value={value} alpha={(item as InspectColor).alpha} onChange={set} />,
  }),
  vector: asControl<number[]>({
    animatable: true,
    component: ({ item, value, set, commit }) => {
      const p = item as InspectVector;
      return <Vector3Field label={p.label} value={value as unknown as Vec3} min={p.min} max={p.max} step={p.step ?? 0.01} decimals={decimalsOfStep(p.step ?? 0.01)} unit={p.unit} onChange={set as unknown as (v: Vec3) => void} onCommit={commit} />;
    },
  }),
  range: asControl<number[]>({
    animatable: true,
    component: ({ item, value, set, commit }) => {
      const p = item as InspectRange;
      return <RangeSlider aria-label={p.label} value={value as unknown as [number, number]} min={p.min} max={p.max} step={p.step ?? 0.01} decimals={decimalsOfStep(p.step ?? 0.01)} unit={p.unit} minSpan={p.minSpan} toggleable={false} onChange={set as unknown as (v: [number, number]) => void} onCommit={commit} />;
    },
  }),
  point: asControl<number[]>({
    animatable: true,
    component: ({ item, value, set, commit }) => {
      const p = item as InspectPoint;
      return <XYPad label={p.label} value={value as unknown as [number, number]} xRange={p.xRange} yRange={p.yRange} height={p.height ?? 64} onChange={set as unknown as (v: [number, number]) => void} onCommit={commit} />;
    },
  }),
  text: asControl<string>({
    component: ({ item, value, set }) => <TextField size="sm" aria-label={item.label} value={value} placeholder={(item as InspectText).placeholder} onChange={set} />,
  }),
  action: asControl<number>({
    continuous: false,
    component: ({ item }) => (
      <Button size="sm" block onClick={item.kind === 'action' ? item.run : undefined}>
        {item.label}
      </Button>
    ),
  }),
};
