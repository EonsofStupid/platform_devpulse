/**
 * @file ColdLight Token Category Registry — SINGLE SOURCE OF TRUTH
 * @module @devpulse/coldlight/registry
 * @layer registry
 *
 * This file defines EVERY token category, its encoding code, and valid values.
 * Everything else is generated from it: Zod schemas, Prisma references, SD5 CSS,
 * VPB controls, TypeScript types.
 *
 * tokenRefs use CSS-READY values:
 *   - Keys are kebab-case CSS properties (e.g., "backdrop-filter", "box-shadow")
 *   - Values are CSS-ready (e.g., "var(--glass-void)", "blur(var(--blur-md))")
 *   - The generator dumps key:value pairs directly into @utility blocks. No resolver.
 *
 * Adding a new category: add entry here → run pnpm ds:tokens:build → done.
 * NO other code changes needed.
 */

import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// CATEGORY DEFINITION SCHEMA
// ═══════════════════════════════════════════════════════════════

export const CategoryValueSchema = z.object({
	index: z.number().int().nonnegative(),
	id: z.string().regex(/^[a-z][a-z0-9-]*$/),
	label: z.string(),
	/** CSS-ready key:value pairs. Keys = CSS properties. Values = CSS values. */
	tokenRefs: z.record(z.string(), z.string()),
	requiredTokens: z.array(z.string()).optional(),
	svgFilters: z.array(z.string()).optional(),
});

export const CategoryDefinitionSchema = z.object({
	code: z.string().min(1).max(2).regex(/^[a-z]{1,2}$/),
	name: z.string(),
	description: z.string(),
	values: z.array(CategoryValueSchema),
	defaultIndex: z.number().int().nonnegative().default(0),
	encodingOrder: z.number().int(),
	vpbControl: z.enum([
		"slider",
		"select",
		"toggle",
		"color-picker",
		"curve-editor",
	]),
});

export type CategoryValue = z.infer<typeof CategoryValueSchema>;
export type CategoryDefinition = z.infer<typeof CategoryDefinitionSchema>;

// ═══════════════════════════════════════════════════════════════
// THE REGISTRY — SINGLE SOURCE OF TRUTH
//
// tokenRefs keys = real CSS properties (kebab-case)
// tokenRefs values = real CSS values (var() references)
// ═══════════════════════════════════════════════════════════════

