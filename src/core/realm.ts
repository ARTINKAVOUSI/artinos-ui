/* The window a thing is in. A panel can open in a browser window of its own and stay in the same
   React tree, so the global `window` may be the wrong one: its listeners miss what happens over
   there, and its frames stop when the opener is hidden. */

/** The element's own window; the global one when there is no element yet. */
export function windowOf(el: Element | null | undefined): Window & typeof globalThis {
  return el?.ownerDocument.defaultView ?? window;
}
