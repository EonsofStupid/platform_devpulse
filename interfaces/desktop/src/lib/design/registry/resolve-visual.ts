/**
 * @file resolveVisual() — Universal Prop Resolution Pipeline
 * @module @devpulse/coldlight/registry/resolve-visual
 * @layer registry
 *
 * THE ONE function that takes ANY input (props, preset name, encoding string)
 * and produces resolved CSS class strings. Every component calls this.
 * VPB manipulates this. This IS the DsAdapter resolution engine.
 *
 * Resolution order: kind defaults → preset → individual props → encoding override
 */

import { z } from "zod";

import {
	TOKEN_CATEGORY_REGISTRY,
	CODE_MAP,
	CODE_TO_NAME,
	NAME_TO_CODE,
	PresetSchema,
	EncodingStringSchema,
	resolveToIndices,
	resolveToPreset,
	type Preset,
	type EncodingIndices,
	type SurfaceId,
	type MaterialId,
	type DepthId,
	type BevelId,
	type GlowId,
	type FrameId,
	type MotionId,
	type TransitionId,
} from "./token-categories.js";

import type { RadiusToken, SizeToken } from "$lib/design/tokens/types.js";

// ═══════════════════════════════════════════════════════════════
// PUBLIC TYPES
// ═══════════════════════════════════════════════════════════════

/** Input — pick any combination, mix freely. */
export interface ColdLightProps {
	/** Named preset: "panel-glass", "btn-primary" */
	preset?: string;
	/** Surface treatment */
	surface?: SurfaceId;
	/** Material physics */
	material?: MaterialId;
	/** Depth / elevation */
	depth?: DepthId;
	/** Bevel edge treatment */
	bevel?: BevelId;
	/** Glow emission color */
	glow?: GlowId;
	/** Frame / border treatment */
	frame?: FrameId;
	/** Ambient motion / animation */
	motion?: MotionId;
	/** Transition timing for interactive states */
	transition?: TransitionId;
	/** Encoding override string: "v-s1z2d3" */
	encoding?: string;
	/** Border radius — not part of encoding, applied directly */
	radius?: RadiusToken;
	/** Size variant — structural, not part of encoding */
	size?: SizeToken;
}

/** Output — everything needed to render a ColdLight component. */
export interface ResolvedVisual {
	/** Numeric indices per category: { s: 1, z: 0, d: 2, ... } */
	values: EncodingIndices;
	/** Semantic preset: { surface: "glass-void", depth: "z2", ... } */
	preset: Preset;
	/** Dense encoding string: "v-s1d2" (sparse, only non-defaults) */
	encoding: string;
	/** Space-separated v-segments for Tailwind: "v-s1 v-d2" */
	segments: string;
	/** Tailwind radius class: "rounded-lg" */
	radius: string;
	/** Size token passthrough */
	size: SizeToken;
	/** Resolved CSS tokenRefs per category (for inline styles / VPB display) */
	cssProperties: Record<string, string>;
	/** Preset ID that was applied, if any — drives data-variant attribute */
	variant: string | undefined;
	/** SVG filter IDs from resolved categories: ["bevel-soft", "noise-subtle"] */
	svgFilters: string[];
	/** Tailwind filter utility classes: "filter-bevel-soft filter-noise-subtle" */
	svgFilterClasses: string;
}

// ═══════════════════════════════════════════════════════════════
// ZOD SCHEMA FOR BOUNDARY VALIDATION
// ═══════════════════════════════════════════════════════════════

export const ColdLightPropsSchema = z.object({
	preset: z.string().optional(),
	surface: z.string().optional(),
	material: z.string().optional(),
	depth: z.string().optional(),
	bevel: z.string().optional(),
	glow: z.string().optional(),
	frame: z.string().optional(),
	motion: z.string().optional(),
	transition: z.string().optional(),
	encoding: EncodingStringSchema.optional(),
	radius: z.string().optional(),
	size: z.string().optional(),
}).passthrough();

// ═══════════════════════════════════════════════════════════════
// RADIUS MAP — Tailwind classes (not part of encoding)
// ═══════════════════════════════════════════════════════════════

const RADIUS_MAP: Record<string, string> = {
	none: "rounded-none",
	xs: "rounded-xs",
	sm: "rounded-sm",
	md: "rounded-md",
	lg: "rounded-lg",
	xl: "rounded-xl",
	full: "rounded-full",
};

// ═══════════════════════════════════════════════════════════════
// PRESET REGISTRY LOOKUP (imported lazily to avoid circular deps)
// ═══════════════════════════════════════════════════════════════

let _getPreset: ((id: string) => Partial<Preset> | undefined) | null = null;

/**
 * Register the preset lookup function. Called once by presets.ts on module load.
 * Avoids circular dependency between resolve-visual.ts and presets.ts.
 */
export function registerPresetLookup(
	fn: (id: string) => Partial<Preset> | undefined,
): void {
	_getPreset = fn;
}

// ═══════════════════════════════════════════════════════════════
// ENCODING STRING PARSER
// ═══════════════════════════════════════════════════════════════

function parseEncoding(encoding: string): Partial<Record<string, number>> {
	const indices: Partial<Record<string, number>> = {};
	const raw = encoding.startsWith("v-") ? encoding.slice(2) : encoding;
	const pairs = raw.match(/[a-z]{1,2}\d+/g) ?? [];
	for (const pair of pairs) {
		const match = pair.match(/^([a-z]{1,2})(\d+)$/);
		if (match) {
			const [, code, numStr] = match;
			if (CODE_MAP[code]) {
				indices[code] = parseInt(numStr, 10);
			}
		}
	}
	return indices;
}

