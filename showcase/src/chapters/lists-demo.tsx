/* The Layout system chapter's Lists demo: every list type once, each with its own content.
     Outliner   plain · sm · a tree with icons, status lights and visibility
     Renders    divided · lg · wide thumbnails, descriptions, a value, progress, many picked
     Materials  grid · round thumbnails in named groups
     Presets    cards · md · icons, values, badges, and an empty list */
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { Badge, IconButton, ItemGroup, ItemList, ItemRow, Panel, Text } from '../../../src';
import type { ItemStatus } from '../../../src';
import { BACKDROPS } from '../shared';
import { IC } from './demos';
import { PanelSpace } from './space';

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
  preset: glyph('M3 2.5h10v11H3zM5.5 5.5h5M5.5 8h5M5.5 10.5h3'),
  star: glyph('M8 2l1.8 3.8 4.2.5-3.1 2.9.8 4.1L8 11.3l-3.7 2 .8-4.1L2 6.3l4.2-.5z'),
};

/* ---------- a tree ---------- */

type Node = { id: string; title: string; icon: ReactElement; meta?: string; status?: ItemStatus; children?: Node[] };
const SCENE: Node[] = [
  {
    id: 'scene',
    title: 'Scene',
    icon: G.folder,
    children: [
      { id: 'orb', title: 'Orb', icon: G.mesh, meta: '12,480 tris', status: 'live', children: [{ id: 'shell', title: 'Glass shell', icon: G.mesh, meta: 'thick glass' }] },
      { id: 'rim', title: 'Rim light', icon: G.light, meta: '4.2 lm' },
      { id: 'key', title: 'Key light', icon: G.light, meta: 'clipping', status: 'warn' },
    ],
  },
  { id: 'cam', title: 'Camera', icon: G.camera, meta: '35 mm' },
  { id: 'bg', title: 'Backdrop', icon: G.image, meta: 'missing file', status: 'fault' },
];

function Outliner() {
  const [open, setOpen] = useState<Record<string, boolean>>({ scene: true, orb: true });
  const [picked, setPicked] = useState('orb');
  const [hidden, setHidden] = useState<string[]>([]);
  const rows: ReactElement[] = [];
  const walk = (nodes: Node[], depth: number) =>
    nodes.forEach((n) => {
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
          trailing={
            <IconButton
              size="sm"
              label={off ? `Show ${n.title}` : `Hide ${n.title}`}
              icon={IC.eye}
              active={!off}
              onClick={() => setHidden((h) => (off ? h.filter((x) => x !== n.id) : [...h, n.id]))}
            />
          }
        />,
      );
      if (n.children && open[n.id]) walk(n.children, depth + 1);
    });
  walk(SCENE, 0);
  return (
    <Panel title="Outliner" subtitle="plain · sm · a tree">
      <ItemList label="Outliner" size="sm">
        {rows}
      </ItemList>
    </Panel>
  );
}

/* ---------- thumbnails, descriptions, progress, many picked ---------- */

const shot = (src: string, pos: string) => <img src={src} alt="" style={{ objectPosition: pos }} draggable={false} />;
const RENDERS: { id: string; title: string; meta: string; description: string; time: string; thumb: ReactElement; status: ItemStatus; rendering?: boolean }[] = [
  { id: 'r1', title: 'Garden · dusk', meta: '1920 × 1080 · 240 frames', description: 'Orb drifting through the arches, thick glass, warm rim light.', time: '04:12', thumb: shot(BACKDROPS.garden, '30% 40%'), status: 'idle' },
  { id: 'r2', title: 'Monstera close-up', meta: '3840 × 2160 · 1 frame', description: 'Macro pass with caustics on; denoiser at high.', time: '', thumb: shot(BACKDROPS.monstera, '50% 50%'), status: 'live', rendering: true },
  { id: 'r3', title: 'Studio turntable', meta: '1080 × 1080 · 120 frames', description: 'Grey room, three lights, no backdrop. Failed at frame 87.', time: '01:48', thumb: shot(BACKDROPS.studio, '50% 50%'), status: 'fault' },
];

