/* Node graph — the node editor, built from the same controls as every panel. */
import { Chapter, Spec } from '../shared';
import { GraphPanel } from './demos';

export function GraphChapter() {
  return (
    <Chapter id="graph">
      <Spec
        id="node-graph"
        text="A node editor on a dot-grid well. A node is a small frosted sheet, the material every list and menu floats on, with an LED in its family's colour before the title and the family's own controls inside; its ports light like LEDs when wired, wires glow, and its preview is a Sparkline. Drag from a port to wire, click a wire to cut it, drag the canvas to select, Alt-drag to pan, Ctrl/⌘ + wheel to zoom, right-click for the node palette. In a workspace it is one more Dock panel; graph/gpu compiles a graph to three.js TSL."
        code={`const [graph, setGraph] = useState<GraphDefinition>({ domain: 'signal', nodes: [], edges: [] });
<NodeGraph value={graph} onChange={setGraph} />`}
      >
        <GraphPanel height={430} />
      </Spec>
    </Chapter>
  );
}