export const TOKEN_CATEGORY_REGISTRY: CategoryDefinition[] = [
	// ── s: Surface ────────────────────────────────────────────
	{
		code: "s",
		name: "Surface",
		description:
			"Full surface treatment: fill, backdrop-filter, opacity. Glass types include blur.",
		encodingOrder: 0,
		defaultIndex: 0,
		vpbControl: "select",
		values: [
			{
				index: 0,
				id: "transparent",
				label: "Transparent",
				tokenRefs: { background: "transparent" },
			},
			{
				index: 1,
				id: "glass-void",
				label: "Glass Void",
				tokenRefs: {
					background: "var(--glass-void)",
					"backdrop-filter":
						"blur(var(--blur-md)) saturate(1.5)",
					border: "1px solid oklch(from var(--color-teal-700) l c h / 0.22)",
				},
				requiredTokens: ["glass.void", "blur.md"],
			},
			{
				index: 2,
				id: "glass-deep",
				label: "Glass Deep",
				tokenRefs: {
					background: "var(--glass-deep)",
					"backdrop-filter":
						"blur(var(--blur-lg)) saturate(1.3)",
					border: "1px solid oklch(from var(--color-teal-600) l c h / 0.18)",
				},
				requiredTokens: ["glass.deep", "blur.lg"],
			},
			{
				index: 3,
				id: "glass-smoke",
				label: "Glass Smoke",
				tokenRefs: {
					background: "var(--glass-smoke)",
					"backdrop-filter":
						"blur(var(--blur-xl)) saturate(1.2)",
				},
				requiredTokens: ["glass.smoke", "blur.xl"],
			},
			{
				index: 4,
				id: "glass-frost",
				label: "Glass Frost",
				tokenRefs: {
					background: "var(--glass-frost)",
					"backdrop-filter":
						"blur(var(--blur-2xl)) saturate(1.1)",
					border: "1px solid oklch(1 0 0 / 0.12)",
				},
				requiredTokens: ["glass.frost", "blur.2xl"],
			},
			{
				index: 5,
				id: "matte-dark",
				label: "Matte Dark",
				tokenRefs: {
					background: "var(--matte-dark)",
				},
				requiredTokens: ["matte.dark"],
			},
			{
				index: 6,
				id: "solid-teal",
				label: "Solid Teal",
				tokenRefs: {
					background: "var(--color-teal-500)",
				},
				requiredTokens: ["color.teal.500"],
			},
			{
				index: 7,
				id: "void-gradient",
				label: "Void Gradient",
				tokenRefs: {
					background:
						"linear-gradient(135deg, var(--color-void-900), var(--color-void-base))",
				},
				requiredTokens: ["color.void.900", "color.void.base"],
			},
		],
	},

	// ── z: Material ───────────────────────────────────────────
	{
		code: "z",
		name: "Material",
		description:
			"Material physics. Modifies HOW a surface renders: opacity, filter effects, border treatment.",
		encodingOrder: 1,
		defaultIndex: 0,
		vpbControl: "select",
		values: [
			{
				index: 0,
				id: "none",
				label: "None",
				tokenRefs: {},
			},
			{
				index: 1,
				id: "glass-subtle",
				label: "Glass — Subtle",
				tokenRefs: {
					opacity: "0.85",
					"backdrop-filter": "saturate(1.1)",
				},
			},
			{
				index: 2,
				id: "glass-medium",
				label: "Glass — Medium",
				tokenRefs: {
					opacity: "0.75",
					"backdrop-filter": "saturate(1.2)",
				},
			},
			{
				index: 3,
				id: "glass-intense",
				label: "Glass — Intense",
				tokenRefs: {
					opacity: "0.6",
					"backdrop-filter": "saturate(1.4)",
					border: "1px solid oklch(1 0 0 / 0.15)",
				},
			},
			{
				index: 4,
				id: "glass-ultra",
				label: "Glass — Ultra",
				tokenRefs: {
					opacity: "0.45",
					"backdrop-filter": "saturate(1.6)",
					border: "1px solid oklch(1 0 0 / 0.22)",
				},
			},
			{
				index: 5,
				id: "solid-matte",
				label: "Solid — Matte",
				tokenRefs: {
					opacity: "1",
					filter: "brightness(0.95)",
				},
			},
			{
				index: 6,
				id: "solid-satin",
				label: "Solid — Satin",
				tokenRefs: {
					opacity: "1",
					filter: "brightness(1.05) contrast(1.02)",
				},
			},
			{
				index: 7,
				id: "metal-brushed",
				label: "Metal — Brushed",
				tokenRefs: {
					background:
						"repeating-linear-gradient(90deg, oklch(1 0 0 / 0.02) 0px, transparent 2px)",
					filter: "contrast(1.1)",
				},
				svgFilters: ["noise-subtle"],
			},
			{
				index: 8,
				id: "metal-chrome",
				label: "Metal — Chrome",
				tokenRefs: {
					background:
						"linear-gradient(180deg, oklch(1 0 0 / 0.15), transparent, oklch(1 0 0 / 0.08))",
					filter: "contrast(1.15) brightness(1.1)",
				},
				svgFilters: ["noise-subtle"],
			},
			{
				index: 9,
				id: "metal-copper",
				label: "Metal — Copper",
				tokenRefs: {
					background:
						"linear-gradient(180deg, oklch(from var(--color-ember-300) l c h / 0.12), transparent, oklch(from var(--color-ember-400) l c h / 0.08))",
					filter: "contrast(1.08) saturate(1.2)",
				},
				svgFilters: ["noise-subtle"],
			},
		],
	},

	// ── d: Depth ──────────────────────────────────────────────
	{
		code: "d",
		name: "Depth",
		description:
			"Z-elevation via drop shadows. Layered shadow compositions.",
		encodingOrder: 2,
		defaultIndex: 0,
		vpbControl: "slider",
		values: [
			{
				index: 0,
				id: "flat",
				label: "Flat (no shadow)",
				tokenRefs: { "box-shadow": "none" },
			},
			{
				index: 1,
				id: "z1",
				label: "Z1 — Subtle",
				tokenRefs: { "box-shadow": "var(--shadow-z1)" },
				requiredTokens: ["shadow.z1"],
			},
			{
				index: 2,
				id: "z2",
				label: "Z2 — Elevated",
				tokenRefs: { "box-shadow": "var(--shadow-z2)" },
				requiredTokens: ["shadow.z2"],
			},
			{
				index: 3,
				id: "z3",
				label: "Z3 — Floating",
				tokenRefs: { "box-shadow": "var(--shadow-z3)" },
				requiredTokens: ["shadow.z3"],
			},
			{
				index: 4,
				id: "z4",
				label: "Z4 — Maximum",
				tokenRefs: { "box-shadow": "var(--shadow-z4)" },
				requiredTokens: ["shadow.z4"],
			},
		],
	},

	// ── b: Bevel ──────────────────────────────────────────────
	{
		code: "b",
		name: "Bevel",
		description:
			"Neuromorphic edge treatment. Inset shadows + SVG specular lighting + noise.",
		encodingOrder: 3,
		defaultIndex: 0,
		vpbControl: "slider",
		values: [
			{ index: 0, id: "flat", label: "Flat", tokenRefs: {} },
			{
				index: 1,
				id: "subtle",
				label: "Subtle",
				tokenRefs: {
					"box-shadow":
						"inset 0 1px 0 oklch(1 0 0 / 0.06), inset 0 -1px 0 oklch(0 0 0 / 0.1)",
				},
			},
			{
				index: 2,
				id: "soft",
				label: "Soft",
				tokenRefs: {
					"box-shadow":
						"inset 0 2px 1px oklch(1 0 0 / 0.08), inset 0 -2px 1px oklch(0 0 0 / 0.15)",
				},
				svgFilters: ["bevel-soft"],
			},
			{
				index: 3,
				id: "medium",
				label: "Medium",
				tokenRefs: {
					"box-shadow":
						"inset 0 2px 2px oklch(1 0 0 / 0.1), inset 0 -2px 2px oklch(0 0 0 / 0.2)",
				},
				svgFilters: ["bevel-medium", "noise-subtle"],
			},
			{
				index: 4,
				id: "strong",
				label: "Strong + Filters",
				tokenRefs: {
					"box-shadow":
						"inset 0 3px 3px oklch(1 0 0 / 0.12), inset 0 -3px 3px oklch(0 0 0 / 0.25)",
				},
				svgFilters: ["bevel-strong", "noise-subtle"],
			},
		],
	},

	// ── g: Glow ───────────────────────────────────────────────
	{
		code: "g",
		name: "Glow",
		description:
			"Emission halo. Color + intensity + spread via box-shadow.",
		encodingOrder: 4,
		defaultIndex: 0,
		vpbControl: "select",
		values: [
			{ index: 0, id: "none", label: "None", tokenRefs: {} },
			{
				index: 1,
				id: "teal",
				label: "Teal",
				tokenRefs: {
					"box-shadow": "var(--shadow-glow-teal)",
				},
				requiredTokens: ["glow.teal"],
			},
			{
				index: 2,
				id: "purple",
				label: "Purple",
				tokenRefs: {
					"box-shadow": "var(--shadow-glow-purple)",
				},
				requiredTokens: ["glow.purple"],
			},
			{
				index: 3,
				id: "ember",
				label: "Ember",
				tokenRefs: {
					"box-shadow": "var(--shadow-glow-ember)",
				},
				requiredTokens: ["glow.ember"],
			},
			{
				index: 4,
				id: "magenta",
				label: "Magenta",
				tokenRefs: {
					"box-shadow": "var(--shadow-glow-magenta)",
				},
				requiredTokens: ["glow.magenta"],
			},
			{
				index: 5,
				id: "frost",
				label: "Frost",
				tokenRefs: {
					"box-shadow": "var(--shadow-glow-frost)",
				},
				requiredTokens: ["glow.frost"],
			},
			{
				index: 6,
				id: "cyber",
				label: "Cyber",
				tokenRefs: {
					"box-shadow": "var(--shadow-glow-cyber)",
				},
				requiredTokens: ["glow.cyber"],
			},
		],
	},

	// ── f: Frame ──────────────────────────────────────────────
	{
		code: "f",
		name: "Frame",
		description:
			"Border treatment: mode, width scaling, corner radius, border glow.",
		encodingOrder: 5,
		defaultIndex: 0,
		vpbControl: "select",
		values: [
			{
				index: 0,
				id: "none",
				label: "No Border",
				tokenRefs: { border: "none" },
			},
			{
				index: 1,
				id: "soft",
				label: "Soft",
				tokenRefs: {
					border: "1px solid oklch(1 0 0 / 0.06)",
					"border-radius": "var(--radius-md)",
				},
			},
			{
				index: 2,
				id: "hard",
				label: "Hard",
				tokenRefs: {
					border: "1px solid oklch(1 0 0 / 0.15)",
					"border-radius": "var(--radius-sm)",
				},
			},
			{
				index: 3,
				id: "crisp",
				label: "Crisp",
				tokenRefs: {
					border: "1px solid oklch(1 0 0 / 0.25)",
					"border-radius": "var(--radius-xs)",
				},
			},
			{
				index: 4,
				id: "glow",
				label: "Glow Border",
				tokenRefs: {
					border: "1px solid oklch(from var(--color-teal-500) l c h / 0.4)",
					"border-radius": "var(--radius-md)",
					"box-shadow":
						"0 0 8px oklch(from var(--color-teal-500) l c h / 0.15)",
				},
			},
		],
	},

	// ── m: Motion ─────────────────────────────────────────────
	{
		code: "m",
		name: "Motion",
		description:
			"Ambient/idle animations. NO user interaction trigger. Always playing when visible.",
		encodingOrder: 6,
		defaultIndex: 0,
		vpbControl: "select",
		values: [
			{ index: 0, id: "none", label: "Static", tokenRefs: {} },
			{
				index: 1,
				id: "breathe",
				label: "Breathing Pulse",
				tokenRefs: {
					animation: "var(--animate-breathe)",
				},
			},
			{
				index: 2,
				id: "shimmer",
				label: "Liquid Shimmer",
				tokenRefs: {
					animation: "var(--animate-shimmer)",
				},
			},
			{
				index: 3,
				id: "drift",
				label: "Particle Drift",
				tokenRefs: {
					animation: "var(--animate-drift)",
				},
			},
			{
				index: 4,
				id: "pulse",
				label: "Glow Pulse",
				tokenRefs: {
					animation: "var(--animate-pulse)",
				},
			},
		],
	},

	// ── t: Transition ─────────────────────────────────────────
	{
		code: "t",
		name: "Transition",
		description:
			"User-triggered state changes: hover, focus, click, press. Duration + easing.",
		encodingOrder: 7,
		defaultIndex: 0,
		vpbControl: "select",
		values: [
			{
				index: 0,
				id: "none",
				label: "Instant (0ms)",
				tokenRefs: { transition: "none" },
			},
			{
				index: 1,
				id: "snap",
				label: "Snap (50ms)",
				tokenRefs: {
					transition:
						"all var(--transition-duration-snap) var(--transition-timing-function-out)",
				},
			},
			{
				index: 2,
				id: "fast",
				label: "Fast (150ms)",
				tokenRefs: {
					transition:
						"all var(--transition-duration-fast) var(--transition-timing-function-out)",
				},
			},
			{
				index: 3,
				id: "normal",
				label: "Normal (250ms)",
				tokenRefs: {
					transition:
						"all var(--transition-duration-normal) var(--transition-timing-function-inOut)",
				},
			},
			{
				index: 4,
				id: "smooth",
				label: "Smooth (400ms)",
				tokenRefs: {
					transition:
						"all var(--transition-duration-smooth) var(--transition-timing-function-inOut)",
				},
			},
			{
				index: 5,
				id: "spring",
				label: "Spring",
				tokenRefs: {
					transition:
						"all var(--transition-duration-normal) var(--transition-timing-function-spring)",
				},
			},
			{
				index: 6,
				id: "bounce",
				label: "Bounce",
				tokenRefs: {
					transition:
						"all var(--transition-duration-smooth) var(--transition-timing-function-bounce)",
				},
			},
		],
	},
];

