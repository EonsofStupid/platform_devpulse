/**
 * @file Separator Recipe
 * @kind separator
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { SeparatorOrientation, SeparatorVariant } from "./types.js";

const base = [
	"shrink-0 border-border-subtle",
].join(" ");

const orientationStyles: Record<SeparatorOrientation, string> = {
	horizontal: "w-full border-t h-0",
	vertical: "h-full border-l w-0 self-stretch",
};

const variantStyles: Record<SeparatorVariant, string> = {
	solid: "border-solid",
	dashed: "border-dashed",
	dotted: "border-dotted",
};

export function separatorRecipe(opts: { orientation: SeparatorOrientation; variant: SeparatorVariant }): string {
	return `${base} ${orientationStyles[opts.orientation]} ${variantStyles[opts.variant]}`;
}
