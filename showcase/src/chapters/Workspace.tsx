/* 08 · Workspace — the Dock around a viewport, and the node graph. */
import { useMemo } from 'react';
import { Dock } from '../../../src';
import type { DockPanel } from '../../../src';
import { BACKDROPS, Chapter, Spec } from '../shared';
import { ConsolePanel, EffectsPanel, GraphPanel, InspectorPanel, LayersPanel } from './demos';

function WorkspaceDemo() {
  const panels = useMemo<DockPanel[]>(
    () => [
      { id: 'inspector', title: 'Inspector', description: 'Material controls', dock: 'left', content: <InspectorPanel /> },
      { id: 'layers', title: 'Layers', description: 'Scene layers — right-click one', dock: 'right', content: <LayersPanel /> },
      { id: 'console', title: 'Console', description: 'Live readouts', active: true, content: <ConsolePanel />, footer: 'Sampling · 220 ms' },
      { id: 'graph', title: 'Graph', description: 'Node editor', keywords: ['nodes', 'wires'], content: <GraphPanel /> },
      { id: 'effects', title: 'Effects', description: 'Sections that move between panes', dock: 'float', content: <EffectsPanel /> },
    ],
    [],
  );
  return (
    <div className="sc-workspace">
      <Dock
        panels={panels}
        viewport={<img className="sc-workspace__view" src={BACKDROPS.garden} alt="" />}
        storageKey="artinos-showcase.dock.v4"
        sizes={{ left: 0.28, right: 0.25, bottom: 0.38 }}
        floatBounds={{ x: 360, y: 40, width: 300, height: 330 }}
        viewProps={{ padding: 8, gap: 6 }}
      />
    </div>
  );
}

export function WorkspaceChapter() {
  return (
    <Chapter id="workspace">
      <Spec
        id="dock"
        wide
        text="A studio workspace in one component. Panels sit as tabs in docks on the left, right and bottom, or float. Drag a tab out to float it, onto an edge to dock it, onto another dock to merge; right-click a tab for every placement. A panel's PanelBar rises into the tab strip when there is room. storageKey keeps the arrangement. Sections live in the panes too: drag one by its heading from the floating Effects pane into the Inspector and back (SectionGroups sharing a group trade sections), and drag Layers to reorder them. Built on the MetaBlock engine."
        keys={[
          ['Drag tab', 'float · dock · merge · split'],
          ['Right-click tab', 'snap · dock · pin · auto-hide · attach'],
          ['Ctrl/⌘ K', 'search panels and commands'],
        ]}
        code={`<Dock
  viewport={<Canvas>…</Canvas>}
  storageKey="my-app.dock"
  panels={[
    { id: 'inspector', title: 'Inspector', dock: 'left', content: <Inspector /> },
    { id: 'console', title: 'Console', content: <Console />, footer: 'Ready' },
    { id: 'notes', title: 'Notes', dock: 'float', content: <Notes /> },
  ]}
/>`}
      >
        <WorkspaceDemo />
      </Spec>

      <Spec
        id="node-graph"
        text="A node editor on a dot-grid well. A node is a small frosted sheet, the material every list and menu floats on, with an LED in its family's colour before the title and the family's own controls inside; its ports light like LEDs when wired, wires glow, and its preview is a Sparkline. Drag from a port to wire, click a wire to cut it, drag the canvas to select, Alt-drag to pan, Ctrl/⌘ + wheel to zoom, right-click for the node palette. graph/gpu compiles a graph to three.js TSL."
        code={`const [graph, setGraph] = useState<GraphDefinition>({ domain: 'signal', nodes: [], edges: [] });
<NodeGraph value={graph} onChange={setGraph} />`}
      >
        <GraphPanel height={430} />
      </Spec>
    </Chapter>
  );
}
