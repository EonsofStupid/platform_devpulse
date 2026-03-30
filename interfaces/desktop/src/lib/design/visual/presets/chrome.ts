/**
 * @file CHROME preset family — liquid metal
 * @package @devpulse/coldlight
 *
 * Specular highlights, mercury reflections, SVG filter integration,
 * cool-toned silver/steel/ice blue. Subtle shimmer on hover.
 */

import type { PresetDefinition } from "../preset-definition.js";

export const chromeElevated: PresetDefinition = {
	id: "chrome-elevated",
	family: "chrome",
	variant: "elevated",
	label: "Chrome Elevated",
	description: "Polished chrome — specular gradient, sharp highlight, steel surface",
	axes: {
		backgroundColor: "oklch(0.3 0.01 250)",
		backgroundBlur: "0",
		shadow: [
			{ offsetX: "0", offsetY: "0.25rem", blur: "1rem", spread: "0", color: "oklch(0 0 0 / 0.5)" },
			{
				offsetX: "0",
				offsetY: "0.0625rem",
				blur: "0.125rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.25)",
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.6 0.02 250 / 0.4)" },
		animation: {
			name: "cl-specular-sweep",
			duration: "6s",
			timingFunction: "linear",
			iterationCount: "infinite",
		},
		transition: { duration: "200ms", delay: "0ms", timingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 600,
			letterSpacing: "0.02em",
			lineHeight: 1.5,
		},
		gradient:
			"linear-gradient(135deg, oklch(0.4 0.01 250) 0%, oklch(0.25 0.008 250) 50%, oklch(0.35 0.01 250) 100%)",
		color: "oklch(0.92 0.015 240)",
		borderRadius: "0.5rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.33 0.012 250)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.375rem",
					blur: "1.25rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.55)",
				},
				{
					offsetX: "0",
					offsetY: "0.0625rem",
					blur: "0.25rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.28)",
				},
			],
			border: { color: "oklch(0.65 0.025 250 / 0.5)" },
			gradient:
				"linear-gradient(135deg, oklch(0.43 0.012 250) 0%, oklch(0.28 0.01 250) 50%, oklch(0.38 0.012 250) 100%)",
		},
		active: {
			backgroundColor: "oklch(0.27 0.008 250)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.125rem",
					blur: "0.5rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.45)",
				},
			],
			gradient:
				"linear-gradient(135deg, oklch(0.35 0.008 250) 0%, oklch(0.22 0.006 250) 50%, oklch(0.3 0.008 250) 100%)",
		},
		disabled: {
			backgroundColor: "oklch(0.22 0.004 250)",
			opacity: 0.4,
			border: { color: "oklch(0.45 0.005 250 / 0.2)" },
			gradient: "none",
			animation: "none",
		},
	},
};

export const chromeDeep: PresetDefinition = {
	id: "chrome-deep",
	family: "chrome",
	variant: "deep",
	label: "Chrome Deep",
	description: "Dark chrome — gunmetal surface, deep reflections, heavy metal",
	axes: {
		backgroundColor: "oklch(0.15 0.008 260)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.375rem",
				blur: "1.25rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.6)",
			},
			{
				offsetX: "0",
				offsetY: "-0.0625rem",
				blur: "0",
				spread: "0",
				color: "oklch(0.5 0.01 260 / 0.1)",
				inset: true,
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.45 0.01 260 / 0.3)" },
		animation: "none",
		transition: { duration: "180ms", delay: "0ms", timingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 500,
			letterSpacing: "0.01em",
			lineHeight: 1.5,
		},
		gradient: "linear-gradient(160deg, oklch(0.22 0.01 260) 0%, oklch(0.12 0.005 260) 100%)",
		color: "oklch(0.8 0.01 250)",
		borderRadius: "0.5rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.18 0.01 260)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.5rem",
					blur: "1.5rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.65)",
				},
				{
					offsetX: "0",
					offsetY: "-0.0625rem",
					blur: "0",
					spread: "0",
					color: "oklch(0.55 0.012 260 / 0.15)",
					inset: true,
				},
			],
			border: { color: "oklch(0.5 0.012 260 / 0.4)" },
		},
		active: {
			backgroundColor: "oklch(0.12 0.006 260)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.125rem",
					blur: "0.5rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.5)",
				},
			],
		},
		disabled: {
			backgroundColor: "oklch(0.12 0.003 260)",
			opacity: 0.4,
			border: { color: "oklch(0.35 0.005 260 / 0.15)" },
			gradient: "none",
		},
	},
};

export const chromeMinimal: PresetDefinition = {
	id: "chrome-minimal",
	family: "chrome",
	variant: "minimal",
	label: "Chrome Minimal",
	description: "Brushed aluminum — subtle directional grain, matte metal",
	axes: {
		backgroundColor: "oklch(0.25 0.005 250)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.0625rem",
				blur: "0.25rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.3)",
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.5 0.005 250 / 0.2)" },
		animation: "none",
		transition: { duration: "150ms", delay: "0ms", timingFunction: "ease-out" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 400,
			letterSpacing: "0.01em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.8 0.008 250)",
		borderRadius: "0.375rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.28 0.007 250)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.125rem",
					blur: "0.375rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.35)",
				},
			],
			border: { color: "oklch(0.55 0.007 250 / 0.28)" },
		},
		active: {
			backgroundColor: "oklch(0.22 0.004 250)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.0625rem",
					blur: "0.125rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.25)",
				},
			],
		},
		disabled: {
			backgroundColor: "oklch(0.2 0.003 250)",
			opacity: 0.4,
			border: { color: "oklch(0.4 0.003 250 / 0.12)" },
			color: "oklch(0.55 0.004 250)",
		},
	},
};

