/**
 * @file Navigation Menu Recipe
 * @kind navigation-menu
 * @layer components
 *
 * SD5-driven styling for the navigation-menu compound component.
 * Returns per-slot class strings with size variants.
 *
 * ColdLight-owned — semantic HTML elements with Tailwind styling.
 */

import type { NavigationMenuSize } from "./types.js";

// =============================================================================
// ROOT (nav element)
// =============================================================================

const rootBase = "relative";

// =============================================================================
// LIST (ul)
// =============================================================================

const listBase = [
	"flex items-center gap-1",
	"list-none m-0 p-0",
].join(" ");

// =============================================================================
// ITEM (li)
// =============================================================================

const itemBase = "relative";

// =============================================================================
// TRIGGER (button)
// =============================================================================

const triggerBase = [
	"inline-flex items-center gap-1",
	"rounded-md px-3 py-2 text-sm font-medium",
	"text-white/80 transition-colors",
	"hover:bg-white/[0.06] hover:text-white/90",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
	"data-[state=open]:bg-white/[0.08] data-[state=open]:text-white",
].join(" ");

// =============================================================================
// CONTENT (sub-menu container)
// =============================================================================

const contentBase = [
	"absolute left-0 top-full z-50 mt-1",
	"overflow-hidden",
	"border border-white/8 rounded-lg",
	"bg-surface-glass-void p-2",
	"shadow-lg shadow-black/20",
	"data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2",
	"data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2",
].join(" ");

const contentSizeStyles: Record<NavigationMenuSize, string> = {
	sm: "min-w-[12rem]",
	md: "min-w-[16rem]",
	lg: "min-w-[24rem]",
};

// =============================================================================
// LINK
// =============================================================================

const linkBase = [
	"block rounded-md px-3 py-2 text-sm",
	"text-white/80 no-underline transition-colors",
	"hover:bg-white/[0.06] hover:text-white/90",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
	"data-[state=active]:text-teal-300 data-[state=active]:bg-teal-500/10",
].join(" ");

// =============================================================================
// RECIPE EXPORT
// =============================================================================

export function navigationMenuRecipe(opts?: { size?: NavigationMenuSize }): {
	root: string;
	list: string;
	item: string;
	trigger: string;
	content: string;
	link: string;
} {
	const size = opts?.size ?? "md";
	return {
		root: rootBase,
		list: listBase,
		item: itemBase,
		trigger: triggerBase,
		content: `${contentBase} ${contentSizeStyles[size]}`,
		link: linkBase,
	};
}
