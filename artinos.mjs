#!/usr/bin/env node
/* ARTINOS UI — the package's one command. Node 18+, no dependencies.
 *
 *   node artinos.mjs list
 *       every theme (grouped, with descriptions) and component
 *
 *   node artinos.mjs setup --project <dir> --themes frost-deep,onyx --components Slider,Panel,Select
 *       export a trimmed kit into a project (with its guides), install the Claude Code skill
 *       into <dir>/.claude/skills/artinos-ui, and print the wiring for the detected framework
 *
 *   node artinos.mjs export --project <dir> --themes … --components …
 *       only the kit
 *
 *   node artinos.mjs skill --project <dir> | --user
 *       install / refresh the Claude Code skill in one project, or for every project (~/.claude/skills)
 *
 *   node artinos.mjs pack
 *       build dist/artinos-ui.skill (the skill as a shareable file)
 *
 *   node artinos.mjs sync
 *       maintainers: regenerate the theme lists in docs/theming.md and src/tokens/themes.css
 *       from the registry in src/core/utils.ts
 *
 * Kit options for setup / export:
 *   --themes <ids|all>      comma list; studio, the base, is always added
 *   --components <ids|all>  comma list (see list)
 *   --out <dir>             kit folder, relative to --project (default src/artinos-ui, or artinos-ui without src/)
 *   --custom <file.css>     add a theme exported from the Theme Studio (repeatable)
 *   --no-fonts              leave out the Google Fonts import (system fonts)
 *   --no-materials          leave out the optional `material` prop finish overrides
 *   --type <ids|all>        type collections (font pairings) to include; sleek is always in
 *   --no-docs               leave out docs/ (component API, catalogue and theming guides)
 *   --force                 update an existing kit in place (files it no longer needs are removed)
 *   --dry-run               print the files and sizes, write nothing
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_THEME, BASE_TYPE, TYPE_ALIASES, buildKit, COMPONENTS, facesOf, readRegistry, readTypes } from './tools/kit.mjs';
import { zip } from './tools/zip.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const DOCS = path.join(ROOT, 'docs');
const SKILL = path.join(ROOT, 'skill', 'SKILL.md');
const GUIDES = ['components.md', 'catalogue.md', 'theming.md'];
const slash = (p) => p.split(path.sep).join('/');

/* ---------- args ---------- */
const [cmd, ...argv] = process.argv.slice(2);
const flag = (n) => argv.includes('--' + n);
const opt = (n) => {
  const i = argv.indexOf('--' + n);
  return i >= 0 ? argv[i + 1] : undefined;
};
const opts = (n) => argv.flatMap((a, i) => (a === '--' + n ? [argv[i + 1]] : []));
function die(msg) {
  console.error('artinos: ' + msg);
  process.exit(1);
}

/* ---------- package source ---------- */
function readSources() {
  const out = {};
  (function walk(dir, rel) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) walk(path.join(dir, e.name), r);
      else if (/\.(ts|tsx|css)$/.test(e.name)) out[r] = fs.readFileSync(path.join(dir, e.name), 'utf8');
    }
  })(SRC, '');
  return out;
}
const readGuides = () => Object.fromEntries(GUIDES.map((g) => [g, fs.readFileSync(path.join(DOCS, g), 'utf8')]));