function Renders() {
  const [picked, setPicked] = useState<string[]>(['r1']);
  const [p, setP] = useState(0.18);
  useEffect(() => {
    const t = setInterval(() => setP((v) => (v >= 1 ? 0.05 : v + 0.02)), 260);
    return () => clearInterval(t);
  }, []);
  return (
    <Panel title="Renders" subtitle="divided · lg · thumbnails, many picked" actions={<Badge>{`${picked.length} picked`}</Badge>}>
      <ItemList label="Renders" variant="divided" size="lg">
        {RENDERS.map((r) => (
          <ItemRow
            key={r.id}
            thumbnail={r.thumb}
            thumbShape="wide"
            title={r.title}
            meta={r.meta}
            description={r.description}
            status={r.status}
            value={r.rendering ? `${Math.round(p * 100)}%` : r.time}
            progress={r.rendering ? p : undefined}
            checked={picked.includes(r.id)}
            onCheckedChange={(v) => setPicked((s) => (v ? [...s, r.id] : s.filter((x) => x !== r.id)))}
            trailing={<IconButton size="sm" label={`${r.title} actions`} icon={IC.more} />}
          />
        ))}
      </ItemList>
    </Panel>
  );
}

/* ---------- tiles in named groups ---------- */

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

function Materials() {
  const [picked, setPicked] = useState('clear');
  return (
    <Panel title="Materials" subtitle="grid · round thumbnails · groups">
      <ItemList label="Materials" variant="grid" tileWidth={84}>
        {Object.entries(MATERIALS).map(([group, items]) => (
          <ItemGroup key={group} label={group} count={items.length}>
            {items.map((m) => (
              <ItemRow
                key={m.id}
                thumbnail={sphere(m.c, m.gloss)}
                thumbShape="round"
                title={m.title}
                meta={m.meta}
                selected={picked === m.id}
                onSelect={() => setPicked(m.id)}
                trailing={<IconButton size="sm" label={`Favourite ${m.title}`} icon={G.star} />}
              />
            ))}
          </ItemGroup>
        ))}
      </ItemList>
    </Panel>
  );
}

/* ---------- cards, and a list with nothing in it ---------- */

const PRESETS = [
  { id: 'soft', title: 'Soft studio', meta: '3 lights · fill 40%', value: '4.8', badge: 'Default' },
  { id: 'noir', title: 'Noir', meta: '1 light · hard shadow', value: '4.2' },
  { id: 'dawn', title: 'Dawn garden', meta: 'HDRI · 5600 K', value: '4.6', badge: 'New' },
];

function Presets() {
  const [picked, setPicked] = useState('soft');
  return (
    <Panel title="Presets" subtitle="cards · md · an empty list">
      <ItemList label="Presets" variant="cards">
        {PRESETS.map((p) => (
          <ItemRow
            key={p.id}
            icon={G.preset}
            title={p.title}
            meta={p.meta}
            value={p.value}
            selected={picked === p.id}
            onSelect={() => setPicked(p.id)}
            trailing={p.badge ? <Badge tone={p.badge === 'New' ? 'live' : undefined}>{p.badge}</Badge> : null}
          />
        ))}
      </ItemList>
      <Text variant="overline">Favourites</Text>
      <ItemList label="Favourites" empty="No favourites yet: star a material to keep it here." />
    </Panel>
  );
}

export function ListsDemo() {
  return (
    <PanelSpace
      id="lists"
      height={760}
      sizes={{ left: 0.24, right: 0.27, bottom: 0.4 }}
      panels={[
        { id: 'outliner', title: 'Outliner', dock: 'left', content: <Outliner /> },
        { id: 'renders', title: 'Renders', dock: 'center', content: <Renders /> },
        { id: 'presets', title: 'Presets', dock: 'right', content: <Presets /> },
        { id: 'materials', title: 'Materials', dock: 'bottom', content: <Materials /> },
      ]}
    />
  );
}
