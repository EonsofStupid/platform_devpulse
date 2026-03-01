/**
 * @file ColdLight Token Category Registry — SINGLE SOURCE OF TRUTH
 * @module @devpulse/coldlight/registry
 * @layer registry
 *
 * This file defines EVERY token category, its encoding code, and valid values.
 * Everything else is generated from it: Zod schemas, Prisma references, SD5 CSS,
 * VPB controls, TypeScript types.
 *
 * Adding a new category: add entry here → run pnpm ds:tokens:build → done.
 * NO other code changes needed.
 */

import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// CATEGORY DEFINITION SCHEMA
// ═══════════════════════════════════════════════════════════════

export const CategoryValueSchema = z.object({
	/** Index in array = number in encoding (0, 1, 2...) */
	index: z.number().int().nonnegative(),
	/** Token-friendly ID (used in CSS custom property names) */
	id: z.string().regex(/^[a-z][a-z0-9-]*$/),
	/** Human label for VPB */
	label: z.string(),
	/** Tier 1 token references this value resolves to */
	tokenRefs: z.record(z.string(), z.string()),
	/** Required Tier 1 tokens (build fails if missing) */
	requiredTokens: z.array(z.string()).optional(),
	/** SVG filters to apply (bevel/glow) */
	svgFilters: z.array(z.string()).optional(),
});

