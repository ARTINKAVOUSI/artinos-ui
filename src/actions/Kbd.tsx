'use client';
import { useSyncExternalStore } from 'react';

export interface KbdProps {
  /** Keys, e.g. `['mod', 'K']`. `mod` is ⌘ on Apple platforms and Ctrl elsewhere. */
  keys: readonly string[];
  className?: string;
}

// Read after hydration, so a server render (Ctrl) never mismatches the client.
const noop = () => () => {};
const appleClient = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const appleServer = () => false;

const glyph = (key: string, isApple: boolean) => {
  const k = key.toLowerCase();
  if (k === 'mod') return isApple ? '⌘' : 'Ctrl';
  if (k === 'shift') return isApple ? '⇧' : 'Shift';
  if (k === 'alt') return isApple ? '⌥' : 'Alt';
  if (k === 'enter') return '↵';
  if (k === 'escape' || k === 'esc') return 'Esc';
  return key.length === 1 ? key.toUpperCase() : key;
};

/** Kbd — a keyboard shortcut hint. */
export function Kbd({ keys, className }: KbdProps) {
  const isApple = useSyncExternalStore(noop, appleClient, appleServer);
  return (
    <span className={className ? `ar-kbd ${className}` : 'ar-kbd'}>
      {keys.map((key, i) => (
        <kbd key={i} className="ar-keycap">{glyph(key, isApple)}</kbd>
      ))}
    </span>
  );
}

