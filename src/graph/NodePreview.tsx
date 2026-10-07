'use client';
import { memo, useEffect, useState } from 'react';
import { Sparkline } from '../display/Sparkline';

export const PREVIEW_W = 168;
export const PREVIEW_H = 44;

/** A readback of a compiled node, produced by the host's renderer. */
export interface PreviewFrame {
  width: number;
  height: number;
  /** Pixels per row in the buffer. GPU readbacks pad rows to an alignment. */
  stride?: number;
  pixels: Uint8Array;
  updatedAt: number;
}

const HISTORY = 64;

/** SVG keeps previews renderer-neutral: no second canvas is ever created. */
export const ValuePreview = memo(function ValuePreview({ value }: { value: number }) {
  // Each preview owns its recent samples, so they go when it unmounts. A sample
  // is taken in an effect and only when the value changed — a re-render (or
  // StrictMode's double render) never records twice — and a new array means a
  // redraw.
  const [samples, setSamples] = useState<readonly number[]>(() => [value]);
  useEffect(() => {
    setSamples((list) => (list[list.length - 1] === value ? list : [...list, value].slice(-HISTORY)));
  }, [value]);
  // A value that has not changed yet still draws, as a flat line.
  const history = samples.length > 1 ? samples : [samples[0], samples[0]];
  let min = Math.min(...history);
  let max = Math.max(...history);
  if (max - min < 1e-6) {
    min -= 0.5;
    max += 0.5;
  }
  // the same Sparkline as everywhere else in the family, in a well
  return (
    <div className="ar-graph__preview-canvas">
      <Sparkline label="Recent values" values={history} min={min} max={max} width={PREVIEW_W} height={PREVIEW_H - 8} />
    </div>
  );
});

/** Downsampled GPU readback, drawn as cells — the panel never owns a renderer. */
export const RenderPreview = memo(function RenderPreview({ frame }: { frame?: PreviewFrame }) {
  if (!frame) return <div className="ar-graph__preview-pending">compiling…</div>;
  const columns = Math.min(32, frame.width);
  const rows = Math.min(16, frame.height);
  const cellW = PREVIEW_W / columns;
  const cellH = PREVIEW_H / rows;
  const cells = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const sx = Math.floor((x / columns) * frame.width);
      const sy = Math.floor(((rows - 1 - y) / rows) * frame.height);
      const index = (sy * (frame.stride ?? frame.width) + sx) * 4;
      const r = frame.pixels[index] ?? 0;
      const g = frame.pixels[index + 1] ?? 0;
      const b = frame.pixels[index + 2] ?? 0;
      cells.push(<rect key={`${x}:${y}`} x={x * cellW} y={y * cellH} width={cellW + 0.2} height={cellH + 0.2} fill={`rgb(${r},${g},${b})`} />);
    }
  }
  return (
    <svg className="ar-graph__preview-canvas is-render" viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`} preserveAspectRatio="none" shapeRendering="crispEdges">
      {cells}
    </svg>
  );
});
