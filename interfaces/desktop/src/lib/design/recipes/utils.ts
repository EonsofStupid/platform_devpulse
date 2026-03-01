/**
 * @file Recipe Utilities — Encoding-Based Emitters
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Registry-driven emitters. Every class name comes from TOKEN_CATEGORY_REGISTRY.
 * No legacy. No bridge. No backward compat.
 *
 * emitSegments() — individual v-{code}{index} classes (sparse, skips defaults)
 * emitEncoding() — compact v-s3z1d2b1g0f1m0t2 string (dense, all categories)
 * emitCategory() — single v-{code}{index} for one category
 * radiusClass()  — Tailwind rounded-* (radius is not part of encoding)
 */

import {
	TOKEN_CATEGORY_REGISTRY,
	type Preset,
} from "$lib/design/registry/token-categories.js";
import type { RadiusToken } from "$lib/design/tokens/types.js";

// =============================================================================
// Encoding Emitters — Registry-Driven
// =============================================================================

/**
 * Emit individual v-{code}{index} classes for each non-default category.
 * Skips categories at their default index to keep output minimal.
 *
 * @example emitSegments({ s: 1, d: 2, t: 2 }) → "v-s1 v-d2 v-t2"
 */
export function emitSegments(preset: Partial<Preset>): string {
	const parts: string[] = [];
	for (const cat of TOKEN_CATEGORY_REGISTRY) {
		const code = cat.code as keyof Preset;
		const val = preset[code];
		if (val !== undefined && val !== cat.defaultIndex) {
			parts.push(`v-${cat.code}${val}`);
		}
	}
	return parts.join(" ");
}

/**
 * Emit a compact encoding string with ALL categories.
 *
 * @example emitEncoding({ s: 3, z: 1, d: 2, b: 1, g: 0, f: 1, m: 0, t: 2 })
 *          → "v-s3z1d2b1g0f1m0t2"
 */
export function emitEncoding(preset: Partial<Preset>): string {
	const pairs = TOKEN_CATEGORY_REGISTRY.map((cat) => {
		const code = cat.code as keyof Preset;
		const val = preset[code] ?? cat.defaultIndex;
		return `${cat.code}${val}`;
	});
	return `v-${pairs.join("")}`;
}

/**
 * Emit a single v-{code}{index} class for one category.
 *
 * @example emitCategory("s", 3) → "v-s3"
 * @example emitCategory("d", 0) → "v-d0"
 */
export function emitCategory(code: string, index: number): string {
	return `v-${code}${index}`;
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
