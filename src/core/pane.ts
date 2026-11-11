'use client';
import { createContext } from 'react';

/* True inside a Dock pane. A Panel placed there becomes the pane itself: no glass or title of its
   own (the pane's tab names it), keeping its subtitle, actions, tabs and footer. A Panel resets it
   for what it holds, so a panel inside that panel is drawn as usual. */
export const PaneContext = createContext(false);
