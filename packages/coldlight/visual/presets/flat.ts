/**
 * @file FLAT preset family — minimal, zero depth
 * @package @devpulse/coldlight
 *
 * Zero shadows, zero blur. Solid backgrounds. Clean geometry.
 * Fastest rendering — no composite operations. The performance preset.
 * Zero motion by design — animation is always "none".
 */

import type { PresetDefinition } from "../preset-definition.js";

export const flatElevated: PresetDefinition = {
	id: "flat-elevated",
	family: "flat",
	variant: "elevated",
	label: "Flat Elevated",
	description: "Bright flat — solid color fill, no depth, clean edges",
	axes: {
		backgroundColor: "oklch(0.368 0.04 220)",
		backgroundBlur: "0",
		shadow: [],
		border: { width: "0", style: "none", color: "transparent" },
		animation: "none",
		transition: { duration: "120ms", delay: "0ms", timingFunction: "ease-out" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 500,
			letterSpacing: "0em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.95 0.01 220)",
		borderRadius: "0.5rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.387 0.045 220)",
		},
		active: {
			backgroundColor: "oklch(0.349 0.035 220)",
		},
		disabled: {
			backgroundColor: "oklch(0.304 0.03 220)",
			opacity: 0.4,
			color: "oklch(0.65 0.005 220)",
		},
	},
};

export const flatDeep: PresetDefinition = {
	id: "flat-deep",
	family: "flat",
	variant: "deep",
	label: "Flat Deep",
	description: "Dark flat — deep solid color, no frills, reading-focused",
	axes: {
		backgroundColor: "oklch(0.24 0.03 240)",
		backgroundBlur: "0",
		shadow: [],
		border: { width: "0", style: "none", color: "transparent" },
		animation: "none",
		transition: { duration: "100ms", delay: "0ms", timingFunction: "ease-out" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 400,
			letterSpacing: "0em",
			lineHeight: 1.6,
		},
		gradient: "none",
		color: "oklch(0.85 0.01 220)",
		borderRadius: "0.375rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.259 0.03 240)",
		},
		active: {
			backgroundColor: "oklch(0.221 0.03 240)",
		},
		disabled: {
			backgroundColor: "oklch(0.221 0.03 240)",
			opacity: 0.4,
			color: "oklch(0.55 0.005 220)",
		},
	},
};

export const flatMinimal: PresetDefinition = {
	id: "flat-minimal",
	family: "flat",
	variant: "minimal",
	label: "Flat Minimal",
	description: "Near-invisible — transparent bg, content only, ghost mode",
	axes: {
		backgroundColor: "transparent",
		backgroundBlur: "0",
		shadow: [],
		border: { width: "0", style: "none", color: "transparent" },
		animation: "none",
		transition: { duration: "100ms", delay: "0ms", timingFunction: "ease-out" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 400,
			letterSpacing: "0em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.75 0.008 220)",
		borderRadius: "0.25rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.336 0.03 220 / 0.08)",
		},
		active: {
			backgroundColor: "oklch(0.304 0.03 220 / 0.12)",
		},
		disabled: {
			opacity: 0.35,
			color: "oklch(0.5 0.004 220)",
		},
	},
};

export const flatSolid: PresetDefinition = {
	id: "flat-solid",
	family: "flat",
	variant: "solid",
	label: "Flat Solid",
	description: "Dense flat — opaque fill, strong color, no transparency",
	axes: {
		backgroundColor: "oklch(0.304 0.03 220)",
		backgroundBlur: "0",
		shadow: [],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.4 0.02 220 / 0.3)" },
		animation: "none",
		transition: { duration: "120ms", delay: "0ms", timingFunction: "ease-out" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 500,
			letterSpacing: "0em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.9 0.01 220)",
		borderRadius: "0.5rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.323 0.033 220)",
			border: { color: "oklch(0.45 0.025 220 / 0.38)" },
		},
		active: {
			backgroundColor: "oklch(0.285 0.03 220)",
		},
		disabled: {
			backgroundColor: "oklch(0.259 0.03 220)",
			opacity: 0.4,
			border: { color: "oklch(0.3 0.005 220 / 0.15)" },
			color: "oklch(0.6 0.005 220)",
		},
	},
};

export const flatGlow: PresetDefinition = {
	id: "flat-glow",
	family: "flat",
	variant: "glow",
	label: "Flat Glow",
	description: "Flat with accent color — tinted fill, no depth but colorful",
	axes: {
		backgroundColor: "oklch(0.304 0.06 180)",
		backgroundBlur: "0",
		shadow: [],
		border: { width: "0", style: "none", color: "transparent" },
		animation: "none",
		transition: { duration: "150ms", delay: "0ms", timingFunction: "ease-out" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 500,
			letterSpacing: "0em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.92 0.04 180)",
		borderRadius: "0.5rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.323 0.065 180)",
		},
		active: {
			backgroundColor: "oklch(0.285 0.055 180)",
		},
		disabled: {
			backgroundColor: "oklch(0.259 0.03 180)",
			opacity: 0.4,
			color: "oklch(0.6 0.01 180)",
		},
	},
};

export const flatMuted: PresetDefinition = {
	id: "flat-muted",
	family: "flat",
	variant: "muted",
	label: "Flat Muted",
	description: "Dimmed flat — faded background for disabled/secondary states",
	axes: {
		backgroundColor: "oklch(0.259 0.03 220)",
		backgroundBlur: "0",
		shadow: [],
		border: { width: "0", style: "none", color: "transparent" },
		animation: "none",
		transition: { duration: "80ms", delay: "0ms", timingFunction: "ease-out" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 400,
			letterSpacing: "0em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.55 0.005 220)",
		borderRadius: "0.25rem",
		opacity: 0.6,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.272 0.03 220)",
			opacity: 0.7,
		},
		active: {
			backgroundColor: "oklch(0.247 0.03 220)",
			opacity: 0.55,
		},
		disabled: {
			backgroundColor: "oklch(0.24 0.03 220)",
			opacity: 0.3,
			color: "oklch(0.4 0.003 220)",
		},
	},
};

/** All FLAT presets */
export const FLAT_PRESETS: readonly PresetDefinition[] = [
	flatElevated,
	flatDeep,
	flatMinimal,
	flatSolid,
	flatGlow,
	flatMuted,
] as const;
