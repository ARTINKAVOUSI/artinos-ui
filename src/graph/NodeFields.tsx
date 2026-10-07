'use client';
import type { ReactNode } from 'react';
import { NumberField } from '../controls/NumberField';
import { Select } from '../controls/Select';
import { Switch } from '../controls/Switch';
import { TextField } from '../controls/TextField';
import { Field } from '../layout/Panel';
import type { GraphField } from './graph';

/** What the host can offer the pickers. Empty lists degrade to free text. */
export interface GraphSources {
  signals?: readonly string[];
  parameters?: readonly { id: string; label: string }[];
  effects?: readonly { id: string; label: string; parameters: readonly { id: string; label: string }[] }[];
  objects?: readonly string[];
}

/** Rows a field takes in the node body: a vector is a labelled row of three cells. */
export const fieldRows = (field: GraphField) => (field.kind === 'vector3' ? 2 : 1);

/** Decimals that show one step: 0.01 → 2, 1 → 0. */
const decimalsFor = (step: number) => (step >= 1 ? 0 : Math.min(4, (String(step).split('.')[1] ?? '').length || 2));

/** The node's label column: short, so the control keeps most of the width. */
const LABEL_W = 58;

/**
 * One field on a node, by kind, built from the family's own controls: a number is a
 * NumberField with its label in the well, a flag is a Switch, a choice is a Select in a
 * Field row. Pickers fall back to a text box when the host has nothing to offer, so a
 * graph stays editable in any context.
 */
export function NodeField({
  field,
  value,
  sources,
  effectId,
  onChange,
}: {
  field: GraphField;
  value: unknown;
  sources: GraphSources;
  /** For `effect-parameter`: the effect this node is pointed at. */
  effectId?: string;
  onChange: (value: unknown) => void;
}) {
  const text = value === undefined || value === null ? '' : String(value);
  const row = (control: ReactNode) => (
    <Field label={field.label} labelWidth={LABEL_W} className="ar-graph__field">
      {control}
    </Field>
  );
  const typed = () => (
    <TextField size="sm" label={field.label} value={text} placeholder={field.description} onChange={(next) => onChange(next)} />
  );

  if (field.kind === 'number') {
    const step = field.step ?? 0.01;
    return (
      <NumberField
        className="ar-graph__field"
        label={field.label}
        value={Number(value ?? 0)}
        min={field.min}
        max={field.max}
        step={step}
        decimals={decimalsFor(step)}
        align="end"
        onChange={(next) => onChange(next)}
      />
    );
  }
  if (field.kind === 'boolean') {
    return <Switch className="ar-graph__field" label={field.label} value={Boolean(value)} onChange={(next) => onChange(next)} />;
  }
  if (field.kind === 'vector3') {
    const vector = Array.isArray(value) ? (value as number[]) : [0, 0, 0];
    return (
      <div className="ar-graph__field ar-graph__vector">
        <span className="ar-text">{field.label}</span>
        <div className="ar-graph__vector-cells">
          {(['X', 'Y', 'Z'] as const).map((axis, index) => (
            <NumberField
              key={axis}
              aria-label={`${field.label} ${axis}`}
              value={Number(vector[index] ?? 0)}
              step={0.01}
              decimals={2}
              onChange={(next) => {
                const out = [...vector];
                while (out.length < 3) out.push(0);
                out[index] = next;
                onChange(out);
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // choices: a list of names, or of id/label pairs; a Field row keeps the label visible
  const options =
    field.kind === 'select'
      ? (field.options ?? [])
      : field.kind === 'signal'
        ? (sources.signals ?? [])
        : field.kind === 'scene-object'
          ? (sources.objects ?? [])
          : undefined;
  const pairs =
    field.kind === 'parameter'
      ? (sources.parameters ?? [])
      : field.kind === 'effect'
        ? (sources.effects ?? []).map((effect) => ({ id: effect.id, label: effect.label }))
        : field.kind === 'effect-parameter'
          ? (sources.effects?.find((effect) => effect.id === effectId)?.parameters ?? [])
          : undefined;

  if (options !== undefined) {
    if (!options.length) return row(typed());
    return row(<Select appearance="well" label="Choose…" options={options} value={text || undefined} onChange={(next) => onChange(next)} />);
  }
  if (pairs !== undefined) {
    if (!pairs.length) return row(typed());
    return row(
      <Select
        appearance="well"
        label="Choose…"
        options={pairs.map((pair) => ({ value: pair.id, label: pair.label }))}
        value={text || undefined}
        onChange={(next) => onChange(next)}
      />,
    );
  }
  return row(typed());
}