export const chromeSolid: PresetDefinition = {
	id: "chrome-solid",
	family: "chrome",
	variant: "solid",
	label: "Chrome Solid",
	description: "Cast metal — dense, opaque, industrial steel plate",
	axes: {
		backgroundColor: "oklch(0.28 0.01 255)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.25rem",
				blur: "0.75rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.5)",
			},
			{
				offsetX: "0",
				offsetY: "0.0625rem",
				blur: "0.25rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.3)",
			},
		],
		border: { width: "0.125rem", style: "solid", color: "oklch(0.5 0.015 255 / 0.35)" },
		animation: "none",
		transition: { duration: "150ms", delay: "0ms", timingFunction: "cubic-bezier(0, 0, 0.2, 1)" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 600,
			letterSpacing: "0.02em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.9 0.01 250)",
		borderRadius: "0.375rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.31 0.012 255)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.375rem",
					blur: "1rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.55)",
				},
				{
					offsetX: "0",
					offsetY: "0.0625rem",
					blur: "0.375rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.32)",
				},
			],
			border: { color: "oklch(0.55 0.018 255 / 0.45)" },
		},
		active: {
			backgroundColor: "oklch(0.25 0.008 255)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.0625rem",
					blur: "0.25rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.4)",
				},
			],
		},
		disabled: {
			backgroundColor: "oklch(0.2 0.004 255)",
			opacity: 0.4,
			border: { color: "oklch(0.4 0.005 255 / 0.18)" },
			color: "oklch(0.6 0.005 250)",
		},
	},
};

export const chromeGlow: PresetDefinition = {
	id: "chrome-glow",
	family: "chrome",
	variant: "glow",
	label: "Chrome Glow",
	description: "Plasma chrome — ice-blue emission, electrified metal edge",
	axes: {
		backgroundColor: "oklch(0.2 0.02 250)",
		backgroundBlur: "0",
		shadow: [
			{ offsetX: "0", offsetY: "0.25rem", blur: "1rem", spread: "0", color: "oklch(0 0 0 / 0.45)" },
			{
				offsetX: "0",
				offsetY: "0",
				blur: "0.75rem",
				spread: "0",
				color: "oklch(0.7 0.12 240 / 0.2)",
			},
			{
				offsetX: "0",
				offsetY: "0",
				blur: "2rem",
				spread: "0",
				color: "oklch(0.7 0.12 240 / 0.08)",
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.7 0.12 240 / 0.35)" },
		animation: {
			name: "cl-glow-pulse",
			duration: "3s",
			timingFunction: "ease-in-out",
			iterationCount: "infinite",
		},
		transition: { duration: "250ms", delay: "0ms", timingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 600,
			letterSpacing: "0.02em",
			lineHeight: 1.5,
		},
		gradient: "linear-gradient(135deg, oklch(0.3 0.02 250) 0%, oklch(0.18 0.015 240) 100%)",
		color: "oklch(0.85 0.08 240)",
		borderRadius: "0.5rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.22 0.025 250)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.375rem",
					blur: "1.25rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.5)",
				},
				{
					offsetX: "0",
					offsetY: "0",
					blur: "1rem",
					spread: "0",
					color: "oklch(0.7 0.12 240 / 0.28)",
				},
				{
					offsetX: "0",
					offsetY: "0",
					blur: "2.5rem",
					spread: "0",
					color: "oklch(0.7 0.12 240 / 0.12)",
				},
			],
			border: { color: "oklch(0.75 0.14 240 / 0.45)" },
		},
		active: {
			backgroundColor: "oklch(0.17 0.018 250)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.125rem",
					blur: "0.5rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.4)",
				},
				{
					offsetX: "0",
					offsetY: "0",
					blur: "0.5rem",
					spread: "0",
					color: "oklch(0.7 0.12 240 / 0.12)",
				},
			],
		},
		disabled: {
			backgroundColor: "oklch(0.16 0.005 250)",
			opacity: 0.4,
			border: { color: "oklch(0.5 0.03 240 / 0.15)" },
			gradient: "none",
			animation: "none",
		},
	},
};

export const chromeMuted: PresetDefinition = {
	id: "chrome-muted",
	family: "chrome",
	variant: "muted",
	label: "Chrome Muted",
	description: "Tarnished metal — oxidized, desaturated, weathered chrome",
	axes: {
		backgroundColor: "oklch(0.2 0.003 250)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.0625rem",
				blur: "0.25rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.3)",
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.4 0.003 250 / 0.2)" },
		animation: "none",
		transition: { duration: "100ms", delay: "0ms", timingFunction: "ease-out" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 400,
			letterSpacing: "0.01em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.6 0.005 250)",
		borderRadius: "0.375rem",
		opacity: 0.75,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.22 0.005 250)",
			border: { color: "oklch(0.45 0.005 250 / 0.28)" },
			opacity: 0.85,
		},
		active: {
			backgroundColor: "oklch(0.18 0.003 250)",
			opacity: 0.7,
		},
		disabled: {
			backgroundColor: "oklch(0.17 0.002 250)",
			opacity: 0.35,
			color: "oklch(0.45 0.003 250)",
		},
	},
};

/** All CHROME presets */
export const CHROME_PRESETS: readonly PresetDefinition[] = [
	chromeElevated,
	chromeDeep,
	chromeMinimal,
	chromeSolid,
	chromeGlow,
	chromeMuted,
] as const;
