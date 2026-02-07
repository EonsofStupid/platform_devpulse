/**
 * @file Recipe Utilities
 * @description Shared helpers for recipe class computation.
 */

import type {
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
	1: "shadow-z1",
	2: "shadow-z2",
	3: "shadow-z3",
	4: "shadow-z4",
};

const SIZE_MAP: Record<SizeToken, string> = {
	sm: "text-sm",
	md: "text-base",
	lg: "text-lg",
};

const GLOW_MAP: Record<GlowToken, string> = {
	off: "",
	teal: "shadow-glow-teal",
	purple: "shadow-glow-purple",
	magenta: "shadow-glow-magenta",
	ember: "shadow-glow-ember",
	frost: "shadow-glow-frost",
	cyber: "shadow-glow-cyber",
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

export function surfaceClass(
	surface: SurfaceToken,
	variant: GlassVariantToken | "dark" | "medium" | "light",
): string {
	if (surface === "glass") {
		return `bg-glass-${variant}`;
	}
	if (surface === "matte") {
		return `bg-matte-${variant}`;
	}
	return "";
}