/* ---------- list ---------- */
function list() {
  const { themes, meta, heroes } = readRegistry(readSources());
  console.log(`ARTINOS UI — ${ROOT}\n\nStart here: ${heroes.length} hero themes   id · label · kind · variations · look`);
  for (const t of heroes) {
    const n = themes.filter((x) => meta[x].parent === t).length;
    console.log(`    ${t.padEnd(16)} ${meta[t].label.padEnd(16)} ${meta[t].kind.padEnd(6)} ${String(n).padStart(2)}  ${meta[t].description}`);
  }
  console.log(`\nEvery theme (${themes.length})   id · label · kind · variation of · look`);
  for (const fam of [...new Set(themes.map((t) => meta[t].family))]) {
    console.log(`\n  [${fam}]`);
    for (const t of themes.filter((x) => meta[x].family === fam)) {
      const m = meta[t];
      console.log(`    ${t.padEnd(16)} ${m.label.padEnd(16)} ${m.kind.padEnd(6)} ${(m.parent ?? '(hero)').padEnd(12)} ${m.description}`);
    }
  }
  const { types, meta: tmeta } = readTypes(readSources());
  console.log(`\nType collections (${types.length})   id · faces · look`);
  for (const t of types) console.log(`    ${t.padEnd(12)} ${facesOf([t], tmeta).join(' · ').padEnd(44)} ${tmeta[t].description}`);
  console.log('\nComponents   id · what it is');
  for (const g of [...new Set(COMPONENTS.map((c) => c.group))]) {
    console.log(`\n  [${g}]`);
    for (const c of COMPONENTS.filter((x) => x.group === g)) console.log(`    ${c.id.padEnd(16)} ${c.note}`);
  }
  console.log('\nArtinosTheme (the theme scope) and the studio base theme are always included.');
  console.log('"--components all" leaves out GraphGPU (it needs three); name it to include it.');
}

/* ---------- export ---------- */
function projectDir() {
  const p = opt('project');
  if (!p) die('missing --project <dir> (the app to set up; "." for the current folder)');
  const dir = path.resolve(p);
  if (!fs.existsSync(dir)) die(`project folder not found: ${dir}`);
  return dir;
}
const readPkg = (project) => {
  const f = path.join(project, 'package.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
};

function checkProject(project) {
  const pkg = readPkg(project);
  if (!pkg) return console.log('Note: no package.json here — make sure this is the app root.');
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (!deps.react) return console.log('Note: react is not in package.json — ARTINOS UI needs react and react-dom 18.3+.');
  console.log(`React ${deps.react}${deps['react-dom'] ? '' : ' (react-dom missing!)'}${deps.next ? ` · Next ${deps.next}` : ''}${deps.vite ? ` · Vite ${deps.vite}` : ''}`);
}

function exportKit(project) {
  const sources = readSources();
  const { themes: all } = readRegistry(sources);
  const pick = (v, choices, what) => {
    if (!v) die(`missing --${what} (comma list or "all"; see: node artinos.mjs list)`);
    if (v === 'all') return [...choices];
    const picked = v.split(',').map((s) => s.trim()).filter(Boolean);
    const bad = picked.filter((x) => !choices.includes(x));
    if (bad.length) die(`unknown ${what}: ${bad.join(', ')}\nAvailable: ${choices.join(', ')}`);
    return picked;
  };
  const themes = pick(opt('themes'), all, 'themes');
  const components = pick(opt('components'), COMPONENTS.map((c) => c.id), 'components');
  const { types: allTypes } = readTypes(sources);
  const types = opt('type') ? pick(opt('type').split(',').map((t) => TYPE_ALIASES[t.trim()] ?? t.trim()).join(','), allTypes, 'type') : [BASE_TYPE];
  // "all" leaves out the TSL compiler: it needs three. Name GraphGPU to include it.
  if (opt('components') === 'all') components.splice(components.indexOf('GraphGPU'), 1);
  const customs = opts('custom').map((f) => {
    const css = fs.readFileSync(path.resolve(f), 'utf8');
    const slug = css.match(/\[data-ar-theme='([^']+)'\]/)?.[1];
    if (!slug) die(`${f}: no [data-ar-theme='…'] block found`);
    return { slug, name: slug, css };
  });
  const out = opt('out') ? path.resolve(project, opt('out')) : path.join(project, fs.existsSync(path.join(project, 'src')) ? 'src' : '', 'artinos-ui');
  const folder = path.basename(out);
  const files = buildKit(sources, {
    folder, themes, components, customs, types,
    googleFonts: !flag('no-fonts'), materials: !flag('no-materials'),
    docs: flag('no-docs') ? null : readGuides(), pkgRoot: slash(ROOT),
  });
  const total = Object.values(files).reduce((n, s) => n + Buffer.byteLength(s), 0);

  if (flag('dry-run')) {
    for (const [p, s] of Object.entries(files)) console.log(`${(Buffer.byteLength(s) / 1024).toFixed(1).padStart(6)} KB  ${folder}/${p}`);
    console.log(`\n${Object.keys(files).length} files, ${(total / 1024).toFixed(0)} KB — dry run, nothing written.`);
    return null;
  }
  if (fs.existsSync(out) && fs.readdirSync(out).length) {
    if (!flag('force')) die(`${out} already exists and is not empty. Pass --force to update the kit in it.`);
    // remove only what a kit owns and this export no longer has
    const owned = new Set(Object.keys(files));
    const kitFile = /^(README\.md|artinos\.css|index\.ts|(tokens|core|slider|controls|actions|display|layout|overlays|dock|graph)\/([^/]+\/)*[^/]+\.(ts|tsx|css)|docs\/(components|catalogue|theming)\.md)$/;
    (function prune(dir, rel) {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const r = rel ? rel + '/' + e.name : e.name;
        if (e.isDirectory()) prune(path.join(dir, e.name), r);
        else if (kitFile.test(r) && !owned.has(r)) fs.unlinkSync(path.join(dir, e.name));
      }
    })(out, '');
    // innermost first, so a folder emptied by its subfolder's removal goes too
    for (const d of ['dock/metablock', 'dock', 'graph', 'overlays', 'display', 'actions', 'slider', 'controls', 'layout', 'core', 'tokens', 'docs']) {
      const p = path.join(out, d);
      if (fs.existsSync(p) && !fs.readdirSync(p).length) fs.rmdirSync(p);
    }
  }
  for (const [p, s] of Object.entries(files)) {
    const f = path.join(out, p);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, s);
  }
  console.log(`Kit: ${Object.keys(files).length} files (${(total / 1024).toFixed(0)} KB) → ${out}`);
  console.log(`  themes      ${[BASE_THEME, ...themes.filter((t) => t !== BASE_THEME)].join(', ')}${customs.length ? ' + custom ' + customs.map((c) => c.slug).join(', ') : ''}`);
  console.log(`  components  ${components.join(', ')}`);
  return out;
}

