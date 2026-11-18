/* Endless scrubbing. Once a drag on a number is under way the pointer is locked, so the hand can
   keep going past the edge of the screen; the value follows the movement, not the position. Only a
   mouse locks, only after the drag has begun (a click never does), and where the browser refuses
   the drag simply carries on from the pointer's position. */

/** The one rule for fine control, on every control that drags: Alt is 0.1×, Shift is 0.01×. */
export const precisionOf = (e: { altKey: boolean; shiftKey: boolean }) => (e.shiftKey ? 0.01 : e.altKey ? 0.1 : 1);

/** Lock the pointer to this element for the rest of a drag. */
export function lockPointer(el: Element | null, pointerType: string) {
  if (!el || pointerType !== 'mouse' || !el.requestPointerLock) return;
  try {
    const asked = el.requestPointerLock() as unknown as Promise<void> | undefined;
    asked?.catch?.(() => {});
  } catch {
    /* refused: the drag goes on without it */
  }
}

export function unlockPointer(el: Element | null) {
  if (el && el.ownerDocument.pointerLockElement === el) el.ownerDocument.exitPointerLock();
}

export const isPointerLocked = (el: Element | null) => !!el && el.ownerDocument.pointerLockElement === el;
