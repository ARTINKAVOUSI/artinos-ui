# ARTINOS UI — instructions for AI agents

This folder is the ARTINOS UI package: a copy-paste React control system (sliders, fields, switches, selects, panels) with 52 glass, frost, studio and luxe themes. You are probably here because a user working in **another project** pointed you at this folder. This file tells you how to bring ARTINOS UI into that project correctly.

## Using ARTINOS UI in another project

Do the work in the **target project**. Only read from this folder, don't modify it. Everything below is driven by one command, `artinos.mjs` in this folder (Node 18+, no dependencies).

1. **Read the full workflow:** `skills/artinos-ui/SKILL.md`. It's short and covers framework detection, stylesheet wiring for Vite and Next.js, and common mistakes. The component API is in `skills/artinos-ui/references/components.md`; themes and tokens are in `skills/artinos-ui/references/theming.md`.

2. **Look at the target project:** React 18.3+ and `react-dom` in `package.json`; Vite or Next.js (App or Pages router); where the source lives; whether an `artinos-ui` kit already exists there (then update it, don't add a second one).

3. **Choose themes and components.** See everything with:
   ```bash
   node "D:/CODES26/ARTINOS-R3F/UI COMPONENT PACKAGE/artinos.mjs" list
   ```
   Use the themes and components the user named. If they didn't name themes, pick what fits the host and say which you picked:
   - dark app → `frost-deep` (the showcase default) or `studio`
   - light app → `studio-light` or `frost-light`
   - UI over a 3D canvas, video or photo → any glass/frost theme

   For components, include what the UI needs, plus `Panel` for grouped controls.

4. **Set up the project** (run in the target project's root):
   ```bash
   node "D:/CODES26/ARTINOS-R3F/UI COMPONENT PACKAGE/artinos.mjs" setup --project . --themes frost-deep,studio-light --components Slider,Select,Switch,Panel
   ```
   This writes a trimmed kit to `src/artinos-ui/` (or `artinos-ui/`; change it with `--out`). The kit contains:
   - only the chosen components, and every file they import;
   - only the chosen themes;
   - a matching `index.ts` and `artinos.css`;
   - a `README.md` with a usage snippet;
   - `docs/components.md` and `docs/theming.md`.

   It also installs the `artinos-ui` Claude Code skill into the project's `.claude/skills/`, and prints the wiring steps for the detected framework.

   Other options:
   - `--force` updates an existing kit.
   - `--dry-run` previews the files.
   - `--no-fonts` skips the Google Fonts import.
   - `--custom theme.css` adds a Theme Studio theme.
   - Use `export` instead of `setup` for the kit alone.

5. **Wire it and build the UI:**
   - Import `<kit>/artinos.css` once at the app root.
   - Import components from the kit folder.
   - Wrap the UI in `<ArtinosTheme theme="…">`.
   - Follow the kit's `docs/components.md` for props: `format`, `mapping`, `detents`, `onCommit`, `bipolar`, variants and so on.

6. **Verify:** run the project's type-check and build, then look at it in the browser. Confirm the theme id you used exists in the kit (`tokens/themes.css`); an unknown id silently falls back to the studio look.

Only `react` and `react-dom` are needed. No npm package, provider, Tailwind or build plugin. Don't restyle by editing kit files, because a re-export overwrites them. Use `tokens={{ … }}` on `ArtinosTheme` or CSS custom properties on a scope (see `docs/theming.md`).

## Working on this package itself

- `artinos-ui/` — the package source (its `README.md` is the full manual). Keep it portable: relative imports only, tokens instead of literal colours.
- `showcase/` — Vite app with the live gallery, Theme Studio (`#studio`) and Export kit (`#export`). Run `pnpm dev`; `pnpm build` rebuilds `showcase/artinos-ui-showcase.html`.
- `skills/artinos-ui/` — the Claude Code skill and `scripts/artinos-kit.mjs`, the command-line exporter. Its trimming logic mirrors `showcase/src/export/kit.ts`; change both together. After editing the skill, refresh installed copies with `node artinos.mjs skill --user`.
- `references/`, `docs/` — design sources and the written specification; nothing imports them.
