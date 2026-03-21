/**
 * @file StyleMacro Mappings — Static Token Property Dictionary
 * @package @devpulse/coldlight
 *
 * Maps camelCase TypeScript properties to CSS custom property names
 * and token categories. Lives in module scope — instantiated ONCE,
 * shared across the entire application.
 *
 * Adding a property here automatically makes it available in:
 * - StyleMacro resolution
 * - VPB controls
 * - Type-safe autocomplete
 * - Encoding serialization
 */

// =============================================================================
// STYLE MACRO PROPS — The type every visual declaration satisfies
// =============================================================================

export interface StyleMacroProps {
	// Surface / Color
	backgroundColor: string;
	color: string;
	borderColor: string;
	accentColor: string;

	// Spacing
	padding: string;
	paddingX: string;
	paddingY: string;
	gap: string;
	margin: string;

	// Sizing
	width: string;
	height: string;
	minWidth: string;
	minHeight: string;
	maxWidth: string;

	// Border
	borderRadius: string;
	borderWidth: string;
	borderStyle: string;

	// Typography
	fontSize: string;
	fontWeight: string;
	fontFamily: string;
	lineHeight: string;
	letterSpacing: string;
	textAlign: string;

	// Effects (8-axis encoding)
	surface: string;
	material: string;
	depth: string;
	bevel: string;
	glow: string;
	frame: string;
	motion: string;
	transition: string;

	// Layout
	display: string;
	flexDirection: string;
	alignItems: string;
	justifyContent: string;
	overflow: string;

	// Opacity / Visibility
	opacity: string;

	// Z-Index
	zIndex: string;
}

// =============================================================================
// TOKEN MAPPING — How each prop maps to CSS
// =============================================================================

export interface TokenMapping {
	/** The --cl- CSS custom property name. */
	varName: string;
	/** The token category for var() resolution. */
	category: string;
	/** 8-axis encoding code (s, z, d, b, g, f, m, t) if applicable. */
	encodingCode?: string;
	/** Whether this prop maps to an SVG filter class. */
	svgFilter?: boolean;
}

export const propMappings: Record<keyof StyleMacroProps, TokenMapping> = {
	// Surface / Color
	backgroundColor: { varName: "--cl-bg", category: "color" },
	color: { varName: "--cl-text", category: "color" },
	borderColor: { varName: "--cl-border-color", category: "color" },
	accentColor: { varName: "--cl-accent", category: "color" },

	// Spacing
	padding: { varName: "--cl-p", category: "spacing" },
	paddingX: { varName: "--cl-px", category: "spacing" },
	paddingY: { varName: "--cl-py", category: "spacing" },
	gap: { varName: "--cl-gap", category: "spacing" },
	margin: { varName: "--cl-m", category: "spacing" },

	// Sizing
	width: { varName: "--cl-w", category: "size" },
	height: { varName: "--cl-h", category: "size" },
	minWidth: { varName: "--cl-min-w", category: "size" },
	minHeight: { varName: "--cl-min-h", category: "size" },
	maxWidth: { varName: "--cl-max-w", category: "size" },

	// Border
	borderRadius: { varName: "--cl-radius", category: "radius" },
	borderWidth: { varName: "--cl-border-w", category: "border" },
	borderStyle: { varName: "--cl-border-style", category: "border" },

	// Typography
	fontSize: { varName: "--cl-text-size", category: "text" },
	fontWeight: { varName: "--cl-font-weight", category: "font-weight" },
	fontFamily: { varName: "--cl-font", category: "font" },
	lineHeight: { varName: "--cl-leading", category: "leading" },
	letterSpacing: { varName: "--cl-tracking", category: "tracking" },
	textAlign: { varName: "--cl-text-align", category: "text-align" },

	// Effects (8-axis)
	surface: { varName: "--cl-surface", category: "surface", encodingCode: "s" },
	material: { varName: "--cl-material", category: "material", encodingCode: "z" },
	depth: { varName: "--cl-depth", category: "shadow", encodingCode: "d" },
	bevel: { varName: "--cl-bevel", category: "bevel", encodingCode: "b", svgFilter: true },
	glow: { varName: "--cl-glow", category: "glow", encodingCode: "g" },
	frame: { varName: "--cl-frame", category: "border", encodingCode: "f" },
	motion: { varName: "--cl-motion", category: "motion", encodingCode: "m" },
	transition: { varName: "--cl-transition", category: "transition", encodingCode: "t" },

	// Layout
	display: { varName: "--cl-display", category: "display" },
	flexDirection: { varName: "--cl-flex-dir", category: "flex" },
	alignItems: { varName: "--cl-align", category: "align" },
	justifyContent: { varName: "--cl-justify", category: "justify" },
	overflow: { varName: "--cl-overflow", category: "overflow" },

	// Opacity
	opacity: { varName: "--cl-opacity", category: "opacity" },

	// Z-Index
	zIndex: { varName: "--cl-z", category: "z" },
};

// Pre-compute keys array for fast iteration — never changes after module load
export const macroKeys = Object.keys(propMappings) as Array<keyof StyleMacroProps>;
