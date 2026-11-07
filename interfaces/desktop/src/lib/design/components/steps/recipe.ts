/**
 * @file Steps Recipe
 * @kind steps
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { StepsSize, StepsOrientation } from "./types.js";

const base = [
	"flex",
	"list-none",
].join(" ");

const sizeStyles: Record<StepsSize, string> = {
	sm: "gap-2 text-sm",
	md: "gap-4 text-base",
	lg: "gap-6 text-lg",
};

const orientationStyles: Record<StepsOrientation, string> = {
	horizontal: "flex-row items-center",
	vertical: "flex-col items-start",
};

export function stepsRecipe(opts: {
	size: StepsSize;
	orientation?: StepsOrientation;
}): string {
	return `${base} ${sizeStyles[opts.size]} ${orientationStyles[opts.orientation ?? "horizontal"]}`;
}
