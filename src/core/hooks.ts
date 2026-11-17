import { useEffect, useId, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Controlled/uncontrolled value in one hook: pass `value` to control it, or leave
 * it undefined and the hook keeps its own state seeded from `defaultValue`.
 */
export function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = useState<T>(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;
  const set = (v: T) => {
    if (!controlled) setInner(v);
    onChange?.(v);
  };
  return [current, set] as const;
}

/** SSR-stable id that is also safe inside url(#…) references. */
export function useSafeId(prefix = 'ar') {
  return prefix + useId().replace(/[^a-zA-Z0-9_-]/g, '');
}

/** Rows whose name sits above or in a tile keep no column; they are not measured. */
const OUTSIDE_COLUMN = '[data-layout="stacked"], .ar-prop[data-density="default"], .ar-prop[data-density="multiline"], [data-columns]';

/**
 * The label column fits its panel: as wide as the longest name in it, never wider than the density's
 * column (--ar-label-col scaled by --ar-k). Every row of the panel still shares one column; a panel
 * of short names just stops leaving air between its names and its controls. The root carries
 * data-ar-label-fit, so a panel inside it fits its own. Re-measured when the panel resizes, its rows
 * change, or the fonts arrive.
 */
export function useLabelColumn(ref: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    const root = ref.current;
    if (!enabled || !root || typeof ResizeObserver === 'undefined') return;
    let frame = 0;
    const range = document.createRange();
    const measure = () => {
      frame = 0;
      let widest = 0;
      for (const label of root.querySelectorAll<HTMLElement>('.ar-prop__label, .ar-field__label')) {
        if (label.closest('[data-ar-label-fit]') !== root || label.closest(OUTSIDE_COLUMN)) continue;
        if (!label.textContent?.trim() || !label.getClientRects().length) continue;
        range.selectNodeContents(label);
        widest = Math.max(widest, range.getBoundingClientRect().width);
      }
      if (!widest) root.style.removeProperty('--ar-field-label-w');
      else root.style.setProperty('--ar-field-label-w', `min(${Math.ceil(widest) + 2}px, round(calc(var(--ar-label-col) * var(--ar-k, 1)), 1px))`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    schedule();
    const resized = new ResizeObserver(schedule);
    resized.observe(root);
    const changed = new MutationObserver(schedule);
    changed.observe(root, { childList: true, subtree: true, characterData: true });
    document.fonts?.ready.then(schedule);
    return () => {
      cancelAnimationFrame(frame);
      resized.disconnect();
      changed.disconnect();
      root.style.removeProperty('--ar-field-label-w');
    };
  }, [ref, enabled]);
}
