/* Showcase — sections 21–30: actions, inputs and display, overlays, and the workspace
   (Dock + NodeGraph). Rendered after the core gallery, here and in the Theme Studio preview. */
import { useEffect, useMemo, useState } from 'react';
import {
  Badge, Button, CommandPalette, ContextMenu, Dialog, Dock, FileDrop, IconButton, Kbd, Knob, Meter, Menu, NodeGraph, PanelBar, PropertyRow, Select, Slider,
  Sparkline, Switch, TextField, ToastProvider, Toolbar, ToolbarSeparator, ToolbarSpacer, Tooltip, XYPad, createNode, useDock, useToast,
} from '../../../src';
import type { Command, DockPanel, GraphDefinition, MenuEntry } from '../../../src';
import { BACKDROPS, ICONS, Part, Spec } from '../shared';

const icon = (d: string) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const IC = {
  plus: icon('M8 3.5v9M3.5 8h9'),
  eye: icon('M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8zM8 10a2 2 0 100-4 2 2 0 000 4z'),
  lock: icon('M4.5 7.5h7v6h-7zM5.5 7.5V5.5a2.5 2.5 0 015 0v2'),
  trash: icon('M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 9h5.6l.7-9'),
  copy: icon('M5.5 5.5h7v7h-7zM3.5 10.5v-7h7'),
  more: icon('M3.5 8h.01M8 8h.01M12.5 8h.01'),
  play: icon('M5 3.5v9l7-4.5z'),
};

/** A live, smoothly wandering series for the meters and sparklines. */
function useLiveSeries(length = 48) {
  const [series, setSeries] = useState(() => Array.from({ length }, (_, i) => 0.5 + 0.3 * Math.sin(i / 4)));
  useEffect(() => {
    const id = setInterval(() => setSeries((s) => [...s.slice(1), Math.min(1, Math.max(0, s[s.length - 1] + (Math.random() - 0.5) * 0.18))]), 220);
    return () => clearInterval(id);
  }, []);
  return series;
}

/* ---------- workspace content ---------- */

