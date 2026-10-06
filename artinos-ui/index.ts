/* ARTINOS UI — public surface. Import the stylesheet once at the app root:
     import './artinos-ui/artinos.css'; */

// design system
export { ArtinosTheme, themeStyle } from './core/Theme';
export type { ArtinosThemeProps, TokenOverrides } from './core/Theme';
export { THEMES, THEME_META, GLASS_THEMES, MATERIALS, DENSITIES, GRADIENTS, MAPPINGS, formatValue } from './core/utils';
export type { ThemeName, ThemeMeta, ThemeFamily, MaterialName, Density, ScopeProps, Format, Formatter, Formatted, Mapping, MappingFns, Gradient, GradientName, Stop } from './core/utils';
export type { OptionInput } from './core/options';
export { RollingValue } from './core/RollingValue';
export type { RollingValueProps } from './core/RollingValue';

// continuous controls
export { Slider } from './slider/Slider';
export type { SliderProps, SliderVariant, SliderStatus } from './slider/Slider';
export { RangeSlider } from './slider/RangeSlider';
export type { RangeSliderProps, RangeValue } from './slider/RangeSlider';
export { CURVES } from './slider/engine';
export type { CurveName, PrecisionLevels } from './slider/engine';

// family
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

// layout
export { Panel, Section, Field } from './layout/Panel';
export type { PanelProps, SectionProps, FieldProps } from './layout/Panel';
export { Tabs } from './layout/Tabs';
export type { TabsProps } from './layout/Tabs';
