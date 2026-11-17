/* The instrument that opens the showcase, under the hero: one working tool in the page's own theme,
   type, accent, backdrop and density. A scene, its Inspector, Timeline and Monitor, and a panel of
   the everyday controls. Its bar switches the density the whole page is in; the Density chapter
   explains what changes. */
import { useEffect, useState } from 'react';
import { Badge, Button, ColorField, DENSITIES, DENSITY_META, Meter, NumberField, PropertyRow, RangeSlider, Section, Segmented, Select, Slider, Sparkline, StatStrip, Switch, TextField } from '../../../src';
import type { Density, DockApi } from '../../../src';
import { useLiveSeries } from '../chapters/demos';
import { ProWorkspace } from '../chapters/inspector-demo';
import { chapterAnchor } from '../chapters/registry';
import { BACKDROPS } from '../shared';
import type { Backdrop } from '../shared';

/** The everyday controls, hand-written the usual way: nothing here knows about the density. */
function Controls() {
  const series = useLiveSeries();
  const last = series[series.length - 1];
  const [name, setName] = useState('Key light');
  return (
    <>
      <StatStrip
        items={[
          { label: 'Load', value: Math.round(last * 100), unit: '%' },
          { label: 'Frame', value: (4 + last * 6).toFixed(1), unit: 'ms' },
          { label: 'Rate', value: 60, unit: 'fps' },
        ]}
      />
      <Section title="Sliders">
        <Slider label="Exposure" defaultValue={0.62} />
        <Slider label="Gain" format="db" min={-60} max={12} decimals={1} defaultValue={-4.5} detents={[0]} />
        <Slider label="Pan" min={-1} max={1} bipolar detents={[0]} defaultValue={0.2} />
        <Slider label="Samples" variant="stepped" steps={8} min={1} max={8} decimals={0} defaultValue={4} />
        <Slider label="White balance" variant="gradient" gradient="temperature" min={2000} max={10000} decimals={0} unit="K" defaultValue={5600} />
        <RangeSlider label="Depth" min={0} max={100} decimals={0} unit="m" defaultValue={[12, 64]} />
      </Section>
      <Section title="Fields">
        <PropertyRow label="Name" density="compact">
          <TextField size="sm" aria-label="Name" value={name} onChange={setName} />
        </PropertyRow>
        <PropertyRow label="Width" density="compact">
          <NumberField aria-label="Width" defaultValue={268} unit="px" align="end" />
        </PropertyRow>
        <PropertyRow label="Fit" density="compact">
          <Select label="Fit" options={['Fixed', 'Fill', 'Hug', 'Stretch']} defaultValue="Fill" appearance="well" />
        </PropertyRow>
        <PropertyRow label="Space" density="compact">
          <Segmented label="Space" options={['Local', 'World', 'View']} defaultValue="World" />
        </PropertyRow>
        <PropertyRow label="Colour" density="compact">
          <ColorField defaultValue="#F2E8D5" />
        </PropertyRow>
        <PropertyRow label="Shadows" density="compact">
          <Switch variant="compact" aria-label="Shadows" defaultValue />
        </PropertyRow>
      </Section>
      <Section title="Readouts">
        <Meter label="CPU" value={last} valueText={`${Math.round(last * 100)}%`} peak />
        <Sparkline label="Frame time" values={series} fill threshold={0.7} width={220} height={28} />
      </Section>
      <Section title="Actions">
        <div className="sc-instrument__actions">
          <Button size="sm" variant="primary">
            Render
          </Button>
          <Button size="sm">Preview</Button>
          <Button size="sm" variant="ghost">
            Cancel
          </Button>
          <Badge>Live</Badge>
        </div>
      </Section>
    </>
  );
}

/** Whether the window is narrower than a query width. */
function useNarrow(px: number) {
  const query = `(max-width: ${px}px)`;
  const [narrow, setNarrow] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(query).matches);
  useEffect(() => {
    const m = matchMedia(query);
    const on = () => setNarrow(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return narrow;
}

/** The working instrument under the hero. On a narrow window it keeps the Inspector and drops the
 *  everyday controls, rather than crushing three columns. */
export function InstrumentStage({ bg, density, onDensity }: { bg: Backdrop; density: Density; onDensity: (d: Density) => void }) {
  const [dock, setDock] = useState<DockApi | null>(null);
  const narrow = useNarrow(1180);
  const [controls] = useState(() => <Controls />);
  return (
    <section className="sc-instrument" aria-label="A working instrument">
      <div className="sc-instrument__bar">
        <span className="sc-instrument__caption">
          A working instrument: the Inspector bound to the scene, its Timeline and Monitor{narrow ? '' : ', and the everyday controls'}. Drag, scrub, key and dock any of it.
        </span>
        <Segmented className="sc-instrument__density" options={DENSITIES.map((d) => ({ value: d, label: DENSITY_META[d].label }))} value={density} onChange={onDensity} label="Density" />
        <Button size="sm" variant="ghost" disabled={!dock} onClick={() => dock?.resetLayout()}>
          Reset layout
        </Button>
        <a className="sc-instrument__more" href={'#' + chapterAnchor('density')}>
          How density works
        </a>
      </div>
      <ProWorkspace key={narrow ? 'narrow' : 'wide'} scene={BACKDROPS[bg] || BACKDROPS.monstera} controls={narrow ? undefined : controls} onReady={setDock} />
    </section>
  );
}
