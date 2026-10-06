/* Export kit — builds a trimmed, copy-paste artinos-ui folder from the real package
   source: only the picked components and every file they import, only the picked
   themes in the token CSS, and an index.ts / artinos.css / README.md to match. */
import { THEMES, THEME_META } from '../../../artinos-ui/core/utils';

const RAW = import.meta.glob('../../../artinos-ui/**/*.{ts,tsx,css}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const PREFIX = '../../../artinos-ui/';
/** package-relative path → source text, exactly as shipped */
export const SOURCES: Record<string, string> = Object.fromEntries(Object.entries(RAW).map(([k, v]) => [k.slice(PREFIX.length), v]));

export interface KitComponent {
  id: string;
  label: string;
  file: string;
  note: string;
}

export const KIT_COMPONENTS: KitComponent[] = [
  { id: 'Slider', label: 'Slider', file: 'slider/Slider.tsx', note: 'material · stepped · gradient · ruler · curve · wave' },
  { id: 'RangeSlider', label: 'RangeSlider', file: 'slider/RangeSlider.tsx', note: 'two seams, one span' },
  { id: 'NumberField', label: 'NumberField', file: 'controls/NumberField.tsx', note: 'scrub or type a number' },
  { id: 'Switch', label: 'Switch', file: 'controls/Switch.tsx', note: 'shutter or compact' },
  { id: 'ToggleGroup', label: 'ToggleGroup', file: 'controls/ToggleGroup.tsx', note: 'independent flags' },
  { id: 'Segmented', label: 'Segmented', file: 'controls/Segmented.tsx', note: 'one of a few' },
  { id: 'ColorField', label: 'ColorField', file: 'controls/ColorField.tsx', note: 'hex + alpha' },
  { id: 'Select', label: 'Select', file: 'controls/Select.tsx', note: 'dropdown list' },
  { id: 'Panel', label: 'Panel · Section · Field', file: 'layout/Panel.tsx', note: 'glass panel and layout' },
  { id: 'Tabs', label: 'Tabs', file: 'layout/Tabs.tsx', note: 'tab bar' },
  { id: 'RollingValue', label: 'RollingValue', file: 'core/RollingValue.tsx', note: 'rolling-digit readout' },
];

/** Always shipped: the theme scope and the shared helpers every component uses. */
const CORE = ['core/Theme.tsx', 'core/utils.ts'];
/** The base every theme builds on (its roles are the defaults in tokens.css). */
export const BASE_THEME = 'studio';

export interface CustomThemeCss {
  slug: string;
  name: string;
  css: string;
}

export interface KitOptions {
  folder: string;
  themes: string[];
  components: string[];
  customs: CustomThemeCss[];
  googleFonts: boolean;
  materials: boolean;
}

/* ---------- dependency graph ---------- */

const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s+'(\.{1,2}\/[^']+)'/g;

