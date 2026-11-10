/* Theme Studio — inspect: which tokens does a piece of UI read?
   Rules are matched from the clicked element upward; the first rule that matches
   an element names that part. More specific selectors come first. */

export interface Part {
  id: string;
  label: string;
  tokens: string[];
}

const P = (id: string, label: string, tokens: string[]): Part => ({ id, label, tokens: tokens.map((t) => '--ar-' + t) });

const INSERT = ['insert', 'insert-shadow', 'insert-backdrop', 'insert-radius', 'insert-off-filter'];
const INSERT_INK = ['insert-ink', 'insert-unit-ink', 'insert-text-shadow', 'control-font', 'label-weight', 'label-tracking', 'label-size'];
const LABEL = ['label-ink', 'base-text-shadow', 'control-font', 'label-weight', 'label-tracking', 'label-case', 'label-size', 'off-ink'];
const VALUE = ['value-ink', 'value-ink-hi', 'unit-ink', 'base-text-shadow', 'control-font', 'value-weight', 'value-size', 'off-ink'];
const WELL = ['trough', 'well', 'trough-backdrop', 'radius', 'inset', 'bg-well', 'h', 'pad-x', 'focus-ring'];
const PANEL = ['panel-tint', 'panel-blur', 'panel-sheen', 'panel-shadow', 'panel-text-shadow', 'radius-shell', 'line-subtle'];

export const PART_RULES: Array<[string, Part]> = [
  // text sitting on the insert
  ['.ar-text--over, .ar-slider__readout--over', P('insert-ink', 'Ink on the insert', INSERT_INK)],
  ['.ar-slider__edit', P('value-edit', 'Typed value field', ['float-bg', 'float-ink', 'signal-line', 'signal-wash', 'control-font', 'value-size'])],
  // slider anatomy
  ['.ar-seam', P('seam', 'Seam', ['seam', 'seam-hover', 'seam-active', 'seam-w', 'seam-offset', 'seam-scale', 'seam-scale-hot', 'seam-glow', 'seam-edge', 'grad-seam', 'signal'])],
  ['.ar-slider__cell[data-lit]', P('insert', 'Insert (stepped cell)', [...INSERT, 'cell-insert-shadow'])],
  ['.ar-slider__cell', P('cell', 'Stepped cell', ['cell', 'cell-shadow', 'cell-radius'])],
  ['.ar-slider__fill, .ar-switch__knob, .ar-switch__shutter, .ar-segmented__insert, .ar-select__face.ar-insert, .ar-toggles__chip', P('insert', 'Insert', INSERT)],
  ['.ar-switch__mark', P('switch-mark', 'Switch mark', ['seam', 'seam-active', 'signal-line'])],
  ['.ar-led', P('led', 'LED', ['led-on', 'led-off', 'led-glow', 'signal'])],
  ['.ar-dot', P('dot', 'Enable dot', ['signal', 'signal-line', 'off-ink', 'bind', 'warn', 'fault'])],
  ['.ar-slider__mark', P('mark', 'Detent / step mark', ['tick', 'tick-major'])],
  ['.ar-slider__offline', P('off', 'Off line', ['off-ink'])],
  ['.ar-slider__grad, .ar-slider__gradwell, .ar-slider__sheen', P('gradient', 'Gradient track', ['grad-well', 'grad-sheen', 'grad-seam', 'grad-ink-dark', 'grad-ink-light', 'rim'])],
  ['.ar-ruler__index, .ar-ruler__foot', P('index', 'Ruler index', ['index', 'seam-active', 'signal-line'])],
  ['.ar-ruler, .ar-ruler *', P('ruler', 'Ruler scale', ['ruler-ink', 'ruler-minor', 'tick', 'tick-major', 'control-font'])],
  ['.ar-slider__plot, .ar-slider__plot *', P('plot', 'Plot', ['plot', 'plot-hi', 'index'])],
  ['.ar-color__swatch, .ar-color__swatch *', P('swatch', 'Colour swatch', ['swatch-rim', 'insert-radius'])],
  ['.ar-slider__readout, .ar-roll, .ar-number__value, .ar-value', P('value', 'Value readout', VALUE)],
  ['.ar-slider__label, .ar-slider__side, .ar-toggles__label, .ar-color__label, .ar-number__label, .ar-text', P('label', 'Label', LABEL)],
  ['.ar-segmented__opt', P('segment', 'Segment (unselected)', ['dim-ink', 'control-font', 'label-size', 'label-tracking'])],
  ['.ar-well', P('well', 'Well', WELL)],
  // layout
  ['.ar-tabs__bar', P('tab-bar', 'Tab underline', ['text-hi', 'dur-layout'])],
  ['.ar-tabs__tab', P('tab', 'Tab', ['text-low', 'text-mid', 'text-hi', 'font-ui'])],
  ['.ar-section__title, .ar-section__count, .ar-section__rule', P('section', 'Section header', ['text-mid', 'text-hi', 'text-faint', 'line', 'font-num'])],
  ['.ar-field__label', P('field', 'Field label', ['text-mid', 'font-ui'])],
  ['.ar-panel__title, .ar-panel__subtitle, .ar-panel__foot', P('panel-text', 'Panel text', ['text-hi', 'text-low', 'line-subtle', 'font-ui', 'font-num'])],
  ['.sc-num, .sc-title, .sc-part span, .sc-subhead', P('caption', 'Caption', ['text-low', 'text-mid', 'text-hi', 'font-num'])],
  ['.sc-text, .sc-note, .ed-sheet__head span, p', P('body-text', 'Body text', ['text-mid', 'text-low', 'font-ui'])],
  ['h1, h2, .ed-sheet__head h2', P('heading', 'Heading', ['text-hi', 'font-ui'])],
  ['.ar-panel, .sc-sheet', P('panel', 'Panel glass', PANEL)],
];

