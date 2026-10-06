# ARTINOS UI — instructions for AI agents

This folder is the whole ARTINOS UI package: a copy-paste React control system with 52 themes, its guides, a showcase and one command, `artinos.mjs` (Node 18+, no dependencies). You're probably here because a user working in **another project** pointed you at this folder.

## Bringing ARTINOS UI into another project

Do the work in the **target project**. Only read from this folder, don't modify it.

1. **Read the workflow:** [`skill/SKILL.md`](skill/SKILL.md). It covers framework detection, stylesheet wiring for Vite and Next.js, and common mistakes. `{{PACKAGE}}` in it means this folder. The component API is in [`docs/components.md`](docs/components.md); themes and tokens are in [`docs/theming.md`](docs/theming.md).

2. **Look at the target project:**
   - React 18.3+ and `react-dom` in `package.json`;
   - Vite or Next.js (App or Pages router);
   - where its source lives;
   - whether a kit already exists there. If so, update it with `--force`; don't add a second one.

3. **Choose themes and components.** List them with `node <this folder>/artinos.mjs list`. Use what the user named. If they named no theme, pick one that fits and say which:
   - dark app → `frost-deep` or `studio`
   - light app → `studio-light` or `frost-light`
   - over a 3D canvas, video or photo → any glass or frost theme

   Pick the components the UI uses, plus `Panel` for grouped controls.

4. **Set up the project** from its root:
   ```bash
   node "<this folder>/artinos.mjs" setup --project . --themes frost-deep,studio-light --components Slider,Select,Switch,Panel
   ```
   This writes a trimmed kit to `src/artinos-ui/` (`--out` to change it). The kit holds only the chosen components and themes, plus `index.ts`, `artinos.css`, a `README.md` and the two guides in `docs/`. It also installs the Claude Code skill into the project's `.claude/skills/`, and prints the import lines for the detected entry file.

   Other options:
   - `export` instead of `setup` for the kit alone;
   - `--force` to update;
   - `--dry-run` to preview;
   - `--no-fonts`, `--no-materials` and `--no-docs`;
   - `--custom theme.css` for Theme Studio themes.

5. **Wire it and build the UI:**
   - Import `<kit>/artinos.css` once at the app root.
   - Import components from the kit and wrap the UI in `<ArtinosTheme theme="…">`.
   - Follow `docs/components.md` for props such as `format`, `mapping`, `detents`, `onCommit`, `bipolar` and the variants.
   - Restyle with tokens (`tokens={{ … }}` or CSS custom properties), never by editing kit files, because a re-export overwrites them.

6. **Verify:** run the project's type-check and build, then look in the browser. Check that the theme id you used exists in the kit's `tokens/themes.css`; an unknown id silently falls back to the studio look.

## Working on the package itself

- **`src/`** is the components. Keep them portable: relative imports only, tokens instead of literal colours, and `'use client'` on stateful files. The theme registry (`THEMES` / `THEME_META`) is in `src/core/utils.ts`. A theme is a role block in `src/tokens/themes.css` plus a finish block in `src/tokens/materials.css`. After changing the registry, run `node artinos.mjs sync`.
- **`docs/`** holds the two guides. They ship inside every kit and the installed skill, so write them for someone using a kit.
- **`skill/SKILL.md`** is the skill template (`{{PACKAGE}}` is filled in on install). After changing it or `docs/`, run `node artinos.mjs skill --user`.
- **`tools/kit.mjs`** is the one kit builder, used by both `artinos.mjs export` and the showcase Export kit. It's pure: source text in, files out. **`tools/zip.mjs`** writes .zip files.
- **`showcase/`** is the Vite app.
  - Its source is laid out as `src/app` (shell and page), `gallery`, `shared`, `studio` (Theme Studio), `export` (Export kit) and `assets`.
  - Use `pnpm dev` while working, and `pnpm build` to type-check and rebuild `artinos-ui-showcase.html`.
- **`design/`** holds references only; nothing imports it.
