'use client';
import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { READOUT_MS } from '../core/reactive';
import { windowOf } from '../core/realm';
import type { ReadSignal } from '../core/signal';
import { onFrame } from '../core/ticker';

/** How often a live figure with no clock of its own is read, ms. */
const LIVE_MS = READOUT_MS * 2;

/**
 * Follow a live value without rendering: `read` is called on each change of `clock`, or every 250 ms
 * without one, and `apply` writes the result straight to the page. Every live display part uses this.
 */
export function useLiveReading<T>(read: (() => T) | undefined, clock: ReadSignal<unknown> | undefined, apply: (value: T) => void, host: RefObject<Element | null>) {
  const latest = useRef({ read, apply });
  latest.current = { read, apply };
  const live = !!read;
  useEffect(() => {
    if (!live) return;
    const tick = () => {
      const { read: now, apply: write } = latest.current;
      if (now) write(now());
    };
    tick();
    if (clock) return clock.subscribe(tick);
    let last = 0;
    return onFrame(windowOf(host.current), (now) => {
      if (now - last < LIVE_MS) return;
      last = now;
      tick();
    });
  }, [live, clock, host]);
}