// ═══════════════════════════════════════════════════════════════
// resolveVisual() — THE RESOLUTION PIPELINE
// ═══════════════════════════════════════════════════════════════

/**
 * Resolve ANY combination of ColdLight inputs into a fully resolved visual.
 *
 * Resolution order (later wins):
 * 1. All-defaults (index 0 per category)
 * 2. Named preset lookup (if `preset` is provided)
 * 3. Individual semantic props (surface, depth, glow, etc.)
 * 4. Encoding string override (if `encoding` is provided)
 *
 * @example
 * resolveVisual({ preset: "panel-glass", glow: "teal" })
 * resolveVisual({ surface: "glass-deep", depth: "z2", bevel: "subtle" })
 * resolveVisual({ encoding: "v-s1d2g1" })
 */
export function resolveVisual(
	input: ColdLightProps,
	kindDefaults?: Partial<Preset>,
): ResolvedVisual {
	// Start with category defaults (all index 0)
	const merged: Partial<Preset> = {};

	// Layer 1: Kind defaults (e.g., Button defaults to btn-primary preset values)
	if (kindDefaults) {
		Object.assign(merged, kindDefaults);
	}

	// Layer 2: Named preset lookup
	if (input.preset && _getPreset) {
		const presetValues = _getPreset(input.preset);
		if (presetValues) {
			for (const [key, val] of Object.entries(presetValues)) {
				if (val !== undefined) {
					(merged as Record<string, unknown>)[key] = val;
				}
			}
		}
	}

	// Layer 3: Individual semantic props override preset values
	if (input.surface !== undefined) merged.surface = input.surface;
	if (input.material !== undefined) merged.material = input.material;
	if (input.depth !== undefined) merged.depth = input.depth;
	if (input.bevel !== undefined) merged.bevel = input.bevel;
	if (input.glow !== undefined) merged.glow = input.glow;
	if (input.frame !== undefined) merged.frame = input.frame;
	if (input.motion !== undefined) merged.motion = input.motion;
	if (input.transition !== undefined) merged.transition = input.transition;

	// Layer 4: Encoding string override (highest priority for encoded categories)
	if (input.encoding) {
		const encodedIndices = parseEncoding(input.encoding);
		for (const [code, idx] of Object.entries(encodedIndices)) {
			const name = CODE_TO_NAME[code];
			if (name && idx !== undefined) {
				const cat = CODE_MAP[code];
				const value = cat.values[idx];
				if (value) {
					(merged as Record<string, string>)[name] = value.id;
				}
			}
		}
	}

	// Resolve to indices
	const values = resolveToIndices(merged);

	// Resolve back to full preset (fills defaults)
	const preset = resolveToPreset(values);

	// Emit sparse segments (only non-defaults)
	const segmentParts: string[] = [];
	for (const cat of TOKEN_CATEGORY_REGISTRY) {
		const idx = values[cat.code as keyof EncodingIndices];
		if (idx !== cat.defaultIndex) {
			segmentParts.push(`v-${cat.code}${idx}`);
		}
	}
	const segments = segmentParts.join(" ");

	// Emit sparse encoding string
	const encodingParts = segmentParts.map((s) => s.slice(2)); // strip "v-" prefix
	const encoding = encodingParts.length > 0 ? `v-${encodingParts.join("")}` : "";

	// Collect CSS properties from all non-default categories
	const cssProperties: Record<string, string> = {};
	for (const cat of TOKEN_CATEGORY_REGISTRY) {
		const idx = values[cat.code as keyof EncodingIndices];
		const value = cat.values[idx];
		if (value) {
			for (const [prop, val] of Object.entries(value.tokenRefs)) {
				cssProperties[prop] = val;
			}
		}
	}

	// Collect SVG filters from all resolved categories
	const svgFilters: string[] = [];
	for (const cat of TOKEN_CATEGORY_REGISTRY) {
		const idx = values[cat.code as keyof EncodingIndices];
		const value = cat.values[idx];
		if (value?.svgFilters) {
			for (const filterId of value.svgFilters) {
				if (!svgFilters.includes(filterId)) svgFilters.push(filterId);
			}
		}
	}

	// Map filter IDs to Tailwind utility classes (from svg/filters/filters.css)
	const svgFilterClasses = svgFilters
		.map((id) => `filter-${id}`)
		.join(" ");

	// Radius (not part of encoding — applied directly as Tailwind class)
	const radius = RADIUS_MAP[input.radius ?? "md"] ?? RADIUS_MAP.md;

	// Size passthrough
	const size: SizeToken = input.size ?? "md";

	return {
		values,
		preset,
		encoding,
		segments,
		radius,
		size,
		cssProperties,
		variant: input.preset,
		svgFilters,
		svgFilterClasses,
	};
}

/**
 * Convenience: resolve and return ONLY the class string.
 * For components that just need classes, not the full resolved object.
 */
export function resolveClasses(
	input: ColdLightProps,
	kindDefaults?: Partial<Preset>,
): string {
	const resolved = resolveVisual(input, kindDefaults);
	return [resolved.segments, resolved.radius].filter(Boolean).join(" ");
}
