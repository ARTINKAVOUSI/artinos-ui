# ARTINOS UI — Showcase & Theme Studio

A live specimen of every component and theme in `../artinos-ui`, plus a full theme editor. It imports the package exactly as a consuming app would, and is not part of the package.

- **Just open it:** `artinos-ui-showcase.html` is self-contained (scripts, styles and backdrop images are inlined). Double-click it; only the typefaces load from Google Fonts.
- **Link to a look:** `artinos-ui-showcase.html?theme=ice&density=dense&backdrop=monstera` (backdrop: `garden` · `monstera` · `none`).
- **Theme Studio:** the *Theme Studio →* button in the top bar, or `artinos-ui-showcase.html#studio`.
- **Export kit:** the *Export kit ↓* button in the top bar, or `artinos-ui-showcase.html#export`.

## Export kit

Pick themes and components; get a trimmed, ready-to-paste folder containing exactly what they need.

- **Themes.** Any of the built-in themes, grouped by family (with *all* / *none* per family), plus any themes you saved in the Theme Studio. `studio` is always included: it is the base every theme builds on.
- **Components.** Slider, RangeSlider, NumberField, Switch, ToggleGroup, Segmented, ColorField, Select, Panel · Section · Field, Tabs and RollingValue. The files each one imports (hooks, formatting, the precision HUD, option helpers, the theme scope) come along automatically; nothing else does.
- **What's generated:**
  - `tokens/themes.css` and `tokens/materials.css` cut down to the chosen themes. Rules shared between themes keep only the chosen members.
  - `core/utils.ts` with `THEMES` / `THEME_META` limited to them, so the `ThemeName` type matches.
  - `tokens/custom-themes.css` for saved themes: every token resolved, so it needs no base theme.
  - `index.ts` and `artinos.css` that import only what's in the kit.
  - A `README.md` with install steps, a usage snippet for your picks, the theme table and the file list.
- **Options.** Folder name, Google Fonts on or off, and whether to keep the optional finish overrides (`material` prop).
- **Output.** *Download .zip*, or *Write to folder…* to write straight into a project folder (Chromium browsers). Click any file in the list to preview it.

The kit needs only `react` and `react-dom`.

## Theme Studio

Tune every token of a theme while the complete component gallery updates live beside you.

- **Library.** Start from any of the 52 built-in themes, or open one you saved. The Untinted collection appears first: Air, Polished, Lens and Layered glass; Etched, Silk, Mist and Deep frost. These use transparent panel bases, neutral reflections and the default shapes and typography. The Atelier collection remains available. Create, save, save as new, duplicate, rename or delete themes, and import a theme JSON.
- **Parameters.** Grouped, with search:
  - Ground and surfaces, ink, lines and ticks, signal and status (including the focus ring).
  - Panel glass: tint, backdrop blur, saturate, brightness, contrast, sheen, edge, depth and text halo.
  - Floating layers, the control well (trough, depth, edge, lip, radius, inset) and the insert (body gradient, gloss, rim, outline, drop, backdrop, ink, halo).
  - Ink on the well, seam and LEDs, cells, gradients and rulers, typography (faces, weights, tracking, sizes), and size and motion.
  - An **All tokens** table where you can edit any raw token.
- **Inspect.** Press *Inspect* (or `I`) and click any part of any component in the preview: a seam, an insert, a label, a well, a panel. The side panel opens a **Selected** group with exactly the parameters that part reads, followed by its container's. Those rows are also marked in the full list, and the element stays outlined while you edit. Escape clears it.
- **Type any value.** Every parameter has a value field next to its control, including the numeric parts of composite groups and the whole CSS value of each group. Press Enter to apply, Escape to cancel, ↑/↓ to nudge (Shift ×10, Alt ×0.1). A bare number gets its unit, and clearing a field resets it. You can also double-click any slider's readout to type straight into it.
- **Workflow.** Each parameter shows when it's changed and has its own reset; whole groups can be reset too. Undo and redo with Ctrl+Z and Ctrl+Shift+Z. Compare against the base theme, and switch the backdrop and density.
- **Export.**
  - **CSS**: a standalone `[data-ar-theme='your-theme']` block with every resolved token. Load it after `artinos.css` and use `<ArtinosTheme theme="your-theme">`.
  - **JSON**: re-importable into the studio.
  - **TSX**: the overrides as `ArtinosTheme` `tokens`.
- **Use in showcase.** Saved themes appear in the showcase theme picker.

Saved themes are kept in this browser's local storage. Export anything you want to keep or share.

## Develop

```bash
pnpm install
pnpm dev          # live page at http://localhost:5173 (studio at /#studio)
pnpm build        # typecheck, then rebuild artinos-ui-showcase.html
```

### Source layout

```
src/
  main.tsx                  entry: stylesheets + <App />
  app/
    App.tsx                 shell: theme · density · backdrop state, routing (page · #studio · #export), top bar, page
    foundations.tsx         Foundations sections: token table, theme cards, quick-token builder
    app.css                 page styles (sc-*)
  gallery/
    ComponentGallery.tsx    every component, sections 01–20; shared by the page and the studio preview
  shared/
    index.tsx               swatches, theme and backdrop options, icons, page parts (Spec · Part · Code)
  studio/                   Theme Studio
    ThemeStudio.tsx         the editor
    spec.ts                 parameter model (groups, controls, token names)
    values.ts               colour, shadow, gradient and filter parsing
    inspect.ts              Inspect: which tokens a clicked part reads
    store.ts                saved themes, CSS · JSON · TSX export
    studio.css
  export/                   Export kit
    ExportKit.tsx           the dialog
    kit.ts                  builds the trimmed folder from the package source
    zip.ts                  dependency-free .zip writer
    export.css
  assets/                   backdrops
```

Backdrops in `src/assets/` are web-size copies of the reference photos in `../references/imagery/`: `persian-garden.jpg` and `monstera.jpg`.