// ═══════════════════════════════════════════════════════════════
// DERIVED: CODE → CATEGORY MAP
// ═══════════════════════════════════════════════════════════════

export const CODE_MAP = Object.fromEntries(
	TOKEN_CATEGORY_REGISTRY.map((cat) => [cat.code, cat]),
) as Record<string, CategoryDefinition>;

export const ENCODING_ORDER = TOKEN_CATEGORY_REGISTRY.sort(
	(a, b) => a.encodingOrder - b.encodingOrder,
).map((cat) => cat.code);

// ═══════════════════════════════════════════════════════════════
// DERIVED: ZOD SCHEMAS
// ═══════════════════════════════════════════════════════════════

export function categoryValueSchema(code: string) {
	const cat = CODE_MAP[code];
	if (!cat) throw new Error(`Unknown category code: ${code}`);
	return z.number().int().min(0).max(cat.values.length - 1);
}

export const EncodingStringSchema = z
	.string()
	.regex(
		/^v-(?:[a-z]{1,2}\d+)+$/,
		"Must be v- followed by one or more {code}{number} pairs",
	)
	.refine((val) => {
		const pairs = val.slice(2).match(/[a-z]{1,2}\d+/g) ?? [];
		return pairs.every((pair) => {
			const match = pair.match(/^([a-z]{1,2})(\d+)$/);
			if (!match) return false;
			const [, code, numStr] = match;
			const num = parseInt(numStr, 10);
			const cat = CODE_MAP[code];
			if (!cat) return false;
			return num >= 0 && num < cat.values.length;
		});
	}, "All category codes must exist in registry and values must be within valid range");

