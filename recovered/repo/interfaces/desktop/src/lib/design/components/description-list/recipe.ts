/**
 * @file DescriptionList Recipe
 * @kind description-list
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { DescriptionListSize, DescriptionListVariant } from "./types.js";

const base = [
	"text-text-primary",
].join(" ");

const variantStyles: Record<DescriptionListVariant, string> = {
	default: [
		"[&_dt]:font-semibold [&_dt]:text-text-primary",
		"[&_dd]:text-text-secondary [&_dd]:ml-0",
	].join(" "),
	inline: [
		"[&_dt]:font-semibold [&_dt]:text-text-primary [&_dt]:inline",
		"[&_dd]:text-text-secondary [&_dd]:inline [&_dd]:ml-1",
	].join(" "),
	grid: [
		"grid grid-cols-[auto_1fr] gap-x-4",
		"[&_dt]:font-semibold [&_dt]:text-text-primary",
		"[&_dd]:text-text-secondary [&_dd]:ml-0",
	].join(" "),
};

const sizeStyles: Record<DescriptionListSize, string> = {
	sm: "text-sm [&_dt]:py-1 [&_dd]:py-1",
	md: "text-base [&_dt]:py-1.5 [&_dd]:py-1.5",
	lg: "text-lg [&_dt]:py-2 [&_dd]:py-2",
};

export function descriptionListRecipe(opts: { size: DescriptionListSize; variant: DescriptionListVariant }): string {
	return `${base} ${variantStyles[opts.variant]} ${sizeStyles[opts.size]}`;
}
