/* Export kit — the shared kit builder (../tools/kit.mjs, also behind `artinos.mjs export`)
   fed with the package source and guides, bundled into the page at build time. */
import { BASE_THEME, buildKit as build, COMPONENTS } from '../../../tools/kit.mjs';
import type { KitOptions } from '../../../tools/kit.mjs';

export type { CustomThemeCss } from '../../../tools/kit.mjs';
export { BASE_THEME };
export const KIT_COMPONENTS = COMPONENTS;

const strip = (prefix: string, raw: Record<string, string>) => Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.slice(prefix.length), v]));

/** src-relative path → source text, exactly as shipped */
const SOURCES = strip('../../../src/', import.meta.glob('../../../src/**/*.{ts,tsx,css}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>);
/** the guides every kit can carry in docs/ */
const DOCS = strip('../../../docs/', import.meta.glob('../../../docs/{components,theming}.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>);

export function buildKit(o: Omit<KitOptions, 'docs'> & { docs: boolean }): Record<string, string> {
  return build(SOURCES, { ...o, docs: o.docs ? DOCS : null });
}
