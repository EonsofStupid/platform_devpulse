/**
 * @file Recipe Utilities — Encoding-Based Emitters
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Registry-driven emitters. Every class name comes from TOKEN_CATEGORY_REGISTRY.
 *
 * emitSegments() — individual v-{code}{index} classes (sparse, skips defaults)
 * emitEncoding() — compact v-s3z1d2b1g0f1m0t2 string (dense, all categories)
 * emitCategory() — single v-{code}{index} for one category
 * radiusClass()  — Tailwind rounded-* (radius is not part of encoding)
 *
 * Authors pass semantic IDs: { surface: "glass-void", depth: "z2" }
 * Emitters resolve to CSS: "v-s1 v-d2"
 */

import {
	type EncodingIndices,
	type Preset,
	resolveToIndices,
	TOKEN_CATEGORY_REGISTRY,
} from "$lib/design/registry/token-categories.js";
import type { RadiusToken } from "./types.js";

// =============================================================================
// Encoding Emitters — Registry-Driven
// =============================================================================

/**
 * Emit individual v-{code}{index} classes for each non-default category.
 * Skips categories at their default index to keep output minimal.
 *
 * @example emitSegments({ surface: "glass-void", depth: "z2" }) → "v-s1 v-d2"
 */
export function emitSegments(preset: Partial<Preset>): string {
	const indices = resolveToIndices(preset);
	const parts: string[] = [];
	for (const cat of TOKEN_CATEGORY_REGISTRY) {
		const idx = indices[cat.code as keyof EncodingIndices];
		if (idx !== cat.defaultIndex) {
			parts.push(`v-${cat.code}${idx}`);
		}
	}
	return parts.join(" ");
}

/**
 * Emit a compact encoding string with ALL categories.
 *
 * @example emitEncoding({ surface: "glass-void", depth: "z2", glow: "teal" })
 *          → "v-s1z0d2b0g1f0m0t0"
 */
export function emitEncoding(preset: Partial<Preset>): string {
	const indices = resolveToIndices(preset);
	const pairs = TOKEN_CATEGORY_REGISTRY.map((cat) => {
		const idx = indices[cat.code as keyof EncodingIndices];
		return `${cat.code}${idx}`;
	});
	return `v-${pairs.join("")}`;
}

/**
 * Emit a single v-{code}{index} class for one category.
 * Accepts either a numeric index or a semantic ID string.
 *
 * @example emitCategory("b", 2) → "v-b2"
 * @example emitCategory("b", "soft") → "v-b2"
 */
export function emitCategory(code: string, value: number | string): string {
	if (typeof value === "string") {
		const cat = TOKEN_CATEGORY_REGISTRY.find((c) => c.code === code);
		if (cat) {
			const idx = cat.values.findIndex((v) => v.id === value);
			if (idx >= 0) return `v-${code}${idx}`;
		}
		return `v-${code}0`;
	}
	return `v-${code}${value}`;
}

// =============================================================================
// Radius — Tailwind (permanent, not part of encoding)
// =============================================================================

const RADIUS_MAP = {
	none: "rounded-none",
	xs: "rounded-xs",
	sm: "rounded-sm",
	md: "rounded-md",
	lg: "rounded-lg",
	xl: "rounded-xl",
	full: "rounded-full",
} satisfies Record<RadiusToken, string>;

export function radiusClass(radius: RadiusToken): string {
	return RADIUS_MAP[radius];
}
