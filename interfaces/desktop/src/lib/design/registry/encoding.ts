/**
 * @file Encoding utilities — encode/decode/resolve presets
 * @module @devpulse/coldlight/registry/encoding
 * @layer registry
 *
 * Converts between Preset objects and v-encoding strings.
 * All functions derive behavior from TOKEN_CATEGORY_REGISTRY.
 */

import {
	TOKEN_CATEGORY_REGISTRY,
	CODE_MAP,
	ENCODING_ORDER,
	type Preset,
} from "./token-categories.js";

/** Preset object → canonical encoding string */
export function encodePreset(preset: Partial<Preset>): string {
	const parts = ENCODING_ORDER.map((code) => {
		const val = preset[code as keyof Preset] ?? CODE_MAP[code].defaultIndex;
		return val === CODE_MAP[code].defaultIndex ? null : `${code}${val}`;
	}).filter(Boolean);

	return `v-${parts.length ? parts.join("") : "s0"}`;
}

/** Encoding string → preset object (all defaults filled) */
export function decodeEncoding(encoding: string): Preset {
	const result: Record<string, number> = {};

	for (const cat of TOKEN_CATEGORY_REGISTRY) {
		result[cat.code] = cat.defaultIndex;
	}

	const pairs = encoding.slice(2).match(/[a-z]{1,2}\d+/g) ?? [];
	for (const pair of pairs) {
		const match = pair.match(/^([a-z]{1,2})(\d+)$/);
		if (match) {
			const [, code, numStr] = match;
			if (CODE_MAP[code]) {
				result[code] = parseInt(numStr, 10);
			}
		}
	}

	return result as Preset;
}

/** Preset → resolved token references per category (what SD5/CSS generator consumes) */
export function resolvePreset(
	preset: Preset,
): Record<string, Record<string, string>> {
	const resolved: Record<string, Record<string, string>> = {};

	for (const cat of TOKEN_CATEGORY_REGISTRY) {
		const value = cat.values[preset[cat.code as keyof Preset] ?? cat.defaultIndex];
		if (value && Object.keys(value.tokenRefs).length > 0) {
			resolved[cat.code] = { ...value.tokenRefs } as Record<
				string,
				string
			>;
		}
	}

	return resolved;
}

/** Emit a full encoding class string from partial preset values */
export function emitEncoding(props: Partial<Preset>): string {
	return encodePreset(props);
}

/** Emit individual segment classes (composable overrides) */
export function emitSegments(props: Partial<Preset>): string {
	const segments: string[] = [];

	for (const code of ENCODING_ORDER) {
		const val = props[code as keyof Preset];
		if (val !== undefined && val !== CODE_MAP[code].defaultIndex) {
			segments.push(`v-${code}${val}`);
		}
	}

	return segments.join(" ");
}