export const CategoryDefinitionSchema = z.object({
	/** 1-2 character code used in v-encoding */
	code: z.string().min(1).max(2).regex(/^[a-z]{1,2}$/),
	/** Human-readable category name */
	name: z.string(),
	/** What this category controls */
	description: z.string(),
	/** Ordered array of valid values. Index = encoding number. */
	values: z.array(CategoryValueSchema),
	/** Default value index when omitted from encoding */
	defaultIndex: z.number().int().nonnegative().default(0),
	/** Sort order in encoding string */
	encodingOrder: z.number().int(),
	/** VPB UI control type */
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
// ═══════════════════════════════════════════════════════════════

export const TOKEN_CATEGORY_REGISTRY: CategoryDefinition[] = [
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
					background: "{glass.void}",
					backdropFilter: "blur({blur.md})",
					border: "1px solid {color.teal.700/0.22}",
				},
				requiredTokens: ["glass.void", "blur.md", "color.teal.700"],
			},
			{
				index: 2,
				id: "glass-deep",
				label: "Glass Deep",
				tokenRefs: {
					background: "{glass.deep}",
					backdropFilter: "blur({blur.lg})",
					border: "1px solid {color.teal.600/0.18}",
				},
				requiredTokens: ["glass.deep", "blur.lg", "color.teal.600"],
			},
			{
				index: 3,
				id: "glass-smoke",
				label: "Glass Smoke",
				tokenRefs: {
					background: "{glass.smoke}",
					backdropFilter: "blur({blur.xl})",
				},
				requiredTokens: ["glass.smoke", "blur.xl"],
			},
			{
				index: 4,
				id: "glass-frost",
				label: "Glass Frost",
				tokenRefs: {
					background: "{glass.frost}",
					backdropFilter: "blur({blur.2xl})",
					border: "1px solid {color.white/0.12}",
				},
				requiredTokens: ["glass.frost", "blur.2xl"],
			},
			{
				index: 5,
				id: "matte-dark",
				label: "Matte Dark",
				tokenRefs: {
					background: "{matte.dark}",
				},
				requiredTokens: ["matte.dark"],
			},
			{
				index: 6,
				id: "solid-teal",
				label: "Solid Teal",
				tokenRefs: {
					background: "{color.teal.500}",
				},
				requiredTokens: ["color.teal.500"],
			},
			{
				index: 7,
				id: "void-gradient",
				label: "Void Gradient",
				tokenRefs: {
					background:
						"linear-gradient(135deg, {color.void.start}, {color.void.end})",
				},
				requiredTokens: ["color.void.start", "color.void.end"],
			},
		],
	},

	{
		code: "z",
		name: "Material",
		description:
			"Material physics. Modifies HOW a surface renders. Declares requiredTokens + optionalLayers.",
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
					saturation: "1.1",
				},
			},
			{
				index: 2,
				id: "glass-medium",
				label: "Glass — Medium",
				tokenRefs: {
					opacity: "0.75",
					saturation: "1.2",
				},
			},
			{
				index: 3,
				id: "glass-intense",
				label: "Glass — Intense",
				tokenRefs: {
					opacity: "0.6",
					saturation: "1.4",
					border: "1px solid {color.white/0.15}",
				},
			},
			{
				index: 4,
				id: "glass-ultra",
				label: "Glass — Ultra",
				tokenRefs: {
					opacity: "0.45",
					saturation: "1.6",
					border: "1px solid {color.white/0.22}",
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
						"repeating-linear-gradient(90deg, {color.white/0.02} 0px, transparent 2px)",
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
						"linear-gradient(180deg, {color.white/0.15}, transparent, {color.white/0.08})",
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
						"linear-gradient(180deg, {color.orange.300/0.12}, transparent, {color.orange.400/0.08})",
					filter: "contrast(1.08) saturate(1.2)",
				},
				svgFilters: ["noise-subtle"],
			},
		],
	},

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
				tokenRefs: { boxShadow: "none" },
			},
			{
				index: 1,
				id: "z1",
				label: "Z1 — Subtle",
				tokenRefs: { boxShadow: "{shadow.z1}" },
				requiredTokens: ["shadow.z1"],
			},
			{
				index: 2,
				id: "z2",
				label: "Z2 — Elevated",
				tokenRefs: { boxShadow: "{shadow.z2}" },
				requiredTokens: ["shadow.z2"],
			},
			{
				index: 3,
				id: "z3",
				label: "Z3 — Floating",
				tokenRefs: { boxShadow: "{shadow.z3}" },
				requiredTokens: ["shadow.z3"],
			},
			{
				index: 4,
				id: "z4",
				label: "Z4 — Maximum",
				tokenRefs: { boxShadow: "{shadow.z4}" },
				requiredTokens: ["shadow.z4"],
			},
		],
	},

	{
		code: "b",
		name: "Bevel",
		description:
			"Neuromorphic edge treatment. Inset shadows + SVG specular lighting + noise. Higher values = more SVG filter layers.",
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
					boxShadow:
						"inset 0 1px 0 {color.white/0.06}, inset 0 -1px 0 {color.black/0.1}",
				},
			},
			{
				index: 2,
				id: "soft",
				label: "Soft",
				tokenRefs: {
					boxShadow:
						"inset 0 2px 1px {color.white/0.08}, inset 0 -2px 1px {color.black/0.15}",
				},
				svgFilters: ["bevel-soft"],
			},
			{
				index: 3,
				id: "medium",
				label: "Medium",
				tokenRefs: {
					boxShadow:
						"inset 0 2px 2px {color.white/0.1}, inset 0 -2px 2px {color.black/0.2}",
				},
				svgFilters: ["bevel-medium", "noise-subtle"],
			},
			{
				index: 4,
				id: "strong",
				label: "Strong + Filters",
				tokenRefs: {
					boxShadow:
						"inset 0 3px 3px {color.white/0.12}, inset 0 -3px 3px {color.black/0.25}",
				},
				svgFilters: ["bevel-strong", "noise-subtle"],
			},
		],
	},

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
					boxShadow: "0 0 {glow.spread} {color.teal.400/0.4}",
				},
				requiredTokens: ["glow.spread", "color.teal.400"],
			},
			{
				index: 2,
				id: "purple",
				label: "Purple",
				tokenRefs: {
					boxShadow: "0 0 {glow.spread} {color.purple.400/0.4}",
				},
				requiredTokens: ["glow.spread", "color.purple.400"],
			},
			{
				index: 3,
				id: "amber",
				label: "Amber",
				tokenRefs: {
					boxShadow: "0 0 {glow.spread} {color.amber.400/0.4}",
				},
				requiredTokens: ["glow.spread", "color.amber.400"],
			},
			{
				index: 4,
				id: "rose",
				label: "Rose",
				tokenRefs: {
					boxShadow: "0 0 {glow.spread} {color.rose.400/0.4}",
				},
				requiredTokens: ["glow.spread", "color.rose.400"],
			},
			{
				index: 5,
				id: "white",
				label: "White",
				tokenRefs: {
					boxShadow: "0 0 {glow.spread} {color.white/0.3}",
				},
				requiredTokens: ["glow.spread"],
			},
		],
	},

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
					border: "1px solid {color.white/0.06}",
					borderRadius: "{radius.md}",
				},
			},
			{
				index: 2,
				id: "hard",
				label: "Hard",
				tokenRefs: {
					border: "1px solid {color.white/0.15}",
					borderRadius: "{radius.sm}",
				},
			},
			{
				index: 3,
				id: "crisp",
				label: "Crisp",
				tokenRefs: {
					border: "1px solid {color.white/0.25}",
					borderRadius: "{radius.xs}",
				},
			},
			{
				index: 4,
				id: "glow",
				label: "Glow Border",
				tokenRefs: {
					border: "1px solid {color.teal.500/0.4}",
					borderRadius: "{radius.md}",
					boxShadow: "0 0 8px {color.teal.500/0.15}",
				},
			},
		],
	},

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
					animation:
						"{anim.breathe} {duration.slow} ease-in-out infinite",
				},
			},
			{
				index: 2,
				id: "shimmer",
				label: "Liquid Shimmer",
				tokenRefs: {
					animation:
						"{anim.shimmer} {duration.glacial} linear infinite",
				},
			},
			{
				index: 3,
				id: "drift",
				label: "Particle Drift",
				tokenRefs: {
					animation:
						"{anim.drift} {duration.glacial} ease-in-out infinite",
				},
			},
			{
				index: 4,
				id: "pulse",
				label: "Glow Pulse",
				tokenRefs: {
					animation:
						"{anim.pulse} {duration.moderate} ease-in-out infinite",
				},
			},
		],
	},

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
				tokenRefs: { transition: "all {duration.snap} {ease.out}" },
			},
			{
				index: 2,
				id: "fast",
				label: "Fast (150ms)",
				tokenRefs: { transition: "all {duration.fast} {ease.out}" },
			},
			{
				index: 3,
				id: "normal",
				label: "Normal (250ms)",
				tokenRefs: {
					transition: "all {duration.normal} {ease.inOut}",
				},
			},
			{
				index: 4,
				id: "smooth",
				label: "Smooth (400ms)",
				tokenRefs: {
					transition: "all {duration.smooth} {ease.inOut}",
				},
			},
			{
				index: 5,
				id: "spring",
				label: "Spring",
				tokenRefs: {
					transition: "all {duration.normal} {ease.spring}",
				},
			},
			{
				index: 6,
				id: "bounce",
				label: "Bounce",
				tokenRefs: {
					transition: "all {duration.smooth} {ease.bounce}",
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

/** Per-category value validator — ensures index is within valid range */
export function categoryValueSchema(code: string) {
	const cat = CODE_MAP[code];
	if (!cat) throw new Error(`Unknown category code: ${code}`);
	return z.number().int().min(0).max(cat.values.length - 1);
}

/** Full encoding string validator */
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

/** Preset object validator (what VPB works with) */
export const PresetSchema = z.object(
	Object.fromEntries(
		TOKEN_CATEGORY_REGISTRY.map((cat) => [
			cat.code,
			z
				.number()
				.int()
				.min(0)
				.max(cat.values.length - 1)
				.default(cat.defaultIndex),
		]),
	),
);

export type Preset = z.infer<typeof PresetSchema>;
