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
	none: "rounded-dp-none",
	sm: "rounded-dp-sm",
	md: "rounded-dp-md",
	lg: "rounded-dp-lg",
	xl: "rounded-dp-xl",
	full: "rounded-dp-full",
};

const DEPTH_MAP: Record<DepthToken, string> = {
	0: "",
	1: "shadow-dp-z1",
	2: "shadow-dp-z2",
	3: "shadow-dp-z3",
	4: "shadow-dp-z4",
};

const SIZE_MAP: Record<SizeToken, string> = {
	sm: "text-dp-sm",
	md: "text-dp-base",
	lg: "text-dp-lg",
};

const GLOW_MAP: Record<GlowToken, string> = {
	off: "",
	teal: "shadow-dp-glow-teal",
	purple: "shadow-dp-glow-purple",
	magenta: "shadow-dp-glow-magenta",
	ember: "shadow-dp-glow-ember",
	frost: "shadow-dp-glow-frost",
	cyber: "shadow-dp-glow-cyber",
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
