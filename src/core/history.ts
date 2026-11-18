/* ARTINOS history — the one undo stack. A store's values, a Dock's layout and a node graph each keep
   their own, because each undoes its own work, and all three behave the same way. No React. */

export interface HistoryStep<T> {
  before: T;
  after: T;
  /** What the step did, in words or as a key. */
  label?: string;
  at: number;
}

export interface History<T> {
  /** Add a step. A step with the same `merge` key soon after the last becomes part of it: one drag, one undo. */
  record(before: T, after: T, options?: { label?: string; merge?: string }): void;
  /** The step to go back through, or undefined. Restore its `before`. */
  undo(): HistoryStep<T> | undefined;
  /** The step to go forward through, or undefined. Restore its `after`. */
  redo(): HistoryStep<T> | undefined;
  clear(): void;
  readonly undoable: number;
  readonly redoable: number;
}

export function createHistory<T>({ limit = 100, mergeWithin = 600 }: { limit?: number; mergeWithin?: number } = {}): History<T> {
  let past: (HistoryStep<T> & { merge?: string })[] = [];
  let future: (HistoryStep<T> & { merge?: string })[] = [];
  return {
    record(before, after, { label, merge } = {}) {
      future = [];
      if (limit <= 0) return;
      const at = Date.now();
      const last = past[past.length - 1];
      if (merge !== undefined && last?.merge === merge && at - last.at < mergeWithin) {
        last.after = after;
        last.at = at;
        return;
      }
      past = [...past.slice(Math.max(0, past.length - limit + 1)), { before, after, label, merge, at }];
    },
    undo() {
      const step = past[past.length - 1];
      if (!step) return undefined;
      past = past.slice(0, -1);
      future = [...future, step];
      return step;
    },
    redo() {
      const step = future[future.length - 1];
      if (!step) return undefined;
      future = future.slice(0, -1);
      past = [...past, step];
      return step;
    },
    clear() {
      past = [];
      future = [];
    },
    get undoable() {
      return past.length;
    },
    get redoable() {
      return future.length;
    },
  };
}
