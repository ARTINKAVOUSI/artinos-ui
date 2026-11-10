import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from './utils';
import type { Accent, Density, MaterialName, ThemeName, TypeCollection } from './utils';
import { DEFAULT_THEME, THEME_ALIASES, TYPE_ALIASES } from './utils';

/** Token overrides: `{ signal: '#ff4fa3', 'radius-control': '6px' }` or full `--ar-*` names. */
export type TokenOverrides = Record<string, string | number>;

/** Turns token overrides into inline CSS custom properties. */
export function themeStyle(tokens: TokenOverrides | undefined): CSSProperties {
  const out: Record<string, string | number> = {};
  if (tokens) for (const [k, v] of Object.entries(tokens)) out[k.startsWith('--') ? k : '--ar-' + k] = v;
  return out as CSSProperties;
}

export interface ArtinosThemeProps extends HTMLAttributes<HTMLElement> {
  /** A built-in theme (see THEMES), or the name of your own `[data-ar-theme='…']` CSS block
   *  — e.g. one exported from the showcase theme editor. Default nimbus (DEFAULT_THEME). */
  theme?: ThemeName | (string & {});
  /** Advanced: override the theme's control finish for every control inside. */
  material?: MaterialName;
  density?: Density;
  /** A type collection (see TYPE_COLLECTIONS): the faces and their tuning. Inherits when omitted;
   *  the default is `fine`. Earlier ids still work (TYPE_ALIASES). */
  type?: TypeCollection | (string & {});
  /** An accent (see ACCENTS) in place of the theme's own signal: live edges, LEDs, focus and
   *  selection take it, nothing else changes. Each accent has a dark and a light value. */
  accent?: Accent;
  /** Inline token overrides for a custom look — applied on top of the theme. */
  tokens?: TokenOverrides;
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
 * Optional scope wrapper. It only sets data attributes and inline tokens, so the
 * same result is available without React: <div data-ar-theme="frost">.
 */
export function ArtinosTheme({ theme = DEFAULT_THEME, material, density, type, accent, scene, tokens, ground, as = 'div', className, style, children, ...rest }: ArtinosThemeProps) {
  // Narrowed for JSX: hosts that augment JSX.IntrinsicElements (React Three Fiber) make
  // the full ElementType union too large for TypeScript to call. Any tag renders the same.
  const Tag = as as 'div';
  return (
    <Tag
      {...rest}
      data-ar-theme={THEME_ALIASES[theme] ?? theme}
      data-ar-material={material}
      data-ar-density={density}
      data-ar-type={type ? (TYPE_ALIASES[type] ?? type) : undefined}
      data-ar-accent={accent}
      data-ar-scene={scene}
      className={cx('ar-theme', ground && 'ar-theme--ground', className)}
      style={{ ...themeStyle(tokens), ...style }}
    >
      {children}
    </Tag>
  );
}
