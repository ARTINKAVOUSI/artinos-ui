/* ARTINOS UI — kit builder. The one implementation behind `artinos.mjs export` and the
   showcase Export kit. Pure: package source text in, kit files out (no file system).

   A kit is a trimmed, copy-paste copy of src/: only the picked components and every
   file they import, only the picked themes in the token CSS, and an index.ts,
   artinos.css and README.md to match (plus docs/ when given). */

export const BASE_THEME = 'studio';
/** ArtinosTheme's default theme: every kit carries it beside the base. */
export const DEFAULT_THEME = 'nimbus';
/** Earlier theme ids, still accepted on the command line. */
export const THEME_ALIASES = { 'haze-carve-custom': 'nimbus' };

export const COMPONENTS = [
  { group: 'Sliders', id: 'Slider', label: 'Slider', file: 'slider/Slider.tsx', note: 'material · stepped · gradient · ruler · curve · wave' },
  { group: 'Sliders', id: 'RangeSlider', label: 'RangeSlider', file: 'slider/RangeSlider.tsx', note: 'two seams, one span' },
  { group: 'Sliders', id: 'Knob', label: 'Knob', file: 'controls/Knob.tsx', note: 'rotary value' },
  { group: 'Sliders', id: 'XYPad', label: 'XYPad', file: 'controls/XYPad.tsx', note: 'two values on one pad' },
  { group: 'Controls', id: 'NumberField', label: 'NumberField', file: 'controls/NumberField.tsx', note: 'scrub or type a number' },
  { group: 'Controls', id: 'TextField', label: 'TextField', file: 'controls/TextField.tsx', note: 'text input' },
  { group: 'Controls', id: 'Switch', label: 'Switch', file: 'controls/Switch.tsx', note: 'shutter or compact' },
  { group: 'Controls', id: 'Checkbox', label: 'Checkbox', file: 'controls/Checkbox.tsx', note: 'a choice in a form or list' },
  { group: 'Controls', id: 'ToggleGroup', label: 'ToggleGroup', file: 'controls/ToggleGroup.tsx', note: 'independent flags' },
  { group: 'Controls', id: 'ChipGroup', label: 'ChipGroup', file: 'controls/ChipGroup.tsx', note: 'wrapping chips: tags, moods, filters' },
  { group: 'Controls', id: 'Segmented', label: 'Segmented', file: 'controls/Segmented.tsx', note: 'one of a few' },
  { group: 'Controls', id: 'Select', label: 'Select', file: 'controls/Select.tsx', note: 'dropdown list' },
  { group: 'Controls', id: 'ColorField', label: 'ColorField', file: 'controls/ColorField.tsx', note: 'hex + alpha' },
  { group: 'Controls', id: 'FileDrop', label: 'FileDrop', file: 'controls/FileDrop.tsx', note: 'drop or pick files' },
  { group: 'Rig', id: 'ViewGizmo', label: 'ViewGizmo', file: 'rig/ViewGizmo.tsx', note: 'camera orientation ball: orbit and snap to an axis' },
  { group: 'Rig', id: 'Trackball', label: 'Trackball', file: 'rig/Trackball.tsx', note: 'object rotation: tumble, axis rings, roll' },
  { group: 'Rig', id: 'Vector3Field', label: 'Vector3Field', file: 'rig/Vector3Field.tsx', note: 'X · Y · Z in a row, linkable' },
  { group: 'Rig', id: 'TransformGizmo', label: 'TransformGizmo', file: 'rig/TransformGizmo.ts', note: 'move · rotate · scale handles inside a three.js scene (needs three)' },
  { group: 'Actions', id: 'Button', label: 'Button', file: 'actions/Button.tsx', note: 'default · primary · ghost · danger' },
  { group: 'Actions', id: 'IconButton', label: 'IconButton', file: 'actions/IconButton.tsx', note: 'square icon action' },
  { group: 'Actions', id: 'Toolbar', label: 'Toolbar', file: 'actions/Toolbar.tsx', note: 'a row of actions' },
  { group: 'Actions', id: 'Kbd', label: 'Kbd', file: 'actions/Kbd.tsx', note: 'key cap' },
  { group: 'Actions', id: 'Badge', label: 'Badge', file: 'actions/Badge.tsx', note: 'status tag' },
  { group: 'Actions', id: 'Tag', label: 'Tag', file: 'actions/Tag.tsx', note: 'a small fact beside a value' },
  { group: 'Display', id: 'Meter', label: 'Meter', file: 'display/Meter.tsx', note: 'level bar' },
  { group: 'Display', id: 'Spectrum', label: 'Spectrum', file: 'display/Spectrum.tsx', note: 'a bank of level bars for frequency and audio' },
  { group: 'Display', id: 'Sparkline', label: 'Sparkline', file: 'display/Sparkline.tsx', note: 'inline trend line' },
  { group: 'Display', id: 'Stat', label: 'Stat', file: 'display/Stat.tsx', note: 'a figure with its change and trend' },
  { group: 'Display', id: 'Progress', label: 'Progress', file: 'display/Progress.tsx', note: 'a task under way' },
  { group: 'Display', id: 'RollingValue', label: 'RollingValue', file: 'core/RollingValue.tsx', note: 'rolling-digit readout' },
  { group: 'Layout', id: 'Panel', label: 'Panel · Section · SectionGroup · Field', file: 'layout/Panel.tsx', note: 'glass panel, groups, accordion and layout' },
  { group: 'Layout', id: 'Tabs', label: 'Tabs', file: 'layout/Tabs.tsx', note: 'tab bar' },
  { group: 'Layout', id: 'PropertyRow', label: 'PropertyRow', file: 'layout/PropertyRow.tsx', note: 'label · control inspector row' },
  { group: 'Layout', id: 'Text', label: 'Text · Stack · Inline', file: 'layout/Text.tsx', note: 'type roles and spacing primitives' },
  { group: 'Layout', id: 'StatStrip', label: 'StatStrip', file: 'layout/StatStrip.tsx', note: 'key figures side by side at the top of a panel' },
  { group: 'Layout', id: 'Callout', label: 'Callout', file: 'layout/Callout.tsx', note: 'note · tip · warn · fault, set apart from the text' },
  { group: 'Layout', id: 'ItemRow', label: 'ItemList · ItemGroup · ItemRow', file: 'layout/ItemRow.tsx', note: 'lists of things: trees, thumbnails, tiles, cards' },
  { group: 'Overlays', id: 'Menu', label: 'Menu · ContextMenu', file: 'overlays/Menu.tsx', note: 'dropdown and right-click menus' },
  { group: 'Overlays', id: 'Dialog', label: 'Dialog', file: 'overlays/Dialog.tsx', note: 'modal' },
  { group: 'Overlays', id: 'Toast', label: 'Toast', file: 'overlays/Toast.tsx', note: 'notifications' },
  { group: 'Overlays', id: 'Tooltip', label: 'Tooltip', file: 'overlays/Tooltip.tsx', note: 'hover and focus hints' },
  { group: 'Overlays', id: 'CommandPalette', label: 'CommandPalette', file: 'overlays/CommandPalette.tsx', note: 'Ctrl/⌘ K search' },
  { group: 'Dock', id: 'Dock', label: 'Dock', file: 'dock/Dock.tsx', note: 'studio workspace: docks, tabs, floating panels' },
  { group: 'Dock', id: 'DockSections', label: 'createDockSections', file: 'dock/sections.tsx', note: 'sections that move between panes and tear off into panels' },
  { group: 'Dock', id: 'Params', label: 'createParamPanes · ParamSection · ParamControl', file: 'dock/params.tsx', note: 'settings from a schema: the right control per value, groups, dockable panes' },
  { group: 'Inspector', id: 'Inspector', label: 'Inspector · createInspectorStore', file: 'inspector/Inspector.tsx', note: 'optional searchable property editor: groups, advanced, reset, colour, vector and text' },
  { group: 'Dock', id: 'MetaBlock', label: 'MetaBlock engine', file: 'dock/metablock/WorkspaceView.tsx', note: 'the docking engine alone' },
  { group: 'Graph', id: 'NodeGraph', label: 'NodeGraph', file: 'graph/NodeGraph.tsx', note: 'node editor' },
  { group: 'Graph', id: 'LiveGraphView', label: 'LiveGraphView', file: 'graph/LiveGraphView.tsx', note: 'read-only live graph' },
  { group: 'Graph', id: 'GraphGPU', label: 'Graph → TSL', file: 'graph/gpu.ts', note: 'compile graphs to three.js TSL (needs three)' },
];

