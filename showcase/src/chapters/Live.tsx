/* Live values — the value core and everything built on it: signals, the two short ways to a panel,
   custom controls, undo and files, monitors, typed sums, MIDI and panels in their own windows. */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  Button,
  ControlsPanel,
  createInspectorStore,
  createMidiMap,
  createPane,
  createPerfFeed,
  Dock,
  effect,
  FrameGraph,
  folder,
  Graph,
  Inspector,
  Knob,
  MonitorCell,
  MonitorStrip,
  NumberField,
  Panel,
  PerformancePanel,
  perfMonitor,
  PerfStrip,
  registerControl,
  Segmented,
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

/* ---------- the performance panel, on a real WebGL scene you can load ---------- */

const LOAD_ITEMS: InspectItem[] = [
  { key: 'script', label: 'Script', kind: 'number', default: 2, min: 0, max: 30, step: 0.5, unit: 'ms', help: 'Busy work on the main thread, every frame' },
  { key: 'shader', label: 'Shader', kind: 'number', default: 24, min: 1, max: 240, step: 1, help: 'Iterations per pixel' },
  { key: 'garbage', label: 'Allocation', kind: 'number', default: 0, min: 0, max: 30, step: 1, unit: 'MB/s', help: 'Memory thrown away each second' },
];
const loadStore = createInspectorStore(LOAD_ITEMS);

const VERTEX = `#version 300 es
void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 size; uniform float time; uniform int steps;
out vec4 colour;
void main() {
  vec2 p = (gl_FragCoord.xy - size * 0.5) / size.y;
  float glow = 0.0;
  for (int i = 0; i < steps; i++) {
    float a = float(i) * 0.37 + time * 0.2;
    p += 0.018 * vec2(sin(p.y * 7.0 + a), cos(p.x * 6.0 - a));
    glow += 0.012 / (0.05 + length(p - 0.32 * vec2(cos(a), sin(a * 1.3))));
  }
  glow /= float(steps) / 24.0;
  colour = vec4(vec3(0.05, 0.07, 0.08) + glow * vec3(0.05, 0.16, 0.15), 1.0);
}`;

function PerfStage() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext('webgl2', { antialias: false });
    if (!canvas || !gl) return;
    const shader = (type: number, text: string) => {
      const s = gl.createShader(type) as WebGLShader;
      gl.shaderSource(s, text);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram() as WebGLProgram;
    gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    gl.useProgram(program);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const [size, time, steps] = [uniform('size'), uniform('time'), uniform('steps')];

    // the app's side of the monitor: its GPU work and its own named parts of a frame
    const monitor = perfMonitor();
    const gpu = monitor.watchContext(gl);
    const scene = monitor.timer('Scene');
    const draw = monitor.timer('Draw');

    let raf = 0;
    let kept: unknown = null;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const load = loadStore.get();
      const w = Math.round(canvas.clientWidth * 0.75);
      const h = Math.round(canvas.clientHeight * 0.75);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      scene.measure(() => {
        const until = performance.now() + Number(load.script);
        while (performance.now() < until);
        const mb = Number(load.garbage);
        if (mb) kept = new Float64Array(Math.round((mb * 131072) / 60));
      });
      draw.begin();
      gpu?.begin();
      gl.uniform2f(size, w, h);
      gl.uniform1f(time, now / 1000);
      gl.uniform1i(steps, Number(load.shader));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gpu?.end();
      draw.end();
      void kept;
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      gpu?.dispose();
    };
  }, []);
  return (
    <>
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}>
        <PerfStrip />
      </div>
    </>
  );
}

function PerfLab() {
  const panels = useMemo<DockPanel[]>(
    () => [
      { id: 'perf', title: 'Performance', dock: 'right', content: <PerformancePanel defaultView="extended" storageKey="artinos-showcase.perf" /> },
      { id: 'load', title: 'Load', dock: 'left', content: <Inspector items={LOAD_ITEMS} store={loadStore} search={false} keyframes={false} /> },
    ],
    [],
  );
  return (
    <div className="sc-live__dock sc-live__dock--tall">
      <Dock panels={panels} viewport={<PerfStage />} palette={false} sizes={{ right: 0.42, left: 0.2 }} />
    </div>
  );
}

/* ---------- three sizes of one instrument, and what it says about each situation ---------- */

