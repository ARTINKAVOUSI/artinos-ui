/* ARTINOS UI — public surface. Import the stylesheet once at the app root:
     import './artinos-ui/artinos.css';
   graph/gpu (compiles a NodeGraph to three.js TSL) needs `three` and is imported by path:
     import { compileGPU } from './artinos-ui/graph/gpu'; */

// design system
export { ArtinosTheme, themeStyle } from './core/Theme';
export type { ArtinosThemeProps, TokenOverrides } from './core/Theme';
export { THEMES, THEME_META, GLASS_THEMES, MATERIALS, DENSITIES, GRADIENTS, MAPPINGS, formatValue } from './core/utils';
export type { ThemeName, ThemeMeta, ThemeFamily, MaterialName, Density, ScopeProps, Format, Formatter, Formatted, Mapping, MappingName, MappingFns, Gradient, GradientName, Stop, OptionInput } from './core/utils';
export { RollingValue } from './core/RollingValue';
export type { RollingValueProps } from './core/RollingValue';
export { ThemedPortal, themeScopeOf } from './core/portal';
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
export { Segmented } from './controls/Segmented';
export type { SegmentedProps } from './controls/Segmented';
export { ColorField } from './controls/ColorField';
export type { ColorFieldProps } from './controls/ColorField';
export { Select } from './controls/Select';
export type { SelectProps } from './controls/Select';
export { TextField } from './controls/TextField';
export type { TextFieldProps } from './controls/TextField';
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
export { Toolbar, ToolbarSeparator, ToolbarSpacer } from './actions/Toolbar';
export type { ToolbarProps } from './actions/Toolbar';
export { Kbd } from './actions/Kbd';
export type { KbdProps } from './actions/Kbd';
export { Badge } from './actions/Badge';
export type { BadgeProps } from './actions/Badge';

// display
export { Meter } from './display/Meter';
export type { MeterProps } from './display/Meter';
export { Sparkline } from './display/Sparkline';
export type { SparklineProps } from './display/Sparkline';

// layout
export { Panel, Section, Field } from './layout/Panel';
export type { PanelProps, SectionProps, FieldProps } from './layout/Panel';
export { Tabs } from './layout/Tabs';
export type { TabsProps } from './layout/Tabs';
export { PropertyRow } from './layout/PropertyRow';
export type { PropertyRowProps, PropertyDensity } from './layout/PropertyRow';

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
export { Dock, useDock } from './dock/Dock';
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
