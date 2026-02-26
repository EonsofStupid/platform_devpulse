/**
 * @file NavItem Recipe
 * @kind nav-item
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { NavItemSize } from "./types.js";

const base = [
	"inline-flex items-center gap-2",
	"rounded-md font-medium",
	"transition-colors duration-fast",
	"text-text-secondary",
	"hover:text-text-primary hover:bg-surface-elevated",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
	"data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
	"data-[active]:text-text-primary data-[active]:bg-surface-muted",
].join(" ");

const sizeStyles: Record<NavItemSize, string> = {
	sm: "h-8 px-3 text-sm",
	md: "h-10 px-4 text-base",
	lg: "h-12 px-6 text-lg",
};

export function navItemRecipe(opts: { size: NavItemSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}
