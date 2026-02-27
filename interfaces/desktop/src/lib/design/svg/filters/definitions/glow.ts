/**
 * @file Glow SVG Filter Definitions
 * @layer svg
 * @category glow
 * @package @devpulse/coldlight
 *
 * Shape-aware glow filters using feFlood + feGaussianBlur.
 * Unlike CSS box-shadow glow (always rectangular), these follow
 * the exact SVG shape contour for precise ambient glow.
 *
 * Each filter: feFlood (color fill) → feComposite (mask to shape alpha) →
 * feGaussianBlur (expand into glow) → feMerge (glow behind source).
 */

import { registerFilter } from "../registry.js";
import type { FilterDef } from "../../_schema/types.js";

// =============================================================================
// GLOW TEAL — shape-aware teal ambient glow
// =============================================================================

const glowTealSvg: FilterDef = {
	id: "glow-teal-svg",
	category: "glow",
	label: "SVG Glow Teal",
	description: "Teal gaussian glow that follows shape contours. Shape-aware alternative to CSS box-shadow glow.",
	cssClass: "filter-glow-teal",
	filterMargin: 20,
	params: [
		{ cssProperty: "--svg-glow-radius", defaultValue: 8, description: "Glow blur radius" },
		{ cssProperty: "--svg-glow-color", defaultValue: "oklch(0.55 0.18 180)", description: "Glow color" },
	],
	steps: [
		{
			primitive: "feFlood",
			attrs: { "flood-color": "oklch(0.55 0.18 180)", "flood-opacity": 0.4 },
			result: "color",
		},
		{
			primitive: "feComposite",
			attrs: { in: "color", in2: "SourceAlpha", operator: "in" },
			result: "colorMasked",
		},
		{
			primitive: "feGaussianBlur",
			attrs: { in: "colorMasked", stdDeviation: 8 },
			result: "glow",
		},
		{
			primitive: "feMerge",
			attrs: {},
			children: [
				{ tag: "feMergeNode", attrs: { in: "glow" } },
				{ tag: "feMergeNode", attrs: { in: "SourceGraphic" } },
			],
		},
	],
};

// =============================================================================
// GLOW PURPLE — shape-aware purple ambient glow
// =============================================================================

const glowPurpleSvg: FilterDef = {
	id: "glow-purple-svg",
	category: "glow",
	label: "SVG Glow Purple",
	description: "Purple gaussian glow that follows shape contours.",
	cssClass: "filter-glow-purple",
	filterMargin: 20,
	params: [
		{ cssProperty: "--svg-glow-radius", defaultValue: 8, description: "Glow blur radius" },
		{ cssProperty: "--svg-glow-color", defaultValue: "oklch(0.55 0.18 280)", description: "Glow color" },
	],
	steps: [
		{
			primitive: "feFlood",
			attrs: { "flood-color": "oklch(0.55 0.18 280)", "flood-opacity": 0.4 },
			result: "color",
		},
		{
			primitive: "feComposite",
			attrs: { in: "color", in2: "SourceAlpha", operator: "in" },
			result: "colorMasked",
		},
		{
			primitive: "feGaussianBlur",
			attrs: { in: "colorMasked", stdDeviation: 8 },
			result: "glow",
		},
		{
			primitive: "feMerge",
			attrs: {},
			children: [
				{ tag: "feMergeNode", attrs: { in: "glow" } },
				{ tag: "feMergeNode", attrs: { in: "SourceGraphic" } },
			],
		},
	],
};

// =============================================================================
// REGISTRATION
// =============================================================================

registerFilter(glowTealSvg);
registerFilter(glowPurpleSvg);
