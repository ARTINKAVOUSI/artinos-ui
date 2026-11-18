'use client';
import { useRef, useSyncExternalStore } from 'react';
import { signal } from './signal';
import type { ReadSignal, Signal, SignalOptions } from './signal';

/** A signal that lives as long as the component. Changing it does not render the component. */
export function useSignal<T>(initial: T, options?: SignalOptions<T>): Signal<T> {
  const ref = useRef<Signal<T> | null>(null);
  ref.current ??= signal(initial, options);
  return ref.current;
}

/** Read a signal in render: the component renders again when it changes. */
export function useSignalValue<T>(source: ReadSignal<T>): T {
  return useSyncExternalStore(source.subscribe, source.peek, source.peek);
}
