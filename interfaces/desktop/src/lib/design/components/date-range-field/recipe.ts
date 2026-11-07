/**
 * @file DateRangeField Recipe
 * @kind date-range-field
 * @layer components
 *
 * SD5-driven styling for the date-range-field compound component.
 * Returns class strings for all slots with size variants.
 */

import type { Size } from "./types.js";

// =============================================================================
// BASE STYLES
// =============================================================================

const rootBase = [
	"inline-flex items-center",
	"border border-white/8 rounded-lg",
	"bg-white/[0.03] text-white/90",
	"focus-within:ring-2 focus-within:ring-border-focus",
	"data-[state=disabled]:opacity-40 data-[state=disabled]:pointer-events-none",
].join(" ");

const fieldBase = [
	"inline-flex items-center gap-0.5",
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

const separatorBase = [
	"inline-flex items-center justify-center",
	"text-white/40 select-none",
].join(" ");

// =============================================================================
// SIZE VARIANTS
// =============================================================================

const rootSizeStyles: Record<Size, string> = {
	sm: "h-8 px-2 text-xs gap-1",
	md: "h-10 px-3 text-sm gap-2",
	lg: "h-12 px-4 text-base gap-3",
};

const segmentSizeStyles: Record<Size, string> = {
	sm: "min-w-[1.5ch] text-xs",
	md: "min-w-[2ch] text-sm",
	lg: "min-w-[2.5ch] text-base",
};

const separatorSizeStyles: Record<Size, string> = {
	sm: "px-0.5 text-xs",
	md: "px-1 text-sm",
	lg: "px-1.5 text-base",
};

// =============================================================================
// RECIPE FUNCTION
// =============================================================================

export function dateRangeFieldRecipe(opts: { size: Size }): {
	root: string;
	field: string;
	segment: string;
	literal: string;
	separator: string;
} {
	return {
		root: `${rootBase} ${rootSizeStyles[opts.size]}`,
		field: fieldBase,
		segment: `${segmentBase} ${segmentSizeStyles[opts.size]}`,
		literal: literalBase,
		separator: `${separatorBase} ${separatorSizeStyles[opts.size]}`,
	};
}
