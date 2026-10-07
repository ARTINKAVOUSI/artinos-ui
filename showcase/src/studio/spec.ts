/* Theme Studio — the parameter model. Every group lists the tokens it edits and the
   control used for each. Composite tokens (shadows, gradients, filters) are exposed
   as their individual parameters and rebuilt on every change. */

export type Param =
  | { kind: 'color'; token: string; label: string }
  | { kind: 'length'; token: string; label: string; min: number; max: number; step?: number; unit: 'px' | 'em' | 'ms' | ''; decimals?: number }
  | { kind: 'select'; token: string; label: string; options: Array<{ value: string; label: string }> }
  | { kind: 'filter' | 'gradient' | 'insertShadow' | 'well' | 'panelShadow' | 'sheen' | 'halo' | 'focus' | 'text'; token: string; label: string };

export interface Group {
  id: string;
  title: string;
  note: string;
  params: Param[];
}

const c = (token: string, label: string): Param => ({ kind: 'color', token: '--ar-' + token, label });
const px = (token: string, label: string, min: number, max: number, step = 1, decimals = 0): Param => ({ kind: 'length', token: '--ar-' + token, label, min, max, step, unit: 'px', decimals });
const k = (kind: Exclude<Param['kind'], 'color' | 'length' | 'select'>, token: string, label: string): Param => ({ kind, token: '--ar-' + token, label });

