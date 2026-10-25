/**
 * @file DataTable Recipe
 * @kind data-table
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { DataTableSize, DataTableVariant } from "./types.js";

const base = [
	"w-full overflow-auto",
	"rounded-md border border-border-subtle",
	"text-text-primary",
].join(" ");

const variantStyles: Record<DataTableVariant, string> = {
	default: "bg-surface-primary",
	striped: [
		"bg-surface-primary",
		"[&_tbody_tr:nth-child(even)]:bg-surface-muted/50",
	].join(" "),
	bordered: [
		"bg-surface-primary",
		"[&_th]:border [&_th]:border-border-subtle",
		"[&_td]:border [&_td]:border-border-subtle",
	].join(" "),
};

const sizeStyles: Record<DataTableSize, string> = {
	sm: "[&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 text-sm",
	md: "[&_th]:px-4 [&_th]:py-2 [&_td]:px-4 [&_td]:py-2 text-base",
	lg: "[&_th]:px-6 [&_th]:py-3 [&_td]:px-6 [&_td]:py-3 text-lg",
};

export function dataTableRecipe(opts: { size: DataTableSize; variant: DataTableVariant }): string {
	return `${base} ${variantStyles[opts.variant]} ${sizeStyles[opts.size]}`;
}
