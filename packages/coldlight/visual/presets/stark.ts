/**
 * @file STARK preset family — maximum contrast, bold presence
 * @package @devpulse/coldlight
 *
 * Maximum contrast, bold shadows, thick borders, commanding presence.
 * Executive, bold, dramatic. NOT playful — this is the authority preset.
 */

import type { PresetDefinition } from "../preset-definition.js";

export const starkElevated: PresetDefinition = {
	id: "stark-elevated",
	family: "stark",
	variant: "elevated",
	label: "Stark Elevated",
	description: "Command presence — high contrast, bold border, heavy shadow lift",
	axes: {
		backgroundColor: "oklch(0.1 0.015 250)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.5rem",
				blur: "2rem",
				spread: "-0.125rem",
				color: "oklch(0 0 0 / 0.6)",
			},
			{
				offsetX: "0",
				offsetY: "0.125rem",
				blur: "0.5rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.35)",
			},
		],
		border: { width: "0.125rem", style: "solid", color: "oklch(0.85 0.02 250)" },
		animation: "none",
		transition: { duration: "100ms", delay: "0ms", timingFunction: "cubic-bezier(0, 0, 0.2, 1)" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 700,
			letterSpacing: "0.02em",
			lineHeight: 1.4,
		},
		gradient: "none",
		color: "oklch(0.97 0.005 250)",
		borderRadius: "0.375rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.13 0.018 250)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.625rem",
					blur: "2.5rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.65)",
				},
				{
					offsetX: "0",
					offsetY: "0.125rem",
					blur: "0.625rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.38)",
				},
			],
			border: { color: "oklch(0.9 0.025 250)" },
		},
		active: {
			backgroundColor: "oklch(0.08 0.012 250)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.125rem",
					blur: "0.5rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.5)",
				},
			],
			border: { color: "oklch(0.8 0.018 250)" },
		},
		disabled: {
			backgroundColor: "oklch(0.08 0.004 250)",
			opacity: 0.4,
			border: { color: "oklch(0.45 0.005 250)" },
			color: "oklch(0.6 0.003 250)",
		},
	},
};

export const starkDeep: PresetDefinition = {
	id: "stark-deep",
	family: "stark",
	variant: "deep",
	label: "Stark Deep",
	description: "Void authority — near-black with bright accent border, severe",
	axes: {
		backgroundColor: "oklch(0.06 0.01 260)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.375rem",
				blur: "1.5rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.7)",
			},
			{
				offsetX: "0",
				offsetY: "0.125rem",
				blur: "0.375rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.4)",
			},
		],
		border: { width: "0.125rem", style: "solid", color: "oklch(0.75 0.1 180)" },
		animation: "none",
		transition: { duration: "100ms", delay: "0ms", timingFunction: "cubic-bezier(0, 0, 0.2, 1)" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 600,
			letterSpacing: "0.01em",
			lineHeight: 1.4,
		},
		gradient: "none",
		color: "oklch(0.92 0.04 180)",
		borderRadius: "0.25rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.09 0.013 260)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.5rem",
					blur: "1.75rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.75)",
				},
				{
					offsetX: "0",
					offsetY: "0.125rem",
					blur: "0.5rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.45)",
				},
			],
			border: { color: "oklch(0.8 0.12 180)" },
		},
		active: {
			backgroundColor: "oklch(0.04 0.008 260)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.0625rem",
					blur: "0.375rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.6)",
				},
			],
			border: { color: "oklch(0.7 0.09 180)" },
		},
		disabled: {
			backgroundColor: "oklch(0.05 0.003 260)",
			opacity: 0.4,
			border: { color: "oklch(0.4 0.02 180)" },
			color: "oklch(0.55 0.01 180)",
		},
	},
};

export const starkMinimal: PresetDefinition = {
	id: "stark-minimal",
	family: "stark",
	variant: "minimal",
	label: "Stark Minimal",
	description: "Clean authority — thin bright border, dark field, precise",
	axes: {
		backgroundColor: "oklch(0.1 0.008 250)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.0625rem",
				blur: "0.375rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.35)",
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.7 0.01 250 / 0.5)" },
		animation: "none",
		transition: { duration: "80ms", delay: "0ms", timingFunction: "ease-out" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 500,
			letterSpacing: "0.01em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.88 0.008 250)",
		borderRadius: "0.25rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.13 0.01 250)",
			border: { color: "oklch(0.78 0.015 250 / 0.6)" },
		},
		active: {
			backgroundColor: "oklch(0.08 0.006 250)",
			border: { color: "oklch(0.65 0.008 250 / 0.45)" },
		},
		disabled: {
			backgroundColor: "oklch(0.08 0.003 250)",
			opacity: 0.4,
			border: { color: "oklch(0.4 0.004 250 / 0.2)" },
			color: "oklch(0.55 0.004 250)",
		},
	},
};

