/* ARTINOS UI — the npm build. The copy-in kit stays the source of truth; this writes a package
   ready to publish into dist/npm and prints what each way in costs.

     node tools/build.mjs

   Needs the showcase's dev dependencies installed (esbuild comes with Vite, tsc with TypeScript). */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist', 'npm');
const showcase = createRequire(join(root, 'showcase', 'package.json'));
const esbuild = createRequire(showcase.resolve('vite'))('esbuild');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const EXTERNAL = ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'three', 'three/*'];
const shared = { bundle: true, format: 'esm', target: 'es2022', jsx: 'automatic', minify: true, legalComments: 'none', external: EXTERNAL, logLevel: 'error' };
// 'use client' sits inside each source file; a bundle states it once, at the top
const silent = { logOverride: { 'module-level-directive': 'silent' } };

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

await esbuild.build({ ...shared, ...silent, entryPoints: { index: join(root, 'src/index.ts') }, outdir: out, splitting: false, banner: { js: "'use client';" } });
await esbuild.build({ ...shared, entryPoints: { signals: join(root, 'src/signals.ts') }, outdir: out });
await esbuild.build({ bundle: true, minify: true, logLevel: 'error', entryPoints: { artinos: join(root, 'src/artinos.css') }, outdir: out, external: ['https://*'], loader: { '.woff2': 'dataurl', '.png': 'dataurl', '.svg': 'dataurl' } });

/* types, from the same source */
const tsc = showcase.resolve('typescript/bin/tsc');
const tsconfig = join(out, 'tsconfig.types.json');
writeFileSync(
  tsconfig,
  JSON.stringify({
    compilerOptions: { declaration: true, emitDeclarationOnly: true, outDir: 'types', rootDir: '../../src', jsx: 'react-jsx', module: 'ESNext', moduleResolution: 'Bundler', target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], strict: true, skipLibCheck: true, types: [], typeRoots: [join(root, 'showcase/node_modules/@types')], baseUrl: '.', paths: { react: [join(root, 'showcase/node_modules/@types/react')], 'react/jsx-runtime': [join(root, 'showcase/node_modules/@types/react/jsx-runtime')], 'react-dom': [join(root, 'showcase/node_modules/@types/react-dom')], 'react-dom/client': [join(root, 'showcase/node_modules/@types/react-dom/client')], three: [join(root, 'showcase/node_modules/@types/three')], 'three/*': [join(root, 'showcase/node_modules/@types/three/*')] } },
    files: [join(root, 'src/index.ts'), join(root, 'src/signals.ts')],
  }),
);
execFileSync(process.execPath, [tsc, '-p', tsconfig], { stdio: 'inherit' });
rmSync(tsconfig);

for (const doc of ['README.md']) if (existsSync(join(root, doc))) cpSync(join(root, doc), join(out, doc));
cpSync(join(root, 'docs'), join(out, 'docs'), { recursive: true });

writeFileSync(
  join(out, 'package.json'),
  JSON.stringify(
    {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description.replace(' TypeScript source, no build step.', ''),
      type: 'module',
      main: './index.js',
      module: './index.js',
      types: './types/index.d.ts',
      exports: {
        '.': { types: './types/index.d.ts', default: './index.js' },
        './signals': { types: './types/signals.d.ts', default: './signals.js' },
        './artinos.css': './artinos.css',
        './package.json': './package.json',
      },
      sideEffects: ['**/*.css'],
      peerDependencies: pkg.peerDependencies,
      peerDependenciesMeta: pkg.peerDependenciesMeta,
      license: pkg.license,
    },
    null,
    2,
  ) + '\n',
);

/* what each way in costs a project, tree-shaken the way its bundler would */
const measure = async (label, source) => {
  const r = await esbuild.build({ ...shared, ...silent, stdin: { contents: source, resolveDir: root, loader: 'ts' }, write: false, treeShaking: true });
  const code = r.outputFiles[0].contents;
  return { label, min: code.length, gzip: gzipSync(code, { level: 9 }).length };
};
const from = "from './src/index.ts'";
const rows = [
  await measure('signals only', "export * from './src/signals.ts'"),
  await measure('Slider', `export { Slider } ${from}`),
  await measure('Inspector + store', `export { Inspector, createInspectorStore } ${from}`),
  await measure('useControls', `export { useControls, ControlsPanel } ${from}`),
  await measure('createPane', `export { createPane } ${from}`),
  await measure('everything', `export * ${from}`),
];
const css = readFileSync(join(out, 'artinos.css'));
rows.push({ label: 'artinos.css', min: css.length, gzip: gzipSync(css, { level: 9 }).length });

const kb = (n) => `${(n / 1024).toFixed(1)} kB`.padStart(9);
console.log(`\n${pkg.name}@${pkg.version} → dist/npm\n`);
console.log('way in'.padEnd(20) + 'minified'.padStart(9) + 'gzip'.padStart(11));
for (const r of rows) console.log(r.label.padEnd(20) + kb(r.min) + '  ' + kb(r.gzip));
console.log('');
