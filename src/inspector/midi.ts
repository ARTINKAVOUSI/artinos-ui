/* MIDI learn. Right-click a row, choose Learn, turn a knob: that knob now plays the value. A map
   belongs to one store and remembers its bindings. Controllers are read through the browser's Web
   MIDI access, asked for only when the first row learns. */
import { signal } from '../core/signal';
import type { ReadSignal } from '../core/signal';
import type { InspectItem, InspectorStore } from './store';

export interface MidiBinding {
  key: string;
  /** 0–15 */
  channel: number;
  /** The controller number, 0–127. */
  cc: number;
}

export interface MidiState {
  /** This browser offers MIDI at all. */
  supported: boolean;
  /** Access was granted and inputs are being read. */
  connected: boolean;
  /** The key waiting for a control to be moved. */
  learning: string | null;
  bindings: readonly MidiBinding[];
  /** Why access failed, in words. */
  error: string | null;
}

export interface MidiMap {
  readonly state: ReadSignal<MidiState>;
  /** The next controller moved is bound to this key. */
  learn(key: string): Promise<void>;
  cancel(): void;
  forget(key: string): void;
  bindingOf(key: string): MidiBinding | undefined;
  /** Feed one raw message: what the inputs do, and how to drive the map from elsewhere (a test, a socket). */
  handle(data: ArrayLike<number>): void;
  dispose(): void;
}

interface MidiInputLike {
  onmidimessage: ((event: { data: Uint8Array | null }) => void) | null;
}
interface MidiAccessLike {
  inputs: { forEach(fn: (input: MidiInputLike) => void): void };
  onstatechange: (() => void) | null;
}

export interface MidiMapOptions {
  /** Keep the bindings in localStorage under this key. */
  storageKey?: string;
  /** How to reach the controllers. Default: navigator.requestMIDIAccess(). */
  access?: () => Promise<MidiAccessLike>;
}

const webMidi = () => (typeof navigator !== 'undefined' ? (navigator as unknown as { requestMIDIAccess?: () => Promise<MidiAccessLike> }).requestMIDIAccess?.bind(navigator) : undefined);

/** Where a controller at 0..1 puts a row, or undefined when the row cannot be played. */
function played(item: InspectItem, u: number) {
  switch (item.kind) {
    case 'number': {
      if (item.min === undefined || item.max === undefined) return undefined;
      const raw = item.face === 'log' && item.min > 0 ? item.min * Math.pow(item.max / item.min, u) : item.min + (item.max - item.min) * u;
      return item.step ? Number((Math.round(raw / item.step) * item.step).toFixed(6)) : raw;
    }
    case 'toggle':
      return u >= 0.5;
    case 'choice':
      return item.options[Math.min(item.options.length - 1, Math.floor(u * item.options.length))]?.value;
    default:
      return undefined;
  }
}

/** Whether a controller can play this row. */
export const midiPlayable = (item: InspectItem) => played(item, 0) !== undefined;

export function createMidiMap(store: InspectorStore, items: readonly InspectItem[], { storageKey, access = webMidi() }: MidiMapOptions = {}): MidiMap {
  const saved = (): MidiBinding[] => {
    if (!storageKey || typeof localStorage === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    } catch {
      return [];
    }
  };
  const state = signal<MidiState>({ supported: !!access, connected: false, learning: null, bindings: saved(), error: null });
  let opened: MidiAccessLike | null = null;
  const patch = (next: Partial<MidiState>) => state.set({ ...state.peek(), ...next });
  const keep = (bindings: MidiBinding[]) => {
    patch({ bindings, learning: null });
    if (storageKey && typeof localStorage !== 'undefined')
      try {
        localStorage.setItem(storageKey, JSON.stringify(bindings));
      } catch {
        /* storage is best-effort */
      }
  };

  const handle = (data: ArrayLike<number>) => {
    const status = data[0] & 0xf0;
    if (status !== 0xb0) return;
    const channel = data[0] & 0x0f;
    const cc = data[1];
    const { learning, bindings } = state.peek();
    if (learning) keep([...bindings.filter((b) => b.key !== learning && !(b.channel === channel && b.cc === cc)), { key: learning, channel, cc }]);
    for (const b of state.peek().bindings) {
      if (b.channel !== channel || b.cc !== cc) continue;
      const item = items.find((x) => x.key === b.key);
      const v = item ? played(item, data[2] / 127) : undefined;
      if (v !== undefined) store.scrub(b.key, v);
    }
  };
  const listenTo = (midi: MidiAccessLike) => {
    midi.inputs.forEach((input) => {
      input.onmidimessage = (e) => e.data && handle(e.data);
    });
  };
  const open = async () => {
    if (opened || !access) return;
    try {
      opened = await access();
      listenTo(opened);
      opened.onstatechange = () => opened && listenTo(opened); // a controller plugged in later
      patch({ connected: true, error: null });
    } catch (e) {
      patch({ error: e instanceof Error ? e.message : 'MIDI access was refused.', learning: null });
    }
  };
  // bindings from an earlier session play again, but a page never asks for MIDI by itself on load
  if (state.peek().bindings.length && typeof navigator !== 'undefined')
    void navigator.permissions
      ?.query({ name: 'midi' as PermissionName })
      .then((p) => (p.state === 'granted' ? open() : undefined))
      .catch(() => {});

  return {
    state,
    async learn(key) {
      patch({ learning: key });
      await open();
    },
    cancel: () => patch({ learning: null }),
    forget: (key) => keep(state.peek().bindings.filter((b) => b.key !== key)),
    bindingOf: (key) => state.peek().bindings.find((b) => b.key === key),
    handle,
    dispose() {
      opened?.inputs.forEach((input) => void (input.onmidimessage = null));
      if (opened) opened.onstatechange = null;
      opened = null;
    },
  };
}
