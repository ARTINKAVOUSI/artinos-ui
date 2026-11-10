/* 05 · Display — the rolling readout, meters and sparklines. */
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Button, Meter, Progress, RollingValue, Segmented, Sparkline, Spectrum, Stat } from '../../../src';
import type { Zone } from '../../../src';
import { Chapter, Spec } from '../shared';
import { useLiveSeries } from './demos';

const AUDIO_ZONES: Zone[] = [
  { from: 0.7, tone: 'warm' },
  { from: 0.9, tone: 'hot' },
];

/** A made-up song: kick, hat and a wandering pad, read as level and as 256 frequency bins. */
function songAt(t: number, bins: Float32Array) {
  const beat = (t * 2) % 1;
  const kick = Math.exp(-beat * 7);
  const off = (t * 2 + 0.5) % 1;
  const hat = Math.exp(-off * 16);
  for (let i = 0; i < bins.length; i++) {
    // on the log scale the bars read, so each part of the song sits where it looks like it should
    const f = Math.log(1 + i) / Math.log(bins.length);
    const pad = 0.42 * Math.exp(-Math.pow((f - 0.55 - 0.14 * Math.sin(t * 0.7)) * 6, 2)) * (0.8 + 0.2 * Math.sin(t * 5 + i * 0.4));
    const low = 0.98 * kick * Math.exp(-Math.pow(f * 3.2, 2));
    const high = 0.6 * hat * Math.exp(-Math.pow((f - 0.88) * 8, 2));
    const grit = 0.05 * Math.random();
    bins[i] = Math.min(1, pad + low + high + grit);
  }
  return { left: Math.min(1, 0.24 + 0.72 * kick + 0.22 * hat * Math.random()), right: Math.min(1, 0.22 + 0.62 * kick + 0.34 * hat * Math.random()) };
}

/** The song, read fresh each frame by whichever instrument asks first. */
function useSong() {
  const song = useRef({ bins: new Float32Array(256), left: 0, right: 0, at: -1 });
  return () => {
    const s = song.current;
    const now = performance.now();
    if (now !== s.at) {
      s.at = now;
      Object.assign(s, songAt(now / 1000, s.bins));
    }
    return s;
  };
}

/** One wandering reading, delivered `hz` times a second, with a hard hit now and then. */
function useFeed(hz: number, host: RefObject<HTMLElement | null>) {
  const [v, setV] = useState(0.5);
  useEffect(() => {
    const start = performance.now();
    let seen = true;
    const io = new IntersectionObserver(([e]) => void (seen = e.isIntersecting));
    if (host.current) io.observe(host.current);
    const id = setInterval(() => {
      if (!seen) return;
      const t = (performance.now() - start) / 1000;
      const hit = Math.exp(-((t * 0.6) % 1) * 9);
      setV(Math.min(1, Math.max(0, 0.34 + 0.2 * Math.sin(t * 1.9) + 0.09 * Math.sin(t * 7.3) + 0.42 * hit)));
    }, 1000 / hz);
    return () => {
      clearInterval(id);
      io.disconnect();
    };
  }, [hz, host]);
  return v;
}

const RATES = ['2', '5', '15', '30', '60'] as const;

function RealtimeLab() {
  const [rate, setRate] = useState<(typeof RATES)[number]>('30');
  const host = useRef<HTMLDivElement>(null);
  const v = useFeed(+rate, host);
  return (
    <div ref={host} className="sc-stack" style={{ display: 'grid', gap: 14, width: '100%' }}>
      <div style={{ maxWidth: 340 }}>
        <Segmented label="Readings per second" options={RATES.map((r) => ({ value: r, label: `${r} Hz` }))} value={rate} onChange={setRate} />
      </div>
      <div style={{ display: 'grid', gap: 2 }}>
        <Meter className="sc-lab-auto" label="auto" value={v} marker={v} format={(x) => x.toFixed(3)} size="lg" />
        <Meter className="sc-lab-instant" label="instant" value={v} marker={v} motion="instant" format={(x) => x.toFixed(3)} size="lg" />
        <Meter className="sc-lab-audio" label="audio" value={v} marker={v} motion="audio" peak format={(x) => x.toFixed(3)} size="lg" />
        <Meter className="sc-lab-smooth" label="smooth" value={v} marker={v} motion="smooth" format={(x) => x.toFixed(3)} size="lg" />
        <Meter label="segments" value={v} marker={v} segments={32} zones={AUDIO_ZONES} peak format={(x) => x.toFixed(3)} />
      </div>
      <div className="sc-stats">
        <Stat label="Live figure" value={v * 100} decimals={1} unit="%" zones={[{ from: 60, tone: 'warm' }, { from: 85, tone: 'hot' }]} level={v} caption={`Fed at ${rate} Hz`} />
        <Stat label="Whole number" value={Math.round(v * 480)} unit="W" caption="Slow columns still roll" />
      </div>
    </div>
  );
}

