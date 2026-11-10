/* The Layout system chapter's demos, one per level:
     Panel    a workspace of panels: each one a MetaBlock with its capabilities
     Section  sections on a page: grouping and categories, every section feature once
     Parts    what goes inside a section: rows, controls, readouts and text (lists: lists-demo)
   One set of sections runs through all of it, so a section moves between a panel on the page
   and the panels of the workspace. */
import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import {
  Badge,
  Button,
  Callout,
  ColorField,
  ContextMenu,
  createDockSections,
  Dock,
  Field,
  IconButton,
  ItemList,
  ItemRow,
  Meter,
  NumberField,
  Panel,
  PanelBar,
  PropertyRow,
  RangeSlider,
  Section,
  SectionGroup,
  Segmented,
  Select,
  Slider,
  Sparkline,
  StatStrip,
  Switch,
  Tag,
  Text,
  Toolbar,
  ToolbarSeparator,
  useDock,
  useWorkspaceRevision,
} from '../../../src';
import type { DockApi, DockPanel } from '../../../src';
import { BACKDROPS } from '../shared';
import { GraphPanel, IC, useLiveSeries } from './demos';
import { settings } from './params-demo';

const glyph = (d: string, fill = 'none') => (
  <svg viewBox="0 0 16 16" fill={fill} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

/* ---------- the one set of sections ---------- */

function MaterialSection() {
  const [exposure, setExposure] = useState(0.71);
  const [gain, setGain] = useState(-4.5);
  const [live, setLive] = useState(true);
  const changed = Number(exposure !== 0.62) + Number(gain !== -4.5);
  return (
    <Section title="Material" count={changed ? `${changed} changed · 3` : 3} enabled={live} onEnabledChange={setLive}>
      <PropertyRow label="Exposure" modified={exposure !== 0.62} onReset={() => setExposure(0.62)}>
        <Slider label="Exposure" value={exposure} onChange={setExposure} />
      </PropertyRow>
      <PropertyRow label="Gain" binding="LFO 1" status="bound" modified={gain !== -4.5} onReset={() => setGain(-4.5)}>
        <Slider label="Gain" format="db" min={-60} max={12} decimals={1} value={gain} onChange={setGain} detents={[0]} status="bound" />
      </PropertyRow>
      <PropertyRow label="Mode" density="compact">
        <Select options={['Neutral', 'Warm', 'Cool']} defaultValue="Neutral" appearance="well" label="Mode" />
      </PropertyRow>
    </Section>
  );
}

const EXPOSURE0 = { ev: 0.4, gamma: 2.2 };
function ExposureSection() {
  const [exp, setExp] = useState(EXPOSURE0);
  const changed = exp.ev !== EXPOSURE0.ev || exp.gamma !== EXPOSURE0.gamma;
  return (
    <Section
      title="Exposure"
      description="How bright the frame is before the tonemap."
      count={changed ? '1 changed' : 2}
      modified={changed}
      onReset={() => setExp(EXPOSURE0)}
    >
      <Slider label="Exposure" min={-4} max={4} unit="ev" decimals={2} bipolar value={exp.ev} onChange={(ev) => setExp({ ...exp, ev })} />
      <Slider label="Gamma" min={1} max={3} decimals={2} value={exp.gamma} onChange={(gamma) => setExp({ ...exp, gamma })} />
    </Section>
  );
}

const SECTIONS: Record<string, { title: string; render: () => ReactElement }> = {
  object: {
    title: 'Object',
    render: () => (
      <Section title="Object" count={2}>
        <Field label="Name">
          Orb <Tag>mesh</Tag>
        </Field>
        <Field label="Width">
          <NumberField defaultValue={268} aria-label="Width" />
          <Select options={['Fixed', 'Fill', 'Hug']} defaultValue="Fixed" appearance="well" label="Width mode" />
        </Field>
      </Section>
    ),
  },
  material: { title: 'Material', render: () => <MaterialSection /> },
  lens: {
    title: 'Lens',
    render: () => (
      <Section title="Lens" count={2}>
        <Slider variant="ruler" label="Focal" min={12} max={200} span={40} unit="mm" decimals={0} defaultValue={50} marks={[35, 50, 85]} />
        <Slider label="Aperture" mapping="log" min={1.4} max={16} decimals={1} defaultValue={2.8} />
      </Section>
    ),
  },
  exposure: { title: 'Exposure', render: () => <ExposureSection /> },
  post: {
    title: 'Post',
    render: () => (
      <Section title="Post" count={2} defaultEnabled storageKey="showcase-layout-post" description="Double-click the heading to switch the group off; its fold is remembered.">
        <Slider label="Bloom" defaultValue={0.24} />
        <Slider label="Grain" defaultValue={0.08} />
      </Section>
    ),
  },
  transform: {
    title: 'Transform',
    render: () => (
      <Section title="Transform" count={3} columns={3} variant="card">
        <NumberField label="X" defaultValue={1.25} decimals={2} unit="m" />
        <NumberField label="Y" defaultValue={0} decimals={2} unit="m" />
        <NumberField label="Z" defaultValue={-0.5} decimals={2} unit="m" />
      </Section>
    ),
  },
};

/** Where every section is: two panes in the workspace, one in a Panel on the page. A section
 *  drags between all three by its heading. */
export const sections = createDockSections({
  panes: { inspector: ['object', 'material'], effects: ['lens'], page: ['exposure', 'post', 'transform'] },
  render: (id) => SECTIONS[id].render(),
  title: (id) => SECTIONS[id]?.title ?? id,
});

/* ---------- 01 · Panel: a workspace of MetaBlocks ---------- */

const LAYER_META: Record<string, [string, string]> = {
  Orb: ['#4fd1ba', 'Mesh · 12,480 tris'],
  'Glass shell': ['#9eeede', 'Material · thick glass'],
  'Rim light': ['#f2e8d5', 'Area light · 4.2 lm'],
  Backdrop: ['#8a7a5c', 'Image · 2048 px'],
};

function LayersPane() {
  const [layers, setLayers] = useState(['Orb', 'Glass shell', 'Rim light', 'Backdrop']);
  const [hidden, setHidden] = useState<string[]>([]);
  const [selected, setSelected] = useState('Orb');
  const reorder = (from: number, to: number) =>
    setLayers((l) => {
      const n = [...l];
      const [x] = n.splice(from, 1);
      n.splice(to, 0, x);
      return n;
    });
  return (
    <>
      <PanelBar>
        <IconButton size="sm" label="Add layer" icon={IC.plus} onClick={() => setLayers((l) => [...l, `Layer ${l.length + 1}`])} />
        <IconButton size="sm" label="Duplicate" icon={IC.copy} onClick={() => setLayers((l) => [...l, `${selected} copy`])} />
        <span className="ar-panel-bar__spacer" />
        <IconButton size="sm" label="Delete" icon={IC.trash} onClick={() => setLayers((l) => l.filter((x) => x !== selected))} />
      </PanelBar>
      <ItemList label="Layers" onReorder={reorder}>
        {layers.map((name) => (
          <ContextMenu
            key={name}
            items={() => [
              { id: 'select', label: 'Select', onSelect: () => setSelected(name) },
              { id: 'dup', label: 'Duplicate', icon: IC.copy, onSelect: () => setLayers((l) => [...l, `${name} copy`]) },
              { type: 'separator' },
              { id: 'del', label: 'Delete', danger: true, icon: IC.trash, onSelect: () => setLayers((l) => l.filter((x) => x !== name)) },
            ]}
          >
            <ItemRow
              title={name}
              meta={LAYER_META[name]?.[1] ?? 'Layer'}
              swatch={LAYER_META[name]?.[0] ?? '#8a8a8a'}
              selected={name === selected}
              onSelect={() => setSelected(name)}
              disabled={hidden.includes(name)}
              trailing={
                <IconButton
                  size="sm"
                  label={hidden.includes(name) ? `Show ${name}` : `Hide ${name}`}
                  icon={IC.eye}
                  active={!hidden.includes(name)}
                  onClick={() => setHidden((h) => (h.includes(name) ? h.filter((x) => x !== name) : [...h, name]))}
                />
              }
            />
          </ContextMenu>
        ))}
      </ItemList>
    </>
  );
}

function ConsolePane() {
  const series = useLiveSeries();
  const { openPanel } = useDock();
  const last = series[series.length - 1];
  return (
    <div className="sc-console-pane">
      <StatStrip
        items={[
          { label: 'Frame', value: (4 + last * 6).toFixed(1), unit: 'ms' },
          { label: 'Particles', value: '48k' },
          { label: 'Rate', value: 60, unit: 'fps' },
        ]}
      />
      <div className="sc-console-pane__meters">
        <Meter label="CPU" value={last} valueText={`${Math.round(last * 100)}%`} peak />
        <Sparkline label="Frame time" values={series} fill threshold={0.7} width={220} height={34} />
        <Button size="sm" onClick={() => openPanel('graph')}>
          Open graph
        </Button>
      </div>
    </div>
  );
}

const T = {
  float: glyph('M2.5 4.5h7v7h-7zM6.5 2.5h7v7'),
  left: glyph('M2.5 2.5h11v11h-11zM6 2.5v11'),
  right: glyph('M2.5 2.5h11v11h-11zM10 2.5v11'),
  bottom: glyph('M2.5 2.5h11v11h-11zM2.5 10h11'),
  max: glyph('M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10'),
  home: glyph('M2.5 7.5L8 2.8l5.5 4.7M4 6.5v7h8v-7'),
  undo: glyph('M5.5 4L2.5 7l3 3M2.5 7H10a3.5 3.5 0 010 7H8'),
  redo: glyph('M10.5 4l3 3-3 3M13.5 7H6a3.5 3.5 0 000 7h2'),
  reset: glyph('M3 8a5 5 0 105-5H5M5 1v2h2'),
};

const ENGINE_PANELS = [
  { value: 'effects', label: 'Effects' },
  { value: 'inspector', label: 'Inspector' },
  { value: 'physics', label: 'Physics' },
  { value: 'layers', label: 'Layers' },
  { value: 'console', label: 'Console' },
];

/** Moves panels through `api.workspace`, the MetaBlock engine, with the calls a drag makes. A
 *  button a panel's capabilities rule out is off for that panel. */
function EngineBar({ api }: { api: DockApi }) {
  const ws = api.workspace;
  useWorkspaceRevision(ws);
  const [id, setId] = useState('effects');
  const can = ws.blocks.get(id)?.capabilities;
  const where = ws.getBlockRelationshipContext(id);
  const group = where ? ws.groups.get(where.groupId) : null;
  const maximized = group?.posture === 'maximized';
  const into = (edge: 'left' | 'right' | 'bottom') => {
    if (!where) api.openPanel(id);
    const target = ws.groups.get(`dock.${edge}`);
    if (target) ws.dockBlock(id, { area: 'center', targetGroupId: target.id });
    else ws.dockBlock(id, { area: edge });
    ws.activateBlock(id);
  };
  const act = (label: string, icon: ReactElement, run: () => unknown, allowed = true) => (
    <IconButton size="sm" label={label} icon={icon} disabled={!allowed} onClick={() => run()} />
  );
  return (
    <div className="sc-engine">
      <Toolbar label="MetaBlock engine" floating>
        <Select options={ENGINE_PANELS} value={id} onChange={setId} label="Panel" />
        <ToolbarSeparator />
        {act('Float', T.float, () => ws.floatBlock(id, { x: 300, y: 96, width: 290, height: 300 }), can?.floatable !== false)}
        {act('Dock left', T.left, () => into('left'), can?.dockable !== false)}
        {act('Dock right', T.right, () => into('right'), can?.dockable !== false)}
        {act('Dock bottom', T.bottom, () => into('bottom'), can?.dockable !== false)}
        {act(maximized ? 'Restore' : 'Maximize', T.max, () => (maximized ? ws.restoreBlock(id) : ws.maximizeBlock(id)), can?.maximizable !== false)}
        {act('Return home', T.home, () => ws.returnBlock(id), !!where?.canReturnHome)}
        <ToolbarSeparator />
        {act('Undo', T.undo, () => ws.undo())}
        {act('Redo', T.redo, () => ws.redo())}
        {act('Reset layout', T.reset, () => api.resetLayout())}
      </Toolbar>
      <span className="sc-engine__state">{where ? `${where.posture} · ${group?.title ?? where.groupId}` : 'closed'}</span>
    </div>
  );
}

export function PanelDemo() {
  const [api, setApi] = useState<DockApi | null>(null);
  const panels = useMemo<DockPanel[]>(
    () => [
      {
        id: 'inspector',
        title: 'Inspector',
        description: 'Always docked and open',
        dock: 'left',
        content: <sections.Pane id="inspector" label="Inspector sections" toolbar />,
        footer: 'closable · floatable: off',
        capabilities: { closable: false, floatable: false },
      },
      { id: 'effects', title: 'Effects', description: 'A floating pane of sections', dock: 'float', content: <sections.Pane id="effects" label="Effects sections" /> },
      { id: 'physics', title: 'Physics', description: 'Sections built from a schema', dock: 'right', active: true, content: <settings.Pane id="physics" label="Physics groups" /> },
      { id: 'look', title: 'Look', description: 'Sections built from a schema', dock: 'right', content: <settings.Pane id="look" label="Look groups" /> },
      { id: 'layers', title: 'Layers', description: 'A list — right-click a layer', dock: 'right', content: <LayersPane /> },
      { id: 'console', title: 'Console', description: 'Live readouts', active: true, content: <ConsolePane />, footer: 'Sampling · 220 ms' },
      { id: 'graph', title: 'Graph', description: 'Node editor', keywords: ['nodes', 'wires'], content: <GraphPanel /> },
    ],
    [],
  );
  return (
    <div className="sc-workspace sc-workspace--system">
      <Dock
        panels={panels}
        viewport={
          <div className="sc-viewport">
            <img className="sc-workspace__view" src={BACKDROPS.garden} alt="" />
            {api ? <EngineBar api={api} /> : null}
          </div>
        }
        storageKey="artinos-showcase.layout.v1"
        sizes={{ left: 0.25, right: 0.26, bottom: 0.27 }}
        floatBounds={{ x: 330, y: 104, width: 290, height: 300 }}
        viewProps={{ padding: 10, gap: 8 }}
        onReady={setApi}
      />
    </div>
  );
}

/* ---------- 02 · Section: grouping and categories, on a page ---------- */

export function SectionDemo() {
  return (
    <div className="sc-grid sc-grid--top">
      <Panel
        icon={glyph('M2.5 4.5h11M2.5 8h11M2.5 11.5h7')}
        title="Scene"
        subtitle="A pane of the workspace’s sections"
        actions={<Badge tone="live" dot>Live</Badge>}
        footer={<span>Drag a heading into the Inspector above</span>}
        labelWidth={84}
      >
        <sections.Pane id="page" label="Scene sections" toolbar />
      </Panel>
      <Panel title="Categories" subtitle="One open at a time" variant="solid" collapsible>
        <SectionGroup accordion defaultOpen="camera" label="Categories">
          <Section id="camera" title="Camera" count={2}>
            <Slider variant="ruler" label="Focal" min={12} max={200} span={40} unit="mm" decimals={0} defaultValue={35} />
            <Field label="Mode">
              <Segmented options={['Orbit', 'Fly']} defaultValue="Orbit" label="Camera mode" />
            </Field>
          </Section>
          <Section id="light" title="Light" count={2}>
            <Slider variant="gradient" gradient="temperature" label="Temperature" min={1000} max={12000} decimals={0} defaultValue={6500} unit="K" />
            <Slider label="Intensity" defaultValue={0.7} />
          </Section>
          <Section id="atmosphere" title="Atmosphere" count={1}>
            <Slider label="Fog" defaultValue={0.12} />
          </Section>
        </SectionGroup>
      </Panel>
    </div>
  );
}

/* ---------- 03 · Parts: what a section holds ---------- */

export function PartsDemo() {
  const [gain, setGain] = useState(-4.5);
  return (
    <div className="sc-grid sc-grid--top">
      <Panel title="Rows & controls" subtitle="Setting values" labelWidth={84}>
        <Section title="Rows" count={4} description="A name and its answer.">
          <Field label="Width">
            <NumberField defaultValue={268} aria-label="Width" />
            <Select options={['Fixed', 'Fill', 'Hug']} defaultValue="Fixed" appearance="well" label="Width mode" />
          </Field>
          <Field label="Name">
            Orb <Tag>mesh</Tag>
          </Field>
          <PropertyRow label="Gain" binding="LFO 1" status="bound" modified={gain !== -4.5} onReset={() => setGain(-4.5)}>
            <Slider label="Gain" format="db" min={-60} max={12} decimals={1} value={gain} onChange={setGain} detents={[0]} status="bound" />
          </PropertyRow>
          <Field label="Feels" variant="hero">
            exuberant, <em>calm</em>
          </Field>
        </Section>
        <Section title="Controls" count={4} description="One value each, in the shape the parameter takes.">
          <Slider label="Roughness" defaultValue={0.18} />
          <RangeSlider label="Loop" defaultValue={[0.1, 0.8]} />
          <Field label="Tint">
            <ColorField defaultValue="#8DBBB4" />
          </Field>
          <Field label="Visible">
            <Switch variant="compact" label="Visible" defaultValue />
          </Field>
        </Section>
      </Panel>
      <Panel title="Readouts & text" subtitle="Showing what is">
        <Section title="Readouts" count={2}>
          <StatStrip
            items={[
              { label: 'Frame', value: '4.1', unit: 'ms' },
              { label: 'Particles', value: '48k' },
              { label: 'Rate', value: 60, unit: 'fps' },
            ]}
          />
          <Meter label="CPU" value={0.42} valueText="42%" />
        </Section>
        <Section title="Text" count={2}>
          <Text variant="overline">Overline</Text>
          <Text variant="note">A note: help that sits under the thing it explains.</Text>
          <Callout title="Callout">
            <p>Help that must not be missed, after the text it qualifies.</p>
          </Callout>
        </Section>
      </Panel>
    </div>
  );
}
