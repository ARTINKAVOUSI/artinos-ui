/* The layouts page (#layouts): one working tool, arranged the ways we build them. One set of
   panels (an outliner, a material library, properties, schema settings, a render queue, monitors,
   performance, activity) and a set of layout presets that only say where each panel starts:
     inspector  one column on the right: the performance deck over a rail of every other panel
     deck       the canvas clear, everything in a deck of columns along the bottom
     board      no canvas: a dashboard of panels
   A preset is data (PRESETS): docks, sizes, tab looks, and the splits made once the workspace is
   up. Every panel stays a MetaBlock in every preset, so it can still be dragged anywhere. */
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import {
  ArtinosTheme,
  Badge,
  Button,
  Callout,
  ColorField,
  DENSITIES,
  DENSITY_META,
  Dock,
  createDockSections,
  Graph,
  IconButton,
  Inline,
  ItemList,
  ItemRow,
  Loader,
  MonitorDeck,
  NumberField,
  Panel,
  PanelBar,
  PerfDeck,
  PerformancePanel,
  Progress,
  PropertyRow,
  Section,
  SectionGroup,
  Segmented,
  Select,
  Slider,
  StatStrip,
  ToastProvider,
  ToolbarSeparator,
  signal,
  useSignalValue,
  useToast,
} from '../../../src';
import type { Accent, DeckChannel, Density, DockApi, DockPanel, DockProps, DockTabStyle, ItemStatus, ThemeName, ToastOptions } from '../../../src';
import { IC } from '../chapters/demos';
import { settings } from '../chapters/params-demo';
import { BACKDROPS, LIGHT_BACKDROPS } from '../shared';
import type { Backdrop } from '../shared';
import './layouts.css';

const glyph = (d: string) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const G = {
  folder: glyph('M1.8 4.2h4.4l1.4 1.6h6.6v6.6H1.8z'),
  mesh: glyph('M8 1.8l5.4 3.1v6.2L8 14.2l-5.4-3.1V4.9zM8 8l5.4-3.1M8 8v6.2M8 8L2.6 4.9'),
  light: glyph('M8 1.8a4 4 0 00-2.4 7.2V11h4.8V9a4 4 0 00-2.4-7.2zM6 13.2h4'),
  camera: glyph('M1.8 4.5h2.4l1-1.5h3.6l1 1.5h2.4v6.5H1.8zM8 9.6a2 2 0 100-4 2 2 0 000 4z'),
  image: glyph('M2 2.5h12v11H2zM2 11l3.5-3.5 3 3 2-2L14 12M10.5 6a1 1 0 100-2 1 1 0 000 2z'),
  move: glyph('M8 2v12M2 8h12M8 2L6.3 3.7M8 2l1.7 1.7M8 14l-1.7-1.7M8 14l1.7-1.7M2 8l1.7-1.7M2 8l1.7 1.7M14 8l-1.7-1.7M14 8l-1.7 1.7'),
  rotate: glyph('M13 8a5 5 0 11-1.6-3.7M13 2.5v2.5h-2.5'),
  scale: glyph('M2.5 13.5v-4M2.5 13.5h4M2.5 13.5l5-5M9 2.5h4.5V7M9 7h4.5'),
  pulse: glyph('M1.5 8h3l1.5-4 3 8 1.5-4h4'),
  bars: glyph('M3 13V8M6.5 13V3.5M10 13V6.5M13.5 13V10'),
  stack: glyph('M2.5 4h11M2.5 8h11M2.5 12h7'),
  bell: glyph('M4 11V7.5a4 4 0 018 0V11l1 1.5H3zM6.8 14h2.4'),
  clean: glyph('M2 2.5h3M2 2.5v3M14 2.5h-3M14 2.5v3M2 13.5h3M2 13.5v-3M14 13.5h-3M14 13.5v-3'),
};

/* ---------- activity: one log every panel writes to ---------- */