const SAMPLE_GRAPH: GraphDefinition = {
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

function InspectorPanel() {
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

function LayersPanel() {
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

function ConsolePanel() {
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

function GraphPanel({ height }: { height?: number }) {
  const [graph, setGraph] = useState(SAMPLE_GRAPH);
  return (
    <div style={{ height: height ?? 'max(260px, calc(var(--ar-dock-panel-h, 300px) - 28px))' }}>
      <NodeGraph value={graph} onChange={setGraph} />
    </div>
  );
}

function WorkspaceDemo() {
  const panels = useMemo<DockPanel[]>(
    () => [
      { id: 'inspector', title: 'Inspector', description: 'Material controls', dock: 'left', content: <InspectorPanel /> },
      { id: 'layers', title: 'Layers', description: 'Scene layers — right-click one', dock: 'right', content: <LayersPanel /> },
      { id: 'console', title: 'Console', description: 'Live readouts', active: true, content: <ConsolePanel />, footer: 'Sampling · 220 ms' },
      { id: 'graph', title: 'Graph', description: 'Node editor', keywords: ['nodes', 'wires'], content: <GraphPanel /> },
      { id: 'notes', title: 'Notes', description: 'A floating panel', dock: 'float', content: <p className="sc-text">Drag a tab out to float it, onto an edge to dock it, onto another dock to merge. Right-click a tab for every placement.</p> },
    ],
    [],
  );
  return (
    <div className="sc-workspace">
      <Dock
        panels={panels}
        viewport={<img className="sc-workspace__view" src={BACKDROPS.garden} alt="" />}
        storageKey="artinos-showcase.dock.v1"
        sizes={{ left: 0.26, right: 0.24, bottom: 0.38 }}
        floatBounds={{ x: 380, y: 60, width: 300, height: 170 }}
        viewProps={{ padding: 8, gap: 6 }}
      />
    </div>
  );
}

/* ---------- overlays demo ---------- */

function OverlayDemo() {
  const [open, setOpen] = useState(false);
  const notify = useToast();
  const items: MenuEntry[] = [
    { type: 'label', label: 'Object' },
    { id: 'dup', label: 'Duplicate', icon: IC.copy, shortcut: 'Ctrl D', onSelect: () => notify({ title: 'Duplicated', tone: 'success' }) },
    { id: 'hide', label: 'Hide', icon: IC.eye, onSelect: () => notify({ title: 'Hidden' }) },
    { type: 'separator' },
    { id: 'del', label: 'Delete', icon: IC.trash, danger: true, onSelect: () => setOpen(true) },
  ];
  return (
    <div className="sc-row" style={{ alignItems: 'center' }}>
      <Menu trigger={<Button icon={IC.more}>Menu</Button>} items={items} />
      <Tooltip content="Tooltips follow the theme, even portalled">
        <Button variant="ghost">Hover me</Button>
      </Tooltip>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete…
      </Button>
      <Button onClick={() => notify({ title: 'Render queued', description: 'Frame 1–240 · 4K', action: { label: 'Undo', onClick: () => notify({ title: 'Cancelled' }) } })}>
        Toast
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete the orb?"
        description="It is removed from the scene and its graph. This can't be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => (setOpen(false), notify({ title: 'Deleted', tone: 'error' }))}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}

function PaletteDemo() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState('—');
  const commands: Command[] = [
    { id: 'new', label: 'New scene', group: 'File', shortcut: 'Ctrl N', run: () => setLast('New scene') },
    { id: 'open', label: 'Open…', group: 'File', run: () => setLast('Open') },
    { id: 'render', label: 'Render frame', group: 'Render', keywords: 'export image', run: () => setLast('Render frame') },
    { id: 'theme', label: 'Theme: Deep Frost', group: 'View', run: () => setLast('Theme: Deep Frost') },
  ];
  return (
    <div className="sc-row" style={{ alignItems: 'center' }}>
      <Button onClick={() => setOpen(true)} trailing={<Kbd keys={['mod', 'K']} />}>
        Command palette
      </Button>
      <span className="sc-note">
        Last command: <b>{last}</b>
      </span>
      <CommandPalette commands={commands} open={open} onOpenChange={setOpen} hotkey={null} />
    </div>
  );
}

/* ---------- sections ---------- */

export function ExtendedGallery() {
  const [text, setText] = useState('Orb');
  const [search, setSearch] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [angle, setAngle] = useState(0.35);
  const [mix, setMix] = useState(0.7);
  const [xy, setXy] = useState<[number, number]>([0.4, 0.6]);
  const series = useLiveSeries();
  return (
    <ToastProvider>
      <Part title="Actions" note="button · icon button · toolbar · key · badge" />

      <Spec
        n="21"
        title="Buttons"
        text="Buttons are inserts you press: default, primary, ghost and danger, with an optional icon and a trailing hint. Icon buttons carry their label as the tooltip and accessible name. A Toolbar groups them; Kbd draws key caps (mod is ⌘ on Apple, Ctrl elsewhere); Badge tags a status."
        code={`<Button variant="primary" icon={<PlayIcon />}>Render</Button>
<Toolbar label="Edit">
  <IconButton label="Bold" icon={<B />} active />
  <ToolbarSeparator />
  <IconButton label="Delete" icon={<Trash />} />
</Toolbar>
<Kbd keys={['mod', 'K']} />   <Badge tone="live" dot>Live</Badge>`}
      >
        <div className="sc-row" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="primary" icon={IC.play}>
            Render
          </Button>
          <Button>Default</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button size="sm" trailing={<Kbd keys={['mod', 'S']} />}>
            Save
          </Button>
        </div>
        <div className="sc-row" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Toolbar label="Text style">
            <IconButton label="Bold" icon={ICONS.bold} active />
            <IconButton label="Italic" icon={ICONS.italic} />
            <IconButton label="Underline" icon={ICONS.under} />
            <ToolbarSeparator />
            <IconButton label="Align left" icon={ICONS.alignL} filled />
            <IconButton label="Center" icon={ICONS.alignC} />
            <IconButton label="Align right" icon={ICONS.alignR} />
          </Toolbar>
          <Kbd keys={['mod', 'Shift', 'P']} />
          <Badge tone="live" dot>
            Live
          </Badge>
          <Badge tone="warm">Bound</Badge>
          <Badge tone="danger">Fault</Badge>
          <Badge>v2.0</Badge>
        </div>
      </Spec>

      <Part title="Inputs & display" note="text · files · knob · pad · meters · inspector rows" />

      <Spec
        n="22"
        title="Text & files"
        text="TextField is a recessed well: type='search' adds the magnifier and a clear button. FileDrop accepts a drop or a click, filtered by accept."
        code={`<TextField label="Name" value={name} onChange={setName} />
<TextField type="search" placeholder="Filter…" value={q} onChange={setQ} />
<FileDrop accept="image/*,.glb" multiple onFiles={(files) => load(files)} title="Drop a model or image" hint="GLB · PNG · JPG" />`}
      >
        <div className="sc-grid">
          <TextField label="Name" value={text} onChange={setText} />
          <TextField type="search" placeholder="Filter parameters…" value={search} onChange={setSearch} />
        </div>
        <FileDrop accept="image/*,.glb" multiple onFiles={(f) => setFiles(f.map((x) => x.name))} title="Drop a model or image" hint={files.length ? files.join(' · ') : 'GLB · PNG · JPG'} />
      </Spec>

      <Spec
        n="23"
        title="Knob & XY pad"
        text="A Knob turns with a vertical drag or the wheel when focused; double-click returns it to its default. XYPad sets two values at once: drag the puck, or use the arrow keys."
        code={`<Knob label="Angle" value={a} onChange={setA} defaultValue={0.5} showLabel />
<XYPad label="Pan / tilt" value={xy} onChange={setXy} height={150} />`}
      >
        <div className="sc-row" style={{ alignItems: 'center' }}>
          <Knob label="Angle" value={angle} onChange={setAngle} defaultValue={0.5} showLabel />
          <Knob label="Mix" value={mix} onChange={setMix} defaultValue={0.5} showLabel size={44} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <XYPad label="Pan / tilt" value={xy} onChange={setXy} height={150} />
          </div>
        </div>
      </Spec>

      <Spec
        n="24"
        title="Meters"
        text="Meter shows a level, with an optional falling peak; Sparkline a trend, with an optional fill and a threshold line (a frame budget, say). Both are display-only and carry an accessible label."
        code={`<Meter label="CPU" value={cpu} valueText="42%" peak />
<Sparkline label="Frame time" values={samples} fill threshold={16.7} />`}
      >
        <div className="sc-grid">
          <Meter label="CPU" value={series[series.length - 1]} valueText={`${Math.round(series[series.length - 1] * 100)}%`} peak />
          <Meter label="Memory" value={0.38} tone="warm" />
        </div>
        <Sparkline label="Frame time" values={series} fill threshold={0.7} height={40} width={480} />
      </Spec>

      <Spec
        n="25"
        title="Property rows"
        text="An inspector row around any control: binding names the driver of a bound value, modified marks a change with a quiet dot, onReset adds a reset, status and message explain a fault in words. compact puts the label in its own column."
        code={`<PropertyRow label="Gain" binding="LFO 1" status="bound"><Slider label="Gain" … /></PropertyRow>
<PropertyRow label="Mode" density="compact"><Select … /></PropertyRow>`}
      >
        <InspectorPanel />
      </Spec>

      <Part title="Overlays" note="menu · tooltip · dialog · toast · palette — all portalled, all themed" />

      <Spec
        n="26"
        title="Menus, dialogs & toasts"
        text="Menu opens from a button, ContextMenu from a right-click; both are keyboard driven and stay on screen. Dialog is the native <dialog>, so focus and Escape just work. Toasts come from useToast() inside a ToastProvider. Every overlay portals to <body> and keeps the theme of where it was opened."
        code={`<Menu trigger={<Button>Menu</Button>} items={[{ id: 'dup', label: 'Duplicate', onSelect: dup }, { type: 'separator' }, …]} />
<ContextMenu items={() => entries}><div>right-click me</div></ContextMenu>
<Dialog open={open} onClose={close} title="Delete?" footer={<Button variant="danger">Delete</Button>} />
const notify = useToast(); notify({ title: 'Saved', tone: 'success' });`}
      >
        <OverlayDemo />
        <ContextMenu
          items={() => [
            { id: 'a', label: 'Copy', icon: IC.copy, onSelect: () => undefined },
            { id: 'b', label: 'Paste', onSelect: () => undefined, disabled: true },
          ]}
        >
          <div className="sc-drop-hint">Right-click here for a context menu</div>
        </ContextMenu>
      </Spec>

      <Spec
        n="27"
        title="Command palette"
        text="Ctrl/⌘ K search across commands, grouped and fuzzy-matched on label and keywords; arrows, Enter and Escape drive it. Set hotkey to change or disable the shortcut."
        code={`<CommandPalette commands={[{ id: 'render', label: 'Render frame', group: 'Render', run: render }]} open={open} onOpenChange={setOpen} />`}
      >
        <PaletteDemo />
      </Spec>

      <Part title="Workspace" note="dock · metablock · node graph" />

      <Spec
        n="28"
        title="Dock"
        text="A studio workspace in one component. Panels sit in docks on the left, right and bottom as tabs. Drag a tab out to float it, onto an edge to dock it, onto another dock to merge; right-click a tab for every placement. A panel's PanelBar moves up into the tab strip when there is room. The arrangement is saved with storageKey. Built on the MetaBlock engine, themed by the tokens."
        keys={[
          ['DRAG TAB', 'float · dock · merge · split'],
          ['RIGHT-CLICK TAB', 'snap · dock · pin · auto-hide · attach'],
          ['CTRL/⌘ K', 'search panels and commands'],
        ]}
        code={`<Dock
  viewport={<Canvas>…</Canvas>}
  storageKey="my-app.dock"
  panels={[
    { id: 'inspector', title: 'Inspector', dock: 'left', content: <Inspector /> },
    { id: 'console', title: 'Console', content: <Console />, footer: 'Ready' },
    { id: 'notes', title: 'Notes', dock: 'float', content: <Notes /> },
  ]}
/>`}
      >
        <WorkspaceDemo />
      </Spec>

      <Spec
        n="29"
        title="Node graph"
        text="A node editor: drag from a port to wire, drag the canvas to pan, wheel to zoom, right-click the canvas for the node palette. Wires are type-checked and cycles flagged. graph/gpu compiles a graph to three.js TSL nodes (it needs three)."
        code={`const [graph, setGraph] = useState<GraphDefinition>({ domain: 'signal', nodes: [], edges: [] });
<NodeGraph value={graph} onChange={setGraph} />`}
      >
        <GraphPanel height={430} />
      </Spec>
    </ToastProvider>
  );
}
