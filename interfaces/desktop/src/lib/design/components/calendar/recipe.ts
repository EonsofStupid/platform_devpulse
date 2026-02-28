/**
 * @file Calendar Recipe
 * @kind calendar
 * @layer components
 *
 * SD5-driven styling for the calendar compound component.
 * Returns class strings for each slot with size variants.
 */

import type { Size } from "./types.js";

// =============================================================================
// BASE STYLES
// =============================================================================

const rootBase = [
	"inline-flex flex-col gap-2",
	"border border-white/8 rounded-lg",
	"bg-white/[0.03] text-white/90",
].join(" ");

const headerBase = [
	"flex items-center justify-between",
	"px-1",
].join(" ");

const headingBase = [
	"text-sm font-medium text-white/90",
	"select-none",
].join(" ");

const navButtonBase = [
	"inline-flex items-center justify-center",
	"rounded-md border border-transparent",
	"text-white/60 hover:text-white/90",
	"hover:bg-white/[0.06] transition-colors",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
	"disabled:opacity-40 disabled:pointer-events-none",
].join(" ");

const gridBase = [
	"w-full border-collapse",
].join(" ");

const headCellBase = [
	"text-center text-xs font-medium text-white/50",
	"select-none",
].join(" ");

const cellBase = [
	"relative inline-flex items-center justify-center",
	"rounded-md text-sm font-normal",
	"text-white/80 transition-colors cursor-pointer select-none",
	"hover:bg-white/[0.08]",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
	"data-[state=selected]:bg-teal-500/20 data-[state=selected]:text-teal-300",
	"data-[state=today]:border data-[state=today]:border-white/20",
	"data-[state=disabled]:opacity-40 data-[state=disabled]:pointer-events-none",
	"data-[state=outside-month]:text-white/25 data-[state=outside-month]:pointer-events-none",
].join(" ");

// =============================================================================
// SIZE VARIANTS
// =============================================================================

const rootSizeStyles: Record<Size, string> = {
	sm: "p-2 text-xs",
	md: "p-3 text-sm",
	lg: "p-4 text-base",
};

const cellSizeStyles: Record<Size, string> = {
	sm: "h-7 w-7 text-xs",
	md: "h-9 w-9 text-sm",
	lg: "h-11 w-11 text-base",
};

const navButtonSizeStyles: Record<Size, string> = {
	sm: "h-6 w-6",
	md: "h-8 w-8",
	lg: "h-10 w-10",
};

const headCellSizeStyles: Record<Size, string> = {
	sm: "pb-1",
	md: "pb-2",
	lg: "pb-3",
};

// =============================================================================
// RECIPE FUNCTION
// =============================================================================

export function calendarRecipe(opts: { size: Size }): {
	root: string;
	header: string;
	heading: string;
	navButton: string;
	grid: string;
	headCell: string;
	cell: string;
} {
	return {
		root: `${rootBase} ${rootSizeStyles[opts.size]}`,
		header: headerBase,
		heading: headingBase,
		navButton: `${navButtonBase} ${navButtonSizeStyles[opts.size]}`,
		grid: gridBase,
		headCell: `${headCellBase} ${headCellSizeStyles[opts.size]}`,
		cell: `${cellBase} ${cellSizeStyles[opts.size]}`,
	};
}