type Entry = { id: number; title: string; meta: string; status: ItemStatus; at: string };
const clock = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const log = signal<Entry[]>([
  { id: 2, title: 'Backdrop missing', meta: 'persian-garden.exr · relinked to the proxy', status: 'warn', at: '09:41:12' },
  { id: 1, title: 'Scene opened', meta: 'garden.scene · 14 objects', status: 'idle', at: '09:40:58' },
]);
const TONE_STATUS: Record<NonNullable<ToastOptions['tone']>, ItemStatus> = { neutral: 'idle', success: 'live', warning: 'warn', error: 'fault' };

/** A notice: a toast now, and a line in the Activity panel for later. */
function useNotice() {
  const notify = useToast();
  return (o: ToastOptions) => {
    notify(o);
    log.set([{ id: Date.now(), title: String(o.title), meta: o.description ? String(o.description) : 'No detail', status: TONE_STATUS[o.tone ?? 'neutral'], at: clock() }, ...log.peek()].slice(0, 30));
  };
}

/* ---------- the panels ---------- */

type Node = { id: string; title: string; icon: ReactElement; meta?: string; status?: ItemStatus; children?: Node[] };
const OBJECTS: Node[] = [
  { id: 'orb', title: 'Orb', icon: G.mesh, meta: '12,480 tris', status: 'live', children: [{ id: 'shell', title: 'Glass shell', icon: G.mesh, meta: 'thick glass' }] },
  { id: 'pool', title: 'Pool', icon: G.mesh, meta: '2,048 tris' },
];
const LIGHTS: Node[] = [
  { id: 'rim', title: 'Rim light', icon: G.light, meta: '4.2 lm' },
  { id: 'key', title: 'Key light', icon: G.light, meta: 'clipping', status: 'warn' },
];
const STAGE: Node[] = [
  { id: 'cam', title: 'Camera', icon: G.camera, meta: '35 mm' },
  { id: 'bg', title: 'Backdrop', icon: G.image, meta: 'proxy', status: 'warn' },
];

/** The outliner: one section per kind of thing, each a tree; a kind can be switched off whole. */
function ScenePanel() {
  const [open, setOpen] = useState<Record<string, boolean>>({ orb: true });
  const [picked, setPicked] = useState('orb');
  const [hidden, setHidden] = useState<string[]>([]);
  const [lights, setLights] = useState(true);
  const tree = (nodes: Node[], label: string) => {
    const rows: ReactElement[] = [];
    const walk = (list: Node[], depth: number) =>
      list.forEach((n) => {
        const off = hidden.includes(n.id);
        rows.push(
          <ItemRow
            key={n.id}
            depth={depth}
            expanded={n.children ? !!open[n.id] : undefined}
            onExpandedChange={(v) => setOpen({ ...open, [n.id]: v })}
            icon={n.icon}
            title={n.title}
            meta={n.meta}
            status={n.status}
            selected={picked === n.id}
            onSelect={() => setPicked(n.id)}
            disabled={off}
            trailing={<IconButton size="sm" label={off ? `Show ${n.title}` : `Hide ${n.title}`} icon={IC.eye} active={!off} onClick={() => setHidden((h) => (off ? h.filter((x) => x !== n.id) : [...h, n.id]))} />}
          />,
        );
        if (n.children && open[n.id]) walk(n.children, depth + 1);
      });
    walk(nodes, 0);
    return (
      <ItemList label={label} size="sm">
        {rows}
      </ItemList>
    );
  };
  return (
    <Panel title="Scene" subtitle="garden.scene" footer={hidden.length ? `${hidden.length} hidden` : 'Everything shown'}>
      <PanelBar>
        <IconButton size="sm" label="Add object" icon={IC.plus} />
        <IconButton size="sm" label="Duplicate" icon={IC.copy} />
        <span className="ar-panel-bar__spacer" />
        <IconButton size="sm" label="Delete" icon={IC.trash} />
      </PanelBar>
      <Section title="Objects" count={3} collapsible storageKey="artinos-showcase.layouts.scene.objects">
        {tree(OBJECTS, 'Objects')}
      </Section>
      <Section title="Lights" count={LIGHTS.length} collapsible enabled={lights} onEnabledChange={setLights} storageKey="artinos-showcase.layouts.scene.lights">
        {tree(LIGHTS, 'Lights')}
      </Section>
      <Section title="Stage" count={STAGE.length} collapsible storageKey="artinos-showcase.layouts.scene.stage">
        {tree(STAGE, 'Stage')}
      </Section>
    </Panel>
  );
}

