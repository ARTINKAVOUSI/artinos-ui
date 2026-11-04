/* ARTINOS UI — public surface. Import the stylesheet once at the app root:
     import './artinos-ui/artinos.css';
   graph/gpu (compiles a NodeGraph to three.js TSL) needs `three`, so it is not exported
   here: import compileGPU from the kit's graph/gpu file directly.
*/

// design system
export { ArtinosTheme, themeStyle } from './core/Theme';
export type { ArtinosThemeProps, TokenOverrides } from './core/Theme';
export { THEMES, THEME_META, GLASS_THEMES, HERO_THEMES, variationsOf, MATERIALS, DENSITIES, TYPE_COLLECTIONS, TYPE_META, ACCENTS, ACCENT_META, GRADIENTS, MAPPINGS, formatValue } from './core/utils';
export type { Accent, ThemeName, ThemeMeta, ThemeFamily, MaterialName, Density, TypeCollection, TypeMeta, ScopeProps, Format, Formatter, Formatted, Mapping, MappingName, MappingFns, Gradient, GradientName, Stop, OptionInput } from './core/utils';
export { RollingValue, RollingText } from './core/RollingValue';
export type { RollingValueProps } from './core/RollingValue';
export { ThemedPortal, themeScopeOf } from './core/portal';
export { usePresence, useGlide, useFlip } from './core/motion';
export { useFollower } from './core/reactive';
export type { MotionProfile, MotionTuning, ReactiveMotion } from './core/reactive';
export type { ThemeScope } from './core/portal';

// continuous controls
export { Slider } from './slider/Slider';
export type { SliderProps, SliderVariant, SliderStatus } from './slider/Slider';
export { RangeSlider } from './slider/RangeSlider';
export type { RangeSliderProps, RangeValue } from './slider/RangeSlider';
export { CURVES } from './slider/engine';
export type { CurveName, PrecisionLevels } from './slider/engine';

// controls
export { NumberField } from './controls/NumberField';
export type { NumberFieldProps } from './controls/NumberField';
export { Switch } from './controls/Switch';
export type { SwitchProps } from './controls/Switch';
export { ToggleGroup } from './controls/ToggleGroup';
export type { ToggleGroupProps } from './controls/ToggleGroup';
export { ChipGroup } from './controls/ChipGroup';
export type { ChipGroupProps, ChipOption } from './controls/ChipGroup';
export { Segmented } from './controls/Segmented';
export type { SegmentedProps } from './controls/Segmented';
export { ColorField } from './controls/ColorField';
export type { ColorFieldProps } from './controls/ColorField';
export { Select } from './controls/Select';
export type { SelectProps } from './controls/Select';
export { TextField } from './controls/TextField';
export type { TextFieldProps } from './controls/TextField';
export { Checkbox } from './controls/Checkbox';
export type { CheckboxProps } from './controls/Checkbox';
export { FieldContext, useField } from './core/field';
export type { FieldState } from './core/field';
export { FileDrop } from './controls/FileDrop';
export type { FileDropProps } from './controls/FileDrop';
export { Knob } from './controls/Knob';
export type { KnobProps } from './controls/Knob';
export { XYPad } from './controls/XYPad';
export type { XYPadProps } from './controls/XYPad';

// actions
export { Button } from './actions/Button';
export type { ButtonProps } from './actions/Button';
export { IconButton } from './actions/IconButton';
export type { IconButtonProps } from './actions/IconButton';
export { Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarSpacer } from './actions/Toolbar';
export type { ToolbarProps } from './actions/Toolbar';
export { Kbd } from './actions/Kbd';
export type { KbdProps } from './actions/Kbd';
export { Badge } from './actions/Badge';
export type { BadgeProps } from './actions/Badge';
export { Tag } from './actions/Tag';
export type { TagProps } from './actions/Tag';

// display
export { Meter } from './display/Meter';
export type { MeterProps } from './display/Meter';
export { Spectrum } from './display/Spectrum';
export type { SpectrumProps } from './display/Spectrum';
export type { InstrumentTone, Zone } from './display/zones';
export { Sparkline } from './display/Sparkline';
export type { SparklineProps } from './display/Sparkline';
export { Stat } from './display/Stat';
export type { StatProps } from './display/Stat';
export { Progress } from './display/Progress';
export type { ProgressProps } from './display/Progress';

// layout
export { Panel, Section, SectionGroup, Field } from './layout/Panel';
export type { PanelProps, SectionProps, SectionGroupProps, FieldProps } from './layout/Panel';
export { StatStrip } from './layout/StatStrip';
export type { StatStripProps, StatStripItem } from './layout/StatStrip';
export { Tabs } from './layout/Tabs';
export type { TabsProps } from './layout/Tabs';
export { PropertyRow } from './layout/PropertyRow';
export type { PropertyRowProps, PropertyDensity } from './layout/PropertyRow';
export { ItemList, ItemRow } from './layout/ItemRow';
export { moveBetween } from './core/sortable';
export type { SortPlace } from './core/sortable';
export { Inline, Stack, Text } from './layout/Text';
export type { InlineProps, Space, StackProps, TextAccent, TextFace, TextProps, TextTone, TextVariant } from './layout/Text';
export { Callout } from './layout/Callout';
export type { CalloutProps, CalloutTone } from './layout/Callout';
export type { ItemListProps, ItemRowProps } from './layout/ItemRow';

// overlays
export { Menu, ContextMenu } from './overlays/Menu';
export type { MenuEntry, MenuProps, ContextMenuProps } from './overlays/Menu';
export { Dialog } from './overlays/Dialog';
export type { DialogProps } from './overlays/Dialog';
export { ToastProvider, useToast } from './overlays/Toast';
export type { ToastOptions } from './overlays/Toast';
export { Tooltip } from './overlays/Tooltip';
export type { TooltipProps } from './overlays/Tooltip';
export { CommandPalette } from './overlays/CommandPalette';
export type { Command, CommandPaletteProps } from './overlays/CommandPalette';

// dock: the studio workspace, and the MetaBlock engine it is built on
export { Dock, TEAR_PREFIX, useDock } from './dock/Dock';
export { createDockSections } from './dock/sections';
export type { DockSections, DockSectionsOptions } from './dock/sections';
export type { DockProps, DockPanel, DockApi, DockEdge } from './dock/Dock';
export { PanelBar } from './dock/PanelBar';
export { DockMenu } from './dock/DockMenu';
export { MetaBlockWorkspace, defaultCapabilities } from './dock/metablock/workspace';
export { MetaBlockWorkspaceView } from './dock/metablock/WorkspaceView';
export type { MetaBlockWorkspaceViewProps, GroupChromeContext, MetaBlockContextMenuItem, MetaBlockContextMenuModel, MetaBlockContextMenuSection, MetaBlockContextMenuRenderContext } from './dock/metablock/WorkspaceView';
export { MetaBlockBody, MetaBlockEmpty } from './dock/metablock/BlockBody';
export type { MetaBlockBodyProps } from './dock/metablock/BlockBody';
export { useWorkspaceRevision } from './dock/metablock/hooks';
export * from './dock/metablock/types';

// graph: the node editor and the live graph view
export { NodeGraph } from './graph/NodeGraph';
export type { NodeGraphProps } from './graph/NodeGraph';
export { LiveGraphView } from './graph/LiveGraphView';
export type { LiveGraphViewProps, LiveGraph, LiveNode, LiveEdge, LiveKind, LiveControl } from './graph/LiveGraphView';
export { useGraphEditor } from './graph/editor';
export type { GraphEditor } from './graph/editor';
export * from './graph/graph';
