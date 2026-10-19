/**
 * @file GLASS preset family — frosted translucent panels
 * @package @devpulse/coldlight
 *
 * Real backdrop-blur (8-16px minimum), multi-layer opacity, frosted glass
 * over dark backgrounds. Readable text OVER the glass. Teal/white borders
 * at low opacity.
 */

import type { PresetDefinition } from "../preset-definition.js";

export const glassElevated: PresetDefinition = {
	id: "glass-elevated",
	family: "glass",
	variant: "elevated",
	label: "Glass Elevated",
	description: "Raised frosted glass — bright blur, teal-tinted border, floating",
	axes: {
		backgroundColor: "oklch(0.25 0.02 220 / 0.4)",
		backgroundBlur: "1rem",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.5rem",
				blur: "2rem",
				spread: "-0.25rem",
				color: "oklch(0 0 0 / 0.4)",
			},
			{
				offsetX: "0",
				offsetY: "0.125rem",
				blur: "0.375rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.2)",
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.8 0.08 180 / 0.2)" },
		animation: {
			name: "cl-shimmer",
			duration: "4s",
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
		color: "oklch(0.95 0.01 220)",
		borderRadius: "1rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.28 0.025 220 / 0.45)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.625rem",
					blur: "2.5rem",
					spread: "-0.125rem",
					color: "oklch(0 0 0 / 0.45)",
				},
				{
					offsetX: "0",
					offsetY: "0.125rem",
					blur: "0.5rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.22)",
				},
			],
			border: { color: "oklch(0.85 0.1 180 / 0.3)" },
		},
		active: {
			backgroundColor: "oklch(0.22 0.018 220 / 0.5)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.25rem",
					blur: "1rem",
					spread: "-0.25rem",
					color: "oklch(0 0 0 / 0.35)",
				},
			],
		},
		disabled: {
			backgroundColor: "oklch(0.2 0.005 220 / 0.2)",
			opacity: 0.4,
			border: { color: "oklch(0.5 0.02 220 / 0.1)" },
			animation: "none",
		},
	},
};

export const glassDeep: PresetDefinition = {
	id: "glass-deep",
	family: "glass",
	variant: "deep",
	label: "Glass Deep",
	description: "Deep frosted glass — heavy blur, dark tint, submerged look",
	axes: {
		backgroundColor: "oklch(0.12 0.025 220 / 0.6)",
		backgroundBlur: "1.5rem",
		shadow: [
			{ offsetX: "0", offsetY: "0.25rem", blur: "1rem", spread: "0", color: "oklch(0 0 0 / 0.5)" },
			{
				offsetX: "0",
				offsetY: "0.0625rem",
				blur: "0.125rem",
				spread: "0",
				color: "oklch(1 0 0 / 0.04)",
				inset: true,
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.5 0.06 200 / 0.15)" },
		animation: "none",
		transition: { duration: "200ms", delay: "0ms", timingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 400,
			letterSpacing: "0em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.88 0.015 220)",
		borderRadius: "0.75rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.15 0.03 220 / 0.65)",
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
					blur: "0.125rem",
					spread: "0",
					color: "oklch(1 0 0 / 0.06)",
					inset: true,
				},
			],
			border: { color: "oklch(0.55 0.07 200 / 0.22)" },
		},
		active: {
			backgroundColor: "oklch(0.1 0.02 220 / 0.7)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.125rem",
					blur: "0.5rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.45)",
				},
			],
		},
		disabled: {
			backgroundColor: "oklch(0.12 0.005 220 / 0.3)",
			opacity: 0.35,
			border: { color: "oklch(0.4 0.01 220 / 0.08)" },
		},
	},
};

export const glassMinimal: PresetDefinition = {
	id: "glass-minimal",
	family: "glass",
	variant: "minimal",
	label: "Glass Minimal",
	description: "Whisper glass — barely visible surface, light blur, nearly transparent",
	axes: {
		backgroundColor: "oklch(0.3 0.01 220 / 0.15)",
		backgroundBlur: "0.5rem",
		shadow: [],
		border: { width: "0.0625rem", style: "solid", color: "oklch(1 0 0 / 0.08)" },
		animation: "none",
		transition: { duration: "150ms", delay: "0ms", timingFunction: "ease-out" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 400,
			letterSpacing: "0em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.82 0.01 220)",
		borderRadius: "0.5rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.33 0.015 220 / 0.2)",
			border: { color: "oklch(1 0 0 / 0.14)" },
		},
		active: {
			backgroundColor: "oklch(0.27 0.008 220 / 0.22)",
		},
		disabled: {
			backgroundColor: "oklch(0.25 0.005 220 / 0.08)",
			opacity: 0.35,
			color: "oklch(0.6 0.005 220)",
		},
	},
};

