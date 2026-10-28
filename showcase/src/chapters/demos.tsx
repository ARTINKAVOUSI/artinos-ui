/* Live pieces several chapters share: stroke icons, a wandering data series, and the
   workspace's panels (the Dock demo uses them, and the Layout chapter shows the inspector). */
import { useEffect, useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import { Badge, Button, ContextMenu, IconButton, ItemList, ItemRow, Meter, NodeGraph, PropertyRow, Section, Select, Slider, Sparkline, PanelBar, createDockSections, createNode, useDock } from '../../../src';
import type { GraphDefinition } from '../../../src';

const icon = (d: string) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
export const IC = {
  plus: icon('M8 3.5v9M3.5 8h9'),
  eye: icon('M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8zM8 10a2 2 0 100-4 2 2 0 000 4z'),
  lock: icon('M4.5 7.5h7v6h-7zM5.5 7.5V5.5a2.5 2.5 0 015 0v2'),
  trash: icon('M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 9h5.6l.7-9'),
  copy: icon('M5.5 5.5h7v7h-7zM3.5 10.5v-7h7'),
  more: icon('M3.5 8h.01M8 8h.01M12.5 8h.01'),
  play: icon('M5 3.5v9l7-4.5z'),
  save: icon('M3.5 3.5h7l2 2v7h-9zM5.5 3.5v3h4v-3M5.5 12.5v-3h5v3'),
  undo: icon('M5.5 4L2.5 7l3 3M2.5 7H10a3.5 3.5 0 010 7H8'),
};

/** A live, smoothly wandering series for the meters and sparklines. */
export function useLiveSeries(length = 48) {
  const [series, setSeries] = useState(() => Array.from({ length }, (_, i) => 0.5 + 0.3 * Math.sin(i / 4)));
  useEffect(() => {
    const id = setInterval(() => setSeries((s) => [...s.slice(1), Math.min(1, Math.max(0, s[s.length - 1] + (Math.random() - 0.5) * 0.18))]), 220);
    return () => clearInterval(id);
  }, []);
  return series;
}

export const SAMPLE_GRAPH: GraphDefinition = {
  domain: 'signal',
  nodes: [
    { ...createNode('constant', 20, 40, { value: 0.5 }), id: 'rate' },
    { ...createNode('oscillator', 240, 30, { frequency: 6, phase: 0.25 }), id: 'osc' },
    { ...createNode('smooth', 470, 50, { amount: 0.6 }), id: 'smooth' },
    { ...createNode('remap', 690, 40), id: 'remap' },
  ],
  edges: [
    { id: 'e1', from: 'rate', to: 'osc', input: 'frequency' },
    { id: 'e2', from: 'osc', to: 'smooth' },
    { id: 'e3', from: 'smooth', to: 'remap' },
  ],
};

export function GraphPanel({ height }: { height?: number }) {
  const [graph, setGraph] = useState(SAMPLE_GRAPH);
  return (
    <div style={{ height: height ?? 'max(260px, calc(var(--ar-dock-panel-h, 300px) - 28px))' }}>
      <NodeGraph value={graph} onChange={setGraph} />
    </div>
  );
}

/** Property rows around real controls, as an inspector group: its state and its on/off sit in
 *  the title row; a changed row shows a dot in the gutter that turns into its reset. */
/* ---------- sections that live in the dock: drag one by its heading into another pane ---------- */

export function MaterialSection() {
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

const PANE_SECTIONS: Record<string, () => ReactElement> = {
  material: MaterialSection,
  environment: () => (
    <Section title="Environment" count={2}>
      <Slider label="Env intensity" defaultValue={0.82} unit="×" />
      <Slider label="Fog density" defaultValue={0.04} decimals={3} />
    </Section>
  ),
  post: () => (
    <Section title="Post" count={2} defaultEnabled>
      <Slider label="Bloom" defaultValue={0.24} />
      <Slider label="Grain" defaultValue={0.08} />
    </Section>
  ),
  lens: () => (
    <Section title="Lens" count={2}>
      <Slider variant="ruler" label="Focal" min={12} max={200} span={40} unit="mm" decimals={0} defaultValue={50} />
      <Slider label="Aperture" min={1.4} max={16} decimals={1} defaultValue={2.8} />
    </Section>
  ),
};

const SECTION_TITLES: Record<string, string> = { material: 'Material', environment: 'Environment', post: 'Post', lens: 'Lens' };

/* the kit keeps where each section is: panes trade them, a drag out over open space tears one
   off into its own floating panel, and dropping it back closes that panel */
const dockSections = createDockSections({
  panes: { inspector: ['material', 'environment'], effects: ['post', 'lens'] },
  render: (id) => {
    const Body = PANE_SECTIONS[id];
    return <Body />;
  },
  title: (id) => SECTION_TITLES[id] ?? id,
});
const { Pane: SectionPane } = dockSections;

export function InspectorPanel() {
  return <SectionPane id="inspector" label="Inspector sections" />;
}

export function EffectsPanel() {
  return (
    <div className="ar-stack" style={{ '--_gap': 'var(--ar-space-4)' } as CSSProperties}>
      <p className="sc-text" style={{ margin: 0 }}>
        Drag a section by its heading into the Inspector, or out over the scene to tear it off into its own panel; drop it back into any pane. Alt + ↑ / ↓ on a heading moves it within its pane.
      </p>
      <SectionPane id="effects" label="Effects sections" />
    </div>
  );
}

const LAYER_META: Record<string, [string, string]> = {
  Orb: ['#4fd1ba', 'Mesh · 12,480 tris'],
  'Glass shell': ['#9eeede', 'Material · thick glass'],
  'Rim light': ['#f2e8d5', 'Area light · 4.2 lm'],
  Backdrop: ['#8a7a5c', 'Image · 2048 px'],
};

export function LayersPanel() {
  const [layers, setLayers] = useState(['Orb', 'Glass shell', 'Rim light', 'Backdrop']);
  const [hidden, setHidden] = useState<string[]>([]);
  const [selected, setSelected] = useState('Orb');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <PanelBar>
        <IconButton size="sm" label="Add layer" icon={IC.plus} onClick={() => setLayers((l) => [...l, `Layer ${l.length + 1}`])} />
        <IconButton size="sm" label="Duplicate" icon={IC.copy} onClick={() => setLayers((l) => [...l, `${selected} copy`])} />
        <span className="ar-panel-bar__spacer" />
        <IconButton size="sm" label="Delete" icon={IC.trash} onClick={() => setLayers((l) => l.filter((x) => x !== selected))} />
      </PanelBar>
      <ItemList label="Layers" onReorder={(from, to) => setLayers((l) => { const n = [...l]; const [x] = n.splice(from, 1); n.splice(to, 0, x); return n; })}>
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
    </div>
  );
}

export function ConsolePanel() {
  const series = useLiveSeries();
  const { openPanel } = useDock();
  const last = series[series.length - 1];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
      <Meter label="CPU" value={last} valueText={`${Math.round(last * 100)}%`} peak />
      <Meter label="GPU" value={series[20]} tone="warm" valueText={`${Math.round(series[20] * 100)}%`} />
      <Sparkline label="Frame time" values={series} fill threshold={0.7} width={220} height={34} />
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <Badge tone="live" dot>
          60 fps
        </Badge>
        <Button size="sm" onClick={() => openPanel('graph')}>
          Open graph
        </Button>
      </div>
    </div>
  );
}
