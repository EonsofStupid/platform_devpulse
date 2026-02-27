/**
 * @file Dropdown Menu Recipe
 * @kind dropdown-menu
 * @layer components
 *
 * SD5-driven styling for the dropdown-menu compound component.
 * Returns per-slot class strings with size variants.
 */

import type { DropdownMenuSize } from "./types.js";

// =============================================================================
// TRIGGER
// =============================================================================

const triggerBase = [
	"inline-flex items-center justify-center",
	"rounded-md text-sm font-medium",
	"border border-white/8",
	"bg-white/[0.03] text-white/90",
	"hover:bg-white/[0.06] transition-colors",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
].join(" ");

// =============================================================================
// CONTENT
// =============================================================================

const contentBase = [
	"z-50 overflow-hidden",
	"border border-white/8 rounded-lg",
	"bg-surface-glass-void p-1",
	"shadow-lg shadow-black/20",
	"data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
	"data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
].join(" ");

const contentSizeStyles: Record<DropdownMenuSize, string> = {
	sm: "min-w-[8rem]",
	md: "min-w-[12rem]",
	lg: "min-w-[16rem]",
};

// =============================================================================
// ITEM
// =============================================================================

const itemBase = [
	"relative flex w-full cursor-pointer select-none items-center",
	"rounded-md px-2 py-1.5 text-sm text-white/80",
	"outline-none transition-colors",
	"data-[state=highlighted]:bg-white/10 data-[state=highlighted]:text-white",
	"data-[state=disabled]:pointer-events-none data-[state=disabled]:opacity-50",
].join(" ");

// =============================================================================
// SEPARATOR
// =============================================================================

const separatorBase = "-mx-1 my-1 h-px bg-white/8";

// =============================================================================
// GROUP
// =============================================================================

const groupBase = "overflow-hidden";

// =============================================================================
// LABEL
// =============================================================================

const labelBase = "px-2 py-1.5 text-xs font-semibold text-white/50";

// =============================================================================
// RECIPE EXPORT
// =============================================================================

export function dropdownMenuRecipe(opts?: { size?: DropdownMenuSize }): {
	trigger: string;
	content: string;
	item: string;
	separator: string;
	group: string;
	label: string;
} {
	const size = opts?.size ?? "md";
	return {
		trigger: triggerBase,
		content: `${contentBase} ${contentSizeStyles[size]}`,
		item: itemBase,
		separator: separatorBase,
		group: groupBase,
		label: labelBase,
	};
}