// ═══════════════════════════════════════════════════════════════
// ENCODING INDICES — Internal numeric representation
//
// Used internally by emitters to produce v-s1z0d2 CSS classes.
// NEVER exposed to authors. Authors use PresetSchema (semantic IDs).
// ═══════════════════════════════════════════════════════════════

const _maxIndex = (code: string) =>
	TOKEN_CATEGORY_REGISTRY.find((c) => c.code === code)!.values.length - 1;

/** @internal Numeric index schema — encoding internals only. */
export const EncodingIndicesSchema = z.object({
	s: z.number().int().min(0).max(_maxIndex("s")).default(0),
	z: z.number().int().min(0).max(_maxIndex("z")).default(0),
	d: z.number().int().min(0).max(_maxIndex("d")).default(0),
	b: z.number().int().min(0).max(_maxIndex("b")).default(0),
	g: z.number().int().min(0).max(_maxIndex("g")).default(0),
	f: z.number().int().min(0).max(_maxIndex("f")).default(0),
	m: z.number().int().min(0).max(_maxIndex("m")).default(0),
	t: z.number().int().min(0).max(_maxIndex("t")).default(0),
});

/** @internal Numeric indices — encoding internals only. */
export type EncodingIndices = z.infer<typeof EncodingIndicesSchema>;