function SpectrumDemo() {
  const song = useSong();
  return (
    <div className="sc-grid">
      <div className="sc-figure">
        <Spectrum label="Frequency bars" source={() => song().bins} bars={48} peak height={96} zones={AUDIO_ZONES} />
        <span className="sc-figure__label">48 bars with peak caps</span>
      </div>
      <div className="sc-figure">
        <Spectrum label="LED frequency bars" source={() => song().bins} bars={24} segments={14} height={96} zones={AUDIO_ZONES} peak />
        <span className="sc-figure__label">LED cells</span>
      </div>
      <div className="sc-figure">
        <Spectrum label="Mirrored bars" source={() => song().bins} bars={64} mirror height={96} tone="warm" />
        <span className="sc-figure__label">Mirrored from a centre line</span>
      </div>
      <div className="sc-figure">
        <div style={{ display: 'flex', gap: 14, height: 148 }}>
          <Meter label="L" orientation="vertical" source={() => song().left} motion="audio" segments={22} size="xl" zones={AUDIO_ZONES} peak valueText={null} />
          <Meter label="R" orientation="vertical" source={() => song().right} motion="audio" segments={22} size="xl" zones={AUDIO_ZONES} peak valueText={null} />
          <Meter label="L" orientation="vertical" source={() => song().left} motion="audio" size="lg" zones={AUDIO_ZONES} peak valueText={null} />
          <Meter label="R" orientation="vertical" source={() => song().right} motion="audio" size="lg" zones={AUDIO_ZONES} peak valueText={null} />
        </div>
        <span className="sc-figure__label">Stereo level, read every frame</span>
      </div>
    </div>
  );
}

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
      <Stat label="Particles" value="1.24" unit="M" delta={12.5} deltaText="+12.5%" caption="Of 2 M budget" tone="neutral" level={0.62} />
      <Stat label="Render cost" prefix="$" value={0.42 + last * 2} decimals={2} zones={[{ from: 1.6, tone: 'warm' }, { from: 2.1, tone: 'hot' }]} level={last} caption="Turns warm past 1.60" />
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
      <Progress label="Streaming preview" value={t * 0.8} buffer={Math.min(1, t * 0.8 + 0.18)} size="lg" caption="With a buffer ahead of it" />
      <Progress label="Exporting frames" value={t} segments={16} tone="warm" caption="In steps, lit cell by cell" />
      <Progress variant="ring" label="Denoising" value={t} status={t >= 1 ? 'done' : 'running'} caption="Ring" />
      <Progress variant="ring" size="lg" value={t} tone="warm" />
      <Progress variant="ring" size="sm" label="Waiting for the GPU" />
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
      <Meter label="Load" value={last} zones={[{ from: 0.6, tone: 'warm' }, { from: 0.85, tone: 'hot' }]} zonePaint="level" valueText={`${Math.round(last * 100)}%`} size="lg" />
      <Meter label="Output" value={last} segments={28} zones={AUDIO_ZONES} peak valueText={`${Math.round(last * 100)}%`} />
      <Meter label="Pan" value={last * 2 - 1} min={-1} max={1} origin={0} valueText={(last * 2 - 1).toFixed(2)} size="lg" />
      <Meter label="Budget" value={last} marker={0.7} ticks={10} valueText={`${Math.round(last * 100)}%`} tone="neutral" />
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
        id="realtime"
        text="Every instrument fits its motion to what it is fed. The white tick is the true reading. Change the rate: at 2 Hz auto glides and lands before the next reading comes; from 30 Hz it stops moving between readings and sits exactly on the tick, with the fast digits changing instead of rolling. smooth is the fluid glide, for comparison. Give motion a use case when you know it: audio, instant, task, smooth, or your own attack and release."
        code={`<Meter label="CPU" value={cpu} />                    // auto: reads the feed
<Meter label="Scrub" value={t} motion="instant" />  // exact, no glide
<Meter label="Out" source={() => level} motion="audio" peak />   // read every frame, no React
<RollingValue text={fps.toFixed(0)} motion="auto" />
<Meter label="Custom" value={v} motion={{ attack: 0, release: 240, refresh: 80 }} />`}
      >
        <RealtimeLab />
      </Spec>

      <Spec
        id="rolling"
        text="The readout every number in the family uses. Only the digits that change roll, in the direction of the change; a carry (59.99 → 60.00) resolves right to left as one motion. The roll is timed to the feed so a digit lands before the next reading: short of time it slides in from the next digit, past the point where it could land it simply changes, and in a stream each column keeps its own pace."
        code={`<RollingValue text={gain.toFixed(2)} unit="dB" />
<RollingText text={status} />   // rolls when the text holds a number`}
      >
        <RollingDemo />
      </Spec>

      <Spec
        id="stats"
        text="One figure that matters: its label in the sans, the number large, with tabular digits, and its unit, how it moved since before (an arrow in the signal colour when that is good, the fault colour when not; better says which way is good), and its recent trend with an optional budget line. Framed, it is a quiet tile; framed={false} sets it bare inside your own card."
        code={`<Stat label="Frame time" value={ms.toFixed(1)} decimals={1} unit="ms"
      delta={-1.8} deltaText="−1.8 ms" better="down"
      trend={frameTimes} threshold={16.7} caption="Budget 16.7 ms" />`}
      >
        <Stats />
      </Spec>

      <Spec
        id="meters"
        text="A level in a well with a signal fill and a rolling readout. peak holds the highest reading for a moment and lets it fall. segments lights separate cells; zones paint ranges along the track or, with zonePaint level, turn the whole fill; origin fills out from a centre; marker and ticks give it a scale; size and orientation set its build."
        code={`<Meter label="CPU" value={cpu} valueText="42%" peak />
<Meter label="Output" value={v} segments={28} peak
       zones={[{ from: 0.7, tone: 'warm' }, { from: 0.9, tone: 'hot' }]} />
<Meter label="Pan" value={pan} min={-1} max={1} origin={0} size="lg" />
<Meter label="L" orientation="vertical" source={() => left} motion="audio" />`}
      >
        <Meters />
      </Spec>

      <Spec
        id="spectrum"
        text="A bank of level bars for a frequency analysis. It reads your analyser every frame without React and shows the latest analysis in that same frame: bars rise with the sound and fall on a release, and never drift between readings. More bins than bars are gathered on a log scale, each bar showing its loudest bin. This demo plays a made-up signal, so it needs no microphone."
        code={`const bins = new Uint8Array(analyser.frequencyBinCount);
<Spectrum label="Spectrum" max={255} bars={48} peak
          source={() => (analyser.getByteFrequencyData(bins), bins)} />`}
      >
        <SpectrumDemo />
      </Spec>

      <Spec
        id="progress"
        text="A task under way: its label and percentage over a well or in a ring, the fill pacing itself to how often the work reports, so steps read as one steady advance and a restart is quick. buffer shows what is ready ahead of it, segments lights cells for countable work. Without a value it runs indeterminate. When it ends it settles in the signal colour; an error keeps the fill where the work stopped, turns it the fault colour, and its caption says why and what to do."
        code={`<Progress label="Baking lightmaps" value={done / total} caption="3 of 12 probes" />
<Progress label="Streaming" value={played} buffer={loaded} size="lg" />
<Progress label="Exporting" value={t} segments={16} />
<Progress variant="ring" label="Denoising" value={t} />
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
