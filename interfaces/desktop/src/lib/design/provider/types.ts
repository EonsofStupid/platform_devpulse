/**
 * ColdLight Provider types.
 *
 * The provider controls theme context: accent color, color scheme,
 * and any overrides that flow down to all ColdLight components.
 */

/** Accent color palette names available in the design system. */
export type AccentColor = "teal" | "purple" | "magenta" | "ember" | "frost" | "cyber";

export type ColorScheme = "dark" | "light";

export interface ColdLightTheme {
	/** Active accent color. Default: "teal". */
	accent: AccentColor;
	/** Color scheme. Default: "dark". */
	colorScheme: ColorScheme;
	/** Whether neumorphic effects are enabled. Default: true. */
	neumorphism: boolean;
	/** Whether animations are enabled. Default: true (respects prefers-reduced-motion). */
	animations: boolean;
	/** Base scale multiplier for token values. Default: 1. */
	scale: number;
}

export interface ColdLightProviderProps {
	/** Theme configuration. Partial — missing values use defaults. */
	theme?: Partial<ColdLightTheme>;
}
