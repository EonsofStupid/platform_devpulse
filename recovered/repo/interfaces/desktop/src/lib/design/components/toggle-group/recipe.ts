/**
 * @file Toggle Group Recipe
 * @kind toggle-group
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 */

import type { ToggleGroupSize, ToggleGroupOrientation } from "./types.js";

const base = [
	"inline-flex",
	"rounded-md border",
	"bg-surface-muted",
	"border-border-subtle",
	"data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
].join(" ");

const itemBase = [
	"inline-flex items-center justify-center",
	"font-medium text-text-secondary",
	"transition-colors duration-fast",
	"hover:text-text-primary hover:bg-surface-elevated",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:z-10",
	"aria-disabled:pointer-events-none aria-disabled:opacity-40",
	"data-[state='on']:bg-surface-primary data-[state='on']:text-text-primary data-[state='on']:shadow-sm",
].join(" ");

const orientationStyles: Record<ToggleGroupOrientation, string> = {
	horizontal: "flex-row",
	vertical: "flex-col",
};

const sizeStyles: Record<ToggleGroupSize, string> = {
	sm: "gap-px p-0.5",
	md: "gap-px p-0.5",
	lg: "gap-px p-1",
};

const itemSizeStyles: Record<ToggleGroupSize, string> = {
	sm: "h-7 px-2.5 text-xs rounded-sm",
	md: "h-8 px-3 text-sm rounded-sm",
	lg: "h-10 px-4 text-base rounded",
};

export function toggleGroupRecipe(opts: { size: ToggleGroupSize; orientation: ToggleGroupOrientation }): string {
	return `${base} ${orientationStyles[opts.orientation]} ${sizeStyles[opts.size]}`;
}

export function toggleGroupItemRecipe(opts: { size: ToggleGroupSize }): string {
	return `${itemBase} ${itemSizeStyles[opts.size]}`;
}
