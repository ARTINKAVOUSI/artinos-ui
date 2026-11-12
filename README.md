# ARTINOS UI

A precision-instrument control system for React: control panels, inspectors, studio tools and the pages around them. Each parameter is one compact surface: the capsule is the control, the seam is the handle, the readout is where you type. There are 49 kit components on a token-based design system with **108 themes** (glass, frost, studio, atelier and luxe) and **twelve type systems**. The default look is the `nimbus` theme with the `fine` type system.

**copy → paste → import → use.** Only `react` and `react-dom` (18.3+). No npm package, provider, build plugin or Tailwind. `three` is needed only by the optional `TransformGizmo` and `graph/gpu`.

> **AI agents:** read [`AGENTS.md`](AGENTS.md). One command sets a project up or updates it.

## The feel

A well-made instrument: calm over the scene, exact, restrained, direct, and alive only where something changes. Glass lets the work show through; values are figures with their units in the kind of control their parameter is; hairlines and air group things instead of boxes; one accent, reference-class faces, no capitals. Every number rolls when it changes, and every motion uses the same duration and curve tokens. [`docs/design.md`](docs/design.md) holds the whole of it.

**Three levels build every screen:** parts in a **section**, sections in a **panel**. A panel is one thing wherever it sits: a `Panel` on a page, or a panel in a `Dock` around a canvas, where it is a MetaBlock with capabilities (float, dock, tab, split, maximize, close). A section is the one way to group, with a hairline through its own title row. Everything else (rows, controls, readouts, lists, text) is a part inside a section.

**Five materials make every part.** **Panel glass** holds things (Panel, Dock panes, a floating Toolbar). The **frosted sheet** floats (lists, menus, the palette, dialogs, toasts, tooltips). The **well** is where a value is edited (fields, troughs, key caps, canvases). The **insert** is the polished part you press or drag (buttons, knob caps, slider fills). The **seam or LED** marks what is live. Text is one voice: the sans for labels, buttons, prose and every number (tabular digits), a mono only for code.

## Components

| group | components |
|---|---|
| Sliders | Slider · RangeSlider · Knob · XYPad |
| Controls | NumberField · TextField · Switch · Checkbox · ToggleGroup · ChipGroup · Segmented · Select · ColorField · FileDrop |
| Rig | ViewGizmo · Trackball · Vector3Field · TransformGizmo (needs `three`) |
| Actions | Button · IconButton · Toolbar · Kbd · Badge · Tag |
| Display | Stat · Meter · Spectrum · Progress · Sparkline · RollingValue |
| Layout | Panel / Section / SectionGroup / Field · Text / Stack / Inline · StatStrip · Callout · Tabs · PropertyRow · ItemList / ItemGroup / ItemRow |
| Overlays | Menu / ContextMenu · Dialog · Toast · Tooltip · CommandPalette |
| Dock | Dock / PanelBar / useDock · createDockSections · createParamPanes · MetaBlock (the docking engine) |
| Inspector (optional) | Inspector / createInspectorStore · searchable schema-driven editor |
| Graph | NodeGraph · LiveGraphView · GraphGPU (needs `three`) |

## Use it in a project

From the project's root:

```bash
# see every theme and component
node "<path-to>/artinos-ui/artinos.mjs" list

# add a kit with the themes and components you want, its guides, and the Claude Code skill
node "<path-to>/artinos-ui/artinos.mjs" setup --project . --themes nimbus,frost-deep --components Slider,Select,Switch,Panel
```

This writes `src/artinos-ui/`, a trimmed kit with only what you picked, and prints the import lines for your entry file:

```tsx
import './artinos-ui/artinos.css';                        // once, at the app root
import { ArtinosTheme, Panel, Section, Slider } from './artinos-ui';

<ArtinosTheme>                                             {/* nimbus · fine */}
  <Panel title="Material" subtitle="Optical body">
    <Section title="Surface" count={1}>
      <Slider label="Roughness" value={rough} onChange={setRough} />
    </Section>
  </Panel>
</ArtinosTheme>
```

**Updating a kit:** run `setup` again with everything the kit should hold (its `README.md` lists its themes, type systems and components), first with `--dry-run`, then with `--force`. Then run the type-check: an update can rename or remove a prop, and the app is fixed to the guides, never the kit. Restyle only with tokens, because `--force` rewrites the kit.

Other ways to get a kit:
- the showcase **Export kit**, which can also include themes you saved in the Theme Studio;
- copying `src/` whole, which brings all themes and components.

With Claude Code, you can also just ask in any project:

> *"Add an ARTINOS UI inspector panel using `<path-to>/artinos-ui`."*



## Optional Inspector — Leva/Tweakpane-style property editor

The `Inspector` component assembles existing ARTINOS UI controls into a searchable, grouped parameter editor. It supports live bidirectional values, precision numeric sliders, segmented/select choices, switches, text, color and 3D vectors, section folding, advanced-only properties and per-property/group/global reset. It does not depend on Leva or Tweakpane.

Choose `--components Inspector` when setting up or exporting a kit. It can sit on a page or inside a `Dock` pane and preserves the library's theme, density and material system.