const sphere = (c: string, gloss = 0.7) => (
  <span className="sc-sphere" style={{ background: `radial-gradient(circle at 34% 30%, rgba(255,255,255,${gloss}) 0 6%, ${c} 38%, color-mix(in oklab, ${c} 40%, #000) 100%)` }} />
);
const MATERIALS: Record<string, { id: string; title: string; meta: string; c: string; gloss?: number }[]> = {
  Glass: [
    { id: 'clear', title: 'Clear', meta: 'IOR 1.52', c: '#9fd8d0' },
    { id: 'smoke', title: 'Smoke', meta: 'IOR 1.50', c: '#5d6670' },
    { id: 'amber', title: 'Amber', meta: 'IOR 1.55', c: '#d79a3c' },
  ],
  Metal: [
    { id: 'gold', title: 'Gold', meta: 'rough 0.18', c: '#d4a640', gloss: 0.9 },
    { id: 'copper', title: 'Copper', meta: 'rough 0.30', c: '#b8673e', gloss: 0.8 },
    { id: 'steel', title: 'Steel', meta: 'rough 0.42', c: '#8c939a', gloss: 0.6 },
  ],
};

/** The library: categories, one open at a time; things picked by their look. */
function LibraryPanel() {
  const [picked, setPicked] = useState('clear');
  return (
    <Panel title="Library" subtitle="Materials">
      <SectionGroup accordion defaultOpen="Glass" label="Material families">
        {Object.entries(MATERIALS).map(([family, items]) => (
          <Section key={family} id={family} title={family} count={items.length}>
            <ItemList label={family} variant="grid" tileWidth={72}>
              {items.map((m) => (
                <ItemRow key={m.id} thumbnail={sphere(m.c, m.gloss)} thumbShape="round" title={m.title} meta={m.meta} selected={picked === m.id} onSelect={() => setPicked(m.id)} />
              ))}
            </ItemList>
          </Section>
        ))}
      </SectionGroup>
    </Panel>
  );
}

/* Properties: one set of sections kept by createDockSections, so each can be folded, dragged by its
   heading into another pane of the set, or torn off into a panel of its own. */
const MATERIAL0 = { transmission: 0.82, roughness: 0.18, tint: '#8DBBB4' };
function MaterialSection() {
  const [m, setM] = useState(MATERIAL0);
  const changed = Number(m.transmission !== MATERIAL0.transmission) + Number(m.roughness !== MATERIAL0.roughness) + Number(m.tint !== MATERIAL0.tint);
  return (
    <Section title="Material" count={changed ? `${changed} changed` : 4} modified={changed > 0} onReset={() => setM(MATERIAL0)}>
      <PropertyRow density="compact" label="Transmission" modified={m.transmission !== MATERIAL0.transmission} onReset={() => setM({ ...m, transmission: MATERIAL0.transmission })}>
        <Slider aria-label="Transmission" format="percent" decimals={0} value={m.transmission} onChange={(transmission) => setM({ ...m, transmission })} />
      </PropertyRow>
      <PropertyRow density="compact" label="Roughness" modified={m.roughness !== MATERIAL0.roughness} onReset={() => setM({ ...m, roughness: MATERIAL0.roughness })}>
        <Slider aria-label="Roughness" value={m.roughness} onChange={(roughness) => setM({ ...m, roughness })} />
      </PropertyRow>
      <PropertyRow density="compact" label="Tint" modified={m.tint !== MATERIAL0.tint} onReset={() => setM({ ...m, tint: MATERIAL0.tint })}>
        <ColorField value={m.tint} onChange={(tint) => setM({ ...m, tint })} />
      </PropertyRow>
      <PropertyRow density="compact" label="Shading">
        <Select options={['Thick glass', 'Thin glass', 'Frosted']} defaultValue="Thick glass" appearance="well" label="Shading" />
      </PropertyRow>
    </Section>
  );
}
function PostSection() {
  const [on, setOn] = useState(true);
  return (
    <Section title="Post" count={3} enabled={on} onEnabledChange={setOn}>
      <Slider label="Exposure" min={-3} max={3} unit="ev" decimals={2} bipolar detents={[0]} defaultValue={0.4} />
      <Slider label="Bloom" format="percent" decimals={0} defaultValue={0.24} />
      <Slider variant="stepped" label="Samples" min={1} max={8} steps={7} decimals={0} defaultValue={4} />
    </Section>
  );
}
const PROPERTY_SECTIONS: Record<string, { title: string; render: () => ReactElement }> = {
  transform: {
    title: 'Transform',
    render: () => (
      <Section title="Transform" count={3} columns={3}>
        <NumberField label="X" defaultValue={1.25} decimals={2} unit="m" />
        <NumberField label="Y" defaultValue={0} decimals={2} unit="m" />
        <NumberField label="Z" defaultValue={-0.5} decimals={2} unit="m" />
      </Section>
    ),
  },
  material: { title: 'Material', render: () => <MaterialSection /> },
  lens: {
    title: 'Lens',
    render: () => (
      <Section title="Lens" count={3}>
        <Slider variant="ruler" label="Focal" min={12} max={200} span={40} unit="mm" decimals={0} defaultValue={50} marks={[35, 50, 85]} />
        <Slider label="Aperture" mapping="log" min={1.4} max={16} decimals={1} defaultValue={2.8} />
        <Slider variant="gradient" gradient="temperature" label="White balance" min={2000} max={10000} decimals={0} defaultValue={5600} unit="K" />
      </Section>
    ),
  },
  post: { title: 'Post', render: () => <PostSection /> },
};
const propertySections = createDockSections({
  panes: { properties: ['transform', 'material', 'lens', 'post'] },
  render: (id) => PROPERTY_SECTIONS[id].render(),
  title: (id) => PROPERTY_SECTIONS[id]?.title ?? id,
});

