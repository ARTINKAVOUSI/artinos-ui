# ARTINOS UI

A precision-instrument control system for React. Each parameter is one compact surface: the capsule is the control, the seam is the handle, the readout is the precision zone. Sliders, ranges, number fields, switches, toggles, segmented controls, colour fields, selects, panels and tabs, on a token-based design system with **52 themes**: glass, frost, studio, atelier and luxe.

**copy → paste → import → use.** Only `react` and `react-dom` (18.3+). No npm package, provider, build plugin or Tailwind.

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
- **Gallery:** every component in every theme, over a photo backdrop. Link straight to a look with `?theme=ice&density=dense&backdrop=monstera`.
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
    core/             ArtinosTheme · RollingValue · utils · hooks · core.css
    slider/           Slider · RangeSlider · engine · HUD parts · slider.css
    controls/         NumberField · Switch · ToggleGroup · Segmented · ColorField · Select · controls.css
    layout/           Panel · Section · Field · Tabs · layout.css
  docs/             components.md · theming.md
  skill/            SKILL.md: the Claude Code skill (installed by the command)
  tools/            kit.mjs (kit builder) · zip.mjs: shared by the command and the showcase
  showcase/         Vite app: gallery · Theme Studio · Export kit, plus the built page
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
