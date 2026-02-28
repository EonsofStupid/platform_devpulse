/**
 * @file DatePicker Recipe
 * @kind date-picker
 * @layer components
 *
 * SD5-driven styling for the date-picker compound component.
 * Returns class strings for all slots with size variants.
 */

import type { Size } from "./types.js";

// =============================================================================
// BASE STYLES
// =============================================================================

const rootBase = [
	"relative inline-flex flex-col",
].join(" ");

const fieldBase = [
	"inline-flex items-center gap-0.5",
	"border border-white/8 rounded-lg rounded-r-none",
	"bg-white/[0.03] text-white/90",
	"focus-within:ring-2 focus-within:ring-border-focus",
].join(" ");

const triggerBase = [
	"inline-flex items-center justify-center",
	"border border-white/8 border-l-0 rounded-lg rounded-l-none",
	"bg-white/[0.03] text-white/60",
	"hover:bg-white/[0.06] hover:text-white/90 transition-colors",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
	"disabled:opacity-40 disabled:pointer-events-none",
].join(" ");

const contentBase = [
	"absolute z-50 mt-1",
	"border border-white/8 rounded-lg",
	"bg-surface-glass-void p-1 shadow-lg",
	"data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
	"data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
].join(" ");

const calendarBase = [
	"p-2",
].join(" ");

// =============================================================================
// SIZE VARIANTS
// =============================================================================

const rootSizeStyles: Record<Size, string> = {
	sm: "text-xs",
	md: "text-sm",
	lg: "text-base",
};

const fieldSizeStyles: Record<Size, string> = {
	sm: "h-8 px-2",
	md: "h-10 px-3",
	lg: "h-12 px-4",
};

const triggerSizeStyles: Record<Size, string> = {
	sm: "h-8 w-8",
	md: "h-10 w-10",
	lg: "h-12 w-12",
};

// =============================================================================
// RECIPE FUNCTION
// =============================================================================

export function datePickerRecipe(opts: { size: Size }): {
	root: string;
	field: string;
	trigger: string;
	content: string;
	calendar: string;
} {
	return {
		root: `${rootBase} ${rootSizeStyles[opts.size]}`,
		field: `${fieldBase} ${fieldSizeStyles[opts.size]}`,
		trigger: `${triggerBase} ${triggerSizeStyles[opts.size]}`,
		content: contentBase,
		calendar: calendarBase,
	};
}