function PropertiesPanel() {
  return (
    <Panel
      title="Properties"
      subtitle="Orb · mesh"
      actions={
        <Badge tone="live" dot>
          Live
        </Badge>
      }
      footer="Drag a heading to move its section"
    >
      <StatStrip
        items={[
          { label: 'Triangles', value: '12.4k' },
          { label: 'Materials', value: 2 },
          { label: 'Size', value: '1.25', unit: 'm' },
        ]}
      />
      <propertySections.Pane id="properties" label="Properties sections" toolbar />
    </Panel>
  );
}


const JOBS = [
  { id: 'j1', title: 'Garden · dusk', meta: '1920 × 1080 · 240 frames', img: BACKDROPS.garden, pos: '30% 40%' },
  { id: 'j2', title: 'Monstera close-up', meta: '3840 × 2160 · 1 frame', img: BACKDROPS.monstera, pos: '50% 50%' },
  { id: 'j3', title: 'Garden · turntable', meta: '1080 × 1080 · 120 frames', img: BACKDROPS.garden, pos: '70% 60%' },
];

function QueuePanel() {
  const notice = useNotice();
  const [at, setAt] = useState(0); // which job is rendering
  const [p, setP] = useState(0.2);
  const [running, setRunning] = useState(true);
  const done = at >= JOBS.length;
  useEffect(() => {
    if (!running || done) return;
    const t = setInterval(() => setP((v) => Math.min(1, v + 0.015)), 200);
    return () => clearInterval(t);
  }, [running, done]);
  useEffect(() => {
    if (p < 1 || done) return;
    notice({ title: 'Render finished', description: JOBS[at].title, tone: 'success' });
    setAt(at + 1);
    setP(0);
    // one notice per finished job
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p]);
  const overall = Math.min(1, (at + p) / JOBS.length);
  return (
    <Panel
      title="Render queue"
      subtitle={done ? 'All rendered' : `${JOBS.length - at} to go`}
      actions={
        <Badge tone={done || !running ? 'neutral' : 'live'} dot={!done && running}>
          {done ? 'Done' : running ? 'Rendering' : 'Paused'}
        </Badge>
      }
    >
      <Section title="Now" count={`${Math.min(at + 1, JOBS.length)} of ${JOBS.length}`}>
        <Progress label="Queue" value={overall} segments={JOBS.length * 4} status={done ? 'done' : 'running'} caption={done ? 'Every job is on disk' : JOBS[at].title} />
        <Inline justify="end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setAt(0);
              setP(0);
              setRunning(true);
            }}
          >
            Restart
          </Button>
          <Button size="sm" variant="primary" disabled={done} onClick={() => setRunning(!running)}>
            {running ? 'Pause' : 'Render'}
          </Button>
        </Inline>
      </Section>
      <Section title="Jobs" count={JOBS.length}>
        <ItemList label="Jobs" variant="divided" size="lg">
          {JOBS.map((j, i) => (
            <ItemRow
              key={j.id}
              thumbnail={<img src={j.img} alt="" style={{ objectPosition: j.pos }} draggable={false} />}
              thumbShape="wide"
              title={j.title}
              meta={j.meta}
              status={i < at ? 'idle' : i === at && running ? 'live' : 'idle'}
              value={i < at ? 'Done' : i === at ? `${Math.round(p * 100)}%` : 'Queued'}
              progress={i === at ? p : undefined}
            />
          ))}
        </ItemList>
      </Section>
    </Panel>
  );
}

