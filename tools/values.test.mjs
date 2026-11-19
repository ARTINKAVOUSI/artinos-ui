// Arithmetic with known answers, and the saved-values format: a file written today must load
// tomorrow. Run with: pnpm test
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const showcase = createRequire(new URL('../showcase/package.json', import.meta.url));
const esbuild = createRequire(showcase.resolve('vite'))('esbuild');
const built = await esbuild.build({
  stdin: { contents: "export { evaluate } from './src/core/expression.ts'; export { parseTyped } from './src/slider/engine.ts'; export { createInspectorStore, INSPECT_FORMAT } from './src/inspector/store.ts'; export { createPerfFeed } from './src/perf/source.ts';", resolveDir: root, loader: 'ts' },
  bundle: true,
  format: 'esm',
  write: false,
  logLevel: 'error',
});
const { evaluate, parseTyped, createInspectorStore, INSPECT_FORMAT, createPerfFeed } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].contents).toString('base64')}`);

test('sums come out right', () => {
  for (const [text, value] of [['2*3+1', 7], ['(4+6)/2', 5], ['2^8', 256], ['-2^2', -4], ['2^3^2', 512], ['1.5k', 1500], ['10%3', 1], ['min(3, 8)', 3], ['sqrt(81)', 9]]) assert.equal(evaluate(text), value, text);
  assert.ok(Math.abs(evaluate('sin(pi/2)') - 1) < 1e-12);
});

test('the value being edited is x', () => {
  assert.equal(evaluate('*2', 21), 42);
  assert.equal(evaluate('/4', 8), 2);
  assert.equal(evaluate('+=10', 5), 15);
  assert.equal(evaluate('-=2', 5), 3);
  assert.equal(evaluate('x^2', 3), 9);
});

test('anything else is refused', () => {
  for (const text of ['', '2+', '(1', '1/0', 'alert(1)', 'constructor', 'x.y', '1 2']) assert.equal(evaluate(text), null, text);
});

test('a reading keeps its units', () => {
  assert.equal(parseTyped('47', 'percent'), 0.47);
  assert.equal(parseTyped('1.2 kHz'), 1200);
  assert.equal(parseTyped('-4.5 dB'), -4.5);
  assert.equal(parseTyped('128°'), 128);
  assert.equal(parseTyped('50+10', 'percent'), 0.6);
  assert.equal(parseTyped('-inf'), -Infinity);
});

const items = [
  { key: 'n', label: 'N', kind: 'number', default: 1, min: 0, max: 10, step: 0.5 },
  { key: 'mode', label: 'Mode', kind: 'choice', default: 'a', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] },
  { key: 'at', label: 'At', kind: 'vector', default: [0, 0, 0] },
];

test('a saved file has the agreed shape and loads back', () => {
  const a = createInspectorStore(items, { version: 3 });
  a.set('n', 4);
  a.set('mode', 'b');
  const file = JSON.parse(JSON.stringify(a.toJSON()));
  assert.deepEqual(file, { format: 'artinos.values', version: 3, values: { n: 4, mode: 'b', at: [0, 0, 0] } });
  assert.equal(file.format, INSPECT_FORMAT);
  const b = createInspectorStore(items, { version: 3 });
  assert.equal(b.fromJSON(JSON.stringify(file)), true);
  assert.deepEqual(b.get(), file.values);
});

test('an older file is migrated, and bad values never land', () => {
  const s = createInspectorStore(items, { version: 2, migrate: (v, from) => (from === 1 ? { ...v, n: v.count } : v) });
  assert.equal(s.fromJSON({ format: INSPECT_FORMAT, version: 1, values: { count: 99, mode: 'nope', at: [1, 2], gone: true } }), true);
  assert.deepEqual(s.get(), { n: 10, mode: 'a', at: [0, 0, 0] });
  s.undo();
  assert.equal(s.get().n, 1);
  assert.equal(s.fromJSON('not json'), false);
  assert.equal(s.fromJSON({ format: 'someone.else' }), false);
});

test('one gesture is one undo step, and a seed repeats', () => {
  const s = createInspectorStore(items);
  s.scrub('n', 2);
  s.scrub('n', 3.2);
  s.commit();
  assert.equal(s.get().n, 3);
  assert.equal(s.state().undoable, 1);
  s.undo();
  assert.equal(s.get().n, 1);
  s.redo();
  assert.equal(s.get().n, 3);
  const seed = s.randomize({ seed: 7 });
  const first = s.get();
  s.reset();
  s.randomize({ seed });
  assert.deepEqual(s.get(), first);
});

test('frame figures come out right from known frames', async () => {
  const feed = createPerfFeed({ budget: 20 });
  // 99 steady frames and one that takes 100 ms
  for (let i = 0; i < 99; i++) feed.frame(10);
  feed.frame(100);
  await new Promise((r) => setTimeout(r, 260));
  feed.frame(10);
  const s = feed.get();
  assert.equal(s.worst, 100);
  assert.equal(s.p95, 10);
  assert.equal(s.janks, 1);
  assert.equal(s.dropped, 4);
  assert.ok(Math.abs(s.frameMs - 1100 / 101) < 1e-9);
  assert.ok(Number.isNaN(s.gpuLoad), 'nobody reported a GPU');
});
