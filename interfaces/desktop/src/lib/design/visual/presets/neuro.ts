/**
 * @file NEURO preset family — neumorphic depth
 * @package @devpulse/coldlight
 *
 * Carved surfaces, inset shadows, dual-layer shadow stacks, highlight rims.
 * The hero visual of DevPulse — every demo, every screenshot, every first impression.
 */

import type { PresetDefinition } from "../preset-definition.js";

export const neuroElevated: PresetDefinition = {
	id: "neuro-elevated",
	family: "neuro",
	variant: "elevated",
	label: "Neuro Elevated",
	description: "Raised neumorphic surface — carved out of the void with teal accent glow",
	axes: {
		backgroundColor: "oklch(0.18 0.015 240)",
		backgroundBlur: "0",
		shadow: [
			{ offsetX: "0", offsetY: "0.25rem", blur: "1rem", spread: "0", color: "oklch(0 0 0 / 0.5)" },
			{
				offsetX: "0",
				offsetY: "0.125rem",
				blur: "0.25rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.3)",
			},
			{
				offsetX: "0",
				offsetY: "-0.0625rem",
				blur: "0",
				spread: "0",
				color: "oklch(1 0 0 / 0.06)",
				inset: true,
			},
			{
				offsetX: "0",
				offsetY: "0.125rem",
				blur: "0.5rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.4)",
				inset: true,
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.55 0.1 180 / 0.2)" },
		animation: {
			name: "cl-breathe",
			duration: "4s",
			timingFunction: "ease-in-out",
			iterationCount: "infinite",
		},
		transition: { duration: "150ms", delay: "0ms", timingFunction: "cubic-bezier(0, 0, 0.2, 1)" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 500,
			letterSpacing: "0em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.93 0.015 224)",
		borderRadius: "0.75rem",
		opacity: 1,
	},
	states: {
		hover: {
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
					blur: "0.5rem",
					spread: "0",
					color: "oklch(0.7 0.15 180 / 0.1)",
				},
				{
					offsetX: "0",
					offsetY: "-0.0625rem",
					blur: "0",
					spread: "0",
					color: "oklch(1 0 0 / 0.08)",
					inset: true,
				},
			],
			border: { color: "oklch(0.6 0.12 180 / 0.3)" },
		},
		active: {
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.0625rem",
					blur: "0.25rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.4)",
				},
				{
					offsetX: "0",
					offsetY: "0.1875rem",
					blur: "0.75rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.5)",
					inset: true,
				},
			],
			backgroundColor: "oklch(0.16 0.015 240)",
		},
		disabled: { opacity: 0.45, color: "oklch(0.6 0.005 224)" },
	},
};

export const neuroDeep: PresetDefinition = {
	id: "neuro-deep",
	family: "neuro",
	variant: "deep",
	label: "Neuro Deep",
	description: "Deeply recessed surface — sunken into the void with heavy inset shadows",
	axes: {
		backgroundColor: "oklch(0.12 0.012 240)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.25rem",
				blur: "1.5rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.6)",
				inset: true,
			},
			{
				offsetX: "0",
				offsetY: "-0.125rem",
				blur: "0.5rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.4)",
				inset: true,
			},
			{
				offsetX: "0",
				offsetY: "-0.0625rem",
				blur: "0",
				spread: "0",
				color: "oklch(1 0 0 / 0.04)",
				inset: true,
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.3 0.02 240 / 0.3)" },
		animation: "none",
		transition: { duration: "150ms", delay: "0ms", timingFunction: "cubic-bezier(0, 0, 0.2, 1)" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 400,
			letterSpacing: "0em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.85 0.01 224)",
		borderRadius: "0.75rem",
		opacity: 1,
	},
	states: {
		hover: { backgroundColor: "oklch(0.14 0.014 240)" },
		active: { backgroundColor: "oklch(0.1 0.01 240)" },
		disabled: { opacity: 0.4, color: "oklch(0.55 0.005 224)" },
	},
};

export const neuroMinimal: PresetDefinition = {
	id: "neuro-minimal",
	family: "neuro",
	variant: "minimal",
	label: "Neuro Minimal",
	description: "Subtle neumorphic — barely raised, whisper shadows, restrained",
	axes: {
		backgroundColor: "oklch(0.16 0.01 240)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.0625rem",
				blur: "0.25rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.3)",
			},
			{
				offsetX: "0",
				offsetY: "-0.0625rem",
				blur: "0",
				spread: "0",
				color: "oklch(1 0 0 / 0.04)",
				inset: true,
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.4 0.01 240 / 0.15)" },
		animation: "none",
		transition: { duration: "120ms", delay: "0ms", timingFunction: "ease-out" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 400,
			letterSpacing: "0em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.8 0.008 224)",
		borderRadius: "0.5rem",
		opacity: 1,
	},
	states: {
		hover: { backgroundColor: "oklch(0.18 0.012 240)" },
		active: { backgroundColor: "oklch(0.14 0.008 240)" },
		disabled: { opacity: 0.4, color: "oklch(0.55 0.005 224)" },
	},
};

