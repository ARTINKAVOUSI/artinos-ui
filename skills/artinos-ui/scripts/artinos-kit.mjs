#!/usr/bin/env node
/* ARTINOS UI — kit exporter (command-line twin of the showcase Export kit).
 *
 * Writes a trimmed, copy-paste artinos-ui folder into a project: only the picked
 * components and every file they import, only the picked themes in the token CSS,
 * and an index.ts / artinos.css / README.md to match. Node 18+, no dependencies.
 *
 *   node artinos-kit.mjs --list
 *   node artinos-kit.mjs --out src/artinos-ui --themes frost-deep,satin --components Slider,Select,Panel
 *   node artinos-kit.mjs --out src/artinos-ui --themes all --components all
 *
 * Options
 *   --out <dir>          folder to write (its basename is the import path, e.g. src/artinos-ui)
 *   --themes <list>      comma list of theme ids, or "all" (studio, the base, is always added)
 *   --components <list>  comma list (see --list), or "all"
 *   --custom <file.css>  add a theme CSS exported from the Theme Studio (repeatable)
 *   --no-fonts           leave out the Google Fonts import (system font fallbacks)
 *   --no-materials       leave out the optional `material` prop finish overrides
 *   --no-docs            leave out docs/ (the component API and theming guides)
 *   --src <dir>          the artinos-ui package source (default: auto, see below)
 *   --force              replace an existing, non-empty --out folder
 *   --dry-run            print the file list and sizes, write nothing
 *
 * Package source resolution: --src, then $ARTINOS_UI_SRC, then ../../../artinos-ui
 * relative to this script (the skill living inside the package repo), then the
 * canonical location below.
 *
 * Keep the trimming logic in step with showcase/src/export/kit.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CANONICAL = 'D:/CODES26/ARTINOS-R3F/UI COMPONENT PACKAGE/artinos-ui';
const HERE = path.dirname(fileURLToPath(import.meta.url));

/* ---------- args ---------- */
const argv = process.argv.slice(2);
const flag = (n) => argv.includes('--' + n);
const opt = (n) => {
  const i = argv.indexOf('--' + n);
  return i >= 0 ? argv[i + 1] : undefined;
};
const opts = (n) => argv.flatMap((a, i) => (a === '--' + n ? [argv[i + 1]] : []));
const die = (msg) => {
  console.error('artinos-kit: ' + msg);
  process.exit(1);
};

function findSource() {
  const cands = [opt('src'), process.env.ARTINOS_UI_SRC, path.resolve(HERE, '../../../artinos-ui'), CANONICAL].filter(Boolean);
  for (const c of cands) if (fs.existsSync(path.join(c, 'index.ts')) && fs.existsSync(path.join(c, 'tokens/themes.css'))) return path.resolve(c);
  die('cannot find the artinos-ui package source. Tried:\n  ' + cands.join('\n  ') + '\nPass --src <path-to-artinos-ui> or set ARTINOS_UI_SRC.');
}
const SRC = findSource();
/** the package folder holding artinos-ui/ and artinos.mjs, with forward slashes for docs */
const PKG_ROOT = path.dirname(SRC).split(path.sep).join('/');

/* ---------- read the package ---------- */
const SOURCES = {};
(function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) walk(path.join(dir, e.name), r);
    else if (/\.(ts|tsx|css)$/.test(e.name)) SOURCES[r] = fs.readFileSync(path.join(dir, e.name), 'utf8');
  }
})(SRC, '');