export const starkSolid: PresetDefinition = {
	id: "stark-solid",
	family: "stark",
	variant: "solid",
	label: "Stark Solid",
	description: "Monolith — dense opaque block, ultra-bold, imposing",
	axes: {
		backgroundColor: "oklch(0.14 0.02 260)",
		backgroundBlur: "0",
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
				offsetY: "0.125rem",
				blur: "0.375rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.35)",
			},
		],
		border: { width: "0.1875rem", style: "solid", color: "oklch(0.8 0.015 260)" },
		animation: "none",
		transition: { duration: "100ms", delay: "0ms", timingFunction: "cubic-bezier(0, 0, 0.2, 1)" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 700,
			letterSpacing: "0.03em",
			lineHeight: 1.4,
		},
		gradient: "none",
		color: "oklch(0.97 0.005 260)",
		borderRadius: "0.25rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.17 0.023 260)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.5rem",
					blur: "1.5rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.6)",
				},
				{
					offsetX: "0",
					offsetY: "0.125rem",
					blur: "0.5rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.38)",
				},
			],
			border: { color: "oklch(0.85 0.018 260)" },
		},
		active: {
			backgroundColor: "oklch(0.11 0.018 260)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.0625rem",
					blur: "0.375rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.45)",
				},
			],
			border: { color: "oklch(0.75 0.012 260)" },
		},
		disabled: {
			backgroundColor: "oklch(0.1 0.005 260)",
			opacity: 0.4,
			border: { color: "oklch(0.45 0.005 260)" },
			color: "oklch(0.6 0.003 260)",
		},
	},
};

export const starkGlow: PresetDefinition = {
	id: "stark-glow",
	family: "stark",
	variant: "glow",
	label: "Stark Glow",
	description: "Alert presence — danger/warning accent glow, demands attention",
	axes: {
		backgroundColor: "oklch(0.12 0.03 25)",
		backgroundBlur: "0",
		shadow: [
			{ offsetX: "0", offsetY: "0.25rem", blur: "1rem", spread: "0", color: "oklch(0 0 0 / 0.5)" },
			{
				offsetX: "0",
				offsetY: "0",
				blur: "0.75rem",
				spread: "0",
				color: "oklch(0.65 0.22 25 / 0.25)",
			},
			{ offsetX: "0", offsetY: "0", blur: "2rem", spread: "0", color: "oklch(0.65 0.22 25 / 0.1)" },
		],
		border: { width: "0.125rem", style: "solid", color: "oklch(0.65 0.22 25 / 0.6)" },
		animation: {
			name: "cl-alert-pulse",
			duration: "2s",
			timingFunction: "ease-in-out",
			iterationCount: "infinite",
		},
		transition: { duration: "120ms", delay: "0ms", timingFunction: "cubic-bezier(0, 0, 0.2, 1)" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 600,
			letterSpacing: "0.01em",
			lineHeight: 1.4,
		},
		gradient: "none",
		color: "oklch(0.92 0.08 25)",
		borderRadius: "0.375rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.15 0.035 25)",
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
					offsetY: "0",
					blur: "1rem",
					spread: "0",
					color: "oklch(0.65 0.22 25 / 0.35)",
				},
				{
					offsetX: "0",
					offsetY: "0",
					blur: "2.5rem",
					spread: "0",
					color: "oklch(0.65 0.22 25 / 0.15)",
				},
			],
			border: { color: "oklch(0.7 0.25 25 / 0.7)" },
		},
		active: {
			backgroundColor: "oklch(0.1 0.025 25)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.125rem",
					blur: "0.5rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.45)",
				},
				{
					offsetX: "0",
					offsetY: "0",
					blur: "0.5rem",
					spread: "0",
					color: "oklch(0.65 0.22 25 / 0.15)",
				},
			],
			border: { color: "oklch(0.6 0.2 25 / 0.5)" },
		},
		disabled: {
			backgroundColor: "oklch(0.08 0.008 25)",
			opacity: 0.4,
			border: { color: "oklch(0.4 0.05 25 / 0.25)" },
			color: "oklch(0.55 0.02 25)",
			animation: "none",
		},
	},
};

export const starkMuted: PresetDefinition = {
	id: "stark-muted",
	family: "stark",
	variant: "muted",
	label: "Stark Muted",
	description: "Dimmed authority — faded border, reduced contrast, secondary",
	axes: {
		backgroundColor: "oklch(0.1 0.005 250)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.0625rem",
				blur: "0.25rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.25)",
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.5 0.005 250 / 0.25)" },
		animation: "none",
		transition: { duration: "80ms", delay: "0ms", timingFunction: "ease-out" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 400,
			letterSpacing: "0.01em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.6 0.005 250)",
		borderRadius: "0.25rem",
		opacity: 0.7,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.12 0.007 250)",
			border: { color: "oklch(0.55 0.008 250 / 0.35)" },
			opacity: 0.8,
		},
		active: {
			backgroundColor: "oklch(0.08 0.004 250)",
			opacity: 0.65,
		},
		disabled: {
			backgroundColor: "oklch(0.08 0.003 250)",
			opacity: 0.3,
			border: { color: "oklch(0.35 0.003 250 / 0.12)" },
			color: "oklch(0.4 0.003 250)",
		},
	},
};

/** All STARK presets */
export const STARK_PRESETS: readonly PresetDefinition[] = [
	starkElevated,
	starkDeep,
	starkMinimal,
	starkSolid,
	starkGlow,
	starkMuted,
] as const;
