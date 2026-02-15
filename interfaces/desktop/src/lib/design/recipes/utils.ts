/**
 * @file Recipe Utilities
 * @description Shared helpers for recipe class computation.
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

const RADIUS_MAP: Record<RadiusToken, string> = {
	none: "rounded-none",
	sm: "rounded-sm",
	md: "rounded-md",
	lg: "rounded-lg",
	xl: "rounded-xl",
	full: "rounded-full",
};

const DEPTH_MAP: Record<DepthToken, string> = {
	0: "",
	1: "depth-float",
	2: "depth-raised",
	3: "depth-elevated",
	4: "depth-lifted",
};

const SIZE_MAP: Record<SizeToken, string> = {
	sm: "text-sm",
	md: "text-base",
	lg: "text-lg",
};

const GLOW_MAP: Record<GlowToken, string> = {
	off: "",
	teal: "glow-teal",
	purple: "glow-purple",
	magenta: "glow-magenta",
	ember: "glow-ember",
	frost: "glow-frost",
	cyber: "glow-cyber",
};

const BEVEL_MAP: Record<BevelToken, string> = {
	off: "",
	subtle: "bevel-subtle",
	soft: "bevel-soft",
	medium: "bevel-medium",
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
	if (surface === "glass") {
		return `glass-${variant}`;
	}
	if (surface === "matte") {
		return `bg-[var(--matte-${variant})]`;
	}
	return "";
}
