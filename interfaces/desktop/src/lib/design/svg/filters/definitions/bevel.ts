/**
 * @file Bevel SVG Filter Definitions
 * @layer svg
 * @category bevel
 * @package @devpulse/coldlight
 *
 * feSpecularLighting-based 3D edge highlights.
 * Premium tier — complements CSS bevel molecules for neumorphic surfaces.
 *
 * Each filter uses: feGaussianBlur (height map from alpha) →
 * feSpecularLighting (Phong model highlight) → feComposite (mask to shape) →
 * feMerge (composite onto source).
 *
 * Light direction: azimuth=225 (top-left), matching the shadow stack convention
 * where light comes from upper-left and shadows fall lower-right.
 */

import { registerFilter } from "../registry.js";
import type { FilterDef } from "../../_schema/types.js";

// =============================================================================
// BEVEL SOFT — subtle machined-metal edge
// =============================================================================

const bevelSoft: FilterDef = {
	id: "bevel-soft",
	category: "bevel",
	label: "Bevel Soft",
	description: "Soft 3D edge highlight using specular lighting. Subtle machined-metal edge for panels and cards.",
	cssClass: "filter-bevel-soft",
	effectId: "bevel.soft-svg",
	filterMargin: 5,
	params: [
		{ cssProperty: "--svg-bevel-specular", defaultValue: 0.6, description: "Specular constant (brightness of highlight)" },
		{ cssProperty: "--svg-bevel-roughness", defaultValue: 0.3, description: "Surface roughness (spread of highlight)" },
		{ cssProperty: "--svg-light-elevation", defaultValue: 45, description: "Light source elevation angle" },
		{ cssProperty: "--svg-light-azimuth", defaultValue: 225, description: "Light source azimuth angle" },
	],
	steps: [
		{
			primitive: "feGaussianBlur",
			attrs: { in: "SourceAlpha", stdDeviation: 2 },
			result: "blur",
		},
		{
			primitive: "feSpecularLighting",
			attrs: {
				in: "blur",
				surfaceScale: 3,
				specularConstant: 0.6,
				specularExponent: 20,
				"lighting-color": "oklch(0.85 0.02 195)",
			},
			result: "specular",
			children: [
				{ tag: "feDistantLight", attrs: { azimuth: 225, elevation: 45 } },
			],
		},
		{
			primitive: "feComposite",
			attrs: { in: "specular", in2: "SourceAlpha", operator: "in" },
			result: "specularMasked",
		},
		{
			primitive: "feMerge",
			attrs: {},
			children: [
				{ tag: "feMergeNode", attrs: { in: "SourceGraphic" } },
				{ tag: "feMergeNode", attrs: { in: "specularMasked" } },
			],
		},
	],
};

// =============================================================================
// BEVEL MEDIUM — pronounced machined panel edge
// =============================================================================

const bevelMedium: FilterDef = {
	id: "bevel-medium",
	category: "bevel",
	label: "Bevel Medium",
	description: "Medium-strength 3D edge with pronounced specular ridge. Machined panel look for modals and key surfaces.",
	cssClass: "filter-bevel-medium",
	effectId: "bevel.medium-svg",
	filterMargin: 8,
	params: [
		{ cssProperty: "--svg-bevel-specular", defaultValue: 0.8, description: "Specular constant" },
		{ cssProperty: "--svg-bevel-roughness", defaultValue: 0.25, description: "Surface roughness" },
		{ cssProperty: "--svg-light-elevation", defaultValue: 50, description: "Light elevation" },
		{ cssProperty: "--svg-light-azimuth", defaultValue: 225, description: "Light azimuth" },
	],
	steps: [
		{
			primitive: "feGaussianBlur",
			attrs: { in: "SourceAlpha", stdDeviation: 3 },
			result: "blur",
		},
		{
			primitive: "feSpecularLighting",
			attrs: {
				in: "blur",
				surfaceScale: 5,
				specularConstant: 0.8,
				specularExponent: 25,
				"lighting-color": "oklch(0.90 0.03 195)",
			},
			result: "specular",
			children: [
				{ tag: "feDistantLight", attrs: { azimuth: 225, elevation: 50 } },
			],
		},
		{
			primitive: "feComposite",
			attrs: { in: "specular", in2: "SourceAlpha", operator: "in" },
			result: "specularMasked",
		},
		{
			primitive: "feMerge",
			attrs: {},
			children: [
				{ tag: "feMergeNode", attrs: { in: "SourceGraphic" } },
				{ tag: "feMergeNode", attrs: { in: "specularMasked" } },
			],
		},
	],
};

// =============================================================================
// BEVEL STRONG — dual-light maximum depth for hero surfaces
// =============================================================================

const bevelStrong: FilterDef = {
	id: "bevel-strong",
	category: "bevel",
	label: "Bevel Strong",
	description: "Maximum 3D depth with dual-light specular. Primary top-left key light + bottom-right teal fill light. For hero panels and featured surfaces.",
	cssClass: "filter-bevel-strong",
	effectId: "bevel.strong-svg",
	filterMargin: 10,
	params: [
		{ cssProperty: "--svg-bevel-specular", defaultValue: 1.0, description: "Primary specular constant" },
		{ cssProperty: "--svg-bevel-roughness", defaultValue: 0.2, description: "Surface roughness" },
		{ cssProperty: "--svg-light-elevation", defaultValue: 55, description: "Primary light elevation" },
		{ cssProperty: "--svg-light-azimuth", defaultValue: 225, description: "Primary light azimuth" },
	],
	steps: [
		{
			primitive: "feGaussianBlur",
			attrs: { in: "SourceAlpha", stdDeviation: 4 },
			result: "blur",
		},
		// Primary specular — top-left key light
		{
			primitive: "feSpecularLighting",
			attrs: {
				in: "blur",
				surfaceScale: 7,
				specularConstant: 1.0,
				specularExponent: 30,
				"lighting-color": "oklch(0.92 0.04 195)",
			},
			result: "specular1",
			children: [
				{ tag: "feDistantLight", attrs: { azimuth: 225, elevation: 55 } },
			],
		},
		// Secondary specular — bottom-right teal fill light (dimmer)
		{
			primitive: "feSpecularLighting",
			attrs: {
				in: "blur",
				surfaceScale: 3,
				specularConstant: 0.3,
				specularExponent: 15,
				"lighting-color": "oklch(0.55 0.18 180)",
			},
			result: "specular2",
			children: [
				{ tag: "feDistantLight", attrs: { azimuth: 45, elevation: 30 } },
			],
		},
		// Mask both specular results to source shape
		{
			primitive: "feComposite",
			attrs: { in: "specular1", in2: "SourceAlpha", operator: "in" },
			result: "spec1Masked",
		},
		{
			primitive: "feComposite",
			attrs: { in: "specular2", in2: "SourceAlpha", operator: "in" },
			result: "spec2Masked",
		},
		// Merge all layers: source + primary specular + fill specular
		{
			primitive: "feMerge",
			attrs: {},
			children: [
				{ tag: "feMergeNode", attrs: { in: "SourceGraphic" } },
				{ tag: "feMergeNode", attrs: { in: "spec1Masked" } },
				{ tag: "feMergeNode", attrs: { in: "spec2Masked" } },
			],
		},
	],
};

// =============================================================================
// REGISTRATION
// =============================================================================

registerFilter(bevelSoft);
registerFilter(bevelMedium);
registerFilter(bevelStrong);