const META_RE = /^ {2}(?:'([^']+)'|([\w-]+)): \{ label: '([^']*)', family: '([^']+)', kind: '(\w+)', description: '((?:[^'\\]|\\.)*)'/;
const THEME_META = {};
for (const line of SOURCES['core/utils.ts'].split('\n')) {
  const m = line.match(META_RE);
  if (m) THEME_META[m[1] ?? m[2]] = { label: m[3], family: m[4], kind: m[5], description: m[6].replace(/\\'/g, "'") };
}
const THEMES = [...SOURCES['core/utils.ts'].match(/export const THEMES = \[([\s\S]*?)\] as const;/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

const KIT_COMPONENTS = [
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
const CORE = ['core/Theme.tsx', 'core/utils.ts'];
const BASE_THEME = 'studio';

/* ---------- --list ---------- */
if (flag('list')) {
  console.log(`ARTINOS UI package: ${SRC}\n\nThemes (${THEMES.length}) — id · label · kind — look`);
  const fams = [...new Set(THEMES.map((t) => THEME_META[t]?.family ?? '?'))];
  for (const f of fams) {
    console.log(`\n  [${f}]`);
    for (const t of THEMES.filter((x) => THEME_META[x]?.family === f)) {
      const m = THEME_META[t];
      console.log(`    ${t.padEnd(16)} ${m.label.padEnd(16)} ${m.kind.padEnd(6)} ${m.description}`);
    }
  }
  console.log('\nComponents');
  for (const c of KIT_COMPONENTS) console.log(`    ${c.id.padEnd(14)} ${c.note}`);
  console.log('\n(ArtinosTheme, the theme scope, is always included.)');
  process.exit(0);
}

/* ---------- dependency graph ---------- */
const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s+'(\.{1,2}\/[^']+)'/g;
function resolve(from, spec) {
  const parts = from.split('/').slice(0, -1);
  for (const seg of spec.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  const base = parts.join('/');
  for (const cand of [base, base + '.ts', base + '.tsx', base + '/index.ts']) if (cand in SOURCES) return cand;
  return null;
}
function closure(entries) {
  const seen = new Set();
  const walk = (f) => {
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
const themesIn = (s) => [...s.matchAll(/data-ar-theme='([^']+)'/g)].map((m) => m[1]);
const materialsIn = (s) => [...s.matchAll(/data-ar-material='([^']+)'/g)].map((m) => m[1]);
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
function filterSelector(sel, keep, materials) {
  // `:not([data-ar-material])` names no material, so theme finishes survive without the overrides
  const ok = (s) => themesIn(s).every((t) => keep.has(t)) && (materials || materialsIn(s).length === 0);
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
function trimCss(css, keep, materials, header) {
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
    const next = filterSelector(sel.trim(), keep, materials);
    if (next) out.push(pending.replace(/^\n{3,}/, '\n\n') + next + ' ' + body);
    pending = '';
  }
  return out.join('').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/* ---------- source rewrites ---------- */
function trimUtils(src, keep, materials) {
  const ordered = THEMES.filter((t) => keep.includes(t));
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
      return !m || keep.includes(m[1] ?? m[2]);
    })
    .join('\n');
  s = s.slice(0, start) + block + s.slice(end);
  if (!materials) s = s.replace(/export const MATERIALS = \[[^\]]*\] as const;/, 'export const MATERIALS = [] as const; // finish overrides were left out of this kit');
  return s;
}
function buildIndex(files) {
  const lines = SOURCES['index.ts'].split('\n').filter((line) => {
    const m = line.match(/from '(\.\/[^']+)'/);
    if (!m) return true;
    const r = resolve('index.ts', m[1]);
    return !!r && files.has(r);
  });
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
    o.customs.length ? './tokens/custom-themes.css' : null,
    ...cssFiles.map((f) => './' + f),
  ].filter(Boolean);
  return `/* ARTINOS UI — single stylesheet entry. Import once, at the app root:
     import './${o.folder}/artinos.css';
   Order matters: tokens → themes → materials → components. */
${imports.map((p) => `@import '${p}';`).join('\n')}
`;
}
function buildReadme(o, themes, comps, files) {
  const firstTheme = o.themes.find((t) => t !== BASE_THEME) ?? o.customs[0]?.slug ?? BASE_THEME;
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
${o.docs ? '## Guides\n\n- `docs/components.md` — every component: props, defaults, examples, recipes.\n- `docs/theming.md` — choosing themes, glass vs solid, density, token overrides, custom themes, key tokens.\n\nThe guides cover the whole ARTINOS UI package; this kit contains the components and themes listed here. To add themes or components, re-export into this folder from the project root:\n\n```bash\nnode "' + PKG_ROOT + '/artinos.mjs" export --project . --themes <ids> --components <names> --force\n```\n\n' : ''}## Themes

| theme | look |
|---|---|
${themes.map((t) => `| \`${t}\`${t === BASE_THEME ? ' (base)' : ''} | ${THEME_META[t]?.description ?? ''} |`).join('\n')}
${o.customs.map((c) => `| \`${c.slug}\` | ${c.name} — custom theme (tokens/custom-themes.css) |`).join('\n')}

## Components

${comps.map((c) => `- **${c.label}** — ${c.note}`).join('\n')}

## Files

\`\`\`
${files.map((f) => `${o.folder}/${f}`).join('\n')}
\`\`\`
`;
}

function buildKit(o) {
  const themes = [BASE_THEME, ...o.themes.filter((t) => t !== BASE_THEME)];
  const keep = new Set(themes);
  const comps = KIT_COMPONENTS.filter((c) => o.components.includes(c.id));
  const tsFiles = closure([...CORE, ...comps.map((c) => c.file)]).sort();
  const folders = new Set(tsFiles.map((f) => f.split('/')[0]));
  const cssFiles = ['core/core.css', 'slider/slider.css', 'controls/controls.css', 'layout/layout.css'].filter((f) => folders.has(f.split('/')[0]));
  const files = {};
  const list = themes.map((t) => `${t.padEnd(14)}${THEME_META[t]?.label ?? ''}`).join('\n *   ');
  files['artinos.css'] = buildCssEntry(o, cssFiles);
  files['index.ts'] = buildIndex(new Set(tsFiles));
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
    `/* ARTINOS UI — control finishes: the default (studio) block, ${o.materials ? 'the optional\n * data-ar-material / \`material\` overrides, ' : ''}and the finish of each theme in this kit.\n * \`initial\` on a token means "not set here": components derive it from density.\n */`,
  );
  if (o.customs.length) files['tokens/custom-themes.css'] = o.customs.map((c) => c.css.trim()).join('\n\n') + '\n';
  for (const f of tsFiles) files[f] = f === 'core/utils.ts' ? trimUtils(SOURCES[f], themes, o.materials) : SOURCES[f];
  for (const f of cssFiles) files[f] = SOURCES[f];
  // the guides travel with the kit, so later sessions in that project know the API without this package
  if (o.docs)
    for (const d of ['components.md', 'theming.md']) {
      const f = path.join(HERE, '..', 'references', d);
      if (fs.existsSync(f)) files['docs/' + d] = fs.readFileSync(f, 'utf8');
    }
  const order = Object.keys(files).sort((a, b) => (a.includes('/') ? 1 : 0) - (b.includes('/') ? 1 : 0) || a.localeCompare(b));
  files['README.md'] = buildReadme(o, themes, comps, ['README.md', ...order]);
  return Object.fromEntries(['README.md', ...order].map((k) => [k, files[k]]));
}

/* ---------- run ---------- */
const out = opt('out');
if (!out) die('missing --out <dir>. Run with --list to see themes and components.');
const pickList = (v, all, what) => {
  if (!v) die(`missing --${what} (comma list or "all")`);
  if (v === 'all') return [...all];
  const list = v.split(',').map((s) => s.trim()).filter(Boolean);
  const bad = list.filter((x) => !all.includes(x));
  if (bad.length) die(`unknown ${what}: ${bad.join(', ')}\nAvailable: ${all.join(', ')}`);
  return list;
};
const themes = pickList(opt('themes'), THEMES, 'themes');
const components = pickList(opt('components'), KIT_COMPONENTS.map((c) => c.id), 'components');
const customs = opts('custom').map((f) => {
  const css = fs.readFileSync(f, 'utf8');
  const slug = css.match(/\[data-ar-theme='([^']+)'\]/)?.[1];
  if (!slug) die(`${f}: no [data-ar-theme='…'] block found`);
  return { slug, name: slug, css };
});
const folder = path.basename(path.resolve(out));
const files = buildKit({ folder, themes, components, customs, googleFonts: !flag('no-fonts'), materials: !flag('no-materials'), docs: !flag('no-docs') });
const total = Object.values(files).reduce((n, s) => n + Buffer.byteLength(s), 0);

if (flag('dry-run')) {
  for (const [p, s] of Object.entries(files)) console.log(`${(Buffer.byteLength(s) / 1024).toFixed(1).padStart(6)} KB  ${folder}/${p}`);
  console.log(`\n${Object.keys(files).length} files, ${(total / 1024).toFixed(0)} KB — dry run, nothing written.`);
  process.exit(0);
}

const dest = path.resolve(out);
if (fs.existsSync(dest) && fs.readdirSync(dest).length) {
  if (!flag('force')) die(`${dest} already exists and is not empty. Pass --force to replace the kit files in it.`);
  // replace only what a kit owns: stale kit files (e.g. a component dropped since last time) are removed
  const owned = new Set(Object.keys(files));
  const known = /^(README\.md|artinos\.css|index\.ts|(tokens|core|slider|controls|layout)\/[^/]+\.(ts|tsx|css)|docs\/(components|theming)\.md)$/;
  (function prune(dir, rel) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) prune(path.join(dir, e.name), r);
      else if (known.test(r) && !owned.has(r)) fs.unlinkSync(path.join(dir, e.name));
    }
  })(dest, '');
  // and the kit folders left empty by that (only ever empty ones)
  for (const d of ['slider', 'controls', 'layout', 'core', 'tokens', 'docs']) {
    const p = path.join(dest, d);
    if (fs.existsSync(p) && !fs.readdirSync(p).length) fs.rmdirSync(p);
  }
}
for (const [p, s] of Object.entries(files)) {
  const f = path.join(dest, p);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, s);
}
console.log(`Wrote ${Object.keys(files).length} files (${(total / 1024).toFixed(0)} KB) to ${dest}`);
console.log(`Themes: ${[BASE_THEME, ...themes.filter((t) => t !== BASE_THEME)].join(', ')}${customs.length ? ' + custom: ' + customs.map((c) => c.slug).join(', ') : ''}`);
console.log(`Components: ${components.join(', ')}`);
console.log(`Next: import './${folder}/artinos.css' once at the app root, then import from './${folder}'.`);
