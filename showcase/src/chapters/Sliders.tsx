/* 02 · Sliders — the precision surface in all its variants, and the two other ways to set a
   continuous value: Knob and XYPad. */
import { useState } from 'react';
import { GRADIENTS, Knob, RangeSlider, RollingValue, Slider, XYPad } from '../../../src';
import type { RangeValue } from '../../../src';
import { Chapter, Spec, wave } from '../shared';

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
        <Slider
          label="Controlled"
          value={v}
          onChange={(x) => {
            setV(x);
            push('onChange', x.toFixed(4));
          }}
          onCommit={(x) => push('onCommit', x.toFixed(4))}
          enabled={on}
          onEnabledChange={(e) => {
            setOn(e);
            push('onEnabledChange', String(e));
          }}
          toggleable
        />
        <RangeSlider
          label="Controlled"
          value={range}
          onChange={(r) => {
            setRange(r);
            push('onChange', r.map((x) => x.toFixed(3)).join(' – '));
          }}
          onCommit={(r) => push('onCommit', r.map((x) => x.toFixed(3)).join(' – '))}
        />
        <div className="sc-note">
          state: <b><RollingValue text={v.toFixed(4)} base={4} /></b> · enabled <b>{String(on)}</b> · range{' '}
          <b>
            <RollingValue text={range[0].toFixed(2)} />–<RollingValue text={range[1].toFixed(2)} />
          </b>
        </div>
      </div>
      <div className="sc-log" aria-live="polite">
        {log.length ? (
          log.map((e, i) => (
            <span key={i}>
              <em>{e.k}</em>
              {e.t}
            </span>
          ))
        ) : (
          <span>Drag, scrub, use the keys or double-click the sliders…</span>
        )}
      </div>
    </div>
  );
}

function KnobPad() {
  const [angle, setAngle] = useState(0.35);
  const [mix, setMix] = useState(0.7);
  const [xy, setXy] = useState<[number, number]>([0.4, 0.6]);
  return (
    <div className="sc-row" style={{ alignItems: 'center' }}>
      <Knob label="Angle" value={angle} onChange={setAngle} defaultValue={0.5} showLabel />
      <Knob label="Mix" value={mix} onChange={setMix} defaultValue={0.5} showLabel size={44} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <XYPad label="Pan / tilt" value={xy} onChange={setXy} height={150} />
      </div>
    </div>
  );
}