/** Always shipped: the theme scope and the shared helpers every component uses. */
const CORE = ['core/Theme.tsx', 'core/utils.ts'];

/* ---------- theme registry (read from core/utils.ts, the source of truth) ---------- */

const META_RE = /^ {2}(?:'([^']+)'|([\w-]+)): \{ label: '([^']*)', family: '([^']+)', kind: '(\w+)', description: '((?:[^'\\]|\\.)*)'/;

/** THEMES in registry order and THEME_META, parsed from the package source. */
export function readRegistry(sources) {
  const utils = sources['core/utils.ts'];
  const themes = [...utils.match(/export const THEMES = \[([\s\S]*?)\] as const;/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const meta = {};
  for (const line of utils.split('\n')) {
    const m = line.match(META_RE);
    if (m) meta[m[1] ?? m[2]] = { label: m[3], family: m[4], kind: m[5], description: m[6].replace(/\\'/g, "'"), parent: line.match(/, parent: '([^']+)'/)?.[1] };
  }
  // the heroes (no parent), in HERO_RANK order, as HERO_THEMES has them
  const rank = Object.fromEntries([...(utils.match(/const HERO_RANK[^{]*\{([^}]*)\}/)?.[1] ?? '').matchAll(/'?([\w-]+)'?: (\d+)/g)].map((r) => [r[1], +r[2]]));
  const heroes = themes.filter((t) => meta[t] && !meta[t].parent).sort((a, b) => (rank[a] ?? 99) - (rank[b] ?? 99));
  return { themes, meta, heroes };
}

/* ---------- type collections (read from core/utils.ts, one entry per line) ---------- */

export const BASE_TYPE = 'fine';
/** Earlier type ids, still accepted on the command line. */
export const TYPE_ALIASES = { manrope: 'sleek', code: 'sleek', form: 'sleek', quiet: 'sleek', geist: 'sleek', terminal: 'sleek', modern: 'sleek', industrial: 'sleek', 'sleek-air': 'sleek', 'sleek-sharp': 'sleek', 'sleek-compact': 'sleek', pro: 'product', neue: 'product', 'red-hat': 'round', mona: 'wide', swiss: 'product', bold: 'product', jakarta: 'product', character: 'product', bricolage: 'product', clean: 'product', onest: 'product', figtree: 'product', 'sleek-serif': 'editorial', book: 'editorial', source: 'editorial', couture: 'editorial', luxe: 'editorial', contrast: 'editorial', atelier: 'editorial', newsroom: 'editorial', schibsted: 'editorial', soft: 'editorial', hyperlegible: 'legible' };
const TYPE_RE = /^ {2}(?:'([^']+)'|([\w-]+)): \{ label: '([^']*)', ui: '([^']*)', mono: '([^']*)', display: '([^']*)', (?:serif: '([^']*)', )?description: '((?:[^'\\]|\\.)*)', fonts: '([^']*)' \}/;

/** TYPE_COLLECTIONS in registry order and TYPE_META, parsed from the package source. */
export function readTypes(sources) {
  const utils = sources['core/utils.ts'];
  const types = [...utils.match(/export const TYPE_COLLECTIONS = \[([\s\S]*?)\] as const;/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const meta = {};
  for (const line of utils.split('\n')) {
    const m = line.match(TYPE_RE);
    if (m) meta[m[1] ?? m[2]] = { label: m[3], ui: m[4], mono: m[5], display: m[6], serif: m[7] ?? '', description: m[8].replace(/\\'/g, "'"), fonts: m[9] };
  }
  return { types, meta };
}

/** The faces a set of collections uses, in order, each once. */
export const facesOf = (types, tmeta) => [...new Set(types.flatMap((t) => [tmeta[t].display, tmeta[t].ui, tmeta[t].serif, tmeta[t].mono].filter(Boolean)))];

/** tokens/fonts.css for a kit: one Google Fonts request naming each family once. */
function buildFontsCss(types, tmeta) {
  const params = new Map();
  const share = new Map(); // Fontshare faces: f[]=slug@weights
  for (const t of types) for (const p of tmeta[t].fonts.split('&').filter(Boolean)) (p.startsWith('f[]=') ? share : params).set(p.split(/[:@]/)[0], p);
  params.set('family=Roboto+Mono', 'family=Roboto+Mono:wght@500;700');
  const fontshare = share.size ? `@import url('https://api.fontshare.com/v2/css?${[...share.values()].join('&')}&display=swap');\n` : '';
  const list = types.map((t) => `${t.padEnd(12)}${facesOf([t], tmeta).join(' · ')}`).join('\n *   ');
  return `/* ARTINOS UI — typefaces for the type collections in this kit (tokens/type.css):
 *   ${list}
 * plus Roboto Mono for the reference theme. Loaded from Google Fonts at the weights the type
 * tokens name. To self-host, delete this import from artinos.css and declare the same families
 * with @font-face; every stack falls back to system fonts. */
@import url('https://fonts.googleapis.com/css2?${[...params.values()].join('&')}&display=swap');
${fontshare}`;
}

/* ---------- dependency graph ---------- */

const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s+'(\.{1,2}\/[^']+)'/g;

function resolve(sources, from, spec) {
  const parts = from.split('/').slice(0, -1);
  for (const seg of spec.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  const base = parts.join('/');
  for (const cand of [base, base + '.ts', base + '.tsx', base + '/index.ts']) if (cand in sources) return cand;
  return null;
}

function closure(sources, entries) {
  const seen = new Set();
  const walk = (f) => {
    if (seen.has(f) || !(f in sources)) return;
    seen.add(f);
    for (const m of sources[f].matchAll(IMPORT_RE)) {
      const r = resolve(sources, f, m[1]);
      if (r) walk(r);
    }
  };
  entries.forEach(walk);
  return [...seen];
}

/* ---------- CSS trimming (themes.css / materials.css are flat rule lists) ---------- */

const themesIn = (s) => [...s.matchAll(/data-ar-theme='([^']+)'/g)].map((m) => m[1]);
const materialsIn = (s) => [...s.matchAll(/data-ar-material='([^']+)'/g)].map((m) => m[1]);
const typesIn = (s) => [...s.matchAll(/data-ar-type='([^']+)'/g)].map((m) => m[1]);

/** Split on commas that are not inside parentheses. */
function splitTop(s) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** Keep a selector only if `ok` accepts every item it names; trims :is() lists. */
function filterSelector(sel, ok) {
  const kept = [];
  let changed = false;
  for (const raw of splitTop(sel)) {
    let dropped = false;
    const p = raw.replace(/:is\(((?:[^()]|\([^()]*\))*)\)/g, (m, inner) => {
      const items = splitTop(inner).map((x) => x.trim());
      const left = items.filter((x) => ok(x));
      if (left.length === items.length) return m;
      changed = true;
      if (!left.length) dropped = true;
      return ':is(' + left.join(', ') + ')';
    });
    if (dropped || !ok(p.replace(/:is\((?:[^()]|\([^()]*\))*\)/g, ''))) {
      changed = true;
      continue;
    }
    kept.push(p);
  }
  if (!kept.length) return null;
  return changed ? kept.map((s) => s.trim()).join(',\n') : sel;
}

/** Filter rule by rule with `ok(selector)`; a comment travels with the rule after it; the file header is replaced. */
function trimCss(css, ok, header) {
  const out = [];
  let i = 0;
  let pending = '';
  let first = true;
  while (i < css.length) {
    const ws = css.slice(i).match(/^\s+/);
    if (ws) {
      pending += ws[0];
      i += ws[0].length;
      continue;
    }
    if (css.startsWith('/*', i)) {
      const end = css.indexOf('*/', i + 2);
      const c = css.slice(i, end + 2);
      i = end + 2;
      if (first) {
        out.push(header);
        first = false;
        pending = '';
      } else pending += c;
      continue;
    }
    first = false;
    const open = css.indexOf('{', i);
    const close = css.indexOf('}', open);
    if (open < 0 || close < 0) break;
    const sel = css.slice(i, open);
    const body = css.slice(open, close + 1);
    i = close + 1;
    const next = filterSelector(sel.trim(), ok);
    if (next) out.push(pending.replace(/^\n{3,}/, '\n\n') + next + ' ' + body);
    pending = '';
  }
  return out.join('').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/* ---------- source rewrites ---------- */

function trimUtils(src, ordered, materials) {
  const rows = [];
  for (let k = 0; k < ordered.length; k += 4) rows.push('  ' + ordered.slice(k, k + 4).map((t) => `'${t}'`).join(', ') + ',');
  let s = src.replace(/export const THEMES = \[[\s\S]*?\] as const;/, `export const THEMES = [\n${rows.join('\n')}\n] as const;`);
  const start = s.indexOf('export const THEME_META');
  const end = s.indexOf('\n};', start);
  const block = s
    .slice(start, end)
    .split('\n')
    .filter((line) => {
      const m = line.match(/^ {2}(?:'([^']+)'|([\w-]+)): \{ label:/);
      return !m || ordered.includes(m[1] ?? m[2]);
    })
    // a variation whose hero is not in the kit becomes a hero there
    .map((line) => line.replace(/, parent: '([^']+)'/, (p, hero) => (ordered.includes(hero) ? p : '')))
    .join('\n');
  s = s.slice(0, start) + block + s.slice(end);
  if (!materials) s = s.replace(/export const MATERIALS = \[[^\]]*\] as const;/, 'export const MATERIALS = [] as const; // finish overrides were left out of this kit');
  return s;
}

function buildIndex(sources, files) {
  const lines = sources['index.ts'].split('\n').filter((line) => {
    // only export statements are trimmed; a comment that quotes a path is left alone
    const m = line.match(/^export .* from '(\.\/[^']+)'/);
    if (!m) return true;
    const r = resolve(sources, 'index.ts', m[1]);
    return !!r && files.has(r);
  });
  // drop section comments left with nothing under them
  const out = [];
  lines.forEach((line, k) => {
    if (/^\/\/ /.test(line)) {
      const next = lines.slice(k + 1).find((l) => l.trim() !== '');
      if (!next || next.startsWith('//')) return;
    }
    out.push(line);
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function buildCssEntry(o, cssFiles) {
  const imports = [
    o.googleFonts ? './tokens/fonts.css' : null,
    './tokens/tokens.css',
    './tokens/themes.css',
    './tokens/materials.css',
    './tokens/type.css',
    o.customs.length ? './tokens/custom-themes.css' : null,
    ...cssFiles.map((f) => './' + f),
  ].filter(Boolean);
  return `/* ARTINOS UI — single stylesheet entry. Import once, at the app root:
     import './${o.folder}/artinos.css';
   Order matters: tokens → themes → materials → components. */
${imports.map((p) => `@import '${p}';`).join('\n')}
`;
}

function buildReadme(o, meta, themes, comps, files, types, tmeta) {
  const firstTheme = o.themes.find((t) => t !== BASE_THEME) ?? o.customs[0]?.slug ?? BASE_THEME;
  const firstType = types.find((t) => t !== BASE_TYPE);
  const faces = facesOf(types, tmeta);
  const has = (id) => comps.some((c) => c.id === id);
  const demo = [];
  if (has('Slider')) demo.push(`      <Slider label="Roughness" defaultValue={0.52} />`);
  if (has('RangeSlider')) demo.push(`      <RangeSlider label="Band" defaultValue={[0.25, 0.7]} />`);
  if (has('Segmented')) demo.push(`      <Segmented options={['LOW', 'MED', 'HIGH']} defaultValue="MED" label="Quality" />`);
  if (has('Switch')) demo.push(`      <Switch label="Live" defaultValue />`);
  if (has('NumberField')) demo.push(`      <NumberField label="Width" defaultValue={268} />`);
  const names = comps.map((c) => c.id).filter((id) => demo.some((d) => d.includes('<' + id + ' ')));
  const inner = has('Panel') ? `      <Panel title="Material">\n${demo.map((d) => '  ' + d).join('\n')}\n      </Panel>` : demo.map((d) => d.slice(2)).join('\n');
  const importNames = ['ArtinosTheme', ...(has('Panel') ? ['Panel'] : []), ...names];
  const n = themes.length + o.customs.length;
  const reexport = o.pkgRoot
    ? '```bash\nnode "' + o.pkgRoot + '/artinos.mjs" export --project . --themes <ids> --components <names> --force\n```'
    : 'Run `node <path-to-artinos-ui>/artinos.mjs export --project . --themes <ids> --components <names> --force` from the project root, or use the Export kit in the ARTINOS UI showcase.';
  const guides = o.docs
    ? `## Guides

- \`docs/design.md\` — the ARTINOS look: the levels of a panel, the reading scale, layout, colour and what never to do. Read it first; a screen built against it needs no type, colour or spacing of its own.
- \`docs/components.md\` — every component: props, defaults, examples, interaction, recipes.
- \`docs/catalogue.md\` — every kind of every component (the six slider faces, the control shapes, row states, overlays, the dock and graph), and which to pick for a given parameter. Read it before building a panel.
- \`docs/theming.md\` — choosing themes, glass vs solid, density, token overrides, custom themes, the theme list, key tokens.

The guides cover the whole ARTINOS UI package; this kit contains the components and themes listed here. To add themes or components, re-export into this folder from the project root:

${reexport}

`
    : '';
  return `# ARTINOS UI — exported kit

A trimmed copy of ARTINOS UI with ${comps.length} component${comps.length === 1 ? '' : 's'} and ${n} theme${n === 1 ? '' : 's'}. Everything it needs is in this folder.

## Install

1. Copy this \`${o.folder}/\` folder into your project (e.g. \`src/${o.folder}\`).
2. Make sure \`react\` and \`react-dom\` are installed (React 18.3+; built and tested on React 19). There are no other dependencies.
3. Import the stylesheet once at the app root, then import components.

\`\`\`tsx
import './${o.folder}/artinos.css';
import { ${importNames.join(', ')} } from './${o.folder}';

export function Controls() {
  return (
    <ArtinosTheme theme="${firstTheme}"${firstType ? ` type="${firstType}"` : ''}>
${inner || '      {/* controls */}'}
    </ArtinosTheme>
  );
}
\`\`\`

Without React, any element with \`data-ar-theme="${firstTheme}"\` scopes the look too.

Notes:
- TypeScript source (\`.tsx\`), \`strict\`-clean. Any bundler that handles TSX and CSS \`@import\` works (Vite, Next, webpack).
- Component files start with \`'use client'\`; they are interactive and need the DOM.
${o.googleFonts ? `- \`tokens/fonts.css\` loads ${faces.join(', ')} and Roboto Mono from Google Fonts. To self-host, delete that \`@import\` from \`artinos.css\`; every font stack falls back to system fonts.` : `- No web fonts are loaded; the font stacks fall back to system fonts. Declare ${faces.join(' / ')} with @font-face to get the original faces.`}
${o.materials ? '' : '- Finish overrides (`material` prop) were left out; each theme keeps its own finish.\n'}
${guides}## Type collections

A set of faces with one job each and its own system: title scale, weight, case and width, the paragraph face and line spacing. \`${BASE_TYPE}\` is what the tokens give; another is set with \`<ArtinosTheme type="…">\` or \`data-ar-type\` on any element, and carries through nested themes and portalled overlays.

| collection | faces |
|---|---|
${types.map((t) => `| \`${t}\`${t === BASE_TYPE ? ' (default)' : ''} | ${facesOf([t], tmeta).join(' · ')} — ${tmeta[t]?.description ?? ''} |`).join('\n')}

## Themes

| theme | look |
|---|---|
${themes.map((t) => `| \`${t}\`${t === BASE_THEME ? ' (base)' : ''} | ${meta[t]?.description ?? ''} |`).join('\n')}
${o.customs.map((c) => `| \`${c.slug}\` | ${c.name} — custom theme from the Theme Studio (tokens/custom-themes.css) |`).join('\n')}

## Components

${comps.map((c) => `- **${c.label}** — ${c.note}`).join('\n')}

## Files

\`\`\`
${files.map((f) => `${o.folder}/${f}`).join('\n')}
\`\`\`
`;
}

/* ---------- the kit ---------- */

/**
 * @param sources  src-relative path → text, for every .ts / .tsx / .css file in src/
 * @param o        { folder, themes, components, customs, googleFonts, materials, types?, docs?, pkgRoot? }
 * @returns        kit-relative path → text, README.md first
 */
export function buildKit(sources, o) {
  const { themes: all, meta } = readRegistry(sources);
  const { meta: tmeta } = readTypes(sources);
  const themes = [BASE_THEME, DEFAULT_THEME, ...o.themes.filter((t) => t !== BASE_THEME && t !== DEFAULT_THEME)];
  const keep = new Set(themes);
  // `:not([data-ar-material])` names no material, so theme finishes survive without the overrides
  const themeOk = (s) => themesIn(s).every((t) => keep.has(t)) && (o.materials || materialsIn(s).length === 0);
  const types = [BASE_TYPE, ...(o.types ?? []).filter((t) => t !== BASE_TYPE && t in tmeta)];
  const keepTypes = new Set(types);
  const comps = COMPONENTS.filter((c) => o.components.includes(c.id));
  const tsFiles = closure(sources, [...CORE, ...comps.map((c) => c.file)]).sort();
  // stylesheets: each included module's folder stylesheet (folder/folder.css) and its own (Name.css),
  // in the order of src/artinos.css, the one list of every stylesheet
  const wanted = new Set(tsFiles.flatMap((f) => [`${f.split('/')[0]}/${f.split('/')[0]}.css`, f.replace(/\.tsx?$/, '.css')]));
  const cssFiles = [...sources['artinos.css'].matchAll(/@import '\.\/([^']+)'/g)].map((m) => m[1]).filter((f) => wanted.has(f) && f in sources);

  const files = {};
  const list = themes.map((t) => `${t.padEnd(14)}${meta[t]?.label ?? ''}`).join('\n *   ');
  files['artinos.css'] = buildCssEntry(o, cssFiles);
  files['index.ts'] = buildIndex(sources, new Set(tsFiles));
  if (o.googleFonts) files['tokens/fonts.css'] = buildFontsCss(types, tmeta);
  files['tokens/tokens.css'] = sources['tokens/tokens.css'];
  files['tokens/themes.css'] = trimCss(
    sources['tokens/themes.css'],
    themeOk,
    `/* ARTINOS UI — themes in this kit. Pick one with <ArtinosTheme theme="…"> or data-ar-theme.\n *   ${list}\n * A theme sets roles here and its control finish in materials.css. Anything a\n * theme leaves out keeps the studio value from tokens.css.\n */`,
  );
  files['tokens/materials.css'] = trimCss(
    sources['tokens/materials.css'],
    themeOk,
    `/* ARTINOS UI — control finishes: the default (studio) block, ${o.materials ? 'the optional\n * data-ar-material / `material` overrides, ' : ''}and the finish of each theme in this kit.\n * \`initial\` on a token means "not set here": components derive it from density.\n */`,
  );
  const typeList = types.map((t) => `${t.padEnd(12)}${facesOf([t], tmeta).join(' · ')}`).join('\n *   ');
  files['tokens/type.css'] = trimCss(
    sources['tokens/type.css'],
    (s) => typesIn(s).every((t) => keepTypes.has(t)),
    `/* ARTINOS UI — type collections in this kit. Pick one with <ArtinosTheme type="…"> or data-ar-type:\n *   ${typeList}\n * A collection sets its faces and its own title and reading system; control sizes stay (tokens.css).\n * ${BASE_TYPE} is what tokens.css already gives. The faces load in fonts.css.\n */`,
  );
  if (o.customs.length) files['tokens/custom-themes.css'] = o.customs.map((c) => c.css.trim()).join('\n\n') + '\n';
  for (const f of tsFiles) files[f] = f === 'core/utils.ts' ? trimUtils(sources[f], all.filter((t) => keep.has(t)), o.materials) : sources[f];
  for (const f of cssFiles) files[f] = sources[f];
  if (o.docs) for (const [name, text] of Object.entries(o.docs)) files['docs/' + name] = text;

  const order = Object.keys(files).sort((a, b) => (a.includes('/') ? 1 : 0) - (b.includes('/') ? 1 : 0) || a.localeCompare(b));
  files['README.md'] = buildReadme(o, meta, themes, comps, ['README.md', ...order], types, tmeta);
  return Object.fromEntries(['README.md', ...order].map((k) => [k, files[k]]));
}
