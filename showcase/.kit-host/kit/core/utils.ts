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

export const normalizeOptions = <V extends string>(opts: readonly OptionInput<V>[]): Option<V>[] =>
  opts.map((o) => (typeof o === 'string' ? { value: o, label: o } : { ...o, label: o.label ?? (o.icon ? null : o.value) }));

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
  'studio', 'onyx',
] as const;
export type ThemeName = (typeof THEMES)[number];

export type ThemeFamily = 'studio' | 'signature' | 'glass' | 'frost' | 'clear' | 'clear-frost' | 'luxe' | 'luxe-frost' | 'atelier-glass' | 'atelier-frost' | 'untinted-glass' | 'untinted-frost';

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
  studio: { label: 'Studio', family: 'studio', kind: 'solid', description: 'Studio-grade neutral dark. Satin controls, hairline edges, teal signal. The default.', swatch: ['#101112', '#d2d2ce', '#3cbca5'] },
  onyx: { label: 'Onyx', family: 'luxe', kind: 'glass', description: 'Black smoked glass with fine gold hairlines, gold seams and ivory ink. A watch dial at night.', swatch: ['#07070a', '#2a2620', '#d4af6a'] },
};
/** Themes meant to sit over imagery or a live canvas — their panels are glass. */
export const GLASS_THEMES = THEMES.filter((t) => THEME_META[t].kind === 'glass');

/** Control finishes. Each theme already picks one — use these only to override. */
export const MATERIALS = ['optical', 'frost', 'milk', 'clear', 'tint', 'smoked', 'metal', 'soft', 'reference'] as const;
export const DENSITIES = ['dense', 'standard', 'comfort'] as const;
export type MaterialName = (typeof MATERIALS)[number];
export type Density = (typeof DENSITIES)[number];

/* ---------- type collections ----------
   Type is one superfamily in two voices: a sans that speaks (titles, prose, menus) and a mono
   that measures (labels, readouts, marks), tuned for the family's sizes. A collection swaps the
   faces and re-tunes the tracking; sizes, weights and leading stay. Some add a display face for
   titles at 2xl and up. Pick one with <ArtinosTheme type="…"> or data-ar-type; tokens/fonts.css
   loads the faces and tokens/type.css carries the tuning. `instrument` is the default. */
export const TYPE_COLLECTIONS = ['instrument', 'editorial', 'geist', 'modern', 'atelier', 'red-hat', 'luxe'] as const;
export type TypeCollection = (typeof TYPE_COLLECTIONS)[number];

export interface TypeMeta {
  label: string;
  /** the sans voice */
  ui: string;
  /** the measuring voice */
  mono: string;
  /** the display face for big titles; empty when the sans serves */
  display: string;
  description: string;
  /** Google Fonts css2 `family=` query for the faces at the weights the tokens name */
  fonts: string;
}

/* one entry per line: the kit builder reads this table from the source */
export const TYPE_META: Record<TypeCollection, TypeMeta> = {
  instrument: { label: 'Instrument', ui: 'Chivo', mono: 'Chivo Mono', display: '', description: 'The default. Chivo and Chivo Mono, one grotesk superfamily with an engineering edge: crisp caps, even numerals, nothing decorative.', fonts: 'family=Chivo:wght@200;300;400;500&family=Chivo+Mono:wght@200;300;400;500' },
  editorial: { label: 'Editorial', ui: 'IBM Plex Sans', mono: 'IBM Plex Mono', display: '', description: 'IBM Plex, the superfamily with a drawn, editorial tone: open counters, a humanist rhythm and a mono with real character.', fonts: 'family=IBM+Plex+Sans:wght@200;300;400;500&family=IBM+Plex+Mono:wght@200;300;400;500' },
  geist: { label: 'Geist', ui: 'Geist', mono: 'Geist Mono', display: '', description: 'Geist and Geist Mono: quiet, contemporary and exact. The most neutral of the set, for interfaces that should disappear behind the work.', fonts: 'family=Geist:wght@200;300;400;500&family=Geist+Mono:wght@200;300;400;500' },
  modern: { label: 'Modern', ui: 'Inter', mono: 'JetBrains Mono', display: '', description: 'Inter with JetBrains Mono, the proven pairing of modern tools: a tall x-height for small prose and a wide, legible mono for readouts.', fonts: 'family=Inter:wght@200;300;400;500&family=JetBrains+Mono:wght@200;300;400;500' },
  atelier: { label: 'Atelier', ui: 'DM Sans', mono: 'DM Mono', display: '', description: 'DM Sans and DM Mono: a warm geometric superfamily with soft terminals and a lighter touch, for creative tools.', fonts: 'family=DM+Sans:wght@200;300;400;500&family=DM+Mono:wght@300;400;500' },
  'red-hat': { label: 'Red Hat', ui: 'Red Hat Text', mono: 'Red Hat Mono', display: 'Red Hat Display', description: 'Red Hat Text, Display and Mono: a three-voice superfamily, friendly and crisp, with its own display face for titles.', fonts: 'family=Red+Hat+Text:wght@300;400;500&family=Red+Hat+Display:wght@300;400;500&family=Red+Hat+Mono:wght@300;400;500' },
  luxe: { label: 'Luxe', ui: 'Inter', mono: 'JetBrains Mono', display: 'Cormorant Garamond', description: 'A serif display over a neutral sans: Cormorant Garamond titles, Inter prose, JetBrains Mono readouts. Editorial luxury for the luxe themes.', fonts: 'family=Cormorant+Garamond:wght@300;400;500&family=Inter:wght@200;300;400;500&family=JetBrains+Mono:wght@200;300;400;500' },
};

/** Props every control accepts to override its theme's finish or size. */
export interface ScopeProps {
  /** Advanced: override the theme's control finish for this control. */
  material?: MaterialName;
  /** Control height: dense 24 · standard 26 · comfort 30. Inherits when omitted. */
  density?: Density;
}

export const scopeAttrs = ({ material, density }: ScopeProps) => ({
  'data-ar-material': material,
  'data-ar-density': density,
});
