/**
 * @file Sidebar Recipe
 * @kind sidebar
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { SidebarSize } from "./types.js";

const base = [
	"flex flex-col",
	"bg-surface-primary border-r border-border-subtle",
	"transition-[width] duration-300 ease-in-out",
	"overflow-hidden",
	"h-full",
].join(" ");

const sizeStyles: Record<SidebarSize, string> = {
	sm: "w-56",
	md: "w-64",
	lg: "w-80",
};

const collapsedWidth = "w-16";

export function sidebarRecipe(opts: {
	size: SidebarSize;
	expanded: boolean;
}): string {
	const width = opts.expanded ? sizeStyles[opts.size] : collapsedWidth;
	return `${base} ${width}`;
}
