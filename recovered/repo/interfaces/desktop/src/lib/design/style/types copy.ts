/**
 * ColdLight style function types.
 *
 * Maps token property names to their valid values.
 * SD5 generates the CSS custom properties — this type system
 * ensures components reference valid tokens.
 */

// ── Surface tokens (from token-categories.ts) ──────────────
export type SurfaceToken =
	| "transparent"
	| "glass-void"
	| "glass-deep"
	| "glass-smoke"
	| "glass-frost"
	| "glass-teal"
	| "glass-purple"
	| "matte-dark"
	| "solid-teal"
	| "void-gradient";

// ── Material tokens ─────────────────────────────────────────
export type MaterialToken =
	| "none"
	| "glass-subtle"
	| "glass-medium"
	| "glass-intense"
	| "glass-ultra"
	| "solid-matte"
	| "solid-satin"
	| "metal-brushed"
	| "metal-chrome"
	| "metal-copper";

// ── Depth tokens ────────────────────────────────────────────
export type DepthToken = "flat" | "z1" | "z2" | "z3" | "z4";

// ── Bevel tokens ────────────────────────────────────────────
export type BevelToken = "flat" | "subtle" | "soft" | "medium" | "strong";

// ── Glow tokens ─────────────────────────────────────────────
export type GlowToken = "none" | "teal" | "purple" | "ember" | "magenta" | "frost" | "cyber";

// ── Frame tokens ────────────────────────────────────────────
export type FrameToken =
	| "none"
	| "soft"
	| "hard"
	| "crisp"
	| "glow"
	| "accent-teal"
	| "accent-purple";

// ── Motion tokens ───────────────────────────────────────────
export type MotionToken =
	| "none"
	| "breathe"
	| "shimmer"
	| "drift"
	| "pulse"
	| "fade-in"
	| "slide-up"
	| "slide-down"
	| "scale-in";

// ── Transition tokens ───────────────────────────────────────
export type TransitionToken =
	| "none"
	| "snap"
	| "fast"
	| "normal"
	| "smooth"
	| "spring"
	| "bounce"
	| "opacity-fast"
	| "transform-spring"
	| "color-smooth";

// ── Color tokens (SD5 generated) ────────────────────────────
export type AccentColor = "teal" | "purple" | "magenta" | "ember" | "frost" | "cyber";
export type ColorScale =
	| "50"
	| "100"
	| "200"
	| "300"
	| "400"
	| "500"
	| "600"
	| "700"
	| "800"
	| "900";
export type ColorToken = `${AccentColor}-${ColorScale}` | "white" | "black" | "transparent";

// ── Spacing tokens ──────────────────────────────────────────
export type SpaceToken =
	| "0"
	| "0.5"
	| "1"
	| "1.5"
	| "2"
	| "2.5"
	| "3"
	| "3.5"
	| "4"
	| "5"
	| "6"
	| "7"
	| "8"
	| "9"
	| "10"
	| "11"
	| "12"
	| "14"
	| "16"
	| "20"
	| "24"
	| "28"
	| "32";

// ── Radius tokens ───────────────────────────────────────────
export type RadiusToken = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

// ── Font tokens ─────────────────────────────────────────────
export type FontSizeToken =
	| "xs"
	| "sm"
	| "base"
	| "lg"
	| "xl"
	| "2xl"
	| "3xl"
	| "4xl"
	| "5xl"
	| "display";
export type FontWeightToken = "normal" | "medium" | "semibold" | "bold";

// ── Conditional styles (S2 pattern) ─────────────────────────
export type StateCondition =
	| "default"
	| "isHovered"
	| "isFocused"
	| "isPressed"
	| "isSelected"
	| "isDisabled"
	| "isOpen";

export type ConditionalValue<T> = T | Partial<Record<StateCondition, T>>;

// ── Style properties (what you pass to style()) ─────────────
export interface StyleProps {
	// 8-axis visual encoding
	surface?: ConditionalValue<SurfaceToken>;
	material?: ConditionalValue<MaterialToken>;
	depth?: ConditionalValue<DepthToken>;
	bevel?: ConditionalValue<BevelToken>;
	glow?: ConditionalValue<GlowToken>;
	frame?: ConditionalValue<FrameToken>;
	motion?: ConditionalValue<MotionToken>;
	transition?: ConditionalValue<TransitionToken>;

	// Colors
	color?: ConditionalValue<ColorToken>;
	backgroundColor?: ConditionalValue<ColorToken>;

	// Spacing
	padding?: ConditionalValue<SpaceToken | number>;
	paddingX?: ConditionalValue<SpaceToken | number>;
	paddingY?: ConditionalValue<SpaceToken | number>;
	margin?: ConditionalValue<SpaceToken | number>;
	marginX?: ConditionalValue<SpaceToken | number>;
	marginY?: ConditionalValue<SpaceToken | number>;
	gap?: ConditionalValue<SpaceToken | number>;

	// Sizing
	width?: ConditionalValue<string | number>;
	height?: ConditionalValue<string | number>;
	minWidth?: ConditionalValue<string | number>;
	minHeight?: ConditionalValue<string | number>;
	maxWidth?: ConditionalValue<string | number>;
	maxHeight?: ConditionalValue<string | number>;

	// Border
	borderRadius?: ConditionalValue<RadiusToken>;

	// Typography
	fontSize?: ConditionalValue<FontSizeToken>;
	fontWeight?: ConditionalValue<FontWeightToken>;

	// Layout
	display?: ConditionalValue<"block" | "flex" | "grid" | "inline-flex" | "inline" | "none">;
	alignItems?: ConditionalValue<"start" | "center" | "end" | "stretch" | "baseline">;
	justifyContent?: ConditionalValue<"start" | "center" | "end" | "between" | "around" | "evenly">;
	flexDirection?: ConditionalValue<"row" | "column" | "row-reverse" | "column-reverse">;
	position?: ConditionalValue<"relative" | "absolute" | "fixed" | "sticky" | "static">;
	overflow?: ConditionalValue<"hidden" | "auto" | "scroll" | "visible">;
	opacity?: ConditionalValue<number>;
}
