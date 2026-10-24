/**
 * @file SVG Filter & Blank Type Definitions
 * @layer svg
 * @package @devpulse/coldlight
 *
 * Types for the SVG filter library, parametric blanks, and surface components.
 * SVG filters are the premium tier for neumorphic surfaces — feSpecularLighting,
 * feTurbulence, feGaussianBlur chains that CSS box-shadow cannot produce.
 *
 * Two-tier model:
 *   CSS tier (baseline) → molecules/bevel.css, molecules/glow.css (box-shadow)
 *   SVG tier (premium)  → svg/filters/ (feSpecularLighting, feTurbulence)
 */

// =============================================================================
// SVG FILTER PRIMITIVES
// =============================================================================

/** SVG filter primitive element tags used in filter chains */
export const SVG_FILTER_PRIMITIVES = [
	"feGaussianBlur",
	"feSpecularLighting",
	"feDiffuseLighting",
	"feTurbulence",
	"feComposite",
	"feMerge",
	"feFlood",
	"feOffset",
	"feBlend",
	"feColorMatrix",
	"feComponentTransfer",
	"feMorphology",
] as const;

export type SvgFilterPrimitive = (typeof SVG_FILTER_PRIMITIVES)[number];

// =============================================================================
// SVG FILTER CATEGORIES
// =============================================================================

/** Categories of SVG filters. Each maps to a definitions file. */
export const SVG_FILTER_CATEGORIES = ["bevel", "noise", "glow", "material"] as const;

export type SvgFilterCategory = (typeof SVG_FILTER_CATEGORIES)[number];

// =============================================================================
// FILTER PARAMETER — token-driven configuration
// =============================================================================

/**
 * A single configurable parameter in a filter definition.
 * Value comes from CSS custom property (token-driven) or default.
 */
export interface FilterParam {
	/** CSS custom property name: "--svg-bevel-specular" */
	readonly cssProperty: string;
	/** Default value if custom property is unset */
	readonly defaultValue: string | number;
	/** Human description for manifest/tooling */
	readonly description: string;
}

// =============================================================================
// FILTER STEP — one SVG filter primitive with attributes
// =============================================================================

/**
 * Child element within a filter step (e.g., fePointLight inside feSpecularLighting,
 * feMergeNode inside feMerge).
 */
export interface FilterStepChild {
	readonly tag: string;
	readonly attrs: Readonly<Record<string, string | number>>;
}

/**
 * A single step in the filter chain — one SVG filter primitive with attributes.
 * SvgFilters.svelte reads these to render <filter> children via <svelte:element>.
 */
export interface FilterStep {
	/** SVG filter primitive tag: "feGaussianBlur", "feSpecularLighting" */
	readonly primitive: SvgFilterPrimitive;
	/** Attributes to set on the SVG element */
	readonly attrs: Readonly<Record<string, string | number>>;
	/** result attribute name for chaining to next step */
	readonly result?: string;
	/** in attribute — references previous step's result or "SourceGraphic"/"SourceAlpha" */
	readonly in?: string;
	/** in2 attribute — for feComposite, feBlend */
	readonly in2?: string;
	/** Child elements (fePointLight, feDistantLight, feMergeNode) */
	readonly children?: readonly FilterStepChild[];
}

// =============================================================================
// FILTER DEFINITION — the core data object
// =============================================================================

/**
 * Complete SVG filter definition.
 * Registered in the filter registry, rendered by SvgFilters.svelte,
 * referenced by CSS utility classes and effect definitions.
 *
 * This is a DATA OBJECT — it declares what SVG filter primitives to render.
 * SvgFilters.svelte reads these and produces <filter> elements.
 */
export interface FilterDef {
	/** Unique filter ID used as SVG filter element id: "bevel-soft", "noise-subtle" */
	readonly id: string;
	/** Category for grouping */
	readonly category: SvgFilterCategory;
	/** Human-readable display name */
	readonly label: string;
	/** What this filter does (for manifest, tooltips, documentation) */
	readonly description: string;
	/** Token-driven parameters exposed as CSS custom properties */
	readonly params: readonly FilterParam[];
	/** Ordered chain of SVG filter primitives */
	readonly steps: readonly FilterStep[];
	/** filterUnits attribute: "userSpaceOnUse" or "objectBoundingBox" */
	readonly filterUnits?: "userSpaceOnUse" | "objectBoundingBox";
	/** Filter region expansion (percentage beyond bounding box, default 10%) */
	readonly filterMargin?: number;
	/** CSS utility class name that applies this filter: "filter-bevel-soft" */
	readonly cssClass: string;
	/** Associated EffectDefinition ID (for cross-referencing effects ↔ filters) */
	readonly effectId?: string;
}

// =============================================================================
// BLANK SHAPE TYPES
// =============================================================================

/** Available parametric blank shapes */
export const BLANK_SHAPES = ["rect", "pill", "circle", "hexagon"] as const;

export type BlankShape = (typeof BLANK_SHAPES)[number];

/**
 * Output of a shape generator — the SVG element to render.
 */
export interface ShapeOutput {
	/** SVG element tag */
	readonly tag: "rect" | "circle" | "ellipse" | "path" | "polygon";
	/** Attributes for the SVG shape element */
	readonly attrs: Record<string, string | number>;
}

/**
 * Shape generator function.
 * Takes dimensions and border radius, returns SVG element tag + attributes.
 */
export type ShapeGenerator = (width: number, height: number, radius: number) => ShapeOutput;

// =============================================================================
// SURFACE SPEC — composed SVG surface declaration
// =============================================================================

/**
 * Declares a composed SVG surface: shape + filter chain + CSS molecules.
 * Used by NeuPanel, NeuGauge, NeuFrame surface components.
 */
export interface SurfaceSpec {
	/** Shape to render as the SVG background */
	readonly shape: BlankShape;
	/** Filter IDs to apply (chained via CSS filter property) */
	readonly filters: readonly string[];
	/** CSS molecule classes for the HTML content layer */
	readonly molecules: readonly string[];
	/** Optional accent glow filter ID */
	readonly accentFilter?: string;
	/** Optional grain/noise filter ID */
	readonly noiseFilter?: string;
}

// =============================================================================
// MANIFEST TYPES — for ColdLight manifest integration
// =============================================================================

/**
 * SVG filter entry in the ColdLight manifest.
 * Serialized from FilterDef for JSON output.
 */
export interface ManifestSvgFilter {
	readonly id: string;
	readonly category: SvgFilterCategory;
	readonly label: string;
	readonly description: string;
	readonly cssClass: string;
	readonly params: readonly {
		readonly cssProperty: string;
		readonly defaultValue: string | number;
	}[];
	readonly effectId?: string;
}

/**
 * SVG blank entry in the ColdLight manifest.
 */
export interface ManifestSvgBlank {
	readonly shape: BlankShape;
	readonly availableFilters: readonly string[];
}
