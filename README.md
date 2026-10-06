# ARTINOS UI — component package

A precision-instrument control system for React: sliders, ranges, fields, switches, selects and panels on a token-based design system with 52 themes.

> **AI agents:** if a user pointed you at this folder from another project, read [`AGENTS.md`](AGENTS.md) first. One command sets their project up.

## Use it in another project

From the other project's root folder:

```bash
# see every theme and component
node "D:/CODES26/ARTINOS-R3F/UI COMPONENT PACKAGE/artinos.mjs" list

# add a kit with the themes and components you want (+ guides, + the Claude Code skill)
node "D:/CODES26/ARTINOS-R3F/UI COMPONENT PACKAGE/artinos.mjs" setup --project . --themes frost-deep,onyx --components Slider,Select,Switch,Panel
```

Then import `src/artinos-ui/artinos.css` once at the app root and use the components; `setup` prints the exact lines for your framework. The kit's `README.md` and `docs/` explain everything that's in it. To change themes or components later, run `export` with `--force`.

With Claude Code you can also just ask, in any project: *"add an ARTINOS UI inspector panel using D:\CODES26\ARTINOS-R3F\UI COMPONENT PACKAGE, with the frost-deep and onyx themes"*. The `artinos-ui` skill and `AGENTS.md` walk it through the same steps.

Other ways to get a kit: the Export kit in the showcase (`showcase/artinos-ui-showcase.html#export`, which can also include themes you saved in the Theme Studio), or copying the whole `artinos-ui/` folder (all 52 themes and all components).

## What's in this folder

```
artinos.mjs        one command: list · setup · export · skill
AGENTS.md          instructions for AI agents (CLAUDE.md loads it)

artinos-ui/        THE PACKAGE — React + react-dom only
  artinos.css        single stylesheet entry
  index.ts           public exports
  tokens/            tokens.css · themes.css · materials.css · fonts.css
  core/              ArtinosTheme · RollingValue · utils · hooks · options · core.css
  slider/            Slider · RangeSlider · engine · HUD parts · slider.css
  controls/          NumberField · Switch · ToggleGroup · Segmented · ColorField · Select · controls.css
  layout/            Panel · Section · Field · Tabs · layout.css

skills/            Claude Code skill for using ARTINOS UI in other projects
  artinos-ui/        SKILL.md · references/ (component API, theming) · scripts/artinos-kit.mjs
  artinos-ui.skill   the same, packaged for sharing / installing

showcase/          live demo, Theme Studio and Export kit (a Vite app that imports ../artinos-ui)
  artinos-ui-showcase.html   self-contained build — just open it
  src/               app · gallery · shared · studio · export · assets

docs/              written specification (slider-vision.txt)
references/        design references, imagery, Figma snippets and the original prototype
```

## More

- **The full manual:** [`artinos-ui/README.md`](artinos-ui/README.md).
- **See everything / design a theme:** open `showcase/artinos-ui-showcase.html` (Theme Studio at `#studio`).
- **Skill:** `node artinos.mjs skill --user` installs or refreshes it for every project (`~/.claude/skills/artinos-ui`); `setup` also installs it into the target project. Refresh after editing `skills/artinos-ui/`.
- **Work on the showcase:** see [`showcase/README.md`](showcase/README.md) (`pnpm install`, `pnpm dev`, `pnpm build`).
