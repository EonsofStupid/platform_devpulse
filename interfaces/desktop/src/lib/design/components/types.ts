/**
 * @file Component Types
 * @description Shared types for ColdLight styled components.
 *
 * Visual axis props flow from consumer → component → StyleMacro → CSS vars.
 * These are the 8 axes that map to DTCG preset token values.
 */

// =============================================================================
// VISUAL AXIS PROPS — what consumers set on components
// =============================================================================

/** Surface type — glass material / opacity / blur tier */
export type SurfaceToken = "glass-void" | "glass-smoke" | "glass-deep" | "glass-frost" | "glass-teal" | "glass-purple" | "matte-dark" | "matte-medium" | "matte-light";

/** Shadow depth tier — z0 (flat) through z4 (floating) */
export type DepthToken = "z0" | "z1" | "z2" | "z3" | "z4";

/** Neumorphic bevel intensity */
export type BevelToken = "off" | "subtle" | "soft" | "medium" | "pronounced" | "deep";

/** Accent glow emission color */
export type GlowToken = "off" | "teal" | "purple" | "magenta" | "ember" | "frost" | "cyber";

/** Border frame style */
export type FrameToken = "off" | "divider" | "default" | "strong" | "focus" | "soft" | "glow" | "accent-teal" | "accent-purple";

/** Border radius tier */
export type RadiusToken = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

/** Size token for components with size variants */
export type SizeToken = "sm" | "md" | "lg";

/**
 * Visual axis props — the consumer-facing API for ColdLight styled components.
 * These map 1:1 to the 8-axis encoding system and DTCG preset token values.
 */
export interface VisualAxisProps {
	surface?: SurfaceToken;
	depth?: DepthToken;
	bevel?: BevelToken;
	glow?: GlowToken;
	frame?: FrameToken;
	radius?: RadiusToken;
	/** Ambient motion animation */
	motion?: string;
	/** Transition timing */
	transition?: string;
}

/** All styled components accept these surface prop overrides */
export interface ComponentSurfaceProps extends Partial<VisualAxisProps> {
	/** Style preset ID — selects a named preset from the central library */
	preset?: string;
}
