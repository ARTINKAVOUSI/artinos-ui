/* 05 · Display — the rolling readout, meters and sparklines. */
import { useEffect, useState } from 'react';
import { Button, Meter, Progress, RollingValue, Sparkline, Stat } from '../../../src';
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

function Stats() {
  const series = useLiveSeries();
  const last = series[series.length - 1];
  const ms = 8 + last * 12;
  return (
    <div className="sc-stats">
      <Stat label="Frame time" value={ms.toFixed(1)} decimals={1} unit="ms" delta={-1.8} deltaText="−1.8 ms" better="down" trend={series.map((v) => 8 + v * 12)} threshold={16.7} caption="Budget 16.7 ms" />
      <Stat label="Draw calls" value={Math.round(820 + last * 140)} delta={64} deltaText="+64" better="down" trend={series.slice(10).map((v) => 820 + v * 140)} tone="warm" caption="Last 60 s" />
      <Stat label="Particles" value="1.24" unit="M" delta={12.5} deltaText="+12.5%" caption="Of 2 M budget" tone="neutral" />
    </div>
  );
}

function Tasks() {
  const [t, setT] = useState(0.18);
  useEffect(() => {
    const id = setInterval(() => setT((x) => (x >= 1 ? 0 : Math.min(1, +(x + 0.04).toFixed(2)))), 420);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="sc-grid">
      <Progress label="Baking lightmaps" value={t} status={t >= 1 ? 'done' : 'running'} caption={t >= 1 ? 'Done' : Math.round(t * 12) + ' of 12 probes'} />
      <Progress label="Compiling shaders" caption="Waiting for the GPU" />
      <Progress label="Uploading scene.artinos" value={0.64} status="error" valueText="Failed" caption="The connection dropped at 64%. Retry when you are online." />
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <Button size="sm" onClick={() => setT(0)}>
          Restart bake
        </Button>
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
        id="stats"
        text="One figure that matters: its label in the sans, the number large in the mono with its unit, how it moved since before (an arrow in the signal colour when that is good, the fault colour when not; better says which way is good), and its recent trend with an optional budget line. Framed, it is a quiet tile; framed={false} sets it bare inside your own card."
        code={`<Stat label="Frame time" value={ms.toFixed(1)} decimals={1} unit="ms"
      delta={-1.8} deltaText="−1.8 ms" better="down"
      trend={frameTimes} threshold={16.7} caption="Budget 16.7 ms" />`}
      >
        <Stats />
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
        id="progress"
        text="A task under way: its label and percentage over a slim well, the fill gliding as work lands. Without a value it runs indeterminate. When it ends it settles in the signal colour; an error keeps the fill where the work stopped, turns it the fault colour, and its caption says why and what to do."
        code={`<Progress label="Baking lightmaps" value={done / total} caption="3 of 12 probes" />
<Progress label="Compiling shaders" />   // indeterminate
<Progress label="Uploading" value={0.64} status="error" valueText="Failed" caption="The connection dropped. Retry when online." />`}
      >
        <Tasks />
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
