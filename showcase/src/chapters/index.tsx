/* The chapters, in order: Workspace (how a tool is built), Density, then whatever the page puts after
   it (Foundations), then the components. The showcase page renders them before Make it yours; the Theme Studio renders them, compact, as its live preview. */
import type { ReactNode } from 'react';
import { ToastProvider } from '../../../src';
import { ActionsChapter } from './Actions';
import { DensityChapter } from './Density';
import { ControlsChapter } from './Controls';
import { DisplayChapter } from './Display';
import { GraphChapter } from './Graph';
import { LayoutChapter } from './Layout';
import { LiveChapter } from './Live';
import { OverlaysChapter } from './Overlays';
import { RigChapter } from './Rig';
import { SlidersChapter } from './Sliders';

export function ComponentChapters({ afterDensity }: { afterDensity?: ReactNode }) {
  return (
    <ToastProvider>
      <LayoutChapter />
      <DensityChapter />
      {afterDensity}
      <SlidersChapter />
      <ControlsChapter />
      <RigChapter />
      <ActionsChapter />
      <DisplayChapter />
      <OverlaysChapter />
      <GraphChapter />
      <LiveChapter />
    </ToastProvider>
  );
}
