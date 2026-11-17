'use client';
import { createElement, useEffect, useSyncExternalStore } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/* ARTINOS auto-hide — one switch for the whole interface, for a clean view of what is behind it.
   Every Dock, every Panel with `autoHide` and every element marked `data-ar-autohide` fades out
   together, and the canvas, video or photo behind them stays. Two reasons hide it:
   - by hand: a hotkey, a call (`interfaceVisibility.toggle()`) or an event; it stays hidden until
     the same is done again;
   - idle: no pointer, wheel or key for a while; any of them brings it back (or, with
     reveal: 'near', only a pointer near an edge or over where a hidden panel sits, so working the
     canvas keeps the view clean).
   Anything outside React (a three.js loop, a gamepad, a socket) can switch it with
     window.dispatchEvent(new CustomEvent('artinos:interface', { detail: 'toggle' }))   // or 'show' · 'hide' */

export type HiddenReason = 'manual' | 'idle';

export interface InterfaceVisibilityState {
  /** True while every part of the interface is shown. */
  visible: boolean;
  /** Why it is hidden: 'manual' (a key, a call, an event) before 'idle'; null when shown. */
  hiddenBy: HiddenReason | null;
}

export interface AutoHideOptions {
  /** Toggles the interface: 'h', 'tab', 'mod+.', 'shift+h'… (mod is Ctrl, or ⌘ on a Mac). Ignored while
   *  typing in a field. Several parts may bind the same key: it still toggles once. */
  hotkey?: string | null;
  /** Hide after this many ms with no input. 0 or omitted: never on its own. */
  idle?: number;
  /** What brings an idle interface back. 'move' (default): any pointer move, wheel, touch or key.
   *  'near': a pointer within 48px of the window's edge or over where a hidden panel sits, or a key. */
  reveal?: 'move' | 'near';
}

/** The DOM event anything can dispatch on window to switch the interface. */
export const INTERFACE_EVENT = 'artinos:interface';
/** Elements that fade with the interface; also where a pointer reveals it with reveal: 'near'. */
const HIDING = '[data-ar-autohide], .ar-dock .mb-group:not([data-role="viewport"])';
const EDGE = 48;

let manual = false;
let idle = false;
let snapshot: InterfaceVisibilityState = { visible: true, hiddenBy: null };
const listeners = new Set<() => void>();

function commit(nextManual: boolean, nextIdle: boolean) {
  if (nextManual === manual && nextIdle === idle) return;
  manual = nextManual;
  idle = nextIdle;
  const hiddenBy: HiddenReason | null = manual ? 'manual' : idle ? 'idle' : null;
  snapshot = { visible: hiddenBy === null, hiddenBy };
  listeners.forEach((fn) => fn());
}

/** The interface's one switch, usable from anywhere: React or not. */
export const interfaceVisibility = {
  get: (): InterfaceVisibilityState => snapshot,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  },
  /** Show everything, whatever hid it. */
  show: () => commit(false, false),
  /** Hide by hand: it stays hidden until shown again. */
  hide: () => commit(true, idle),
  toggle: () => (snapshot.visible ? commit(true, idle) : commit(false, false)),
  set: (visible: boolean) => (visible ? commit(false, false) : commit(true, idle)),
};

/** The interface's visibility, re-rendering when it changes. */
export function useInterfaceVisibility(): InterfaceVisibilityState {
  return useSyncExternalStore(interfaceVisibility.subscribe, interfaceVisibility.get, interfaceVisibility.get);
}

/* ---------- the behaviours, shared: one listener per kind however many parts ask ---------- */

/** Keys typed into a field, list or slider are for that control. */
export const typingTarget = (target: EventTarget | null) =>
  target instanceof Element &&
  !!target.closest(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="combobox"], [role="listbox"], [role="menu"], [role="slider"], [role="spinbutton"], [role="textbox"]',
  );

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** 'mod+shift+h' → a test for a keydown. */
function parseHotkey(spec: string) {
  const parts = spec.toLowerCase().split('+').map((p) => p.trim());
  const key = parts.pop() || '';
  const want = { ctrl: false, meta: false, shift: parts.includes('shift'), alt: parts.includes('alt') || parts.includes('option') };
  if (parts.includes('mod')) (isMac() ? (want.meta = true) : (want.ctrl = true));
  if (parts.includes('ctrl')) want.ctrl = true;
  if (parts.includes('cmd') || parts.includes('meta')) want.meta = true;
  const name = key === 'space' ? ' ' : key === 'esc' ? 'escape' : key;
  return (e: KeyboardEvent) =>
    e.key.toLowerCase() === name && e.ctrlKey === want.ctrl && e.metaKey === want.meta && e.altKey === want.alt && (e.shiftKey === want.shift || (name.length === 1 && !/[a-z0-9]/.test(name)));
}

const hotkeys = new Map<string, number>();
let keyListener: ((e: KeyboardEvent) => void) | null = null;

function bindHotkey(spec: string) {
  const id = spec.toLowerCase();
  hotkeys.set(id, (hotkeys.get(id) ?? 0) + 1);
  if (!keyListener) {
    keyListener = (e) => {
      if (e.repeat || e.isComposing || e.defaultPrevented || typingTarget(e.target)) return;
      for (const k of hotkeys.keys())
        if (parseHotkey(k)(e)) {
          if (k.includes('tab') || k.includes('mod') || k.includes('ctrl') || k.includes('cmd')) e.preventDefault();
          interfaceVisibility.toggle();
          return;
        }
    };
    window.addEventListener('keydown', keyListener);
  }
  return () => {
    const n = (hotkeys.get(id) ?? 1) - 1;
    if (n > 0) hotkeys.set(id, n);
    else hotkeys.delete(id);
    if (!hotkeys.size && keyListener) {
      window.removeEventListener('keydown', keyListener);
      keyListener = null;
    }
  };
}

