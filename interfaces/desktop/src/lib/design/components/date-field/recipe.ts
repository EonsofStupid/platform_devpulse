/**
 * @file DateField Recipe
 * @kind date-field
 * @layer components
 *
 * SD5-driven styling for the date-field compound component.
 * Returns class strings for root and segment slots with size variants.
 */

import type { Size } from "./types.js";

// =============================================================================
// BASE STYLES
// =============================================================================

const rootBase = [
	"inline-flex items-center gap-0.5",
	"border border-white/8 rounded-lg",
	"bg-white/[0.03] text-white/90",
	"focus-within:ring-2 focus-within:ring-border-focus",
	"data-[state=disabled]:opacity-40 data-[state=disabled]:pointer-events-none",
].join(" ");

const segmentBase = [
	"inline-flex items-center justify-center",
	"rounded px-0.5 tabular-nums",
	"text-white/90 outline-none",
	"data-[placeholder]:text-white/40",
	"focus:bg-teal-500/20 focus:text-teal-200",
	"data-[state=disabled]:opacity-40",
].join(" ");

const literalBase = [
	"inline-flex items-center",
	"text-white/40 select-none",
].join(" ");

// =============================================================================
// SIZE VARIANTS
// =============================================================================

const rootSizeStyles: Record<Size, string> = {
	sm: "h-8 px-2 text-xs",
	md: "h-10 px-3 text-sm",
	lg: "h-12 px-4 text-base",
};

const segmentSizeStyles: Record<Size, string> = {
	sm: "min-w-[1.5ch] text-xs",
	md: "min-w-[2ch] text-sm",
	lg: "min-w-[2.5ch] text-base",
};

// =============================================================================
// RECIPE FUNCTION
// =============================================================================

export function dateFieldRecipe(opts: { size: Size }): {
	root: string;
	segment: string;
	literal: string;
} {
	return {
		root: `${rootBase} ${rootSizeStyles[opts.size]}`,
		segment: `${segmentBase} ${segmentSizeStyles[opts.size]}`,
		literal: literalBase,
	};
}