/** A service watched on one deck: every value in view, one on the stage, the past under the pointer. */
function MonitorsPanel() {
  const read = useMemo(() => {
    const wave = (rate: number, base: number, swing: number) => () => base + swing * (0.5 + 0.5 * Math.sin((performance.now() / 1000) * rate)) + (Math.random() - 0.5) * swing * 0.15;
    return { queue: wave(0.5, 6, 22), latency: wave(0.9, 60, 90), errors: wave(0.3, 0.1, 1.4) };
  }, []);
  const channels = useMemo<DeckChannel[]>(
    () => [
      { id: 'latency', label: 'Latency', format: (v) => `${v.toFixed(0)} ms`, read: () => ((v) => ({ value: v.toFixed(0), unit: 'ms', plot: v, limit: 120, share: v / 200, status: v > 120 ? ('warn' as const) : ('ok' as const), state: 'Slow' }))(read.latency()) },
      { id: 'queue', label: 'Queue', format: (v) => `${v.toFixed(0)} jobs`, read: () => ((v) => ({ value: v.toFixed(0), unit: 'jobs', plot: v, limit: 24, share: v / 40, status: v > 24 ? ('warn' as const) : ('ok' as const), state: 'Backing up' }))(read.queue()) },
      { id: 'errors', label: 'Errors', format: (v) => `${v.toFixed(2)} %`, read: () => ((v) => ({ value: v.toFixed(2), unit: '%', plot: v, limit: 1, share: v / 2, status: v > 1 ? ('fault' as const) : ('ok' as const), state: 'Failing' }))(read.errors()) },
      { id: 'disk', label: 'Disk', read: () => ({ value: '656', unit: 'GB', plot: 656, share: 0.656, status: 'ok' as const }) },
    ],
    [read],
  );
  return <MonitorDeck label="Render service" channels={channels} facts={() => [{ label: 'Disk', value: '656 GB' }, { label: 'Workers', value: 6 }]} />;
}

const SCENE_FACTS = () => [
  { label: 'Calls', value: 182 },
  { label: 'Tris', value: '12.4k' },
  { label: 'Tex', value: 14 },
];

/** How the program is running, in the room the pane has: the deck is the whole pane. */
function PerformancePane() {
  // the page has no renderer of its own, so the scene's counts are given as facts
  return <PerfDeck label="Performance" facts={SCENE_FACTS} />;
}

/** Every figure, for when there is room to read them. */
function FiguresPanel() {
  const read = useMemo(() => {
    const wave = (rate: number, base: number, swing: number) => () => base + swing * (0.5 + 0.5 * Math.sin((performance.now() / 1000) * rate));
    return { scene: wave(1.3, 3, 2), shadow: wave(2.1, 2, 1.5), post: wave(3.4, 1.5, 3) };
  }, []);
  return (
    <Panel title="Figures" subtitle="This page">
      <Section title="Frame" count="3 passes" collapsible>
        <Graph
          label="Frame time"
          unit="ms"
          stacked
          budget={11}
          min={0}
          max={16}
          series={[
            { label: 'Scene', read: read.scene },
            { label: 'Shadow', read: read.shadow, tone: 'neutral' },
            { label: 'Post', read: read.post, tone: 'warm' },
          ]}
        />
      </Section>
      <Section title="Every figure" collapsible storageKey="artinos-showcase.layouts.perf.open">
        <PerformancePanel storageKey="artinos-showcase.layouts.perf" />
      </Section>
    </Panel>
  );
}

