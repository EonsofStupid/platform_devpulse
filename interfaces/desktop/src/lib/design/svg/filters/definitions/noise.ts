/**
 * @file Noise SVG Filter Definitions
 * @layer svg
 * @category noise
 * @package @devpulse/coldlight
 *
 * feTurbulence-based grain texture overlays.
 * Adds materiality to neumorphic surfaces — makes them feel like
 * machined metal rather than flat digital surfaces.
 *
 * Each filter: feTurbulence (fractal noise) → feColorMatrix (desaturate) →
 * feBlend (overlay onto source).
 */

import type { FilterDef } from "../../_schema/types.js";
import { registerFilter } from "../registry.js";

// =============================================================================
// NOISE SUBTLE — fine grain, barely visible
// =============================================================================

const noiseSubtle: FilterDef = {
	id: "noise-subtle",
	category: "noise",
	label: "Noise Subtle",
	description: "Fine grain texture overlay. Adds tactile materiality without obscuring content.",
	cssClass: "filter-noise-subtle",
	filterMargin: 0,
	params: [
		{
			cssProperty: "--svg-noise-frequency",
			defaultValue: 0.65,
			description: "Turbulence base frequency",
		},
		{ cssProperty: "--svg-noise-octaves", defaultValue: 4, description: "Detail level (octaves)" },
	],
	steps: [
		{
			primitive: "feTurbulence",
			attrs: {
				type: "fractalNoise",
				baseFrequency: 0.65,
				numOctaves: 4,
				stitchTiles: "stitch",
				seed: 42,
			},
			result: "noise",
		},
		{
			primitive: "feColorMatrix",
			attrs: { in: "noise", type: "saturate", values: 0 },
			result: "grayNoise",
		},
		{
			primitive: "feBlend",
			attrs: { in: "SourceGraphic", in2: "grayNoise", mode: "overlay" },
		},
	],
};

// =============================================================================
// NOISE MEDIUM — visible grain, machined metal surface
// =============================================================================

const noiseMedium: FilterDef = {
	id: "noise-medium",
	category: "noise",
	label: "Noise Medium",
	description: "Visible grain texture. Machined metal surface appearance for hero elements.",
	cssClass: "filter-noise-medium",
	filterMargin: 0,
	params: [
		{
			cssProperty: "--svg-noise-frequency",
			defaultValue: 0.45,
			description: "Turbulence frequency",
		},
		{ cssProperty: "--svg-noise-octaves", defaultValue: 5, description: "Detail level (octaves)" },
	],
	steps: [
		{
			primitive: "feTurbulence",
			attrs: {
				type: "fractalNoise",
				baseFrequency: 0.45,
				numOctaves: 5,
				stitchTiles: "stitch",
				seed: 42,
			},
			result: "noise",
		},
		{
			primitive: "feColorMatrix",
			attrs: { in: "noise", type: "saturate", values: 0 },
			result: "grayNoise",
		},
		{
			primitive: "feBlend",
			attrs: { in: "SourceGraphic", in2: "grayNoise", mode: "overlay" },
		},
	],
};

// =============================================================================
// REGISTRATION
// =============================================================================

registerFilter(noiseSubtle);
registerFilter(noiseMedium);