```tsx
import { Inspector, createInspectorStore } from './artinos-ui';
import type { Param, ParamGroup } from './artinos-ui';

const groups: ParamGroup[] = [
  { id: 'physics', title: 'Physics', open: true },
  { id: 'surface', title: 'Surface', open: true },
];
const params: Param[] = [
  { key: 'viscosity', group: 'physics', label: 'Viscosity', kind: 'number', default: 0.3, min: 0, max: 1, step: 0.01 },
  { key: 'active', group: 'physics', label: 'Active', kind: 'toggle', default: true },
  { key: 'name', group: 'surface', label: 'Name', kind: 'text', default: 'Blobby' },
  { key: 'tint', group: 'surface', label: 'Tint', kind: 'color', default: '#35CDBF' },
  { key: 'position', group: 'surface', label: 'Position', kind: 'vector3', default: [0, 0, 0], step: 0.1 },
];
const store = createInspectorStore(params);
export function Properties() {
  return <Inspector title="Properties" groups={groups} params={params} store={store} />;
}
```

Create the store once (outside render or with stable memoization). App and engine code can call `store.get()`, `store.set(key, value)`, `store.patch(values)`, and `store.reset(keys?)`. Use an existing `ParamStore` instead to bind directly to another engine. Stores must return stable immutable snapshots between changes.

Inspector props: `params`, `groups`, `store` (required); `title`, `subtitle`, `toolbar`, `searchable`, `advancedToggle`, `defaultAdvanced`, `storageKey`, `hide`, `maxHeight`, `variant`, `className`, `emptyMessage` (optional).

Additional schema types shared with `createParamPanes`: `text` (string; optional multiline/placeholder), `color` (hex string; optional alpha), `vector3` ([x,y,z]; optional min/max/step/decimals/unit). As with other schema fields, `advanced` and `when` are supported. This is a composed control inspector; use `createParamPanes` when you want parameter sections to move independently between dock panes.

## Documentation

Read them in this order. Every kit carries all four in its own `docs/`, so a project never needs this folder to keep working.

1. [`docs/design.md`](docs/design.md): the look and the feel, the three layout levels, the type systems and scale, what never to do, and the check to run on a screenshot. Read it first.
2. [`docs/catalogue.md`](docs/catalogue.md): every kind of every component (the slider faces, the control shapes, list looks, row states) and which to pick for a parameter.
3. [`docs/components.md`](docs/components.md): every prop, default and example, requirements and performance.
4. [`docs/theming.md`](docs/theming.md): the 108 themes, solid vs glass, scenes, density, token overrides, custom themes and every key token.

## Showcase

`showcase/artinos-ui-showcase.html` is a self-contained page: double-click it. It has three parts:
- **Gallery:** ten chapters: Foundations, Sliders, Controls, Rig, Actions, Display, Overlays, Layout system, Node graph, and Make it yours. A sticky index follows your place. Every component is live, in every theme, over a photo backdrop. Link straight to a look with `?theme=frost-deep&density=dense&backdrop=monstera`, or to a section with `#s-meters` / a chapter with `#c-overlays`.
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
- `--type <ids|all>` (type systems; `fine`, the default, always comes along);
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
    tokens/           tokens.css · themes.css · materials.css · type.css · fonts.css
    core/             ArtinosTheme · ThemedPortal · RollingValue · utils · hooks · motion · core.css
    slider/           Slider · RangeSlider · engine · HUD parts · slider.css
    controls/         NumberField · TextField · Switch · Checkbox · ToggleGroup · ChipGroup · Segmented
                      Select · ColorField · FileDrop · Knob · XYPad · controls.css + one sheet each
    rig/              ViewGizmo · Trackball · Vector3Field · TransformGizmo (three) · math · rig.css
    actions/          Button · IconButton · Toolbar · Kbd · Badge · Tag · actions.css
    display/          Stat · Meter · Spectrum · Progress · Sparkline · display.css
    layout/           Panel · Section · SectionGroup · Field · Text · StatStrip · Callout · Tabs
                      PropertyRow · ItemRow · layout.css + one sheet each
    overlays/         Menu · ContextMenu · Dialog · Toast · Tooltip · CommandPalette · overlays.css
    dock/             Dock · PanelBar · DockMenu · sections (createDockSections) · params (createParamPanes)
      metablock/        the docking engine: workspace model, layout, physics, WorkspaceView
    graph/            NodeGraph · LiveGraphView · graph model · editor · gpu.ts (three TSL, opt-in)
  docs/             design.md · catalogue.md · components.md · theming.md
  skill/            SKILL.md: the Claude Code skill (installed by the command)
  tools/            kit.mjs (kit builder) · zip.mjs: shared by the command and the showcase
  showcase/         Vite app: the chaptered gallery · Theme Studio · Export kit, plus the built page
  design/           design references only; nothing imports it
```

## Develop

```bash
cd showcase
pnpm install
pnpm dev     # http://localhost:5173 (studio at #studio, export at #export)
pnpm build   # type-check, then rebuild showcase/artinos-ui-showcase.html
```

Keep the guides in step with the code, in the same change (see `AGENTS.md`). After changing `skill/` or `docs/`, run `node artinos.mjs skill --user` to refresh installed copies. After adding or editing themes in `src/core/utils.ts`, run `node artinos.mjs sync`.
