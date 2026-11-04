/**
 * @file RETRO preset family — thick retro pixelated widgets
 * @package @devpulse/coldlight
 *
 * Chunky borders, stepped corners, bold saturated colors, CRT glow,
 * 8-bit charm. Everything is thick, heavy, and unapologetically pixelated.
 * Transitions use steps() for discrete frame-by-frame movement.
 */

import type { PresetDefinition } from "../preset-definition.js";

export const retroElevated: PresetDefinition = {
	id: "retro-elevated",
	family: "retro",
	variant: "elevated",
	label: "Retro Elevated",
	description: "Raised retro widget — thick double border, CRT glow, bold color",
	axes: {
		backgroundColor: "oklch(0.304 0.08 280)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0.25rem",
				offsetY: "0.25rem",
				blur: "0",
				spread: "0",
				color: "oklch(0 0 0 / 0.8)",
			},
			{
				offsetX: "0",
				offsetY: "0",
				blur: "1rem",
				spread: "0",
				color: "oklch(0.65 0.2 300 / 0.15)",
			},
		],
		border: { width: "0.1875rem", style: "double", color: "oklch(0.75 0.18 300)" },
		animation: {
			name: "cl-crt-flicker",
			duration: "0.1s",
			timingFunction: "steps(2, end)",
			iterationCount: "infinite",
		},
		transition: { duration: "50ms", delay: "0ms", timingFunction: "steps(3, end)" },
		typography: {
			fontFamily: "{font.mono}",
			fontSize: "0.875rem",
			fontWeight: 700,
			letterSpacing: "0.05em",
			lineHeight: 1.4,
		},
		gradient: "none",
		color: "oklch(0.95 0.05 90)",
		borderRadius: "0.125rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.336 0.1 280)",
			shadow: [
				{
					offsetX: "0.1875rem",
					offsetY: "0.1875rem",
					blur: "0",
					spread: "0",
					color: "oklch(0 0 0 / 0.9)",
				},
				{
					offsetX: "0",
					offsetY: "0",
					blur: "1.25rem",
					spread: "0",
					color: "oklch(0.65 0.2 300 / 0.25)",
				},
			],
			border: { color: "oklch(0.85 0.2 300)" },
		},
		active: {
			backgroundColor: "oklch(0.272 0.06 280)",
			shadow: [
				{
					offsetX: "0.0625rem",
					offsetY: "0.0625rem",
					blur: "0",
					spread: "0",
					color: "oklch(0 0 0 / 0.9)",
				},
			],
		},
		disabled: { opacity: 0.4, color: "oklch(0.6 0.02 280)", animation: "none" },
	},
};

export const retroDeep: PresetDefinition = {
	id: "retro-deep",
	family: "retro",
	variant: "deep",
	label: "Retro Deep",
	description: "Inset retro — sunken pixel well, terminal green on black",
	axes: {
		backgroundColor: "oklch(0.196 0.03 150)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0.125rem",
				offsetY: "0.125rem",
				blur: "0",
				spread: "0",
				color: "oklch(0 0 0 / 0.9)",
				inset: true,
			},
			{
				offsetX: "-0.0625rem",
				offsetY: "-0.0625rem",
				blur: "0",
				spread: "0",
				color: "oklch(0.3 0.05 150 / 0.3)",
				inset: true,
			},
		],
		border: { width: "0.125rem", style: "solid", color: "oklch(0.6 0.2 150)" },
		animation: {
			name: "cl-scanline",
			duration: "8s",
			timingFunction: "linear",
			iterationCount: "infinite",
		},
		transition: { duration: "0ms", delay: "0ms", timingFunction: "steps(1, end)" },
		typography: {
			fontFamily: "{font.mono}",
			fontSize: "0.8125rem",
			fontWeight: 400,
			letterSpacing: "0.08em",
			lineHeight: 1.6,
		},
		gradient: "none",
		color: "oklch(0.8 0.2 150)",
		borderRadius: "0",
		opacity: 1,
	},
	states: {
		hover: { color: "oklch(0.9 0.25 150)", border: { color: "oklch(0.7 0.25 150)" } },
		active: { backgroundColor: "oklch(0.183 0.03 150)" },
		disabled: { opacity: 0.35, animation: "none", color: "oklch(0.4 0.08 150)" },
	},
};

