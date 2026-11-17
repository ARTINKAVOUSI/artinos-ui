# ARTINOS UI — instructions for AI agents

This folder is the whole ARTINOS UI package: a copy-paste React control system (51 kit components, from sliders to a dockable workspace and a node editor) with 9 themes, its guides, a showcase and one command, `artinos.mjs` (Node 18+, no dependencies). You're probably here because a user working in **another project** pointed you at this folder.

## Bringing ARTINOS UI into another project

Do the work in the **target project**. Only read from this folder, don't modify it.

1. **Read the workflow:** [`skill/SKILL.md`](skill/SKILL.md). It covers framework detection, stylesheet wiring for Vite and Next.js, and common mistakes. `{{PACKAGE}}` in it means this folder. The rules of the look (the levels of a panel, the reading scale, layout, colour, what never to do) are in [`docs/design.md`](docs/design.md): read it before building anything. The component API is in [`docs/components.md`](docs/components.md); every kind of every component and which to pick for a parameter is in [`docs/catalogue.md`](docs/catalogue.md); themes and tokens are in [`docs/theming.md`](docs/theming.md).

2. **Look at the target project:**
   - React 18.3+ and `react-dom` in `package.json`;
   - Vite or Next.js (App or Pages router);
   - where its source lives;
   - whether a kit already exists there. If so, this is an update: follow *Updating a kit* in `skill/SKILL.md` (name everything the kit should hold, `--dry-run`, then `--force`, then fix the app to any renamed props). Never add a second kit.

3. **Choose themes and components.** List them with `node <this folder>/artinos.mjs list`. Use what the user named. If they named no theme, use the default, `nimbus` (soft carved Haze glass; `ArtinosTheme` sets it when `theme` is omitted), and say so. Otherwise:
   - flat dark app → `pro-gray`, a neutral software grey
   - light app → `studio-light`
   - over a 3D canvas, video or photo → any glass or frost theme, with `scene="light"` on `ArtinosTheme` when what is behind is light

   Pick the components the UI uses, plus `Panel` for grouped controls (it brings `Section`) and `ItemRow` for lists. Use `Dock` for an editor layout around a canvas, with `DockSections` and `Params` when sections move between panes or come from a schema. `GraphGPU` needs `three` and is only included when named.

4. **Set up the project** from its root:
   ```bash
   node "<this folder>/artinos.mjs" setup --project . --themes nimbus,studio-light --components Slider,Select,Switch,Panel
   ```
   This writes a trimmed kit to `src/artinos-ui/` (`--out` to change it). The kit holds only the chosen components and themes, plus `index.ts`, `artinos.css`, a `README.md` and the four guides in `docs/`. It also installs the Claude Code skill into the project's `.claude/skills/`, and prints the import lines for the detected entry file.

   Other options:
   - `export` instead of `setup` for the kit alone;
   - `--force` to update;
   - `--dry-run` to preview;
   - `--type instrument,salon` for type systems (twelve, `fine` the default and always included: one family `sleek`, `product`, `native`, `legible`; the pairings `instrument`, `salon`, `wide`, `grotesk`, `editorial`; and the hairline-and-heavy `fine`, `mass`, `round`), used with `<ArtinosTheme type="…">`;
   - `--no-fonts`, `--no-materials` and `--no-docs`;
   - `--custom theme.css` for Theme Studio themes.

5. **Wire it and build the UI:**
   - Import `<kit>/artinos.css` once at the app root.
   - Import components from the kit and wrap the UI in `<ArtinosTheme theme="…">`.
   - Build to `docs/design.md`: its feel (calm, exact, restrained), three levels built from the inside out (parts in a `Section`, sections in a `Panel`, panels in a `Dock` around a canvas), a name quiet and its answer loud, no type, colour or spacing of your own.
   - Pick each control's kind from `docs/catalogue.md` (a frequency is a log slider, a focal length a ruler, white balance a gradient, a count a stepped slider, an interval a RangeSlider…), then follow `docs/components.md` for props such as `format`, `mapping`, `detents`, `onCommit` and `bipolar`. Don't make every number a plain slider.
   - Restyle with tokens (`tokens={{ … }}` or CSS custom properties), never by editing kit files, because a re-export overwrites them.

6. **Verify:** run the project's type-check and build, then look in the browser and run the check at the end of `docs/design.md` on a screenshot. Check that the theme id you used exists in the kit's `tokens/themes.css`; an unknown id silently falls back to the studio look.

## Working on the package itself

- **`src/`** is the components. Keep them portable: relative imports only, tokens instead of literal colours, and `'use client'` on stateful files. Build new parts from the shared anatomy in `core/core.css` (`ar-well`, `ar-insert`, `ar-led`, `ar-text`, `ar-value`). Overlays portal through `ThemedPortal`. A folder's shared sheet (`folder/folder.css`) and a component's own `Name.css` are picked up by the kit builder, in the order of `src/artinos.css`. The theme registry (`THEMES` / `THEME_META`) is in `src/core/utils.ts`. A theme is a role block in `src/tokens/themes.css` plus a finish block in `src/tokens/materials.css`. After changing the registry, run `node artinos.mjs sync`. The type collections (`TYPE_COLLECTIONS` / `TYPE_META`, one entry per line so the kit builder can read it) are in the same file; a collection is a `[data-ar-type='…']` block in `src/tokens/type.css`, and its faces are named in `TYPE_META.fonts` (the kit builder writes `fonts.css` from it) and in `src/tokens/fonts.css` for the showcase.
- **`docs/`** holds the four guides: `design.md` (the rules of the look: when a type, ink or spacing token changes, its tables change in the same edit), `components.md` (the prop reference), `catalogue.md` (every kind of every component, and which to pick) and `theming.md`. They ship inside every kit and the installed skill, so write them for someone using a kit. A new variant or state goes into the catalogue as well as the API guide.
- **Keep the guides in step with the code, in the same change.** A new or removed prop goes into `components.md` and `catalogue.md`; a change to how things look or are composed goes into `design.md`; a prop that breaks existing app code goes into the *Updating a kit* notes in `skill/SKILL.md`. A kit carries the guides, so a project learns only what they say.
- **`skill/SKILL.md`** is the skill template (`{{PACKAGE}}` is filled in on install). After changing it or `docs/`, run `node artinos.mjs skill --user`.
- **`tools/kit.mjs`** is the one kit builder, used by both `artinos.mjs export` and the showcase Export kit. It's pure: source text in, files out. **`tools/zip.mjs`** writes .zip files.
- **`showcase/`** is the Vite app.
  - Its source is laid out as `src/app` (shell, hero and page index), `chapters` (one file per chapter, plus `registry.ts`), `shared`, `studio` (Theme Studio), `export` (Export kit) and `assets`.
  - `chapters/registry.ts` is the page's structure: chapters, their sections, and the components each covers. The page, the sidebar index and every section number read from it, so add or move a section there first, then give its `<Spec id=…>` content in the chapter file.
  - Use `pnpm dev` while working, and `pnpm build` to type-check and rebuild `artinos-ui-showcase.html`.
- **`design/`** holds references only; nothing imports it.
