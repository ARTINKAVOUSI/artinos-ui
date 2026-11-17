import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx, DENSITIES } from './utils';
import type { Accent, Density, MaterialName, ThemeName, TypeCollection } from './utils';
import { DEFAULT_THEME, THEME_ALIASES, TYPE_ALIASES } from './utils';

/** Token overrides: `{ signal: '#ff4fa3', 'radius-control': '6px' }` or full `--ar-*` names. */
export type TokenOverrides = Record<string, string | number>;
/** A theme's settings for each density family: what it changes in Dense, in Standard, in Comfort. */
export type DensityTokens = Partial<Record<Density, TokenOverrides>>;

const tokenName = (k: string) => (k.startsWith('--') ? k : '--ar-' + k);

/** Turns token overrides into inline CSS custom properties. */
export function themeStyle(tokens: TokenOverrides | undefined): CSSProperties {
  const out: Record<string, string | number> = {};
  if (tokens) for (const [k, v] of Object.entries(tokens)) out[tokenName(k)] = v;
  return out as CSSProperties;
}

const hasLayers = (layers: DensityTokens | undefined): layers is DensityTokens => !!layers && DENSITIES.some((d) => layers[d] && Object.keys(layers[d]!).length);

/** A short stable name for a set of layers, so the same settings share one rule and need no hook. */
function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

const declarations = (tokens: TokenOverrides) =>
  Object.entries(tokens)
    .map(([k, v]) => `${tokenName(k)}:${String(v).replace(/[<>{}]/g, '')};`)
    .join('');

/**
 * The CSS that applies a theme's per-density settings under `[data-ar-layers=id]`: the shared tokens
 * on the scope, and each family's own on top wherever that family is in force (on the scope, from an
 * ancestor, or on a nested density scope inside it). The selector is repeated so it outranks the
 * theme's own rules, as inline tokens would.
 */
export function densityTokensCss(id: string, shared: TokenOverrides | undefined, layers: DensityTokens) {
  const s = `[data-ar-layers='${id}']`.repeat(4);
  const rules = shared && Object.keys(shared).length ? [`${s}{${declarations(shared)}}`] : [];
  for (const d of DENSITIES) {
    const t = layers[d];
    if (!t || !Object.keys(t).length) continue;
    // the scope's own density wins; without one, an ancestor's; with none anywhere, Standard
    const inherited = `:not([data-ar-density]):is([data-ar-density='${d}'] *)`;
    const here = d === 'standard' ? `:is([data-ar-density='standard'],${inherited},:not([data-ar-density]):not([data-ar-density] *))` : `:is([data-ar-density='${d}'],${inherited})`;
    rules.push(`${s}${here},${s} [data-ar-density='${d}']{${declarations(t)}}`);
  }
  return rules.join('\n');
}

export interface ArtinosThemeProps extends HTMLAttributes<HTMLElement> {
  /** A built-in theme (see THEMES), or the name of your own `[data-ar-theme='…']` CSS block
   *  — e.g. one exported from the showcase theme editor. Default nimbus (DEFAULT_THEME). */
  theme?: ThemeName | (string & {});
  /** Advanced: override the theme's control finish for every control inside. */
  material?: MaterialName;
  /** The density family for the whole scope (see DENSITIES): dense · standard · comfort. Every size and
   *  corner of the theme is scaled to it, and dense has its own row rules. Inherits when omitted. */
  density?: Density;
  /** A type collection (see TYPE_COLLECTIONS): the faces and their tuning. Inherits when omitted;
   *  the default is `fine`. Earlier ids still work (TYPE_ALIASES). */
  type?: TypeCollection | (string & {});
  /** An accent (see ACCENTS) in place of the theme's own signal: live edges, LEDs, focus and
   *  selection take it, nothing else changes. Each accent has a dark and a light value. */
  accent?: Accent;
  /** Token overrides for a custom look, applied on top of the theme in every density. */
  tokens?: TokenOverrides;
  /** Token overrides for one density family only: `{ dense: { signal: '#ff4fa3' } }` changes the theme in
   *  Dense and leaves Standard and Comfort as they are. Applied on top of `tokens`. */
  densityTokens?: DensityTokens;
  /** What the glass sits over. Over a scene of the other kind than the theme's ink (frost-deep
   *  over a light room), a wash of the theme's own ground goes under every glass surface and the
   *  quiet inks step up to mid, so every text role holds 4.5:1. Omit over a scene the theme was
   *  drawn for. */
  scene?: 'light' | 'dark';
  /** Paint the theme's app ground (background + text colour). */
  ground?: boolean;
  as?: ElementType;
  children?: ReactNode;
}

/**
 * Optional scope wrapper. It only sets data attributes and tokens, so the same result is
 * available without React: <div data-ar-theme="nimbus">. Per-density tokens come with a small
 * rule of their own, so they follow whichever density family is in force.
 */
export function ArtinosTheme({ theme = DEFAULT_THEME, material, density, type, accent, scene, tokens, densityTokens, ground, as = 'div', className, style, children, ...rest }: ArtinosThemeProps) {
  // Narrowed for JSX: hosts that augment JSX.IntrinsicElements (React Three Fiber) make
  // the full ElementType union too large for TypeScript to call. Any tag renders the same.
  const Tag = as as 'div';
  const layered = hasLayers(densityTokens);
  const id = layered ? hash(JSON.stringify([tokens, densityTokens])) : undefined;
  return (
    <Tag
      {...rest}
      data-ar-theme={THEME_ALIASES[theme] ?? theme}
      data-ar-material={material}
      data-ar-density={density}
      data-ar-type={type ? (TYPE_ALIASES[type] ?? type) : undefined}
      data-ar-accent={accent}
      data-ar-scene={scene}
      data-ar-layers={id}
      className={cx('ar-theme', ground && 'ar-theme--ground', className)}
      // with layers the shared tokens move into the rule too, so a family's own value can win over them
      style={{ ...(layered ? null : themeStyle(tokens)), ...style }}
    >
      {layered && id ? <style>{densityTokensCss(id, tokens, densityTokens)}</style> : null}
      {children}
    </Tag>
  );
}
