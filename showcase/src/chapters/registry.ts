/* The showcase's structure, in one place. The page, the sidebar index and every section's
   number read from here, so a section moves or is renamed by editing this list only. */

export interface SectionDef {
  id: string;
  title: string;
}

export interface ChapterDef {
  id: string;
  title: string;
  /** One line under the title. */
  note: string;
  /** The package components this chapter shows, as named in the kit. */
  components?: readonly string[];
  /** True for chapters about the package itself rather than its components. */
  meta?: boolean;
  sections: readonly SectionDef[];
}

export const CHAPTERS: readonly ChapterDef[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    note: 'One theme, five materials, two voices of text and one set of motions.',
    meta: true,
    sections: [
      { id: 'themes', title: 'Themes' },
      { id: 'materials', title: 'Materials' },
      { id: 'tokens', title: 'Tokens & type' },
      { id: 'type', title: 'Type collections' },
      { id: 'density', title: 'Density' },
      { id: 'layout', title: 'Layout & text' },
      { id: 'typography', title: 'Typography' },
      { id: 'motion', title: 'Motion' },
    ],
  },
  {
    id: 'sliders',
    title: 'Sliders',
    note: 'One compact precision surface: the capsule is the control, the seam is the handle.',
    components: ['Slider', 'RangeSlider', 'Knob', 'XYPad'],
    sections: [
      { id: 'slider-material', title: 'Material' },
      { id: 'slider-precision', title: 'Precision' },
      { id: 'slider-paired', title: 'Paired layout' },
      { id: 'slider-stepped', title: 'Stepped' },
      { id: 'slider-detents', title: 'Detents & mapping' },
      { id: 'slider-bipolar', title: 'Bipolar & status' },
      { id: 'slider-range', title: 'Range' },
      { id: 'slider-gradient', title: 'Gradient' },
      { id: 'slider-ruler', title: 'Ruler' },
      { id: 'slider-visualized', title: 'Visualized' },
      { id: 'slider-enable', title: 'Enable / off' },
      { id: 'knob-pad', title: 'Knob & XY pad' },
      { id: 'slider-events', title: 'Events' },
    ],
  },
  {
    id: 'controls',
    title: 'Controls',
    note: 'The same well, the same insert, the same LED seam, in every shape a parameter takes.',
    components: ['NumberField', 'TextField', 'Switch', 'Checkbox', 'ToggleGroup', 'ChipGroup', 'Segmented', 'Select', 'ColorField', 'FileDrop'],
    sections: [
      { id: 'number-field', title: 'Number field' },
      { id: 'text-field', title: 'Text field' },
      { id: 'switch', title: 'Switch' },
      { id: 'checkbox', title: 'Checkbox' },
      { id: 'toggle-group', title: 'Toggle group' },
      { id: 'chips', title: 'Chips' },
      { id: 'segmented', title: 'Segmented' },
      { id: 'select', title: 'Select' },
      { id: 'color', title: 'Color' },
      { id: 'file-drop', title: 'File drop' },
      { id: 'forms', title: 'Forms' },
    ],
  },
  {
    id: 'actions',
    title: 'Actions',
    note: 'Inserts you press, bare ink that becomes an insert, and quiet marks of state.',
    components: ['Button', 'IconButton', 'Toolbar', 'Kbd', 'Badge'],
    sections: [
      { id: 'buttons', title: 'Buttons' },
      { id: 'toolbars', title: 'Icon buttons & toolbars' },
      { id: 'keys-badges', title: 'Keys & badges' },
    ],
  },
  {
    id: 'display',
    title: 'Display',
    note: 'Read-only instruments. Every number rolls, every level moves in place.',
    components: ['RollingValue', 'Stat', 'Meter', 'Progress', 'Sparkline'],
    sections: [
      { id: 'rolling', title: 'Rolling readout' },
      { id: 'stats', title: 'Stats' },
      { id: 'meters', title: 'Meters' },
      { id: 'progress', title: 'Progress' },
      { id: 'sparklines', title: 'Sparklines' },
    ],
  },
  {
    id: 'layout',
    title: 'Layout',
    note: 'The frames controls live in: glass panels, groups, rows and strips.',
    components: ['Panel', 'Section', 'SectionGroup', 'Field', 'Tabs', 'PropertyRow', 'ItemList', 'ItemRow'],
    sections: [
      { id: 'inspector', title: 'Inspector' },
      { id: 'groups', title: 'Groups & panels' },
      { id: 'item-rows', title: 'Item rows' },
    ],
  },
  {
    id: 'overlays',
    title: 'Overlays',
    note: 'Everything that floats is one frosted sheet, portalled to the body, keeping its theme.',
    components: ['Menu', 'ContextMenu', 'Dialog', 'Toast', 'Tooltip', 'CommandPalette'],
    sections: [
      { id: 'menus', title: 'Menus' },
      { id: 'dialog', title: 'Dialog' },
      { id: 'toasts', title: 'Toasts' },
      { id: 'tooltip', title: 'Tooltip' },
      { id: 'palette', title: 'Command palette' },
    ],
  },
  {
    id: 'workspace',
    title: 'Workspace',
    note: 'A dockable studio around a canvas, and a node editor built from the same controls.',
    components: ['Dock', 'PanelBar', 'MetaBlock', 'NodeGraph', 'LiveGraphView'],
    sections: [
      { id: 'dock', title: 'Dock' },
      { id: 'node-graph', title: 'Node graph' },
    ],
  },
  {
    id: 'make',
    title: 'Make it yours',
    note: 'Edit any theme live, override tokens in code, and take a trimmed kit home.',
    meta: true,
    sections: [
      { id: 'studio', title: 'Theme Studio' },
      { id: 'quick-tokens', title: 'Quick tokens' },
      { id: 'install', title: 'Install & export' },
    ],
  },
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Chapter number, e.g. "02". */
export const chapterNumber = (chapterId: string) => pad(CHAPTERS.findIndex((c) => c.id === chapterId) + 1);

/** Every section with its number ("02.04") and its chapter, by id. */
export const SECTIONS: ReadonlyMap<string, SectionDef & { n: string; chapter: ChapterDef }> = new Map(
  CHAPTERS.flatMap((chapter, ci) => chapter.sections.map((section, si) => [section.id, { ...section, n: `${pad(ci + 1)}.${pad(si + 1)}`, chapter }] as const)),
);

export const sectionAnchor = (id: string) => 's-' + id;
export const chapterAnchor = (id: string) => 'c-' + id;
