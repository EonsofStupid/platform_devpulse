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

/**
 * Preset schema — 8 encoding category indices.
 *
 * TypeScript needs explicit named keys (Object.fromEntries loses them).
 * Runtime validation still derives max values from the registry.
 */
const _maxIndex = (code: string) =>
	TOKEN_CATEGORY_REGISTRY.find((c) => c.code === code)!.values.length - 1;

export const PresetSchema = z.object({
	s: z.number().int().min(0).max(_maxIndex("s")).default(0),
	z: z.number().int().min(0).max(_maxIndex("z")).default(0),
	d: z.number().int().min(0).max(_maxIndex("d")).default(0),
	b: z.number().int().min(0).max(_maxIndex("b")).default(0),
	g: z.number().int().min(0).max(_maxIndex("g")).default(0),
	f: z.number().int().min(0).max(_maxIndex("f")).default(0),
	m: z.number().int().min(0).max(_maxIndex("m")).default(0),
	t: z.number().int().min(0).max(_maxIndex("t")).default(0),
});

export type Preset = z.infer<typeof PresetSchema>;