interface IdleRequest {
  ms: number;
  reveal: 'move' | 'near';
}
const idleRequests = new Set<IdleRequest>();
let idleTeardown: (() => void) | null = null;

/** Nothing hides on its own while the user is in the middle of something. */
function busy(pointerDown: boolean, at: { x: number; y: number } | null) {
  if (pointerDown) return true;
  if (typingTarget(document.activeElement)) return true;
  // an open menu, list, dialog or palette
  if (document.querySelector('[role="menu"], [role="listbox"], [role="dialog"]')) return true;
  // the pointer resting on a panel
  if (at) {
    const under = document.elementFromPoint(at.x, at.y);
    if (under?.closest(HIDING)) return true;
  }
  return false;
}

function near(x: number, y: number) {
  if (x < EDGE || y < EDGE || x > window.innerWidth - EDGE || y > window.innerHeight - EDGE) return true;
  for (const el of document.querySelectorAll(HIDING)) {
    const r = el.getBoundingClientRect();
    if (r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true;
  }
  return false;
}

function startIdle() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pointerDown = false;
  let at: { x: number; y: number } | null = null;
  const settings = () => {
    let ms = Infinity;
    let reveal: 'move' | 'near' = 'move';
    for (const r of idleRequests) if (r.ms < ms) ((ms = r.ms), (reveal = r.reveal));
    return { ms, reveal };
  };
  const arm = () => {
    clearTimeout(timer);
    const { ms } = settings();
    if (!Number.isFinite(ms)) return;
    timer = setTimeout(function check() {
      if (busy(pointerDown, at)) timer = setTimeout(check, 500);
      else commit(manual, true);
    }, ms);
  };
  const wake = (e: Event) => {
    if (e instanceof MouseEvent) at = { x: e.clientX, y: e.clientY }; // pointer and wheel events are mouse events
    else if (e instanceof TouchEvent && e.touches[0]) at = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (e.type === 'pointerdown') pointerDown = true;
    if (e.type === 'pointerup' || e.type === 'pointercancel') pointerDown = false;
    if (idle) {
      // 'near' keeps the view clean while the canvas is worked: only a key, an edge or a hidden panel's place brings it back
      if (settings().reveal === 'near' && e.type !== 'keydown' && !(at && near(at.x, at.y))) return;
      commit(manual, false);
    }
    arm();
  };
  const kinds = ['pointermove', 'pointerdown', 'pointerup', 'pointercancel', 'wheel', 'keydown', 'touchstart'] as const;
  for (const k of kinds) window.addEventListener(k, wake, { passive: true, capture: true });
  arm();
  return {
    rearm: arm,
    stop: () => {
      clearTimeout(timer);
      for (const k of kinds) window.removeEventListener(k, wake, { capture: true });
      commit(manual, false);
    },
  };
}
let idleControl: { rearm: () => void; stop: () => void } | null = null;

function requestIdle(r: IdleRequest) {
  idleRequests.add(r);
  if (!idleControl) {
    idleControl = startIdle();
    idleTeardown = idleControl.stop;
  } else idleControl.rearm();
  return () => {
    idleRequests.delete(r);
    if (!idleRequests.size) {
      idleTeardown?.();
      idleControl = idleTeardown = null;
    } else idleControl?.rearm();
  };
}

let eventBindings = 0;
const onEvent = (e: Event) => {
  const d = (e as CustomEvent).detail;
  if (d === 'show' || d === true) interfaceVisibility.show();
  else if (d === 'hide' || d === false) interfaceVisibility.hide();
  else interfaceVisibility.toggle();
};
function bindEvent() {
  if (eventBindings++ === 0) window.addEventListener(INTERFACE_EVENT, onEvent);
  return () => {
    if (--eventBindings === 0) window.removeEventListener(INTERFACE_EVENT, onEvent);
  };
}

/**
 * Turns on the interface's auto-hide behaviours while the calling component is mounted: the hotkey,
 * hiding when idle, and the `artinos:interface` window event. Returns the visibility. A Dock does this
 * itself from its `hideKey` and `idleHide` props; call it once anywhere else (an app shell) for the rest.
 */
export function useAutoHide({ hotkey = null, idle: idleMs = 0, reveal = 'move' }: AutoHideOptions = {}): InterfaceVisibilityState {
  useEffect(() => (hotkey ? bindHotkey(hotkey) : undefined), [hotkey]);
  useEffect(() => (idleMs > 0 ? requestIdle({ ms: idleMs, reveal }) : undefined), [idleMs, reveal]);
  useEffect(bindEvent, []);
  return useInterfaceVisibility();
}

/** The attribute a part that hides with the interface carries: spread it onto its root. */
export function autoHideAttrs(state: InterfaceVisibilityState) {
  return { 'data-ar-autohide': state.hiddenBy ?? 'shown' } as const;
}

export interface AutoHideProps {
  children?: ReactNode;
  /** The element drawn. Default 'div'. */
  as?: 'div' | 'section' | 'aside' | 'nav' | 'header' | 'footer' | 'span';
  className?: string;
  style?: CSSProperties;
}

/** Anything that should fade with the interface: a toolbar, a HUD, an Inspector over a canvas. While
 *  hidden it takes no pointer and no focus. */
export function AutoHide({ children, as = 'div', className, style }: AutoHideProps) {
  const ui = useInterfaceVisibility();
  return createElement(as, { className, style, ...autoHideAttrs(ui), inert: ui.visible ? undefined : true }, children);
}
