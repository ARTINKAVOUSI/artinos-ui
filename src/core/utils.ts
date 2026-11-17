/* ARTINOS UI — shared helpers: math, mapping, formatting, colour, options, theme
   registry. No React at runtime (ReactNode is a type-only import). */
import type { ReactNode } from 'react';

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export const reducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/* ---------- options ---------- */

/** An option is a plain string, or an object with a label and/or an icon. */
export type OptionInput<V extends string = string> =
  | V
  | { value: V; label?: ReactNode; icon?: ReactNode; title?: string; disabled?: boolean };

export interface Option<V extends string = string> {
  value: V;
  label: ReactNode;
  icon?: ReactNode;
  title?: string;
  disabled?: boolean;
}

/** A label made from an id reads in sentence case: "fixed" → "Fixed". Anything with a capital
 *  already ("glTF", "sRGB", "ACES") is a name and is left as written. */
const asLabel = (v: string) => (/^[a-z]/.test(v) && v === v.toLowerCase() ? v[0].toUpperCase() + v.slice(1) : v);

export const normalizeOptions = <V extends string>(opts: readonly OptionInput<V>[]): Option<V>[] =>
  opts.map((o) => (typeof o === 'string' ? { value: o, label: asLabel(o) } : { ...o, label: o.label ?? (o.icon ? null : asLabel(o.value)) }));

/* ---------- mapping: the semantic value stays exact, only geometry changes ---------- */

export interface MappingFns {
  /** value → normalized position 0..1 */
  to: (v: number, min: number, max: number) => number;
  /** normalized position 0..1 → value */
  from: (t: number, min: number, max: number) => number;
}
export type MappingName = 'linear' | 'log' | 'exp' | 'power';
export type Mapping = MappingName | MappingFns;

export const MAPPINGS: Record<MappingName, MappingFns> = {
  linear: { to: (v, a, b) => (v - a) / (b - a), from: (t, a, b) => a + t * (b - a) },
  /** min must be > 0 */
  log: { to: (v, a, b) => Math.log(v / a) / Math.log(b / a), from: (t, a, b) => a * Math.pow(b / a, t) },
  exp: { to: (v, a, b) => Math.sqrt(Math.max(0, (v - a) / (b - a))), from: (t, a, b) => a + (b - a) * t * t },
  power: { to: (v, a, b) => Math.cbrt((v - a) / (b - a)), from: (t, a, b) => a + (b - a) * t * t * t },
};
export const resolveMapping = (m: Mapping | undefined): MappingFns =>
  typeof m === 'object' ? m : MAPPINGS[m ?? 'linear'] ?? MAPPINGS.linear;

/* ---------- formatting belongs to the parameter ---------- */

export type Format = 'number' | 'percent' | 'db' | 'angle' | 'hz' | 'time';
export interface Formatted {
  text: string;
  unit: string;
}
/** Custom formatter: return a string, or text + separate (quieter) unit. */
export type Formatter = (value: number, decimals: number) => string | Formatted;

const minus = (s: string) => s.replace('-', '−');

/** `extra` adds precision digits (used while scrubbing finely). */
export function formatValue(v: number, format: Format = 'number', decimals = 2, unit?: string, extra = 0): Formatted {
  const d = Math.max(0, decimals + extra);
  switch (format) {
    case 'percent':
      return { text: minus((v * 100).toFixed(d)), unit: '%' };
    case 'db':
      return v <= -96 ? { text: '−∞', unit: 'dB' } : { text: minus(v.toFixed(d)), unit: 'dB' };
    case 'angle':
      return { text: minus(v.toFixed(d)), unit: '°' };
    case 'hz': // compacts: 1000 → 1.0 kHz, 10000 → 10 kHz
      return v >= 1000 ? { text: (v / 1000).toFixed((v >= 10000 ? 0 : 1) + extra), unit: 'kHz' } : { text: v.toFixed(d), unit: 'Hz' };
    case 'time':
      return { text: v.toFixed(d), unit: unit ?? 's' };
    default:
      return { text: minus(v.toFixed(d)), unit: unit ?? '' };
  }
}

