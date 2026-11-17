/* Density — Dense, Standard and Comfort: the same instrument at three sizes, every theme scaled to each.
   The families side by side with their measures, and a theme with settings of its own in one family. Everything follows the theme picked in the bar. */
import { useLayoutEffect, useRef, useState } from 'react';
import { ArtinosTheme, Badge, DENSITIES, DENSITY_META, Field, Panel, Section, Segmented, Select, Slider, StatStrip, Switch } from '../../../src';
import type { Density } from '../../../src';
import { Chapter, Spec } from '../shared';

/** One family: the same panel, measured where it stands. */
function Family({ d }: { d: Density }) {
  const ref = useRef<HTMLDivElement>(null);
  const [m, setM] = useState({ h: 0, r: 0, gap: 0 });
  // read what the page draws, after every render: a theme or type change re-renders the chapter
  useLayoutEffect(() => {
    const el = ref.current;
    const sliders = el ? [...el.querySelectorAll<HTMLElement>('.ar-section__body > .ar-slider')] : [];
    const track = sliders[0]?.querySelector<HTMLElement>('.ar-slider__track');
    if (!track || sliders.length < 2) return;
    const next = {
      h: Math.round(track.getBoundingClientRect().height),
      r: Math.round(parseFloat(getComputedStyle(track).borderTopLeftRadius) * 10) / 10 || 0,
      gap: Math.round(sliders[1].getBoundingClientRect().top - sliders[0].getBoundingClientRect().bottom),
    };
    if (next.h !== m.h || next.r !== m.r || next.gap !== m.gap) setM(next);
  });
  return (
    <div ref={ref} className="sc-family" data-ar-density={d}>
      <Panel title={DENSITY_META[d].label} subtitle={DENSITY_META[d].description} actions={<Badge>{`× ${DENSITY_META[d].scale.toFixed(2)}`}</Badge>}>
        <StatStrip
          items={[
            { label: 'Control', value: m.h, unit: 'px' },
            { label: 'Corner', value: m.r, unit: 'px' },
            { label: 'Rows', value: m.gap, unit: 'px' },
          ]}
        />
        <Section title="Material" count={6}>
          <Slider label="Exposure" defaultValue={0.62} />
          <Slider label="Gain" format="db" min={-60} max={12} decimals={1} defaultValue={-4.5} detents={[0]} />
          <Slider label="Samples" variant="stepped" steps={6} min={1} max={6} decimals={0} defaultValue={3} />
          <Segmented label="Quality" options={['Low', 'Med', 'High']} defaultValue="Med" />
          <Field label="Blend">
            <Select label="Blend" options={['Normal', 'Screen', 'Add']} defaultValue="Screen" appearance="well" />
          </Field>
          <Field label="Shadows">
            <Switch variant="compact" aria-label="Shadows" defaultValue />
          </Field>
        </Section>
      </Panel>
    </div>
  );
}

/** The page's theme, read from the scope this sits in: the demo below re-themes it per family. */
function usePageTheme() {
  const ref = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<string | null>(null);
  useLayoutEffect(() => {
    const t = ref.current?.parentElement?.closest('[data-ar-theme]')?.getAttribute('data-ar-theme') ?? null;
    if (t !== theme) setTheme(t);
  });
  return { ref, theme };
}

const OWN = {
  dense: { signal: '#ff4fa3', 'signal-hi': '#ff8cc4', 'signal-line': 'rgba(255, 79, 163, 0.45)', 'signal-wash': 'rgba(255, 79, 163, 0.14)' },
  comfort: { signal: '#f0b14a', 'signal-hi': '#ffd38a', 'signal-line': 'rgba(240, 177, 74, 0.45)', 'signal-wash': 'rgba(240, 177, 74, 0.14)' },
};

/** One theme, with an accent of its own in Dense and in Comfort: Standard stays as drawn. */
function PerFamily() {
  const { ref, theme } = usePageTheme();
  return (
    <div ref={ref}>
      {theme ? (
        <ArtinosTheme theme={theme} densityTokens={OWN} className="sc-families sc-families--small">
          {DENSITIES.map((d) => (
            <div key={d} data-ar-density={d}>
              <Panel title={DENSITY_META[d].label} subtitle={d === 'standard' ? 'as the theme draws it' : 'its own accent'}>
                <Section title="Light" count={3}>
                  <Slider label="Intensity" defaultValue={0.7} />
                  <Segmented label="Mode" options={['Spot', 'Area', 'Sun']} defaultValue="Area" />
                  <Field label="Shadows">
                    <Switch variant="compact" aria-label="Shadows" defaultValue />
                  </Field>
                </Section>
              </Panel>
            </div>
          ))}
        </ArtinosTheme>
      ) : null}
    </div>
  );
}

export function DensityChapter() {
  return (
    <Chapter id="density">
      <Spec
        id="density-families"
        wide
        text="Three families of the same instrument, chosen for a whole scope like a theme. A family is not the standard set shrunk: the theme draws itself at its own size (Comfort), and the family multiplies every size, gap, corner and inset by one scale, so each theme keeps its proportions in all three. Words step along the type scale instead of shrinking, with 12px the floor. The figures on each panel are measured from what the page draws, in the theme picked in the bar."
        keys={[
          ['Dense', '22 / 28: an editor, an inspector, forty parameters on one screen; rows on a 26px pitch, no hairlines between them'],
          ['Standard', '25 / 28: the working default, between the theme as drawn and Dense'],
          ['Comfort', '28 / 28: the theme exactly as drawn, to read as much as to work'],
          ['the bar', 'Density sets the whole page, the instrument above included'],
        ]}
        code={`<ArtinosTheme density="dense"> … </ArtinosTheme>     // or data-ar-density="dense" on any element
padding: calc(12px * var(--ar-k, 1));                  // a size of your own, in the family's scale`}
      >
        <div className="sc-families">
          {DENSITIES.map((d) => (
            <Family key={d} d={d} />
          ))}
        </div>
      </Spec>

      <Spec
        id="density-themes"
        wide
        text="Every theme can carry settings of its own in each family. Here the page’s theme takes a rose accent in Dense and an amber one in Comfort, and stays as drawn in Standard. In the Theme Studio, an edit lands in the family being previewed, and its exports carry each family’s settings."
        code={`<ArtinosTheme theme="nimbus" densityTokens={{ dense: { signal: '#ff4fa3' }, comfort: { signal: '#f0b14a' } }}>
  …
</ArtinosTheme>`}
      >
        <PerFamily />
      </Spec>
    </Chapter>
  );
}
