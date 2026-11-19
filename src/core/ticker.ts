/* ARTINOS ticker — one frame clock per window. Everything that samples or draws live data shares it,
   so twenty monitors cost one requestAnimationFrame, and the clock stops when nothing is listening. */

type Tick = (now: number) => void;
interface Clock {
  ticks: Set<Tick>;
  raf: number;
  run: FrameRequestCallback;
}

const clocks = new WeakMap<Window, Clock>();

/** Call `tick` on every frame of this window. Returns the way to stop. */
export function onFrame(view: Window, tick: Tick) {
  let clock = clocks.get(view);
  if (!clock) {
    const own: Clock = {
      ticks: new Set(),
      raf: 0,
      run(now) {
        own.raf = own.ticks.size ? view.requestAnimationFrame(own.run) : 0;
        own.ticks.forEach((t) => t(now));
      },
    };
    clocks.set(view, own);
    clock = own;
  }
  const c = clock;
  c.ticks.add(tick);
  if (!c.raf) c.raf = view.requestAnimationFrame(c.run);
  return () => {
    c.ticks.delete(tick);
    if (c.ticks.size || !c.raf) return;
    view.cancelAnimationFrame(c.raf);
    c.raf = 0;
  };
}
