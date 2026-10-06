/* Theme Studio — saved themes and exporters. Saved themes live in this browser's
   localStorage (a per-viewer convenience); export them to keep or share. */
import { THEMES, THEME_META } from '../../../artinos-ui';
import type { ThemeName } from '../../../artinos-ui';
import { DENSITY_TOKENS } from './spec';

export interface CustomTheme {
  id: string;
  name: string;
  base: ThemeName;
  /** full --ar-* names → CSS values; only what differs from the base theme */
  tokens: Record<string, string>;
  updated: number;
}

const KEY = 'artinos-ui.theme-studio.v1';

export function loadThemes(): CustomTheme[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as CustomTheme[]) : [];
    return Array.isArray(list) ? list.filter((t) => t && t.id && (THEMES as readonly string[]).includes(t.base)) : [];
  } catch {
    return [];
  }
}
export function saveThemes(list: CustomTheme[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage blocked (private window) — themes stay for this session only */
  }
}

export const newId = () => Math.random().toString(36).slice(2, 10);
export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'my-theme';

/** A theme file: name, base and overrides — re-importable into the studio. */
export function toJson(t: Pick<CustomTheme, 'name' | 'base' | 'tokens'>) {
  return JSON.stringify({ format: 'artinos-ui-theme', version: 1, name: t.name, base: t.base, tokens: t.tokens }, null, 2);
}
export function fromJson(text: string): Pick<CustomTheme, 'name' | 'base' | 'tokens'> {
  const o = JSON.parse(text);
  if (!o || typeof o !== 'object') throw new Error('Not a theme file.');
  const base = (THEMES as readonly string[]).includes(o.base) ? (o.base as ThemeName) : 'studio';
  const tokens: Record<string, string> = {};
  for (const [k, v] of Object.entries(o.tokens ?? {})) {
    if (typeof v !== 'string') continue;
    tokens[k.startsWith('--') ? k : '--ar-' + k] = v;
  }
  return { name: typeof o.name === 'string' && o.name.trim() ? o.name.trim() : 'Imported theme', base, tokens };
}

/**
 * A standalone CSS theme: every resolved token, so it needs nothing but artinos.css.
 * `resolved` is read from the live preview; empty values mean "unset" (`initial`).
 */
export function toCss(name: string, base: ThemeName, resolved: Record<string, string>, overrides: Record<string, string>, scheme: string) {
  const slug = slugify(name);
  const lines = Object.keys(resolved)
    .sort()
    .filter((k) => !DENSITY_TOKENS.includes(k) || k in overrides)
    .map((k) => `  ${k}: ${resolved[k] === '' ? 'initial' : resolved[k]};`);
  return `/* ARTINOS UI theme — ${name}
 * Built in the Theme Studio from "${THEME_META[base].label}". Load after artinos.css, then use
 *   <ArtinosTheme theme="${slug}">…</ArtinosTheme>   or   <div data-ar-theme="${slug}">…</div>
 */
[data-ar-theme='${slug}'] {
${lines.join('\n')}
  color-scheme: ${scheme === 'light' ? 'light' : 'dark'};
}
`;
}

/** The overrides as a React snippet on top of the base theme. */
export function toTsx(name: string, base: ThemeName, overrides: Record<string, string>) {
  const body = Object.entries(overrides)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `    '${k.replace(/^--ar-/, '')}': ${JSON.stringify(v)},`)
    .join('\n');
  return `// ${name} — ${Object.keys(overrides).length} overrides on "${base}"
<ArtinosTheme
  theme="${base}"
  tokens={{
${body}
  }}
>
  {/* controls */}
</ArtinosTheme>
`;
}

export function download(filename: string, text: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
