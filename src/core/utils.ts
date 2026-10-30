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
  'sheer', 'veil', 'haze', 'smoke', 'ink', 'mist', 'chalk', 'pressed', 'hairline', 'frosted',
  'haze-rim', 'haze-lift', 'haze-carve', 'haze-glow', 'haze-bevel', 'haze-night', 'haze-day',
  'lift', 'edge', 'inset', 'halo', 'tile', 'groove', 'drift', 'shade', 'linen', 'cloud',
  'groove-light', 'inset-light', 'carve', 'carve-light', 'groove-smoke', 'inset-smoke',
  'marble', 'slate', 'travertine', 'basalt', 'steel', 'bisque', 'concrete', 'walnut',
  'quartz', 'loupe', 'shell', 'engrave', 'machined', 'matte', 'glaze', 'pebble', 'vellum', 'lumen',
  'clear-air', 'clear-polished', 'clear-lens', 'clear-layered', 'clear-bevel', 'clear-cut',
  'frost-etched', 'frost-silk', 'frost-mist', 'frost-deep', 'frost-satin', 'frost-ceramic',
  'nocturne', 'lagoon', 'argent', 'garnet', 'ivory', 'glacier', 'wisteria', 'dune',
  'studio', 'studio-light', 'optical', 'reference',
  'glass', 'glass-light', 'glass-dark', 'crystal',
  'frost', 'frost-light', 'frost-dark', 'ice',
  'pane', 'pane-light', 'lucid', 'gallery', 'satin', 'monolith', 'opal', 'graphite',
  'onyx', 'sapphire', 'platinum', 'diamond', 'emerald', 'rose-gold', 'cognac', 'amethyst',
  'champagne', 'pearl', 'alabaster', 'porcelain', 'jade', 'moonstone', 'cashmere', 'velvet',
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
  'haze-rim': { label: 'Haze Rim', family: 'scene', kind: 'glass', description: 'Haze with a crisp hairline round the pane and a lit top edge; values held by a hairline.', swatch: ['#6a6a6a', '#9a9a9a', '#4fd1ba'] },
  'haze-lift': { label: 'Haze Lift', family: 'scene', kind: 'glass', description: 'Haze floating high: the pane rides a deep soft shadow and the values float over their tracks.', swatch: ['#6a6a6a', '#9a9a9a', '#4fd1ba'] },
  'haze-carve': { label: 'Haze Carve', family: 'scene', kind: 'glass', description: 'Haze carved: tracks set into the frost and edged by a fine groove, values floating softly.', swatch: ['#6a6a6a', '#9a9a9a', '#4fd1ba'] },
  'haze-glow': { label: 'Haze Glow', family: 'scene', kind: 'glass', description: 'Haze lit from within: a soft light inside the pane edge and inside each value, held by a hairline.', swatch: ['#6a6a6a', '#9a9a9a', '#4fd1ba'] },
  'haze-bevel': { label: 'Haze Bevel', family: 'scene', kind: 'glass', description: 'Haze with a quiet bevel: light along each top edge, shade along each bottom edge, on the pane and every value.', swatch: ['#6a6a6a', '#9a9a9a', '#4fd1ba'] },
  'haze-night': { label: 'Haze Night', family: 'scene', kind: 'glass', description: 'The same deep blur under a dark veil: moodier, with a hairline, a lit top edge and floating values.', swatch: ['#6a6a6a', '#9a9a9a', '#4fd1ba'] },
  'haze-day': { label: 'Haze Day', family: 'scene', kind: 'glass', description: 'The same deep blur under a bright white veil: graphite ink, a hairline pane and values on a breath of shadow.', swatch: ['#e4e4e4', '#ffffff', '#0a8a78'] },
  'groove-light': { label: 'Groove Light', family: 'scene', kind: 'glass', description: 'Groove in white frost: fine grooved tracks, white values floating on a breath of shadow. Graphite ink.', swatch: ['#e9e9e9', '#ffffff', '#0a8a78'] },
  'inset-light': { label: 'Inset Light', family: 'scene', kind: 'glass', description: 'Inset in white frost: tracks set a hair into the pane, white values. Graphite ink.', swatch: ['#e9e9e9', '#ffffff', '#0a8a78'] },
  'carve': { label: 'Carve', family: 'scene', kind: 'glass', description: 'Groove and Inset together: tracks set into the pane and edged by a fine groove, values floating softly over them.', swatch: ['#3c3c3c', '#5c5c5c', '#4fd1ba'] },
  'carve-light': { label: 'Carve Light', family: 'scene', kind: 'glass', description: 'Carve in white frost: set-in, groove-edged tracks and white values floating softly. Graphite ink.', swatch: ['#e9e9e9', '#ffffff', '#0a8a78'] },
  'groove-smoke': { label: 'Groove Smoke', family: 'scene', kind: 'glass', description: 'Groove on a dense dark veil for bright or busy scenes: deeper grooves, floating values.', swatch: ['#3c3c3c', '#5c5c5c', '#4fd1ba'] },
  'inset-smoke': { label: 'Inset Smoke', family: 'scene', kind: 'glass', description: 'Inset on a dense dark veil for bright or busy scenes: tracks sunk deeper into the pane.', swatch: ['#3c3c3c', '#5c5c5c', '#4fd1ba'] },
  lift: { label: 'Lift', family: 'scene', kind: 'glass', description: 'Flat glass with depth: values float a few pixels on a soft shadow, and the pane lifts off the scene.', swatch: ['#4a4a4a', '#6a6a6a', '#4fd1ba'] },
  edge: { label: 'Edge', family: 'scene', kind: 'glass', description: 'Flat glass with one hairline round each value and a lit top edge on the pane.', swatch: ['#4a4a4a', '#6a6a6a', '#4fd1ba'] },
  inset: { label: 'Inset', family: 'scene', kind: 'glass', description: 'Flat glass with tracks set a hair into the pane: a faint shade above, a faint light below.', swatch: ['#4a4a4a', '#6a6a6a', '#4fd1ba'] },
  halo: { label: 'Halo', family: 'scene', kind: 'glass', description: 'Flat glass with volume: a soft light inside the pane edge and inside each value.', swatch: ['#4a4a4a', '#6a6a6a', '#4fd1ba'] },
  tile: { label: 'Tile', family: 'scene', kind: 'glass', description: 'Flat glass with values as thin tiles: a light line along the top, a dark one along the bottom.', swatch: ['#4a4a4a', '#6a6a6a', '#4fd1ba'] },
  groove: { label: 'Groove', family: 'scene', kind: 'glass', description: 'Flat glass with tracks drawn as fine grooves and values floating softly over them.', swatch: ['#4a4a4a', '#6a6a6a', '#4fd1ba'] },
  drift: { label: 'Drift', family: 'scene', kind: 'glass', description: 'The flattest controls on the pane that floats highest: all the depth is in the pane.', swatch: ['#4a4a4a', '#6a6a6a', '#4fd1ba'] },
  shade: { label: 'Shade', family: 'scene', kind: 'glass', description: 'A dense dark veil with a lit top edge; values carry the same thin light along their top.', swatch: ['#4a4a4a', '#6a6a6a', '#4fd1ba'] },
  linen: { label: 'Linen', family: 'scene', kind: 'glass', description: 'Light flat glass: a white veil, a hairline pane and values lifted by a breath of shadow. Graphite ink.', swatch: ['#e9e9e9', '#f6f6f6', '#0a8a78'] },
  cloud: { label: 'Cloud', family: 'scene', kind: 'glass', description: 'Light flat glass over the deepest blur, values resting on soft shadows. Graphite ink.', swatch: ['#e9e9e9', '#f6f6f6', '#0a8a78'] },
  quartz: { label: 'Quartz', family: 'blends', kind: 'glass', description: 'Frost, hairlines and neumorphism: pressed tracks, raised frosted values held by a hairline rim.', swatch: ['#3a3a3a', '#8a8a8a', '#4fd1ba'] },
  loupe: { label: 'Loupe', family: 'blends', kind: 'glass', description: 'Clear glass and skeuomorphism: values are bevelled lenses that brighten the scene, in a barely blurred pane.', swatch: ['#3a3a3a', '#8a8a8a', '#4fd1ba'] },
  shell: { label: 'Shell', family: 'blends', kind: 'glass', description: 'Deep frost and neumorphism: pressed tracks and softly domed values.', swatch: ['#3a3a3a', '#8a8a8a', '#4fd1ba'] },
  engrave: { label: 'Engrave', family: 'blends', kind: 'glass', description: 'Hairlines and skeuomorphism: tracks engraved into the glass as fine cut lines, values held by a hairline.', swatch: ['#3a3a3a', '#8a8a8a', '#4fd1ba'] },
  machined: { label: 'Machined', family: 'blends', kind: 'glass', description: 'Glass and skeuomorphism: deep machined grooves and chamfered glass caps.', swatch: ['#3a3a3a', '#8a8a8a', '#4fd1ba'] },
  matte: { label: 'Matte', family: 'blends', kind: 'glass', description: 'Frost and depth: matte values float on soft shadows, with no highlights and no rims.', swatch: ['#3a3a3a', '#8a8a8a', '#4fd1ba'] },
  glaze: { label: 'Glaze', family: 'blends', kind: 'glass', description: 'Double-glazed glass: every edge drawn as a white line over a dark one, like thick glass.', swatch: ['#3a3a3a', '#8a8a8a', '#4fd1ba'] },
  pebble: { label: 'Pebble', family: 'blends', kind: 'glass', description: 'Glass and neumorphism: raised pebble values in pressed tracks.', swatch: ['#3a3a3a', '#8a8a8a', '#4fd1ba'] },
  vellum: { label: 'Vellum', family: 'blends', kind: 'glass', description: 'Light frost, hairlines and neumorphism: pressed tracks and raised white values, graphite ink.', swatch: ['#e6e6e6', '#ffffff', '#0a8a78'] },
  lumen: { label: 'Lumen', family: 'blends', kind: 'glass', description: 'Light glass and skeuomorphism: bevelled white glass values in finely cut tracks, graphite ink.', swatch: ['#e6e6e6', '#ffffff', '#0a8a78'] },
  marble: { label: 'Marble Frost', family: 'materials', kind: 'glass', description: 'Carrara marble values with soft grey veins, pressed into bright frost.', swatch: ['#e9e8e4', '#f6f5f2', '#9a7a3e'] },
  slate: { label: 'Slate Glass', family: 'materials', kind: 'glass', description: 'Matte slate tiles in smoked glass; a faint stone grain shows through the pane.', swatch: ['#2a2e33', '#454b51', '#9fc3d9'] },
  travertine: { label: 'Travertine', family: 'materials', kind: 'glass', description: 'Warm porous stone values in pressed, sand-toned frost, with a terracotta signal.', swatch: ['#e6dac6', '#dccdb2', '#b0703a'] },
  basalt: { label: 'Basalt', family: 'materials', kind: 'glass', description: 'Black volcanic stone values with one polished edge, on smoked glass. An ember signal.', swatch: ['#121213', '#262628', '#e0a15a'] },
  steel: { label: 'Brushed Steel', family: 'materials', kind: 'glass', description: 'Skeuomorphic brushed-aluminium values with a machined bevel, in machined tracks on cool frost.', swatch: ['#2a3038', '#c4c9cf', '#5fb0ff'] },
  bisque: { label: 'Bisque', family: 'materials', kind: 'glass', description: 'Neumorphic unglazed porcelain: soft domed values raised out of milky frost. A sage signal.', swatch: ['#f1eee9', '#ffffff', '#6f8a5e'] },
  concrete: { label: 'Concrete', family: 'materials', kind: 'glass', description: 'Raw speckled concrete values cut into grey frost. A safety-orange signal.', swatch: ['#3a3a3a', '#b1b0ab', '#ff8a3d'] },
  walnut: { label: 'Walnut Glass', family: 'materials', kind: 'glass', description: 'Oiled walnut values with a fine grain, set in smoked amber glass. A brass signal.', swatch: ['#2a1c12', '#6b4629', '#e8b26a'] },
  pressed: { label: 'Pressed', family: 'scene', kind: 'glass', description: 'Flat glass with neumorphic controls: wells pressed in and values raised by soft neutral shadows.', swatch: ['#5a5a5a', '#7a7a7a', '#ffffff'] },
  hairline: { label: 'Hairline', family: 'scene', kind: 'glass', description: 'Flat glass held by one 1px line around the pane and each track. No highlights, no colour.', swatch: ['#555555', '#757575', '#ffffff'] },
  frosted: { label: 'Frosted', family: 'scene', kind: 'glass', description: 'A clearer pane with frosted controls: each track and value frosts the scene further.', swatch: ['#686868', '#9a9a9a', '#ffffff'] },
  sheer: { label: 'Sheer', family: 'scene', kind: 'glass', description: 'A light blur under a thin dark veil: the scene stays close. White ink, flat fills, nothing else.', swatch: ['#4a4a4a', '#6a6a6a', '#ffffff'] },
  veil: { label: 'Veil', family: 'scene', kind: 'glass', description: 'The scene blurred under a thin white veil. Flat fills, no border, no highlight, no colour.', swatch: ['#6a6a6a', '#8a8a8a', '#ffffff'] },
  haze: { label: 'Haze', family: 'scene', kind: 'glass', description: 'The deepest blur under a faint white veil: the scene becomes soft light. Flat white fills.', swatch: ['#7a7a7a', '#9a9a9a', '#ffffff'] },
  smoke: { label: 'Smoke', family: 'scene', kind: 'glass', description: 'The scene blurred under a dark veil, for bright or busy imagery. Flat white fills.', swatch: ['#2e2e2e', '#4e4e4e', '#ffffff'] },
  ink: { label: 'Ink', family: 'scene', kind: 'glass', description: 'A dense dark veil over the blur: nearly solid black glass, flat and quiet.', swatch: ['#141414', '#2c2c2c', '#ffffff'] },
  mist: { label: 'Mist', family: 'scene', kind: 'glass', description: 'The scene blurred under a white veil, graphite ink and flat graphite fills.', swatch: ['#d9d9d9', '#c4c4c4', '#111111'] },
  chalk: { label: 'Chalk', family: 'scene', kind: 'glass', description: 'A dense white veil over the blur: nearly solid white glass, graphite ink.', swatch: ['#f5f5f5', '#e0e0e0', '#111111'] },
  'clear-air': { label: 'Air Glass', family: 'untinted-glass', kind: 'glass', description: 'Almost invisible glass drawn in hairlines: outlined tracks and values, a whisper of blur.', swatch: ['#383838', '#656565', '#4fd1ba'] },
  'clear-polished': { label: 'Polished Glass', family: 'untinted-glass', kind: 'glass', description: 'Clear glass with depth: values float on a soft shadow under one reflected line.', swatch: ['#404040', '#8a8a8a', '#4fd1ba'] },
  'clear-lens': { label: 'Lens Glass', family: 'untinted-glass', kind: 'glass', description: 'Optical clarity: lens values held by a hairline glass edge, the pane lifted off the scene.', swatch: ['#484848', '#787878', '#4fd1ba'] },
  'clear-layered': { label: 'Layered Glass', family: 'untinted-glass', kind: 'glass', description: 'Flat glass with neumorphic depth: tracks pressed in, luminous white values raised.', swatch: ['#424242', '#d6d6d6', '#4fd1ba'] },
  'frost-etched': { label: 'Etched Frost', family: 'untinted-frost', kind: 'glass', description: 'Light frost with softly pressed tracks and flat frosted values.', swatch: ['#505050', '#808080', '#4fd1ba'] },
  'frost-silk': { label: 'Silk Frost', family: 'untinted-frost', kind: 'glass', description: 'Neumorphic frost: pressed tracks, raised white silk values, dark lettering.', swatch: ['#585858', '#dddddd', '#4fd1ba'] },
  'frost-mist': { label: 'Mist Frost', family: 'untinted-frost', kind: 'glass', description: 'Airy frost in hairlines, lifted off the scene on a soft shadow.', swatch: ['#606060', '#a2a2a2', '#4fd1ba'] },
  'frost-deep': { label: 'Deep Frost', family: 'untinted-frost', kind: 'glass', description: 'The deepest frost, elevated: pressed tracks and raised dense values with charcoal numerals.', swatch: ['#4a4a4a', '#c6c6c6', '#4fd1ba'] },
  'clear-bevel': { label: 'Bevel Glass', family: 'untinted-glass', kind: 'glass', description: 'Clear glass with bevelled values: a lit top edge, a shaded lower edge, tracks cut into the glass.', swatch: ['#424242', '#7a7a7a', '#4fd1ba'] },
  'clear-cut': { label: 'Cut Glass', family: 'untinted-glass', kind: 'glass', description: 'Values faceted like crystal: one diagonal light across each, held by hairline rims.', swatch: ['#3e3e3e', '#8a8a8a', '#4fd1ba'] },
  'frost-satin': { label: 'Satin Frost', family: 'untinted-frost', kind: 'glass', description: 'Brushed-satin values with a lit edge in machined tracks, on deep frost. Dark lettering.', swatch: ['#5a5a5a', '#d8d8d6', '#4fd1ba'] },
  'frost-ceramic': { label: 'Ceramic Frost', family: 'untinted-frost', kind: 'glass', description: 'Glazed white values with a soft gloss band, set into pressed frost.', swatch: ['#626262', '#f2f2f2', '#4fd1ba'] },
  nocturne: { label: 'Nocturne', family: 'atelier-glass', kind: 'glass', description: 'Architectural smoke glass. Black crystal controls and a fine champagne edge.', swatch: ['#101116', '#373633', '#dec493'] },
  lagoon: { label: 'Lagoon', family: 'atelier-glass', kind: 'glass', description: 'Deep petrol crystal. Aquamarine lenses, luminous sea-glass edges and cool ivory ink.', swatch: ['#082b31', '#397a80', '#9ae7d6'] },
  argent: { label: 'Argent', family: 'atelier-glass', kind: 'glass', description: 'Daylight silver glass. Polished silver inserts and precise ink-blue accents.', swatch: ['#dae1e6', '#f1f6fa', '#344f72'] },
  garnet: { label: 'Garnet', family: 'atelier-glass', kind: 'glass', description: 'Wine-dark cut glass. Faceted rose crystal controls, copper reflections and pale rose signals.', swatch: ['#30141e', '#925a6d', '#f2b3ad'] },
  ivory: { label: 'Ivory', family: 'atelier-frost', kind: 'glass', description: 'Warm vellum frost. Soft ivory lenses, espresso lettering and restrained antique-brass details.', swatch: ['#efe8db', '#fffaf0', '#80613a'] },
  glacier: { label: 'Glacier', family: 'atelier-frost', kind: 'glass', description: 'Dense polar frost. Sculpted ice-white inserts, cool blue bevels and deep alpine-blue signals.', swatch: ['#dceaf0', '#f6fcff', '#17617e'] },
  wisteria: { label: 'Wisteria', family: 'atelier-frost', kind: 'glass', description: 'Lilac silk frost. Opaline controls, plum lettering and muted violet accents.', swatch: ['#e7dfef', '#fbf4ff', '#715084'] },
  dune: { label: 'Dune', family: 'atelier-frost', kind: 'glass', description: 'Smoked taupe frost. Matte sand-glass inserts, quiet bronze edges and warm linen lettering.', swatch: ['#342e29', '#c7b89e', '#e1c395'] },
  studio: { label: 'Studio', family: 'studio', kind: 'solid', description: 'Studio-grade neutral dark. Satin controls, hairline edges, teal signal. The default.', swatch: ['#101112', '#d2d2ce', '#3cbca5'] },
  'studio-light': { label: 'Studio Light', family: 'studio', kind: 'solid', description: 'The same instrument on a light neutral desk. White satin controls.', swatch: ['#e9e9e7', '#ffffff', '#0a7c6b'] },
  optical: { label: 'Optical', family: 'signature', kind: 'solid', description: 'The original ARTINOS prototype: polished translucent insert on graphite.', swatch: ['#090909', '#dcd9d3', '#2fb39c'] },
  reference: { label: 'Reference', family: 'signature', kind: 'glass', description: 'The ARTINOS Figma source: polished bar, double-line handle, mono 700.', swatch: ['#2a2720', '#e3e3e3', '#1adfb8'] },
  glass: { label: 'Glass', family: 'glass', kind: 'glass', description: 'Clean clear glass. A neutral veil, clear-rim controls, white ink.', swatch: ['#3a3d40', '#8e9193', '#7de0cf'] },
  'glass-light': { label: 'Glass Light', family: 'glass', kind: 'glass', description: 'Clear glass with a light veil. The view stays bright, the ink is dark.', swatch: ['#cfd4d8', '#f4f6f7', '#0a7c8a'] },
  'glass-dark': { label: 'Glass Dark', family: 'glass', kind: 'glass', description: 'Clean smoked glass. A deeper veil, the same clarity, cool blue signal.', swatch: ['#0c0d10', '#3a3c40', '#7cbcff'] },
  crystal: { label: 'Crystal', family: 'glass', kind: 'glass', description: 'The clearest pane: a whisper of tint, bright double hairline, all-rim controls.', swatch: ['#5c5f62', '#a9acae', '#a8f0ff'] },
  frost: { label: 'Frost', family: 'frost', kind: 'glass', description: 'Frosted glass. A soft diffuse pane, frosted-white controls, dark ink.', swatch: ['#8d8f91', '#f4f5f6', '#2fb39c'] },
  'frost-light': { label: 'Frost Light', family: 'frost', kind: 'glass', description: 'Bright milky frost with dark ink. Daylight over imagery.', swatch: ['#e6eaec', '#ffffff', '#0a7c8a'] },
  'frost-dark': { label: 'Frost Dark', family: 'frost', kind: 'glass', description: 'Dark frosted glass: heavy diffusion under a charcoal veil, frosted-grey controls.', swatch: ['#2a2c2e', '#6b6d70', '#7de0cf'] },
  ice: { label: 'Ice', family: 'frost', kind: 'glass', description: 'Clean cool frost: a faint blue-white pane, icy controls, deep navy ink.', swatch: ['#6f8597', '#eaf4fb', '#33b5e5'] },
  pane: { label: 'Pane', family: 'clear', kind: 'glass', description: 'Clear glass with a soft light sweep and silver-pearl pills. No tint: the colour is whatever is behind.', swatch: ['#6b6e70', '#d3d6d7', '#ffffff'] },
  'pane-light': { label: 'Pane Light', family: 'clear', kind: 'glass', description: 'The same clear glass under a light veil. White pills, dark ink.', swatch: ['#e8e8e8', '#ffffff', '#141414'] },
  lucid: { label: 'Lucid', family: 'clear', kind: 'glass', description: 'The clearest pane. Clear glass fills with a bright lit edge, white ink.', swatch: ['#5a5a5a', '#9a9a9a', '#ffffff'] },
  gallery: { label: 'Gallery', family: 'clear', kind: 'glass', description: 'Gallery glass: lightly blurred under a neutral shade, hairline rules, crisp frosted fills.', swatch: ['#3a3a3a', '#8a8a8a', '#ffffff'] },
  satin: { label: 'Satin', family: 'clear-frost', kind: 'glass', description: 'Continuous frost. The view melts into soft colour; glossy white pills.', swatch: ['#7a7c7c', '#efefef', '#ffffff'] },
  monolith: { label: 'Monolith', family: 'clear-frost', kind: 'glass', description: 'Deep neutral frost that carries the warmth of what is behind; milky frosted fills.', swatch: ['#8a8176', '#c9c3bb', '#ffffff'] },
  opal: { label: 'Opal', family: 'clear-frost', kind: 'glass', description: 'A smoky column: frost under a deep neutral shade, bright rims, soft glass fills.', swatch: ['#262626', '#5e5e5e', '#ffffff'] },
  graphite: { label: 'Graphite', family: 'clear-frost', kind: 'glass', description: 'Grey frost with the colour drained, translucent grey-glass fills.', swatch: ['#5c5c5c', '#9c9c9c', '#ffffff'] },
  onyx: { label: 'Onyx', family: 'luxe', kind: 'glass', description: 'Black smoked glass with fine gold hairlines, gold seams and ivory ink. A watch dial at night.', swatch: ['#07070a', '#2a2620', '#d4af6a'] },
  sapphire: { label: 'Sapphire', family: 'luxe', kind: 'glass', description: 'Deep-blue crystal, platinum hairlines, icy clear controls, silver-blue signal.', swatch: ['#0a1840', '#6d86b8', '#9cc8ff'] },
  platinum: { label: 'Platinum', family: 'luxe', kind: 'glass', description: 'Colourless clear glass with a bright platinum double hairline, crystal-clear controls and white ink.', swatch: ['#2a2d31', '#c9ced4', '#ffffff'] },
  diamond: { label: 'Diamond', family: 'luxe', kind: 'glass', description: 'The clearest pane, with a faint prismatic fire in the sheen and the controls. Ice-white signal.', swatch: ['#5a5d61', '#dfe9f2', '#c4ecff'] },
  emerald: { label: 'Emerald', family: 'luxe', kind: 'glass', description: 'Deep green crystal with pale-gold hairlines and seams, and a fresh emerald signal.', swatch: ['#063322', '#3c8a68', '#e6cc92'] },
  'rose-gold': { label: 'Rose Gold', family: 'luxe', kind: 'glass', description: 'Clear glass under a blush veil, with rose-gold hairlines, rims and seams.', swatch: ['#40242a', '#b98579', '#eaa994'] },
  cognac: { label: 'Cognac', family: 'luxe', kind: 'glass', description: 'Warm amber smoked glass with brushed-brass hairlines and candle-lit ink.', swatch: ['#3a1e08', '#8a5a2c', '#e6a45c'] },
  amethyst: { label: 'Amethyst', family: 'luxe', kind: 'glass', description: 'Deep violet crystal with silver hairlines, clear violet controls and a lavender signal.', swatch: ['#28124a', '#7e66b8', '#c5a6ff'] },
  champagne: { label: 'Champagne', family: 'luxe-frost', kind: 'glass', description: 'Warm gold-tinted frost, ivory controls with an antique-gold rim, espresso ink.', swatch: ['#8f7a58', '#f7ecd6', '#b8904a'] },
  pearl: { label: 'Pearl', family: 'luxe-frost', kind: 'glass', description: 'Nacreous white frost with a faint iridescent sheen, soft pearl controls, lilac signal.', swatch: ['#ebe8ee', '#f8f3f9', '#8c6a9e'] },
  alabaster: { label: 'Alabaster', family: 'luxe-frost', kind: 'glass', description: 'Thick warm-cream frost, cream satin controls with a bronze hairline, umber ink.', swatch: ['#efe9df', '#fffdf8', '#9a7040'] },
  porcelain: { label: 'Porcelain', family: 'luxe-frost', kind: 'glass', description: 'Cool white glazed frost, glossy white controls, cobalt signal and ink-blue text.', swatch: ['#eef1f5', '#ffffff', '#2a4fb0'] },
  jade: { label: 'Jade', family: 'luxe-frost', kind: 'glass', description: 'Pale celadon frost with polished pale-green controls, a jade signal and forest ink.', swatch: ['#e2ebe5', '#f4faf6', '#2c7a58'] },
  moonstone: { label: 'Moonstone', family: 'luxe-frost', kind: 'glass', description: 'Blue-grey milky frost with a cool glow, milk-white controls and white ink.', swatch: ['#6e7a92', '#eef4fc', '#6f9ee8'] },
  cashmere: { label: 'Cashmere', family: 'luxe-frost', kind: 'glass', description: 'Soft taupe frost, oat-white controls with a caramel rim, cocoa ink on the controls.', swatch: ['#80695a', '#f6eee3', '#b98352'] },
  velvet: { label: 'Velvet', family: 'luxe-frost', kind: 'glass', description: 'Deep bordeaux frost with silver hairlines, rosy frosted controls and a soft rose signal.', swatch: ['#4a1022', '#a0607a', '#f09bb0'] },
};
/** Themes meant to sit over imagery or a live canvas — their panels are glass. */
export const GLASS_THEMES = THEMES.filter((t) => THEME_META[t].kind === 'glass');

