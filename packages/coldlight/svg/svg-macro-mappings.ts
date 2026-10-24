/**
 * @file SVG Visual Engine — 20-Axis Dictionary
 * @package @devpulse/coldlight
 *
 * Maps SVG visual axis names to CSS custom property names, DTCG types,
 * default values, and preset JSON keys.
 *
 * Peer to styles/macro-mappings.ts (HTML 11-axis engine).
 * This is the SSOT for the SVG axis system.
 */

import type { SvgAxis, SvgAxisMapping } from "./svg-types.js";

/** Complete 20-axis SVG mapping dictionary */
export const SVG_AXIS_MAP: Record<SvgAxis, SvgAxisMapping> = {
	stroke: {
		cssVar: "--svg-stroke",
		dtcgType: "color",
		defaultValue: "var(--svg-accent-main, currentColor)",
		presetKey: "stroke",
	},
	strokeWidth: {
		cssVar: "--svg-stroke-width",
		dtcgType: "dimension",
		defaultValue: "0.125rem",
		presetKey: "stroke-width",
	},
	strokeLinecap: {
		cssVar: "--svg-stroke-linecap",
		dtcgType: "string",
		defaultValue: "round",
		presetKey: "stroke-linecap",
	},
	strokeOpacity: {
		cssVar: "--svg-stroke-opacity",
		dtcgType: "number",
		defaultValue: "1",
		presetKey: "stroke-opacity",
	},
	fill: {
		cssVar: "--svg-fill",
		dtcgType: "color",
		defaultValue: "var(--svg-accent-fill, none)",
		presetKey: "fill",
	},
	fillOpacity: {
		cssVar: "--svg-fill-opacity",
		dtcgType: "number",
		defaultValue: "0.08",
		presetKey: "fill-opacity",
	},
	glowColor: {
		cssVar: "--svg-glow-color",
		dtcgType: "color",
		defaultValue: "var(--svg-accent-glow, transparent)",
		presetKey: "glow-color",
	},
	glowBlur: {
		cssVar: "--svg-glow-blur",
		dtcgType: "dimension",
		defaultValue: "1.25rem",
		presetKey: "glow-blur",
	},
	glowOpacity: {
		cssVar: "--svg-glow-opacity",
		dtcgType: "number",
		defaultValue: "0.7",
		presetKey: "glow-opacity",
	},
	trackStroke: {
		cssVar: "--svg-track-stroke",
		dtcgType: "color",
		defaultValue: "oklch(1 0 0 / 0.06)",
		presetKey: "track-stroke",
	},
	trackOpacity: {
		cssVar: "--svg-track-opacity",
		dtcgType: "number",
		defaultValue: "1",
		presetKey: "track-opacity",
	},
	textColor: {
		cssVar: "--svg-text-color",
		dtcgType: "color",
		defaultValue: "var(--svg-accent-main, currentColor)",
		presetKey: "text-color",
	},
	textGlowColor: {
		cssVar: "--svg-text-glow-color",
		dtcgType: "color",
		defaultValue: "var(--svg-accent-glow, transparent)",
		presetKey: "text-glow-color",
	},
	textGlowBlur: {
		cssVar: "--svg-text-glow-blur",
		dtcgType: "dimension",
		defaultValue: "0.75rem",
		presetKey: "text-glow-blur",
	},
	fontFamily: {
		cssVar: "--svg-font-family",
		dtcgType: "string",
		defaultValue: "inherit",
		presetKey: "font-family",
	},
	fontSize: {
		cssVar: "--svg-font-size",
		dtcgType: "dimension",
		defaultValue: "inherit",
		presetKey: "font-size",
	},
	fontWeight: {
		cssVar: "--svg-font-weight",
		dtcgType: "string",
		defaultValue: "inherit",
		presetKey: "font-weight",
	},
	filterUrl: {
		cssVar: "--svg-filter",
		dtcgType: "string",
		defaultValue: "none",
		presetKey: "filter-url",
	},
	animation: {
		cssVar: "--svg-animation",
		dtcgType: "string",
		defaultValue: "none",
		presetKey: "animation",
	},
	transition: {
		cssVar: "--svg-transition",
		dtcgType: "string",
		defaultValue: "all 150ms ease-out",
		presetKey: "transition",
	},
};

/** Ordered axis keys for iteration */
export const SVG_AXIS_KEYS: SvgAxis[] = Object.keys(SVG_AXIS_MAP) as SvgAxis[];

/** CSS var prefix for SVG preset tokens (matches SD5 output) */
export const SVG_PRESET_PREFIX = "--svg-style";

/** CSS var prefix for SVG accent injection */
export const SVG_ACCENT_PREFIX = "--svg-accent";
