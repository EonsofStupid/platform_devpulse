/**
 * @file SVG System Barrel
 * @layer svg
 * @package @devpulse/coldlight
 *
 * Top-level barrel for the ColdLight SVG filter + blank system.
 * Premium tier neumorphic effects — feSpecularLighting, feTurbulence, shape-aware glow.
 */

// Types
export type {
	FilterDef,
	FilterStep,
	FilterStepChild,
	FilterParam,
	SvgFilterCategory,
	SvgFilterPrimitive,
	BlankShape,
	ShapeOutput,
	ShapeGenerator,
	SurfaceSpec,
	ManifestSvgFilter,
	ManifestSvgBlank,
} from "./_schema/types.js";

// Filter registry
export {
	registerFilter,
	getFilter,
	getAllFilters,
	getFiltersForCategory,
	getFilterCount,
	getAllFiltersForManifest,
	_clearFilterRegistry,
} from "./filters/registry.js";

// Shape generators
export { getShape, rect, pill, circle, hexagon } from "./blanks/shapes/index.js";

// Schemas
export {
	FilterDefSchema,
	FilterStepSchema,
	FilterParamSchema,
	BlankShapeSchema,
	SurfaceSpecSchema,
	ManifestSvgFilterSchema,
	ManifestSvgBlankSchema,
} from "./_schema/schema.js";
