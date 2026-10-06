import { useEffect, useState } from 'react';
import {
  GRADIENTS, Slider, RangeSlider, NumberField, Switch, ToggleGroup, Segmented, ColorField, Select, Panel, Section, Field, Tabs, RollingValue,
} from '../../../src';
import type { RangeValue } from '../../../src';
import { Spec, Part, ICONS, wave } from '../shared';

/* The complete component gallery — every component, variant and state. Rendered by the
   showcase page and, live under your edits, by the Theme Studio preview. */

/* ---------- event log ---------- */
function EventLog() {
  const [v, setV] = useState(0.5);
  const [range, setRange] = useState<RangeValue>([0.2, 0.6]);
  const [on, setOn] = useState(true);
  const [log, setLog] = useState<Array<{ k: string; t: string }>>([]);
  const push = (k: string, t: string) => setLog((l) => [{ k, t }, ...l].slice(0, 7));
  return (
    <div className="sc-grid sc-grid--wide">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Slider label="Controlled" value={v} onChange={(x) => { setV(x); push('onChange', x.toFixed(4)); }} onCommit={(x) => push('onCommit', x.toFixed(4))} enabled={on} onEnabledChange={(e) => { setOn(e); push('onEnabledChange', String(e)); }} toggleable />
        <RangeSlider label="Controlled" value={range} onChange={(r) => { setRange(r); push('onChange', r.map((x) => x.toFixed(3)).join(' – ')); }} onCommit={(r) => push('onCommit', r.map((x) => x.toFixed(3)).join(' – '))} />
        <div className="sc-note">
          state: <b>{v.toFixed(4)}</b> · enabled <b>{String(on)}</b> · range <b>{range.map((x) => x.toFixed(2)).join('–')}</b>
        </div>
      </div>
      <div className="sc-log" aria-live="polite">
        {log.length ? log.map((e, i) => (<span key={i}><em>{e.k}</em>{e.t}</span>)) : <span>Drag, scrub, use the keys or double-click the sliders…</span>}
      </div>
    </div>
  );
}

