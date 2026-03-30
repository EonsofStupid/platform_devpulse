/**
 * @file SVG Filter & Blank ArkType Schemas
 * @layer svg
 * @package @devpulse/coldlight
 *
 * ArkType validation schemas for SVG filter definitions and blank shapes.
 * Used for DEV-mode validation in the filter registry.
 */

import { type } from "arktype";
import { BLANK_SHAPES, SVG_FILTER_CATEGORIES, SVG_FILTER_PRIMITIVES } from "./types.js";

// =============================================================================
// VOCABULARY SCHEMAS
// =============================================================================

export const SvgFilterCategorySchema = type.enumerated(...SVG_FILTER_CATEGORIES);
export const SvgFilterPrimitiveSchema = type.enumerated(...SVG_FILTER_PRIMITIVES);
export const BlankShapeSchema = type.enumerated(...BLANK_SHAPES);

// =============================================================================
// FILTER COMPONENT SCHEMAS
// =============================================================================

export const FilterParamSchema = type({
	cssProperty: /^--/,
	defaultValue: "string | number",
	description: "string > 0",
});

export const FilterStepChildSchema = type({
	tag: "string > 0",
	attrs: "Record<string, string | number>",
});

export const FilterStepSchema = type({
	primitive: SvgFilterPrimitiveSchema,
	attrs: "Record<string, string | number>",
	"result?": "string",
	"in?": "string",
	"in2?": "string",
	"children?": FilterStepChildSchema.array(),
});

// =============================================================================
// FILTER DEFINITION SCHEMA
// =============================================================================

export const FilterDefSchema = type({
	id: /^[a-z][a-z0-9]*(-[a-z][a-z0-9]*)*$/,
	category: SvgFilterCategorySchema,
	label: "string > 0",
	description: "string > 0",
	params: FilterParamSchema.array(),
	steps: FilterStepSchema.array().atLeastLength(1),
	"filterUnits?": "'userSpaceOnUse' | 'objectBoundingBox'",
	"filterMargin?": "0 <= number <= 100",
	cssClass: /^filter-[a-z][a-z0-9-]*$/,
	"effectId?": "string",
});

// =============================================================================
// SHAPE OUTPUT SCHEMA
// =============================================================================

export const ShapeOutputSchema = type({
	tag: "'rect' | 'circle' | 'ellipse' | 'path' | 'polygon'",
	attrs: "Record<string, string | number>",
});

// =============================================================================
// SURFACE SPEC SCHEMA
// =============================================================================

export const SurfaceSpecSchema = type({
	shape: BlankShapeSchema,
	filters: "string[]",
	molecules: "string[]",
	"accentFilter?": "string",
	"noiseFilter?": "string",
});

// =============================================================================
// MANIFEST SCHEMAS
// =============================================================================

export const ManifestSvgFilterSchema = type({
	id: "string",
	category: SvgFilterCategorySchema,
	label: "string",
	description: "string",
	cssClass: "string",
	params: type({
		cssProperty: "string",
		defaultValue: "string | number",
	}).array(),
	"effectId?": "string",
});

export const ManifestSvgBlankSchema = type({
	shape: BlankShapeSchema,
	availableFilters: "string[]",
});
