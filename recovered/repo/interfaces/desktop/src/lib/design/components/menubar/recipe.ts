/**
 * @file Menubar Recipe
 * @kind menubar
 * @layer components
 *
 * SD5-driven styling for the menubar compound component.
 * Returns per-slot class strings with size variants.
 */

import type { MenubarSize } from "./types.js";

// =============================================================================
// ROOT (menubar container)
// =============================================================================

const rootBase = [
	"inline-flex items-center gap-1",
	"border border-white/8 rounded-lg",
	"bg-white/[0.02] p-1",
].join(" ");

// =============================================================================
// TRIGGER (menubar item button)
// =============================================================================

const triggerBase = [
	"inline-flex items-center justify-center",
	"rounded-md px-3 py-1.5 text-sm font-medium",
	"text-white/80 transition-colors",
	"hover:bg-white/[0.06] hover:text-white/90",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
	"data-[state=open]:bg-white/[0.08] data-[state=open]:text-white",
].join(" ");

// =============================================================================
// CONTENT (dropdown menu)
// =============================================================================

const contentBase = [
	"z-50 overflow-hidden",
	"border border-white/8 rounded-lg",
	"bg-surface-glass-void p-1",
	"shadow-lg shadow-black/20",
	"data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
	"data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
].join(" ");

const contentSizeStyles: Record<MenubarSize, string> = {
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

export function menubarRecipe(opts?: { size?: MenubarSize }): {
	root: string;
	trigger: string;
	content: string;
	item: string;
	separator: string;
} {
	const size = opts?.size ?? "md";
	return {
		root: rootBase,
		trigger: triggerBase,
		content: `${contentBase} ${contentSizeStyles[size]}`,
		item: itemBase,
		separator: separatorBase,
	};
}
