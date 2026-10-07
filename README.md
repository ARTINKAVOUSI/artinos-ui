# ARTINOS UI

A precision-instrument control system for React. Each parameter is one compact surface: the capsule is the control, the seam is the handle, the readout is the precision zone. There are 33 components, on a token-based design system with **52 themes** (glass, frost, studio, atelier and luxe):
- sliders, ranges, knobs and XY pads;
- number, text and colour fields, file drops, switches, toggles, segmented controls and selects;
- buttons, toolbars, badges, meters and sparklines;
- panels, tabs and inspector rows;
- menus, dialogs, toasts, tooltips and a command palette;
- a dockable studio workspace (Dock, on the MetaBlock engine);
- a node graph editor.

## Design language

Every component is built from five materials. **Panel glass** holds things (Panel, Dock panes, a floating Toolbar). The **frosted sheet** floats (lists, menus, the palette, dialogs, toasts, tooltips). The **well** is where a value is edited (fields, troughs, key caps, canvases). The **insert** is the polished part you press or drag (buttons, knob caps, slider fills). The **seam or LED** marks what is live. Text comes in two voices: mono caps control text for labels, rows and buttons, and light body text for prose. Every number rolls when it changes, and every motion uses the same duration and curve tokens.

## Components

| group | components |
|---|---|
| Sliders | Slider · RangeSlider · Knob · XYPad |
| Controls | NumberField · TextField · Switch · ToggleGroup · Segmented · Select · ColorField · FileDrop |
| Actions | Button · IconButton · Toolbar · Kbd · Badge |
| Display | Meter · Sparkline · RollingValue |
| Layout | Panel / Section / Field · Tabs · PropertyRow |
| Overlays | Menu / ContextMenu · Dialog · Toast · Tooltip · CommandPalette |
| Dock | Dock / PanelBar / useDock · MetaBlock (the docking engine) |
| Graph | NodeGraph · LiveGraphView · GraphGPU (needs `three`) |

The full API is in [`docs/components.md`](docs/components.md).

**copy → paste → import → use.** Only `react` and `react-dom` (18.3+). No npm package, provider, build plugin or Tailwind. `three` is needed only by the optional `graph/gpu` compiler.

> **AI agents:** read [`AGENTS.md`](AGENTS.md). One command sets a project up.

## Use it in a project

From the project's root:

```bash
# see every theme and component
node "<path-to>/artinos-ui/artinos.mjs" list

# add a kit with the themes and components you want, its guides, and the Claude Code skill
node "<path-to>/artinos-ui/artinos.mjs" setup --project . --themes frost-deep,onyx --components Slider,Select,Switch,Panel
```

This writes `src/artinos-ui/`, a trimmed kit with only what you picked, and prints the two import lines for your entry file:

```tsx
import './artinos-ui/artinos.css';                        // once, at the app root
import { ArtinosTheme, Panel, Slider } from './artinos-ui';

<ArtinosTheme theme="frost-deep">
  <Panel title="Material">
    <Slider label="Roughness" value={rough} onChange={setRough} />
  </Panel>
</ArtinosTheme>
```

To change themes or components later, run `export` with `--force`. Other ways to get a kit:
- the showcase **Export kit**, which can also include themes you saved in the Theme Studio;
- copying `src/` whole, which brings all themes and components.

With Claude Code, you can also just ask in any project:

> *"Add an ARTINOS UI inspector panel using `<path-to>/artinos-ui` with the frost-deep theme."*

## Documentation

- [`docs/components.md`](docs/components.md): every component (props, defaults, examples, interaction), requirements and performance.
- [`docs/theming.md`](docs/theming.md): the 52 themes, solid vs glass, density, token overrides, custom themes and key tokens.

Every kit carries both guides in its own `docs/`.

## Showcase

`showcase/artinos-ui-showcase.html` is a self-contained page: double-click it. It has three parts:
- **Gallery:** nine chapters: Foundations (themes, the five materials, tokens and type, density, motion), then Sliders, Controls, Actions, Display, Layout, Overlays, Workspace, and Make it yours. A sticky index follows your place. Every component is live, in every theme, over a photo backdrop. Link straight to a look with `?theme=ice&density=dense&backdrop=monstera`, or to a section with `#s-meters` / a chapter with `#c-overlays`.
- **Theme Studio** (`#studio`): edit every token live, click any part of a component to edit just its tokens (Inspect), and save themes. Export them as CSS, JSON or TSX.
- **Export kit** (`#export`): pick themes, saved themes and components, then download a `.zip` or write the kit into a folder.

## The command

`node artinos.mjs <command>`:

| command | does |
|---|---|
| `list` | every theme and component |
| `setup --project <dir> …` | kit + guides + Claude Code skill in a project, then the wiring steps |
| `export --project <dir> …` | the kit only |
| `skill --project <dir>` / `--user` | install or refresh the skill in one project / for every project |
| `pack` | `dist/artinos-ui.skill`, the skill as a shareable file |
| `sync` | maintainers: regenerate the theme lists from the registry |

Kit options:
- `--themes <ids|all>` and `--components <ids|all>`;
- `--out <dir>`;
- `--custom <file.css>`;
- `--no-fonts`, `--no-materials` and `--no-docs`;
- `--force` and `--dry-run`.

## Folder

```
artinos-ui/
  artinos.mjs       the command
  src/              the components: what a kit copies into a project
    artinos.css       single stylesheet entry
    index.ts          public exports
    tokens/           tokens.css · themes.css · materials.css · fonts.css
    core/             ArtinosTheme · ThemedPortal · RollingValue · utils · hooks · core.css
    slider/           Slider · RangeSlider · engine · HUD parts · slider.css
    controls/         NumberField · Switch · ToggleGroup · Segmented · ColorField · Select
                      TextField · FileDrop · Knob · XYPad · controls.css + one sheet each
    actions/          Button · IconButton · Toolbar · Kbd · Badge · actions.css
    display/          Meter · Sparkline · display.css
    layout/           Panel · Section · Field · Tabs · PropertyRow · layout.css
    overlays/         Menu · ContextMenu · Dialog · Toast · Tooltip · CommandPalette · overlays.css
    dock/             Dock · PanelBar · DockMenu · Dock.css
      metablock/        the docking engine: workspace model, layout, physics, WorkspaceView
    graph/            NodeGraph · LiveGraphView · graph model · editor · gpu.ts (three TSL, opt-in)
  docs/             components.md · theming.md
  skill/            SKILL.md: the Claude Code skill (installed by the command)
  tools/            kit.mjs (kit builder) · zip.mjs: shared by the command and the showcase
  showcase/         Vite app: the chaptered gallery · Theme Studio · Export kit, plus the built page
  design/           design references, the original prototype and the written spec
```

## Develop

```bash
cd showcase
pnpm install
pnpm dev     # http://localhost:5173 (studio at #studio, export at #export)
pnpm build   # type-check, then rebuild showcase/artinos-ui-showcase.html
```

After changing `skill/` or `docs/`, run `node artinos.mjs skill --user` to refresh installed copies. After adding or editing themes in `src/core/utils.ts`, run `node artinos.mjs sync`.
