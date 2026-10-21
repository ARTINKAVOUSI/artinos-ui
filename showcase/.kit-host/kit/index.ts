/* ARTINOS UI — public surface. Import the stylesheet once at the app root:
     import './artinos-ui/artinos.css';
   graph/gpu (compiles a NodeGraph to three.js TSL) needs `three`, so it is not exported
   here: import compileGPU from the kit's graph/gpu file directly.
*/

// design system
export { ArtinosTheme, themeStyle } from './core/Theme';
export type { ArtinosThemeProps, TokenOverrides } from './core/Theme';
export { THEMES, THEME_META, GLASS_THEMES, MATERIALS, DENSITIES, TYPE_COLLECTIONS, TYPE_META, GRADIENTS, MAPPINGS, formatValue } from './core/utils';
export type { ThemeName, ThemeMeta, ThemeFamily, MaterialName, Density, TypeCollection, TypeMeta, ScopeProps, Format, Formatter, Formatted, Mapping, MappingName, MappingFns, Gradient, GradientName, Stop, OptionInput } from './core/utils';
export { RollingValue, RollingText } from './core/RollingValue';
export type { RollingValueProps } from './core/RollingValue';
export { usePresence, useGlide, useFlip } from './core/motion';

// continuous controls
export { Slider } from './slider/Slider';
export type { SliderProps, SliderVariant, SliderStatus } from './slider/Slider';
export { CURVES } from './slider/engine';
export type { CurveName, PrecisionLevels } from './slider/engine';

// controls
export { Select } from './controls/Select';
export type { SelectProps } from './controls/Select';

// layout
export { Panel, Section, Field } from './layout/Panel';
export type { PanelProps, SectionProps, FieldProps } from './layout/Panel';

