/* A workspace of panels for a demo: a Dock with no canvas behind it. Every panel in the showcase
   lives in one, so each can be dragged, floated, docked, joined to another as a tab, split,
   maximized and sent home, the way every ARTINOS panel can. A Panel given as content becomes the
   pane: the tab carries its name, the pane its glass. The palette is off, so several spaces on one
   page don't all answer Ctrl/⌘ K. */
import type { CSSProperties } from 'react';
import { Dock } from '../../../src';
import type { DockPanel, DockProps } from '../../../src';

export function PanelSpace({ id, panels, height = 600, sizes, tabs }: { id: string; panels: DockPanel[]; height?: number; sizes?: DockProps['sizes']; tabs?: DockProps['tabs'] }) {
  return (
    <div className="sc-workspace sc-panelspace" style={{ height } as CSSProperties}>
      <Dock panels={panels} storageKey={`artinos-showcase.space.${id}.v1`} sizes={sizes} tabs={tabs} palette={false} viewProps={{ padding: 8, gap: 8 }} />
    </div>
  );
}