type Scene = 'smooth' | 'gpu' | 'cpu' | 'memory';
const SCENES: Record<Scene, (w: number) => { ms: number; cpu: number; gpu: number; gpuMs: number; heap: number; growth: number }> = {
  smooth: (w) => ({ ms: 16.1 + w * 0.3, cpu: 0.26 + 0.1 * w, gpu: 0.38 + 0.12 * w, gpuMs: 6.4 + 2 * w, heap: 1840 + 60 * w, growth: 1.2 }),
  gpu: (w) => ({ ms: 27 + w * 7, cpu: 0.34 + 0.1 * w, gpu: 0.93 + 0.06 * w, gpuMs: 25 + 6 * w, heap: 2210 + 40 * w, growth: 0.8 }),
  cpu: (w) => ({ ms: 24 + w * 9, cpu: 0.86 + 0.1 * w, gpu: 0.31 + 0.1 * w, gpuMs: 5.6 + w, heap: 1960 + 40 * w, growth: 2.1 }),
  memory: (w) => ({ ms: 16.2 + w * 0.3, cpu: 0.36 + 0.1 * w, gpu: 0.42 + 0.1 * w, gpuMs: 7.2 + w, heap: 3720 + 20 * w, growth: 46 }),
};

function PerfSizes() {
  const [scene, setScene] = useState<Scene>('smooth');
  const feed = useMemo(() => {
    const source = createPerfFeed({ initial: { refresh: 60, heapLimit: 4096, gpuName: 'Studio workstation', cores: 16 } });
    // the panels open with a history behind them
    for (let i = 0; i < 300; i++) source.frame(16.1 + Math.random() * 0.8 + (i % 73 === 0 ? 12 : 0));
    return source;
  }, []);
  const current = useRef(scene);
  current.current = scene;
  useEffect(() => {
    let t = 0;
    const id = setInterval(() => {
      t += 0.06;
      const f = SCENES[current.current](0.5 + 0.5 * Math.sin(t));
      feed.frame(f.ms + Math.random() * 0.5 + (Math.random() < 0.012 ? 12 : 0));
      feed.update({ mainLoad: f.cpu, gpuLoad: Math.min(1, f.gpu), gpuMs: f.gpuMs, heapUsed: f.heap, heapGrowth: f.growth, frameWork: f.ms * f.cpu });
    }, 33);
    return () => clearInterval(id);
  }, [feed]);
  return (
    <div className="sc-live__sizes">
      <Segmented<Scene>
        label="Situation"
        value={scene}
        onChange={setScene}
        options={[
          { value: 'smooth', label: 'Smooth' },
          { value: 'gpu', label: 'GPU bound' },
          { value: 'cpu', label: 'CPU bound' },
          { value: 'memory', label: 'Memory' },
        ]}
      />
      <PerfStrip monitor={feed} />
      <div className="sc-live__sizes-row">
        <Panel title="In a panel">
          <PerformancePanel monitor={feed} />
        </Panel>
        <Panel title="Opened">
          <PerformancePanel monitor={feed} defaultView="extended" />
        </Panel>
      </div>
    </div>
  );
}

/* ---------- the same parts on figures from anywhere ---------- */