function ActivityPanel() {
  const notice = useNotice();
  const entries = useSignalValue(log);
  const faults = entries.filter((e) => e.status === 'fault').length;
  return (
    <Panel title="Activity" subtitle="What the tool has told you" actions={faults ? <Badge tone="danger">{`${faults} failed`}</Badge> : undefined}>
      <Section title="Notify" count={4}>
        <Inline wrap>
          <Button size="sm" onClick={() => notice({ title: 'Layout saved' })}>
            Note
          </Button>
          <Button size="sm" onClick={() => notice({ title: 'Scene saved', description: 'garden.scene', tone: 'success' })}>
            Success
          </Button>
          <Button size="sm" onClick={() => notice({ title: 'Key light is clipping', description: 'Lower it below 4 lm', tone: 'warning' })}>
            Warning
          </Button>
          <Button size="sm" onClick={() => notice({ title: 'Render failed', description: 'Out of memory at frame 87', tone: 'error', duration: 0 })}>
            Failure
          </Button>
        </Inline>
      </Section>
      <Section title="Log" count={entries.length}>
        {faults ? (
          <Callout title="A render failed" tone="fault">
            <p>Free memory or lower the samples, then restart the queue.</p>
          </Callout>
        ) : null}
        <ItemList label="Log" size="sm" empty="Nothing has happened yet.">
          {entries.map((e) => (
            <ItemRow key={e.id} title={e.title} meta={e.meta} status={e.status} value={e.at} />
          ))}
        </ItemList>
      </Section>
    </Panel>
  );
}

const PANELS: Record<string, Omit<DockPanel, 'id' | 'dock' | 'active'>> = {
  scene: { title: 'Scene', description: 'The outliner: a tree', content: <ScenePanel /> },
  library: { title: 'Library', description: 'Materials, picked by look', content: <LibraryPanel /> },
  properties: { title: 'Properties', description: 'The selected object', content: <PropertiesPanel />, capabilities: { closable: false } },
  physics: { title: 'Physics', description: 'Settings from a schema', content: <settings.Pane id="physics" label="Physics groups" /> },
  look: { title: 'Look', description: 'Settings from a schema', content: <settings.Pane id="look" label="Look groups" /> },
  queue: { title: 'Queue', icon: G.stack, description: 'Work under way', content: <QueuePanel /> },
  monitors: { title: 'Monitors', icon: G.bars, description: 'Live values', content: <MonitorsPanel /> },
  performance: { title: 'Performance', icon: G.pulse, description: 'How the page is running', content: <PerformancePane /> },
  figures: { title: 'Figures', description: 'Every figure and the frame passes', content: <FiguresPanel /> },
  activity: { title: 'Activity', icon: G.bell, description: 'Notices and the log', content: <ActivityPanel /> },
};
type PanelId = keyof typeof PANELS;

/* ---------- the presets ---------- */

type Edge = NonNullable<DockPanel['dock']>;
interface Preset {
  id: string;
  label: string;
  /** One line under the bar: when to use this arrangement. */
  about: string;
  /** A canvas behind the panels. Without one, a `center` dock fills the middle. */
  canvas: boolean;
  /** Where each panel starts, in tab order; the first of a dock is shown unless `front` names another. */
  place: [PanelId, Edge][];
  front?: PanelId[];
  sizes?: DockProps['sizes'];
  tabs?: DockProps['tabs'];
  /** Columns or rows made once the workspace is up: split `panel` off, beside the group `of` is in. */
  splits?: { panel: PanelId; of: PanelId; area: 'left' | 'right' | 'top' | 'bottom'; size: number; /** The group's height or width in px, in place of `size`. */ px?: number; with?: PanelId[]; tabs?: DockTabStyle }[];
}

