/**
 * @file Recipe Utilities — Exhaustive Token Maps + Shortcode Emitters
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Two API surfaces:
 *
 * 1. **Shortcode emitters** (preferred) — emit shortcode class names
 *    from CLASS_COMPOSITION.md: v-*, s-*, e-*, sz-*.
 *    These map directly to @utility definitions in shortcodes/*.css.
 *
 * 2. **Molecule emitters** (legacy) — emit molecule class names
 *    (glass-void, depth-raised, glow-teal, etc.).
 *    @deprecated — use shortcode emitters for new recipes.
 *
 * Every map uses `satisfies Record<TokenType, string>` to ensure
 * exhaustive coverage against the auto-generated token enums.
 * If SD5 adds a new token value, TypeScript will error here.
 */

import type {
	BevelToken,
	DepthToken,
	GlassVariantToken,
	GlowToken,
	RadiusToken,
	SizeToken,
	SurfaceToken,
} from "$lib/design/tokens/types.js";

// =============================================================================
// Shortcode Emitters — CLASS_COMPOSITION.md system
// =============================================================================

/**
 * Variant → v-* shortcode class.
 * Maps to @utility v-* in shortcodes/shortcodes.css.
 * Sets --recipe-blur, --recipe-saturation, --recipe-bg-alpha,
 * --recipe-glow-color, --recipe-border-alpha, --recipe-accent.
 */
const VARIANT_SHORTCODE_MAP = {
	void: "v-void",
	deep: "v-deep",
	smoke: "v-smoke",
	frost: "v-frost",
} satisfies Record<GlassVariantToken, string>;

export function variantShortcode(variant: GlassVariantToken): string {
	return VARIANT_SHORTCODE_MAP[variant];
}

/**
 * Surface → s-* shortcode class.
 * Maps to @utility s-* in shortcodes/shortcodes.css.
 * Reads --recipe-* vars set by v-* classes.
 */
const SURFACE_SHORTCODE_MAP = {
	glass: "s-glass",
	solid: "s-solid",
	matte: "s-solid",
} satisfies Record<SurfaceToken, string>;

export function surfaceShortcode(surface: SurfaceToken): string {
	return SURFACE_SHORTCODE_MAP[surface];
}

/**
 * Depth → e-* shortcode class.
 * Maps to @utility e-* in shortcodes/shortcodes.css.
 * Sets --_shadow-depth (same var as molecule depth-* utilities).
 */
const ELEVATION_SHORTCODE_MAP = {
	0: "e-0",
	1: "e-1",
	2: "e-2",
	3: "e-3",
	4: "e-4",
} satisfies Record<DepthToken, string>;

export function elevationShortcode(depth: DepthToken): string {
	return ELEVATION_SHORTCODE_MAP[depth];
}

/**
 * Size → sz-* shortcode class.
 * Maps to @utility sz-* in shortcodes/shortcodes.css.
 * Sets --recipe-font-size, --recipe-padding-x/y, --recipe-gap,
 * --recipe-min-h, --recipe-icon-size.
 */
const SIZE_SHORTCODE_MAP = {
	sm: "sz-sm",
	md: "sz-md",
	lg: "sz-lg",
} satisfies Record<SizeToken, string>;

export function sizeShortcode(size: SizeToken): string {
	return SIZE_SHORTCODE_MAP[size];
}

// =============================================================================
// Molecule Emitters — Legacy (use shortcode emitters for new recipes)
// =============================================================================

/**
 * Radius → Tailwind rounded utility.
 * Maps to @theme --radius-* tokens in tailwind.css.
 */
const RADIUS_MAP = {
	none: "rounded-none",
	sm: "rounded-sm",
	md: "rounded-md",
	lg: "rounded-lg",
	xl: "rounded-xl",
	full: "rounded-full",
} satisfies Record<RadiusToken, string>;

/**
 * Depth → molecule utility class.
 * Maps to @utility depth-* in molecules/depth.css.
 * @deprecated Use elevationShortcode() for new recipes.
 */
const DEPTH_MAP = {
	0: "",
	1: "depth-float",
	2: "depth-raised",
	3: "depth-elevated",
	4: "depth-lifted",
} satisfies Record<DepthToken, string>;

/**
 * Size → base text size utility.
 * Maps to @theme --font-size-* in tailwind.css.
 * @deprecated Use sizeShortcode() for new recipes.
 */
const SIZE_MAP = {
	sm: "text-sm",
	md: "text-base",
	lg: "text-lg",
} satisfies Record<SizeToken, string>;

/**
 * Glow → molecule utility class.
 * Maps to @utility glow-* in molecules/glow.css.
 */
const GLOW_MAP = {
	off: "",
	teal: "glow-teal",
	purple: "glow-purple",
	magenta: "glow-magenta",
	ember: "glow-ember",
	frost: "glow-frost",
	cyber: "glow-cyber",
} satisfies Record<GlowToken, string>;

/**
 * Bevel → molecule utility class.
 * Maps to @utility bevel-* in molecules/bevel.css.
 */
const BEVEL_MAP = {
	off: "",
	subtle: "bevel-subtle",
	soft: "bevel-soft",
	medium: "bevel-medium",
} satisfies Record<BevelToken, string>;

/**
 * Surface + variant → molecule/background utility.
 * @deprecated Use surfaceShortcode() + variantShortcode() for new recipes.
 */
const SURFACE_HANDLERS: Record<SurfaceToken, (variant: string) => string> = {
	glass: (variant) => `glass-${variant}`,
	matte: (variant) => `bg-[var(--matte-${variant})]`,
	solid: (variant) => `bg-[var(--surface-${variant})]`,
};

export function radiusClass(radius: RadiusToken): string {
	return RADIUS_MAP[radius];
}

/** @deprecated Use elevationShortcode() */
export function depthClass(depth: DepthToken): string {
	return DEPTH_MAP[depth];
}

/** @deprecated Use sizeShortcode() */
export function sizeClass(size: SizeToken): string {
	return SIZE_MAP[size];
}

export function glowClass(glow: GlowToken): string {
	return GLOW_MAP[glow];
}

export function bevelClass(bevel: BevelToken): string {
	return BEVEL_MAP[bevel];
}

/** @deprecated Use surfaceShortcode() + variantShortcode() */
export function surfaceClass(
	surface: SurfaceToken,
	variant: GlassVariantToken | "dark" | "medium" | "light",
): string {
	const handler = SURFACE_HANDLERS[surface];
	return handler ? handler(variant) : "";
}