function AnyProgram() {
  // a render node reporting over a socket, played here by a timer
  const feed = useMemo(() => createPerfFeed({ budget: 33.3, initial: { gpuName: 'Render node 04', cores: 32, heapLimit: 65536 } }), []);
  const requests = useRef(new Set<(ms: number) => void>());
  const subscribe = useCallback((push: (ms: number) => void) => {
    requests.current.add(push);
    return () => void requests.current.delete(push);
  }, []);
  const service = useRef({ queue: 12, latency: 80, errors: 0.2 });
  useEffect(() => {
    let t = 0;
    const id = setInterval(() => {
      t += 0.05;
      const wave = 0.5 + 0.5 * Math.sin(t);
      feed.frame(28 + 7 * wave + Math.random() * 6 + (Math.random() < 0.03 ? 40 : 0));
      feed.update({ mainLoad: 0.42 + 0.3 * wave, gpuLoad: 0.61 + 0.3 * Math.sin(t * 0.7), gpuMs: 19 + 6 * wave, heapUsed: 28400 + 3200 * wave });
      const s = service.current;
      s.queue = Math.max(0, s.queue + (Math.random() - 0.48) * 3);
      s.latency = 70 + 50 * wave + Math.random() * 40 + (Math.random() < 0.05 ? 160 : 0);
      s.errors = Math.max(0, 0.3 + 0.3 * Math.sin(t * 0.4));
      requests.current.forEach((push) => push(s.latency));
    }, 50);
    return () => clearInterval(id);
  }, [feed]);
  return (
    <div className="sc-live__grid">
      <Panel title="Render node">
        <PerformancePanel monitor={feed} names={{ heapUsed: 'RAM', mainLoad: 'CPU threads' }} words={{ memory: 'RAM' }} />
      </Panel>
      <Panel title="API service">
        <MonitorStrip orientation="stack">
          <MonitorCell label="Queue" views={['trace', 'level', 'spread']} read={() => ({ value: service.current.queue.toFixed(0), unit: 'jobs', share: service.current.queue / 40, status: service.current.queue > 30 ? 'warn' : 'ok', state: 'Backing up', plot: service.current.queue })} />
          <MonitorCell label="Latency" views={['bars', 'trace', 'spread']} subscribe={subscribe} format={(v) => v.toFixed(0)} read={() => ({ value: service.current.latency.toFixed(0), unit: 'ms', limit: 120, status: service.current.latency > 200 ? 'fault' : service.current.latency > 120 ? 'warn' : 'ok', state: 'Slow', plot: service.current.latency })} />
          <MonitorCell label="Errors" views={['trace', 'level']} read={() => ({ value: service.current.errors.toFixed(2), unit: '%', share: service.current.errors, status: 'ok', plot: service.current.errors })} />
          <MonitorCell label="Disk" views={['parts', 'level']} reading={{ value: '656', unit: 'GB', share: 0.656, status: 'ok', parts: [{ label: 'Models', value: 412 }, { label: 'Cache', value: 180 }, { label: 'Logs', value: 64 }, { label: 'Free', value: 344, rest: true }] }} />
        </MonitorStrip>
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
        id="live-sizes"
        text="One value in one control's height: its name, a small picture and the number. Click a cell and the picture changes view: every event, the history, the level with its peak, the spread, or what it is made of. Right-click to pick one, and hover the picture to read the past. Cells line up in a toolbar, or stack in a panel."
        keys={[
          ['Click', 'Next view'],
          ['Right-click', 'Choose a view'],
          ['Hover', 'Read the past'],
        ]}
        code={`<PerfStrip />                         // one line, for a toolbar
<PerformancePanel />                  // stacked, opens to every figure

<MonitorCell label="Latency" views={['bars', 'trace', 'spread']}
  read={() => ({ value: ms, unit: 'ms', limit: 120 })} subscribe={onRequest} />`}
        wide
      >
        <PerfSizes />
      </Spec>
      <Spec
        id="live-perf"
        text="The strip along the scene and the panel beside it read the same figures. Turn up the load on the left and watch them answer. It shows only what the browser can really report."
        code={`<Dock panels={[{ id: 'perf', title: 'Performance', content: <PerformancePanel /> }]} toolbar={<PerfStrip />} />

// connect your renderer, and time the parts of your frame
perfMonitor().watchRenderer(renderer);
const physics = perfMonitor().timer('Physics');
physics.measure(() => world.step());`}
        wide
      >
        <PerfLab />
      </Spec>
      <Spec
        id="live-any"
        text="None of it is tied to the browser. Report figures from a desktop host, a game engine or a server, and the same cells show exactly those. A MonitorCell watches any value at all, here on an API service."
        code={`const feed = createPerfFeed({ budget: 33.3 });
socket.onmessage = ({ data }) => {
  feed.frame(data.frameMs);
  feed.update({ mainLoad: data.cpu, gpuLoad: data.gpu, heapUsed: data.ramMb });
};
<PerfStrip monitor={feed} />

<MonitorStrip orientation="stack">
  <MonitorCell label="Queue" read={() => ({ value: queue.size, unit: 'jobs', share: queue.size / 40 })} />
  <MonitorCell label="Disk" views={['parts', 'level']} reading={{ value: 656, unit: 'GB', parts }} />
</MonitorStrip>`}
        wide
      >
        <AnyProgram />
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
