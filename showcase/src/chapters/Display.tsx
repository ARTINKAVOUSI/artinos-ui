/* 05 · Display — the rolling readout, meters and sparklines. */
import { useEffect, useState } from 'react';
import { Meter, RollingValue, Sparkline } from '../../../src';
import { Chapter, Spec } from '../shared';
import { useLiveSeries } from './demos';

function RollingDemo() {
  const [v, setV] = useState(59.99);
  const [count, setCount] = useState(128);
  useEffect(() => {
    const id = setInterval(() => setV((x) => (x >= 60.4 ? 59.87 : +(x + 0.01).toFixed(2))), 380);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="sc-row" style={{ alignItems: 'flex-end' }}>
      <div className="sc-figure">
        <span className="sc-figure__value">
          <RollingValue text={v.toFixed(2)} unit="dB" base={2} />
        </span>
        <span className="sc-figure__label">Carries resolve right to left</span>
      </div>
      <div className="sc-figure">
        <button type="button" className="sc-figure__value sc-figure__value--button" onClick={() => setCount((c) => c + 7)} onContextMenu={(e) => (e.preventDefault(), setCount((c) => Math.max(0, c - 7)))}>
          <RollingValue text={String(count)} base={0} />
        </button>
        <span className="sc-figure__label">Click to add · right-click to take</span>
      </div>
    </div>
  );
}

function Meters() {
  const series = useLiveSeries();
  const last = series[series.length - 1];
  return (
    <div className="sc-grid">
      <Meter label="CPU" value={last} valueText={`${Math.round(last * 100)}%`} peak />
      <Meter label="Memory" value={0.38} tone="warm" />
      <Meter label="Disk" value={series[12]} tone="neutral" valueText={`${(series[12] * 512).toFixed(0)} GB`} />
      <Meter label="Fill" value={0.82} valueText={null} />
    </div>
  );
}

function Sparklines() {
  const series = useLiveSeries();
  return (
    <div className="sc-grid">
      <div className="sc-figure">
        <Sparkline label="Frame time" values={series} fill threshold={0.7} height={40} width={300} />
        <span className="sc-figure__label">Frame time · budget line</span>
      </div>
      <div className="sc-figure">
        <Sparkline label="Temperature" values={series.map((v) => 1 - v)} tone="warm" height={40} width={300} />
        <span className="sc-figure__label">Warm tone</span>
      </div>
      <div className="sc-figure">
        <Sparkline label="Queue" values={series.slice(0, 24)} tone="neutral" fill={false} height={40} width={300} />
        <span className="sc-figure__label">Neutral · no fill</span>
      </div>
    </div>
  );
}

export function DisplayChapter() {
  return (
    <Chapter id="display">
      <Spec
        id="rolling"
        text="The readout every number in the family uses. Only the digits that change roll, in the direction of the change; a carry (59.99 → 60.00) resolves right to left as one motion. A value that streams rolls short, so it stays legible."
        code={`<RollingValue text={gain.toFixed(2)} unit="dB" />
<RollingText text={status} />   // rolls when the text holds a number`}
      >
        <RollingDemo />
      </Spec>

      <Spec
        id="meters"
        text="A level in a thin well with a signal fill and a rolling readout. peak holds the highest value for a moment and lets it fall. tone switches the fill between live, warm and neutral, cross-fading."
        code={`<Meter label="CPU" value={cpu} valueText="42%" peak />
<Meter label="Memory" value={0.38} tone="warm" />`}
      >
        <Meters />
      </Spec>

      <Spec
        id="sparklines"
        text="A trend in the signal colour that draws itself in, with a soft fill, a glowing dot on the latest sample and an optional dashed threshold (a frame budget, say). It stretches to any width."
        code={`<Sparkline label="Frame time" values={samples} fill threshold={16.7} />`}
      >
        <Sparklines />
      </Spec>
    </Chapter>
  );
}
