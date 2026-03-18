/**
 * @file SVG System Barrel
 * @layer svg
 * @package @devpulse/coldlight
 *
 * Top-level barrel for the ColdLight SVG filter + blank system.
 * Premium tier neumorphic effects — feSpecularLighting, feTurbulence, shape-aware glow.
 */

// Schemas
export {
	BlankShapeSchema,
	FilterDefSchema,
	FilterParamSchema,
	FilterStepSchema,
	ManifestSvgBlankSchema,
	ManifestSvgFilterSchema,
	SurfaceSpecSchema,
} from "./_schema/schema.js";
// Types
export type {
	BlankShape,
	FilterDef,
	FilterParam,
	FilterStep,
	FilterStepChild,
	ManifestSvgBlank,
	ManifestSvgFilter,
	ShapeGenerator,
	ShapeOutput,
	SurfaceSpec,
	SvgFilterCategory,
	SvgFilterPrimitive,
} from "./_schema/types.js";

// Shape generators
export { circle, getShape, hexagon, pill, rect } from "./blanks/shapes/index.js";
// Filter registry
export {
	_clearFilterRegistry,
	getAllFilters,
	getAllFiltersForManifest,
	getFilter,
	getFilterCount,
	getFiltersForCategory,
	registerFilter,
} from "./filters/registry.js";
