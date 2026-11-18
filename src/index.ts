/* ARTINOS UI — public surface. Import the stylesheet once at the app root:
     import './artinos-ui/artinos.css';
   graph/gpu (compiles a NodeGraph to three.js TSL) needs `three`, so it is not exported
   here: import compileGPU from the kit's graph/gpu file directly.
*/

// the value core: a signal is the value, and needs neither React nor the DOM
export { signal, computed, effect, batch, untrack } from './core/signal';
export type { Signal, ReadSignal, SignalOptions } from './core/signal';
export { tweened, mixTween } from './core/tween';
export type { Tweened, TweenOptions, Tweenable } from './core/tween';
export { useSignal, useSignalValue } from './core/useSignal';
export { evaluate } from './core/expression';

// design system
export { ArtinosTheme, themeStyle, densityTokensCss } from './core/Theme';
export type { ArtinosThemeProps, DensityTokens, TokenOverrides } from './core/Theme';
export { THEMES, THEME_META, GLASS_THEMES, THEME_ALIASES, DEFAULT_THEME, MATERIALS, DENSITIES, DENSITY_META, TYPE_COLLECTIONS, TYPE_ALIASES, TYPE_META, ACCENTS, ACCENT_META, GRADIENTS, MAPPINGS, formatValue } from './core/utils';
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

// rig: controls for things in 3D space
export { ViewGizmo } from './rig/ViewGizmo';
export type { ViewGizmoProps } from './rig/ViewGizmo';
export { Trackball } from './rig/Trackball';
export type { TrackballProps } from './rig/Trackball';
export { Vector3Field } from './rig/Vector3Field';
export type { Vector3FieldProps } from './rig/Vector3Field';
export { QUAT_IDENTITY, VIEWS, qFromEuler, eulerFromQuat, qFromOrbit, orbitPosition, orbitBy, qMul, qSlerp, qRotate, qAxisAngle, qConjugate, qNormalize } from './rig/math';
export type { Vec3, Quat, Axis } from './rig/math';
// rig/TransformGizmo (move · rotate · scale handles inside a three.js scene) needs `three`:
// import it from the kit's rig/TransformGizmo file directly.

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
export { Graph, GraphTrace, FrameGraph } from './display/Graph';
export type { GraphProps, GraphTraceProps, GraphSeries, FrameGraphProps } from './display/Graph';
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
export type { TabItem, TabsOrientation, TabsProps, TabsVariant } from './layout/Tabs';
export { PropertyRow } from './layout/PropertyRow';
export type { PropertyRowProps, PropertyDensity } from './layout/PropertyRow';
export { ItemGroup, ItemList, ItemRow } from './layout/ItemRow';
export { moveBetween } from './core/sortable';
export type { SortPlace } from './core/sortable';
export { Inline, Stack, Text } from './layout/Text';
export type { InlineProps, Space, StackProps, TextAccent, TextFace, TextProps, TextTone, TextVariant } from './layout/Text';
export { Callout } from './layout/Callout';
export type { CalloutProps, CalloutTone } from './layout/Callout';
export type { ItemGroupProps, ItemListProps, ItemListSize, ItemListVariant, ItemRowProps, ItemStatus } from './layout/ItemRow';

// auto-hide: one switch that hides every Dock, auto-hiding Panel and <AutoHide> for a clean view
export { AutoHide, INTERFACE_EVENT, interfaceVisibility, useAutoHide, useInterfaceVisibility } from './core/autohide';
export type { AutoHideOptions, AutoHideProps, HiddenReason, InterfaceVisibilityState } from './core/autohide';

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

// inspector: the pro parameter editor, from a schema, bound both ways to the app's object
export { Inspector } from './inspector/Inspector';
export type { InspectorProps } from './inspector/Inspector';
export { InspectorTimeline } from './inspector/Timeline';
export type { InspectorTimelineProps } from './inspector/Timeline';
export { createInspectorStore, mergeInspectorStores, isField, sameValue, keyAt, valueAt, seededRandom, INSPECT_FORMAT } from './inspector/store';
export { registerControl } from './inspector/registry';
export type { InspectControl, InspectControlProps } from './inspector/registry';
export { createMidiMap } from './inspector/midi';
export type { MidiBinding, MidiMap, MidiMapOptions, MidiState } from './inspector/midi';
export type { RandomizeOptions, InspectDocument, InspectCustom, InspectAction, InspectChoice, InspectColor, InspectDiagnosis, InspectField, InspectFolder, InspectItem, InspectKey, InspectLink, InspectMonitor, InspectNumber, InspectPoint, InspectRange, InspectText, InspectToggle, InspectValue, InspectValues, InspectVector, InspectorState, InspectorStore, InspectorStoreOptions } from './inspector/store';

// a panel from a line: a hook for React, a binding call for everything else
export { useControls, ControlsPanel, controlsStore } from './pane/useControls';
export type { ControlsPanelProps, SignalsOf, UseControlsOptions } from './pane/useControls';
export { monitor, folder } from './pane/schema';
export type { ControlEntry, ControlOptions, ControlSchema, FolderEntry, MonitorEntry, MonitorOptions, ValuesOf } from './pane/schema';
export { createPane } from './pane/createPane';
export type { BindingOptions, Pane, PaneBinding, PaneFolder, PaneOptions } from './pane/createPane';

// dock: the studio workspace, and the MetaBlock engine it is built on
export { Dock, TEAR_PREFIX, useDock } from './dock/Dock';
export { createDockSections } from './dock/sections';
export type { DockSections, DockSectionsOptions } from './dock/sections';
export type { DockProps, DockPanel, DockApi, DockEdge, DockTabStyle } from './dock/Dock';
export { PanelBar } from './dock/PanelBar';
export { createParamPanes, ParamControl, ParamSection, paramShown } from './dock/params';
export type { ChoiceParam, NumberFace, NumberParam, Param, ParamGroup, ParamPanes, ParamPanesOptions, ParamSectionProps, ParamStore, ParamValue, ParamValues, ToggleParam } from './dock/params';
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