/** Control finishes. Each theme already picks one — use these only to override. */
export const MATERIALS = ['optical', 'frost', 'milk', 'clear', 'tint', 'smoked', 'metal', 'soft', 'reference'] as const;
export const DENSITIES = ['dense', 'standard', 'comfort'] as const;
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
   Type is one superfamily in two voices: a sans that speaks (titles, prose, menus) and a mono
   that measures (labels, readouts, marks), tuned for the family's sizes. A collection swaps the
   faces and re-tunes the tracking; sizes, weights and leading stay. Some add a display face for
   titles at 2xl and up. Pick one with <ArtinosTheme type="…"> or data-ar-type; tokens/fonts.css
   loads the faces and tokens/type.css carries the tuning. `instrument` is the default. */
export const TYPE_COLLECTIONS = ['instrument', 'geist', 'grotesk', 'editorial', 'modern', 'atelier', 'red-hat', 'luxe'] as const;
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
  instrument: { label: 'Instrument', ui: 'Geist', mono: 'Geist Mono', display: '', description: 'The default. Geist for words, its mono sibling Geist Mono for every figure, so numbers line up and read as measurements; sentence-case headings.', fonts: 'family=Geist:wght@200;300;400;500&family=Geist+Mono:wght@200;300;400;500&family=Instrument+Serif:ital@0;1' },
  geist: { label: 'Geist', ui: 'Geist', mono: 'Geist Mono', display: '', description: 'The default faces with small headings and marks in tracked capitals: the exact, technical look.', fonts: 'family=Geist:wght@200;300;400;500&family=Geist+Mono:wght@200;300;400;500' },
  grotesk: { label: 'Grotesk', ui: 'Chivo', mono: 'Chivo Mono', display: '', description: 'Chivo and Chivo Mono: a grotesk with an engineering edge, crisp caps and a mono with character. The first voice of the family.', fonts: 'family=Chivo:wght@200;300;400;500&family=Chivo+Mono:wght@200;300;400;500' },
  editorial: { label: 'Editorial', ui: 'IBM Plex Sans', mono: 'IBM Plex Mono', display: '', description: 'IBM Plex, the superfamily with a drawn, editorial tone: open counters, a humanist rhythm and a mono with real character.', fonts: 'family=IBM+Plex+Sans:wght@200;300;400;500&family=IBM+Plex+Mono:wght@200;300;400;500' },
  modern: { label: 'Modern', ui: 'Inter', mono: 'JetBrains Mono', display: '', description: 'Inter with JetBrains Mono, the proven pairing of modern tools: a tall x-height for small prose and a wide, legible mono for readouts.', fonts: 'family=Inter:opsz,wght@14..32,200..500&family=JetBrains+Mono:wght@200;300;400;500' },
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
