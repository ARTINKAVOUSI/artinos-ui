/* 06 · Layout — Panel, Section, Field and Tabs composed into an inspector; property rows;
   and the dense control strip. */
import { useState } from 'react';
import { ColorField, Field, NumberField, Panel, RangeSlider, Section, Segmented, Select, Slider, Switch, Tabs, ToggleGroup } from '../../../src';
import { Chapter, ICONS, Spec } from '../shared';
import { InspectorPanel } from './demos';

function Inspector() {
  const [tab, setTab] = useState('scene');
  const [grow, setGrow] = useState<string>('Fill');
  return (
    <div className="sc-row">
      <Panel
        className="sc-inspector"
        title="Metablock"
        subtitle="Typography / Layout"
        actions={
          <>
            <span className="ar-dot" data-on="" />
            <button type="button" className="ar-tool" aria-label="Reset">
              {ICONS.reset}
            </button>
          </>
        }
        tabs={
          <Tabs
            label="Inspector"
            items={[
              { value: 'scene', label: 'Scene' },
              { value: 'studio', label: 'Studio' },
              { value: 'detail', label: 'Detail' },
            ]}
            value={tab}
            onChange={setTab}
          />
        }
        footer={
          <>
            <span>• Ready</span>
            <span style={{ marginLeft: 'auto' }}>LOCAL / 01</span>
          </>
        }
      >
        {tab === 'scene' ? (
          <>
            <Slider label="Weight" defaultValue={55} min={0} max={100} decimals={0} />
            <Slider label="Tracking" defaultValue={38} min={0} max={100} decimals={0} />
            <Slider label="Rotation" defaultValue={24} min={0} max={360} format="angle" decimals={0} />
            <Section title="Typography" heading="text" collapsible>
              <Field label="Width">
                <NumberField defaultValue={268} aria-label="Width" />
                <Select options={['Fixed', 'Fill', 'Hug']} defaultValue="Fixed" appearance="well" label="Width mode" />
              </Field>
              <Field label="Height">
                <NumberField defaultValue={268} aria-label="Height" />
                <Select options={['Fixed', 'Fill', 'Hug']} defaultValue="Fixed" appearance="well" label="Height mode" />
              </Field>
              <Field label="Grow">
                <ToggleGroup
                  multiple={false}
                  options={[
                    { value: 'fill', icon: ICONS.fill, title: 'Fill' },
                    { value: 'start', icon: ICONS.start, title: 'Start' },
                    { value: 'fixed', icon: ICONS.fixed, title: 'Fixed' },
                  ]}
                  defaultValue={['fill']}
                />
              </Field>
              <Field label="Sizing">
                <Segmented options={['Fixed', 'Fill', 'Hug']} value={grow} onChange={setGrow} label="Sizing" />
              </Field>
              <Field label="Color">
                <ColorField alpha defaultValue="#8DBBB4FF" />
              </Field>
              <Field label="Enabled">
                <Switch variant="compact" label="Enabled" defaultValue />
              </Field>
            </Section>
          </>
        ) : tab === 'studio' ? (
          <>
            <Slider variant="gradient" gradient="exposure" label="Exposure" min={-4} max={4} decimals={1} unit="EV" defaultValue={0.4} detents={[0]} />
            <Slider variant="ruler" label="Focal" min={12} max={200} span={40} unit="mm" decimals={0} defaultValue={50} marks={[35, 50, 85]} />
            <Field label="Lens">
              <Select options={['Prime', 'Zoom', 'Macro']} defaultValue="Prime" appearance="well" label="Lens" />
            </Field>
          </>
        ) : (
          <>
            <RangeSlider label="Clip" defaultValue={[0.05, 0.9]} />
            <Field label="Seed">
              <NumberField defaultValue={1337} aria-label="Seed" />
            </Field>
            <Field label="Tags">
              <ToggleGroup options={['A', 'B', 'C']} defaultValue={['A']} />
            </Field>
          </>
        )}
      </Panel>
      <div className="sc-stack" style={{ flex: '1 1 260px', minWidth: 0 }}>
        <Section title="Environment" count={4} defaultEnabled>
          <Slider label="Env Intensity" max={2} unit="x" defaultValue={0.82} detents={[1]} />
          <Slider label="Fog Density" max={0.2} decimals={3} defaultValue={0.04} />
        </Section>
        <Section title="Collapsible" count={2} collapsible defaultOpen={false}>
          <Slider label="Hidden A" defaultValue={0.3} />
          <Slider label="Hidden B" defaultValue={0.7} />
        </Section>
      </div>
    </div>
  );
}

