'use client';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ArtinosTheme, Button, ColorField, createInspectorStore, DESIGNS, DESIGN_META, Inspector, InspectorTimeline, Knob, Meter, Panel, RangeSlider, Segmented, Select, Slider, Sparkline, Stat, Switch, THEMES, THEME_META, useSignalValue, XYPad } from '../../../src';
import type { Density, DesignName, InspectFolder, InspectItem, InspectorStore, ThemeName } from '../../../src';
import './concepts.css';

const FOLDERS: InspectFolder[] = [
  { id: 'surface', title: 'Surface', description: 'Energy, response and reflection', count: true },
  { id: 'form', title: 'Edges & form', description: 'Geometry and relief', count: true },
  { id: 'detail', title: 'Microstructure', description: 'Fine material characteristics', count: true },
  { id: 'output', title: 'Output', description: 'Quality and preview settings', count: true },
];
const num = (key: string, label: string, folder: string, value: number): InspectItem => ({ key, label, folder, kind: 'number', default: value, min: 0, max: 1, step: .01 });
const choices = (options: string[]) => options.map((value) => ({ value, label: value }));
const ITEMS: InspectItem[] = [
  num('intensity', 'Intensity', 'surface', .64), num('roughness', 'Roughness', 'surface', .38),
  num('metallic', 'Metallic', 'surface', .72), num('sheen', 'Sheen', 'surface', .12),
  { key: 'color', label: 'Albedo', kind: 'color', folder: 'surface', default: '#A8B4AD' },
  num('radius', 'Radius', 'form', .46), num('relief', 'Relief', 'form', .28),
  { key: 'edge', label: 'Profile', kind: 'choice', folder: 'form', default: 'Round', options: choices(['Soft','Round','Bevel']) },
  { key: 'range', label: 'Lustre range', kind: 'range', folder: 'form', default: [.22,.78], min: 0, max: 1, step: .01 },
  num('detail', 'Detail', 'detail', .42), num('anisotropy', 'Anisotropy', 'detail', .18),
  { key: 'variation', label: 'Variation', kind: 'toggle', folder: 'detail', default: true },
  { key: 'direction', label: 'Direction', kind: 'point', folder: 'detail', default: [.18,.36], xRange: [-1,1], yRange: [-1,1], height: 76 },
  { key: 'enabled', label: 'Enabled', kind: 'toggle', folder: 'output', default: true },
  { key: 'quality', label: 'Quality', kind: 'choice', folder: 'output', default: 'High', options: choices(['Low','Med','High']) },
  { key: 'resolution', label: 'Resolution', kind: 'choice', folder: 'output', default: '2K', options: choices(['720p','1080p','2K','4K']) },
  { key: 'seed', label: 'Seed', kind: 'number', folder: 'output', default: 4127, step: 1 },
];
const PALETTES: Record<DesignName, ThemeName> = {
  classic: 'nimbus', monolith: 'tactile-porcelain', 'precision-rack': 'tactile-graphite', 'floating-lab': 'frost-deep', 'atelier-blocks': 'tactile-opal',
};
const PRESETS = {
  Satin: { intensity: .64, roughness: .38, metallic: .72, sheen: .12 },
  Matte: { intensity: .52, roughness: .81, metallic: .08, sheen: .05 },
  Polished: { intensity: .82, roughness: .14, metallic: .94, sheen: .48 },
};

