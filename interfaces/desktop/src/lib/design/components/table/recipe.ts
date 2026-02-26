/**
 * @file Table Recipe
 * @kind table
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { TableSize, TableVariant } from "./types.js";

const base = [
	"w-full caption-bottom",
	"text-text-primary",
	"border-collapse",
].join(" ");

const variantStyles: Record<TableVariant, string> = {
	default: "border-border-subtle",
	striped: [
		"border-border-subtle",
		"[&_tbody_tr:nth-child(even)]:bg-surface-muted/50",
	].join(" "),
	bordered: [
		"border border-border-subtle",
		"[&_th]:border [&_th]:border-border-subtle",
		"[&_td]:border [&_td]:border-border-subtle",
	].join(" "),
};

const sizeStyles: Record<TableSize, string> = {
	sm: "[&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 text-sm",
	md: "[&_th]:px-4 [&_th]:py-2 [&_td]:px-4 [&_td]:py-2 text-base",
	lg: "[&_th]:px-6 [&_th]:py-3 [&_td]:px-6 [&_td]:py-3 text-lg",
};

export function tableRecipe(opts: { size: TableSize; variant: TableVariant }): string {
	return `${base} ${variantStyles[opts.variant]} ${sizeStyles[opts.size]}`;
}
