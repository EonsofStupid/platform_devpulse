/**
 * @file SVG Filter & Blank Zod Schemas
 * @layer svg
 * @package @devpulse/coldlight
 *
 * Zod validation schemas for SVG filter definitions and blank shapes.
 * Used for DEV-mode validation in the filter registry.
 */

import { z } from "zod";
import {
	SVG_FILTER_CATEGORIES,
	SVG_FILTER_PRIMITIVES,
	BLANK_SHAPES,
} from "./types.js";

// =============================================================================
// VOCABULARY SCHEMAS
// =============================================================================

export const SvgFilterCategorySchema = z.enum(SVG_FILTER_CATEGORIES);
export const SvgFilterPrimitiveSchema = z.enum(SVG_FILTER_PRIMITIVES);
export const BlankShapeSchema = z.enum(BLANK_SHAPES);

// =============================================================================
// FILTER COMPONENT SCHEMAS
// =============================================================================

export const FilterParamSchema = z.object({
	cssProperty: z.string().startsWith("--"),
	defaultValue: z.union([z.string(), z.number()]),
	description: z.string().min(1),
});

export const FilterStepChildSchema = z.object({
	tag: z.string().min(1),
	attrs: z.record(z.string(), z.union([z.string(), z.number()])),
});

export const FilterStepSchema = z.object({
	primitive: SvgFilterPrimitiveSchema,
	attrs: z.record(z.string(), z.union([z.string(), z.number()])),
	result: z.string().optional(),
	in: z.string().optional(),
	in2: z.string().optional(),
	children: z.array(FilterStepChildSchema).optional(),
});

// =============================================================================
// FILTER DEFINITION SCHEMA
// =============================================================================

export const FilterDefSchema = z.object({
	id: z.string().regex(
		/^[a-z][a-z0-9]*(-[a-z][a-z0-9]*)*$/,
		"Filter ID must be lowercase kebab-case",
	),
	category: SvgFilterCategorySchema,
	label: z.string().min(1),
	description: z.string().min(1),
	params: z.array(FilterParamSchema),
	steps: z.array(FilterStepSchema).min(1),
	filterUnits: z.enum(["userSpaceOnUse", "objectBoundingBox"]).optional(),
	filterMargin: z.number().min(0).max(100).optional(),
	cssClass: z.string().regex(
		/^filter-[a-z][a-z0-9-]*$/,
		"CSS class must start with 'filter-'",
	),
	effectId: z.string().optional(),
});

// =============================================================================
// SHAPE OUTPUT SCHEMA
// =============================================================================

export const ShapeOutputSchema = z.object({
	tag: z.enum(["rect", "circle", "ellipse", "path", "polygon"]),
	attrs: z.record(z.string(), z.union([z.string(), z.number()])),
});

// =============================================================================
// SURFACE SPEC SCHEMA
// =============================================================================

export const SurfaceSpecSchema = z.object({
	shape: BlankShapeSchema,
	filters: z.array(z.string()),
	molecules: z.array(z.string()),
	accentFilter: z.string().optional(),
	noiseFilter: z.string().optional(),
});

// =============================================================================
// MANIFEST SCHEMAS
// =============================================================================

export const ManifestSvgFilterSchema = z.object({
	id: z.string(),
	category: SvgFilterCategorySchema,
	label: z.string(),
	description: z.string(),
	cssClass: z.string(),
	params: z.array(z.object({
		cssProperty: z.string(),
		defaultValue: z.union([z.string(), z.number()]),
	})),
	effectId: z.string().optional(),
});

export const ManifestSvgBlankSchema = z.object({
	shape: BlankShapeSchema,
	availableFilters: z.array(z.string()),
});
