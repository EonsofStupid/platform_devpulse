/**
 * @file SVG Filters Barrel
 * @layer svg
 * @package @devpulse/coldlight
 */

export type {
	FilterDef,
	FilterParam,
	FilterStep,
	FilterStepChild,
	ManifestSvgFilter,
	SvgFilterCategory,
	SvgFilterPrimitive,
} from "../_schema/types.js";
export {
	_clearFilterRegistry,
	getAllFilters,
	getAllFiltersForManifest,
	getFilter,
	getFilterCount,
	getFiltersForCategory,
	registerFilter,
} from "./registry.js";
