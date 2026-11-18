/* Live values — the value core and everything built on it: signals, the two short ways to a panel,
   custom controls, undo and files, monitors, typed sums, MIDI and panels in their own windows. */
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  Button,
  ControlsPanel,
  createInspectorStore,
  createMidiMap,
  createPane,
  Dock,
  effect,
  FrameGraph,
  folder,
  Graph,
  Inspector,
  Knob,
  NumberField,
  Panel,
  registerControl,
  signal,
  Slider,
  themeScopeOf,
  useControls,
} from '../../../src';
import type { DockPanel, InspectFolder, InspectItem } from '../../../src';
import { Chapter, Spec } from '../shared';

/* ---------- signals: the same drag, with and without React ---------- */

const angle = signal(0.35);

function SignalSide() {
  const renders = useRef(0);
  renders.current++;
  const shown = useRef<HTMLElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      effect(() => {
        const v = angle();
        if (bar.current) bar.current.style.transform = `scaleX(${v})`;
      }),
    [],
  );
  useEffect(() => {
    if (shown.current) shown.current.textContent = String(renders.current);
  });
  return (
    <Panel title="On a signal">
      <Slider label="Amount" signal={angle} />
      <div className="sc-live__bar">
        <div ref={bar} />
      </div>
      <p className="sc-live__count">
        Panel renders <b ref={shown} data-count="signal">1</b>
      </p>
    </Panel>
  );
}

function StateSide() {
  const [v, setV] = useState(0.35);
  const renders = useRef(0);
  renders.current++;
  return (
    <Panel title="In React state">
      <Slider label="Amount" value={v} onChange={setV} />
      <div className="sc-live__bar">
        <div style={{ transform: `scaleX(${v})` }} />
      </div>
      <p className="sc-live__count">
        Panel renders <b data-count="state">{renders.current}</b>
      </p>
    </Panel>
  );
}

/* ---------- useControls ---------- */