/** The app's root module: where the stylesheet is imported once. */
function findEntry(project) {
  const deps = { ...readPkg(project)?.dependencies, ...readPkg(project)?.devDependencies };
  const first = (bases) => {
    for (const b of bases) for (const e of ['tsx', 'jsx', 'ts', 'js']) if (fs.existsSync(path.join(project, `${b}.${e}`))) return `${b}.${e}`;
    return null;
  };
  if (deps.next) return first(['app/layout', 'src/app/layout']) ?? first(['pages/_app', 'src/pages/_app']) ?? 'app/layout.tsx';
  return first(['src/main', 'src/index', 'src/App', 'main', 'index']) ?? 'src/main.tsx';
}

function nextSteps(project, out) {
  const entry = findEntry(project);
  let spec = slash(path.relative(path.dirname(path.join(project, entry)), out));
  if (!spec.startsWith('.')) spec = './' + spec;
  const rel = slash(path.relative(project, out));
  console.log(`
Next steps
  1. In ${entry}, once:
       import '${spec}/artinos.css';
  2. Import components (path relative to the importing file):
       import { ArtinosTheme, Slider } from '${spec}';
  3. Wrap the UI:
       <ArtinosTheme theme="…">…</ArtinosTheme>
  Guide: ${rel}/README.md${flag('no-docs') ? '' : ` · ${rel}/docs/components.md · ${rel}/docs/catalogue.md · ${rel}/docs/theming.md`}`);
}

