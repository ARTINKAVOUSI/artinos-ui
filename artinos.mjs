#!/usr/bin/env node
/* ARTINOS UI — one entry point for using this package in other projects. Node 18+, no dependencies.
 *
 *   node artinos.mjs list
 *       every theme (grouped, with descriptions) and component
 *
 *   node artinos.mjs setup --project <dir> --themes frost-deep,onyx --components Slider,Panel,Select [kit options]
 *       export a trimmed kit into the project (with its guides), install the Claude Code skill
 *       into <dir>/.claude/skills/artinos-ui, and print how to wire it up
 *
 *   node artinos.mjs export --project <dir> --themes … --components … [kit options]
 *       only the kit
 *
 *   node artinos.mjs skill --project <dir>     install / refresh the skill in one project
 *   node artinos.mjs skill --user              install / refresh it for every project (~/.claude/skills)
 *
 * Kit options (passed through to skills/artinos-ui/scripts/artinos-kit.mjs):
 *   --out <dir>        kit folder, relative to --project (default: src/artinos-ui if src/ exists, else artinos-ui)
 *   --themes <list|all>   --components <list|all>   --custom <file.css>
 *   --no-fonts   --no-materials   --no-docs   --force   --dry-run
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.join(ROOT, 'skills', 'artinos-ui');
const KIT = path.join(SKILL, 'scripts', 'artinos-kit.mjs');

const [cmd, ...rest] = process.argv.slice(2);
const has = (n) => rest.includes('--' + n);
const val = (n) => {
  const i = rest.indexOf('--' + n);
  return i >= 0 ? rest[i + 1] : undefined;
};
const die = (m) => {
  console.error('artinos: ' + m);
  process.exit(1);
};
/** rest minus our own flags, for the kit script */
const passThrough = () => {
  const out = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--project' || rest[i] === '--out') i++;
    else if (rest[i] === '--user') continue;
    else out.push(rest[i]);
  }
  return out;
};
const kit = (args) => {
  try {
    execFileSync(process.execPath, [KIT, '--src', path.join(ROOT, 'artinos-ui'), ...args], { stdio: 'inherit' });
  } catch {
    process.exit(1); // the exporter already printed why
  }
};

function projectDir() {
  const p = val('project');
  if (!p) die('missing --project <dir> (the project to set up; "." for the current folder)');
  const dir = path.resolve(p);
  if (!fs.existsSync(dir)) die(`project folder not found: ${dir}`);
  return dir;
}

function kitOut(project) {
  const o = val('out');
  if (o) return path.resolve(project, o);
  return path.join(project, fs.existsSync(path.join(project, 'src')) ? 'src' : '', 'artinos-ui');
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name);
    const b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

function installSkill(target) {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
  copyDir(SKILL, target);
  console.log(`Skill installed: ${target}`);
}

function checkProject(project) {
  const pkgFile = path.join(project, 'package.json');
  if (!fs.existsSync(pkgFile)) return console.log('Note: no package.json found — make sure this is the app root.');
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const react = deps.react;
  if (!react) console.log('Note: react is not in package.json — ARTINOS UI needs react and react-dom 18.3+.');
  else console.log(`React ${react}${deps['react-dom'] ? '' : ' (react-dom missing!)'}${deps.next ? ` · Next ${deps.next}` : ''}${deps.vite ? ` · Vite ${deps.vite}` : ''}`);
}

/** The app's root module: where the stylesheet is imported once. */
function findEntry(project) {
  const pkg = fs.existsSync(path.join(project, 'package.json')) ? JSON.parse(fs.readFileSync(path.join(project, 'package.json'), 'utf8')) : {};
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const exts = ['tsx', 'jsx', 'ts', 'js'];
  const first = (bases) => {
    for (const b of bases) for (const e of exts) if (fs.existsSync(path.join(project, `${b}.${e}`))) return `${b}.${e}`;
    return null;
  };
  if (deps.next) return first(['app/layout', 'src/app/layout']) ?? first(['pages/_app', 'src/pages/_app']) ?? 'app/layout.tsx';
  return first(['src/main', 'src/index', 'src/App', 'main', 'index']) ?? 'src/main.tsx';
}

function nextSteps(project, out) {
  const rel = path.relative(project, out).split(path.sep).join('/');
  const entry = findEntry(project);
  let spec = path.relative(path.dirname(path.join(project, entry)), out).split(path.sep).join('/');
  if (!spec.startsWith('.')) spec = './' + spec;
  console.log(`
Next steps
  1. In ${entry}, once:
       import '${spec}/artinos.css';
  2. Import components (path relative to the importing file):
       import { ArtinosTheme, Slider } from '${spec}';
  3. Wrap the UI:
       <ArtinosTheme theme="…">…</ArtinosTheme>
  Guides: ${rel}/README.md (usage for this kit) · ${rel}/docs/components.md · ${rel}/docs/theming.md`);
}

switch (cmd) {
  case 'list':
    kit(['--list']);
    break;
  case 'export': {
    const project = projectDir();
    checkProject(project);
    kit(['--out', kitOut(project), ...passThrough()]);
    if (!has('dry-run')) nextSteps(project, kitOut(project));
    break;
  }
  case 'setup': {
    const project = projectDir();
    checkProject(project);
    kit(['--out', kitOut(project), ...passThrough()]);
    if (has('dry-run')) break;
    installSkill(path.join(project, '.claude', 'skills', 'artinos-ui'));
    nextSteps(project, kitOut(project));
    break;
  }
  case 'skill':
    if (has('user')) installSkill(path.join(os.homedir(), '.claude', 'skills', 'artinos-ui'));
    else installSkill(path.join(projectDir(), '.claude', 'skills', 'artinos-ui'));
    break;
  default:
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace(/^#!.*\n\/\* ?/, '').replace(/^ \* ?/gm, ''));
    if (cmd && cmd !== 'help' && cmd !== '--help') process.exit(1);
}