/** Friendly component names for the selection title. */
const COMPONENTS: Array<[string, string]> = [
  ['.ar-range', 'Range slider'],
  ['.ar-slider', 'Slider'],
  ['.ar-switch', 'Switch'],
  ['.ar-toggles', 'Toggle group'],
  ['.ar-segmented', 'Segmented'],
  ['.ar-color', 'Colour field'],
  ['.ar-select', 'Select'],
  ['.ar-number', 'Number field'],
  ['.ar-tabs', 'Tabs'],
  ['.ar-section', 'Section'],
  ['.ar-field', 'Field'],
  ['.ar-panel', 'Panel'],
];
export const GROUND: Part = P('ground', 'Ground', ['bg-app', 'text-hi', 'text-mid']);

export interface Picked {
  title: string;
  parts: Part[];
  /** the element the first part names — outlined in the preview */
  el: Element;
}

const OVER_INK = PART_RULES[0][1];

/**
 * What is under the pointer? Hit-tests every layer at (x, y) — the preview forces
 * pointer events on while inspecting — and takes the topmost element that names a
 * part. Up to three parts come back, innermost first: that part, then what holds it.
 */
export function inspectAt(x: number, y: number, root: Element): Picked {
  const stack = document.elementsFromPoint(x, y).filter((el) => el !== root && root.contains(el));
  const target = stack.find((el) => PART_RULES.some(([sel]) => el.matches(sel)));
  if (!target) return { title: 'Ground', parts: [GROUND], el: root };
  return inspect(target, root);
}

export function inspect(target: Element, root: Element): Picked {
  const parts: Part[] = [];
  let first: Element | null = null;
  // text drawn over the insert takes the insert's ink, whatever element carries it
  const over = target.closest('.ar-text--over, .ar-slider__readout--over');
  if (over && root.contains(over)) {
    parts.push(OVER_INK);
    first = over;
  }
  for (let el: Element | null = target; el && root.contains(el); el = el.parentElement) {
    const hit = PART_RULES.find(([sel, part]) => el!.matches(sel) && !parts.some((p) => p.id === part.id) && !(over && (part.id === 'value' || part.id === 'label')));
    if (hit) {
      parts.push(hit[1]);
      if (!first) first = el;
      if (parts.length >= 3) break;
    }
    if (el === root) break;
  }
  if (!parts.length) parts.push(GROUND);
  const comp = COMPONENTS.find(([sel]) => target.closest(sel) && root.contains(target.closest(sel)));
  const title = (comp ? comp[1] + ' › ' : '') + parts[0].label;
  return { title, parts, el: first ?? root };
}
