'use client';
import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';

/* Commands — how anything inside a workspace offers actions to its command palette. A Dock provides
   the place; an Inspector, or any panel of the app's, adds what it can do while it is on screen. */

export interface Command {
  id: string;
  label: string;
  /** Heading the command is listed under. */
  group?: string;
  /** Extra words that should match. */
  keywords?: string;
  /** Shortcut hint, e.g. "H". Display only. */
  shortcut?: string;
  icon?: ReactNode;
  run: () => void;
}

/** Adds commands to the surrounding workspace; returns the way to take them back. */
export const CommandsContext = createContext<((commands: readonly Command[]) => () => void) | null>(null);
/** The name commands from this part of the workspace are listed under: its panel's title. */
export const CommandScopeContext = createContext<string | null>(null);

/** Offer commands to the surrounding Dock's palette while this component is mounted. `key` says
 *  when the list has changed; outside a Dock nothing happens. */
export function useCommands(commands: () => readonly Command[], key: string) {
  const add = useContext(CommandsContext);
  useEffect(() => add?.(commands()), [add, key]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** The heading for this panel's commands. */
export const useCommandScope = () => useContext(CommandScopeContext);
