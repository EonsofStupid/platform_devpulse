/**
 * @file Recipe Utilities — Exhaustive Token Maps
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Shared helpers for recipe class computation.
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
 * Recipes that need per-slot sizing (combobox, input) should use
 * their own SIZE_SCALE instead — this is for simple components.
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
 *
 * - glass: maps to @utility glass-{variant} in molecules/glass.css
 * - matte: maps to CSS var reference bg-[var(--matte-{variant})]
 * - solid: maps to CSS var reference bg-[var(--surface-{variant})]
 *
 * Matte variants accept "dark" | "medium" | "light" (from matte tokens).
 */
const SURFACE_HANDLERS: Record<SurfaceToken, (variant: string) => string> = {
	glass: (variant) => `glass-${variant}`,
	matte: (variant) => `bg-[var(--matte-${variant})]`,
	solid: (variant) => `bg-[var(--surface-${variant})]`,
};

export function radiusClass(radius: RadiusToken): string {
	return RADIUS_MAP[radius];
}

export function depthClass(depth: DepthToken): string {
	return DEPTH_MAP[depth];
}

export function sizeClass(size: SizeToken): string {
	return SIZE_MAP[size];
}

export function glowClass(glow: GlowToken): string {
	return GLOW_MAP[glow];
}

export function bevelClass(bevel: BevelToken): string {
	return BEVEL_MAP[bevel];
}

export function surfaceClass(
	surface: SurfaceToken,
	variant: GlassVariantToken | "dark" | "medium" | "light",
): string {
	const handler = SURFACE_HANDLERS[surface];
	return handler ? handler(variant) : "";
}