export const retroMinimal: PresetDefinition = {
	id: "retro-minimal",
	family: "retro",
	variant: "minimal",
	label: "Retro Minimal",
	description: "Clean pixel — single solid border, flat color, no shadows",
	axes: {
		backgroundColor: "oklch(0.272 0.03 260)",
		backgroundBlur: "0",
		shadow: [],
		border: { width: "0.125rem", style: "solid", color: "oklch(0.6 0.1 260)" },
		animation: "none",
		transition: { duration: "0ms", delay: "0ms", timingFunction: "steps(1, end)" },
		typography: {
			fontFamily: "{font.mono}",
			fontSize: "0.875rem",
			fontWeight: 500,
			letterSpacing: "0.03em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.85 0.04 260)",
		borderRadius: "0.125rem",
		opacity: 1,
	},
	states: {
		hover: { backgroundColor: "oklch(0.304 0.04 260)", border: { color: "oklch(0.7 0.12 260)" } },
		active: { backgroundColor: "oklch(0.24 0.03 260)" },
		disabled: { opacity: 0.4, color: "oklch(0.5 0.02 260)" },
	},
};

export const retroSolid: PresetDefinition = {
	id: "retro-solid",
	family: "retro",
	variant: "solid",
	label: "Retro Solid",
	description: "Heavy retro block — saturated fill, thick border, hard pixel shadow",
	axes: {
		backgroundColor: "oklch(0.55 0.2 160)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0.25rem",
				offsetY: "0.25rem",
				blur: "0",
				spread: "0",
				color: "oklch(0.1 0.05 160)",
			},
		],
		border: { width: "0.1875rem", style: "solid", color: "oklch(0.35 0.15 160)" },
		animation: "none",
		transition: { duration: "50ms", delay: "0ms", timingFunction: "steps(2, end)" },
		typography: {
			fontFamily: "{font.mono}",
			fontSize: "0.875rem",
			fontWeight: 700,
			letterSpacing: "0.04em",
			lineHeight: 1.4,
		},
		gradient: "none",
		color: "oklch(0.98 0.01 90)",
		borderRadius: "0.125rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.6 0.22 160)",
			shadow: [
				{
					offsetX: "0.1875rem",
					offsetY: "0.1875rem",
					blur: "0",
					spread: "0",
					color: "oklch(0.1 0.05 160)",
				},
			],
		},
		active: {
			backgroundColor: "oklch(0.45 0.18 160)",
			shadow: [
				{
					offsetX: "0.0625rem",
					offsetY: "0.0625rem",
					blur: "0",
					spread: "0",
					color: "oklch(0.1 0.05 160)",
				},
			],
		},
		disabled: { opacity: 0.4, backgroundColor: "oklch(0.336 0.05 160)" },
	},
};

export const retroGlow: PresetDefinition = {
	id: "retro-glow",
	family: "retro",
	variant: "glow",
	label: "Retro Glow",
	description: "Neon CRT — glowing text, buzzing border, scanline energy",
	axes: {
		backgroundColor: "oklch(0.183 0.03 280)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0.1875rem",
				offsetY: "0.1875rem",
				blur: "0",
				spread: "0",
				color: "oklch(0 0 0 / 0.9)",
			},
			{
				offsetX: "0",
				offsetY: "0",
				blur: "0.5rem",
				spread: "0",
				color: "oklch(0.75 0.25 330 / 0.4)",
			},
			{
				offsetX: "0",
				offsetY: "0",
				blur: "1.5rem",
				spread: "0",
				color: "oklch(0.75 0.25 330 / 0.15)",
			},
		],
		border: { width: "0.125rem", style: "solid", color: "oklch(0.75 0.25 330)" },
		animation: {
			name: "cl-neon-buzz",
			duration: "0.15s",
			timingFunction: "steps(3, end)",
			iterationCount: "infinite",
		},
		transition: { duration: "50ms", delay: "0ms", timingFunction: "steps(4, end)" },
		typography: {
			fontFamily: "{font.mono}",
			fontSize: "0.875rem",
			fontWeight: 700,
			letterSpacing: "0.06em",
			lineHeight: 1.4,
		},
		gradient: "none",
		color: "oklch(0.9 0.2 330)",
		borderRadius: "0",
		opacity: 1,
	},
	states: {
		hover: {
			shadow: [
				{
					offsetX: "0.1875rem",
					offsetY: "0.1875rem",
					blur: "0",
					spread: "0",
					color: "oklch(0 0 0 / 0.9)",
				},
				{
					offsetX: "0",
					offsetY: "0",
					blur: "0.75rem",
					spread: "0.0625rem",
					color: "oklch(0.8 0.28 330 / 0.5)",
				},
				{
					offsetX: "0",
					offsetY: "0",
					blur: "2rem",
					spread: "0",
					color: "oklch(0.8 0.28 330 / 0.2)",
				},
			],
			color: "oklch(0.95 0.25 330)",
			border: { color: "oklch(0.85 0.28 330)" },
		},
		active: { backgroundColor: "oklch(0.208 0.03 330)" },
		disabled: { opacity: 0.3, animation: "none", color: "oklch(0.4 0.05 330)" },
	},
};

export const retroMuted: PresetDefinition = {
	id: "retro-muted",
	family: "retro",
	variant: "muted",
	label: "Retro Muted",
	description: "Faded retro — desaturated CRT, ghosted pixels, worn terminal",
	axes: {
		backgroundColor: "oklch(0.24 0.03 200)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0.125rem",
				offsetY: "0.125rem",
				blur: "0",
				spread: "0",
				color: "oklch(0 0 0 / 0.5)",
			},
		],
		border: { width: "0.125rem", style: "solid", color: "oklch(0.4 0.02 200 / 0.5)" },
		animation: "none",
		transition: { duration: "0ms", delay: "0ms", timingFunction: "steps(1, end)" },
		typography: {
			fontFamily: "{font.mono}",
			fontSize: "0.8125rem",
			fontWeight: 400,
			letterSpacing: "0.04em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.55 0.02 200)",
		borderRadius: "0.125rem",
		opacity: 0.7,
	},
	states: {
		hover: { opacity: 0.85, color: "oklch(0.65 0.03 200)" },
		disabled: { opacity: 0.3, color: "oklch(0.35 0.01 200)" },
	},
};

/** All RETRO presets */
export const RETRO_PRESETS: readonly PresetDefinition[] = [
	retroElevated,
	retroDeep,
	retroMinimal,
	retroSolid,
	retroGlow,
	retroMuted,
] as const;