export function SlidersChapter() {
  return (
    <Chapter id="sliders">
      <Spec
        id="slider-material"
        text="A body press places the value and keeps dragging. A press within 13 px of the seam grabs it without a jump. The seam sits 8 px inside the end of the insert; text switches ink where the insert covers it. If the insert would end inside a word, the word stays whole in one ink and the insert steps back behind it, with a small index above and below the text marking the value."
        code={`
import { Slider } from './artinos-ui';

const [rough, setRough] = useState(0.52);
<Slider label="Roughness" value={rough} onChange={setRough} onCommit={save} />
<Slider label="Transmission" min={0} max={100} defaultValue={65} />
<Slider label="Displace" decimals={3} unit="m" defaultValue={0.125} />`}
      >
        <div className="sc-grid">
          <Slider label="Roughness" defaultValue={0.52} />
          <Slider label="Transmission" defaultValue={65} min={0} max={100} />
          <Slider label="Metalness" defaultValue={0.18} />
          <Slider label="Specular" defaultValue={0.5} />
          <Slider label="Displace" defaultValue={0.125} decimals={3} unit="m" />
          <Slider label="IOR" defaultValue={1.45} min={1} max={2.5} decimals={3} />
        </div>
      </Spec>

      <Spec
        id="slider-precision"
        text="Drag from the readout. Vertical distance from it selects the sensitivity; extra digits appear while scrubbing and collapse on release. The HUD exists only for this gesture."
        keys={[
          ['0–26 px', '1×'],
          ['26–78 px', '0.1×'],
          ['78+ px', '0.01×'],
          ['Alt', 'fine'],
          ['Shift', 'ultra-fine'],
          ['Ctrl', 'snap / next detent'],
          ['Double-click value', 'type a value'],
          ['Enter / F2', 'type a value'],
          ['Esc', 'cancel drag / typing'],
          ['Wheel', 'only when focused'],
          ['Home / End', 'min / max'],
        ]}
        code={`
<Slider label="IOR" min={1} max={2.5} decimals={3} precision={3} />   // 1× · 0.1× · 0.01×
<Slider label="Anisotropy" precision={2} />                           // 1× · 0.1×`}
      >
        <div className="sc-grid">
          <Slider label="IOR" defaultValue={1.45} min={1} max={2.5} decimals={3} />
          <Slider label="Anisotropy" defaultValue={0.35} precision={2} />
          <Slider label="Rotation" defaultValue={128} min={0} max={360} format="angle" decimals={1} />
          <Slider label="Focus Dist" defaultValue={2.4} min={0.1} max={100} mapping="log" unit="m" />
        </div>
      </Spec>

      <Spec id="slider-paired" text="Label outside the capsule — a layout variation only. Material, interaction and precision are unchanged." code={`<Slider layout="paired" labelWidth={110} label="Clearcoat" defaultValue={0.8} />`}>
        <div className="sc-grid sc-grid--wide">
          <Slider layout="paired" label="Clearcoat" defaultValue={0.8} />
          <Slider layout="paired" label="Sheen" defaultValue={0.25} />
          <Slider layout="paired" label="Subsurface" defaultValue={0.1} />
          <Slider layout="paired" variant="gradient" gradient="saturate" label="Saturate" defaultValue={0.65} />
        </div>
      </Spec>

      <Spec
        id="slider-stepped"
        text="steps quantizes the value, not only the drawing. The stepped variant draws cells; on the material variant, hairline ticks appear up to 16 steps and nothing beyond."
        code={`
<Slider variant="stepped" steps={6} min={1} max={6} decimals={0} label="Samples" />
<Slider steps={9} min={0} max={8} decimals={0} label="Bounces" />`}
      >
        <div className="sc-grid">
          <Slider variant="stepped" steps={6} label="Samples" min={1} max={6} defaultValue={4} decimals={0} />
          <Slider variant="stepped" steps={4} label="Quality" min={1} max={4} defaultValue={3} decimals={0} />
          <Slider steps={9} label="Bounces" min={0} max={8} defaultValue={3} decimals={0} />
          <Slider steps={5} label="LOD Bias" min={-2} max={2} defaultValue={0} decimals={0} />
        </div>
      </Spec>

      <Spec
        id="slider-detents"
        text="Detents are semantic magnets: 6 px, 22 px with Ctrl; the seam lights on capture and Ctrl + arrow jumps between them. log · exp · power mappings change geometry only — the value stays exact. Formats: number · percent · db · angle · hz · time, or your own formatter."
        code={`
<Slider label="Mix" format="percent" decimals={0} detents={[0.5]} />
<Slider label="Gain" format="db" min={-60} max={12} detents={[0]} />
<Slider label="Cutoff" format="hz" mapping="log" min={20} max={20000} detents={[1000]} />
<Slider label="Frames" formatter={(v) => ({ text: Math.round(v * 24).toString(), unit: 'fr' })} />`}
      >
        <div className="sc-grid">
          <Slider label="Mix" format="percent" decimals={0} defaultValue={0.47} detents={[0.5]} />
          <Slider label="Opacity" format="percent" decimals={1} defaultValue={0.75} detents={[0.25, 0.5, 0.75]} />
          <Slider label="Gain" format="db" decimals={1} min={-60} max={12} defaultValue={-4.5} detents={[0]} />
          <Slider label="Cutoff" format="hz" mapping="log" decimals={0} min={20} max={20000} defaultValue={440} detents={[1000]} />
          <Slider label="Duration" format="time" decimals={2} min={0} max={10} mapping="exp" defaultValue={2.5} />
          <Slider label="Frames" defaultValue={0.5} formatter={(v) => ({ text: Math.round(v * 24).toString(), unit: 'fr' })} />
        </div>
      </Spec>

      <Spec
        id="slider-bipolar"
        text="For signed values the neutral point is semantic: the fill grows from the origin in either direction. status tints the seam and indicator quietly — bound, automated, warn, fault — without turning the slider into another widget."
        code={`
<Slider label="Pan" bipolar min={-1} max={1} detents={[0]} />
<Slider label="Offset" origin={0.5} />
<Slider label="Drive" status="bound" />   // bound · automated · warn · fault`}
      >
        <div className="sc-grid">
          <Slider label="Pan" bipolar min={-1} max={1} defaultValue={-0.35} detents={[0]} />
          <Slider label="Bias" bipolar min={-100} max={100} decimals={0} defaultValue={42} />
          <Slider label="Bound" status="bound" defaultValue={0.62} />
          <Slider label="Automated" status="automated" defaultValue={0.3} />
          <Slider label="Warn" status="warn" defaultValue={0.88} />
          <Slider label="Fault" status="fault" defaultValue={0.12} />
        </div>
      </Spec>

      <Spec
        id="slider-range"
        text="The same capsule holding an interval. Seam press grabs that end; press inside moves the whole interval; press outside moves the nearest end; the readout scrubs the active end. Each end is its own focusable slider."
        code={`
const [band, setBand] = useState<RangeValue>([0.2, 0.7]);
<RangeSlider label="Band" value={band} onChange={setBand} minSpan={0.05} />
<RangeSlider label="Freq" format="hz" mapping="log" min={20} max={20000} defaultValue={[200, 4000]} />`}
      >
        <div className="sc-grid sc-grid--wide">
          <RangeSlider label="Band" defaultValue={[0.2, 0.7]} minSpan={0.05} />
          <RangeSlider label="Freq" min={20} max={20000} mapping="log" format="hz" decimals={0} defaultValue={[200, 4000]} />
          <RangeSlider label="Frames" min={0} max={240} decimals={0} steps={241} defaultValue={[24, 180]} />
          <RangeSlider layout="paired" label="Depth" min={0} max={100} decimals={0} unit="m" defaultValue={[12, 55]} toggleable />
        </div>
      </Spec>

      <Spec
        id="slider-gradient"
        text="The track carries the parameter's own scale. While dragging, a swatch reads out the sampled colour below the seam. Label and value ink follow the luminance under them. Pass your own stops for any scale."
        code={`
<Slider variant="gradient" gradient="temperature" min={0} max={100} label="Temperature" />
<Slider variant="gradient" gradient={{ stops: [[0, '#1B1F3B'], [1, '#FFB000']], describe: (t) => t > .5 ? 'Day' : 'Night' }} />`}
      >
        <div className="sc-grid">
          {(Object.keys(GRADIENTS) as Array<keyof typeof GRADIENTS>).map((g) => (
            <Slider
              key={g}
              variant="gradient"
              gradient={g}
              label={g}
              min={g === 'exposure' ? -4 : 0}
              max={g === 'hue' ? 360 : g === 'exposure' ? 4 : 100}
              format={g === 'hue' ? 'angle' : 'number'}
              unit={g === 'exposure' ? 'EV' : undefined}
              decimals={g === 'hue' ? 0 : 1}
              defaultValue={g === 'hue' ? 165 : g === 'exposure' ? 0.4 : 65}
              detents={g === 'exposure' ? [0] : undefined}
            />
          ))}
          <Slider variant="gradient" gradient={{ stops: [[0, '#1B1F3B'], [0.55, '#E86F51'], [1, '#FFD27A']], describe: (t) => (t > 0.5 ? 'Day' : 'Night') }} label="Sun" defaultValue={0.7} />
        </div>
      </Spec>

      <Spec
        id="slider-ruler"
        text="The scale moves beneath a fixed index — camera focus ring, not progress bar. Drag right and the scale follows the hand. Precision from the readout zooms the engraving. Marked positions hold with a light magnet; snapStep settles on release."
        code={`
<Slider variant="ruler" label="Focal" min={12} max={200} span={40} unit="mm" decimals={0} marks={[24, 35, 50, 85, 135]} />
<Slider variant="ruler" label="Focus" min={0.3} max={20} span={1.6} unit="m" decimals={1} snapStep={0.1} />`}
      >
        <div className="sc-grid sc-grid--wide">
          <Slider variant="ruler" label="Focal" min={12} max={200} span={40} unit="mm" decimals={0} defaultValue={50} marks={[24, 35, 50, 85, 135]} />
          <Slider variant="ruler" label="Focus" min={0.3} max={20} span={1.6} unit="m" decimals={1} snapStep={0.1} defaultValue={2.4} />
          <Slider variant="ruler" label="Tempo" min={40} max={240} span={30} unit="BPM" decimals={1} defaultValue={120} marks={[120]} />
          <Slider variant="ruler" label="Yaw" min={-180} max={180} span={90} format="angle" decimals={1} defaultValue={35} marks={[-90, 0, 90]} />
        </div>
      </Spec>

      <Spec
        id="slider-visualized"
        text="Data on the surface only when it describes the parameter: the response the value samples, the signal the playhead scrubs. The drawing is the interaction surface."
        code={`
<Slider variant="curve" curve="sigmoid" label="Response" />     // sigmoid · smooth · gamma · (x) => y
<Slider variant="wave" samples={amplitudes} format="time" max={12} label="Scrub" />`}
      >
        <div className="sc-grid sc-grid--wide">
          <Slider variant="curve" curve="sigmoid" label="Response" defaultValue={0.62} />
          <Slider variant="curve" curve="gamma" label="Gamma" defaultValue={0.3} />
          <Slider variant="wave" label="Scrub" format="time" min={0} max={12} defaultValue={4.2} samples={wave} />
          <Slider variant="curve" curve={(x) => 0.5 + 0.45 * Math.sin(x * Math.PI * 3) * (1 - x)} label="Custom" defaultValue={0.4} />
        </div>
      </Spec>

      <Spec
        id="slider-enable"
        text="Double-click switches the parameter off; the stored value is kept and shown, the material drains. Double-click again to restore it. An off slider still takes focus but ignores drag, wheel and keys."
        code={`
<Slider label="Bloom" toggleable defaultValue={0.64} />
<Slider label="Vignette" toggleable defaultEnabled={false} />
<Slider label="Grain" enabled={grainOn} onEnabledChange={setGrainOn} toggleable />`}
      >
        <div className="sc-grid">
          <Slider label="Bloom" toggleable defaultValue={0.64} />
          <Slider label="Vignette" toggleable defaultEnabled={false} defaultValue={0.4} />
          <Slider variant="gradient" gradient="temperature" label="White Bal" toggleable defaultEnabled={false} min={0} max={100} defaultValue={58} />
          <Slider variant="ruler" label="Focal" toggleable defaultEnabled={false} min={12} max={200} span={40} unit="mm" decimals={0} defaultValue={85} />
          <Slider variant="stepped" steps={5} label="Taps" toggleable min={1} max={5} decimals={0} defaultValue={3} />
          <Slider variant="curve" label="Curve" toggleable defaultEnabled={false} defaultValue={0.5} />
        </div>
      </Spec>

      <Spec
        id="knob-pad"
        text="When a capsule is the wrong shape. A Knob turns with a vertical drag or the wheel when focused, and double-click returns it to its default. XYPad sets two values at once: drag the puck, or use the arrow keys. Both settle with the family's spring."
        code={`<Knob label="Angle" value={a} onChange={setA} defaultValue={0.5} />
<XYPad label="Pan / tilt" value={xy} onChange={setXy} height={150} />`}
      >
        <KnobPad />
      </Spec>

      <Spec
        id="slider-events"
        text="Every control is controlled or uncontrolled. onChange fires live, onCommit once on release (and per key press). Watch the log."
        code={`
<Slider value={v} onChange={setV} onCommit={persist}
        enabled={on} onEnabledChange={setOn} toggleable />`}
      >
        <EventLog />
      </Spec>
    </Chapter>
  );
}