// the faces of every type collection (tokens/type.css), all loaded by the showcase
export const MONO_FONTS = [
  { value: "'Chivo Mono', ui-monospace, SFMono-Regular, Consolas, monospace", label: 'Chivo Mono' },
  { value: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Consolas, monospace", label: 'IBM Plex Mono' },
  { value: "'Geist Mono', ui-monospace, SFMono-Regular, Consolas, monospace", label: 'Geist Mono' },
  { value: "'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace", label: 'JetBrains Mono' },
  { value: "'DM Mono', ui-monospace, SFMono-Regular, Consolas, monospace", label: 'DM Mono' },
  { value: "'Red Hat Mono', ui-monospace, SFMono-Regular, Consolas, monospace", label: 'Red Hat Mono' },
  { value: "'Roboto Mono', 'Chivo Mono', ui-monospace, monospace", label: 'Roboto Mono' },
  { value: 'ui-monospace, SFMono-Regular, Consolas, monospace', label: 'System mono' },
  { value: "Chivo, system-ui, sans-serif", label: 'Chivo (proportional)' },
];
export const UI_FONTS = [
  { value: "Chivo, system-ui, -apple-system, 'Segoe UI', sans-serif", label: 'Chivo' },
  { value: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif", label: 'IBM Plex Sans' },
  { value: "Geist, system-ui, -apple-system, 'Segoe UI', sans-serif", label: 'Geist' },
  { value: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif", label: 'Inter' },
  { value: "'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif", label: 'DM Sans' },
  { value: "'Red Hat Text', system-ui, -apple-system, 'Segoe UI', sans-serif", label: 'Red Hat Text' },
  { value: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", label: 'System UI' },
  { value: "'Chivo Mono', ui-monospace, monospace", label: 'Chivo Mono' },
];
export const DISPLAY_FONTS = [
  { value: 'var(--ar-font-ui)', label: 'Same as UI' },
  { value: "'Cormorant Garamond', Georgia, 'Times New Roman', serif", label: 'Cormorant Garamond' },
  { value: "'Red Hat Display', 'Red Hat Text', system-ui, sans-serif", label: 'Red Hat Display' },
  ...UI_FONTS.slice(0, 6),
];
// the weights the families are loaded at; 700 exists only in Roboto Mono (the reference finish)
const WEIGHTS = [
  { value: '200', label: 'Thin 200' },
  { value: '300', label: 'Light 300' },
  { value: '400', label: 'Regular 400' },
  { value: '500', label: 'Medium 500' },
  { value: '700', label: 'Bold 700 · Roboto Mono' },
];

export const GROUPS: Group[] = [
  {
    id: 'ground',
    title: 'Ground & surfaces',
    note: 'The app background and the recess every control sits in.',
    params: [c('bg-app', 'App ground'), c('bg-surface', 'Surface'), c('bg-raised', 'Raised'), c('bg-well', 'Well base'), c('bg-hover', 'Hover wash'), c('bg-active', 'Active wash')],
  },
  {
    id: 'ink',
    title: 'Ink',
    note: 'Five steps of text recession, hi to ghost.',
    params: [c('text-hi', 'Hi'), c('text-mid', 'Mid'), c('text-low', 'Low'), c('text-faint', 'Faint'), c('text-ghost', 'Ghost')],
  },
  {
    id: 'lines',
    title: 'Lines & ticks',
    note: 'Hairlines, ruler ticks and graduation marks.',
    params: [c('line-subtle', 'Subtle'), c('line', 'Line'), c('line-strong', 'Strong'), c('tick', 'Minor tick'), c('tick-major', 'Major tick')],
  },
  {
    id: 'signal',
    title: 'Signal & status',
    note: 'One hue per meaning. The live seam, LEDs and focus ring are mixed from the signal.',
    params: [c('signal', 'Signal'), c('signal-hi', 'Signal hi'), c('signal-line', 'Signal glow'), c('signal-wash', 'Signal wash'), c('signal-ink', 'Ink on signal'), c('bind', 'Bound'), c('warn', 'Warn'), c('fault', 'Fault'), k('focus', 'focus-ring', 'Focus ring')],
  },
  {
    id: 'panel',
    title: 'Panel glass',
    note: 'The card controls live on: tint, blur, sheen, edge and depth.',
    params: [
      c('panel-tint', 'Tint'),
      k('filter', 'panel-blur', 'Backdrop'),
      k('sheen', 'panel-sheen', 'Sheen'),
      k('panelShadow', 'panel-shadow', 'Edge & depth'),
      k('halo', 'panel-text-shadow', 'Text halo'),
      px('radius-shell', 'Panel radius', 0, 32),
      px('radius-panel', 'Card radius', 0, 24),
      px('radius-card', 'Small radius', 0, 16),
      px('radius-control', 'Control radius', 0, 12),
    ],
  },
  {
    id: 'float',
    title: 'Floating layers',
    note: 'The precision HUD and the Select list panel.',
    params: [c('float-bg', 'Background'), c('float-ink', 'Ink'), c('float-ink-low', 'Ink low'), c('list-hover', 'List hover'), k('filter', 'list-backdrop', 'List backdrop')],
  },
  {
    id: 'well',
    title: 'Control well',
    note: 'The trough every capsule is recessed into.',
    params: [c('trough', 'Trough'), k('well', 'well', 'Well shadow'), k('filter', 'trough-backdrop', 'Trough backdrop'), px('radius', 'Radius', 0, 16), px('inset', 'Insert inset', 0, 5, 0.5, 1)],
  },
  {
    id: 'insert',
    title: 'Insert',
    note: 'The material that fills a capsule: body, rim, gloss, ink.',
    params: [
      k('gradient', 'insert', 'Body'),
      k('insertShadow', 'insert-shadow', 'Rim & gloss'),
      k('filter', 'insert-backdrop', 'Backdrop'),
      px('insert-radius', 'Radius', 0, 14),
      c('insert-ink', 'Ink'),
      c('insert-unit-ink', 'Unit ink'),
      k('halo', 'insert-text-shadow', 'Ink halo'),
      k('text', 'insert-off-filter', 'Off filter'),
    ],
  },
  {
    id: 'wellink',
    title: 'Ink on the well',
    note: 'Labels and readouts where the insert does not cover them.',
    params: [c('label-ink', 'Label'), c('value-ink', 'Value'), c('value-ink-hi', 'Value (active)'), c('unit-ink', 'Unit'), c('off-ink', 'Off'), c('dim-ink', 'Dim'), k('halo', 'base-text-shadow', 'Halo')],
  },
  {
    id: 'seam',
    title: 'Seam & LEDs',
    note: 'The handle is the seam; a switch’s seam is its LED.',
    params: [
      c('seam', 'Seam'),
      c('seam-hover', 'Seam hover'),
      c('seam-active', 'Seam live'),
      px('seam-w', 'Seam width', 1, 6, 0.5, 1),
      px('seam-offset', 'Seam distance from end', 0, 24, 0.5, 1),
      { kind: 'length', token: '--ar-seam-scale', label: 'Seam height', min: 0.2, max: 0.8, step: 0.01, unit: '', decimals: 2 },
      { kind: 'length', token: '--ar-seam-scale-hot', label: 'Seam height live', min: 0.2, max: 0.9, step: 0.01, unit: '', decimals: 2 },
      k('text', 'seam-glow', 'Seam glow'),
      c('led-on', 'LED on'),
      c('led-off', 'LED off'),
      c('led-glow', 'LED glow'),
    ],
  },
  {
    id: 'detail',
    title: 'Cells, gradients, rulers',
    note: 'Stepped cells, gradient tracks, ruler and plot ink.',
    params: [c('cell', 'Cell'), k('text', 'cell-shadow', 'Cell edge'), c('grad-ink-dark', 'Gradient ink dark'), c('grad-ink-light', 'Gradient ink light'), c('grad-seam', 'Gradient seam'), c('ruler-ink', 'Ruler ink'), c('index', 'Ruler index'), c('plot', 'Plot'), c('plot-hi', 'Plot live')],
  },
  {
    id: 'type',
    title: 'Typography',
    note: 'Faces, weights, tracking and sizes.',
    params: [
      { kind: 'select', token: '--ar-font-ui', label: 'UI face', options: UI_FONTS },
      { kind: 'select', token: '--ar-font-num', label: 'Numeral face', options: MONO_FONTS },
      { kind: 'select', token: '--ar-font-display', label: 'Display face', options: DISPLAY_FONTS },
      { kind: 'select', token: '--ar-control-font', label: 'Control face', options: MONO_FONTS },
      { kind: 'select', token: '--ar-label-weight', label: 'Label weight', options: WEIGHTS },
      { kind: 'select', token: '--ar-value-weight', label: 'Value weight', options: WEIGHTS },
      { kind: 'select', token: '--ar-label-case', label: 'Label case', options: [{ value: 'uppercase', label: 'UPPERCASE' }, { value: 'none', label: 'As written' }] },
      { kind: 'length', token: '--ar-label-tracking', label: 'Tracking', min: 0, max: 0.3, step: 0.005, unit: 'em', decimals: 3 },
      px('label-size', 'Label size', 7, 14, 0.5, 1),
      px('value-size', 'Value size', 8, 16, 0.5, 1),
      px('text-md', 'Body size', 10, 16, 0.5, 1),
      px('text-xl', 'Title size', 13, 26, 0.5, 1),
      px('caps-sm', 'Mark size', 7, 12, 0.5, 1),
      { kind: 'length', token: '--ar-track-caps', label: 'Mark tracking', min: 0, max: 0.3, step: 0.005, unit: 'em', decimals: 3 },
    ],
  },
  {
    id: 'size',
    title: 'Size & motion',
    note: 'Control height and spacing, and how long things take to move.',
    params: [
      px('h', 'Control height', 18, 40),
      px('pad-x', 'Side padding', 2, 18),
      px('gap', 'Gap', 2, 14),
      { kind: 'length', token: '--ar-dur-state', label: 'State speed', min: 0, max: 400, step: 10, unit: 'ms' },
      { kind: 'length', token: '--ar-dur-surface', label: 'Surface speed', min: 0, max: 600, step: 10, unit: 'ms' },
      { kind: 'length', token: '--ar-dur-layout', label: 'Layout speed', min: 0, max: 800, step: 10, unit: 'ms' },
    ],
  },
];

/** Tokens that belong to density — exported only when the theme changes them. */
export const DENSITY_TOKENS = ['--ar-h', '--ar-label-size', '--ar-value-size', '--ar-pad-x', '--ar-gap'];
const INTERNAL = /^--ar-(lo|hi|p|p2)$|^--ar-(ink|paper|chalk|slate|teal|amber|rose|azure)-|^--ar-frost-grain$/;

/** Every --ar-* token declared by the loaded stylesheets. */
export function collectTokenNames(): string[] {
  const names = new Set<string>();
  const walk = (rules: CSSRuleList) => {
    for (const r of Array.from(rules)) {
      if (r instanceof CSSStyleRule) {
        for (const p of Array.from(r.style)) if (p.startsWith('--ar-') && !INTERNAL.test(p)) names.add(p);
      } else if ('cssRules' in r && (r as CSSGroupingRule).cssRules) walk((r as CSSGroupingRule).cssRules);
    }
  };
  for (const s of Array.from(document.styleSheets)) {
    try {
      walk(s.cssRules);
    } catch {
      /* cross-origin sheet (web fonts) — nothing of ours in it */
    }
  }
  return [...names].sort();
}
