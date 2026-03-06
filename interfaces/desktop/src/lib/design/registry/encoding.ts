/**
 * @file Encoding utilities — encode/decode/resolve presets
 * @module @devpulse/coldlight/registry/encoding
 * @layer registry
 *
 * Converts between semantic Preset objects and v-encoding CSS strings.
 * All functions derive behavior from TOKEN_CATEGORY_REGISTRY.
 *
 * Public API accepts semantic Preset (surface: "glass-void").
 * Internally resolves to numeric indices for CSS class emission.
 */

import {
	TOKEN_CATEGORY_REGISTRY,
	CODE_MAP,
	ENCODING_ORDER,
	CODE_TO_NAME,
	NAME_TO_CODE,
	resolveToIndices,
	resolveToPreset,
	type Preset,
	type EncodingIndices,
} from "./token-categories.js";

/** Semantic preset → canonical encoding string (sparse, skips defaults) */
export function encodePreset(preset: Partial<Preset>): string {
	const indices = resolveToIndices(preset);
	const parts = ENCODING_ORDER.map((code) => {
		const idx = indices[code as keyof EncodingIndices];
		return idx === CODE_MAP[code].defaultIndex ? null : `${code}${idx}`;
	}).filter(Boolean);

	return `v-${parts.length ? parts.join("") : "s0"}`;
}

/** Encoding string → semantic preset object (all defaults filled) */
export function decodeEncoding(encoding: string): Preset {
	const indices: Record<string, number> = {};

	for (const cat of TOKEN_CATEGORY_REGISTRY) {
		indices[cat.code] = cat.defaultIndex;
	}

	const pairs = encoding.slice(2).match(/[a-z]{1,2}\d+/g) ?? [];
	for (const pair of pairs) {
		const match = pair.match(/^([a-z]{1,2})(\d+)$/);
		if (match) {
			const [, code, numStr] = match;
			if (CODE_MAP[code]) {
				indices[code] = parseInt(numStr, 10);
			}
		}
	}

	return resolveToPreset(indices as unknown as EncodingIndices);
}

/** Semantic preset → resolved token references per category (SD5/CSS generator) */
export function resolvePreset(
	preset: Preset,
): Record<string, Record<string, string>> {
	const indices = resolveToIndices(preset);
	const resolved: Record<string, Record<string, string>> = {};

	for (const cat of TOKEN_CATEGORY_REGISTRY) {
		const value = cat.values[indices[cat.code as keyof EncodingIndices] ?? cat.defaultIndex];
		if (value && Object.keys(value.tokenRefs).length > 0) {
			resolved[cat.code] = { ...value.tokenRefs } as Record<
				string,
				string
			>;
		}
	}

	return resolved;
}

/** Emit a full encoding class string from semantic preset */
export function emitEncoding(props: Partial<Preset>): string {
	return encodePreset(props);
}

/** Emit individual v-{code}{index} segment classes (composable overrides) */
export function emitSegments(props: Partial<Preset>): string {
	const indices = resolveToIndices(props);
	const segments: string[] = [];

	for (const code of ENCODING_ORDER) {
		const idx = indices[code as keyof EncodingIndices];
		if (idx !== CODE_MAP[code].defaultIndex) {
			segments.push(`v-${code}${idx}`);
		}
	}

	return segments.join(" ");
}
