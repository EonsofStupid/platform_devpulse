/**
 * @file Breadcrumb Recipe
 * @kind breadcrumb
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { BreadcrumbSize } from "./types.js";

const base = [
	"flex items-center",
	"text-text-secondary",
].join(" ");

const sizeStyles: Record<BreadcrumbSize, string> = {
	sm: "gap-1 text-sm",
	md: "gap-1.5 text-base",
	lg: "gap-2 text-lg",
};

export function breadcrumbRecipe(opts: { size: BreadcrumbSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}
