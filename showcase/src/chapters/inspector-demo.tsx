/* The pro Inspector, bound both ways to two scene objects. The panel writes the object each canvas
   draws from; each prism turns its own angle while Spin is on, which the panel follows. Select one
   prism or both: with both, the rows that differ are marked mixed and a change lands on both. The
   timeline panel reads the same store, so a row's diamond keys it there. */
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { createInspectorStore, Dock, Inspector, InspectorTimeline, mergeInspectorStores, Segmented } from '../../../src';
import type { DockApi, DockPanel, InspectFolder, InspectItem, InspectorStore, InspectValues } from '../../../src';
import { BACKDROPS } from '../shared';

type Prism = Record<string, unknown>;
/** The app's own state: plain objects the frame loop reads and writes. */
const scenes: Prism[] = [
  { position: [-0.16, 0.1, 0] },
  { position: [0.14, -0.06, 0], scale: 0.62, sides: 4, angle: -30, tint: '#8fc7ff', echoes: 3, speed: 60 },
];
const stats = { fps: 60, ms: 16.7 };

const FOLDERS: InspectFolder[] = [
  { id: 'transform', title: 'Transform' },
  { id: 'material', title: 'Material' },
  { id: 'rim', title: 'Rim', parent: 'material', switch: 'rim', open: true },
  { id: 'motion', title: 'Motion', switch: 'spin' },
  { id: 'render', title: 'Render' },
  { id: 'monitor', title: 'Monitor' },
];