function Summary({ design, store }: { design: DesignName; store: InspectorStore }) {
  const v = useSignalValue(store.live);
  const level = Number(v.intensity), rough = Number(v.roughness), metallic = Number(v.metallic);
  const sphere = <div className="sc-concept__specimen" role="img" aria-label="Illustrative material swatch" style={{ '--specimen': String(v.color), '--specimen-gloss': 1 - rough, '--specimen-metal': metallic } as CSSProperties}><i /></div>;
  const dial = (key: string, label: string, size = 76) => <Knob label={label} signal={store.signal<number>(key)} defaultValue={Number(store.defaults[key])} size={size} onCommit={() => store.commit()} />;
  const stats = <div className="sc-concept__stats"><Stat label="Intensity" value={level * 100} decimals={1} unit="%" /><Stat label="Roughness" value={rough} decimals={2} /><Stat label="Metallic" value={metallic} decimals={2} /></div>;
  const meter = <Meter label="Signal" value={v.enabled ? level : 0} segments={24} valueText={Math.round(level * 100) + '%'} />;
  const curve = Array.from({ length: 36 }, (_, i) => Math.max(0, Math.min(1, level * (.5 + .5 * Math.sin(i * .32 + rough * 5)) + metallic * .2)));
  if (design === 'monolith') return <div className="sc-concept__mono"><div className="sc-concept__identity">{sphere}<div><span>Material study</span><h2>Surface</h2><p>Continuous sculpted instrument</p>{meter}</div></div><div className="sc-concept__encoders">{dial('intensity','Intensity')}{dial('roughness','Roughness')}{dial('sheen','Sheen')}</div></div>;
  if (design === 'precision-rack') return <div className="sc-concept__rack"><div className="sc-concept__identity">{sphere}<div><span>Channel 01</span><h2>Surface</h2><p>Instrument bank</p></div></div><div className="sc-concept__encoders">{dial('intensity','Intensity',96)}{dial('roughness','Roughness',56)}</div><div className="sc-concept__rack-signal">{meter}<Sparkline label="Response curve" values={curve} min={0} max={1} width={220} height={36} /></div></div>;
  if (design === 'floating-lab') return <div className="sc-concept__float"><div className="sc-concept__identity">{sphere}<div><span>Optical workspace</span><h2>Surface</h2><p>Floating material instrument</p>{meter}</div></div><div className="sc-concept__float-graph">{dial('intensity','Intensity',88)}<div><span>Response curve</span><Sparkline label="Response curve" values={curve} min={0} max={1} width={240} height={64} fill /></div></div></div>;
  if (design === 'atelier-blocks') return <div className="sc-concept__atelier"><div className="sc-concept__identity"><div><span>Material / 01</span><h2>Surface</h2><p>Form, texture and response</p></div>{sphere}</div>{stats}<div className="sc-concept__float-graph">{dial('intensity','Intensity',84)}<div>{meter}<Sparkline label="Response curve" values={curve} min={0} max={1} width={240} height={44} fill /></div></div></div>;
  return <div className="sc-concept__identity">{sphere}<div><span>Material study</span><h2>Surface</h2>{meter}</div>{dial('intensity','Intensity')}</div>;
}

function ComponentStudy({ store }: { store: InspectorStore }) {
  const v = useSignalValue(store.live);
  return <Panel title="Component anatomy" subtitle="Native components · same store" collapsible defaultOpen>
    <div className="sc-concept__components">
      <div><b>Continuous & stepped</b><Slider label="Intensity" signal={store.signal<number>('intensity')} onCommit={() => store.commit()} toggleable={false} /><Slider label="Roughness" signal={store.signal<number>('roughness')} onCommit={() => store.commit()} toggleable={false} /><RangeSlider label="Lustre" value={v.range as [number,number]} onChange={(x) => store.scrub('range',x)} onCommit={() => store.commit()} toggleable={false} /></div>
      <div><b>Selection & state</b><Segmented label="Quality" options={['Low','Med','High']} value={String(v.quality)} onChange={(x) => store.set('quality',x)} /><Switch label="Enabled" value={Boolean(v.enabled)} onChange={(x) => store.set('enabled',x)} /><Select label="Resolution" options={['720p','1080p','2K','4K']} value={String(v.resolution)} onChange={(x) => store.set('resolution',x)} appearance="well" /></div>
      <div><b>Optical & directional</b><ColorField label="Albedo" value={String(v.color)} onChange={(x) => store.set('color',x)} /><XYPad label="Direction" value={v.direction as [number,number]} onChange={(x) => store.scrub('direction',x)} onCommit={() => store.commit()} height={76} /></div>
      <div><b>Action & readout</b><Meter label="Signal" value={v.enabled ? Number(v.intensity) : 0} segments={16} /><Stat label="Intensity" value={Number(v.intensity) * 100} unit="%" decimals={1} /><div className="sc-concept__actions"><Button onClick={() => store.reset()}>Reset</Button><Button variant="primary" onClick={() => store.set('enabled',!v.enabled)}>{v.enabled ? 'Standby' : 'Activate'}</Button></div></div>
    </div>
  </Panel>;
}