const PRESETS: Preset[] = [
  {
    id: 'inspector',
    label: 'Inspector',
    about: 'One column beside the canvas: the live performance deck on top, edge to edge with no tabs, and the inspector under it as a rail of tabs.',
    canvas: true,
    place: [['properties', 'right'], ['physics', 'right'], ['look', 'right'], ['scene', 'right'], ['library', 'right'], ['queue', 'right'], ['monitors', 'right'], ['activity', 'right'], ['performance', 'right']],
    sizes: { right: 0.2 },
    tabs: { right: 'side' },
    splits: [{ panel: 'performance', of: 'properties', area: 'top', size: 0.09, px: 103, tabs: { placement: 'side', look: 'hidden' } }],
  },
  {
    id: 'deck',
    label: 'Bottom deck',
    about: 'The canvas kept whole: every panel in a deck of columns along the bottom, the way a mixing or grading desk is laid out.',
    canvas: true,
    place: [['properties', 'bottom'], ['physics', 'bottom'], ['look', 'bottom'], ['scene', 'bottom'], ['library', 'bottom'], ['monitors', 'bottom'], ['performance', 'bottom'], ['queue', 'bottom'], ['activity', 'bottom']],
    sizes: { bottom: 0.42 },
    tabs: { bottom: { look: 'pill' } },
    splits: [
      { panel: 'monitors', of: 'properties', area: 'right', size: 0.64, with: ['performance'] },
      { panel: 'queue', of: 'monitors', area: 'right', size: 0.5, with: ['activity'] },
      { panel: 'scene', of: 'properties', area: 'left', size: 0.2, with: ['library'] },
    ],
  },
  {
    id: 'board',
    label: 'Dashboard',
    about: 'No canvas: a workspace of panels to watch and steer a system. Readouts fill the middle, lists and settings stand at the sides.',
    canvas: false,
    place: [['queue', 'left'], ['scene', 'left'], ['library', 'left'], ['monitors', 'center'], ['properties', 'right'], ['physics', 'right'], ['look', 'right'], ['performance', 'center'], ['activity', 'center']],
    sizes: { left: 0.26, right: 0.26 },
    splits: [
      { panel: 'performance', of: 'monitors', area: 'right', size: 0.5 },
      { panel: 'activity', of: 'monitors', area: 'bottom', size: 0.42 },
    ],
  },
];

/** The preset's splits, through the same engine calls a drag makes. Safe to run twice. */
function applySplits(api: DockApi, preset: Preset) {
  const ws = api.workspace;
  const groupOf = (id: string) => ws.getBlockRelationshipContext(id)?.groupId;
  for (const s of preset.splits ?? []) {
    const target = groupOf(s.of);
    const home = `dock.${preset.place.find(([p]) => p === s.panel)?.[1]}`;
    if (!target || groupOf(s.panel) !== home) continue; // already split off
    const made = ws.splitBlock(s.panel, target, s.area, s.size);
    if (typeof made !== 'string') continue;
    for (const id of s.with ?? []) ws.dockBlock(id, { area: 'center', targetGroupId: made });
    if (s.tabs) ws.setGroupMeta(made, { tabs: s.tabs });
    const room = document.querySelector('.sc-layouts__stage')?.getBoundingClientRect();
    const along = room ? (s.area === 'top' || s.area === 'bottom' ? room.height : room.width) - 20 : 0;
    ws.resizeDockedGroup(made, s.px && along ? s.px / along : s.size, { history: false });
    ws.activateBlock(s.panel);
  }
}

/* ---------- the canvas and its tools ---------- */

const TOOLS = [
  { id: 'move', label: 'Move', key: 'w' },
  { id: 'rotate', label: 'Rotate', key: 'e' },
  { id: 'scale', label: 'Scale', key: 'r' },
] as const;

