# ARTINOS UI — exported kit

A trimmed copy of ARTINOS UI with 3 components and 2 themes. Everything it needs is in this folder.

## Install

1. Copy this `kit/` folder into your project (e.g. `src/kit`).
2. Make sure `react` and `react-dom` are installed (React 18.3+; built and tested on React 19). There are no other dependencies.
3. Import the stylesheet once at the app root, then import components.

```tsx
import './kit/artinos.css';
import { ArtinosTheme, Panel, Slider } from './kit';

export function Controls() {
  return (
    <ArtinosTheme theme="onyx" type="luxe">
      <Panel title="Material">
        <Slider label="Roughness" defaultValue={0.52} />
      </Panel>
    </ArtinosTheme>
  );
}
```

Without React, any element with `data-ar-theme="onyx"` scopes the look too.

Notes:
- TypeScript source (`.tsx`), `strict`-clean. Any bundler that handles TSX and CSS `@import` works (Vite, Next, webpack).
- Component files start with `'use client'`; they are interactive and need the DOM.
- `tokens/fonts.css` loads Chivo, Chivo Mono, Inter, JetBrains Mono, Cormorant Garamond, IBM Plex Sans, IBM Plex Mono and Roboto Mono from Google Fonts. To self-host, delete that `@import` from `artinos.css`; every font stack falls back to system fonts.

## Guides

- `docs/components.md` — every component: props, defaults, examples, interaction, recipes.
- `docs/catalogue.md` — every kind of every component (the six slider faces, the control shapes, row states, overlays, the dock and graph), and which to pick for a given parameter. Read it before building a panel.
- `docs/theming.md` — choosing themes, glass vs solid, density, token overrides, custom themes, the theme list, key tokens.

The guides cover the whole ARTINOS UI package; this kit contains the components and themes listed here. To add themes or components, re-export into this folder from the project root:

```bash
node "D:/CODES26/ARTINOS-R3F/UI COMPONENT PACKAGE/artinos-ui/artinos.mjs" export --project . --themes <ids> --components <names> --force
```

## Type collections

One superfamily in two voices, a sans that speaks and a mono that measures, tuned for the family's sizes. `instrument` is what the tokens give; another is set with `<ArtinosTheme type="…">` or `data-ar-type` on any element, and carries through nested themes and portalled overlays.

| collection | faces |
|---|---|
| `instrument` (default) | Chivo · Chivo Mono — The default. Chivo and Chivo Mono, one grotesk superfamily with an engineering edge: crisp caps, even numerals, nothing decorative. |
| `luxe` | Inter · JetBrains Mono · Cormorant Garamond — A serif display over a neutral sans: Cormorant Garamond titles, Inter prose, JetBrains Mono readouts. Editorial luxury for the luxe themes. |
| `editorial` | IBM Plex Sans · IBM Plex Mono — IBM Plex, the superfamily with a drawn, editorial tone: open counters, a humanist rhythm and a mono with real character. |

## Themes

| theme | look |
|---|---|
| `studio` (base) | Studio-grade neutral dark. Satin controls, hairline edges, teal signal. The default. |
| `onyx` | Black smoked glass with fine gold hairlines, gold seams and ivory ink. A watch dial at night. |


## Components

- **Slider** — material · stepped · gradient · ruler · curve · wave
- **Select** — dropdown list
- **Panel · Section · Field** — glass panel and layout

## Files

```
kit/README.md
kit/artinos.css
kit/index.ts
kit/controls/controls.css
kit/controls/Select.tsx
kit/core/core.css
kit/core/hooks.ts
kit/core/motion.ts
kit/core/RollingValue.tsx
kit/core/Theme.tsx
kit/core/utils.ts
kit/docs/catalogue.md
kit/docs/components.md
kit/docs/theming.md
kit/layout/layout.css
kit/layout/Panel.tsx
kit/slider/engine.ts
kit/slider/parts.tsx
kit/slider/slider.css
kit/slider/Slider.tsx
kit/tokens/fonts.css
kit/tokens/materials.css
kit/tokens/themes.css
kit/tokens/tokens.css
kit/tokens/type.css
```
