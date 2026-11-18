/* artinos-ui/signals: the value core alone, for code that has no React in it. */
export { signal, computed, effect, batch, untrack } from './core/signal';
export type { Signal, ReadSignal, SignalOptions } from './core/signal';
export { tweened, mixTween } from './core/tween';
export type { Tweened, TweenOptions, Tweenable } from './core/tween';
export { evaluate } from './core/expression';