const ITEMS: InspectItem[] = [
  { key: 'position', label: 'Position', folder: 'transform', kind: 'vector', default: [0, 0, 0], min: -1, max: 1, step: 0.01 },
  { key: 'angle', label: 'Angle', folder: 'transform', kind: 'number', default: 18, min: -180, max: 180, step: 1, face: 'degrees', help: 'Turned by the scene while Spin is on' },
  { key: 'scale', label: 'Scale', folder: 'transform', kind: 'number', default: 1, min: 0.25, max: 2, step: 0.01, unit: '×' },
  { key: 'sides', label: 'Sides', folder: 'transform', kind: 'number', default: 6, min: 3, max: 12, step: 1, face: 'count' },
  { key: 'tint', label: 'Tint', folder: 'material', kind: 'color', default: '#4fd1ba' },
  { key: 'opacity', label: 'Opacity', folder: 'material', kind: 'number', default: 0.72, min: 0, max: 1, step: 0.01, face: 'percent' },
  { key: 'glow', label: 'Glow', folder: 'material', kind: 'number', default: 28, min: 0, max: 80, step: 1, unit: 'px' },
  { key: 'light', label: 'Light', folder: 'material', kind: 'point', default: [-0.6, 0.6], xRange: [-1, 1], yRange: [-1, 1], help: 'Where the glass is lit from' },
  { key: 'blend', label: 'Blend', folder: 'material', kind: 'choice', default: 'screen', options: [{ value: 'normal', label: 'Normal' }, { value: 'screen', label: 'Screen' }, { value: 'plus-lighter', label: 'Add' }, { value: 'overlay', label: 'Overlay' }] },
  { key: 'rim', label: 'Rim', folder: 'rim', kind: 'toggle', default: true },
  { key: 'rimColor', label: 'Colour', folder: 'rim', kind: 'color', default: '#f2e8d5' },
  { key: 'rimWidth', label: 'Width', folder: 'rim', kind: 'number', default: 1.5, min: 0.5, max: 8, step: 0.1, unit: 'px' },
  { key: 'spin', label: 'Spin', folder: 'motion', kind: 'toggle', default: true },
  { key: 'speed', label: 'Speed', folder: 'motion', kind: 'number', default: 24, min: 1, max: 360, step: 1, unit: '°/s', face: 'log' },
  { key: 'wobble', label: 'Wobble', folder: 'motion', kind: 'number', default: 0.2, min: -1, max: 1, step: 0.01, face: 'bipolar' },
  {
    key: 'echoes',
    label: 'Echoes',
    folder: 'render',
    kind: 'number',
    default: 4,
    min: 1,
    max: 8,
    step: 1,
    face: 'count',
    check: (v, all) => (Number(v) >= 7 && all.quality === 'ultra' ? { status: 'warn', message: 'Seven echoes at Ultra drops frames.' } : null),
  },
  { key: 'sweep', label: 'Sweep', folder: 'render', kind: 'range', default: [0, 36], min: -90, max: 90, step: 1, unit: '°', help: 'The angles the echoes fan across' },
  { key: 'quality', label: 'Quality', folder: 'render', kind: 'choice', default: 'high', options: [{ value: 'draft', label: 'Draft' }, { value: 'high', label: 'High' }, { value: 'ultra', label: 'Ultra' }] },
  { key: 'seed', label: 'Seed', folder: 'render', kind: 'number', default: 7, step: 1 },
  { key: 'fps', label: 'Frame rate', folder: 'monitor', kind: 'monitor', read: () => stats.fps, min: 0, max: 144, unit: 'fps', decimals: 0, graph: true },
  { key: 'ms', label: 'Frame time', folder: 'monitor', kind: 'monitor', read: () => stats.ms, min: 0, max: 40, unit: 'ms', graph: true },
  { key: 'now', label: 'Angle now', folder: 'monitor', kind: 'monitor', read: () => Number(scenes[0].angle ?? 0), unit: '°', decimals: 0 },
  {
    key: 'shuffle',
    label: 'Randomize',
    folder: 'render',
    kind: 'action',
    run: () => BOUND[selection].apply({ sides: 3 + Math.floor(Math.random() * 9), glow: Math.round(Math.random() * 80), tint: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}` }),
  },
];

const PRESETS: Record<string, Partial<InspectValues>> = {
  Prism: { sides: 6, tint: '#4fd1ba', glow: 28, opacity: 0.72, echoes: 4, blend: 'screen', rimColor: '#f2e8d5' },
  Ember: { sides: 3, tint: '#ff7a45', glow: 56, opacity: 0.85, echoes: 6, blend: 'plus-lighter', rimColor: '#ffd9a8' },
  Ice: { sides: 8, tint: '#8fc7ff', glow: 14, opacity: 0.5, echoes: 3, blend: 'screen', rimColor: '#ffffff' },
};

const stores = [
  // prism A breathes: two values keyed over the loop, so the timeline has something to show
  createInspectorStore(ITEMS, {
    target: scenes[0],
    storageKey: 'artinos-showcase.inspector.presets',
    tracks: {
      scale: [{ t: 0, v: 1 }, { t: 2, v: 1.22 }, { t: 4, v: 1 }],
      glow: [{ t: 0, v: 28 }, { t: 1.5, v: 62 }, { t: 4, v: 28 }],
    },
  }),
  createInspectorStore(ITEMS, { target: scenes[1] }),
];

/* which prism the panels show: one, the other, or both as one */
type Selection = 'a' | 'b' | 'both';
const BOUND: Record<Selection, InspectorStore> = { a: stores[0], b: stores[1], both: mergeInspectorStores(stores) };
let selection: Selection = 'a';
const watchers = new Set<() => void>();
const select = (next: Selection) => {
  selection = next;
  watchers.forEach((w) => w());
};
const useSelection = () =>
  useSyncExternalStore(
    (w) => {
      watchers.add(w);
      return () => watchers.delete(w);
    },
    () => selection,
  );

function draw(canvas: HTMLCanvasElement, s: Record<string, number> & { position: number[]; light: number[]; sweep: number[]; tint: string; rimColor: string; blend: string; rim: boolean; quality: string }, now: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = s.quality === 'draft' ? 1 : s.quality === 'ultra' ? Math.max(2, devicePixelRatio) : devicePixelRatio;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  canvas.style.mixBlendMode = s.blend;
  const r = Math.min(w, h) * 0.16 * s.scale;
  const cx = w / 2 + s.position[0] * w * 0.4;
  const cy = h / 2 - s.position[1] * h * 0.4;
  for (let e = s.echoes - 1; e >= 0; e--) {
    const k = 1 - e / (s.echoes + 1);
    const fan = s.sweep[0] + ((s.sweep[1] - s.sweep[0]) * e) / Math.max(1, s.echoes - 1);
    const a = ((s.angle - fan * (1 + s.wobble * Math.sin(now / 700 + s.seed))) * Math.PI) / 180;
    ctx.beginPath();
    for (let i = 0; i < s.sides; i++) {
      const t = a + (i / s.sides) * Math.PI * 2;
      const rr = r * (1 + e * 0.16);
      ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(t) * rr, cy + Math.sin(t) * rr);
    }
    ctx.closePath();
    ctx.shadowColor = s.tint;
    ctx.shadowBlur = e === 0 ? s.glow : 0;
    ctx.globalAlpha = s.opacity * k * (e === 0 ? 1 : 0.35);
    if (e === 0) {
      // a pane of tinted glass: full where the light falls, nearly clear on the far side
      const [lx, ly] = s.light;
      const g = ctx.createLinearGradient(cx + lx * r, cy - ly * r, cx - lx * r, cy + ly * r);
      g.addColorStop(0, s.tint);
      g.addColorStop(1, s.tint.slice(0, 7) + '26');
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    if (s.rim || e > 0) {
      ctx.globalAlpha = e === 0 ? 1 : 0.5 * k;
      ctx.lineWidth = e === 0 ? s.rimWidth : 1;
      ctx.strokeStyle = e === 0 ? s.rimColor : s.tint;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function Stage({ scene }: { scene?: string }) {
  const refs = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)];
  const picked = useSelection();
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
      last = now;
      stats.ms += (dt * 1000 - stats.ms) * 0.1;
      stats.fps = 1000 / stats.ms;
      scenes.forEach((scene, i) => {
        const s = scene as Parameters<typeof draw>[1] & { spin: boolean };
        // the app changes its own state: the panel reads it back
        if (s.spin) {
          s.angle = ((s.angle + s.speed * dt + 180) % 360) - 180;
          stores[i].pull();
        }
        const canvas = refs[i].current;
        if (canvas) draw(canvas, s, now);
      });
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="sc-viewport">
      {scene ? <img className="sc-workspace__view" src={scene} alt="" /> : null}
      {refs.map((ref, i) => (
        <canvas key={i} ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      ))}
      <div style={{ position: 'absolute', top: 14, left: '50%', width: 252, transform: 'translateX(-50%)' }}>
        <Segmented
          label="Selection"
          value={picked}
          onChange={select}
          options={[
            { value: 'a', label: 'Prism A' },
            { value: 'b', label: 'Prism B' },
            { value: 'both', label: 'Both' },
          ]}
        />
      </div>
    </div>
  );
}

/** The Inspector of the current selection: the same store the instrument's scene draws from. */
export function Parameters() {
  const store = BOUND[useSelection()];
  return <Inspector items={ITEMS} folders={FOLDERS} store={store} presets={PRESETS} only={['transform', 'material', 'motion', 'render']} storageKey="artinos-showcase.inspector" />;
}
/** The keyframes of the current selection, on the same store. */
export function Keyframes() {
  return <InspectorTimeline items={ITEMS} store={BOUND[useSelection()]} />;
}

/** The monitors: what the scene reports, sampled while on screen. */
export function Monitors() {
  return <Inspector items={ITEMS} folders={FOLDERS} store={stores[0]} only={['monitor']} bar={false} />;
}

/** The instrument: a scene, its Inspector, Timeline and Monitor on one store, and `controls` as a panel beside
 *  them when given. It fills its parent and follows the page's theme and density. */
export function ProWorkspace({ scene = BACKDROPS.monstera, controls, onReady }: { scene?: string; controls?: ReactNode; onReady?: (api: DockApi) => void }) {
  const panels = useMemo<DockPanel[]>(
    () => [
      { id: 'inspector', title: 'Inspector', description: 'Every parameter of the selection', dock: 'right', active: true, content: <Parameters /> },
      ...(controls ? [{ id: 'controls', title: 'Controls', description: 'The everyday controls, in this density', dock: 'left' as const, active: true, content: controls }] : []),
      { id: 'monitor', title: 'Monitor', description: 'What the scene reports', dock: controls ? 'left' : 'bottom', active: !controls, content: <Monitors /> },
      { id: 'timeline', title: 'Timeline', description: 'The keyframes of the selection', dock: 'bottom', active: true, content: <Keyframes /> },
    ],
    [controls],
  );
  return (
    <div className="sc-workspace">
      <Dock
        panels={panels}
        viewport={<Stage scene={scene} />}
        storageKey={controls ? 'artinos-showcase.instrument.v1' : 'artinos-showcase.instrument.narrow.v1'}
        sizes={controls ? { right: 0.3, left: 0.43, bottom: 0.2 } : { right: 0.44, bottom: 0.3 }}
        palette={false}
        viewProps={{ padding: 10, gap: 8 }}
        onReady={onReady}
      />
    </div>
  );
}

