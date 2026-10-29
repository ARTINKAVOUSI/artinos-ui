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
  'veil', 'hairline', 'obsidian', 'midnight', 'sable', 'daylight',
  'clear-air', 'clear-polished', 'clear-lens', 'clear-layered',
  'frost-etched', 'frost-silk', 'frost-mist', 'frost-deep',
  'nocturne', 'lagoon', 'argent', 'garnet', 'ivory', 'glacier', 'wisteria', 'dune',
  'studio', 'studio-light', 'optical', 'reference',
  'glass', 'glass-light', 'glass-dark', 'crystal',
  'frost', 'frost-light', 'frost-dark', 'ice',
  'pane', 'pane-light', 'lucid', 'gallery', 'satin', 'monolith', 'opal', 'graphite',
  'onyx', 'sapphire', 'platinum', 'diamond', 'emerald', 'rose-gold', 'cognac', 'amethyst',
  'champagne', 'pearl', 'alabaster', 'porcelain', 'jade', 'moonstone', 'cashmere', 'velvet',
] as const;
export type ThemeName = (typeof THEMES)[number];

export type ThemeFamily = 'hairline' | 'studio' | 'signature' | 'glass' | 'frost' | 'clear' | 'clear-frost' | 'luxe' | 'luxe-frost' | 'atelier-glass' | 'atelier-frost' | 'untinted-glass' | 'untinted-frost';

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
  veil: { label: 'Veil', family: 'hairline', kind: 'glass', description: 'Vibrant clear glass. The scene\'s own colour, brightened, behind white hairlines; white selection.', swatch: ['#6d6f76', '#c9cacf', '#f4f6f8'] },
  hairline: { label: 'Hairline', family: 'hairline', kind: 'glass', description: 'Neutral clear glass with the lightest touch: outlines instead of fills, a crisp live edge, a mint signal.', swatch: ['#3a3b3e', '#77797d', '#8fe3cf'] },
  obsidian: { label: 'Obsidian', family: 'hairline', kind: 'glass', description: 'Deep smoked glass in monochrome. Warm-white hairlines, thin glass values, no colour at all.', swatch: ['#0c0c0e', '#3a3936', '#ece6da'] },
  midnight: { label: 'Midnight', family: 'hairline', kind: 'glass', description: 'Navy smoked glass with blue-white hairlines and a periwinkle signal.', swatch: ['#0c1428', '#4b5a7e', '#8fb4ff'] },
  sable: { label: 'Sable', family: 'hairline', kind: 'glass', description: 'Warm bronze smoked glass with champagne hairlines and a soft gold signal.', swatch: ['#211910', '#6e5a40', '#e3c48f'] },
  daylight: { label: 'Daylight', family: 'hairline', kind: 'glass', description: 'Bright clear glass for light scenes: white hairlines outside, graphite ink and a graphite live edge.', swatch: ['#e9eaec', '#ffffff', '#1d2024'] },
  'clear-air': { label: 'Air Glass', family: 'untinted-glass', kind: 'glass', description: 'Almost invisible glass. A fine perimeter, clear inserts and a quiet reflected edge.', swatch: ['#383838', '#656565', '#4fd1ba'] },
  'clear-polished': { label: 'Polished Glass', family: 'untinted-glass', kind: 'glass', description: 'Polished clear glass. A narrow reflected highlight, glossy inserts and precise edge contrast.', swatch: ['#404040', '#8a8a8a', '#4fd1ba'] },
  'clear-lens': { label: 'Lens Glass', family: 'untinted-glass', kind: 'glass', description: 'Clear optical depth. Softly focused panes, transparent lenses and a fine inner reflection.', swatch: ['#484848', '#787878', '#4fd1ba'] },
  'clear-layered': { label: 'Layered Glass', family: 'untinted-glass', kind: 'glass', description: 'Clear panes with luminous laminated inserts. Restrained double reflections and dark engraved readouts.', swatch: ['#424242', '#d6d6d6', '#4fd1ba'] },
  'frost-etched': { label: 'Etched Frost', family: 'untinted-frost', kind: 'glass', description: 'Fine etched glass. Light diffusion, translucent matte inserts and delicate satin edges.', swatch: ['#505050', '#808080', '#4fd1ba'] },
  'frost-silk': { label: 'Silk Frost', family: 'untinted-frost', kind: 'glass', description: 'Silky continuous frost. Soft diffusion beneath translucent white inserts with understated dark lettering.', swatch: ['#585858', '#dddddd', '#4fd1ba'] },
  'frost-mist': { label: 'Mist Frost', family: 'untinted-frost', kind: 'glass', description: 'Airy diffuse glass. A soft reflected veil, floating translucent inserts and a gently lit perimeter.', swatch: ['#606060', '#a2a2a2', '#4fd1ba'] },
  'frost-deep': { label: 'Deep Frost', family: 'untinted-frost', kind: 'glass', description: 'Deep optical diffusion. The scene melts behind clear frost; dense satin inserts carry crisp charcoal numerals.', swatch: ['#4a4a4a', '#c6c6c6', '#4fd1ba'] },
  nocturne: { label: 'Nocturne', family: 'atelier-glass', kind: 'glass', description: 'Architectural smoke glass. Cut corners, black crystal controls and a fine champagne edge.', swatch: ['#101116', '#373633', '#dec493'] },
  lagoon: { label: 'Lagoon', family: 'atelier-glass', kind: 'glass', description: 'Deep petrol crystal. Rounded aquamarine lenses, luminous sea-glass edges and cool ivory ink.', swatch: ['#082b31', '#397a80', '#9ae7d6'] },
  argent: { label: 'Argent', family: 'atelier-glass', kind: 'glass', description: 'Daylight silver glass. Crisp square edges, polished silver inserts and precise ink-blue accents.', swatch: ['#dae1e6', '#f1f6fa', '#344f72'] },
  garnet: { label: 'Garnet', family: 'atelier-glass', kind: 'glass', description: 'Wine-dark cut glass. Faceted rose crystal controls, copper reflections and pale rose signals.', swatch: ['#30141e', '#925a6d', '#f2b3ad'] },
  ivory: { label: 'Ivory', family: 'atelier-frost', kind: 'glass', description: 'Warm vellum frost. Soft ivory lenses, espresso lettering and restrained antique-brass details.', swatch: ['#efe8db', '#fffaf0', '#80613a'] },
  glacier: { label: 'Glacier', family: 'atelier-frost', kind: 'glass', description: 'Dense polar frost. Sculpted ice-white inserts, cool blue bevels and deep alpine-blue signals.', swatch: ['#dceaf0', '#f6fcff', '#17617e'] },
  wisteria: { label: 'Wisteria', family: 'atelier-frost', kind: 'glass', description: 'Lilac silk frost. Softly rounded opaline controls, plum lettering and muted violet accents.', swatch: ['#e7dfef', '#fbf4ff', '#715084'] },
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
  instrument: { label: 'Instrument', ui: 'Geist', mono: 'Geist Mono', display: '', description: 'The default. Geist for words, its mono sibling Geist Mono for every figure, so numbers line up and read as measurements; sentence-case headings.', fonts: 'family=Geist:wght@200;300;400;500&family=Geist+Mono:wght@200;300;400;500' },
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
