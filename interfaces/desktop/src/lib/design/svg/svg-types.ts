/**
 * @file SVG Visual Engine — Type Definitions
 * @package @devpulse/coldlight
 *
 * Types for the SVG visual engine. Peer to styles/macro-mappings.ts (HTML engine).
 * 20-axis system for SVG elements. Pure data — no DOM, no rendering.
 */

/** The 6 brand accent hues */
export type SvgAccent = "teal" | "purple" | "magenta" | "ember" | "frost" | "cyber";

/** Semantic intent names — resolved to visual preset via INTENT_MAP */
export type SvgIntent = "default" | "glass" | "stark" | "flat" | "matte" | "primary" | "secondary" | "ghost" | "danger";

/** The 20 SVG visual axes */
export type SvgAxis =
	| "stroke"
	| "strokeWidth"
	| "strokeLinecap"
	| "strokeOpacity"
	| "fill"
	| "fillOpacity"
	| "glowColor"
	| "glowBlur"
	| "glowOpacity"
	| "trackStroke"
	| "trackOpacity"
	| "textColor"
	| "textGlowColor"
	| "textGlowBlur"
	| "fontFamily"
	| "fontSize"
	| "fontWeight"
	| "filterUrl"
	| "animation"
	| "transition";

/** Resolved output from the SVG macro resolver */
export interface SvgMacroResolved {
	/** CSS custom property string for the style attribute */
	style: string;
	/** Data attributes for glue CSS targeting and debugging */
	attrs: {
		"data-svg-kind": string;
		"data-svg-intent": string;
		"data-svg-accent"?: string;
	};
}

/** Input options for the SVG macro resolver */
export interface SvgMacroOptions {
	/** Widget kind identifier (e.g., "radial-gauge", "spark-line") */
	kind: string;
	/** Semantic intent — resolved to visual preset name */
	intent?: string;
	/** Accent hue — sets the color layer independently of preset */
	accent?: SvgAccent;
}

/** Single axis mapping entry */
export interface SvgAxisMapping {
	/** CSS custom property name (e.g., "--svg-stroke") */
	cssVar: string;
	/** DTCG token type */
	dtcgType: string;
	/** Default value when preset doesn't specify */
	defaultValue: string;
	/** DTCG property name in preset JSON (e.g., "stroke-width") */
	presetKey: string;
}
