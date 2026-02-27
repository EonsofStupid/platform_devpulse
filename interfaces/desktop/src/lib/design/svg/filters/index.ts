/**
 * @file SVG Filters Barrel
 * @layer svg
 * @package @devpulse/coldlight
 */

export {
	registerFilter,
	getFilter,
	getAllFilters,
	getFiltersForCategory,
	getFilterCount,
	getAllFiltersForManifest,
	_clearFilterRegistry,
} from "./registry.js";

export type {
	FilterDef,
	FilterStep,
	FilterStepChild,
	FilterParam,
	SvgFilterCategory,
	SvgFilterPrimitive,
	ManifestSvgFilter,
} from "../_schema/types.js";