function HookDemo() {
  const { size, tint, round, label } = useControls('Badge', {
    size: { value: 96, min: 40, max: 160, step: 1, unit: 'px' },
    tint: '#4fd1ba',
    round: true,
    label: 'Prism',
    Motion: folder({ tilt: { value: 12, min: -45, max: 45, step: 1, face: 'degrees' } }, { open: false }),
    shuffle: () => undefined,
  });
  return (
    <div className="sc-live__split">
      <Panel title="Badge">
        <ControlsPanel only={['Badge']} />
      </Panel>
      <div className="sc-live__stage">
        <div className="sc-live__badge" style={{ width: size, height: size, background: tint, borderRadius: round ? '50%' : 8 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

/* ---------- createPane: no React in the calling code ---------- */

function PaneDemo() {
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    // an ordinary object, as a sketch would have it
    const params = { speed: 90, size: 64, tint: '#8fc7ff', offset: { x: 0, y: 0 }, spin: true, turned: 0 };
    const pane = createPane({ title: 'Sketch', container: host.current, theme: themeScopeOf(host.current).attrs['data-ar-theme'], bounds: { x: 12, y: 12, width: 290, height: 336 } });
    pane.addBinding(params, 'speed', { min: 0, max: 360, step: 1, unit: '°/s' });
    pane.addBinding(params, 'size', { min: 24, max: 120, step: 1, unit: 'px' });
    pane.addBinding(params, 'tint');
    pane.addBinding(params, 'spin');
    const place = pane.addFolder({ title: 'Place' });
    place.addBinding(params, 'offset', { label: 'Offset' });
    pane.addMonitor(params, 'turned', { label: 'Turned', unit: '°', decimals: 0 });
    pane.addButton({ title: 'Randomize', onClick: () => pane.randomize() });
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
      last = now;
      if (params.spin) params.turned = (params.turned + params.speed * dt) % 360;
      const el = stage.current;
      if (!el) return;
      el.style.width = el.style.height = `${params.size}px`;
      el.style.background = params.tint;
      el.style.transform = `translate(${params.offset.x * 80}px, ${params.offset.y * -80}px) rotate(${params.turned}deg)`;
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      pane.dispose();
    };
  }, []);
  return (
    <div className="sc-live__pane">
      <div className="sc-live__stage sc-live__stage--fill">
        <div ref={stage} className="sc-live__square" />
      </div>
      <div ref={host} className="sc-live__pane-host" />
    </div>
  );
}

/* ---------- a control of your own ---------- */

registerControl<number>('dial', {
  component: ({ item, value, set, commit }) => <Knob label={item.label} value={value} onChange={set} onCommit={commit} size={44} />,
  animatable: true,
});

const DIAL_ITEMS: InspectItem[] = [
  { key: 'drive', label: 'Drive', kind: 'custom', control: 'dial', default: 0.4, randomize: (random) => Number(random().toFixed(2)) },
  { key: 'mix', label: 'Mix', kind: 'number', default: 0.6, min: 0, max: 1, step: 0.01, face: 'percent' },
];
const dialStore = createInspectorStore(DIAL_ITEMS);

/* ---------- undo, files, links ---------- */

const KEPT_ITEMS: InspectItem[] = [
  { key: 'exposure', label: 'Exposure', kind: 'number', default: 0, min: -3, max: 3, step: 0.01, face: 'bipolar', unit: 'EV' },
  { key: 'contrast', label: 'Contrast', kind: 'number', default: 1, min: 0.5, max: 2, step: 0.01 },
  { key: 'tint', label: 'Tint', kind: 'color', default: '#f2e8d5' },
  { key: 'mode', label: 'Mode', kind: 'choice', default: 'film', options: [{ value: 'film', label: 'Film' }, { value: 'video', label: 'Video' }, { value: 'log', label: 'Log' }] },
];
const keptStore = createInspectorStore(KEPT_ITEMS, { persist: 'artinos-showcase.live.values', version: 2 });

function KeptDemo() {
  const doc = useSyncExternalStore(keptStore.subscribe, keptStore.state, keptStore.state);
  const [seed, setSeed] = useState<number | null>(null);
  return (
    <div className="sc-live__split">
      <Panel title="Grade">
        <Inspector items={KEPT_ITEMS} store={keptStore} search={false} />
      </Panel>
      <div className="sc-live__side">
        <Button onClick={() => setSeed(keptStore.randomize())}>Randomize</Button>
        <p className="sc-live__count">{seed === null ? 'Each roll has a seed' : `Seed ${seed}`}</p>
        <pre className="sc-live__doc" data-doc>
          {JSON.stringify({ ...keptStore.toJSON(), values: doc.values }, null, 1)}
        </pre>
      </div>
    </div>
  );
}

/* ---------- monitors ---------- */

function MonitorsDemo() {
  const read = useMemo(() => {
    const wave = (rate: number, base: number, swing: number) => () => base + swing * (0.5 + 0.5 * Math.sin((performance.now() / 1000) * rate));
    return { scene: wave(1.3, 3, 2), shadow: wave(2.1, 2, 1.5), post: wave(3.4, 1.5, 3) };
  }, []);
  return (
    <div className="sc-live__grid">
      <Panel title="This page">
        <FrameGraph />
      </Panel>
      <Panel title="A frame">
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
      </Panel>
    </div>
  );
}

/* ---------- typed sums, endless scrub ---------- */

function TypingDemo() {
  const [n, setN] = useState(128);
  const [s, setS] = useState(0.5);
  return (
    <Panel title="Type a sum">
      <NumberField label="Samples" value={n} onChange={setN} step={1} />
      <Slider label="Gain" value={s} onChange={setS} min={0} max={4} decimals={3} />
    </Panel>
  );
}

/* ---------- MIDI: a controller on the page stands in for one on the desk ---------- */

const PLAYED_ITEMS: InspectItem[] = [
  { key: 'cutoff', label: 'Cutoff', kind: 'number', default: 800, min: 20, max: 20000, step: 1, unit: 'Hz', face: 'log' },
  { key: 'reso', label: 'Resonance', kind: 'number', default: 0.3, min: 0, max: 1, step: 0.01 },
];
const playedStore = createInspectorStore(PLAYED_ITEMS);
const midiMap = createMidiMap(playedStore, PLAYED_ITEMS, { access: async () => ({ inputs: { forEach() {} }, onstatechange: null }) });

function MidiDemo() {
  const [cc, setCc] = useState(64);
  return (
    <div className="sc-live__split">
      <Panel title="Filter">
        <Inspector items={PLAYED_ITEMS} store={playedStore} midi={midiMap} bar={false} />
      </Panel>
      <div className="sc-live__stage">
        <Knob
          label="CC 21"
          value={cc}
          min={0}
          max={127}
          step={1}
          size={64}
          onChange={(v) => {
            setCc(v);
            midiMap.handle([0xb0, 21, v]);
          }}
        />
      </div>
    </div>
  );
}

/* ---------- a panel in its own window ---------- */

const WINDOW_ITEMS: InspectItem[] = [
  { key: 'bloom', label: 'Bloom', kind: 'number', default: 0.4, min: 0, max: 1, step: 0.01 },
  { key: 'fog', label: 'Fog', kind: 'number', default: 0.2, min: 0, max: 1, step: 0.01 },
  { key: 'fps', label: 'Frame', kind: 'monitor', read: () => 8 + 4 * Math.sin(performance.now() / 500), unit: 'ms', graph: true, min: 0, max: 16, budget: 11 },
];
const WINDOW_FOLDERS: InspectFolder[] = [];
const windowStore = createInspectorStore(WINDOW_ITEMS);

function WindowDemo() {
  const panels = useMemo<DockPanel[]>(
    () => [
      { id: 'look', title: 'Look', dock: 'left', content: <Inspector items={WINDOW_ITEMS} folders={WINDOW_FOLDERS} store={windowStore} search={false} /> },
      { id: 'same', title: 'Same values', dock: 'center', content: <Inspector items={WINDOW_ITEMS} folders={WINDOW_FOLDERS} store={windowStore} bar={false} /> },
    ],
    [],
  );
  return (
    <div className="sc-live__dock">
      <Dock panels={panels} palette={false} sizes={{ left: 0.5 }} />
    </div>
  );
}

export function LiveChapter() {
  return (
    <Chapter id="live">
      <Spec
        id="live-signal"
        text="A signal is the value itself. A control bound to one paints its own change, so a drag reaches your app at frame rate and the panel around it never renders. Drag both sliders and watch the counts: the left stays where it is."
        code={`const amount = signal(0.35);
effect(() => { mesh.scale.setScalar(amount()); });

<Slider label="Amount" signal={amount} />`}
      >
        <div className="sc-live__grid">
          <SignalSide />
          <StateSide />
        </div>
      </Spec>
      <Spec
        id="live-hook"
        text="One line in a component declares a panel. A bare value picks its own control; an object says more. Ask for signals with transient: true when a value is read every frame."
        code={`const { size, tint } = useControls('Badge', {
  size: { value: 96, min: 40, max: 160, unit: 'px' },
  tint: '#4fd1ba',
  Motion: folder({ tilt: { value: 12, min: -45, max: 45 } }),
});
<ControlsPanel />`}
      >
        <HookDemo />
      </Spec>
      <Spec
        id="live-pane"
        text="The same panel with no React in your code: bind a property of any object. Vectors and colours from three.js bind as they are. The panel is a MetaBlock, so drag it, dock it to an edge, or open it in a window."
        code={`const pane = createPane({ title: 'Sketch' });
pane.addBinding(params, 'speed', { min: 0, max: 360 });
pane.addBinding(mesh, 'position', { min: -1, max: 1 });
pane.addMonitor(stats, 'fps', { graph: true });
pane.addButton({ title: 'Randomize', onClick: () => pane.randomize() });`}
        wide
      >
        <PaneDemo />
      </Spec>
      <Spec
        id="live-custom"
        text="A control of your own joins every panel: it gets the row, the reset, undo, presets and files without further work. The built-in kinds go through the same registry, and yours can replace one."
        code={`registerControl<number>('dial', {
  component: ({ item, value, set, commit }) => (
    <Knob label={item.label} value={value} onChange={set} onCommit={commit} />
  ),
});
{ key: 'drive', label: 'Drive', kind: 'custom', control: 'dial', default: 0.4 }`}
      >
        <Panel title="Amp">
          <Inspector items={DIAL_ITEMS} store={dialStore} search={false} />
        </Panel>
      </Spec>
      <Spec
        id="live-kept"
        text="Every settled gesture is one step of undo. Values are kept across reloads, exported to a file, imported with older versions migrated, and carried in a link. Presets holds the file and link commands."
        keys={[
          ['Ctrl Z', 'Undo'],
          ['Ctrl Shift Z', 'Redo'],
        ]}
        code={`createInspectorStore(items, {
  persist: 'my-app.values',   // kept across reloads
  url: true,                  // carried in the address
  version: 2,
  migrate: (values, from) => values,
});
store.undo(); store.randomize({ seed: 7 }); store.toJSON();`}
      >
        <KeptDemo />
      </Spec>
      <Spec
        id="live-monitors"
        text="Live traces that never ask React for anything, and rest while off screen. A budget draws a line and turns the trace to the fault colour while the reading is over it; series can stack."
        code={`<FrameGraph budget={16.7} />
<Graph label="Frame time" unit="ms" stacked budget={11} series={[
  { label: 'Scene', read: () => timers.scene },
  { label: 'Post', read: () => timers.post, tone: 'warm' },
]} />`}
      >
        <MonitorsDemo />
      </Spec>
      <Spec
        id="live-typing"
        text="A number takes a sum. Click the field, or double-click a slider's readout, and type: x is the value now. Dragging a number never runs out of screen: past the edge it keeps going."
        keys={[
          ['2*3+1', '7'],
          ['pi/2', '1.571'],
          ['*2', 'Double it'],
          ['+=10', 'Add 10'],
          ['sqrt(x)', 'Any function'],
        ]}
      >
        <TypingDemo />
      </Spec>
      <Spec
        id="live-midi"
        text="Right-click a row, choose Learn MIDI controller and move a control: it now plays the value. The knob here stands in for one on your desk, sending controller 21."
        code={`const midi = createMidiMap(store, items, { storageKey: 'my-app.midi' });
<Inspector items={items} store={store} midi={midi} />`}
      >
        <MidiDemo />
      </Spec>
      <Spec
        id="live-window"
        text="Any panel opens in its own browser window, for a second monitor: right-click its tab and choose Open in New Window. It is the same panel on the same values, and closing the window brings it home."
        wide
      >
        <WindowDemo />
      </Spec>
    </Chapter>
  );
}