/* ---------- skill ---------- */
/** The skill's files: SKILL.md with this package's path filled in, and the guides as references. */
function skillFiles() {
  return {
    'SKILL.md': fs.readFileSync(SKILL, 'utf8').replaceAll('{{PACKAGE}}', slash(ROOT)),
    ...Object.fromEntries(Object.entries(readGuides()).map(([g, t]) => ['references/' + g, t])),
  };
}
function installSkill(target) {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
  for (const [p, s] of Object.entries(skillFiles())) {
    fs.mkdirSync(path.dirname(path.join(target, p)), { recursive: true });
    fs.writeFileSync(path.join(target, p), s);
  }
  console.log(`Skill installed → ${target}`);
}

/* ---------- sync (maintainers) ---------- */
function sync() {
  const { themes, meta, heroes } = readRegistry(readSources());
  const fams = [...new Set(themes.map((t) => meta[t].family))];
  const replaceBetween = (file, start, end, body) => {
    const s = fs.readFileSync(file, 'utf8');
    const a = s.indexOf(start);
    const b = s.indexOf(end, a);
    if (a < 0 || b < 0) die(`${slash(path.relative(ROOT, file))}: markers ${start} … ${end} not found`);
    fs.writeFileSync(file, s.slice(0, a + start.length) + body + s.slice(b));
  };
  // docs/theming.md: the heroes with their variations, then the full theme table
  const variations = (h) => themes.filter((t) => meta[t].parent === h);
  const heroRows = heroes.map((h) => `| \`${h}\` | ${meta[h].kind} | ${meta[h].description} | ${variations(h).map((t) => `\`${t}\``).join(' ') || '—'} |`);
  replaceBetween(path.join(DOCS, 'theming.md'), '<!-- heroes:start -->', '<!-- heroes:end -->', `\n| hero | kind | look | variations |\n|---|---|---|---|\n${heroRows.join('\n')}\n`);
  const rows = fams.flatMap((f) => themes.filter((t) => meta[t].family === f).map((t, i) => `| ${i ? '' : f} | \`${t}\` | ${meta[t].label} | ${meta[t].kind} | ${meta[t].parent ? `\`${meta[t].parent}\`` : '**hero**'} | ${meta[t].description} |`));
  replaceBetween(path.join(DOCS, 'theming.md'), '<!-- themes:start -->', '<!-- themes:end -->', `\n| family | id | name | kind | variation of | look |\n|---|---|---|---|---|---|\n${rows.join('\n')}\n`);
  // src/tokens/themes.css: the header list
  const head = fams.map((f) => ` *   ${f}\n` + themes.filter((t) => meta[t].family === f).map((t) => ` *     ${t.padEnd(16)}${meta[t].description}`).join('\n')).join('\n');
  replaceBetween(path.join(SRC, 'tokens', 'themes.css'), ' * themes:start', ' * themes:end', `\n${head}\n`);
  console.log(`Synced ${themes.length} themes → docs/theming.md, src/tokens/themes.css`);
}

/* ---------- run ---------- */
switch (cmd) {
  case 'list':
    list();
    break;
  case 'export':
  case 'setup': {
    const project = projectDir();
    checkProject(project);
    const out = exportKit(project);
    if (!out) break;
    if (cmd === 'setup') installSkill(path.join(project, '.claude', 'skills', 'artinos-ui'));
    nextSteps(project, out);
    break;
  }
  case 'skill':
    installSkill(flag('user') ? path.join(os.homedir(), '.claude', 'skills', 'artinos-ui') : path.join(projectDir(), '.claude', 'skills', 'artinos-ui'));
    break;
  case 'pack': {
    const files = Object.fromEntries(Object.entries(skillFiles()).map(([p, s]) => ['artinos-ui/' + p, s]));
    const dest = path.join(ROOT, 'dist', 'artinos-ui.skill');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, zip(files));
    console.log(`Packed ${Object.keys(files).length} files → ${dest}`);
    break;
  }
  case 'sync':
    sync();
    break;
  default: {
    const doc = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0];
    console.log(doc.replace(/^#!.*\n\/\* ?/, '').replace(/^ \* ?/gm, ''));
    if (cmd && cmd !== 'help' && cmd !== '--help') process.exit(1);
  }
}
