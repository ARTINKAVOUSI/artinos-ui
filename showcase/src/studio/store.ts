/* Theme Studio — saved themes and exporters. Saved themes live in this browser's
   localStorage (a per-viewer convenience); export them to keep or share. */
import { DENSITIES, THEMES, THEME_META } from '../../../src';
import type { Density, ThemeName } from '../../../src';
import { DENSITY_TOKENS } from './spec';

export interface CustomTheme {
  id: string;
  name: string;
  base: ThemeName;
  /** full --ar-* names → CSS values; only what differs from the base theme, in every density */
  tokens: Record<string, string>;
  /** what differs in one density family only: an edit made while previewing Dense lands in `dense` */
  layers?: Layers;
  updated: number;
}

export type Layers = Partial<Record<Density, Record<string, string>>>;

/* The Studio edits one flat map: shared tokens by name, a family's own as "dense|--ar-signal". */
const SEP = '|';
export const layerKey = (d: Density, token: string) => d + SEP + token;
/** A theme's shared tokens and its layers as the one map the Studio edits. */
export function flatten(t: { tokens: Record<string, string>; layers?: Layers }): Record<string, string> {
  const out = { ...t.tokens };
  for (const d of DENSITIES) for (const [k, v] of Object.entries(t.layers?.[d] ?? {})) out[layerKey(d, k)] = v;
  return out;
}
/** The flat map back into shared tokens and a layer per family (empty layers dropped). */
export function split(flat: Record<string, string>): { tokens: Record<string, string>; layers: Layers } {
  const tokens: Record<string, string> = {};
  const layers: Layers = {};
  for (const [k, v] of Object.entries(flat)) {
    const i = k.indexOf(SEP);
    if (i < 0) tokens[k] = v;
    else {
      const d = k.slice(0, i) as Density;
      if ((DENSITIES as readonly string[]).includes(d)) (layers[d] ??= {})[k.slice(i + 1)] = v;
    }
  }
  return { tokens, layers };
}
/** Every token a theme resolves to, read from a hidden probe in this document. */
export function resolveTheme(base: ThemeName, tokens: Record<string, string>, names: string[]) {
  const probe = document.createElement('div');
  probe.setAttribute('data-ar-theme', base);
  for (const [k, v] of Object.entries(tokens)) probe.style.setProperty(k, v);
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const resolved: Record<string, string> = {};
  for (const n of names) resolved[n] = cs.getPropertyValue(n).trim();
  const scheme = cs.colorScheme.includes('light') ? 'light' : 'dark';
  probe.remove();
  return { resolved, scheme };
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
export function toJson(t: Pick<CustomTheme, 'name' | 'base' | 'tokens' | 'layers'>) {
  return JSON.stringify({ format: 'artinos-ui-theme', version: 2, name: t.name, base: t.base, tokens: t.tokens, layers: t.layers ?? {} }, null, 2);
}
export function fromJson(text: string): Pick<CustomTheme, 'name' | 'base' | 'tokens' | 'layers'> {
  const o = JSON.parse(text);
  if (!o || typeof o !== 'object') throw new Error('Not a theme file.');
  const base = (THEMES as readonly string[]).includes(o.base) ? (o.base as ThemeName) : 'pro-gray';
  const tokens: Record<string, string> = {};
  for (const [k, v] of Object.entries(o.tokens ?? {})) {
    if (typeof v !== 'string') continue;
    tokens[k.startsWith('--') ? k : '--ar-' + k] = v;
  }
  const layers: Layers = {};
  for (const d of DENSITIES) {
    const l = o.layers?.[d];
    if (!l || typeof l !== 'object') continue;
    for (const [k, v] of Object.entries(l)) if (typeof v === 'string') (layers[d] ??= {})[k.startsWith('--') ? k : '--ar-' + k] = v;
  }
  return { name: typeof o.name === 'string' && o.name.trim() ? o.name.trim() : 'Imported theme', base, tokens, layers };
}

/**
 * A standalone CSS theme: every resolved token, so it needs nothing but artinos.css.
 * `resolved` is read from the live preview; empty values mean "unset" (`initial`).
 */
export function toCss(name: string, base: ThemeName, resolved: Record<string, string>, overrides: Record<string, string>, scheme: string, layers: Layers = {}) {
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
${layerCss(slug, layers)}`;
}

/** Each density family's own settings, applied wherever that family is in force on this theme. */
function layerCss(slug: string, layers: Layers) {
  const t = `[data-ar-theme='${slug}']`;
  return DENSITIES.filter((d) => Object.keys(layers[d] ?? {}).length)
    .map((d) => {
      const sel =
        d === 'standard'
          ? [`${t}[data-ar-density='standard']`, `[data-ar-density='standard'] ${t}:not([data-ar-density])`, `${t}:not([data-ar-density]):not([data-ar-density] *)`, `${t} [data-ar-density='standard']`]
          : [`${t}[data-ar-density='${d}']`, `[data-ar-density='${d}'] ${t}:not([data-ar-density])`, `${t} [data-ar-density='${d}']`];
      const body = Object.entries(layers[d]!)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `  ${k}: ${v};`)
        .join('\n');
      return `\n/* ${d}: this theme's own settings in the ${d} density family */\n${sel.join(',\n')} {\n${body}\n}\n`;
    })
    .join('');
}

/** The overrides as a React snippet on top of the base theme. */
export function toTsx(name: string, base: ThemeName, overrides: Record<string, string>, layers: Layers = {}) {
  const body = Object.entries(overrides)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `    '${k.replace(/^--ar-/, '')}': ${JSON.stringify(v)},`)
    .join('\n');
  const used = DENSITIES.filter((d) => Object.keys(layers[d] ?? {}).length);
  const perDensity = used.length
    ? `\n  densityTokens={{\n${used
        .map((d) => `    ${d}: {\n${Object.entries(layers[d]!).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `      '${k.replace(/^--ar-/, '')}': ${JSON.stringify(v)},`).join('\n')}\n    },`)
        .join('\n')}\n  }}`
    : '';
  return `// ${name} — ${Object.keys(overrides).length} overrides on "${base}"${used.length ? `, and its own settings in ${used.join(', ')}` : ''}
<ArtinosTheme
  theme="${base}"
  tokens={{
${body}
  }}${perDensity}
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