export function runFormat(
  v: number,
  opts: { format?: Format; decimals: number; extra?: number; unit?: string; formatter?: Formatter },
): Formatted {
  if (opts.formatter) {
    const r = opts.formatter(v, opts.decimals + (opts.extra ?? 0));
    return typeof r === 'string' ? { text: r, unit: '' } : r;
  }
  return formatValue(v, opts.format, opts.decimals, opts.unit, opts.extra ?? 0);
}

/** Unit glyphs that sit tight against the number. */
const tightUnit = (u: string) => u === '°' || u === '%';
export const joinFormatted = (f: Formatted) => f.text + (f.unit ? (tightUnit(f.unit) ? '' : ' ') + f.unit : '');

/* ---------- colour ---------- */

export type Stop = [position: number, hex: string];

const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (a: number[]) =>
  '#' + a.map((x) => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, '0')).join('').toUpperCase();

export function sampleStops(stops: Stop[], t: number): string {
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [p0, c0] = stops[i - 1];
      const [p1, c1] = stops[i];
      const k = (t - p0) / (p1 - p0 || 1);
      const a = hexRgb(c0);
      const b = hexRgb(c1);
      return toHex(a.map((x, j) => x + (b[j] - x) * k));
    }
  }
  return stops[stops.length - 1][1].toUpperCase();
}

