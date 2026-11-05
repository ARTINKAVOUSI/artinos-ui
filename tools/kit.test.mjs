// The kit builder reads type sets from the source line by line, so a reformatted entry would drop a
// set silently. Run with: node --test tools/kit.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { BASE_TYPE, facesOf, readTypes, TYPE_ALIASES } from './kit.mjs';

const root = new URL('../src/', import.meta.url);
const utils = readFileSync(new URL('core/utils.ts', root), 'utf8');
const typeCss = readFileSync(new URL('tokens/type.css', root), 'utf8');
const fontsCss = readFileSync(new URL('tokens/fonts.css', root), 'utf8');
const { types, meta } = readTypes({ 'core/utils.ts': utils });

test('every type set parses, with faces and fonts', () => {
  assert.ok(types.includes(BASE_TYPE));
  for (const t of types) {
    assert.ok(meta[t], `${t} has no parsable TYPE_META line`);
    assert.ok(meta[t].ui && meta[t].mono && meta[t].fonts, `${t} is missing a face or fonts`);
    assert.ok(facesOf([t], meta).length > 0);
  }
});

test('every type set has its CSS block', () => {
  for (const t of types) assert.ok(typeCss.includes(`[data-ar-type='${t}']`), `${t} has no block in type.css`);
});

test('the showcase font request names every family a set needs', () => {
  for (const t of types) for (const p of meta[t].fonts.split('&')) assert.ok(fontsCss.includes(p.split(':')[0]), `${t}: ${p} is not in fonts.css`);
});

test('earlier ids point at real sets', () => {
  for (const [from, to] of Object.entries(TYPE_ALIASES)) assert.ok(types.includes(to), `${from} → ${to} does not exist`);
});
