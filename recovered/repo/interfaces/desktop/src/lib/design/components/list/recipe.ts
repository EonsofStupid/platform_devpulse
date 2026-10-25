/**
 * @file List Recipe
 * @kind list
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { ListSize, ListVariant, ListSpacing } from "./types.js";

const base = [
	"text-text-primary",
].join(" ");

const variantStyles: Record<ListVariant, string> = {
	none: "list-none",
	disc: "list-disc pl-5",
	decimal: "list-decimal pl-5",
};

const sizeStyles: Record<ListSize, string> = {
	sm: "text-sm",
	md: "text-base",
	lg: "text-lg",
};

const spacingStyles: Record<ListSpacing, string> = {
	compact: "[&>li]:py-0.5",
	default: "[&>li]:py-1",
	relaxed: "[&>li]:py-2",
};

export function listRecipe(opts: { size: ListSize; variant: ListVariant; spacing: ListSpacing }): string {
	return `${base} ${variantStyles[opts.variant]} ${sizeStyles[opts.size]} ${spacingStyles[opts.spacing]}`;
}
