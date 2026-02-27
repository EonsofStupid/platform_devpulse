/**
 * @file Toggle Recipe
 * @kind toggle
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { ToggleSize } from "./types.js";

const base = [
	"inline-flex items-center justify-center",
	"rounded-md border border-border-subtle",
	"transition-colors duration-fast",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
	"disabled:pointer-events-none disabled:opacity-50",
	"bg-transparent text-text-secondary",
	"hover:bg-surface-elevated hover:text-text-primary",
	"data-[state=on]:bg-surface-primary data-[state=on]:text-text-primary",
].join(" ");

const sizeStyles: Record<ToggleSize, string> = {
	sm: "h-8 w-8 text-sm",
	md: "h-10 w-10 text-base",
	lg: "h-12 w-12 text-lg",
};

export function toggleRecipe(opts: { size: ToggleSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}
