/* Types for kit.mjs, so the showcase can import it under strict TypeScript. */

export interface KitComponent {
  /** heading the component is listed under */
  group: string;
  id: string;
  label: string;
  file: string;
  note: string;
}
export interface ThemeInfo {
  label: string;
  family: string;
  kind: string;
  description: string;
}
export interface CustomThemeCss {
  slug: string;
  name: string;
  css: string;
}
export interface KitOptions {
  /** kit folder name; also the import path used in the generated README */
  folder: string;
  themes: string[];
  components: string[];
  customs: CustomThemeCss[];
  googleFonts: boolean;
  materials: boolean;
  /** guide name → markdown, written to docs/ in the kit */
  docs?: Record<string, string> | null;
  /** absolute path of the package folder, for the re-export hint in the README */
  pkgRoot?: string;
}
export const BASE_THEME: string;
export const COMPONENTS: KitComponent[];
export function readRegistry(sources: Record<string, string>): { themes: string[]; meta: Record<string, ThemeInfo> };
export function buildKit(sources: Record<string, string>, o: KitOptions): Record<string, string>;
