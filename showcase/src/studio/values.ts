/* Theme Studio — value toolkit: normalise any CSS colour to #RRGGBBAA, and parse /
   rebuild the composite values (filters, gradients, shadows) the editor exposes as
   individual parameters. */

let probe: HTMLElement | null = null;
const probeEl = () => {
  if (!probe) {
    probe = document.createElement('span');
    probe.style.display = 'none';
    document.body.appendChild(probe);
  }
  return probe;
};

const hex2 = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();

/** Any CSS colour (hex, rgb[a], color-mix, color(srgb …), named) → #RRGGBBAA. */
export function toHex8(css: string | undefined, fallback = '#000000FF'): string {
  if (!css) return fallback;
  const v = css.trim();
  if (/^#[0-9a-f]{8}$/i.test(v)) return v.toUpperCase();
  if (/^#[0-9a-f]{6}$/i.test(v)) return (v + 'FF').toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) return ('#' + v.slice(1).split('').map((c) => c + c).join('') + 'FF').toUpperCase();
  const el = probeEl();
  el.style.color = '';
  el.style.color = v;
  if (!el.style.color) return fallback; // not a colour (e.g. a gradient or `none`)
  const c = getComputedStyle(el).color;
  let m = c.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/);
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return '#' + hex2(+m[1]) + hex2(+m[2]) + hex2(+m[3]) + hex2(a * 255);
  }
  m = c.match(/color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/);
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return '#' + hex2(+m[1] * 255) + hex2(+m[2] * 255) + hex2(+m[3] * 255) + hex2(a * 255);
  }
  return fallback;
}

/** '#RRGGBBAA' → 'rgba(r, g, b, a)' — friendlier in exported CSS. */
export function hexToCss(hex: string): string {
  const h = hex.replace('#', '');
  if (h.length < 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  if (a >= 0.999) return '#' + h.slice(0, 6).toLowerCase();
  return `rgba(${r}, ${g}, ${b}, ${+a.toFixed(3)})`;
}

const COLOR_RE = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|color\([^)]*\)|\b(?:white|black|transparent)\b/gi;
export const colorsIn = (v: string) => v.match(COLOR_RE) ?? [];
export const num = (v: string | undefined, re: RegExp, d: number) => {
  const m = v?.match(re);
  return m ? parseFloat(m[1]) : d;
};
const alphaOfColor = (c: string | undefined, d = 0) => (c ? parseInt(toHex8(c).slice(7, 9), 16) / 255 : d);
const round = (n: number, p = 3) => +n.toFixed(p);

/* ---------- composite values ---------- */