/** WCAG relative luminance of a #RRGGBB colour. */
export function luminance(hex: string) {
  const [r, g, b] = hexRgb(hex).map((x) => {
    x /= 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export interface Gradient {
  stops: Stop[];
  /** caption for the swatch readout while dragging; defaults to the formatted value */
  describe?: (t: number, color: string, value: number) => string;
}
export type GradientName = 'temperature' | 'hue' | 'saturate' | 'exposure';

/** Parameter scales from the ARTINOS reference. */
export const GRADIENTS: Record<GradientName, Gradient> = {
  temperature: {
    stops: [[0, '#002F8E'], [0.1154, '#1979A5'], [0.2837, '#6BCFF1'], [0.4904, '#EDF7FF'], [0.6923, '#FDC94F'], [0.8413, '#FF7600'], [1, '#FF1500']],
    describe: (t) => (t < 0.3 ? 'COOL' : t < 0.55 ? 'NEUTRAL' : t < 0.8 ? 'WARM' : 'HOT'),
  },
  hue: {
    stops: [[0, '#FF1500'], [0.1587, '#FF7600'], [0.3077, '#FDC94F'], [0.4423, '#30D952'], [0.6106, '#1979A5'], [0.7788, '#002F8E'], [1, '#9917BA']],
    describe: (_t, color) => color,
  },
  saturate: { stops: [[0, '#5A5A5A'], [1, '#00FF91']] },
  exposure: { stops: [[0, '#000000'], [0.5481, '#6E6E6E'], [0.9856, '#FFFFFF'], [1, '#FFFFFF']] },
};

export const gradientCss = (g: Gradient) =>
  `linear-gradient(90deg, ${g.stops.map(([s, c]) => `${c} ${s * 100}%`).join(', ')})`;

/* ---------- tokens across portals ----------
   Floating layers (HUD, list panel) portal to <body> to escape clipped or
   blurred panels, which also takes them out of their theme scope. They carry
   the resolved values of the tokens they need with them. */
export function snapshotTokens(el: Element | null, names: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  if (!el || typeof getComputedStyle === 'undefined') return out;
  const cs = getComputedStyle(el);
  for (const n of names) {
    const v = cs.getPropertyValue(n).trim();
    if (v) out[n] = v;
  }
  return out;
}

/**
 * Truncation fallback: when an ellipsis has cut `text`, its full words become `host`'s native
 * tooltip; when it fits again, the tooltip goes. Call it as the pointer enters the host. A title
 * the host was given on purpose is never touched.
 */
export function revealClipped(host: HTMLElement | null, text: HTMLElement | null | undefined) {
  if (!host || !text) return;
  const auto = host.dataset.arAutoTitle !== undefined;
  if (host.title && !auto) return;
  if (text.scrollWidth > text.clientWidth + 1) {
    host.title = text.textContent ?? '';
    host.dataset.arAutoTitle = '';
  } else if (auto) {
    host.removeAttribute('title');
    delete host.dataset.arAutoTitle;
  }
}

/** Reads a px length token (e.g. --ar-inset) from an element. */
export function pxToken(el: Element | null, name: string, fallback: number) {
  if (!el) return fallback;
  const v = parseFloat(getComputedStyle(el).getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
}

/* ---------- design-system axes ----------
   A theme is the whole look: ground, ink, signal, panel glass AND the finish of
   every control. Pick one theme; nothing else is required. Material and density
   are optional overrides for special cases. */

export const THEMES = [
  'nimbus', 'pro-gray', 'studio-light', 'frost-deep', 'onyx', 'smoke', 'haze-carve', 'haze-day', 'ice',
] as const;
export type ThemeName = (typeof THEMES)[number];

export type ThemeFamily = 'scene' | 'blends' | 'materials' | 'studio' | 'signature' | 'glass' | 'frost' | 'clear' | 'clear-frost' | 'luxe' | 'luxe-frost' | 'atelier-glass' | 'atelier-frost' | 'untinted-glass' | 'untinted-frost';

export interface ThemeMeta {
  label: string;
  family: ThemeFamily;
  /** solid themes paint their own ground; pane themes sit over imagery or a live canvas */
  kind: 'solid' | 'glass';
  description: string;
  /** [ground, control, signal] — for picker swatches */
  swatch: [string, string, string];
}

export const THEME_META: Record<ThemeName, ThemeMeta> = {
  'haze-carve': { label: 'Haze Carve', family: 'scene', kind: 'glass', description: 'Haze carved: tracks set into the frost and edged by a fine groove, values floating softly.', swatch: ['#6a6a6a', '#9a9a9a', '#4fd1ba'] },
  nimbus: { label: 'Nimbus', family: 'scene', kind: 'glass', description: 'The default. Haze Carve softened: deep frost, gently carved wells, a bright value gradient and a little more room. Calm over any scene.', swatch: ['#6a6a6a', '#9a9a9a', '#4fd1ba'] },
  'haze-day': { label: 'Haze Day', family: 'scene', kind: 'glass', description: 'The same deep blur under a bright white veil: graphite ink, a hairline pane and values on a breath of shadow.', swatch: ['#e4e4e4', '#ffffff', '#0a8a78'] },
  smoke: { label: 'Smoke', family: 'scene', kind: 'glass', description: 'The scene blurred under a dark veil, for bright or busy imagery. Flat white fills.', swatch: ['#2e2e2e', '#4e4e4e', '#ffffff'] },
  'frost-deep': { label: 'Deep Frost', family: 'untinted-frost', kind: 'glass', description: 'The deepest frost, elevated: pressed tracks and raised dense values with charcoal numerals.', swatch: ['#4a4a4a', '#c6c6c6', '#4fd1ba'] },
  'pro-gray': { label: 'Pro Gray', family: 'studio', kind: 'solid', description: 'The neutral grey of professional 3D and grading software: mid-grey desk, darker wells, lighter grey fills, an azure signal.', swatch: ['#393a3d', '#6b6d72', '#6aa9ff'] },
  'studio-light': { label: 'Studio Light', family: 'studio', kind: 'solid', description: 'The same instrument on a light neutral desk. White satin controls.', swatch: ['#e9e9e7', '#ffffff', '#0a7c6b'] },
  ice: { label: 'Ice', family: 'frost', kind: 'glass', description: 'Clean cool frost: a faint blue-white pane, icy controls, deep navy ink.', swatch: ['#6f8597', '#eaf4fb', '#33b5e5'] },
  onyx: { label: 'Onyx', family: 'luxe', kind: 'glass', description: 'Black smoked glass with fine gold hairlines, gold seams and ivory ink. A watch dial at night.', swatch: ['#07070a', '#2a2620', '#d4af6a'] },
};
/** Themes meant to sit over imagery or a live canvas — their panels are glass. */
export const GLASS_THEMES = THEMES.filter((t) => THEME_META[t].kind === 'glass');

/** Earlier theme ids, still accepted by ArtinosTheme's `theme` and the command line. */
export const THEME_ALIASES: Record<string, ThemeName> = { 'haze-carve-custom': 'nimbus' };
/** The theme ArtinosTheme sets when none is given: every kit carries it. */
export const DEFAULT_THEME: ThemeName = 'nimbus';

/** Control finishes. Each theme already picks one — use these only to override. */
export const MATERIALS = ['optical', 'frost', 'milk', 'clear', 'tint', 'smoked', 'metal', 'soft', 'reference'] as const;
/** Density families (data-ar-density, tokens/density.css): the same instrument at three sizes, every theme
 *  scaled to each. `scale` multiplies the theme's own sizes and corners; `h` is a 28px theme's control. */
export const DENSITIES = ['dense', 'standard', 'comfort'] as const;
export const DENSITY_META: Record<(typeof DENSITIES)[number], { label: string; scale: number; h: number; description: string }> = {
  dense: { label: 'Dense', scale: 22 / 28, h: 22, description: 'A working instrument: forty parameters on one screen' },
  standard: { label: 'Standard', scale: 25 / 28, h: 25, description: 'The working default: between the theme as drawn and Dense' },
  comfort: { label: 'Comfort', scale: 1, h: 28, description: 'The theme as drawn: to read as much as to work' },
};
/** Accents any theme can take (data-ar-accent): the signal changes, nothing else does. */
export const ACCENTS = ['teal', 'azure', 'violet', 'rose', 'coral', 'amber', 'lime', 'mono'] as const;
export type Accent = (typeof ACCENTS)[number];
/** Each accent's label and its value on dark and on light themes, for pickers. */
export const ACCENT_META: Record<Accent, { label: string; dark: string; light: string }> = {
  teal: { label: 'Teal', dark: '#4fd1ba', light: '#0a8a78' },
  azure: { label: 'Azure', dark: '#6cb4ff', light: '#1f6fd1' },
  violet: { label: 'Violet', dark: '#a99bff', light: '#6a4fd8' },
  rose: { label: 'Rose', dark: '#ff8fab', light: '#c8325a' },
  coral: { label: 'Coral', dark: '#ff9a76', light: '#c4502a' },
  amber: { label: 'Amber', dark: '#ffc46b', light: '#a86a00' },
  lime: { label: 'Lime', dark: '#b8e86a', light: '#4d8a12' },
  mono: { label: 'Mono', dark: '#ffffff', light: '#111111' },
};
export type MaterialName = (typeof MATERIALS)[number];
export type Density = (typeof DENSITIES)[number];

/* ---------- type collections ----------
   A type set is a whole voice, not just a font: its faces plus its own title scale, weight, case and
   width, paragraph face and line spacing. Control sizes stay. Pick one with <ArtinosTheme type="…"> or
   data-ar-type; tokens/fonts.css loads the faces and tokens/type.css carries the rest. `fine` is the default. */
export const TYPE_COLLECTIONS = ['sleek', 'product', 'native', 'legible', 'instrument', 'salon', 'wide', 'grotesk', 'editorial', 'fine', 'mass', 'round'] as const;
/** Earlier ids, still accepted by ArtinosTheme's `type` and the command line. */
export const TYPE_ALIASES: Record<string, TypeCollection> = { manrope: 'sleek', code: 'sleek', form: 'sleek', quiet: 'sleek', geist: 'sleek', terminal: 'sleek', modern: 'sleek', industrial: 'sleek', 'sleek-air': 'sleek', 'sleek-sharp': 'sleek', 'sleek-compact': 'sleek', pro: 'product', neue: 'product', 'red-hat': 'round', mona: 'wide', swiss: 'product', bold: 'product', jakarta: 'product', character: 'product', bricolage: 'product', clean: 'product', onest: 'product', figtree: 'product', 'sleek-serif': 'editorial', book: 'editorial', source: 'editorial', couture: 'editorial', luxe: 'editorial', contrast: 'editorial', atelier: 'editorial', newsroom: 'editorial', schibsted: 'editorial', soft: 'editorial', hyperlegible: 'legible' };
export type TypeCollection = (typeof TYPE_COLLECTIONS)[number];

export interface TypeMeta {
  label: string;
  /** the sans voice */
  ui: string;
  /** the measuring voice */
  mono: string;
  /** the display face for big titles; empty when the sans serves */
  display: string;
  /** the serif for opening sentences and quotes; empty when Instrument Serif serves */
  serif?: string;
  description: string;
  /** Google Fonts css2 `family=` query for the faces at the weights the tokens name */
  fonts: string;
}

/* one entry per line: the kit builder reads this table from the source */
export const TYPE_META: Record<TypeCollection, TypeMeta> = {
  sleek: { label: 'Sleek', ui: 'Geist', mono: 'Geist Mono', display: '', serif: '', description: 'For control panels, tools and dashboards. Geist from label to headline, with Geist Mono for section numbers, meta lines and code. Precise and quiet.', fonts: 'family=Geist:wght@300..700&family=Geist+Mono:wght@300..600&family=Instrument+Serif:ital@0;1' },
  product: { label: 'Product', ui: 'Inter', mono: 'JetBrains Mono', display: 'Inter Display', serif: '', description: 'For product apps and inspectors. Inter, its display cut for titles and its text cut for every control. Neutral and refined: the type of most professional design tools.', fonts: 'family=Inter:ital,opsz,wght@0,14..32,300..700;1,14..32,300..700&family=JetBrains+Mono:ital,wght@0,300..600;1,300..600&family=Instrument+Serif:ital@0;1' },
  editorial: { label: 'Editorial', ui: 'Inter', mono: 'JetBrains Mono', display: 'Newsreader', serif: 'Newsreader', description: 'For documentation, onboarding and pages around the panels. Newsreader titles and opening lines over Inter for every control and paragraph. Considered and calm.', fonts: 'family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..600&family=Inter:ital,opsz,wght@0,14..32,300..700;1,14..32,300..700&family=JetBrains+Mono:ital,wght@0,300..600;1,300..600&family=Instrument+Serif:ital@0;1' },
  native: { label: 'Native', ui: 'System UI', mono: 'System Mono', display: '', serif: '', description: 'For desktop-like apps. The platform face, SF Pro on Apple and Segoe UI Variable on Windows: nothing to load and the sharpest rendering each system has.', fonts: 'family=Instrument+Serif:ital@0;1' },
  legible: { label: 'Legible', ui: 'Atkinson Hyperlegible Next', mono: 'Atkinson Hyperlegible Mono', display: '', serif: '', description: 'For accessibility, kiosks and long reading. Atkinson Hyperlegible, drawn so that similar letters are hard to confuse, with open line spacing.', fonts: 'family=Atkinson+Hyperlegible+Next:ital,wght@0,400..700;1,400..700&family=Atkinson+Hyperlegible+Mono:wght@400..600&family=Instrument+Serif:ital@0;1' },
  instrument: { label: 'Instrument', ui: 'Inter', mono: 'Geist Mono', display: 'Instrument Sans', serif: '', description: 'For studio tools and creative software. Instrument Sans, narrowed, for titles over Inter for every control: drawn, precise and a little warmer than a plain grotesk.', fonts: 'family=Instrument+Sans:wdth,wght@75..100,400..700&family=Inter:ital,opsz,wght@0,14..32,300..700;1,14..32,300..700&family=Geist+Mono:wght@300..600&family=Instrument+Serif:ital@0;1' },
  salon: { label: 'Salon', ui: 'Geist', mono: 'Geist Mono', display: 'Instrument Serif', serif: 'Instrument Serif', description: 'For premium products and launch pages around a tool. Tall Instrument Serif titles and italic opening lines over crisp Geist controls: the serif names, the sans measures.', fonts: 'family=Instrument+Serif:ital@0;1&family=Geist:wght@300..700&family=Geist+Mono:wght@300..600' },
  wide: { label: 'Wide', ui: 'Inter', mono: 'Geist Mono', display: 'Mona Sans', serif: '', description: 'For hardware, devices and confident brands. Mona Sans set wide for titles over a neutral Inter: engineered headlines, calm controls.', fonts: 'family=Mona+Sans:ital,wdth,wght@0,75..125,200..900;1,75..125,200..900&family=Inter:ital,opsz,wght@0,14..32,300..700;1,14..32,300..700&family=Geist+Mono:wght@300..600&family=Instrument+Serif:ital@0;1' },
  grotesk: { label: 'Grotesk', ui: 'Inter', mono: 'JetBrains Mono', display: 'Space Grotesk', serif: '', description: 'For technical and developer products. Space Grotesk titles, with their engineered quirks, over Inter for every control and paragraph.', fonts: 'family=Space+Grotesk:wght@300..700&family=Inter:ital,opsz,wght@0,14..32,300..700;1,14..32,300..700&family=JetBrains+Mono:ital,wght@0,300..600;1,300..600&family=Instrument+Serif:ital@0;1' },
  fine: { label: 'Fine', ui: 'Inter', mono: 'JetBrains Mono', display: 'Inter Tight', serif: '', description: 'The default, for precision instruments, control panels and pro tools. Hairline Inter on every control in a bright ink, under extra-bold, tight Inter Tight titles: the Swiss contrast of weight.', fonts: 'family=Inter+Tight:wght@200..900&family=Inter:ital,opsz,wght@0,14..32,200..700;1,14..32,200..700&family=JetBrains+Mono:ital,wght@0,300..600;1,300..600&family=Instrument+Serif:ital@0;1' },
  mass: { label: 'Mass', ui: 'Geist', mono: 'Geist Mono', display: 'Archivo', serif: '', description: 'For hardware and industrial products. Hairline Geist on every control under black, expanded Archivo titles: fine instruments in a heavy chassis.', fonts: 'family=Archivo:wdth,wght@62..125,100..900&family=Geist:wght@200..700&family=Geist+Mono:wght@300..600&family=Instrument+Serif:ital@0;1' },
  round: { label: 'Round', ui: 'Hanken Grotesk', mono: 'JetBrains Mono', display: 'Unbounded', serif: '', description: 'For consumer devices and friendly products. Hairline Hanken Grotesk on every control under wide, rounded Unbounded titles: soft and confident.', fonts: 'family=Unbounded:wght@200..900&family=Hanken+Grotesk:wght@200..700&family=JetBrains+Mono:ital,wght@0,300..600;1,300..600&family=Instrument+Serif:ital@0;1' },
};

/** Props every control accepts to override its theme's finish or size. */
export interface ScopeProps {
  /** Advanced: override the theme's control finish for this control. */
  material?: MaterialName;
  /** The density family (see DENSITIES): dense 22 · standard 25 · comfort 28 for a 28px theme, every
   *  size and corner of the theme scaled with it. Inherits when omitted. */
  density?: Density;
}

export const scopeAttrs = ({ material, density }: ScopeProps) => ({
  'data-ar-material': material,
  'data-ar-density': density,
});
