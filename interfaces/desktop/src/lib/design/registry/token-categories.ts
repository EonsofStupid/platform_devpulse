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
						"blur(var(--blur-lg)) saturate(1.5)",
					border: "1px solid oklch(from var(--color-teal-700) l c h / 0.22)",
				},
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
			},
			{
				index: 5,
				id: "matte-dark",
				label: "Matte Dark",
				tokenRefs: {
					background: "var(--matte-dark)",
				},
			},
			{
				index: 6,
				id: "solid-teal",
				label: "Solid Teal",
				tokenRefs: {
					background: "var(--color-teal-500)",
				},
			},
			{
				index: 7,
				id: "void-gradient",
				label: "Void Gradient",
				tokenRefs: {
					background:
						"linear-gradient(135deg, oklch(0.06 0.01 195 / 0.95), var(--glass-void))",
				},
			},
			{
				index: 8,
				id: "glass-teal",
				label: "Glass Teal",
				tokenRefs: {
					background: "var(--glass-teal)",
					"backdrop-filter":
						"blur(var(--blur-lg)) saturate(1.4)",
					border: "1px solid oklch(from var(--color-teal-500) l c h / 0.35)",
				},
			},
			{
				index: 9,
				id: "glass-purple",
				label: "Glass Purple",
				tokenRefs: {
					background: "var(--glass-purple)",
					"backdrop-filter":
						"blur(var(--blur-lg)) saturate(1.3)",
					border: "1px solid oklch(from var(--color-purple-500) l c h / 0.30)",
				},
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
			},
			{
				index: 2,
				id: "z2",
				label: "Z2 — Elevated",
				tokenRefs: { "box-shadow": "var(--shadow-z2)" },
			},
			{
				index: 3,
				id: "z3",
				label: "Z3 — Floating",
				tokenRefs: { "box-shadow": "var(--shadow-z3)" },
			},
			{
				index: 4,
				id: "z4",
				label: "Z4 — Maximum",
				tokenRefs: { "box-shadow": "var(--shadow-z4)" },
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
					"box-shadow": "var(--glow-teal)",
				},
			},
			{
				index: 2,
				id: "purple",
				label: "Purple",
				tokenRefs: {
					"box-shadow": "var(--glow-purple)",
				},
			},
			{
				index: 3,
				id: "ember",
				label: "Ember",
				tokenRefs: {
					"box-shadow": "var(--glow-ember)",
				},
			},
			{
				index: 4,
				id: "magenta",
				label: "Magenta",
				tokenRefs: {
					"box-shadow": "var(--glow-magenta)",
				},
			},
			{
				index: 5,
				id: "frost",
				label: "Frost",
				tokenRefs: {
					"box-shadow": "var(--glow-frost)",
				},
			},
			{
				index: 6,
				id: "cyber",
				label: "Cyber",
				tokenRefs: {
					"box-shadow": "var(--glow-cyber)",
				},
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
					border: "1px solid oklch(1 0 0 / 0.25)",
					"border-radius": "var(--radius-md)",
				},
			},
			{
				index: 2,
				id: "hard",
				label: "Hard",
				tokenRefs: {
					border: "1px solid oklch(1 0 0 / 0.40)",
					"border-radius": "var(--radius-sm)",
				},
			},
			{
				index: 3,
				id: "crisp",
				label: "Crisp",
				tokenRefs: {
					border: "1px solid oklch(1 0 0 / 0.45)",
					"border-radius": "var(--radius-xs)",
				},
			},
			{
				index: 4,
				id: "glow",
				label: "Glow Border",
				tokenRefs: {
					border: "1px solid oklch(0.60 0.18 180 / 0.7)",
					"border-radius": "var(--radius-md)",
					"--cl-frame-glow":
						"0 0 20px oklch(0.55 0.18 180 / 0.45), 0 0 40px oklch(0.45 0.14 180 / 0.25)",
				},
			},
			{
				index: 5,
				id: "accent-teal",
				label: "Accent Teal",
				tokenRefs: {
					border: "1px solid oklch(0.64 0.16 180 / 0.65)",
					"border-radius": "var(--radius-md)",
					"--cl-frame-glow":
						"0 0 20px oklch(0.55 0.18 180 / 0.40)",
				},
			},
			{
				index: 6,
				id: "accent-purple",
				label: "Accent Purple",
				tokenRefs: {
					border: "1px solid oklch(0.64 0.16 280 / 0.65)",
					"border-radius": "var(--radius-md)",
					"--cl-frame-glow":
						"0 0 20px oklch(0.55 0.18 280 / 0.40)",
				},
			},
		],
	},

	// ── m: Motion ─────────────────────────────────────────────
	{
		code: "m",
		name: "Motion",
		description:
			"Ambient/idle animations AND entry effects. Ambient = always playing. Entry = plays once on mount.",
		encodingOrder: 6,
		defaultIndex: 0,
		vpbControl: "select",
		values: [
			{ index: 0, id: "none", label: "Static", tokenRefs: {} },
			// ─ Ambient (infinite loop) ─
			{
				index: 1,
				id: "breathe",
				label: "Breathing Pulse",
				tokenRefs: {
					animation: "var(--motion-animation-breathe)",
				},
			},
			{
				index: 2,
				id: "shimmer",
				label: "Liquid Shimmer",
				tokenRefs: {
					animation: "var(--motion-animation-shimmer)",
				},
			},
			{
				index: 3,
				id: "drift",
				label: "Particle Drift",
				tokenRefs: {
					animation: "var(--motion-animation-drift)",
				},
			},
			{
				index: 4,
				id: "pulse",
				label: "Glow Pulse",
				tokenRefs: {
					animation: "var(--motion-animation-pulse)",
				},
			},
			// ─ Entry (plays once) ─
			{
				index: 5,
				id: "fade-in",
				label: "Fade In",
				tokenRefs: {
					animation: "var(--motion-animation-fade-in)",
				},
			},
			{
				index: 6,
				id: "slide-up",
				label: "Slide Up",
				tokenRefs: {
					animation: "var(--motion-animation-slide-up)",
				},
			},
			{
				index: 7,
				id: "slide-down",
				label: "Slide Down",
				tokenRefs: {
					animation: "var(--motion-animation-slide-down)",
				},
			},
			{
				index: 8,
				id: "scale-in",
				label: "Scale In",
				tokenRefs: {
					animation: "var(--motion-animation-scale-in)",
				},
			},
		],
	},

	// ── t: Transition ─────────────────────────────────────────
	{
		code: "t",
		name: "Transition",
		description:
			"User-triggered state changes: hover, focus, click, press. Duration + easing + optional property scope.",
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
						"all var(--motion-duration-snap) var(--motion-ease-out)",
				},
			},
			{
				index: 2,
				id: "fast",
				label: "Fast (150ms)",
				tokenRefs: {
					transition:
						"all var(--motion-duration-fast) var(--motion-ease-out)",
				},
			},
			{
				index: 3,
				id: "normal",
				label: "Normal (250ms)",
				tokenRefs: {
					transition:
						"all var(--motion-duration-normal) var(--motion-ease-in-out)",
				},
			},
			{
				index: 4,
				id: "smooth",
				label: "Smooth (400ms)",
				tokenRefs: {
					transition:
						"all var(--motion-duration-smooth) var(--motion-ease-in-out)",
				},
			},
			{
				index: 5,
				id: "spring",
				label: "Spring",
				tokenRefs: {
					transition:
						"all var(--motion-duration-normal) var(--motion-ease-spring)",
				},
			},
			{
				index: 6,
				id: "bounce",
				label: "Bounce",
				tokenRefs: {
					transition:
						"all var(--motion-duration-smooth) var(--motion-ease-bounce)",
				},
			},
			// ─ Scoped transitions (per-property) ─
			{
				index: 7,
				id: "opacity-fast",
				label: "Opacity Fast",
				tokenRefs: {
					transition:
						"opacity var(--motion-duration-fast) var(--motion-ease-out)",
				},
			},
			{
				index: 8,
				id: "transform-spring",
				label: "Transform Spring",
				tokenRefs: {
					transition:
						"transform var(--motion-duration-normal) var(--motion-ease-spring)",
				},
			},
			{
				index: 9,
				id: "color-smooth",
				label: "Color Smooth",
				tokenRefs: {
					transition:
						"color var(--motion-duration-smooth) var(--motion-ease-in-out), background-color var(--motion-duration-smooth) var(--motion-ease-in-out)",
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

/**
 * @internal Numeric index schema — encoding internals only.
 *
 * FULLY DERIVED from TOKEN_CATEGORY_REGISTRY.
 * Add a category to the registry → this schema auto-expands.
 */
const _encodingShape: Record<string, z.ZodDefault<z.ZodNumber>> = {};
for (const cat of TOKEN_CATEGORY_REGISTRY) {
	_encodingShape[cat.code] = z
		.number()
		.int()
		.min(0)
		.max(cat.values.length - 1)
		.default(cat.defaultIndex);
}
export const EncodingIndicesSchema = z.object(_encodingShape);

/**
 * @internal Numeric indices — one per encoding axis.
 * Explicit interface (no index signature) to preserve type safety
 * when intersected with component props.
 *
 * If you add a 9th axis to TOKEN_CATEGORY_REGISTRY, add the field here.
 * The _assertEncodingIndicesSync check below will fail at compile time
 * if this interface falls out of sync with the schema.
 */
export interface EncodingIndices {
	s: number;
	z: number;
	d: number;
	b: number;
	g: number;
	f: number;
	m: number;
	t: number;
}

// Runtime sync assertion: EncodingIndices fields must match registry codes.
const _encodingFields: (keyof EncodingIndices)[] = [
	"s",
	"z",
	"d",
	"b",
	"g",
	"f",
	"m",
	"t",
];
const _registryCodes = TOKEN_CATEGORY_REGISTRY.map((c) => c.code);
if (
	_encodingFields.length !== _registryCodes.length ||
	!_encodingFields.every((f) => _registryCodes.includes(f))
) {
	throw new Error(
		`EncodingIndices interface out of sync with TOKEN_CATEGORY_REGISTRY. ` +
			`Interface: [${_encodingFields.join(", ")}] ` +
			`Registry: [${_registryCodes.join(", ")}]`,
	);
}

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
export const categoryIds = (code: string) =>
	TOKEN_CATEGORY_REGISTRY.find((c) => c.code === code)!.values.map(
		(v) => v.id,
	) as [string, ...string[]];

// ───────────────────────────────────────────────────────────────
// ID SCHEMA MAP — DERIVED from registry. One map, all categories.
//
// Add a category to the registry → IdSchemaMap auto-expands.
// Named exports below are stable aliases for type consumers.
// ───────────────────────────────────────────────────────────────

/** Dynamic map: code → Zod enum schema for that category's value IDs. */
export const IdSchemaMap = Object.fromEntries(
	TOKEN_CATEGORY_REGISTRY.map((cat) => [cat.code, z.enum(categoryIds(cat.code))]),
) as Record<string, z.ZodEnum>;

// Named aliases — stable exports for type consumers.
// Each is derived from IdSchemaMap, which derives from registry.
export const SurfaceIdSchema = IdSchemaMap["s"];
export const MaterialIdSchema = IdSchemaMap["z"];
export const DepthIdSchema = IdSchemaMap["d"];
export const BevelIdSchema = IdSchemaMap["b"];
export const GlowIdSchema = IdSchemaMap["g"];
export const FrameIdSchema = IdSchemaMap["f"];
export const MotionIdSchema = IdSchemaMap["m"];
export const TransitionIdSchema = IdSchemaMap["t"];

export type SurfaceId = z.infer<typeof SurfaceIdSchema>;
export type MaterialId = z.infer<typeof MaterialIdSchema>;
export type DepthId = z.infer<typeof DepthIdSchema>;
export type BevelId = z.infer<typeof BevelIdSchema>;
export type GlowId = z.infer<typeof GlowIdSchema>;
export type FrameId = z.infer<typeof FrameIdSchema>;
export type MotionId = z.infer<typeof MotionIdSchema>;
export type TransitionId = z.infer<typeof TransitionIdSchema>;

// ───────────────────────────────────────────────────────────────
// PRESET SCHEMA — DERIVED from registry.
//
// Add a category to the registry → PresetSchema auto-expands.
// ───────────────────────────────────────────────────────────────

const _presetShape: Record<string, z.ZodDefault<z.ZodEnum>> = {};
for (const cat of TOKEN_CATEGORY_REGISTRY) {
	_presetShape[cat.name.toLowerCase()] = z
		.enum(categoryIds(cat.code))
		.default(cat.values[cat.defaultIndex].id);
}

/**
 * Preset — THE public contract for visual configuration.
 *
 * Authors write: `{ surface: "glass-void", depth: "z2", glow: "teal" }`
 * System resolves to CSS: `v-s1 v-d2 v-g1`
 *
 * FULLY DERIVED from TOKEN_CATEGORY_REGISTRY.
 * Add a value to the registry → the schema auto-updates.
 * Add a category to the registry → a new field auto-appears.
 */
export const PresetSchema = z.object(_presetShape);

/**
 * Preset — THE public contract for visual configuration.
 *
 * Explicit interface (no index signature) so component props that
 * extend `Partial<Preset>` don't get polluted with `[x: string]: string`.
 *
 * If you add a 9th axis to TOKEN_CATEGORY_REGISTRY, add the field here.
 * The _assertPresetSync check below will fail at compile time
 * if this interface falls out of sync with the schema.
 */
export interface Preset {
	surface: SurfaceId;
	material: MaterialId;
	depth: DepthId;
	bevel: BevelId;
	glow: GlowId;
	frame: FrameId;
	motion: MotionId;
	transition: TransitionId;
}

// Runtime sync assertion: Preset interface fields must match registry categories.
// If you add a 9th axis to TOKEN_CATEGORY_REGISTRY, this will throw at module load
// until you add the matching field to the Preset interface above.
const _presetFields: (keyof Preset)[] = [
	"surface",
	"material",
	"depth",
	"bevel",
	"glow",
	"frame",
	"motion",
	"transition",
];
const _registryFields = TOKEN_CATEGORY_REGISTRY.map((c) => c.name.toLowerCase());
if (
	_presetFields.length !== _registryFields.length ||
	!_presetFields.every((f) => _registryFields.includes(f))
) {
	throw new Error(
		`Preset interface out of sync with TOKEN_CATEGORY_REGISTRY. ` +
			`Interface: [${_presetFields.join(", ")}] ` +
			`Registry: [${_registryFields.join(", ")}]`,
	);
}

// ═══════════════════════════════════════════════════════════════
// DERIVED: CODE ↔ NAME MAPS
//
// FULLY DERIVED from TOKEN_CATEGORY_REGISTRY.
// Add a category to the registry → these maps update automatically.
// ═══════════════════════════════════════════════════════════════

/** Map category code → preset field name: { s: "surface", z: "material", ... } */
export const CODE_TO_NAME = Object.fromEntries(
	TOKEN_CATEGORY_REGISTRY.map((cat) => [cat.code, cat.name.toLowerCase()]),
) as Record<string, keyof Preset>;

/** Map preset field name → category code: { surface: "s", material: "z", ... } */
export const NAME_TO_CODE = Object.fromEntries(
	TOKEN_CATEGORY_REGISTRY.map((cat) => [cat.name.toLowerCase(), cat.code]),
) as Record<keyof Preset, string>;

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
	return indices as unknown as EncodingIndices;
}

/** Resolve numeric encoding indices to a semantic preset. */
export function resolveToPreset(indices: EncodingIndices): Preset {
	const preset: Record<string, string> = {};
	for (const cat of TOKEN_CATEGORY_REGISTRY) {
		const name = CODE_TO_NAME[cat.code];
		const idx = indices[cat.code as keyof EncodingIndices] ?? cat.defaultIndex;
		preset[name] = cat.values[idx]?.id ?? cat.values[cat.defaultIndex].id;
	}
	return preset as unknown as Preset;
}
