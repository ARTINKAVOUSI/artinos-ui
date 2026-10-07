/* 09 · Make it yours — the Theme Studio, token overrides in code, and getting a kit. */
import { Button } from '../../../src';
import { ThemeBuilder } from '../app/foundations';
import { Chapter, Code, Spec } from '../shared';

const TREE = `artinos-ui/                 a kit, trimmed to what you picked
  artinos.css               ← import once at the app root
  index.ts                  ← every component and type
  tokens/    tokens · themes · materials · fonts
  core/      ArtinosTheme · ThemedPortal · RollingValue · motion · utils · core.css
  slider/    Slider · RangeSlider · engine · HUD
  controls/  NumberField · TextField · Switch · ToggleGroup · Segmented · Select · ColorField · FileDrop · Knob · XYPad
  actions/   Button · IconButton · Toolbar · Kbd · Badge
  display/   Meter · Sparkline
  layout/    Panel · Section · Field · Tabs · PropertyRow
  overlays/  Menu · Dialog · Toast · Tooltip · CommandPalette
  dock/      Dock · PanelBar · DockMenu · metablock/ (the docking engine)
  graph/     NodeGraph · LiveGraphView · model · editor · gpu (needs three)
  docs/      components.md · theming.md`;

export function MakeItYoursChapter({ customs, onStudio, onExport }: { customs: number; onStudio: () => void; onExport: () => void }) {
  return (
    <Chapter id="make">
      <Spec
        id="studio"
        text="The full theme editor: every token of a theme — ground, ink, signal, panel glass, well, insert, seam, type, size, motion — tuned live against the complete component gallery. Click any part of a component to edit just its tokens. Save as new themes, edit them later, export as CSS, JSON or TSX. Saved themes appear in the theme picker above."
      >
        <div className="sc-row" style={{ alignItems: 'center' }}>
          <Button variant="primary" onClick={onStudio}>
            Open Theme Studio
          </Button>
          <span className="sc-note">
            {customs ? (
              <>
                You have <b>{customs}</b> saved theme{customs > 1 ? 's' : ''}.
              </>
            ) : (
              'Start from any built-in theme.'
            )}
          </span>
        </div>
      </Spec>

      <Spec id="quick-tokens" text="Any role or control token can also be overridden on a scope in code — inline via ArtinosTheme tokens, or as plain CSS. Everything derived from it (seam, LED, focus ring) follows.">
        <ThemeBuilder />
      </Spec>

      <Spec
        id="install"
        text="One command writes a kit into your project with only the themes and components you pick, the two guides and the Claude Code skill, then prints the import lines. Or pick them here and download a zip. Requires React 18.3+ and react-dom; no provider, build plugin or Tailwind."
      >
        <div className="sc-row" style={{ alignItems: 'center' }}>
          <Button variant="primary" onClick={onExport}>
            Export kit
          </Button>
          <span className="sc-note">Pick themes and components, then download a .zip or write the kit into a folder.</span>
        </div>
        <Code>{`node "<path-to>/artinos-ui/artinos.mjs" setup --project . --themes frost-deep,studio-light --components Slider,Select,Switch,Panel`}</Code>
        <pre className="sc-tree">{TREE}</pre>
        <Code>{`// main.tsx
import './artinos-ui/artinos.css';
import { ArtinosTheme, Slider, Switch } from './artinos-ui';

export function Inspector() {
  const [rough, setRough] = useState(0.52);
  return (
    <ArtinosTheme theme="frost-deep">
      <Slider label="Roughness" value={rough} onChange={setRough} toggleable />
      <Switch label="Shadows" defaultValue />
    </ArtinosTheme>
  );
}`}</Code>
      </Spec>
    </Chapter>
  );
}