export const neuroSolid: PresetDefinition = {
	id: "neuro-solid",
	family: "neuro",
	variant: "solid",
	label: "Neuro Solid",
	description: "Dense neumorphic — opaque surface, heavy shadows, no translucency",
	axes: {
		backgroundColor: "oklch(0.2 0.018 240)",
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
			{
				offsetX: "0",
				offsetY: "-0.0625rem",
				blur: "0",
				spread: "0",
				color: "oklch(1 0 0 / 0.08)",
				inset: true,
			},
			{
				offsetX: "0",
				offsetY: "0.1875rem",
				blur: "0.625rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.3)",
				inset: true,
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.5 0.06 180 / 0.25)" },
		animation: "none",
		transition: { duration: "150ms", delay: "0ms", timingFunction: "cubic-bezier(0, 0, 0.2, 1)" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 500,
			letterSpacing: "0.01em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.95 0.015 224)",
		borderRadius: "0.75rem",
		opacity: 1,
	},
	states: {
		hover: {
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
					offsetY: "-0.0625rem",
					blur: "0",
					spread: "0",
					color: "oklch(1 0 0 / 0.1)",
					inset: true,
				},
			],
		},
		active: { backgroundColor: "oklch(0.18 0.016 240)" },
		disabled: { opacity: 0.4, color: "oklch(0.6 0.005 224)" },
	},
};

export const neuroGlow: PresetDefinition = {
	id: "neuro-glow",
	family: "neuro",
	variant: "glow",
	label: "Neuro Glow",
	description: "Neumorphic with teal emission — glowing borders and accent shadow layers",
	axes: {
		backgroundColor: "oklch(0.16 0.02 220)",
		backgroundBlur: "0",
		shadow: [
			{ offsetX: "0", offsetY: "0.25rem", blur: "1rem", spread: "0", color: "oklch(0 0 0 / 0.45)" },
			{
				offsetX: "0",
				offsetY: "0",
				blur: "0.75rem",
				spread: "0",
				color: "oklch(0.7 0.15 180 / 0.2)",
			},
			{
				offsetX: "0",
				offsetY: "0",
				blur: "1.5rem",
				spread: "0",
				color: "oklch(0.7 0.15 180 / 0.1)",
			},
			{
				offsetX: "0",
				offsetY: "-0.0625rem",
				blur: "0",
				spread: "0",
				color: "oklch(0.7 0.12 180 / 0.15)",
				inset: true,
			},
			{
				offsetX: "0",
				offsetY: "0.125rem",
				blur: "0.5rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.35)",
				inset: true,
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.7 0.15 180 / 0.35)" },
		animation: {
			name: "cl-glow-pulse",
			duration: "3s",
			timingFunction: "ease-in-out",
			iterationCount: "infinite",
		},
		transition: { duration: "200ms", delay: "0ms", timingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 500,
			letterSpacing: "0em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.9 0.06 180)",
		borderRadius: "0.75rem",
		opacity: 1,
	},
	states: {
		hover: {
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.25rem",
					blur: "1rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.4)",
				},
				{
					offsetX: "0",
					offsetY: "0",
					blur: "1rem",
					spread: "0.125rem",
					color: "oklch(0.7 0.15 180 / 0.3)",
				},
				{
					offsetX: "0",
					offsetY: "0",
					blur: "2rem",
					spread: "0",
					color: "oklch(0.7 0.15 180 / 0.15)",
				},
			],
			border: { color: "oklch(0.75 0.18 180 / 0.5)" },
		},
		active: {
			backgroundColor: "oklch(0.14 0.025 220)",
			border: { color: "oklch(0.8 0.2 180 / 0.6)" },
		},
		disabled: { opacity: 0.35, animation: "none", color: "oklch(0.5 0.02 180)" },
	},
};

export const neuroMuted: PresetDefinition = {
	id: "neuro-muted",
	family: "neuro",
	variant: "muted",
	label: "Neuro Muted",
	description: "Desaturated neumorphic — dimmed surface for secondary/disabled states",
	axes: {
		backgroundColor: "oklch(0.14 0.005 240)",
		backgroundBlur: "0",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.0625rem",
				blur: "0.375rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.25)",
			},
			{
				offsetX: "0",
				offsetY: "-0.0625rem",
				blur: "0",
				spread: "0",
				color: "oklch(1 0 0 / 0.03)",
				inset: true,
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.35 0.005 240 / 0.2)" },
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
		color: "oklch(0.65 0.005 224)",
		borderRadius: "0.5rem",
		opacity: 0.8,
	},
	states: {
		hover: { backgroundColor: "oklch(0.16 0.008 240)", opacity: 0.9 },
		disabled: { opacity: 0.3, color: "oklch(0.45 0.003 224)" },
	},
};

/** All NEURO presets */
export const NEURO_PRESETS: readonly PresetDefinition[] = [
	neuroElevated,
	neuroDeep,
	neuroMinimal,
	neuroSolid,
	neuroGlow,
	neuroMuted,
] as const;
