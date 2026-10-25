/**
 * @file TableOfContents Recipe
 * @kind table-of-contents
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { TableOfContentsSize } from "./types.js";

const base = [
	"flex flex-col",
	"text-text-secondary",
	"border-l border-border-subtle",
].join(" ");

const sizeStyles: Record<TableOfContentsSize, string> = {
	sm: "gap-0.5 pl-3 text-xs",
	md: "gap-1 pl-4 text-sm",
	lg: "gap-1.5 pl-5 text-base",
};

export function tableOfContentsRecipe(opts: { size: TableOfContentsSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}