// ═══════════════════════════════════════════════════════════════
// PRESET — THE public schema. Semantic IDs per category.
//
// This IS the preset. One schema. One type.
// { surface: "glass-void", depth: "z2", glow: "teal" }
//
// The system resolves IDs → indices → CSS internally.
// Authors never see numbers.
// ═══════════════════════════════════════════════════════════════

/** Extract value IDs from a category as a z.enum-compatible tuple. */
const _ids = (code: string) =>
	TOKEN_CATEGORY_REGISTRY.find((c) => c.code === code)!.values.map(
		(v) => v.id,
	) as [string, ...string[]];

export const SurfaceIdSchema = z.enum(_ids("s"));
export const MaterialIdSchema = z.enum(_ids("z"));
export const DepthIdSchema = z.enum(_ids("d"));
export const BevelIdSchema = z.enum(_ids("b"));
export const GlowIdSchema = z.enum(_ids("g"));
export const FrameIdSchema = z.enum(_ids("f"));
export const MotionIdSchema = z.enum(_ids("m"));
export const TransitionIdSchema = z.enum(_ids("t"));

export type SurfaceId = z.infer<typeof SurfaceIdSchema>;
export type MaterialId = z.infer<typeof MaterialIdSchema>;
export type DepthId = z.infer<typeof DepthIdSchema>;
export type BevelId = z.infer<typeof BevelIdSchema>;
export type GlowId = z.infer<typeof GlowIdSchema>;
export type FrameId = z.infer<typeof FrameIdSchema>;
export type MotionId = z.infer<typeof MotionIdSchema>;
export type TransitionId = z.infer<typeof TransitionIdSchema>;

