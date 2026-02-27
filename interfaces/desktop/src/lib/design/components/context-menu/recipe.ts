/**
 * @file Context Menu Recipe
 * @kind context-menu
 * @layer components
 *
 * SD5-driven styling for the context-menu compound component.
 * Returns per-slot class strings with size variants.
 */

import type { ContextMenuSize } from "./types.js";

// =============================================================================
// TRIGGER (right-click zone)
// =============================================================================

const triggerBase = "relative";

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

const contentSizeStyles: Record<ContextMenuSize, string> = {
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
// RECIPE EXPORT
// =============================================================================

export function contextMenuRecipe(opts?: { size?: ContextMenuSize }): {
	trigger: string;
	content: string;
	item: string;
	separator: string;
} {
	const size = opts?.size ?? "md";
	return {
		trigger: triggerBase,
		content: `${contentBase} ${contentSizeStyles[size]}`,
		item: itemBase,
		separator: separatorBase,
	};
}