export function ConceptsPage({ onExit, density, onDensity, type }: { onExit: () => void; density: Density; onDensity: (x: Density) => void; type: string }) {
  const [store] = useState(() => createInspectorStore(ITEMS, { duration: 8 }));
  const [design,setDesign] = useState<DesignName>('monolith');
  const [palette,setPalette] = useState<string>('recommended');
  const [folder,setFolder] = useState('all');
  const [narrow,setNarrow] = useState(false);
  const [timeline,setTimeline] = useState(false);
  const theme = palette === 'recommended' ? PALETTES[design] : palette as ThemeName;
  return <ArtinosTheme theme="pro-gray" density={density} type={type} ground className="sc-concept">
    <header className="sc-concept__header"><Button variant="ghost" onClick={onExit}>← Showcase</Button><div><span>ARTINOS / Experimental</span><h1>Design systems</h1></div><div className="sc-concept__options">
      <Select label="Palette" options={[{value:'recommended',label:'Recommended palette'},...THEMES.map((t)=>({value:t,label:THEME_META[t].label}))]} value={palette} onChange={setPalette} appearance="well" />
      <Segmented label="Density" options={[{value:'dense',label:'Dense'},{value:'standard',label:'Standard'},{value:'comfort',label:'Comfort'}]} value={density} onChange={onDensity} />
      <Button onClick={() => setNarrow(!narrow)}>{narrow ? 'Wide workspace' : 'Narrow inspector'}</Button>
    </div></header>
    <div className="sc-concept__choices" aria-label="Design system">{DESIGNS.map((d) => <button key={d} type="button" aria-pressed={d === design} onClick={() => setDesign(d)}><strong>{DESIGN_META[d].label}</strong><span>{DESIGN_META[d].description}</span></button>)}</div>
    <ArtinosTheme theme={theme} design={design} type={type} density={density} ground className="sc-concept__stage" data-narrow={narrow || undefined}>
      <div className="sc-concept__stage-head"><div><span>Inspector / live study</span><h2>{DESIGN_META[design].label}</h2></div><span>{THEME_META[theme].label}</span></div>
      <Inspector items={ITEMS} folders={FOLDERS} store={store} presets={PRESETS} only={folder === 'all' ? undefined : [folder]} storageKey={'artinos-concept.' + design}
        rail={<>{[{id:'all',title:'All'},...FOLDERS].map((f) => <Button key={f.id} variant={folder === f.id ? 'primary' : 'ghost'} onClick={() => setFolder(f.id)}>{f.title}</Button>)}</>}
        summary={<Summary design={design} store={store} />}
        footer={<><Button onClick={() => store.undo()}>Undo</Button><Button onClick={() => store.redo()}>Redo</Button><Button onClick={() => setTimeline(!timeline)}>{timeline ? 'Hide timeline' : 'Timeline'}</Button><span className="sc-concept__spacer" /><Button onClick={() => store.reset()}>Reset</Button><Button variant="primary" onClick={() => store.commit()}>Commit</Button></>}
      />
      {timeline && <Panel title="Animation" subtitle="Set diamonds on parameter rows to create tracks"><InspectorTimeline items={ITEMS} store={store} /></Panel>}
      <ComponentStudy store={store} />
    </ArtinosTheme>
    <footer className="sc-concept__note">Changing design or palette never resets the store. The swatch and response curve are illustrative, not a physical material renderer.</footer>
  </ArtinosTheme>;
}