export const glassSolid: PresetDefinition = {
	id: "glass-solid",
	family: "glass",
	variant: "solid",
	label: "Glass Solid",
	description: "Opaque glass — frosted texture but no see-through, dense blur",
	axes: {
		backgroundColor: "oklch(0.18 0.02 220 / 0.85)",
		backgroundBlur: "2rem",
		shadow: [
			{
				offsetX: "0",
				offsetY: "0.25rem",
				blur: "0.75rem",
				spread: "0",
				color: "oklch(0 0 0 / 0.35)",
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.6 0.05 200 / 0.2)" },
		animation: "none",
		transition: { duration: "180ms", delay: "0ms", timingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" },
		typography: {
			fontFamily: "{font.sans}",
			fontSize: "0.875rem",
			fontWeight: 500,
			letterSpacing: "0em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.92 0.012 220)",
		borderRadius: "0.75rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.2 0.025 220 / 0.88)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.375rem",
					blur: "1rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.4)",
				},
			],
			border: { color: "oklch(0.65 0.06 200 / 0.28)" },
		},
		active: {
			backgroundColor: "oklch(0.16 0.018 220 / 0.9)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.125rem",
					blur: "0.375rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.3)",
				},
			],
		},
		disabled: {
			backgroundColor: "oklch(0.15 0.005 220 / 0.5)",
			opacity: 0.4,
			border: { color: "oklch(0.4 0.01 220 / 0.1)" },
		},
	},
};

export const glassGlow: PresetDefinition = {
	id: "glass-glow",
	family: "glass",
	variant: "glow",
	label: "Glass Glow",
	description: "Glowing glass — teal emission through frosted surface, ethereal",
	axes: {
		backgroundColor: "oklch(0.18 0.04 190 / 0.35)",
		backgroundBlur: "1rem",
		shadow: [
			{ offsetX: "0", offsetY: "0.25rem", blur: "1rem", spread: "0", color: "oklch(0 0 0 / 0.4)" },
			{
				offsetX: "0",
				offsetY: "0",
				blur: "1rem",
				spread: "0",
				color: "oklch(0.7 0.15 180 / 0.15)",
			},
			{
				offsetX: "0",
				offsetY: "0",
				blur: "2.5rem",
				spread: "0",
				color: "oklch(0.7 0.15 180 / 0.08)",
			},
		],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.7 0.15 180 / 0.3)" },
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
			fontWeight: 500,
			letterSpacing: "0em",
			lineHeight: 1.5,
		},
		gradient: "none",
		color: "oklch(0.88 0.06 180)",
		borderRadius: "0.75rem",
		opacity: 1,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.2 0.05 190 / 0.4)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.375rem",
					blur: "1.25rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.45)",
				},
				{
					offsetX: "0",
					offsetY: "0",
					blur: "1.25rem",
					spread: "0",
					color: "oklch(0.7 0.15 180 / 0.22)",
				},
				{
					offsetX: "0",
					offsetY: "0",
					blur: "3rem",
					spread: "0",
					color: "oklch(0.7 0.15 180 / 0.12)",
				},
			],
			border: { color: "oklch(0.75 0.18 180 / 0.4)" },
		},
		active: {
			backgroundColor: "oklch(0.15 0.035 190 / 0.45)",
			shadow: [
				{
					offsetX: "0",
					offsetY: "0.125rem",
					blur: "0.5rem",
					spread: "0",
					color: "oklch(0 0 0 / 0.35)",
				},
				{
					offsetX: "0",
					offsetY: "0",
					blur: "0.75rem",
					spread: "0",
					color: "oklch(0.7 0.15 180 / 0.1)",
				},
			],
		},
		disabled: {
			backgroundColor: "oklch(0.15 0.01 190 / 0.2)",
			opacity: 0.35,
			border: { color: "oklch(0.5 0.03 180 / 0.1)" },
			animation: "none",
		},
	},
};

export const glassMuted: PresetDefinition = {
	id: "glass-muted",
	family: "glass",
	variant: "muted",
	label: "Glass Muted",
	description: "Dimmed glass — faded frost for disabled/secondary states",
	axes: {
		backgroundColor: "oklch(0.2 0.005 220 / 0.2)",
		backgroundBlur: "0.375rem",
		shadow: [],
		border: { width: "0.0625rem", style: "solid", color: "oklch(0.5 0.005 220 / 0.1)" },
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
		color: "oklch(0.6 0.005 220)",
		borderRadius: "0.5rem",
		opacity: 0.7,
	},
	states: {
		hover: {
			backgroundColor: "oklch(0.22 0.008 220 / 0.25)",
			border: { color: "oklch(0.55 0.008 220 / 0.15)" },
			opacity: 0.8,
		},
		active: {
			backgroundColor: "oklch(0.18 0.004 220 / 0.25)",
			opacity: 0.65,
		},
		disabled: {
			backgroundColor: "oklch(0.18 0.003 220 / 0.1)",
			opacity: 0.3,
			color: "oklch(0.45 0.003 220)",
		},
	},
};

/** All GLASS presets */
export const GLASS_PRESETS: readonly PresetDefinition[] = [
	glassElevated,
	glassDeep,
	glassMinimal,
	glassSolid,
	glassGlow,
	glassMuted,
] as const;
