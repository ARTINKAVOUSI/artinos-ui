/* Live pieces several chapters share: stroke icons, a wandering data series, and the
   workspace's panels (the Dock demo uses them, and the Layout chapter shows the inspector). */
import { useEffect, useState } from 'react';
import { Badge, Button, ContextMenu, IconButton, Meter, NodeGraph, PanelBar, PropertyRow, Select, Slider, Sparkline, Switch, Toolbar, ToolbarSpacer, createNode, useDock } from '../../../src';
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
    { ...createNode('oscillator', 240, 30), id: 'osc' },
    { ...createNode('smooth', 470, 50), id: 'smooth' },
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

/** Property rows around real controls, as an inspector panel's body. */
export function InspectorPanel() {
  const [exposure, setExposure] = useState(0.62);
  const [live, setLive] = useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <PanelBar>
        <Badge tone="live" dot>
          Live
        </Badge>
        <span className="ar-panel-bar__spacer" />
        <Switch variant="compact" label="Live update" value={live} onChange={setLive} />
      </PanelBar>
      <PropertyRow label="Exposure" modified={exposure !== 0.62} onReset={() => setExposure(0.62)}>
        <Slider label="Exposure" value={exposure} onChange={setExposure} />
      </PropertyRow>
      <PropertyRow label="Gain" binding="LFO 1" status="bound">
        <Slider label="Gain" format="db" min={-60} max={12} decimals={1} defaultValue={-4.5} detents={[0]} status="bound" />
      </PropertyRow>
      <PropertyRow label="Mode" density="compact">
        <Select options={['Neutral', 'Warm', 'Cool']} defaultValue="Neutral" appearance="well" label="Mode" />
      </PropertyRow>
    </div>
  );
}

export function LayersPanel() {
  const [layers, setLayers] = useState(['Orb', 'Glass shell', 'Rim light', 'Backdrop']);
  const [selected, setSelected] = useState('Orb');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Toolbar label="Layer actions">
        <IconButton size="sm" label="Add layer" icon={IC.plus} onClick={() => setLayers((l) => [...l, `Layer ${l.length + 1}`])} />
        <IconButton size="sm" label="Duplicate" icon={IC.copy} onClick={() => setLayers((l) => [...l, `${selected} copy`])} />
        <ToolbarSpacer />
        <IconButton size="sm" label="Delete" icon={IC.trash} onClick={() => setLayers((l) => l.filter((x) => x !== selected))} />
      </Toolbar>
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
          <button type="button" className="sc-layer" data-on={name === selected ? '' : undefined} onClick={() => setSelected(name)}>
            <span>{name}</span>
            <span className="sc-layer__icons">
              {IC.eye}
              {IC.lock}
            </span>
          </button>
        </ContextMenu>
      ))}
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