export interface FilterP {
  blur: number;
  saturate: number;
  brightness: number;
  contrast: number;
}
export const parseFilter = (v: string): FilterP => ({
  blur: num(v, /blur\(([\d.]+)px\)/, 0),
  saturate: num(v, /saturate\(([\d.]+)/, 1) / (/saturate\([\d.]+%/.test(v) ? 100 : 1),
  brightness: num(v, /brightness\(([\d.]+)/, 1),
  contrast: num(v, /contrast\(([\d.]+)/, 1) / (/contrast\([\d.]+%/.test(v) ? 100 : 1),
});
export const buildFilter = (p: FilterP) => {
  const parts = [];
  if (p.blur > 0) parts.push(`blur(${round(p.blur, 1)}px)`);
  if (Math.abs(p.saturate - 1) > 0.001) parts.push(`saturate(${round(p.saturate, 2)})`);
  if (Math.abs(p.brightness - 1) > 0.001) parts.push(`brightness(${round(p.brightness, 2)})`);
  if (Math.abs(p.contrast - 1) > 0.001) parts.push(`contrast(${round(p.contrast, 2)})`);
  return parts.length ? parts.join(' ') : 'none';
};

export interface GradientP {
  top: string;
  bottom: string;
}
export const parseGradient = (v: string): GradientP => {
  const cs = colorsIn(v.replace(/url\([^)]*\)/g, ''));
  const top = toHex8(cs[0] ?? v, '#DCDCD8FF');
  return { top, bottom: toHex8(cs[cs.length - 1] ?? v, top) };
};
export const buildGradient = (p: GradientP) =>
  p.top === p.bottom ? hexToCss(p.top) : `linear-gradient(180deg, ${hexToCss(p.top)} 0%, ${hexToCss(p.bottom)} 100%)`;

/** Insert: gloss (top highlight), rim (1px inner line), outline (hairline outside), drop. */
export interface InsertShadowP {
  gloss: number;
  rim: string;
  outline: number;
  drop: number;
}
export const parseInsertShadow = (v: string): InsertShadowP => ({
  gloss: alphaOfColor(v.match(/inset 0 1px 0 (#[0-9a-f]+|rgba?\([^)]*\))/i)?.[1]),
  rim: toHex8(v.match(/inset 0 0 0 (?:1|2|0\.5)px (#[0-9a-f]+|rgba?\([^)]*\))/i)?.[1], '#FFFFFF00'),
  outline: alphaOfColor(v.match(/(?:^|,\s*)0 0 0 0\.5px (#[0-9a-f]+|rgba?\([^)]*\))/i)?.[1]),
  drop: alphaOfColor(v.match(/(?:^|,\s*)0 1px \d+(?:\.\d+)?px (#[0-9a-f]+|rgba?\([^)]*\))/i)?.[1]),
});
export const buildInsertShadow = (p: InsertShadowP) => {
  const s = [];
  if (p.gloss > 0.005) s.push(`inset 0 1px 0 rgba(255, 255, 255, ${round(p.gloss, 2)})`);
  if (alphaOfColor(p.rim) > 0.005) s.push(`inset 0 0 0 1px ${hexToCss(p.rim)}`);
  if (p.outline > 0.005) s.push(`0 0 0 0.5px rgba(0, 0, 0, ${round(p.outline, 2)})`);
  if (p.drop > 0.005) s.push(`0 1px 2px rgba(0, 0, 0, ${round(p.drop, 2)})`);
  return s.length ? s.join(', ') : 'none';
};

/** Well: inner depth shadow, 1px edge line, lip highlight below. */
export interface WellP {
  depth: number;
  soft: number;
  edge: string;
  lip: number;
}
export const parseWell = (v: string): WellP => {
  const d = v.match(/inset 0 (\d+)px (\d+(?:\.\d+)?)px (#[0-9a-f]+|rgba?\([^)]*\))/i);
  return {
    depth: alphaOfColor(d?.[3]),
    soft: d ? parseFloat(d[2]) : 1,
    edge: toHex8(v.match(/inset 0 0 0 1px (#[0-9a-f]+|rgba?\([^)]*\))/i)?.[1], '#FFFFFF00'),
    lip: alphaOfColor(v.match(/(?:^|,\s*)0 1px 0 (#[0-9a-f]+|rgba?\([^)]*\))/i)?.[1]),
  };
};
export const buildWell = (p: WellP) => {
  const s = [];
  if (p.depth > 0.005) s.push(`inset 0 1px ${round(p.soft, 1)}px rgba(0, 0, 0, ${round(p.depth, 2)})`);
  if (alphaOfColor(p.edge) > 0.005) s.push(`inset 0 0 0 1px ${hexToCss(p.edge)}`);
  if (p.lip > 0.005) s.push(`0 1px 0 rgba(255, 255, 255, ${round(p.lip, 2)})`);
  return s.length ? s.join(', ') : '0 0 0 0 transparent';
};

/** Panel: edge hairline, top highlight, drop shadow depth. */
export interface PanelShadowP {
  edge: string;
  highlight: number;
  drop: number;
}
export const parsePanelShadow = (v: string): PanelShadowP => ({
  edge: toHex8(v.match(/inset 0 0 0 1px (#[0-9a-f]+|rgba?\([^)]*\))/i)?.[1], '#FFFFFF1F'),
  highlight: alphaOfColor(v.match(/inset 0 1(?:\.5)?px 0 (#[0-9a-f]+|rgba?\([^)]*\))/i)?.[1]),
  drop: alphaOfColor(v.match(/0 \d+px \d+px -\d+px (#[0-9a-f]+|rgba?\([^)]*\))/i)?.[1]),
});
export const buildPanelShadow = (p: PanelShadowP) => {
  const s = [`inset 0 0 0 1px ${hexToCss(p.edge)}`];
  if (p.highlight > 0.005) s.push(`inset 0 1px 0 rgba(255, 255, 255, ${round(p.highlight, 2)})`);
  if (p.drop > 0.005) s.push(`0 22px 56px -24px rgba(0, 0, 0, ${round(p.drop, 2)})`);
  return s.join(', ');
};

/** Sheen: a white wash from the top of the pane, fading out by `reach` %. */
export interface SheenP {
  strength: number;
  reach: number;
}
export const parseSheen = (v: string): SheenP => ({
  strength: v.includes('transparent, transparent') ? 0 : alphaOfColor(colorsIn(v)[0]),
  reach: num(v, /0\)\s+([\d.]+)%/, 45),
});
export const buildSheen = (p: SheenP) =>
  p.strength <= 0.005 ? 'linear-gradient(transparent, transparent)' : `linear-gradient(180deg, rgba(255, 255, 255, ${round(p.strength, 2)}), rgba(255, 255, 255, 0) ${Math.round(p.reach)}%)`;

/** Text halo: `0 1px <blur>px <colour>` or none. */
export interface HaloP {
  color: string;
  blur: number;
}
export const parseHalo = (v: string): HaloP => {
  if (!v || v === 'none') return { color: '#00000000', blur: 2 };
  return { color: toHex8(colorsIn(v)[0], '#00000000'), blur: num(v, /\S+px\s+\S+px\s+([\d.]+)px/, 2) };
};
export const buildHalo = (p: HaloP) => (alphaOfColor(p.color) <= 0.005 ? 'none' : `0 1px ${round(p.blur, 1)}px ${hexToCss(p.color)}`);

/** Focus ring: 1px inner line + 3px soft outer glow. */
export interface FocusP {
  line: string;
  glow: string;
}
export const parseFocus = (v: string): FocusP => {
  const cs = colorsIn(v);
  return { line: toHex8(cs[0], '#FFFFFFFF'), glow: toHex8(cs[1], '#FFFFFF33') };
};
export const buildFocus = (p: FocusP) => `0 0 0 1px ${hexToCss(p.line)}, 0 0 0 3px ${hexToCss(p.glow)}`;