/**
 * Preset — THE public contract for visual configuration.
 *
 * Authors write: `{ surface: "glass-void", depth: "z2", glow: "teal" }`
 * System resolves to CSS: `v-s1 v-d2 v-g1`
 *
 * Every field validated against registry. Add a value to the registry,
 * the union type auto-updates. One schema. No duplication.
 */
export const PresetSchema = z.object({
	surface: SurfaceIdSchema.default("transparent"),
	material: MaterialIdSchema.default("none"),
	depth: DepthIdSchema.default("flat"),
	bevel: BevelIdSchema.default("flat"),
	glow: GlowIdSchema.default("none"),
	frame: FrameIdSchema.default("none"),
	motion: MotionIdSchema.default("none"),
	transition: TransitionIdSchema.default("none"),
});

export type Preset = z.infer<typeof PresetSchema>;

// ═══════════════════════════════════════════════════════════════
// DERIVED: CODE ↔ NAME MAPS
// ═══════════════════════════════════════════════════════════════

/** Map category code → preset field name: { s: "surface", z: "material", ... } */
export const CODE_TO_NAME: Record<string, keyof Preset> = {
	s: "surface",
	z: "material",
	d: "depth",
	b: "bevel",
	g: "glow",
	f: "frame",
	m: "motion",
	t: "transition",
};

/** Map preset field name → category code: { surface: "s", material: "z", ... } */
export const NAME_TO_CODE: Record<keyof Preset, string> = {
	surface: "s",
	material: "z",
	depth: "d",
	bevel: "b",
	glow: "g",
	frame: "f",
	motion: "m",
	transition: "t",
};

// ═══════════════════════════════════════════════════════════════
// RESOLUTION: Semantic IDs ↔ Numeric Indices
//
// Internal converters. The emitters use these to produce CSS.
// ═══════════════════════════════════════════════════════════════

/** Resolve a semantic preset to numeric encoding indices. */
export function resolveToIndices(preset: Partial<Preset>): EncodingIndices {
	const indices: Record<string, number> = {};
	for (const cat of TOKEN_CATEGORY_REGISTRY) {
		const name = CODE_TO_NAME[cat.code];
		const id = preset[name];
		if (id) {
			const idx = cat.values.findIndex((v) => v.id === id);
			indices[cat.code] = idx >= 0 ? idx : cat.defaultIndex;
		} else {
			indices[cat.code] = cat.defaultIndex;
		}
	}
	return indices as EncodingIndices;
}

/** Resolve numeric encoding indices to a semantic preset. */
export function resolveToPreset(indices: EncodingIndices): Preset {
	const preset: Record<string, string> = {};
	for (const cat of TOKEN_CATEGORY_REGISTRY) {
		const name = CODE_TO_NAME[cat.code];
		const idx = indices[cat.code as keyof EncodingIndices] ?? cat.defaultIndex;
		preset[name] = cat.values[idx]?.id ?? cat.values[cat.defaultIndex].id;
	}
	return preset as Preset;
}
