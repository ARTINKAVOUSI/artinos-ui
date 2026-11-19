/* ARTINOS strip — a picture that scrolls without being redrawn. Two canvases sit side by side on a
   rail; new marks are drawn at the rail's leading edge and the rail moves on the compositor. When the
   leading canvas fills, the one that has scrolled out of sight is wiped and goes round to the front.
   Nothing already on screen is ever touched, so a frame costs only its newest mark. No React. */

export interface Strip {
  readonly width: number;
  readonly height: number;
  readonly pixelRatio: number;
  /** Match the host's size. False while it has none. */
  measure(): boolean;
  /** Move on by `shift` px and draw what came in, between x0 and x1. */
  advance(shift: number, draw: (ctx: CanvasRenderingContext2D, x0: number, x1: number) => void): void;
  /** Draw the whole visible picture again, x running from 0 to the width. */
  repaint(draw: (ctx: CanvasRenderingContext2D) => void): void;
  /** The rail has run a long way: repaint soon to bring it home. */
  readonly stale: boolean;
  prepare(setup: (ctx: CanvasRenderingContext2D) => void): void;
}

const FAR = 2000;

export function createStrip(host: HTMLElement): Strip {
  const doc = host.ownerDocument;
  const rail = doc.createElement('div');
  rail.style.cssText = 'position:absolute;inset:0;will-change:transform';
  const canvases = [doc.createElement('canvas'), doc.createElement('canvas')];
  canvases.forEach((c) => {
    c.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%';
    c.setAttribute('aria-hidden', 'true');
    rail.append(c);
  });
  host.append(rail);
  const contexts = canvases.map((c) => c.getContext('2d'));
  let W = 0;
  let H = 0;
  let dpr = 1;
  let head = 0;
  let page = 0;
  let setup: ((ctx: CanvasRenderingContext2D) => void) | null = null;

  const place = () => {
    rail.style.transform = `translate3d(${-(head - W) / dpr}px,0,0)`;
  };
  const seat = (i: number, at: number) => {
    canvases[i].style.left = `${(at * W) / dpr}px`;
  };

  return {
    get width() {
      return W;
    },
    get height() {
      return H;
    },
    get pixelRatio() {
      return dpr;
    },
    get stale() {
      return page > FAR;
    },
    prepare(fn) {
      setup = fn;
      contexts.forEach((ctx) => ctx && fn(ctx));
    },
    measure() {
      const box = host.getBoundingClientRect();
      dpr = doc.defaultView?.devicePixelRatio ?? 1;
      W = Math.round(box.width * dpr);
      H = Math.round(box.height * dpr);
      if (!W || !H) return false;
      canvases.forEach((c, i) => {
        c.width = W;
        c.height = H;
        const ctx = contexts[i];
        if (ctx) setup?.(ctx);
      });
      return true;
    },
    repaint(draw) {
      const ctx = contexts[0];
      if (!ctx || !W) return;
      contexts.forEach((c) => {
        c?.setTransform(1, 0, 0, 1, 0, 0);
        c?.clearRect(0, 0, W, H);
      });
      page = 0;
      head = W;
      seat(0, 0);
      seat(1, 1);
      draw(ctx);
      place();
    },
    advance(shift, draw) {
      if (!W) return;
      const from = head;
      head += shift;
      const first = page;
      if (head > (page + 1) * W) {
        page++;
        const i = page % 2;
        contexts[i]?.setTransform(1, 0, 0, 1, 0, 0);
        contexts[i]?.clearRect(0, 0, W, H);
        seat(i, page);
      }
      // a mark that crosses from one canvas to the next is drawn on both
      for (let p = first; p <= page; p++) {
        const ctx = contexts[p % 2];
        if (!ctx) continue;
        ctx.setTransform(1, 0, 0, 1, -p * W, 0);
        draw(ctx, from, head);
      }
      place();
    },
  };
}
