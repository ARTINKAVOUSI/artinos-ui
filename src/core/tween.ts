/* ARTINOS tweened — a signal that glides to its target. Numbers and lists of numbers move straight;
   #rrggbb colours move through OKLab, so a blend stays even in brightness. With reduced motion, or
   with no frame clock (a server), the value lands at once. No React. */
import { signal } from './signal';
import type { ReadSignal } from './signal';

export type Tweenable = number | readonly number[] | string;

export interface TweenOptions {
  /** ms. Default 240. */
  duration?: number;
  /** 0..1 → 0..1. Default ease-out cubic. */
  ease?: (t: number) => number;
}

export interface Tweened<T extends Tweenable> extends ReadSignal<T> {
  /** Glide to a value from wherever it is now. */
  target(next: T, options?: TweenOptions): void;
  /** Where it is heading. */
  goal(): T;
  /** Land at a value now. */
  jump(next: T): void;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const HEX = /^#[0-9a-f]{6}$/i;

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toGamma = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

function hexToOklab(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => toLinear(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

function oklabToHex([L, a, b]: readonly number[]) {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return '#' + rgb.map((c) => Math.round(Math.min(1, Math.max(0, toGamma(Math.max(0, c)))) * 255).toString(16).padStart(2, '0')).join('');
}

/** The value `u` of the way from a to b. A string that is not a colour holds until the end. */
export function mixTween<T extends Tweenable>(a: T, b: T, u: number): T {
  if (typeof a === 'number' && typeof b === 'number') return (a + (b - a) * u) as T;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((x: number, i: number) => x + ((b[i] ?? x) - x) * u) as unknown as T;
  if (typeof a === 'string' && typeof b === 'string' && HEX.test(a) && HEX.test(b)) {
    const from = hexToOklab(a);
    const to = hexToOklab(b);
    return oklabToHex(from.map((x, i) => x + (to[i] - x) * u)) as T;
  }
  return (u < 1 ? a : b) as T;
}

export function tweened<T extends Tweenable>(initial: T, defaults: TweenOptions = {}): Tweened<T> {
  const value = signal<T>(initial);
  let goal = initial;
  let raf = 0;
  const cancel = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
  const still = () => typeof requestAnimationFrame === 'undefined' || (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const read = (() => value()) as Tweened<T>;
  read.peek = value.peek;
  read.subscribe = value.subscribe;
  read.goal = () => goal;
  read.jump = (next) => {
    if (raf) cancel();
    goal = next;
    value.set(next);
  };
  read.target = (next, options) => {
    const { duration = 240, ease = easeOut } = { ...defaults, ...options };
    if (still() || duration <= 0) return read.jump(next);
    cancel();
    goal = next;
    const from = value.peek();
    const start = performance.now();
    const frame = (now: number) => {
      const t = Math.min(1, Math.max(0, now - start) / duration);
      value.set(t < 1 ? mixTween(from, next, ease(t)) : next);
      raf = t < 1 ? requestAnimationFrame(frame) : 0;
    };
    raf = requestAnimationFrame(frame);
  };
  return read;
}