function ControlStrip() {
  return (
    <div data-ar-density="dense">
      <div className="sc-dock">
        <div className="sc-dock__card" style={{ flexGrow: 1.2 }}>
          <Section title="Environment" count={14}>
            <Slider toggleable variant="gradient" gradient="exposure" label="Exposure" min={-4} max={4} unit="EV" defaultValue={0.4} detents={[0]} />
            <Slider toggleable label="Env Intensity" max={2} unit="x" defaultValue={0.82} detents={[1]} />
            <Slider toggleable label="Fog Density" max={0.2} decimals={3} defaultValue={0.04} />
            <Slider toggleable label="Ground Blur" defaultValue={0.36} />
          </Section>
          <span className="sc-dock__foot">STUDIO · PERSIAN GARDEN</span>
        </div>
        <div className="sc-dock__card">
          <Section title="Output" count={9}>
            <Slider toggleable steps={7} label="DPR" min={0.5} max={2} unit="x" defaultValue={1.75} />
            <Slider toggleable label="Shadow Bias" max={0.1} decimals={3} defaultValue={0.02} />
            <Slider toggleable label="Tone Contrast" defaultValue={0.58} detents={[0.5]} />
            <Slider toggleable variant="gradient" gradient="temperature" label="White Bal" min={0} max={100} defaultValue={58} />
          </Section>
          <span className="sc-dock__foot">WEBGPU · ADAPTIVE DPR</span>
        </div>
        <div className="sc-dock__card" style={{ flexGrow: 0.85 }}>
          <Section title="Stack" count={44}>
            <Slider toggleable label="Bloom" defaultValue={0.24} />
            <Slider toggleable label="Orb Energy" defaultValue={0.71} status="automated" />
            <Slider toggleable label="Grain" defaultValue={0.08} defaultEnabled={false} />
            <Slider toggleable variant="gradient" gradient="hue" label="Tint" min={0} max={360} format="angle" decimals={0} defaultValue={172} />
          </Section>
          <span className="sc-dock__foot">6 ACTIVE · 2.1 MS</span>
        </div>
      </div>
      <div className="sc-console">
        <b>CONSOLE</b>
        <span>Drag a readout for precision · double-click a slider to switch it off</span>
      </div>
    </div>
  );
}

export function LayoutChapter() {
  return (
    <Chapter id="layout">
      <Spec
        id="inspector"
        text="Panel is a glass card with a header, a tabs slot and a foot line. Section groups controls under a hairline and can collapse. Field puts a label column beside one or more controls. Tabs underline the active one. Together they make the reference inspector."
        code={`
<Panel title="Metablock" subtitle="Typography / Layout" actions={<ResetButton />}
       tabs={<Tabs items={['Scene', 'Studio', 'Detail']} value={tab} onChange={setTab} />}
       footer={<>• Ready <span>LOCAL / 01</span></>}>
  <Slider label="Weight" min={0} max={100} decimals={0} />
  <Section title="Typography" heading="text" collapsible>
    <Field label="Width">
      <NumberField defaultValue={268} aria-label="Width" />
      <Select appearance="well" options={['Fixed', 'Fill', 'Hug']} />
    </Field>
  </Section>
</Panel>`}
      >
        <Inspector />
      </Spec>

      <Spec
        id="property-rows"
        text="An inspector row around any control. A changed value shows a signal dot in the left gutter; hover the row (or tab to it) and the dot turns into its reset, so nothing takes width from the control and rows stay aligned. binding names the driver of a bound value; status and message explain a fault in words; compact puts the label in its own column. A switchable group carries its on/off in the title row's line: a brighter neutral line runs from the title while the group is on, and quiet info such as a count sits at its end, before the chevron. Click the title or line to fold the group; double-click it (or Shift+Enter) to switch it off, which folds it closed and disables it, and again to bring it back."
        code={`<Section title="Material" count={changed ? \`\${changed} changed · 3\` : 3} enabled={on} onEnabledChange={setOn}>
  <PropertyRow label="Exposure" modified={v !== 0.62} onReset={reset}><Slider label="Exposure" … /></PropertyRow>
  <PropertyRow label="Gain" binding="LFO 1" status="bound"><Slider label="Gain" … /></PropertyRow>
  <PropertyRow label="Mode" density="compact"><Select … /></PropertyRow>
</Section>`}
      >
        <div className="sc-inspector">
          <InspectorPanel />
        </div>
      </Spec>

      <Spec
        id="control-strip"
        text="Dense, toggleable sliders in three cards on a glass strip: the bottom of a render studio. Every slider switches off with a double-click and keeps its value. Density is set once on the strip's scope."
        code={`
<div data-ar-density="dense">
  <Section title="Environment" count={14}>
    <Slider variant="gradient" gradient="exposure" label="Exposure" toggleable … />
    <Slider label="Env Intensity" toggleable … />
  </Section>
</div>`}
      >
        <ControlStrip />
      </Spec>
    </Chapter>
  );
}
