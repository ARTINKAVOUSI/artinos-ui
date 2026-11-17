'use client';
import { useRef, useSyncExternalStore } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { Button } from '../actions/Button';
import { cx } from '../core/utils';
import { KEY_SNAP } from './store';
import type { InspectItem, InspectorStore } from './store';

/* ARTINOS InspectorTimeline — the Inspector's keyframes laid out in time. One lane per animated
   value under a ruler of seconds: drag anywhere to move the playhead, click a keyframe to go to
   it, double-click to remove it, Play to run the loop. It reads the same store as the Inspector,
   so a diamond pressed in a row appears here, and a value changed at the playhead lands as a key. */

export interface InspectorTimelineProps {
  items: readonly InspectItem[];
  store: InspectorStore;
  /** The name column. Inherits the scope's label column, so it lines up with the Inspector. */
  labelWidth?: number | string;
  className?: string;
  style?: CSSProperties;
}

const PLAY = (
  <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor" aria-hidden>
    <path d="M3 1.8v8.4L10 6z" />
  </svg>
);
const PAUSE = (
  <svg viewBox="0 0 12 12" width="12" height="12" fill="currentColor" aria-hidden>
    <path d="M2.6 2h2.4v8H2.6zM7 2h2.4v8H7z" />
  </svg>
);

export function InspectorTimeline({ items, store, labelWidth, className, style }: InspectorTimelineProps) {
  const st = useSyncExternalStore(store.subscribe, store.state, store.state);
  const drag = useRef<number | null>(null);
  const lanes = items.filter((p) => st.tracks[p.key]?.length);
  const at = (t: number) => `${(t / st.duration) * 100}%`;
  const seconds = Array.from({ length: Math.floor(st.duration) + 1 }, (_, i) => i);

  const seek = (e: ReactPointerEvent<HTMLDivElement>) => {
    const lane = e.currentTarget.querySelector('.ar-timeline__lane');
    if (!lane) return;
    const r = lane.getBoundingClientRect();
    const t = ((e.clientX - r.left) / r.width) * st.duration;
    // the playhead settles on a keyframe it comes close to, so a key is easy to land on
    const near = lanes.flatMap((p) => st.tracks[p.key]).find((k) => Math.abs(k.t - t) < st.duration * 0.012);
    store.setTime(near ? near.t : t);
  };
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('.ar-timeline__name')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = e.pointerId;
    seek(e);
  };

  return (
    <div className={cx('ar-timeline', className)} data-playing={st.playing || undefined} style={{ ...(labelWidth === undefined ? null : { '--ar-field-label-w': typeof labelWidth === 'number' ? `${labelWidth}px` : labelWidth }), ...style } as CSSProperties}>
      <div className="ar-timeline__bar">
        <Button size="sm" variant="ghost" icon={st.playing ? PAUSE : PLAY} aria-pressed={st.playing} onClick={() => store.play(!st.playing)}>
          {st.playing ? 'Pause' : 'Play'}
        </Button>
        <span className="ar-timeline__time">
          {st.time.toFixed(2)}
          <em>s</em>
        </span>
        <span className="ar-timeline__spacer" />
        <span className="ar-timeline__note">{lanes.length ? `${lanes.length} animated · ${st.duration} s loop` : 'Press a row’s diamond to key it at the playhead'}</span>
      </div>
      <div
        className="ar-timeline__grid"
        onPointerDown={onPointerDown}
        onPointerMove={(e) => drag.current === e.pointerId && seek(e)}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <div className="ar-timeline__track ar-timeline__ruler">
          <span className="ar-timeline__name" />
          <div className="ar-timeline__lane">
            {seconds.map((s) => (
              <span key={s} className="ar-timeline__tick" style={{ left: at(s) }}>
                {s}
              </span>
            ))}
          </div>
        </div>
        {lanes.map((p) => (
          <div key={p.key} className="ar-timeline__track">
            <span className="ar-timeline__name" title={p.label}>
              {p.label}
            </span>
            <div className="ar-timeline__lane">
              {st.tracks[p.key].map((k) => (
                <button
                  key={k.t}
                  type="button"
                  className="ar-timeline__key"
                  style={{ left: at(k.t) }}
                  aria-label={`${p.label} keyframe at ${k.t.toFixed(2)} s`}
                  aria-current={Math.abs(k.t - st.time) <= KEY_SNAP || undefined}
                  title="Click to go here · double-click to remove"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => store.setTime(k.t)}
                  onDoubleClick={() => {
                    store.setTime(k.t);
                    store.toggleKey(p.key);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="ar-timeline__track ar-timeline__over" aria-hidden>
          <span className="ar-timeline__name" />
          <div className="ar-timeline__lane">
            <i className="ar-timeline__head" style={{ left: at(st.time) }} />
          </div>
        </div>
      </div>
    </div>
  );
}