/** The canvas tools: given to the Dock as `tools`, which attaches them to the panels. W · E · R pick one. */
function CanvasTools({ api }: { api: DockApi | null }) {
  const [tool, setTool] = useState<(typeof TOOLS)[number]['id']>('move');
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement).closest?.('input, textarea, select, [contenteditable]')) return;
      const hit = TOOLS.find((t) => t.key === e.key.toLowerCase());
      if (hit) setTool(hit.id);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  return (
    <>
      {TOOLS.map((t) => (
        <IconButton key={t.id} size="sm" label={`${t.label} · ${t.key.toUpperCase()}`} icon={G[t.id]} active={tool === t.id} onClick={() => setTool(t.id)} />
      ))}
      <ToolbarSeparator />
      <IconButton size="sm" label="Undo layout · Ctrl Z" icon={IC.undo} onClick={() => api?.workspace.undo()} />
      <IconButton size="sm" label="Clean view · H" icon={G.clean} onClick={() => api?.setVisible(false)} />
    </>
  );
}

/* ---------- the page ---------- */

export function LayoutsPage({
  theme,
  accent,
  type,
  bg,
  density,
  onDensity,
  onExit,
}: {
  theme: ThemeName;
  accent: string;
  type: string;
  bg: Backdrop;
  density: Density;
  onDensity: (d: Density) => void;
  onExit: () => void;
}) {
  const [id, setId] = useState(() => new URLSearchParams(location.search).get('layout') ?? 'inspector');
  const preset = PRESETS.find((p) => p.id === (id === 'sides' || id === 'rail' ? 'inspector' : id)) ?? PRESETS[0];
  const [api, setApi] = useState<DockApi | null>(null);
  const [run, setRun] = useState(0); // counts resets, so the same preset can be laid out again
  const [loading, setLoading] = useState(1);
  const panels = useMemo<DockPanel[]>(
    () => preset.place.map(([pid, dock]) => ({ ...PANELS[pid], id: pid, dock, active: preset.front?.includes(pid) })),
    [preset],
  );
  return (
    <ArtinosTheme
      theme={theme}
      accent={accent === 'theme' ? undefined : (accent as Accent)}
      type={type}
      density={density}
      scene={LIGHT_BACKDROPS.has(bg) ? 'light' : undefined}
      className="sc-layouts"
      style={{ '--sc-scene': bg !== 'none' ? `url(${BACKDROPS[bg]})` : 'none' } as CSSProperties}
    >
      <ToastProvider>
        <header className="sc-layouts__bar">
          <Button size="sm" variant="ghost" onClick={onExit}>
            ← Showcase
          </Button>
          <b className="sc-layouts__title">Layouts</b>
          <Segmented className="sc-layouts__presets" options={PRESETS.map((p) => ({ value: p.id, label: p.label }))} value={preset.id} onChange={setId} label="Layout preset" />
          <span className="sc-layouts__about">{preset.about}</span>
          <Segmented className="sc-layouts__density" options={DENSITIES.map((d) => ({ value: d, label: DENSITY_META[d].label }))} value={density} onChange={onDensity} label="Density" />
          <Button size="sm" onClick={() => setRun((n) => n + 1)}>
            Reset layout
          </Button>
          <Button size="sm" onClick={() => setLoading((n) => n + 1)}>
            Reload scene
          </Button>
        </header>
        <div className="sc-layouts__stage">
          <Dock
            key={preset.id + run}
            panels={panels}
            viewport={preset.canvas ? <div className="sc-layouts__canvas" /> : undefined}
            tools={preset.canvas ? <CanvasTools api={api} /> : undefined}
            toolsLabel="Canvas tools"
            sizes={preset.sizes}
            tabs={preset.tabs}
            viewProps={{ padding: 10, gap: 8 }}
            hideKey="h"
            onReady={(a) => {
              applySplits(a, preset);
              setApi(a);
            }}
          />
          {loading ? <LoadCover key={loading} onDone={() => setLoading(0)} /> : null}
        </div>
      </ToastProvider>
    </ArtinosTheme>
  );
}

/** The loader over the workspace while a scene loads; it says so when it is done. */
function LoadCover({ onDone }: { onDone: () => void }) {
  const notice = useNotice();
  return (
    <Loader
      cover="box"
      duration={1600}
      label="Loading scene"
      onDone={() => {
        notice({ title: 'Scene loaded', description: 'garden.scene · 14 objects', tone: 'success' });
        onDone();
      }}
    />
  );
}
