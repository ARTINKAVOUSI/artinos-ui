/* The component chapters (02–08), in order. The showcase page renders them between
   Foundations and Make it yours; the Theme Studio renders them, compact, as its live preview. */
import { ToastProvider } from '../../../src';
import { ActionsChapter } from './Actions';
import { ControlsChapter } from './Controls';
import { DisplayChapter } from './Display';
import { LayoutChapter } from './Layout';
import { OverlaysChapter } from './Overlays';
import { SlidersChapter } from './Sliders';
import { WorkspaceChapter } from './Workspace';

export function ComponentChapters() {
  return (
    <ToastProvider>
      <SlidersChapter />
      <ControlsChapter />
      <ActionsChapter />
      <DisplayChapter />
      <LayoutChapter />
      <OverlaysChapter />
      <WorkspaceChapter />
    </ToastProvider>
  );
}
