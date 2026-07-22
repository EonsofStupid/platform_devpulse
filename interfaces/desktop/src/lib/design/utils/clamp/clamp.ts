/**
 * @file clamp — Parameterized CSS clamp() generator from design tokens.
 *
 * Produces CSS `clamp(min, preferred, max)` expressions using
 * SD5-generated rem values. All inputs reference the token scale.
 *
 * Breakpoints: --breakpoint-xs (320px) through --breakpoint-2xl (1536px)
 * Space: --space-0 (0) through --space-128 (8rem)
 * Size: --size-3xs (1rem) through --size-container-2xl (96rem)
 */

import type { PaddingToken, SizeToken, SpaceToken } from "$lib/design/generated/types/spacing.js";

/** DTCG-typed CSS custom property for space tokens. */
export type SpaceCSSProperty = `--space-${SpaceToken}`;
/** DTCG-typed CSS custom property for size tokens. */
export type SizeCSSProperty = `--size-${SizeToken}`;
/** DTCG-typed CSS custom property for padding tokens. */
export type PaddingCSSProperty = `--padding-${PaddingToken}`;

/**
 * Generate a CSS clamp() from token custom property names or raw values.
 */
export function clampValue(min: string, preferred: string, max: string): string {
	const minVal = min.startsWith("--") ? `var(${min})` : min;
	const maxVal = max.startsWith("--") ? `var(${max})` : max;
	return `clamp(${minVal}, ${preferred}, ${maxVal})`;
}

/**
 * Generate a fluid clamp() that scales linearly between two viewport widths.
 *
 * @param minToken - CSS custom property or raw value for minimum
 * @param maxToken - CSS custom property or raw value for maximum
 * @param minVwPx - Viewport width where min applies (default 320)
 * @param maxVwPx - Viewport width where max applies (default 1536)
 */
export function clampFluid(
	minToken: string,
	maxToken: string,
	minVwPx: number = 320,
	maxVwPx: number = 1536,
): string {
	const minVal = minToken.startsWith("--") ? `var(${minToken})` : minToken;
	const maxVal = maxToken.startsWith("--") ? `var(${maxToken})` : maxToken;
	const vwRange = maxVwPx - minVwPx;
	const preferred = `calc(${minVal} + (100vw - ${minVwPx}px) / ${vwRange} * (${maxVal} - ${minVal}))`;
	return `clamp(${minVal}, ${preferred}, ${maxVal})`;
}

/**
 * Fluid space presets — parameterized responsive spacing.
 * Each scales linearly from breakpoint-xs (320px) to breakpoint-2xl (1536px).
 * Inputs reference DTCG SpaceToken values via CSS custom properties.
 */
export const FLUID_SPACE = {
	"3xs": clampFluid("--space-2", "--space-4"),
	"2xs": clampFluid("--space-4", "--space-8"),
	xs: clampFluid("--space-6", "--space-12"),
	sm: clampFluid("--space-8", "--space-16"),
	md: clampFluid("--space-12", "--space-24"),
	lg: clampFluid("--space-16", "--space-32"),
	xl: clampFluid("--space-24", "--space-48"),
	"2xl": clampFluid("--space-32", "--space-64"),
	"3xl": clampFluid("--space-48", "--space-96"),
	"4xl": clampFluid("--space-64", "--space-128"),
} as const;

/**
 * Fluid size presets — parameterized responsive container/element sizing.
 * Inputs reference DTCG SizeToken values via CSS custom properties.
 */
export const FLUID_SIZE = {
	icon: clampFluid("--size-2xs", "--size-xs"),
	button: clampFluid("--size-sm", "--size-lg"),
	panel: clampFluid("--size-container-xs", "--size-container-md"),
	section: clampFluid("--size-container-sm", "--size-container-lg"),
	page: clampFluid("--size-container-md", "--size-container-2xl"),
} as const;

/**
 * Fluid padding presets — responsive component padding.
 * Inputs reference DTCG PaddingToken values via CSS custom properties.
 */
export const FLUID_PADDING = {
	"compact-y": clampFluid("--padding-xs-y", "--padding-sm-y"),
	"compact-x": clampFluid("--padding-xs-x", "--padding-sm-x"),
	"standard-y": clampFluid("--padding-sm-y", "--padding-md-y"),
	"standard-x": clampFluid("--padding-sm-x", "--padding-md-x"),
	"spacious-y": clampFluid("--padding-md-y", "--padding-lg-y"),
	"spacious-x": clampFluid("--padding-md-x", "--padding-lg-x"),
	"hero-y": clampFluid("--padding-lg-y", "--padding-2xl-y"),
	"hero-x": clampFluid("--padding-lg-x", "--padding-2xl-x"),
} as const;

/** Fluid space preset keys. */
export type FluidSpace = keyof typeof FLUID_SPACE;
/** Fluid size preset keys. */
export type FluidSize = keyof typeof FLUID_SIZE;
/** Fluid padding preset keys. */
export type FluidPadding = keyof typeof FLUID_PADDING;