function resolve(from: string, spec: string): string | null {
  const parts = from.split('/').slice(0, -1);
  for (const seg of spec.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  const base = parts.join('/');
  for (const cand of [base, base + '.ts', base + '.tsx', base + '/index.ts']) if (cand in SOURCES) return cand;
  return null;
}

function closure(entries: string[]): string[] {
  const seen = new Set<string>();
  const walk = (f: string) => {
    if (seen.has(f) || !(f in SOURCES)) return;
    seen.add(f);
    for (const m of SOURCES[f].matchAll(IMPORT_RE)) {
      const r = resolve(f, m[1]);
      if (r) walk(r);
    }
  };
  entries.forEach(walk);
  return [...seen];
}

/* ---------- CSS trimming ---------- */

const themesIn = (s: string) => [...s.matchAll(/data-ar-theme='([^']+)'/g)].map((m) => m[1]);
const materialsIn = (s: string) => [...s.matchAll(/data-ar-material='([^']+)'/g)].map((m) => m[1]);

/** Split on commas that are not inside parentheses. */
function splitTop(s: string) {
  const out: string[] = [];
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

/** Keep a selector only if every theme (and material) it names is in the kit. */
function filterSelector(sel: string, keep: Set<string>, materials: boolean): string | null {
  // `:not([data-ar-material])` names no material, so theme finishes survive without the overrides
  const ok = (s: string) => themesIn(s).every((t) => keep.has(t)) && (materials || materialsIn(s).length === 0);
  const parts = splitTop(sel);
  const kept: string[] = [];
  let changed = false;
  for (const raw of parts) {
    let dropped = false;
    // :is(a, b, c) lists: keep the members that are in the kit
    const p = raw.replace(/:is\(((?:[^()]|\([^()]*\))*)\)/g, (m, inner: string) => {
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

/** Filter a flat stylesheet (no at-rules) rule by rule; a comment travels with the rule after it. */
function trimCss(css: string, keep: Set<string>, materials: boolean, header: string): string {
  const out: string[] = [];
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
    const next = filterSelector(sel.trim(), keep, materials);
    if (next) out.push(pending.replace(/^\n{3,}/, '\n\n') + next + ' ' + body);
    pending = '';
  }
  return out.join('').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/* ---------- source rewrites ---------- */

function trimUtils(src: string, keep: string[], materials: boolean): string {
  const ordered = (THEMES as readonly string[]).filter((t) => keep.includes(t));
  const rows: string[] = [];
  for (let k = 0; k < ordered.length; k += 4) rows.push('  ' + ordered.slice(k, k + 4).map((t) => `'${t}'`).join(', ') + ',');
  let s = src.replace(/export const THEMES = \[[\s\S]*?\] as const;/, `export const THEMES = [\n${rows.join('\n')}\n] as const;`);
  const start = s.indexOf('export const THEME_META');
  const end = s.indexOf('\n};', start);
  const block = s
    .slice(start, end)
    .split('\n')
    .filter((line) => {
      const m = line.match(/^ {2}(?:'([^']+)'|([\w-]+)): \{ label:/);
      return !m || keep.includes(m[1] ?? m[2]);
    })
    .join('\n');
  s = s.slice(0, start) + block + s.slice(end);
  if (!materials) s = s.replace(/export const MATERIALS = \[[^\]]*\] as const;/, 'export const MATERIALS = [] as const; // finish overrides were left out of this kit');
  return s;
}

function buildIndex(files: Set<string>): string {
  const lines = SOURCES['index.ts'].split('\n').filter((line) => {
    const m = line.match(/from '(\.\/[^']+)'/);
    if (!m) return true;
    const r = resolve('index.ts', m[1]);
    return !!r && files.has(r);
  });
  // drop section comments left with nothing under them
  const out: string[] = [];
  lines.forEach((line, k) => {
    if (/^\/\/ /.test(line)) {
      const next = lines.slice(k + 1).find((l) => l.trim() !== '');
      if (!next || next.startsWith('//')) return;
    }
    out.push(line);
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function buildCssEntry(o: KitOptions, cssFiles: string[]): string {
  const imports = [
    o.googleFonts ? './tokens/fonts.css' : null,
    './tokens/tokens.css',
    './tokens/themes.css',
    './tokens/materials.css',
    o.customs.length ? './tokens/custom-themes.css' : null,
    ...cssFiles.map((f) => './' + f),
  ].filter(Boolean);
  return `/* ARTINOS UI — single stylesheet entry. Import once, at the app root:
     import './${o.folder}/artinos.css';
   Order matters: tokens → themes → materials → components. */
${imports.map((p) => `@import '${p}';`).join('\n')}
`;
}

function buildReadme(o: KitOptions, themes: string[], comps: KitComponent[], files: string[]): string {
  const firstTheme = o.themes.find((t) => t !== BASE_THEME) ?? o.customs[0]?.slug ?? BASE_THEME;
  const has = (id: string) => comps.some((c) => c.id === id);
  const demo: string[] = [];
  if (has('Slider')) demo.push(`      <Slider label="Roughness" defaultValue={0.52} />`);
  if (has('RangeSlider')) demo.push(`      <RangeSlider label="Band" defaultValue={[0.25, 0.7]} />`);
  if (has('Segmented')) demo.push(`      <Segmented options={['LOW', 'MED', 'HIGH']} defaultValue="MED" label="Quality" />`);
  if (has('Switch')) demo.push(`      <Switch label="Live" defaultValue />`);
  if (has('NumberField')) demo.push(`      <NumberField label="Width" defaultValue={268} />`);
  const names = comps.map((c) => c.id).filter((id) => demo.some((d) => d.includes('<' + id + ' ')));
  const inner = has('Panel')
    ? `      <Panel title="Material">\n${demo.map((d) => '  ' + d).join('\n')}\n      </Panel>`
    : demo.map((d) => d.slice(2)).join('\n');
  const importNames = ['ArtinosTheme', ...(has('Panel') ? ['Panel'] : []), ...names];
  return `# ARTINOS UI — exported kit

A trimmed copy of ARTINOS UI with ${comps.length} component${comps.length === 1 ? '' : 's'} and ${themes.length + o.customs.length} theme${themes.length + o.customs.length === 1 ? '' : 's'}. Everything it needs is in this folder.

## Install

1. Copy this \`${o.folder}/\` folder into your project (e.g. \`src/${o.folder}\`).
2. Make sure \`react\` and \`react-dom\` are installed (React 18.3+; built and tested on React 19). There are no other dependencies.
3. Import the stylesheet once at the app root, then import components.

\`\`\`tsx
import './${o.folder}/artinos.css';
import { ${importNames.join(', ')} } from './${o.folder}';

export function Controls() {
  return (
    <ArtinosTheme theme="${firstTheme}">
${inner || '      {/* controls */}'}
    </ArtinosTheme>
  );
}
\`\`\`

Without React, any element with \`data-ar-theme="${firstTheme}"\` scopes the look too.

Notes:
- TypeScript source (\`.tsx\`), \`strict\`-clean. Any bundler that handles TSX and CSS \`@import\` works (Vite, Next, webpack).
- Component files start with \`'use client'\`; they are interactive and need the DOM.
${o.googleFonts ? "- `tokens/fonts.css` loads Chivo, Chivo Mono and Roboto Mono from Google Fonts. To self-host, delete that `@import` from `artinos.css`; every font stack falls back to system fonts." : '- No web fonts are loaded; the font stacks fall back to system fonts. Declare Chivo / Chivo Mono with @font-face to get the original faces.'}
${o.materials ? '' : '- Finish overrides (`material` prop) were left out; each theme keeps its own finish.\n'}
## Themes

| theme | look |
|---|---|
${themes.map((t) => `| \`${t}\`${t === BASE_THEME ? ' (base)' : ''} | ${THEME_META[t as keyof typeof THEME_META]?.description ?? ''} |`).join('\n')}
${o.customs.map((c) => `| \`${c.slug}\` | ${c.name} — built in the Theme Studio (tokens/custom-themes.css) |`).join('\n')}

## Components

${comps.map((c) => `- **${c.label}** — ${c.note}`).join('\n')}

## Files

\`\`\`
${files.map((f) => `${o.folder}/${f}`).join('\n')}
\`\`\`
`;
}

/* ---------- the kit ---------- */

export function buildKit(o: KitOptions): Record<string, string> {
  const themes = [BASE_THEME, ...o.themes.filter((t) => t !== BASE_THEME)];
  const keep = new Set(themes);
  const comps = KIT_COMPONENTS.filter((c) => o.components.includes(c.id));
  const tsFiles = closure([...CORE, ...comps.map((c) => c.file)]).sort();
  const folders = new Set(tsFiles.map((f) => f.split('/')[0]));
  const cssFiles = ['core/core.css', 'slider/slider.css', 'controls/controls.css', 'layout/layout.css'].filter((f) => folders.has(f.split('/')[0]));
  const fileSet = new Set(tsFiles);

  const files: Record<string, string> = {};
  const list = themes.map((t) => `${t.padEnd(14)}${THEME_META[t as keyof typeof THEME_META]?.label ?? ''}`).join('\n *   ');
  files['artinos.css'] = buildCssEntry(o, cssFiles);
  files['index.ts'] = buildIndex(fileSet);
  if (o.googleFonts) files['tokens/fonts.css'] = SOURCES['tokens/fonts.css'];
  files['tokens/tokens.css'] = SOURCES['tokens/tokens.css'];
  files['tokens/themes.css'] = trimCss(
    SOURCES['tokens/themes.css'],
    keep,
    o.materials,
    `/* ARTINOS UI — themes in this kit. Pick one with <ArtinosTheme theme="…"> or data-ar-theme.\n *   ${list}\n * A theme sets roles here and its control finish in materials.css. Anything a\n * theme leaves out keeps the studio value from tokens.css.\n */`,
  );
  files['tokens/materials.css'] = trimCss(
    SOURCES['tokens/materials.css'],
    keep,
    o.materials,
    `/* ARTINOS UI — control finishes: the default (studio) block, ${o.materials ? 'the optional\n * data-ar-material / `material` overrides, ' : ''}and the finish of each theme in this kit.\n * \`initial\` on a token means "not set here": components derive it from density.\n */`,
  );
  if (o.customs.length) files['tokens/custom-themes.css'] = o.customs.map((c) => c.css.trim()).join('\n\n') + '\n';
  for (const f of tsFiles) files[f] = f === 'core/utils.ts' ? trimUtils(SOURCES[f], themes, o.materials) : SOURCES[f];
  for (const f of cssFiles) files[f] = SOURCES[f];

  const order = Object.keys(files).sort((a, b) => (a.includes('/') ? 1 : 0) - (b.includes('/') ? 1 : 0) || a.localeCompare(b));
  files['README.md'] = buildReadme(o, themes, comps, ['README.md', ...order]);
  return Object.fromEntries(['README.md', ...order].map((k) => [k, files[k]]));
}