/* ---------- live readout demo ---------- */
function RollingDemo() {
  const [v, setV] = useState(59.99);
  useEffect(() => {
    const id = setInterval(() => setV((x) => (x >= 60.4 ? 59.87 : +(x + 0.01).toFixed(2))), 380);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="sc-row" style={{ alignItems: 'center' }}>
      <span style={{ font: '200 44px var(--ar-font-num)', color: 'var(--ar-text-hi)' }}>
        <RollingValue text={v.toFixed(2)} unit="dB" base={2} />
      </span>
      <span className="sc-note">Only changing digits move · direction-aware · carries (59.99 → 60.00) resolve right-to-left as one motion.</span>
    </div>
  );
}

export function ComponentGallery() {
  const [tab, setTab] = useState('scene');
  const [grow, setGrow] = useState<string>('Fill');
  return (
    <>
        {/* ============ SLIDER ============ */}
        <Part title="Slider" note="one compact precision surface" />

        <Spec n="01" title="Material" text="A body press places the value and keeps dragging. A press within 13 px of the seam grabs it without a jump. The seam sits 4 px inside the active insert; text switches ink where the insert covers it." code={`
import { Slider } from './artinos-ui';

const [rough, setRough] = useState(0.52);
<Slider label="Roughness" value={rough} onChange={setRough} onCommit={save} />
<Slider label="Transmission" min={0} max={100} defaultValue={65} />
<Slider label="Displace" decimals={3} unit="m" defaultValue={0.125} />`}>
          <div className="sc-grid">
            <Slider label="Roughness" defaultValue={0.52} />
            <Slider label="Transmission" defaultValue={65} min={0} max={100} />
            <Slider label="Metalness" defaultValue={0.18} />
            <Slider label="Specular" defaultValue={0.5} />
            <Slider label="Displace" defaultValue={0.125} decimals={3} unit="m" />
            <Slider label="IOR" defaultValue={1.45} min={1} max={2.5} decimals={3} />
          </div>
        </Spec>

        <Spec n="02" title="Precision" text="Drag from the readout. Vertical distance from it selects the sensitivity; extra digits appear while scrubbing and collapse on release. The HUD exists only for this gesture." keys={[['0–26 PX', '1×'], ['26–78 PX', '0.1×'], ['78+ PX', '0.01×'], ['ALT', 'FINE'], ['SHIFT', 'ULTRA-FINE'], ['CTRL', 'SNAP / NEXT DETENT'], ['DBL-CLICK VALUE', 'TYPE A VALUE'], ['ENTER / F2', 'TYPE A VALUE'], ['ESC', 'CANCEL DRAG / TYPING'], ['WHEEL', 'ONLY WHEN FOCUSED'], ['HOME / END', 'MIN / MAX']]} code={`
<Slider label="IOR" min={1} max={2.5} decimals={3} precision={3} />   // 1× · 0.1× · 0.01×
<Slider label="Anisotropy" precision={2} />                           // 1× · 0.1×`}>
          <div className="sc-grid">
            <Slider label="IOR" defaultValue={1.45} min={1} max={2.5} decimals={3} />
            <Slider label="Anisotropy" defaultValue={0.35} precision={2} />
            <Slider label="Rotation" defaultValue={128} min={0} max={360} format="angle" decimals={1} />
            <Slider label="Focus Dist" defaultValue={2.4} min={0.1} max={100} mapping="log" unit="m" />
          </div>
          <RollingDemo />
        </Spec>

        <Spec n="03" title="Paired layout" text="Label outside the capsule — a layout variation only. Material, interaction and precision are unchanged." code={`<Slider layout="paired" labelWidth={110} label="Clearcoat" defaultValue={0.8} />`}>
          <div className="sc-grid sc-grid--wide">
            <Slider layout="paired" label="Clearcoat" defaultValue={0.8} />
            <Slider layout="paired" label="Sheen" defaultValue={0.25} />
            <Slider layout="paired" label="Subsurface" defaultValue={0.1} />
            <Slider layout="paired" variant="gradient" gradient="saturate" label="Saturate" defaultValue={0.65} />
          </div>
        </Spec>

        <Spec n="04" title="Stepped" text="steps quantizes the value, not only the drawing. The stepped variant draws cells; on the material variant, hairline ticks appear up to 16 steps and nothing beyond." code={`
<Slider variant="stepped" steps={6} min={1} max={6} decimals={0} label="Samples" />
<Slider steps={9} min={0} max={8} decimals={0} label="Bounces" />`}>
          <div className="sc-grid">
            <Slider variant="stepped" steps={6} label="Samples" min={1} max={6} defaultValue={4} decimals={0} />
            <Slider variant="stepped" steps={4} label="Quality" min={1} max={4} defaultValue={3} decimals={0} />
            <Slider steps={9} label="Bounces" min={0} max={8} defaultValue={3} decimals={0} />
            <Slider steps={5} label="LOD Bias" min={-2} max={2} defaultValue={0} decimals={0} />
          </div>
        </Spec>

        <Spec n="05" title="Detents + mapping" text="Detents are semantic magnets: 6 px, 22 px with Ctrl; the seam lights on capture and Ctrl + arrow jumps between them. log · exp · power mappings change geometry only — the value stays exact. Formats: number · percent · db · angle · hz · time, or your own formatter." code={`
<Slider label="Mix" format="percent" decimals={0} detents={[0.5]} />
<Slider label="Gain" format="db" min={-60} max={12} detents={[0]} />
<Slider label="Cutoff" format="hz" mapping="log" min={20} max={20000} detents={[1000]} />
<Slider label="Frames" formatter={(v) => ({ text: Math.round(v * 24).toString(), unit: 'fr' })} />`}>
          <div className="sc-grid">
            <Slider label="Mix" format="percent" decimals={0} defaultValue={0.47} detents={[0.5]} />
            <Slider label="Opacity" format="percent" decimals={1} defaultValue={0.75} detents={[0.25, 0.5, 0.75]} />
            <Slider label="Gain" format="db" decimals={1} min={-60} max={12} defaultValue={-4.5} detents={[0]} />
            <Slider label="Cutoff" format="hz" mapping="log" decimals={0} min={20} max={20000} defaultValue={440} detents={[1000]} />
            <Slider label="Duration" format="time" decimals={2} min={0} max={10} mapping="exp" defaultValue={2.5} />
            <Slider label="Frames" defaultValue={0.5} formatter={(v) => ({ text: Math.round(v * 24).toString(), unit: 'fr' })} />
          </div>
        </Spec>

        <Spec n="06" title="Bipolar + status" text="For signed values the neutral point is semantic: the fill grows from the origin in either direction. status tints the seam and indicator quietly — bound, automated, warn, fault — without turning the slider into another widget." code={`
<Slider label="Pan" bipolar min={-1} max={1} detents={[0]} />
<Slider label="Offset" origin={0.5} />
<Slider label="Drive" status="bound" />   // bound · automated · warn · fault`}>
          <div className="sc-grid">
            <Slider label="Pan" bipolar min={-1} max={1} defaultValue={-0.35} detents={[0]} />
            <Slider label="Bias" bipolar min={-100} max={100} decimals={0} defaultValue={42} />
            <Slider label="Bound" status="bound" defaultValue={0.62} />
            <Slider label="Automated" status="automated" defaultValue={0.3} />
            <Slider label="Warn" status="warn" defaultValue={0.88} />
            <Slider label="Fault" status="fault" defaultValue={0.12} />
          </div>
        </Spec>

        <Spec n="07" title="Range" text="The same capsule holding an interval. Seam press grabs that end; press inside moves the whole interval; press outside moves the nearest end; the readout scrubs the active end. Each end is its own focusable slider." code={`
const [band, setBand] = useState<RangeValue>([0.2, 0.7]);
<RangeSlider label="Band" value={band} onChange={setBand} minSpan={0.05} />
<RangeSlider label="Freq" format="hz" mapping="log" min={20} max={20000} defaultValue={[200, 4000]} />`}>
          <div className="sc-grid sc-grid--wide">
            <RangeSlider label="Band" defaultValue={[0.2, 0.7]} minSpan={0.05} />
            <RangeSlider label="Freq" min={20} max={20000} mapping="log" format="hz" decimals={0} defaultValue={[200, 4000]} />
            <RangeSlider label="Frames" min={0} max={240} decimals={0} steps={241} defaultValue={[24, 180]} />
            <RangeSlider layout="paired" label="Depth" min={0} max={100} decimals={0} unit="m" defaultValue={[12, 55]} toggleable />
          </div>
        </Spec>

        <Spec n="08" title="Gradient" text="The track carries the parameter's own scale. While dragging, a swatch reads out the sampled colour below the seam. Label and value ink follow the luminance under them. Pass your own stops for any scale." code={`
<Slider variant="gradient" gradient="temperature" min={0} max={100} label="Temperature" />
<Slider variant="gradient" gradient={{ stops: [[0, '#1B1F3B'], [1, '#FFB000']], describe: (t) => t > .5 ? 'DAY' : 'NIGHT' }} />`}>
          <div className="sc-grid">
            {(Object.keys(GRADIENTS) as Array<keyof typeof GRADIENTS>).map((g) => (
              <Slider key={g} variant="gradient" gradient={g} label={g} min={g === 'exposure' ? -4 : 0} max={g === 'hue' ? 360 : g === 'exposure' ? 4 : 100} format={g === 'hue' ? 'angle' : 'number'} unit={g === 'exposure' ? 'EV' : undefined} decimals={g === 'hue' ? 0 : 1} defaultValue={g === 'hue' ? 165 : g === 'exposure' ? 0.4 : 65} detents={g === 'exposure' ? [0] : undefined} />
            ))}
            <Slider variant="gradient" gradient={{ stops: [[0, '#1B1F3B'], [0.55, '#E86F51'], [1, '#FFD27A']], describe: (t) => (t > 0.5 ? 'DAY' : 'NIGHT') }} label="Sun" defaultValue={0.7} />
          </div>
        </Spec>

        <Spec n="09" title="Ruler" text="The scale moves beneath a fixed index — camera focus ring, not progress bar. Drag right and the scale follows the hand. Precision from the readout zooms the engraving. Marked positions hold with a light magnet; snapStep settles on release." code={`
<Slider variant="ruler" label="Focal" min={12} max={200} span={40} unit="mm" decimals={0} marks={[24, 35, 50, 85, 135]} />
<Slider variant="ruler" label="Focus" min={0.3} max={20} span={1.6} unit="m" decimals={1} snapStep={0.1} />`}>
          <div className="sc-grid sc-grid--wide">
            <Slider variant="ruler" label="Focal" min={12} max={200} span={40} unit="mm" decimals={0} defaultValue={50} marks={[24, 35, 50, 85, 135]} />
            <Slider variant="ruler" label="Focus" min={0.3} max={20} span={1.6} unit="m" decimals={1} snapStep={0.1} defaultValue={2.4} />
            <Slider variant="ruler" label="Tempo" min={40} max={240} span={30} unit="BPM" decimals={1} defaultValue={120} marks={[120]} />
            <Slider variant="ruler" label="Yaw" min={-180} max={180} span={90} format="angle" decimals={1} defaultValue={35} marks={[-90, 0, 90]} />
          </div>
        </Spec>

        <Spec n="10" title="Visualized" text="Data on the surface only when it describes the parameter: the response the value samples, the signal the playhead scrubs. The drawing is the interaction surface." code={`
<Slider variant="curve" curve="sigmoid" label="Response" />     // sigmoid · smooth · gamma · (x) => y
<Slider variant="wave" samples={amplitudes} format="time" max={12} label="Scrub" />`}>
          <div className="sc-grid sc-grid--wide">
            <Slider variant="curve" curve="sigmoid" label="Response" defaultValue={0.62} />
            <Slider variant="curve" curve="gamma" label="Gamma" defaultValue={0.3} />
            <Slider variant="wave" label="Scrub" format="time" min={0} max={12} defaultValue={4.2} samples={wave} />
            <Slider variant="curve" curve={(x) => 0.5 + 0.45 * Math.sin(x * Math.PI * 3) * (1 - x)} label="Custom" defaultValue={0.4} />
          </div>
        </Spec>

        <Spec n="11" title="Enable / off" text="Double-click switches the parameter off; the stored value is kept and shown, the material drains. Double-click again to restore it. An off slider still takes focus but ignores drag, wheel and keys." code={`
<Slider label="Bloom" toggleable defaultValue={0.64} />
<Slider label="Vignette" toggleable defaultEnabled={false} />
<Slider label="Grain" enabled={grainOn} onEnabledChange={setGrainOn} toggleable />`}>
          <div className="sc-grid">
            <Slider label="Bloom" toggleable defaultValue={0.64} />
            <Slider label="Vignette" toggleable defaultEnabled={false} defaultValue={0.4} />
            <Slider variant="gradient" gradient="temperature" label="White Bal" toggleable defaultEnabled={false} min={0} max={100} defaultValue={58} />
            <Slider variant="ruler" label="Focal" toggleable defaultEnabled={false} min={12} max={200} span={40} unit="mm" decimals={0} defaultValue={85} />
            <Slider variant="stepped" steps={5} label="Taps" toggleable min={1} max={5} decimals={0} defaultValue={3} />
            <Slider variant="curve" label="Curve" toggleable defaultEnabled={false} defaultValue={0.5} />
          </div>
        </Spec>

        <Spec n="12" title="Events" text="Every control is controlled or uncontrolled. onChange fires live, onCommit once on release (and per key press). Watch the log." code={`
<Slider value={v} onChange={setV} onCommit={persist}
        enabled={on} onEnabledChange={setOn} toggleable />`}>
          <EventLog />
        </Spec>

        {/* ============ FAMILY ============ */}
        <Part title="Family" note="same well · same insert · same LED seam · same theme" />

        <Spec n="13" title="Switch" text="shutter: the slider insert as a two-position shutter — it travels to the active half and its LED seam lights; off, the same insert drains to grey. compact: the inspector knob. Click, Space or Enter." code={`
<Switch label="Shadows" defaultValue />
<Switch label="Live" labelOff="Paused" />
<Switch variant="compact" label="Enabled" value={on} onChange={setOn} />`}>
          <div className="sc-grid">
            <Switch label="Shadows" defaultValue />
            <Switch label="Bloom" />
            <Switch label="Live" labelOff="Paused" defaultValue />
            <Switch label="Locked" disabled defaultValue />
          </div>
          <div className="sc-row" style={{ alignItems: 'center' }}>
            <Switch variant="compact" label="Enabled" defaultValue />
            <Switch variant="compact" label="Snap" />
            <Switch variant="compact" density="comfort" label="Grid" defaultValue />
          </div>
        </Spec>

        <Spec n="14" title="Toggle group" text="Independent flags sharing one well; each chip is a small insert with its own LED seam. multiple={false} makes a solo group that can also be emptied. Icon options recede into the well when off." code={`
<ToggleGroup label="Axis" options={['X', 'Y', 'Z']} defaultValue={['X', 'Z']} />
<ToggleGroup label="Solo" options={['A', 'B', 'C']} multiple={false} />
<ToggleGroup options={[{ value: 'bold', icon: <Bold />, title: 'Bold' }, …]} />`}>
          <div className="sc-grid">
            <ToggleGroup label="Passes" options={['DIFFUSE', 'SPEC']} defaultValue={['DIFFUSE']} />
            <ToggleGroup label="Axis" options={['X', 'Y', 'Z']} defaultValue={['X', 'Z']} />
            <ToggleGroup options={['FRONT', 'TOP']} defaultValue={['FRONT']} />
            <ToggleGroup label="Solo" options={['A', 'B', 'C']} defaultValue={['B']} multiple={false} />
            <ToggleGroup label="Style" options={[{ value: 'b', icon: ICONS.bold, title: 'Bold' }, { value: 'i', icon: ICONS.italic, title: 'Italic' }, { value: 'u', icon: ICONS.under, title: 'Underline' }]} defaultValue={['b']} />
            <ToggleGroup label="Align" multiple={false} options={[{ value: 'l', icon: ICONS.alignL, title: 'Left' }, { value: 'c', icon: ICONS.alignC, title: 'Centre' }, { value: 'r', icon: ICONS.alignR, title: 'Right' }]} defaultValue={['l']} />
          </div>
        </Spec>

        <Spec n="15" title="Segmented" text="One of n. The insert travels between positions and the text it arrives under switches ink. Arrow keys move it; options can carry icons or be disabled." code={`
<Segmented label="Quality" options={['LOW', 'MED', 'HIGH', 'ULTRA']} defaultValue="HIGH" />
<Segmented options={[{ value: 'l', icon: <AlignLeft /> }, …]} />`}>
          <div className="sc-grid">
            <Segmented label="Quality" options={['LOW', 'MED', 'HIGH', 'ULTRA']} defaultValue="HIGH" />
            <Segmented label="Space" options={['LINEAR', 'SRGB', 'ACES']} defaultValue="ACES" />
            <Segmented label="Scale" options={['1X', '2X', { value: '4X', disabled: true }, '8X']} defaultValue="2X" />
            <Segmented label="Align" options={[{ value: 'l', icon: ICONS.alignL, title: 'Left' }, { value: 'c', icon: ICONS.alignC, title: 'Centre' }, { value: 'r', icon: ICONS.alignR, title: 'Right' }]} defaultValue="c" />
          </div>
        </Spec>

        <Spec n="16" title="Color" text="Label in the well, the colour itself as the insert; hex ink follows luminance. Click the colour for the system picker, click the code to type one. alpha adds a scrubbable opacity readout (drag it, or arrows) over a checkerboard." code={`
<ColorField label="Color" value={hex} onChange={setHex} />
<ColorField label="Fog" alpha defaultValue="#E4671BCC" />   // #RRGGBBAA
<ColorField alpha defaultValue="#8DBBB4FF" />               // no label: full-width swatch`}>
          <div className="sc-grid">
            <ColorField label="Color" defaultValue="#00C8B3" />
            <ColorField label="Fog" alpha defaultValue="#E4671BCC" />
            <ColorField label="Ambient" defaultValue="#B0B0B0" />
            <ColorField label="Key Light" defaultValue="#F2E8D5" />
            <ColorField alpha defaultValue="#8DBBB4FF" />
            <ColorField alpha defaultValue="#5A7CFF66" />
          </div>
        </Spec>

        <Spec n="17" title="Select" text="Closed, a full-width insert with a chevron — or a quiet well with appearance=&quot;well&quot;. Open, it extends into a glass list panel portalled to <body>, so docks never clip it. Arrows, Home/End, Enter, Escape and type-ahead." code={`
<Select label="Tonemap" options={['ACES', 'AGX', 'FILMIC']} defaultValue="AGX" />
<Select appearance="well" options={['Fixed', 'Fill', 'Hug']} defaultValue="Fixed" />`}>
          <div className="sc-grid">
            <Select label="List" options={['ITEM 1', 'ITEM 2', 'ITEM 3', 'ITEM 4']} />
            <Select label="Tonemap" options={['ACES', 'AGX', 'FILMIC', 'NEUTRAL']} defaultValue="AGX" />
            <Select label="Blend" options={['NORMAL', 'ADD', 'MULTIPLY', 'SCREEN', { value: 'OVERLAY', disabled: true }]} defaultValue="SCREEN" />
            <Select label="Sizing" appearance="well" options={['Fixed', 'Fill', 'Hug']} defaultValue="Fixed" />
          </div>
        </Spec>

        <Spec n="18" title="Number field" text="A recessed numeric cell that is also a scrubber. Drag sideways to scrub (Alt 0.1×, Shift 10×); click to type — Enter commits, Escape cancels; typing a digit starts fresh. Arrows and wheel step while focused." code={`
<NumberField value={w} onChange={setW} min={0} step={1} aria-label="Width" />
<NumberField label="X" decimals={2} step={0.01} unit="m" />
<NumberField label="Rot" format="angle" decimals={1} align="end" />`}>
          <div className="sc-grid">
            <NumberField defaultValue={268} aria-label="Width" />
            <NumberField label="X" defaultValue={1.25} decimals={2} step={0.01} unit="m" />
            <NumberField label="Rot" defaultValue={45} decimals={1} format="angle" align="end" />
            <NumberField label="Samples" defaultValue={64} min={1} max={4096} step={8} />
          </div>
        </Spec>

        {/* ============ LAYOUT ============ */}
        <Part title="Layout" note="panel · section · field · tabs" />

        <Spec n="19" title="Inspector" text="Panel (frosted card with header, tabs slot and foot line), Section (collapsible group), Field (label column + controls) and Tabs (travelling underline) — composed into the reference inspector." code={`
<Panel title="Metablock" subtitle="Typography / Layout" actions={<ResetButton />}
       tabs={<Tabs items={['Scene', 'Studio', 'Detail']} value={tab} onChange={setTab} />}
       footer={<>• Ready <span>LOCAL / 01</span></>}>
  <Slider label="Weight" min={0} max={100} decimals={0} />
  <Section title="Typography" heading="text" collapsible>
    <Field label="Width">
      <NumberField defaultValue={268} aria-label="Width" />
      <Select appearance="well" options={['Fixed', 'Fill', 'Hug']} />
    </Field>
    <Field label="Enabled"><Switch variant="compact" label="Enabled" /></Field>
  </Section>
</Panel>`}>
          <div className="sc-row">
            <Panel
              className="sc-inspector"
              title="Metablock"
              subtitle="Typography / Layout"
              actions={<><span className="ar-dot" data-on="" /><button type="button" className="sc-icon-btn" aria-label="Reset">{ICONS.reset}</button></>}
              tabs={<Tabs label="Inspector" items={[{ value: 'scene', label: 'Scene' }, { value: 'studio', label: 'Studio' }, { value: 'detail', label: 'Detail' }]} value={tab} onChange={setTab} />}
              footer={<><span>• Ready</span><span style={{ marginLeft: 'auto' }}>LOCAL / 01</span></>}
            >
              {tab === 'scene' ? (
                <>
                  <Slider label="Weight" defaultValue={55} min={0} max={100} decimals={0} />
                  <Slider label="Tracking" defaultValue={38} min={0} max={100} decimals={0} />
                  <Slider label="Rotation" defaultValue={24} min={0} max={360} format="angle" decimals={0} />
                  <Section title="Typography" heading="text" collapsible>
                    <Field label="Width"><NumberField defaultValue={268} aria-label="Width" /><Select options={['Fixed', 'Fill', 'Hug']} defaultValue="Fixed" appearance="well" label="Width mode" /></Field>
                    <Field label="Height"><NumberField defaultValue={268} aria-label="Height" /><Select options={['Fixed', 'Fill', 'Hug']} defaultValue="Fixed" appearance="well" label="Height mode" /></Field>
                    <Field label="Grow"><ToggleGroup multiple={false} options={[{ value: 'fill', icon: ICONS.fill, title: 'Fill' }, { value: 'start', icon: ICONS.start, title: 'Start' }, { value: 'fixed', icon: ICONS.fixed, title: 'Fixed' }]} defaultValue={['fill']} /></Field>
                    <Field label="Sizing"><Segmented options={['Fixed', 'Fill', 'Hug']} value={grow} onChange={setGrow} label="Sizing" /></Field>
                    <Field label="Color"><ColorField alpha defaultValue="#8DBBB4FF" /></Field>
                    <Field label="Enabled"><Switch variant="compact" label="Enabled" defaultValue /></Field>
                  </Section>
                </>
              ) : tab === 'studio' ? (
                <>
                  <Slider variant="gradient" gradient="exposure" label="Exposure" min={-4} max={4} decimals={1} unit="EV" defaultValue={0.4} detents={[0]} />
                  <Slider variant="ruler" label="Focal" min={12} max={200} span={40} unit="mm" decimals={0} defaultValue={50} marks={[35, 50, 85]} />
                  <Field label="Lens"><Select options={['Prime', 'Zoom', 'Macro']} defaultValue="Prime" appearance="well" label="Lens" /></Field>
                </>
              ) : (
                <>
                  <RangeSlider label="Clip" defaultValue={[0.05, 0.9]} />
                  <Field label="Seed"><NumberField defaultValue={1337} aria-label="Seed" /></Field>
                  <Field label="Tags"><ToggleGroup options={['A', 'B', 'C']} defaultValue={['A']} /></Field>
                </>
              )}
            </Panel>
            <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <Section title="Environment" count="04">
                <Slider label="Env Intensity" max={2} unit="x" defaultValue={0.82} detents={[1]} />
                <Slider label="Fog Density" max={0.2} decimals={3} defaultValue={0.04} />
              </Section>
              <Section title="Collapsible" count="02" collapsible defaultOpen={false}>
                <Slider label="Hidden A" defaultValue={0.3} />
                <Slider label="Hidden B" defaultValue={0.7} />
              </Section>
            </div>
          </div>
        </Spec>

        <Spec n="20" title="Studio dock" text="The SH.01 bottom dock: dense toggleable sliders in three cards on a frosted strip. Every slider switches off with a double-click and keeps its value." code={`
<div data-ar-density="dense">
  <Section title="Environment" count="14">
    <Slider variant="gradient" gradient="exposure" label="Exposure" toggleable … />
    <Slider label="Env Intensity" toggleable … />
  </Section>
</div>`}>
          <div data-ar-density="dense">
            <div className="sc-dock">
              <div className="sc-dock__card" style={{ flexGrow: 1.2 }}>
                <Section title="Environment" count="14">
                  <Slider toggleable variant="gradient" gradient="exposure" label="Exposure" min={-4} max={4} unit="EV" defaultValue={0.4} detents={[0]} />
                  <Slider toggleable label="Env Intensity" max={2} unit="x" defaultValue={0.82} detents={[1]} />
                  <Slider toggleable label="Fog Density" max={0.2} decimals={3} defaultValue={0.04} />
                  <Slider toggleable label="Ground Blur" defaultValue={0.36} />
                </Section>
                <span className="sc-dock__foot">STUDIO · PERSIAN GARDEN</span>
              </div>
              <div className="sc-dock__card">
                <Section title="Output" count="09">
                  <Slider toggleable steps={7} label="DPR" min={0.5} max={2} unit="x" defaultValue={1.75} />
                  <Slider toggleable label="Shadow Bias" max={0.1} decimals={3} defaultValue={0.02} />
                  <Slider toggleable label="Tone Contrast" defaultValue={0.58} detents={[0.5]} />
                  <Slider toggleable variant="gradient" gradient="temperature" label="White Bal" min={0} max={100} defaultValue={58} />
                </Section>
                <span className="sc-dock__foot">WEBGPU · ADAPTIVE DPR</span>
              </div>
              <div className="sc-dock__card" style={{ flexGrow: 0.85 }}>
                <Section title="Stack" count="44">
                  <Slider toggleable label="Bloom" defaultValue={0.24} />
                  <Slider toggleable label="Orb Energy" defaultValue={0.71} status="automated" />
                  <Slider toggleable label="Grain" defaultValue={0.08} defaultEnabled={false} />
                  <Slider toggleable variant="gradient" gradient="hue" label="Tint" min={0} max={360} format="angle" decimals={0} defaultValue={172} />
                </Section>
                <span className="sc-dock__foot">6 ACTIVE · 2.1 MS</span>
              </div>
            </div>
            <div className="sc-console"><b>CONSOLE</b><span>Drag a readout for precision · double-click a slider to switch it off</span></div>
          </div>
        </Spec>

    </>
  );
}
